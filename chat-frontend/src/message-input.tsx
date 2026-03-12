import React, { useState } from "react";

interface ChatMessage {
  sender: string;
  content: string;
  sticker?: string;
}

interface MessageInputProps {
  onSend: (text: string, stickerUrl?: string) => void;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
}

const STICKERS = [
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.webp", // Grinning
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.webp", // Heart Eyes
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp", // Joy
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f618/512.webp", // Kissing
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.webp", // Cool
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.webp", // Star Eyes
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.webp", // Sob
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.webp", // Thumbs up
];

const EMOJIS = ["👍", "🔥", "❤️", "😂", "😮", "😢", "😡", "✨", "🙌", "🚀", "✅", "❌"];

export default function MessageInput({ onSend, replyingTo, onCancelReply }: MessageInputProps) {
  const [text, setText] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text.trim());
      setText("");
    }
  };

  const sendSticker = (url: string) => {
    onSend("", url);
    setShowPicker(false);
  };

  const addEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
  };

  return (
    <div className="relative">
      {replyingTo && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-4 glass rounded-3xl flex items-center justify-between border-l-4 border-indigo-500 animate-slide-up z-40">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-[10px] font-black uppercase text-indigo-400 mb-0.5">Replying to {replyingTo.sender}</p>
            <p className="text-xs text-slate-400 truncate italic">
              {replyingTo.sticker ? "[Sticker]" : replyingTo.content}
            </p>
          </div>
          <button 
            onClick={onCancelReply}
            className="p-1.5 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {showPicker && (
        <div className="absolute bottom-full left-0 mb-4 p-5 glass rounded-[2rem] w-72 shadow-2xl animate-entry z-50 border border-white/10">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">Reactions</p>
              <div className="grid grid-cols-6 gap-2">
                {EMOJIS.map((e, i) => (
                  <button key={i} onClick={() => addEmoji(e)} className="text-xl hover:scale-125 transition-transform active:scale-95">
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">Stickers</p>
              <div className="grid grid-cols-4 gap-3">
                {STICKERS.map((s, i) => (
                  <button key={i} onClick={() => sendSticker(s)} className="hover:scale-110 active:scale-95 transition-transform">
                    <img src={s} alt="sticker" className="w-10 h-10 object-contain" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center gap-4 group">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
            showPicker ? "bg-indigo-600/20 text-indigo-400 border border-indigo-400/30" : "bg-slate-900 text-slate-500 border border-white/5 hover:bg-slate-800"
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            className="w-full bg-[#080a0f] border border-white/5 rounded-2xl px-8 py-5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium placeholder:text-slate-700 shadow-inner"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Transmit signal code..."
          />
        </div>
        
        <button
          type="submit"
          disabled={!text.trim()}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-2xl relative overflow-hidden ${
            text.trim()
              ? "bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105 active:scale-95 shadow-indigo-600/30"
              : "bg-slate-900 text-slate-700 cursor-not-allowed border border-white/5"
          }`}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
