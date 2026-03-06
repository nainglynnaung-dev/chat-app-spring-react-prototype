import { useState, useEffect, useRef } from "react";
import {
  connectWebSocket,
  subscribeToTopic,
  sendMessageToChannel,
  sendMessageToGroup,
  sendMessageToUser,
  disconnectWebSocket,
} from "../services/websocket";
import MessageInput from "../message-input";

interface ChatMessage {
  sender: string;
  content: string;
  type?: string;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [username, setUsername] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [destType, setDestType] = useState("CHANNEL"); // CHANNEL, GROUP, USER
  const [destName, setDestName] = useState("");
  const [currentTopic, setCurrentTopic] = useState("");

  const activeSubRef = useRef<any>(null);

  useEffect(() => {
    const randomUser = `User_${Math.floor(Math.random() * 10000)}`;
    setUsername(randomUser);

    connectWebSocket(
      randomUser,
      "",
      () => {
        setIsLoggedIn(true);
      },
      (error: any) => {
        console.error(error);
      },
      (msg: any) => {
        // Direct messages received by this user
        setMessages((prev) => [...prev, { ...msg, type: "USER (Direct)" }]);
      }
    );

    return () => {
      disconnectWebSocket();
    };
  }, []);

  const handleSubscribe = () => {
    if (activeSubRef.current) {
      activeSubRef.current.unsubscribe();
      activeSubRef.current = null;
    }

    if (!destName) return;

    let topic = "";
    if (destType === "CHANNEL") {
      topic = `/topic/${destName}`;
    } else if (destType === "GROUP") {
      topic = `/queue/group/${destName}`;
    } else {
      // For USER, we just send messages. We are already listening for our own DMs from connectWebSocket.
      setCurrentTopic(`User: ${destName}`);
      return;
    }

    setCurrentTopic(`${destType}: ${destName}`);
    activeSubRef.current = subscribeToTopic(topic, (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    });
  };

  const handleSend = (text: string) => {
    if (!destName) {
      alert("Please specify a destination and click 'Join / Subscribe' first.");
      return;
    }

    const msg = { sender: username, content: text, type: destType };

    if (destType === "CHANNEL") {
      sendMessageToChannel(destName, msg);
    } else if (destType === "GROUP") {
      sendMessageToGroup(destName, msg);
    } else if (destType === "USER") {
      sendMessageToUser(destName, msg);
      // Optimistically add direct messages to our own view 
      setMessages((prev) => [...prev, { ...msg, type: `To USER ${destName}` }]);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500">
        Connecting...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
        <div className="text-lg font-bold">Logged in as: <span className="font-normal">{username}</span></div>
        <button onClick={() => { disconnectWebSocket(); window.location.reload(); }} className="text-sm underline hover:text-blue-200">
          Disconnect & Reload
        </button>
      </div>

      {/* Subscription Panel */}
      <div className="bg-white p-4 flex gap-4 items-end border-b shadow-sm">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600 mb-1">Send Type</label>
          <select
            value={destType}
            onChange={(e) => setDestType(e.target.value)}
            className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CHANNEL">Channel (Public)</option>
            <option value="GROUP">Group (Private)</option>
            <option value="USER">User (End-to-End)</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600 mb-1">Destination Name/ID</label>
          <input
            type="text"
            value={destName}
            onChange={(e) => setDestName(e.target.value)}
            placeholder="e.g. c1, group1, bob"
            className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleSubscribe}
          className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition"
        >
          {destType === 'USER' ? 'Set Target User' : 'Join / Subscribe'}
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 flex flex-col min-h-0">
        <div className="mb-2 text-sm text-gray-500 font-medium pb-2 border-b">
          Active Chat: <span className="text-blue-600">{currentTopic || "None"}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 p-2">
          {messages.length === 0 ? (
             <div className="text-gray-400 text-center mt-10 italic">No messages yet.</div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.sender === username ? "items-end" : "items-start"}`}>
                <div className="flex items-baseline space-x-2">
                  <span className="font-bold text-sm text-gray-700">{m.sender}</span>
                  {m.type && <span className="text-xs text-gray-400">({m.type})</span>}
                </div>
                <div className={`mt-1 px-4 py-2 rounded-lg max-w-md ${m.sender === username ? "bg-blue-500 text-white" : "bg-white border text-gray-800 shadow-sm"}`}>
                  {m.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <MessageInput onSend={handleSend} />
    </div>
  );
}
