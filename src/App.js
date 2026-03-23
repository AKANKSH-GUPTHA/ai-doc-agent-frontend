import { useState } from "react";
import axios from "axios";
import "./App.css";

const API = "https://ai-doc-agent-3dwi.onrender.com";

function App() {
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("ask"); // "ask" or "agent"

 const uploadFile = async () => {
    if (!file) return;
    setLoading(true);
    setMessages([{
      role: "system",
      text: "⏳ Waking up the server... this may take up to 60 seconds on first load!"
    }]);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API}/upload`, formData);
      setUploaded(true);
      setMessages([{
        role: "system",
        text: `✅ "${res.data.filename}" uploaded! ${res.data.total_chunks} chunks indexed. Ask me anything!`
      }]);
    } catch (e) {
      alert("Upload failed! Server may still be waking up, try again in 30 seconds.");
    }
    setLoading(false);
  };

  const askQuestion = async () => {
    if (!question.trim() || !uploaded) return;
    const userMsg = { role: "user", text: question };
    setMessages(prev => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);
    try {
      const endpoint = mode === "agent" ? "/agent" : "/ask";
      const param = mode === "agent" ? "query" : "question";
      const res = await axios.post(`${API}${endpoint}?${param}=${encodeURIComponent(question)}`);
      const answer = mode === "agent" ? res.data.answer : res.data.answer;
      setMessages(prev => [...prev, { role: "ai", text: answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "ai", text: "Error getting answer." }]);
    }
    setLoading(false);
  };

  return (
    <div className="app">
      <header>
        <h1>🤖 AI Document Intelligence Agent</h1>
        <p>Upload any PDF and ask questions using RAG + LLMs</p>
      </header>

      <div className="upload-section">
        <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} />
        <button onClick={uploadFile} disabled={!file || loading}>
          {loading && !uploaded ? "Uploading..." : "Upload PDF"}
        </button>
        {uploaded && <span className="badge">✅ Document Ready</span>}
      </div>

      <div className="mode-selector">
        <button className={mode === "ask" ? "active" : ""} onClick={() => setMode("ask")}>
          💬 RAG Mode
        </button>
        <button className={mode === "agent" ? "active" : ""} onClick={() => setMode("agent")}>
          🤖 Agent Mode
        </button>
      </div>

      <div className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <span className="label">{msg.role === "user" ? "You" : msg.role === "ai" ? "AI" : "System"}</span>
            <p>{msg.text}</p>
          </div>
        ))}
        {loading && uploaded && <div className="message ai"><p>⏳ Thinking...</p></div>}
      </div>

      <div className="input-section">
        <input
          type="text"
          placeholder={uploaded ? "Ask a question about your document..." : "Upload a PDF first"}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && askQuestion()}
          disabled={!uploaded || loading}
        />
        <button onClick={askQuestion} disabled={!uploaded || loading || !question.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;