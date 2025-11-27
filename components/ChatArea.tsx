import React, { useRef, useEffect, useState } from 'react';
import { Message, Role, AgentProfile, ExecutiveMemo, MemoMessage } from '../types';
import { Icon } from './Icon';
import ReactMarkdown from 'react-markdown'; // Assuming standard markdown usage, or fallback to simple text

interface ChatAreaProps {
  messages: Message[];
  activeAgents: AgentProfile[];
  allAgents: Record<string, AgentProfile>; 
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
  onSpeechResult: (text: string) => void;
  isSpeaking: boolean;
  inbox?: ExecutiveMemo[];
  onMarkMemoRead?: (id: string) => void;
  onReplyToMemo?: (id: string, text: string) => void;
  onSetMemoStatus?: (id: string, status: 'active' | 'archived' | 'deleted') => void;
  onEditAgent: (id: string) => void;
  onOpenLabs: () => void;
  onBackup: () => void;
  onRestore: (snapshot: any) => void;
  onToggleFullscreen: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, 
  activeAgents, 
  allAgents,
  input, 
  setInput, 
  onSend, 
  isLoading,
  onSpeechResult,
  isSpeaking,
  inbox,
  onMarkMemoRead,
  onReplyToMemo,
  onSetMemoStatus,
  onEditAgent,
  onOpenLabs,
  onBackup,
  onRestore,
  onToggleFullscreen
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  
  // Inbox State
  const [selectedMemo, setSelectedMemo] = useState<ExecutiveMemo | null>(null);
  const [replyText, setReplyText] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onRestore(json);
      } catch (err) {
        alert("Failed to parse snapshot file.");
      }
    };
    reader.readAsText(file);
  };

  const unreadCount = inbox?.filter(m => !m.isRead && m.status !== 'deleted').length || 0;

  // Render Helpers
  const renderMessageContent = (msg: Message) => {
    const agent = msg.agentId ? allAgents[msg.agentId] : null;
    const isUser = msg.role === Role.USER;

    return (
      <div 
        key={msg.id} 
        className={`group flex gap-4 w-full max-w-4xl mx-auto mb-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Avatar */}
        <div className={`shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-md flex items-center justify-center border shadow-lg
          ${isUser 
            ? 'bg-zinc-800 border-zinc-700' 
            : `bg-zinc-950 border-zinc-800 ${agent?.color || 'text-zinc-500'}`
          }
        `}>
          <Icon name={isUser ? 'User' : (agent?.icon || 'Bot')} className="w-5 h-5" />
        </div>

        {/* Bubble */}
        <div className={`flex flex-col max-w-[85%] md:max-w-[75%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">
                    {isUser ? 'CEO' : agent?.name || 'Unknown'}
                </span>
                <span className="text-[9px] font-mono opacity-30">
                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
            </div>
            
            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm border
                ${isUser 
                   ? 'bg-zinc-800 text-zinc-100 border-zinc-700 rounded-tr-sm' 
                   : msg.isToolCall 
                     ? 'bg-zinc-900/30 text-zinc-400 border-zinc-800/50 font-mono text-xs italic rounded-tl-sm border-dashed'
                     : 'bg-zinc-900/80 text-zinc-200 border-zinc-800 rounded-tl-sm backdrop-blur-sm'
                }
            `}>
                {msg.isToolCall && <Icon name="Terminal" className="w-3 h-3 inline mr-2 opacity-50" />}
                {msg.text}
                {msg.image && (
                   <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                       <img src={`data:image/png;base64,${msg.image}`} alt="Generated" className="w-full h-auto" />
                   </div>
                )}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-transparent">
      
      {/* Top Navigation Bar */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
                {activeAgents.map(agent => (
                    <div key={agent.id} className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-900 flex items-center justify-center" title={agent.name}>
                        <Icon name={agent.icon} className={`w-4 h-4 ${agent.color}`} />
                    </div>
                ))}
                {activeAgents.length === 0 && (
                    <div className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <Icon name="MicOff" className="w-4 h-4" />
                    </div>
                )}
            </div>
            <div className="flex flex-col">
                <h2 className="text-xs font-bold text-zinc-200">
                    {activeAgents.length > 0 ? activeAgents.map(a => a.name).join(' & ') : "No Active Nodes"}
                </h2>
                <span className="text-[10px] text-zinc-500 font-mono">
                    {activeAgents.length > 0 ? "SESSION ACTIVE" : "IDLE"}
                </span>
            </div>
        </div>

        <div className="flex items-center gap-2">
            <button onClick={() => setShowInbox(!showInbox)} className="relative p-2 rounded hover:bg-zinc-800 transition-colors group">
                <Icon name="Inbox" className={`w-4 h-4 ${showInbox ? 'text-indigo-400' : 'text-zinc-400'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                )}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-zinc-800">
                    Exec Inbox
                </span>
            </button>
            <div className="h-4 w-px bg-zinc-800 mx-2"></div>
            <button onClick={onBackup} className="p-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors" title="Backup System State">
                <Icon name="Save" className="w-4 h-4" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-blue-400 transition-colors" title="Restore System State">
                <Icon name="UploadCloud" className="w-4 h-4" />
            </button>
            <button onClick={onToggleFullscreen} className="p-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors hidden md:block">
                <Icon name="Maximize" className="w-4 h-4" />
            </button>
            
            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleFileRestore}
            />
        </div>
      </div>

      {/* Main Content Layer */}
      <div className="flex-1 relative overflow-hidden">
          
          {/* Chat Messages */}
          <div className="absolute inset-0 overflow-y-auto px-4 py-6 scroll-smooth">
              {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-4">
                      <Icon name="Fish" className="w-16 h-16 text-zinc-500" />
                      <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">DeepFish OS Ready</p>
                  </div>
              ) : (
                  <div className="pb-32">
                      {messages.map(renderMessageContent)}
                      {isLoading && (
                          <div className="flex gap-4 w-full max-w-4xl mx-auto">
                              <div className="w-8 h-8 rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                              </div>
                              <div className="text-xs text-zinc-500 font-mono mt-2 animate-pulse">Processing...</div>
                          </div>
                      )}
                      <div ref={messagesEndRef} />
                  </div>
              )}
          </div>

          {/* Inbox Overlay */}
          {showInbox && (
              <div className="absolute inset-y-0 right-0 w-full md:w-[450px] bg-zinc-950/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 bg-zinc-900/50">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Executive Inbox</h3>
                      <button onClick={() => setShowInbox(false)} className="hover:text-white"><Icon name="X" className="w-4 h-4" /></button>
                  </div>
                  
                  {!selectedMemo ? (
                    // Memo List
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {inbox?.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map(memo => (
                            <button 
                                key={memo.id}
                                onClick={() => {
                                    setSelectedMemo(memo);
                                    if(!memo.isRead && onMarkMemoRead) onMarkMemoRead(memo.id);
                                }}
                                className={`w-full text-left p-3 rounded border transition-all ${
                                    memo.isRead ? 'bg-transparent border-zinc-800/50 opacity-70' : 'bg-zinc-900 border-indigo-500/30 shadow-md'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 ${allAgents[memo.senderId]?.color || 'text-zinc-400'}`}>
                                        {allAgents[memo.senderId]?.name || memo.senderId}
                                    </span>
                                    <span className="text-[9px] font-mono text-zinc-500">{memo.timestamp.toLocaleDateString()}</span>
                                </div>
                                <div className={`text-xs font-medium mb-1 truncate ${!memo.isRead ? 'text-white' : 'text-zinc-500'}`}>{memo.subject}</div>
                                <div className="text-[10px] text-zinc-600 line-clamp-2">{memo.body}</div>
                            </button>
                        ))}
                        {(!inbox || inbox.length === 0) && (
                            <div className="p-8 text-center text-xs text-zinc-600 font-mono">Inbox Empty</div>
                        )}
                    </div>
                  ) : (
                    // Memo Detail View
                    <div className="flex-1 flex flex-col h-full">
                        <div className="p-4 border-b border-white/5 bg-zinc-900/20">
                            <button onClick={() => setSelectedMemo(null)} className="text-[10px] uppercase font-bold text-zinc-500 hover:text-white flex items-center gap-1 mb-4">
                                <Icon name="ArrowLeft" className="w-3 h-3" /> Back
                            </button>
                            <h2 className="text-sm font-bold text-white mb-1">{selectedMemo.subject}</h2>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                                <span>From: {allAgents[selectedMemo.senderId]?.name}</span>
                                <span>•</span>
                                <span>{selectedMemo.timestamp.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Original Body */}
                            <div className="prose prose-invert prose-xs max-w-none text-zinc-300 whitespace-pre-wrap font-mono text-[11px]">
                                {selectedMemo.body}
                            </div>
                            
                            {/* Thread */}
                            {selectedMemo.messages?.map(m => (
                                <div key={m.id} className={`flex flex-col p-3 rounded border ${m.role === 'ceo' ? 'bg-zinc-800/50 border-zinc-700 ml-4' : 'bg-zinc-900/50 border-zinc-800 mr-4'}`}>
                                    <span className="text-[9px] font-bold uppercase mb-1 opacity-50">{m.role}</span>
                                    <p className="text-xs whitespace-pre-wrap">{m.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 border-t border-white/5 bg-zinc-900">
                             <div className="flex gap-2">
                                <textarea 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Dictate reply..."
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white resize-none h-16 focus:outline-none focus:border-indigo-500"
                                />
                                <button 
                                    onClick={() => {
                                        if(onReplyToMemo && replyText) {
                                            onReplyToMemo(selectedMemo.id, replyText);
                                            setReplyText("");
                                        }
                                    }}
                                    disabled={!replyText}
                                    className="px-3 bg-indigo-600 rounded text-white disabled:opacity-50 hover:bg-indigo-500 transition-colors"
                                >
                                    <Icon name="Send" className="w-4 h-4" />
                                </button>
                             </div>
                        </div>
                    </div>
                  )}
              </div>
          )}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent z-10">
        <div className="max-w-4xl mx-auto relative group">
            <div className={`absolute -inset-0.5 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur transition duration-500 group-hover:opacity-40 ${isSpeaking ? 'animate-pulse' : ''}`}></div>
            <div className="relative flex items-end gap-2 bg-zinc-900/90 rounded-lg border border-white/10 p-2 shadow-2xl">
                <button 
                    className={`p-2 rounded-md transition-all ${isListening ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                    onClick={() => {
                        // Toggle Listening stub
                        setIsListening(!isListening);
                        if (!isListening) {
                           // Simulated Speech
                           setTimeout(() => {
                               setIsListening(false);
                               setInput(input + " (Simulated voice input)");
                           }, 2000);
                        }
                    }}
                >
                    <Icon name={isListening ? 'Mic' : 'Mic'} className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
                </button>

                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Direct the studio..."
                    rows={1}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-100 placeholder-zinc-500 resize-none py-2.5 max-h-32 text-sm font-medium"
                    style={{ minHeight: '44px' }}
                />

                <div className="flex items-center gap-1 pb-1">
                    <button 
                        className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                        onClick={onOpenLabs}
                        title="Open Labs"
                    >
                         <Icon name="Cpu" className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={onSend}
                        disabled={!input.trim() || isLoading}
                        className={`p-2 rounded-md transition-all ${
                            input.trim() 
                             ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)] hover:bg-indigo-500' 
                             : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}
                    >
                        <Icon name={isLoading ? 'Loader2' : 'ArrowUp'} className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
            
            {/* Status Footer */}
            <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
                 <span className="text-[9px] text-zinc-600 font-mono tracking-widest uppercase">
                     {isSpeaking ? 'AUDIO OUTPUT ACTIVE' : 'SYSTEM READY'}
                 </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;