
import React from 'react';
import { AgentProfile } from '../types';
import { Icon } from './Icon';

interface GodModeProps {
  agent: AgentProfile;
  onClose: () => void;
  onEdit: () => void;
}

export const GodMode: React.FC<GodModeProps> = ({ agent, onClose, onEdit }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-black text-green-500 font-mono overflow-hidden relative">
      {/* Matrix Overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none z-0" 
           style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* Header */}
      <header className="h-16 border-b border-green-900 bg-green-950/20 flex items-center px-6 justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Icon name="Database" className="w-6 h-6 animate-pulse" />
          <h1 className="text-xl font-bold tracking-widest uppercase">
            GOD_MODE :: NODE_VIEWER :: {agent.name.toUpperCase()}
          </h1>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={onEdit}
                className="px-4 py-2 border border-green-700 hover:bg-green-900/50 text-xs uppercase flex items-center gap-2 transition-colors"
            >
                <Icon name="Edit" className="w-4 h-4" />
                Modify Source
            </button>
            <button 
                onClick={onClose}
                className="px-4 py-2 border border-green-700 hover:bg-red-900/50 hover:border-red-700 hover:text-red-500 text-xs uppercase flex items-center gap-2 transition-colors"
            >
                <Icon name="X" className="w-4 h-4" />
                Close Stream
            </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Column 1: Identity Matrix */}
            <div className="space-y-6">
                <div className="border border-green-900 p-6 bg-black/50">
                    <h3 className="text-xs font-bold border-b border-green-900 pb-2 mb-4 uppercase opacity-70">Identity Matrix</h3>
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-20 h-20 border border-green-700 flex items-center justify-center bg-green-900/20`}>
                            <Icon name={agent.icon} className="w-10 h-10" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{agent.name}</div>
                            <div className="text-xs opacity-70">{agent.id}</div>
                            <div className="mt-2 text-xs border border-green-800 px-2 py-1 inline-block">
                                {agent.title}
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-4 text-xs">
                        <div className="flex justify-between border-b border-green-900/50 pb-1">
                            <span className="opacity-50">ROLE_DESCRIPTION</span>
                            <span className="text-right max-w-[60%]">{agent.description}</span>
                        </div>
                        <div className="flex justify-between border-b border-green-900/50 pb-1">
                            <span className="opacity-50">ICON_ASSET</span>
                            <span>{agent.icon}</span>
                        </div>
                        <div className="flex justify-between border-b border-green-900/50 pb-1">
                            <span className="opacity-50">COLOR_HEX</span>
                            <span>{agent.color}</span>
                        </div>
                        <div className="flex justify-between border-b border-green-900/50 pb-1">
                            <span className="opacity-50">IS_CORE_NODE</span>
                            <span>{agent.isCore ? 'TRUE' : 'FALSE'}</span>
                        </div>
                    </div>
                </div>

                <div className="border border-green-900 p-6 bg-black/50">
                    <h3 className="text-xs font-bold border-b border-green-900 pb-2 mb-4 uppercase opacity-70">Neural Configuration</h3>
                    <div className="space-y-4 text-xs">
                         <div className="flex justify-between border-b border-green-900/50 pb-1">
                            <span className="opacity-50">MODEL_HOOK</span>
                            <span className="text-green-300 font-bold">{agent.model}</span>
                        </div>
                        <div className="flex justify-between border-b border-green-900/50 pb-1">
                            <span className="opacity-50">MARKETING_NAME</span>
                            <span>{agent.hookName || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b border-green-900/50 pb-1">
                            <span className="opacity-50">VOICE_ID (11LABS)</span>
                            <span className="font-mono">{agent.voiceId || "NULL_POINTER"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Column 2: The Soul (Prompt) */}
            <div className="lg:col-span-2 space-y-6">
                <div className="border border-green-900 p-6 bg-black/50 h-full flex flex-col">
                    <h3 className="text-xs font-bold border-b border-green-900 pb-2 mb-4 uppercase opacity-70">
                        System Prompt (Read-Only)
                    </h3>
                    <div className="flex-1 bg-green-950/10 p-4 border border-green-900/30 overflow-y-auto max-h-[600px]">
                        <pre className="whitespace-pre-wrap text-xs leading-relaxed text-green-400 opacity-90 font-mono selection:bg-green-500 selection:text-black">
                            {agent.basePrompt}
                        </pre>
                    </div>
                    {agent.customInstructions && (
                        <div className="mt-4 border-t border-green-900 pt-4">
                             <h4 className="text-xs font-bold text-yellow-500 mb-2 uppercase">Runtime Overrides (Mutable Layer)</h4>
                             <pre className="whitespace-pre-wrap text-xs leading-relaxed text-yellow-500/80 font-mono bg-yellow-900/10 p-4 border border-yellow-900/30">
                                {agent.customInstructions}
                             </pre>
                        </div>
                    )}
                </div>
            </div>

            {/* Column 3: Raw Data (Footer-ish area but putting it here for layout balance) */}
            <div className="lg:col-span-3">
                 <div className="border border-green-900 p-6 bg-black/50">
                    <h3 className="text-xs font-bold border-b border-green-900 pb-2 mb-4 uppercase opacity-70">Raw JSON Object</h3>
                    <pre className="text-[10px] text-green-600 overflow-x-auto">
                        {JSON.stringify(agent, null, 2)}
                    </pre>
                 </div>
            </div>

        </div>
      </div>
    </div>
  );
};
