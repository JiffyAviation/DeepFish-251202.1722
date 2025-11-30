

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { Labs } from './components/Labs';
import { ROOMS, INITIAL_AGENTS } from './constants';
import { useAgentEngine } from './hooks/useAgentEngine';

const App: React.FC = () => {
  // Use The Engine
  const {
    agents,
    activeRoom,
    activeAgent,
    messages,
    isLoading,
    isSpeaking,
    isLabsOpen,
    isOracleMode,
    inbox, // Get inbox
    setIsLabsOpen,
    setActiveRoomId,
    setTempActiveAgentId,
    handleSendMessage,
    handleVoiceCommand,
    createNewAgent,
    toggleOracleMode,
    triggerBackup,
    restoreFromSnapshot, // Added restore function
    markMemoAsRead,
    replyToMemo,
    setMemoStatus
  } = useAgentEngine({ initialAgents: INITIAL_AGENTS, initialRooms: ROOMS });

  // Local input state for the UI
  const [input, setInput] = useState("");

  const onSelectRoom = (id: string) => {
    setActiveRoomId(id);
    setTempActiveAgentId(null);
    setIsLabsOpen(false);
  };

  const handleSend = () => {
    handleSendMessage(input);
    setInput("");
  };

  const handleVoiceWrapper = (text: string) => {
    const remainingText = handleVoiceCommand(text);
    if (remainingText) {
      setInput(remainingText);
      setTimeout(() => {
        handleSendMessage(remainingText);
        setInput("");
      }, 500);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  };

  // Calculate unread memos
  const unreadCount = inbox ? inbox.filter(m => !m.isRead && m.status !== 'deleted' && m.status !== 'archived').length : 0;

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-500
        ${isOracleMode ? 'bg-black text-green-500' : 'bg-zinc-950 text-zinc-200'}
    `}>
      
      <Sidebar 
        activeRoomId={activeRoom.isBoardroom ? 'boardroom' : activeRoom.id}
        onSelectRoom={onSelectRoom}
        onOpenLabs={() => setIsLabsOpen(true)}
        isLabsOpen={isLabsOpen}
        onToggleOracleMode={toggleOracleMode}
        isOracleMode={isOracleMode}
        onBackup={triggerBackup}
        onRestore={restoreFromSnapshot}
        onToggleFullscreen={toggleFullscreen}
        inboxCount={unreadCount}
      />

      {/* Main Content Router */}
      <div className="flex-1 flex flex-col relative">
        {isLabsOpen ? (
          <Labs agents={agents} onCreateAgent={createNewAgent} />
        ) : (
          <ChatArea 
            messages={messages}
            activeAgent={activeAgent}
            input={input}
            setInput={setInput}
            onSend={handleSend}
            isLoading={isLoading}
            roomName={activeAgent.id === activeRoom.agentId ? activeRoom.name : `Call with ${activeAgent.name}`}
            themeColor={activeRoom.themeColor}
            onSpeechResult={handleVoiceWrapper}
            isSpeaking={isSpeaking}
            isOracleMode={isOracleMode}
            inbox={inbox}
            onMarkMemoRead={markMemoAsRead}
            onReplyToMemo={replyToMemo}
            onSetMemoStatus={setMemoStatus}
          />
        )}
        
        {/* Visual Indicator of Mei's Presence */}
        {!isOracleMode && (
            <div className="absolute top-4 right-4 z-50 pointer-events-none">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-zinc-800">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-[10px] text-zinc-400 font-mono uppercase">Mei Online</span>
            </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;
