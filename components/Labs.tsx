import React, { useState, useEffect, useCallback } from 'react';
import { AgentProfile, AgentId } from '../types';
import { AGENTS } from '../constants'; // Import agents for Igor lookup
import { Icon } from './Icon';

interface LabsProps {
  agents: Record<string, AgentProfile>;
  onCreateAgent: (agent: AgentProfile) => void;
  initialAgentId?: string | null;
}

const COLORS = [
  'text-red-400', 'text-orange-400', 'text-amber-400', 'text-yellow-400', 
  'text-lime-400', 'text-green-400', 'text-emerald-400', 'text-teal-400', 
  'text-cyan-400', 'text-sky-400', 'text-blue-400', 'text-indigo-400', 
  'text-violet-400', 'text-purple-400', 'text-fuchsia-400', 'text-pink-400', 
  'text-rose-400'
];

const ICONS = [
  'Activity', 'Anchor', 'Aperture', 'Atom', 'Bell', 'Bot', 'Box', 'Brain', 'Briefcase', 'Calendar', 
  'Camera', 'Cast', 'Cat', 'Check', 'Circle', 'Cloud', 'Code', 'Coffee', 'Command', 'Compass', 
  'Component', 'Cpu', 'Database', 'Disc', 'Divide', 'Dna', 'Dog', 'DollarSign', 'Droplet', 'Eye', 
  'Feather', 'Figma', 'File', 'Filter', 'Flag', 'Flame', 'FlaskConical', 'Flashlight', 'Flower', 'Flower2', 
  'Folder', 'Frown', 'Gamepad', 'Ghost', 'Gift', 'GitBranch', 'GitMerge', 'Globe', 'Grid', 'HardDrive', 
  'Hash', 'Headphones', 'Heart', 'Hexagon', 'Image', 'Inbox', 'Info', 'Key', 'Landmark', 'Layers', 
  'Layout', 'LifeBuoy', 'Link', 'List', 'Lock', 'Mail', 'Map', 'Maximize', 'Meh', 'Menu', 
  'MessageCircle', 'MessageSquare', 'Mic', 'Minimize', 'Minus', 'Monitor', 'Moon', 'MoreHorizontal', 
  'MoreVertical', 'MousePointer', 'Move', 'Music', 'Navigation', 'Network', 'Octagon', 'Package', 'Palette', 
  'Paperclip', 'Pause', 'PenTool', 'Percent', 'Phone', 'PieChart', 'Plane', 'Play', 'PlayCircle', 'Plus', 
  'PlusCircle', 'PlusSquare', 'Pocket', 'Power', 'Printer', 'Radio', 'Rocket', 'ScanFace', 'Server', 
  'Share2', 'Shield', 'ShieldAlert', 'Sparkles', 'Terminal', 'Users', 'Zap'
];

const HOOKS = [
  { id: 'gemini-2.5-flash', name: 'Hyper-Flash', desc: 'Fast, Standard Intelligence', color: 'text-blue-400' },
  { id: 'gemini-3-pro-preview', name: 'DeepLogic Pro', desc: 'Advanced Reasoning & Code', color: 'text-amber-400' },
  { id: 'gemini-2.5-flash-image', name: 'Nano-Banana', desc: 'Visual Generation Capable', color: 'text-pink-400' }
];

// Helper to remove indentation from template literals
const dedent = (str: string) => {
  if (!str) return '';
  const lines = str.split('\n');
  
  // Skip first line if empty (common in template literals)
  let startLine = 0;
  if (lines.length > 0 && lines[0].trim() === '') startLine = 1;
  
  const relevantLines = lines.slice(startLine);
  if (relevantLines.length === 0) return str;

  // Find min indent
  let minIndent = Infinity;
  relevantLines.forEach(line => {
    if (line.trim().length === 0) return;
    const match = line.match(/^(\s+)/);
    const indent = match ? match[1].length : 0;
    if (indent < minIndent) minIndent = indent;
  });

  if (minIndent === Infinity) return str.trim();

  return relevantLines.map(line => {
      // If line is just whitespace, return empty
      if (line.trim().length === 0) return '';
      // Otherwise slice off the min indent
      return line.slice(minIndent);
  }).join('\n').trim();
};

