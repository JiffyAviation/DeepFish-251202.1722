import React, { useState, useEffect, useRef } from 'react';
import { AgentProfile, AgentId } from '../types';
import { AGENTS } from '../constants';
import { Icon } from './Icon';

interface SidebarProps {
  activeParticipantIds: string[];
  onToggleAgent: (agentId: string) => void;
  isLabsOpen: boolean;
  agents?: Record<string, AgentProfile>; 
  onEditAgent: (agentId: string) => void;
  onSelectAgent: (agentId: string) => void;
  onBackup?: () => void;
  onRestore?: (file: File) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeParticipantIds, 
  onToggleAgent, 
  isLabsOpen, 
  agents = AGENTS,
  onEditAgent,
  onBackup,
  onRestore
}) => {
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, agentId: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const handleClickOutside = () => setContextMenu(null);
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, agentId: string) => {
      e.preventDefault();
      setContextMenu({
          x: e.clientX,
          y: e.clientY,
          agentId
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && onRestore) {
          onRestore(e.target.files[0]);
      }
  };

  const agentList = Object.values(agents);
  const executives = agentList.filter(a => a.isCore).sort((a,b) => a.name.localeCompare(b.name));
  
  // Official Specialists are those in the original AGENTS list and not Core
  const officialIds = Object.keys(AGENTS);
  const specialists = agentList.filter(a => !a.isCore && officialIds.includes(a.id)).sort((a,b) => a.name.localeCompare(b.name));
  
  // Custom Units are those NOT in the original AGENTS list
  const customUnits = agentList.filter(a => !officialIds.includes(a.id)).sort((a,b) => a.name.localeCompare(b.name));

  const renderAgentButton = (agent: AgentProfile, isCore: boolean) => {
      const isActive = activeParticipantIds.includes(agent.id) && !isLabsOpen;
      
      return (
        <button
            key={agent.id}
            onClick={() => onToggleAgent(agent.id)}
            onContextMenu={(e) => handleContextMenu(e, agent.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group relative mb-1 border
                ${isActive 
                ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-md ring-1 ring-white/5' 
                : 'border-transparent text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-300 hover:border-zinc-800/50'}
            `}
        >
            {/* Icon Container with Color */}
            <div className={`
                 w-8 h-8 rounded-md flex items-center justify-center shrink-0 border transition-all duration-300
                 ${isActive 
                   ? 'bg-zinc-900 border-zinc-600 shadow-inner' 
                   : 'bg-zinc-950 border-zinc-800 group-hover:border-zinc-700'}
            `}>
                 <Icon name={agent.icon} className={`w-4 h-4 ${agent.color} ${isActive ? 'filter drop-shadow-sm' : 'opacity-80 group-hover:opacity-100'}`} />
            </div>

            <div className="hidden md:flex flex-col items-start w-full overflow-hidden">
                <span className={`text-xs font-semibold tracking-tight transition-colors ${isActive ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{agent.name}</span>
                <span className="text-[9px] opacity-50 truncate w-full text-left font-mono tracking-wide">{agent.title}</span>
            </div>
            
            {/* Active Indicator Light */}
            {isActive && <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.8)]"></div>}
        </button>
      );
  };

  return (
    <div className="w-20 md:w-64 border-r border-white/5 flex flex-col h-full shrink-0 transition-all duration-300 relative bg-zinc-950/80 backdrop-blur-md">
      {/* Header */}
      <div className="h-16 border-b border-white/5 flex items-center px-4 md:px-6 bg-zinc-900/20">
        <div className="flex items-center gap-3 w-full justify-center md:justify-start">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-indigo-600 shadow-lg shadow-indigo-900/30 ring-1 ring-indigo-400/20">
            <Icon name="Fish" className="w-5 h-5 text-white" />
          </div>
          <div className="hidden md:flex flex-col">
              <h1 className="text-sm font-bold tracking-wide text-zinc-100 uppercase">
                 DeepFish<span className="text-indigo-500">.AI</span>
              </h1>
              <span className="text-[9px] text-zinc-600 font-mono tracking-[0.2em]">STUDIO OS</span>
          </div>
        </div>
      </div>

      {/* Roster - Takes up all remaining space */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
        
        {/* EXECUTIVE TEAM */}
        <div>
            <div className="px-3 mb-2 flex items-center justify-between hidden md:flex">
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">AGENTIC ASSETS</span>
                <span className="text-[9px] font-mono text-zinc-700">{executives.length}</span>
            </div>
            <nav className="space-y-0.5">
                {executives.map(a => renderAgentButton(a, true))}
            </nav>
        </div>

        {/* SPECIALIST UNITS */}
        <div>
            <div className="px-3 mb-2 flex items-center justify-between hidden md:flex">
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Modules</span>
                <span className="text-[9px] font-mono text-zinc-700">{specialists.length}</span>
            </div>
            <nav className="space-y-0.5">
                {specialists.map(a => renderAgentButton(a, false))}
            </nav>
        </div>

        {/* CUSTOM UNITS */}
        {customUnits.length > 0 && (
            <div>
                <div className="px-3 mb-2 flex items-center justify-between hidden md:flex">
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Custom</span>
                </div>
                <nav className="space-y-0.5">
                    {customUnits.map(a => renderAgentButton(a, false))}
                </nav>
            </div>
        )}
      </div>

      {/* System Ops Footer */}
      <div className="p-4 border-t border-white/5 bg-zinc-950/50 space-y-2">
         <div className="hidden md:block">
            <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">System Operations</h4>
            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={onBackup}
                    className="flex flex-col items-center justify-center p-2 rounded bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800 transition-all text-zinc-400 hover:text-emerald-400"
                >
                    <Icon name="Save" className="w-4 h-4 mb-1" />
                    <span className="text-[9px]">Backup</span>
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-2 rounded bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800 transition-all text-zinc-400 hover:text-blue-400"
                >
                    <Icon name="Upload" className="w-4 h-4 mb-1" />
                    <span className="text-[9px]">Import</span>
                </button>
            </div>
         </div>
         <div className="text-[9px] font-mono text-center flex items-center justify-center gap-2 text-zinc-600 opacity-60 mt-2">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
             SYSTEM ONLINE
         </div>
      </div>
      
      {/* Hidden File Input for Restore */}
      <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".json"
          onChange={handleFileChange}
      />

      {/* CONTEXT MENU */}
      {contextMenu && (
          <div 
             className="fixed z-50 bg-zinc-900 border border-zinc-700 rounded-md shadow-2xl py-1 w-48 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
             style={{ top: contextMenu.y, left: contextMenu.x }}
          >
              <div className="px-3 py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 bg-zinc-950/50">
                  Node Options
              </div>
              <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onEditAgent(contextMenu.agentId);
                    setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-indigo-600 hover:text-white flex items-center gap-2 transition-colors"
              >
                  <Icon name="Settings" className="w-3.5 h-3.5" />
                  Configure Node
              </button>
              <button disabled className="w-full text-left px-4 py-2.5 text-xs text-zinc-600 flex items-center gap-2 cursor-not-allowed">
                   <Icon name="PowerOff" className="w-3.5 h-3.5" />
                   Deactivate
              </button>
          </div>
      )}

    </div>
  );
};

export default Sidebar;