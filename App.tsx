import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { Labs } from './components/Labs';
import { AGENTS } from './constants';
import { useAgentEngine } from './hooks/useAgentEngine';

const App: React.FC = () => {
  const {
    agents,
    activeParticipantIds,
    activeAgents,
    messages,
    isLoading,
    isSpeaking,
    isLabsOpen,
    inbox,
    agentToEdit,
    setIsLabsOpen,
    toggleAgentSelection,
    handleSendMessage,
    handleVoiceCommand,
    createNewAgent,
    editAgent,
    openLabsForNew,
    triggerBackup,
    restoreFromSnapshot,
    markMemoAsRead,
    replyToMemo,
    setMemoStatus
  } = useAgentEngine({ initialAgents: AGENTS });

  const [input, setInput] = useState("");

  const handleToggleAgent = (id: string) => {
    toggleAgentSelection(id);
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

  const handleRestoreFile = (file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              if (event.target && typeof event.target.result === 'string') {
                  const json = JSON.parse(event.target.result);
                  restoreFromSnapshot(json);
              }
          } catch (e) {
              console.error("Failed to parse backup file", e);
              alert("Error parsing backup file.");
          }
      };
      reader.readAsText(file);
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

  return (
    <div className="flex h-screen w-full overflow-hidden transition-colors duration-500 bg-zinc-950 text-zinc-200">
      
      {/* Left Agent Selector */}
      <Sidebar 
        activeParticipantIds={activeParticipantIds}
        onToggleAgent={handleToggleAgent}
        onSelectAgent={() => {}} 
        isLabsOpen={isLabsOpen}
        agents={agents}
        onEditAgent={editAgent}
        onBackup={triggerBackup}
        onRestore={handleRestoreFile}
      />

      {/* Main Content Router */}
      <div className="flex-1 flex flex-col relative">
        {isLabsOpen ? (
          <Labs agents={agents} onCreateAgent={createNewAgent} agentToEdit={agentToEdit} />
        ) : (
          <ChatArea 
            messages={messages}
            activeAgents={activeAgents}
            allAgents={agents}
            input={input}
            setInput={setInput}
            onSend={handleSend}
            isLoading={isLoading}
            onSpeechResult={handleVoiceWrapper}
            isSpeaking={isSpeaking}
            inbox={inbox}
            onMarkMemoRead={markMemoAsRead}
            onReplyToMemo={replyToMemo}
            onSetMemoStatus={setMemoStatus}
            onEditAgent={editAgent}
            onOpenLabs={openLabsForNew}
            onBackup={triggerBackup}
            onRestore={restoreFromSnapshot}
            onToggleFullscreen={toggleFullscreen}
          />
        )}
        
        <div className="absolute top-4 right-4 z-50 pointer-events-none mix-blend-difference">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800/50 bg-black/20 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-widest">DeepFish OS</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;