import React, { useState } from "react";

interface MessageInputProps {
  onSend: (text: string) => void;
}

export default function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text.trim());
      setText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex p-2 bg-white border-t">
      <input
        type="text"
        className="flex-1 border rounded px-2 py-1 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className={`px-4 py-1 rounded text-white ${
          text.trim()
            ? "bg-blue-500 hover:bg-blue-600"
            : "bg-gray-300 cursor-not-allowed"
        }`}
        aria-label="Send message"
      >
        Send
      </button>
    </form>
  );
}
