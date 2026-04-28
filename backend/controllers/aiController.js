const { processChat } = require('../agent/taskAgent');

exports.chatWithAgent = async (req, res, next) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ success: false, message: "Prompt is required" });
        }
        
        const responseText = await processChat(prompt, req.user.id);
        
        res.status(200).json({
            success: true,
            message: responseText
        });
    } catch (error) {
        next(error);
    }
};