export const Labs: React.FC<LabsProps> = ({ agents, onCreateAgent, initialAgentId }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [igorComment, setIgorComment] = useState("Awaiting your command, Master.");
  
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  // Description state kept for loading existing agents, but UI input removed
  const [description, setDescription] = useState(''); 
  const [basePrompt, setBasePrompt] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Bot');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedHook, setSelectedHook] = useState(HOOKS[0]);
  const [voiceId, setVoiceId] = useState('');

  const loadAgentForEditing = useCallback((agent: AgentProfile) => {
      setEditingId(agent.id);
      setName(agent.name);
      setTitle(agent.title);
      setDescription(agent.description);
      setBasePrompt(dedent(agent.basePrompt));
      setSelectedIcon(agent.icon);
      setSelectedColor(agent.color);
      setVoiceId(agent.voiceId || '');
      
      const hook = HOOKS.find(h => h.id === agent.model) || HOOKS[0];
      setSelectedHook(hook);
  }, []);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setName('');
    setTitle('');
    setDescription('');
    setBasePrompt('');
    setSelectedIcon('Bot');
    setSelectedColor(COLORS[0]);
    setSelectedHook(HOOKS[0]);
    setVoiceId('');
    setIgorComment("Back to the drawing board, Master.");
  }, []);

  // Listen for initialAgentId changes
  useEffect(() => {
    if (initialAgentId && agents[initialAgentId]) {
      loadAgentForEditing(agents[initialAgentId]);
    } else {
      resetForm();
    }
  }, [initialAgentId, agents, loadAgentForEditing, resetForm]);

  // Igor Effects
  useEffect(() => {
    if (editingId) setIgorComment("Ah, re-stitching an existing soul! Excellent!");
    else setIgorComment("A fresh body! Shall we give it a brain?");
  }, [editingId]);

  useEffect(() => {
    if (selectedHook.id === 'gemini-3-pro-preview') setIgorComment("Yesss! The Big Brain! DeepLogic Pro is powerful!");
    else if (selectedHook.id === 'gemini-2.5-flash-image') setIgorComment("Nano-Banana! It will have eyes to see!");
  }, [selectedHook]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !basePrompt) return;

    // If editing, keep original ID. If new, generate ID from name.
    const id = editingId 
        ? editingId as AgentId
        : name.toLowerCase().replace(/\s+/g, '_') as AgentId; 
    
    const newAgent: AgentProfile = {
      id,
      name,
      title: title || 'Specialist Agent',
      // If description was loaded (editing), keep it. If new, default to Title or name.
      description: description || title || `Role: ${name}`, 
      icon: selectedIcon,
      color: selectedColor,
      basePrompt,
      model: selectedHook.id,
      hookName: selectedHook.name,
      voiceId: voiceId.trim() || undefined,
      isCore: editingId ? agents[editingId]?.isCore : false
    };

    onCreateAgent(newAgent);
    setIgorComment("IT'S ALIVE! IT'S ALIVE!");
    if (!editingId) {
        setTimeout(() => {
            resetForm();
        }, 1500);
    }
  };

  const igor = AGENTS[AgentId.IGOR] || { name: 'Igor', color: 'text-lime-600', icon: 'FlaskConical' };
  
  // For preview purposes, fallback to title if description is empty (for new agents)
  const effectiveDescription = description || title || "Agent description will be auto-generated.";

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* IGOR HEADER */}
      <header className="h-16 border-b border-zinc-800 flex items-center px-6 bg-zinc-900/50 backdrop-blur-md justify-between relative overflow-hidden shrink-0 z-20">
        <div className="flex items-center gap-4 z-10">
          <div className={`p-2 rounded-lg border border-zinc-700 bg-zinc-800 ${igor.color}`}>
            <Icon name={igor.icon} className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${igor.color}`}>The Labs</h2>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">ASSISTANT: IGOR</span>
                <span className="text-[10px] text-zinc-400 italic">"{igorComment}"</span>
            </div>
          </div>
        </div>
        
        {/* Dynamic Igor Commentary Bubble (Visual Flourish) */}
        <div className="hidden md:block absolute right-32 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
             <Icon name="Zap" className="w-24 h-24 text-lime-500" />
        </div>

        <div className="flex items-center gap-3">
             {editingId && (
                <button 
                    onClick={resetForm}
                    className="z-10 text-xs text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-800 px-3 py-2 rounded-md border border-zinc-700 transition-colors"
                >
                    <Icon name="X" className="w-3 h-3" />
                    Cancel
                </button>
            )}
             <button 
                onClick={handleSubmit}
                className="z-10 bg-lime-700 hover:bg-lime-600 text-white text-xs font-bold px-4 py-2 rounded-md transition-all shadow-lg shadow-lime-900/20 flex items-center gap-2"
              >
                <Icon name="Zap" className="w-4 h-4" />
                {editingId ? "UPDATE AGENT" : "CREATE AGENT"}
              </button>
        </div>
      </header>

      {/* Main Workspace - Full Width Layout */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-6 h-full">
          
          {/* Top Section: Identity & Config Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Column 1: Identity */}
              <div className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase border-b border-zinc-800 pb-2">1. Identity Matrix</h3>
                  <div className="space-y-3">
                      <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-zinc-500">Name</label>
                          <input 
                            type="text" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., Architect"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-sm focus:border-indigo-500 outline-none"
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-zinc-500">Title</label>
                          <input 
                            type="text" 
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., Senior Engineer"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-sm focus:border-indigo-500 outline-none"
                          />
                      </div>
                      {/* Description input removed as requested */}
                  </div>
              </div>

              {/* Column 2: Visuals & Model */}
              <div className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase border-b border-zinc-800 pb-2">2. Neural Configuration</h3>
                  
                  <div className="space-y-3">
                      <div className="flex gap-2">
                           <div className="flex-1 space-y-1">
                                <label className="text-[10px] uppercase font-bold text-zinc-500">Icon</label>
                                <div className="grid grid-cols-6 gap-1 p-2 bg-zinc-900 border border-zinc-800 rounded h-[84px] overflow-y-auto content-start">
                                    {ICONS.map(iconName => (
                                        <button
                                            key={iconName}
                                            type="button"
                                            onClick={() => setSelectedIcon(iconName)}
                                            className={`flex items-center justify-center p-1.5 rounded hover:bg-zinc-800 ${selectedIcon === iconName ? 'bg-indigo-600 text-white' : 'text-zinc-500'}`}
                                            title={iconName}
                                        >
                                            <Icon name={iconName} className="w-4 h-4" />
                                        </button>
                                    ))}
                                </div>
                           </div>
                           <div className="w-16 space-y-1">
                                <label className="text-[10px] uppercase font-bold text-zinc-500">Color</label>
                                <div className="flex flex-col gap-1 p-2 bg-zinc-900 border border-zinc-800 rounded h-[84px] overflow-y-auto items-center">
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setSelectedColor(c)}
                                            className={`w-4 h-4 rounded-full shrink-0 ${c.replace('text-', 'bg-')} ${selectedColor === c ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'}`}
                                        />
                                    ))}
                                </div>
                           </div>
                      </div>

                      <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 flex justify-between">
                             <span>Neural Hook</span>
                             <span className="text-indigo-400 opacity-60">Model Selection</span>
                          </label>
                          <div className="flex flex-col gap-1">
                             {HOOKS.map(hook => (
                                <button
                                  key={hook.id}
                                  type="button"
                                  onClick={() => setSelectedHook(hook)}
                                  className={`flex items-center justify-between p-2 rounded border transition-all text-left
                                    ${selectedHook.id === hook.id 
                                      ? 'bg-indigo-900/20 border-indigo-500/50' 
                                      : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'}
                                  `}
                                >
                                  <div>
                                    <span className={`text-xs font-bold block ${hook.color}`}>{hook.name}</span>
                                  </div>
                                  {selectedHook.id === hook.id && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
                                </button>
                             ))}
                          </div>
                      </div>

                       <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-zinc-500">ElevenLabs Voice ID</label>
                          <input 
                            type="text" 
                            value={voiceId}
                            onChange={e => setVoiceId(e.target.value)}
                            placeholder="Optional: Voice ID string"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-400 text-xs font-mono focus:border-indigo-500 outline-none"
                          />
                      </div>
                  </div>
              </div>

              {/* Column 3: Preview */}
              <div className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase border-b border-zinc-800 pb-2">3. Visual Validation</h3>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4 items-center text-center relative overflow-hidden shadow-lg h-full justify-center">
                        <div className={`absolute top-0 right-0 px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-zinc-800/50 rounded-bl-lg ${selectedHook.color}`}>
                        {selectedHook.name}
                        </div>
                        <div className={`w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center ${selectedColor} shadow-inner`}>
                            <Icon name={selectedIcon} className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className={`text-lg font-bold ${selectedColor}`}>{name || "Agent Name"}</h2>
                            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{title || "Agent Title"}</p>
                        </div>
                        <div className="bg-zinc-950/50 p-3 rounded-lg w-full text-left border border-zinc-800/50">
                            <p className="text-zinc-400 text-xs line-clamp-3 leading-relaxed text-center italic">
                                "{effectiveDescription}"
                            </p>
                        </div>
                    </div>
              </div>
          </div>

          {/* Bottom Section: System Instructions (Full Width) */}
          <div className="flex-1 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase">4. System Prompt (The Soul)</h3>
                  <span className="text-[10px] text-zinc-600 font-mono">Use Markdown formatting.</span>
              </div>
              <div className="flex-1 relative">
                  <textarea 
                    value={basePrompt}
                    onChange={e => setBasePrompt(e.target.value)}
                    placeholder="Define the agent's personality, goals, and constraints here..."
                    className="absolute inset-0 w-full h-full bg-zinc-900 border border-zinc-800 rounded-md p-4 text-zinc-300 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-900 outline-none resize-none leading-relaxed"
                    spellCheck={false}
                  />
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};