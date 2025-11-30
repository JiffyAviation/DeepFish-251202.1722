

import React, { useRef } from 'react';
import { Room, AgentProfile, AgentId, ExecutiveMemo } from '../types';
import { ROOMS, AGENTS } from '../constants';
import { Icon } from './Icon';

interface SidebarProps {
  activeRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onOpenLabs: () => void;
  isLabsOpen: boolean;
  onToggleOracleMode: () => void;
  isOracleMode: boolean;
  onBackup: () => void;
  onRestore: (snapshot: any) => void; // Added onRestore prop
  onToggleFullscreen: () => void; 
  inboxCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeRoomId, onSelectRoom, onOpenLabs, isLabsOpen, onToggleOracleMode, isOracleMode, onBackup, onRestore, onToggleFullscreen, inboxCount = 0 }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              onRestore(json);
          } catch (err) {
              console.error("Failed to parse snapshot", err);
              alert("Invalid snapshot file.");
          }
      };
      reader.readAsText(file);
      // Reset input
      e.target.value = '';
  };

  return (
    <div className={`w-20 md:w-64 border-r flex flex-col h-full shrink-0 transition-all duration-300
        ${isOracleMode ? 'bg-black border-zinc-700' : 'bg-zinc-900 border-zinc-800'}
    `}>
      <div className={`p-4 md:p-6 border-b flex flex-col items-center md:items-start gap-3
         ${isOracleMode ? 'border-zinc-700' : 'border-zinc-800'}
      `}>
        <div className="flex items-center justify-center md:justify-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
             ${isOracleMode ? 'bg-zinc-100' : 'bg-indigo-600'}
          `}>
            <Icon name={isOracleMode ? "Eye" : "Fish"} className={`w-5 h-5 ${isOracleMode ? 'text-black' : 'text-white'}`} />
          </div>
          <h1 className={`text-lg font-bold hidden md:block tracking-tight
             ${isOracleMode ? 'text-white font-mono' : 'text-zinc-100'}
          `}>
             {isOracleMode ? 'ROOT::ACCESS' : 'DeepFish AI'}
          </h1>
        </div>
        <p className={`text-[10px] font-mono hidden md:block italic pl-1
            ${isOracleMode ? 'text-zinc-400' : 'text-zinc-500'}
        `}>
          {isOracleMode ? "USER: ARCHITECT [SU]" : '"AI is deep; we can go there."'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-zinc-500 uppercase hidden md:block">Locations</div>
        <nav className="space-y-1 px-2">
          {ROOMS.map((room) => {
            const agent = AGENTS[room.agentId];
            const isActive = activeRoomId === room.id && !isLabsOpen;
            const hasNotification = room.agentId === AgentId.VESPER && inboxCount > 0;
            
            return (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-colors duration-200 group relative
                  ${isActive 
                    ? (isOracleMode ? 'bg-zinc-800 text-green-400 border border-green-900' : 'bg-zinc-800 text-white') 
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}
                `}
              >
                <div className={`relative ${isActive ? (isOracleMode ? 'text-green-400' : agent.color) : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                  <Icon name={agent.icon} className="w-5 h-5" />
                  {isActive && (
                    <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-zinc-900
                       ${isOracleMode ? 'bg-green-500 animate-pulse' : 'bg-green-500'}
                    `}></span>
                  )}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className={`text-sm font-medium ${isOracleMode ? 'font-mono' : ''}`}>{room.name}</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{agent.name}</span>
                </div>
                
                {/* Notification Badge */}
                {hasNotification && (
                    <div className="absolute right-2 top-3 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm border border-zinc-900">
                        {inboxCount}
                    </div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 px-4 mb-2 text-xs font-semibold text-zinc-500 uppercase hidden md:block">Virtual Staff</div>
        <div className="px-2 space-y-1 hidden md:block">
           {(Object.values(AGENTS) as AgentProfile[]).filter(a => !a.isCore).map(agent => (
             <div key={agent.id} className="flex items-center gap-3 px-3 py-2 text-zinc-500 opacity-60 hover:opacity-100 transition-opacity cursor-default">
                <Icon name={agent.icon} className="w-4 h-4" />
                <span className="text-xs">{agent.name}</span>
             </div>
           ))}
        </div>
      </div>

      {/* Footer / Labs & Oracle */}
      <div className={`p-4 border-t space-y-2
         ${isOracleMode ? 'border-zinc-700' : 'border-zinc-800'}
      `}>
         <button 
           onClick={onOpenLabs}
           className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-colors duration-200 group
             ${isLabsOpen 
               ? (isOracleMode ? 'bg-zinc-800 text-green-400 border border-green-500' : 'bg-indigo-900/30 text-indigo-300 border border-indigo-500/30') 
               : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}
           `}
         >
            <Icon name="Cpu" className="w-5 h-5" />
            <div className="hidden md:flex flex-col items-start text-left">
               <span className="text-sm font-bold">The Labs</span>
               <span className="text-[10px] opacity-70">Agent Workstation</span>
            </div>
         </button>

         <div className="grid grid-cols-4 gap-2">
            <button 
                onClick={onToggleOracleMode}
                className={`flex items-center justify-center gap-2 px-2 py-2 rounded-md transition-colors duration-200 group
                    ${isOracleMode 
                    ? 'bg-red-900/20 text-red-400 border border-red-900/50' 
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'}
                `}
                title="ROOT ACCESS"
            >
                <Icon name={isOracleMode ? "EyeOff" : "Eye"} className="w-4 h-4" />
            </button>
            
            <button 
                onClick={onBackup}
                className={`flex items-center justify-center gap-2 px-2 py-2 rounded-md transition-colors duration-200 group
                    ${isOracleMode 
                    ? 'bg-green-900/20 text-green-400 border border-green-900/50 hover:bg-green-900/40' 
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'}
                `}
                title="Save Snapshot"
            >
                <Icon name="Save" className="w-4 h-4" />
            </button>

            <button 
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center justify-center gap-2 px-2 py-2 rounded-md transition-colors duration-200 group
                    ${isOracleMode 
                    ? 'bg-blue-900/20 text-blue-400 border border-blue-900/50 hover:bg-blue-900/40' 
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'}
                `}
                title="Restore Snapshot (CRASH DIVE)"
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".json"
                />
                <Icon name="UploadCloud" className="w-4 h-4" />
            </button>
            
            <button 
                onClick={onToggleFullscreen}
                className={`flex items-center justify-center gap-2 px-2 py-2 rounded-md transition-colors duration-200 group
                    ${isOracleMode 
                    ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' 
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'}
                `}
                title="Immersive Mode"
            >
                <Icon name="Maximize" className="w-4 h-4" />
            </button>
         </div>
         
         <div className="text-[9px] text-zinc-600 text-center font-mono pt-2">
            Beta 251125.1830
         </div>
      </div>
    </div>
  );
};

export default Sidebar;
