
import React, { useRef, useEffect, useState } from 'react';
import { Message, Role, AgentProfile, AgentId, ExecutiveMemo } from '../types';
import { AGENTS } from '../constants';
import { Icon } from './Icon';

interface ChatAreaProps {
  messages: Message[];
  activeAgent: AgentProfile;
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
  roomName: string;
  themeColor: string;
  onSpeechResult: (text: string) => void;
  isSpeaking: boolean;
  isOracleMode: boolean;
  inbox?: ExecutiveMemo[];
  onMarkMemoRead?: (id: string) => void;
  onReplyToMemo?: (id: string, text: string) => void;
  onSetMemoStatus?: (id: string, status: 'active' | 'archived' | 'deleted') => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, 
  activeAgent, 
  input, 
  setInput, 
  onSend, 
  isLoading,
  roomName,
  themeColor,
  onSpeechResult,
  isSpeaking,
  isOracleMode,
  inbox,
  onMarkMemoRead,
  onReplyToMemo,
  onSetMemoStatus
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const memoThreadEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Inbox State
  const [selectedMemo, setSelectedMemo] = useState<ExecutiveMemo | null>(null);
  const [inboxTab, setInboxTab] = useState<'inbox' | 'logbook'>('inbox');
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
      if (selectedMemo && isReplying) {
        memoThreadEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
  }, [selectedMemo?.messages, isReplying]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleMemoReply = () => {
      if (selectedMemo && onReplyToMemo && replyText.trim()) {
          onReplyToMemo(selectedMemo.id, replyText);
          setReplyText("");
          setIsReplying(false);
      }
  };

  const handleMemoStatus = (status: 'archived' | 'deleted') => {
      if (selectedMemo && onSetMemoStatus) {
          onSetMemoStatus(selectedMemo.id, status);
          setSelectedMemo(null);
      }
  };

  // Setup Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onSpeechResult(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [onSpeechResult]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Theme Classes
  const bgClass = isOracleMode ? 'bg-black' : 'bg-zinc-950';
  const textClass = isOracleMode ? 'text-green-400 font-mono' : 'text-zinc-200';
  const borderClass = isOracleMode ? 'border-green-900' : 'border-zinc-800';

  // Is in Vesper's room
  const showInbox = activeAgent.id === AgentId.VESPER && !isOracleMode && inbox;
  
  const filteredInbox = inbox?.filter(m => {
      if (m.status === 'deleted') return false;
      if (inboxTab === 'logbook') return m.status === 'archived';
      return m.status === 'active' || !m.status; // Default active
  }) || [];

  return (
    <div className={`flex-1 flex h-full relative overflow-hidden transition-colors duration-500 ${bgClass} ${textClass}`}>
      
      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Oracle Mode Grid Overlay */}
        {isOracleMode && (
            <div className="absolute inset-0 opacity-10 pointer-events-none z-0" 
                style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>
        )}

        {/* Header */}
        <header className={`h-16 border-b ${borderClass} flex items-center px-6 justify-between relative z-10 shrink-0
            ${isOracleMode ? 'bg-black/80' : 'bg-zinc-900/50 backdrop-blur-md'}
        `}>
            <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${isOracleMode ? 'bg-green-900/20 text-green-500' : `bg-zinc-800/50 ${activeAgent.color}`}`}>
                <Icon name={isOracleMode ? "Code" : activeAgent.icon} className="w-6 h-6" />
            </div>
            <div>
                <h2 className={`text-lg font-semibold ${isOracleMode ? 'text-green-500 uppercase tracking-widest' : 'text-zinc-100'}`}>
                    {isOracleMode ? `// ACTIVE_NODE: ${activeAgent.name.toUpperCase()}` : roomName}
                </h2>
                
