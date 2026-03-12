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
  receiver?: string;
  content: string;
  type?: string;
  timestamp: string;
  sticker?: string;
  replyContent?: string;
  replySender?: string;
}

interface ChatTarget {
  id: string;
  name: string;
  type: "CHANNEL" | "GROUP" | "USER";
}

export default function ChatWindow() {
  const [history, setHistory] = useState<Record<string, ChatMessage[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [username, setUsername] = useState(() => localStorage.getItem("skyline_last_user") || "");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("skyline_session_active") === "true");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [channels, setChannels] = useState<ChatTarget[]>([{ id: "general", name: "General", type: "CHANNEL" }]);
  const [groups, setGroups] = useState<ChatTarget[]>([{ id: "dev-team", name: "Dev Team", type: "GROUP" }]);
  const [dmUsers, setDmUsers] = useState<ChatTarget[]>([]);
  
  const [activeTarget, setActiveTarget] = useState<ChatTarget | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const activeTargetRef = useRef<ChatTarget | null>(null);
  const subscriptionsRef = useRef<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. DATA LOADING (Identity-based)
  useEffect(() => {
    if (isLoggedIn && username) {
      const get = (key: string, def: any) => {
        const val = localStorage.getItem(`skyline_v1_${username}_${key}`);
        return val ? JSON.parse(val) : def;
      };
      
      setHistory(get("history", {}));
      setUnreadCounts(get("unread", {}));
      setChannels(get("channels", [{ id: "general", name: "General", type: "CHANNEL" }]));
      setGroups(get("groups", [{ id: "dev-team", name: "Dev Team", type: "GROUP" }]));
      setDmUsers(get("dmUsers", []));
      
      // Auto-reconnect if session is supposed to be active
      if (!isConnected && !isConnecting) {
        handleConnect();
      }
    }
  }, [isLoggedIn]); // Only run when login status changes

  // 2. PERSISTENCE (Identity-based)
  useEffect(() => {
    if (isLoggedIn && username) {
      const save = (key: string, data: any) => localStorage.setItem(`skyline_v1_${username}_${key}`, JSON.stringify(data));
      save("history", history);
      save("unread", unreadCounts);
      save("channels", channels);
      save("groups", groups);
      save("dmUsers", dmUsers);
      localStorage.setItem("skyline_last_user", username);
      localStorage.setItem("skyline_session_active", "true");
    }
  }, [history, unreadCounts, channels, groups, dmUsers, isLoggedIn, username]);

  const addMessageToHistory = (targetId: string, msg: any) => {
    const time = msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedMsg = { ...msg, timestamp: time };
    
    setHistory(prev => {
      const messages = prev[targetId] || [];
      return { ...prev, [targetId]: [...messages, formattedMsg] };
    });

    // Notification Logic
    if (activeTargetRef.current?.id !== targetId && msg.sender !== username) {
      setUnreadCounts(prev => ({
        ...prev,
        [targetId]: (prev[targetId] || 0) + 1
      }));
    }
  };

  const subscribeToTarget = (target: ChatTarget) => {
    if (!isConnected || subscriptionsRef.current[target.id]) return;

    let topic = "";
    if (target.type === "CHANNEL") topic = `/topic/${target.id}`;
    else if (target.type === "GROUP") topic = `/queue/group/${target.id}`;
    
    if (topic) {
      const sub = subscribeToTopic(topic, (msg: any) => {
        addMessageToHistory(target.id, msg);
      });
      if (sub) {
        subscriptionsRef.current[target.id] = sub;
        console.log(`📡 Subscribed to ${topic}`);
      }
    }
  };

  // Automatically subscribe to all targets when connection is established or list changes
  useEffect(() => {
    if (isConnected) {
        channels.forEach(subscribeToTarget);
        groups.forEach(subscribeToTarget);
        dmUsers.forEach(subscribeToTarget);
    }
  }, [isConnected, channels, groups, dmUsers]);

  useEffect(() => {
    if (!isConnected) {
        subscriptionsRef.current = {};
    }
  }, [isConnected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, activeTarget]);

  const handleConnect = () => {
    if (!username) return;
    setIsConnecting(true);
    connectWebSocket(
      username,
      password,
      () => {
        setIsLoggedIn(true);
        setIsConnected(true);
        setIsConnecting(false);
        // By default, select general channel
        selectTarget({ id: "general", name: "General", type: "CHANNEL" });
      },
      (err) => {
        console.error(err);
        setIsConnecting(false);
        setIsConnected(false);
        alert("Failed to connect to backend bridge.");
      },
      (msg: any) => {
        console.log("📨 Received globally:", msg);
        // GLOBAL LISTENER FOR PRIVATE (USER) MESSAGES
        if (msg.type === "USER") {
            // Determine which chat box this should go into
            // If I am sender, it goes to receiver's box. If I am receiver, it goes to sender's box.
            const myId = username.toLowerCase();
            const senderId = msg.sender?.toLowerCase();
            const receiverId = msg.receiver?.toLowerCase();
            
            const targetBoxId = senderId === myId ? receiverId : senderId;
            
            console.log(`🎯 Routing private message to box: ${targetBoxId}`);
            
            if (targetBoxId) {
                addMessageToHistory(targetBoxId, msg);
                
                // Add to DM list if new
                setDmUsers(prev => {
                    if (prev.some(u => u.id.toLowerCase() === targetBoxId)) return prev;
                    return [...prev, { id: targetBoxId, name: targetBoxId, type: "USER" }];
                });
            }
        }
      }
    );
  };

  const selectTarget = (target: ChatTarget) => {
    setActiveTarget(target);
    activeTargetRef.current = target;
    
    // Clear unread counts for this target
    setUnreadCounts(prev => ({
      ...prev,
      [target.id]: 0
    }));

    // Ensure we are subscribed
    subscribeToTarget(target);
  };

  const handleSend = (text: string, stickerUrl?: string) => {
    if (!activeTarget || !isConnected) return;
    
    const msg: Partial<ChatMessage> = { 
        sender: username, 
        content: text, 
        type: activeTarget.type, 
        sticker: stickerUrl 
    };

    if (replyingTo) {
      msg.replyContent = replyingTo.sticker ? "[Sticker]" : replyingTo.content;
      msg.replySender = replyingTo.sender;
      setReplyingTo(null);
    }

    if (activeTarget.type === "CHANNEL") {
      sendMessageToChannel(activeTarget.id, msg);
    } else if (activeTarget.type === "GROUP") {
      sendMessageToGroup(activeTarget.id, msg);
    } else if (activeTarget.type === "USER") {
      msg.receiver = activeTarget.id;
      sendMessageToUser(activeTarget.id, msg);
      // We don't add locally anymore, we wait for the loopback from backend
      // This ensures all devices are in sync.
    }
  };

  const currentMessages = activeTarget ? history[activeTarget.id] || [] : [];

  const UserBadge = ({ name, color = "indigo" }: { name: string, color?: string }) => (
    <div className={`w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-bold border border-white/5 shadow-2xl overflow-hidden`}>
      <span className={color === "indigo" ? "text-indigo-400" : "text-slate-500"}>
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080a0f] text-white">
        <div className="mesh-bg"></div>
        <div className="glass p-12 rounded-[2.5rem] w-full max-w-sm shadow-2xl relative animate-entry">
          <div className="text-center space-y-2 mb-10">
            <h1 className="text-4xl font-black tracking-tighter text-indigo-500 uppercase italic">Skyline</h1>
            <p className="text-slate-600 text-[10px] uppercase font-black tracking-widest">Protocol Initialize</p>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="Identity" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none placeholder:text-slate-700" />
            <input type="password" placeholder="Passcode" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none placeholder:text-slate-700" />
            <button onClick={handleConnect} disabled={isConnecting}
              className="w-full h-16 bg-indigo-600 hover:bg-indigo-500 font-black rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
              {isConnecting ? "AUTHORIZING..." : "CONNECT TERMINAL"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#080a0f] text-slate-300 overflow-hidden font-sans">
      <div className="mesh-bg"></div>
      
      {/* Sidebar */}
      <aside className="w-80 bg-[#0d1117]/60 backdrop-blur-3xl border-r border-white/5 flex flex-col z-20 shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
          <UserBadge name={username} color="indigo" />
          <div className="flex-1 min-w-0">
             <h3 className="font-extrabold text-white truncate text-base">{username}</h3>
             <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                <span className="text-[10px] font-black uppercase opacity-40">Connected</span>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto sb-thin p-8 space-y-12">
          {[{ t: "Channels", d: channels, i: "#" }, { t: "Private Groups", d: groups, i: "{" }, { t: "Direct Signals", d: dmUsers, i: "⚡" }].map(sec => (
            <div key={sec.t}>
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{sec.t}</h4>
                <button onClick={() => {
                  const n = prompt(`ID:`);
                  if (n) {
                    const isUser = sec.t === "Direct Signals";
                    const targetId = n.toLowerCase().replace(/\s+/g, '-');
                    const nt: ChatTarget = { 
                        id: targetId, 
                        name: n, 
                        type: isUser ? "USER" : sec.t === "Channels" ? "CHANNEL" : "GROUP" 
                    };
                    if (sec.t === "Channels") setChannels([...channels, nt]);
                    else if (sec.t === "Private Groups") setGroups([...groups, nt]);
                    else setDmUsers([...dmUsers, nt]);
                    selectTarget(nt);
                  }
                }} className="text-slate-700 hover:text-indigo-400 font-bold">+</button>
              </div>
              <div className="space-y-1">
                {sec.d.map(t => (
                  <button key={t.id} onClick={() => selectTarget(t)}
                    className={`w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition-all relative ${activeTarget?.id === t.id ? 'bg-indigo-600 shadow-xl shadow-indigo-600/20 text-white' : 'hover:bg-white/5 text-slate-500'}`}>
                    <span className="opacity-30 font-black text-xs">{sec.i}</span>
                    <span className="font-bold text-sm flex-1">{t.name}</span>
                    {unreadCounts[t.id] > 0 && (
                      <span className="absolute right-4 bg-indigo-400 text-[#080a0f] text-[9px] font-black h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full shadow-lg border-2 border-[#0d1117] animate-pulse">
                        {unreadCounts[t.id]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat Space */}
      <main className="flex-1 flex flex-col relative">
        {activeTarget ? (
          <>
            <header className="h-24 px-12 flex items-center justify-between glass border-b shadow-2xl z-10">
              <div className="flex-1 flex justify-between items-center">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg">
                        {activeTarget.type === 'CHANNEL' ? '#' : '@'}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase italic">{activeTarget.name}</h2>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{activeTarget.type} Session</span>
                    </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    if (confirm(`Wipe all locally stored data for user [${username}]?`)) {
                      const prefix = `skyline_v1_${username}_`;
                      Object.keys(localStorage).forEach(k => {
                        if (k.startsWith(prefix)) localStorage.removeItem(k);
                      });
                      localStorage.removeItem("skyline_session_active");
                      window.location.reload();
                    }
                  }} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-orange-400 transition-all" title="Clear All Data">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                  <button onClick={() => {
                    if (confirm("Logout? History will be preserved on this terminal.")) {
                      disconnectWebSocket();
                      setIsLoggedIn(false);
                      setIsConnected(false);
                      localStorage.removeItem("skyline_session_active");
                    }
                  }} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-red-400 transition-all" title="Logout">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  </button>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto sb-thin p-12 space-y-8">
              {currentMessages.map((m, i) => (
                <div key={i} className={`flex items-start gap-4 animate-entry ${m.sender === username ? "flex-row-reverse" : ""}`}>
                  <UserBadge name={m.sender} color={m.sender === username ? "indigo" : "slate"} />
                  <div className={`flex flex-col gap-1 max-w-[70%] group/msg relative ${m.sender === username ? "items-end text-right" : "items-start text-left"}`}>
                    <div className="flex items-center gap-2 px-1">
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{m.sender}</span>
                       <span className="text-[8px] font-bold text-slate-800">{m.timestamp}</span>
                    </div>

                    {m.replyContent && (
                      <div className={`mb-1 p-2 rounded-xl text-[11px] border-l-4 bg-white/5 border-indigo-500 max-w-full truncate ${m.sender === username ? "text-right" : "text-left"}`}>
                        <span className="font-black text-indigo-400 uppercase text-[9px] block">{m.replySender}</span>
                        <span className="opacity-60">{m.replyContent}</span>
                      </div>
                    )}

                    {m.sticker ? (
                      <div className="p-2 transform hover:scale-110 transition-transform">
                        <img src={m.sticker} alt="sticker" className="w-32 h-32 object-contain filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" />
                      </div>
                    ) : (
                      <div className={`px-6 py-4 rounded-3xl shadow-xl ${m.sender === username ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-600/10" : "bg-slate-900 text-slate-200 rounded-tl-none border border-white/5"}`}>
                         <p className="text-[14px] leading-relaxed font-medium whitespace-pre-wrap">{m.content}</p>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => setReplyingTo(m)}
                      className={`absolute top-0 ${m.sender === username ? "-left-12" : "-right-12"} p-2 bg-white/5 rounded-full opacity-0 group-hover/msg:opacity-100 hover:bg-white/10 transition-all text-slate-500`}
                      title="Reply"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l5 5m-5-5l5-5" /></svg>
                    </button>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-12 pt-0">
               <div className="bg-white/[0.02] shadow-3xl rounded-[2.5rem] p-3 border border-white/5 backdrop-blur-2xl">
                 <MessageInput 
                    onSend={handleSend} 
                    replyingTo={replyingTo} 
                    onCancelReply={() => setReplyingTo(null)} 
                 />
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 animate-entry">
            <div className="w-32 h-32 rounded-[2rem] bg-indigo-600 shadow-2xl flex items-center justify-center mb-8 animate-pulse shadow-indigo-600/20">
               <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.282 0 2.47.24 3.56.678m2.808 2.05A10.003 10.003 0 0118 11V12.5a4.5 4.5 0 01-9 0V11M12 11c0-1.258.5-2.4 1.32-3.23a4.505 4.505 0 016.36 0c.82.83 1.32 1.972 1.32 3.23V12.5a4.5 4.5 0 009 0V11" /></svg>
            </div>
            <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">Terminal Awaiting</h2>
            <p className="text-slate-600 mt-4 font-black uppercase tracking-[0.3em] text-[10px]">Select a Target Communication Frequency</p>
          </div>
        )}
      </main>
    </div>
  );
}
