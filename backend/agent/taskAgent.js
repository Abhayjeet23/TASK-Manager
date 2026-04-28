const { GoogleGenAI } = require('@google/genai');
const Task = require('../models/Task');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const taskDeclaration = {
    name: "create_task",
    description: "Create a new task in the user's task manager",
    parameters: {
        type: "OBJECT",
        properties: {
            title: { type: "STRING", description: "The title of the task" },
            description: { type: "STRING", description: "A detailed description of the task. If not provided, use an empty string." },
            priority: { type: "STRING", enum: ["low", "medium", "high"], description: "The priority of the task. Default to medium if not specified." },
            dueDate: { type: "STRING", description: "The due date in YYYY-MM-DD format, if the user mentions a specific date or time." },
            tags: { type: "ARRAY", items: { type: "STRING" }, description: "Categories or tags relevant to the task" }
        },
        required: ["title", "priority"]
    }
};

async function processChat(prompt, userId) {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are a helpful AI task manager assistant. Your job is to help users manage their tasks. If the user asks to create, log, or remember a task, use the create_task tool. Be concise and friendly.",
                tools: [{ functionDeclarations: [taskDeclaration] }]
            }
        });

        if (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];
            if (call.name === "create_task") {
                const args = call.args;
                
                // create the task in database
                const newTaskData = {
                    title: args.title,
                    description: args.description || "",
                    priority: args.priority || "medium",
                    owner: userId
                };
                
                if (args.dueDate) {
                    newTaskData.dueDate = new Date(args.dueDate);
                }
                
                if (args.tags && args.tags.length > 0) {
                    newTaskData.tags = args.tags;
                }

                const newTask = await Task.create(newTaskData);
                
                return `I have successfully created the task: **${newTask.title}** (Priority: ${newTask.priority}).`;
            }
        }
        
        return response.text;
    } catch (error) {
        console.error("AI Error:", error);
        throw new Error("Failed to process AI request");
    }
}

module.exports = { processChat };
