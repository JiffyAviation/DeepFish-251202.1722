
import React, { useState, useEffect } from 'react';
import { AgentProfile, AgentId } from '../types';
import { AGENTS } from '../constants'; // Import agents for Igor lookup
import { Icon } from './Icon';

interface LabsProps {
  agents: Record<string, AgentProfile>;
  onCreateAgent: (agent: AgentProfile) => void;
}

const COLORS = [
  'text-red-400', 'text-orange-400', 'text-amber-400', 'text-yellow-400', 
  'text-lime-400', 'text-green-400', 'text-emerald-400', 'text-teal-400', 
  'text-cyan-400', 'text-sky-400', 'text-blue-400', 'text-indigo-400', 
  'text-violet-400', 'text-purple-400', 'text-fuchsia-400', 'text-pink-400', 
  'text-rose-400'
];

const ICONS = ['Bot', 'Cpu', 'Ghost', 'ScanFace', 'Sparkles', 'Zap', 'Brain', 'Code', 'Database', 'Globe', 'Anchor', 'Aperture', 'Atom', 'Box', 'Briefcase', 'Camera', 'Cast', 'Circle', 'Cloud', 'Coffee', 'Command', 'Compass', 'Component', 'Disc', 'Divide', 'Dna', 'DollarSign', 'Droplet', 'Eye', 'Feather', 'Figma', 'File', 'Filter', 'Flag', 'Flame', 'Flashlight', 'Flower', 'Folder', 'Frown', 'Gamepad', 'Gift', 'GitBranch', 'Grid', 'HardDrive', 'Hash', 'Headphones', 'Heart', 'Hexagon', 'Image', 'Inbox', 'Info', 'Key', 'Layers', 'Layout', 'LifeBuoy', 'Link', 'List', 'Lock', 'Mail', 'Map', 'Maximize', 'Meh', 'Menu', 'MessageCircle', 'MessageSquare', 'Mic', 'Minimize', 'Minus', 'Monitor', 'Moon', 'MoreHorizontal', 'MoreVertical', 'MousePointer', 'Move', 'Music', 'Navigation', 'Network', 'Octagon', 'Package', 'Paperclip', 'Pause', 'PenTool', 'Percent', 'Phone', 'PieChart', 'Play', 'PlayCircle', 'Plus', 'PlusCircle', 'PlusSquare', 'Pocket', 'Power', 'Printer', 'Radio', 'ShieldAlert', 'Share2', 'Terminal', 'Users', 'Landmark', 'Palette', 'GitMerge', 'FlaskConical'];

const HOOKS = [
  { id: 'gemini-2.5-flash', name: 'Hyper-Flash', desc: 'Fast, Standard Intelligence', color: 'text-blue-400' },
  { id: 'gemini-3-pro-preview', name: 'DeepLogic Pro', desc: 'Advanced Reasoning & Code', color: 'text-amber-400' },
  { id: 'gemini-2.5-flash-image', name: 'Nano-Banana', desc: 'Visual Generation Capable', color: 'text-pink-400' }
];

