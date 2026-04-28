import { useState } from "react";

const AIAssistant = ({ onTaskCreated }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const authHeader = token ? `Bearer ${token}` : "";

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ prompt: userMessage.content }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "agent", content: data.message },
        ]);
        
        // If the AI message seems to indicate a task creation
        if (data.message.includes("successfully created")) {
            if (onTaskCreated) onTaskCreated();
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "agent", content: "Error: " + data.message },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: "Agent is currently offline." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-assistant">
      <div className="ai-header">
        <h3>✨ AI Task Agent</h3>
      </div>
      <div className="ai-messages">
        {messages.length === 0 && (
          <p className="ai-muted">Type "Create a high priority task..." </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`ai-message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && <div className="ai-message agent loading">Thinking...</div>}
      </div>
      <form onSubmit={handleSubmit} className="ai-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the AI agent..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
};

export default AIAssistant;
