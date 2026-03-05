import React, { useState, useEffect } from "react";
import { connectWebSocket, sendMessageToChannel } from "../services/websocket";
import MessageInput from "../message-input";

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    connectWebSocket((msg) => {
      setMessages((prev) => [...prev, msg]);
    });
  }, []);

  const handleSend = (text) => {
    sendMessageToChannel("c1", { sender: "alice", content: text, type: "CHANNEL" });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className="mb-2">
            <span className="font-bold text-blue-600">{m.sender}: </span>
            <span>{m.content}</span>
          </div>
        ))}
      </div>
      <MessageInput onSend={handleSend} />
    </div>
  );
}