export const Labs: React.FC<LabsProps> = ({ agents, onCreateAgent }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [igorComment, setIgorComment] = useState("Awaiting your command, Master.");
  
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrompt, setBasePrompt] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Bot');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedHook, setSelectedHook] = useState(HOOKS[0]);

  // Igor Effects
  useEffect(() => {
    if (editingId) setIgorComment("Ah, re-stitching an existing soul! Excellent!");
    else setIgorComment("A fresh body! Shall we give it a brain?");
  }, [editingId]);

  useEffect(() => {
    if (selectedHook.id === 'gemini-3-pro-preview') setIgorComment("Yesss! The Big Brain! DeepLogic Pro is powerful!");
    else if (selectedHook.id === 'gemini-2.5-flash-image') setIgorComment("Nano-Banana! It will have eyes to see!");
  }, [selectedHook]);

  const loadAgentForEditing = (agent: AgentProfile) => {
      setEditingId(agent.id);
      setName(agent.name);
      setTitle(agent.title);
      setDescription(agent.description);
      setBasePrompt(agent.basePrompt);
      setSelectedIcon(agent.icon);
      setSelectedColor(agent.color);
      
      const hook = HOOKS.find(h => h.id === agent.model) || HOOKS[0];
      setSelectedHook(hook);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setTitle('');
    setDescription('');
    setBasePrompt('');
    setSelectedIcon('Bot');
    setSelectedColor(COLORS[0]);
    setSelectedHook(HOOKS[0]);
    setIgorComment("Back to the drawing board, Master.");
  };

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
      description: description || 'A custom agent created in The Labs.',
      icon: selectedIcon,
      color: selectedColor,
      basePrompt,
      model: selectedHook.id,
      hookName: selectedHook.name,
      isCore: editingId ? agents[editingId]?.isCore : false
    };

    onCreateAgent(newAgent);
    setIgorComment("IT'S ALIVE! IT'S ALIVE!");
    setTimeout(() => {
        resetForm();
    }, 1500);
  };

  const igor = AGENTS[AgentId.IGOR] || { name: 'Igor', color: 'text-lime-600', icon: 'FlaskConical' };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* IGOR HEADER */}
      <header className="h-20 border-b border-zinc-800 flex items-center px-6 bg-zinc-900/50 backdrop-blur-md justify-between relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <div className={`p-3 rounded-xl border border-zinc-700 bg-zinc-800 ${igor.color}`}>
            <Icon name={igor.icon} className="w-8 h-8" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${igor.color}`}>The Labs</h2>
            <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">ASSISTANT: IGOR</span>
                <span className="text-xs text-zinc-400 italic">"{igorComment}"</span>
            </div>
          </div>
        </div>
        
        {/* Dynamic Igor Commentary Bubble (Visual Flourish) */}
        <div className="hidden md:block absolute right-32 top-1/2 -translate-y-1/2 opacity-10">
             <Icon name="Zap" className="w-32 h-32 text-lime-500" />
        </div>

        {editingId && (
            <button 
                onClick={resetForm}
                className="z-10 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-900/20 px-3 py-1.5 rounded-full border border-red-900/50"
            >
                <Icon name="X" className="w-3 h-3" />
                Cancel
            </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Form */}
          <div className="space-y-8">
            <div className="space-y-4">
               <h3 className="text-xl font-bold text-white">
                   {editingId ? `Tuning: ${name}` : 'Construct New Agent'}
               </h3>
               <p className="text-zinc-400 text-sm">
                   {editingId 
                    ? "Adjust the personality, logic, or neural hook of this active agent."
                    : "Define the core identity, neural hook, and purpose of a new specialist."}
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-zinc-500">Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Architect, Reviewer"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-3 text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-zinc-500">Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Senior Engineer"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-3 text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-zinc-500">Color</label>
                    <div className="flex flex-wrap gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-md h-[50px] overflow-y-auto">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setSelectedColor(c)}
                                className={`w-4 h-4 rounded-full ${c.replace('text-', 'bg-')} ${selectedColor === c ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'}`}
                            />
                        ))}
                    </div>
                </div>
              </div>

              {/* API Hook Selector */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-zinc-500 flex justify-between">
                   <span>Neural Hook (API Model)</span>
                   <span className="text-indigo-400">Premium Feature</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {HOOKS.map(hook => (
                    <button
                      key={hook.id}
                      type="button"
                      onClick={() => setSelectedHook(hook)}
                      className={`flex items-center justify-between p-3 rounded-md border transition-all
                        ${selectedHook.id === hook.id 
                          ? 'bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500' 
                          : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'}
                      `}
                    >
                      <div className="flex flex-col items-start">
                        <span className={`text-sm font-bold ${hook.color}`}>{hook.name}</span>
                        <span className="text-[10px] text-zinc-500">{hook.desc}</span>
                      </div>
                      {selectedHook.id === hook.id && <Icon name="Check" className="w-4 h-4 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-zinc-500">Description</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Short summary of their role..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-3 text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                 <label className="text-xs uppercase font-bold text-zinc-500">Icon</label>
                 <div className="grid grid-cols-8 gap-2 p-4 bg-zinc-900 border border-zinc-800 rounded-md h-[150px] overflow-y-auto">
                    {ICONS.map(iconName => (
                        <button
                            key={iconName}
                            type="button"
                            onClick={() => setSelectedIcon(iconName)}
                            className={`flex items-center justify-center p-2 rounded hover:bg-zinc-800 ${selectedIcon === iconName ? 'bg-indigo-600 text-white' : 'text-zinc-500'}`}
                            title={iconName}
                        >
                            <Icon name={iconName} className="w-5 h-5" />
                        </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-zinc-500">System Instructions (Base Prompt)</label>
                <textarea 
                  value={basePrompt}
                  onChange={e => setBasePrompt(e.target.value)}
                  placeholder="You are X. Your goal is Y. You speak like Z..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-3 text-zinc-200 h-40 resize-none focus:outline-none focus:border-indigo-500 transition-colors font-mono text-sm"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-lime-700 hover:bg-lime-600 text-white font-bold py-3 rounded-md transition-all shadow-lg shadow-lime-900/20 flex items-center justify-center gap-2"
              >
                <Icon name="Zap" className="w-5 h-5" />
                {editingId ? "Update Configuration" : "THROW THE SWITCH!"}
              </button>

            </form>
          </div>

          {/* Preview */}
          <div className="space-y-8">
             <div className="space-y-4">
               <h3 className="text-xl font-bold text-white">Specimen Preview</h3>
               <p className="text-zinc-400 text-sm">Visual confirmation of the entity.</p>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-6 items-center text-center relative overflow-hidden shadow-2xl">
                <div className={`absolute top-0 right-0 p-2 text-[10px] font-bold uppercase tracking-wider bg-zinc-800/50 rounded-bl-xl ${selectedHook.color}`}>
                  {selectedHook.name}
                </div>
                <div className={`w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center ${selectedColor} shadow-inner`}>
                    <Icon name={selectedIcon} className="w-12 h-12" />
                </div>
                <div>
                    <h2 className={`text-2xl font-bold ${selectedColor}`}>{name || "Agent Name"}</h2>
                    <p className="text-zinc-400 font-medium">{title || "Agent Title"}</p>
                </div>
                <div className="bg-zinc-950 p-4 rounded-lg w-full text-left border border-zinc-800/50">
                    <p className="text-sm text-zinc-500 italic mb-2">Description</p>
                    <p className="text-zinc-300 text-sm">{description || "No description provided."}</p>
                </div>
                 <div className="bg-zinc-950 p-4 rounded-lg w-full text-left border border-zinc-800/50">
                    <p className="text-sm text-zinc-500 italic mb-2">System Prompt</p>
                    <p className="text-zinc-400 font-mono text-xs whitespace-pre-wrap">{basePrompt || "..."}</p>
                </div>
            </div>

            <div className="space-y-4 pt-8">
                <h3 className="text-xl font-bold text-white">Active Roster (Select to Tune)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(Object.values(agents) as AgentProfile[]).map(agent => (
                        <button 
                            key={agent.id} 
                            onClick={() => loadAgentForEditing(agent)}
                            className={`flex items-center gap-3 p-3 rounded border transition-all text-left
                                ${editingId === agent.id 
                                    ? 'bg-lime-900/20 border-lime-500 ring-1 ring-lime-500' 
                                    : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700'}
                            `}
                        >
                             {agent.hookName && (
                               <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500"></div>
                             )}
                             <div className={`w-8 h-8 rounded bg-zinc-800 flex items-center justify-center shrink-0 ${agent.color}`}>
                                 <Icon name={agent.icon} className="w-4 h-4" />
                             </div>
                             <div className="flex flex-col overflow-hidden">
                                 <span className="text-sm font-semibold text-zinc-300 truncate">{agent.name}</span>
                                 <span className="text-[10px] text-zinc-500 truncate">{agent.hookName || "Standard"}</span>
                             </div>
                        </button>
                    ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