                {/* Ambient Status Bar */}
                {!isOracleMode ? (
                <div className="flex items-center gap-2">
                    <span className={`flex w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-400 animate-ping' : 'bg-green-600'}`}></span>
                    <p className="text-xs text-zinc-400">
                    {isSpeaking ? 'Agent Speaking...' : `Connected to ${activeAgent.name}`}
                    </p>
                    {/* Location Vibe */}
                    <span className="text-[10px] text-zinc-600 ml-2 border-l border-zinc-700 pl-2">
                        {activeAgent.id === 'vesper' ? 'Vibe: Jazz & Envy' : 
                        activeAgent.id === 'mei' ? 'Vibe: Efficiency' : 
                        activeAgent.id === 'lunchroom' ? 'Vibe: Burnt Popcorn' : 'Vibe: Professional'}
                    </span>
                </div>
                ) : (
                <div className="text-[10px] text-green-800 font-mono">
                    SYS.MODE: OVERRIDE | LATENCY: 12ms | MEM: 64%
                </div>
                )}
            </div>
            </div>
            <div className="hidden sm:block">
            <span className={`text-xs px-2 py-1 rounded border
                ${isOracleMode ? 'border-green-900 text-green-700 font-mono' : 'font-mono text-zinc-600 border-zinc-800'}
            `}>Model: {activeAgent.model}</span>
            </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 relative z-10">
            {messages.length === 0 && (
                <div className={`flex flex-col items-center justify-center h-full opacity-50 space-y-4
                ${isOracleMode ? 'text-green-900' : 'text-zinc-600'}
                `}>
                    <Icon name={isOracleMode ? "Terminal" : activeAgent.icon} className="w-16 h-16" />
                    <p className="text-sm">{isOracleMode ? "AWAITING INPUT..." : `Start a conversation with ${activeAgent.name}`}</p>
                </div>
            )}
            
            {messages.map((msg) => {
            const isUser = msg.role === Role.USER;
            const messageAgentId = msg.agentId || activeAgent.id;
            const currentMessageAgent = AGENTS[messageAgentId] || activeAgent;
            
            return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[75%] flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1
                    ${isOracleMode 
                        ? (isUser ? 'bg-green-900 border border-green-500' : 'bg-black border border-green-900') 
                        : (isUser ? 'bg-zinc-700' : `bg-zinc-800 border border-zinc-700`)
                    }
                    `}>
                    {isUser ? (
                        <Icon name="User" className={`w-4 h-4 ${isOracleMode ? 'text-green-500' : 'text-zinc-300'}`} />
                    ) : (
                        <Icon 
                        name={currentMessageAgent.icon} 
                        className={`w-4 h-4 ${isOracleMode ? 'text-green-700' : currentMessageAgent.color}`} 
                        />
                    )}
                    </div>

                    {/* Bubble */}
                    <div className="flex flex-col gap-1 w-full">
                    {!isUser && (
                        <span className={`text-xs font-bold ml-1 ${isOracleMode ? 'text-green-800' : currentMessageAgent.color}`}>
                        {isOracleMode ? `NODE::${currentMessageAgent.name.toUpperCase()}` : currentMessageAgent.name}
                        </span>
                    )}
                    <div className={`rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm
                        ${isOracleMode
                            ? (isUser 
                                ? 'bg-green-900/20 border border-green-500/50 text-green-300 rounded-tr-sm font-mono' 
                                : 'bg-black border border-green-900 text-green-600 rounded-tl-sm font-mono')
                            : (isUser 
                                ? 'bg-blue-600 text-white rounded-tr-sm' 
                                : `bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm`)
                        }
                        ${msg.isToolCall ? (isOracleMode ? 'border-dashed border-green-900 text-green-800' : 'border-dashed border-zinc-700 bg-zinc-900/50 italic text-zinc-500') : ''}
                        ${msg.isError ? 'border-red-500 bg-red-900/10 text-red-200' : ''}
                    `}>
                        {msg.image && (
                            <div className="mb-3 rounded overflow-hidden border border-zinc-700">
                                <img src={`data:image/png;base64,${msg.image}`} alt="Generated" className="w-full h-auto" />
                            </div>
                        )}
                        {/* Basic markdown-like rendering for line breaks */}
                        {msg.text.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                            {line}
                            {i < msg.text.split('\n').length - 1 && <br />}
                        </React.Fragment>
                        ))}
                        <div className={`text-[10px] mt-2 opacity-50 ${isUser ? (isOracleMode ? 'text-green-400' : 'text-blue-200') : (isOracleMode ? 'text-green-800' : 'text-zinc-500')}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            );
            })}
            {isLoading && (
            <div className="flex justify-start">
                <div className="max-w-[75%] flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1
                    ${isOracleMode ? 'bg-black border border-green-900' : 'bg-zinc-800 border border-zinc-700'}
                `}>
                    <Icon name={activeAgent.icon} className={`w-4 h-4 ${isOracleMode ? 'text-green-800' : activeAgent.color}`} />
                </div>
                <div className={`rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2
                    ${isOracleMode ? 'bg-black border border-green-900' : 'bg-zinc-900 border border-zinc-800'}
                `}>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isOracleMode ? 'bg-green-700' : 'bg-zinc-500'}`} style={{ animationDelay: '0ms' }}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isOracleMode ? 'bg-green-700' : 'bg-zinc-500'}`} style={{ animationDelay: '150ms' }}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isOracleMode ? 'bg-green-700' : 'bg-zinc-500'}`} style={{ animationDelay: '300ms' }}></div>
                </div>
                </div>
            </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`p-4 sm:p-6 border-t relative z-10 shrink-0
            ${isOracleMode ? 'bg-black border-green-900' : 'bg-zinc-900 border-zinc-800'}
        `}>
            <div className={`relative rounded-xl border transition-colors focus-within:ring-1 focus-within:ring-offset-0 focus-within:ring-offset-zinc-900 focus-within:border-transparent
            ${isOracleMode 
                ? 'bg-black border-green-900 focus-within:ring-green-700' 
                : `bg-zinc-950 ${themeColor.replace('border-', 'focus-within:ring-')}`
            }
            `}>
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isOracleMode ? `// ENTER COMMAND FOR NODE: ${activeAgent.name}` : `Message ${activeAgent.name}...`}
                className={`w-full bg-transparent p-4 pr-24 outline-none resize-none min-h-[60px] max-h-[200px]
                ${isOracleMode ? 'text-green-500 font-mono placeholder-green-900' : 'text-zinc-200'}
                `}
                rows={1}
                disabled={isLoading}
            />
            
            <div className="absolute right-2 bottom-2 flex gap-2">
                {!isOracleMode && (
                    <button
                        onClick={toggleListening}
                        className={`p-2 rounded-lg transition-all flex items-center justify-center
                        ${isListening 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                        }
                        `}
                        title="Hold to Speak"
                    >
                        <Icon name={isListening ? "Mic" : "MicOff"} className="w-5 h-5" />
                    </button>
                )}

                <button
                    onClick={onSend}
                    disabled={!input.trim() || isLoading}
                    className={`p-2 rounded-lg transition-all
                    ${!input.trim() || isLoading 
                        ? 'text-zinc-600 bg-transparent' 
                        : (isOracleMode ? 'bg-green-900 text-green-400 hover:bg-green-800' : 'bg-zinc-800 text-white hover:bg-zinc-700')
                    }
                    `}
                >
                    <Icon name="ArrowUp" className="w-5 h-5" />
                </button>
            </div>
            </div>
            <p className={`text-center text-[10px] mt-3 flex justify-center gap-2
                ${isOracleMode ? 'text-green-900 font-mono' : 'text-zinc-600'}
            `}>
            <span>DeepFish AI • {activeAgent.name}</span>
            {isListening && <span className="text-red-400 font-bold">• Listening...</span>}
            </p>
        </div>
      </div>

      {/* EXECUTIVE INBOX PANEL (RIGHT) */}
      {showInbox && inbox && (
          <div className="w-72 md:w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0">
             <div className="h-16 border-b border-zinc-800 flex items-center px-4 bg-zinc-900/50 justify-between">
                 <div className="flex items-center">
                    <Icon name="Inbox" className="w-4 h-4 text-amber-200 mr-2" />
                    <span className="text-sm font-bold text-amber-100">Executive Inbox</span>
                 </div>
                 {/* TAB TOGGLE */}
                 <div className="flex text-[10px] font-bold bg-zinc-900 rounded border border-zinc-800">
                    <button 
                        onClick={() => setInboxTab('inbox')}
                        className={`px-2 py-1 ${inboxTab === 'inbox' ? 'bg-amber-900/30 text-amber-200' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        INBOX
                    </button>
                     <button 
                        onClick={() => setInboxTab('logbook')}
                        className={`px-2 py-1 ${inboxTab === 'logbook' ? 'bg-amber-900/30 text-amber-200' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        LOGBOOK
                    </button>
                 </div>
             </div>
             
             {/* Memo List */}
             <div className="flex-1 overflow-y-auto">
                 {filteredInbox.length === 0 ? (
                     <div className="p-8 text-center text-zinc-600 text-xs">No {inboxTab} items found.</div>
                 ) : (
                     <div className="divide-y divide-zinc-900">
                         {filteredInbox.map(memo => (
                             <button 
                                key={memo.id}
                                onClick={() => {
                                    setSelectedMemo(memo);
                                    if (!memo.isRead && onMarkMemoRead) onMarkMemoRead(memo.id);
                                }}
                                className={`w-full text-left p-4 hover:bg-zinc-900 transition-colors
                                    ${memo.isRead ? 'opacity-60' : 'bg-amber-900/5 opacity-100'}
                                    ${selectedMemo?.id === memo.id ? 'bg-zinc-900 border-l-2 border-amber-400' : ''}
                                `}
                             >
                                 <div className="flex justify-between mb-1">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase">{AGENTS[memo.senderId]?.name || memo.senderId}</span>
                                    <span className="text-[10px] text-zinc-600">{memo.timestamp.toLocaleDateString()}</span>
                                 </div>
                                 <h4 className={`text-sm font-medium truncate ${memo.isRead ? 'text-zinc-400' : 'text-amber-100'}`}>
                                     {memo.subject}
                                 </h4>
                                 <p className="text-[10px] text-zinc-500 mt-1 truncate">{memo.body.substring(0, 40)}...</p>
                                 <div className="mt-2 flex items-center gap-1">
                                     <span className="text-[9px] text-zinc-600 uppercase">Status: {memo.status || 'Active'}</span>
                                     {memo.messages && memo.messages.length > 0 && (
                                         <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1 rounded ml-auto">{memo.messages.length} Replies</span>
                                     )}
                                 </div>
                             </button>
                         ))}
                     </div>
                 )}
             </div>

             {/* Reader Panel (Modal) */}
             {selectedMemo && (
                 <div className="absolute inset-0 z-50 bg-zinc-950/95 backdrop-blur-sm flex items-center justify-center p-4">
                     <div className="bg-zinc-900 w-full max-w-lg max-h-[85vh] rounded-lg border border-zinc-800 shadow-2xl flex flex-col">
                        
                        {/* HEADER */}
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/50 rounded-t-lg">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded bg-zinc-800 flex items-center justify-center ${AGENTS[selectedMemo.senderId]?.color}`}>
                                    <Icon name={AGENTS[selectedMemo.senderId]?.icon || "Mail"} className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white leading-tight">{selectedMemo.subject}</h3>
                                    <p className="text-[10px] text-zinc-400">From: {AGENTS[selectedMemo.senderId]?.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleMemoStatus('archived')}
                                    className="text-zinc-500 hover:text-red-400"
                                    title="Archive/Stop Thread"
                                >
                                    <Icon name="Octagon" className="w-5 h-5" />
                                </button>
                                <button onClick={() => setSelectedMemo(null)} className="text-zinc-500 hover:text-white">
                                    <Icon name="X" className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* BODY + THREAD */}
                        <div className="p-6 overflow-y-auto bg-zinc-950/50 flex-1 flex flex-col gap-6">
                            {/* Original Memo */}
                            <div className="font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                {selectedMemo.body}
                            </div>
                            
                            {/* Thread History */}
                            {selectedMemo.messages && selectedMemo.messages.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-zinc-800 space-y-4">
                                    <h5 className="text-[10px] font-bold text-zinc-500 uppercase">Thread History</h5>
                                    {selectedMemo.messages.map(msg => (
                                        <div key={msg.id} className={`flex ${msg.role === 'ceo' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded p-3 text-xs font-mono 
                                                ${msg.role === 'ceo' ? 'bg-indigo-900/30 text-indigo-200 border border-indigo-500/30' : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700'}`}>
                                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                                <div className="mt-1 text-[9px] opacity-50 text-right">{msg.timestamp.toLocaleTimeString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={memoThreadEndRef} />
                                </div>
                            )}

                             {/* Reply Input Area (Conditional) */}
                             {isReplying && (
                                <div className="mt-4 border-t border-zinc-800 pt-4">
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-xs text-zinc-200 font-mono focus:border-indigo-500 outline-none min-h-[80px]"
                                        autoFocus
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button 
                                            onClick={handleMemoReply}
                                            className="bg-indigo-600 text-white text-xs px-3 py-1 rounded hover:bg-indigo-500"
                                        >
                                            Send Reply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* FOOTER CONTROLS */}
                        <div className="p-3 border-t border-zinc-800 bg-zinc-900 rounded-b-lg flex justify-between items-center font-mono text-[10px] uppercase tracking-wider">
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => handleMemoStatus('archived')}
                                    className="text-zinc-500 hover:text-indigo-400 transition-colors"
                                >
                                    [ SAVE ]
                                </button>
                                <button 
                                    onClick={() => setIsReplying(!isReplying)}
                                    className={`transition-colors ${isReplying ? 'text-indigo-400' : 'text-zinc-500 hover:text-indigo-400'}`}
                                >
                                    [ REPLY ]
                                </button>
                                <button 
                                    onClick={() => handleMemoStatus('deleted')}
                                    className="text-zinc-500 hover:text-red-400 transition-colors"
                                >
                                    [ RECYCLE ]
                                </button>
                            </div>
                            <button 
                                onClick={() => setSelectedMemo(null)} 
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                [ CLOSE ]
                            </button>
                        </div>
                     </div>
                 </div>
             )}
          </div>
      )}
    </div>
  );
};

export default ChatArea;
