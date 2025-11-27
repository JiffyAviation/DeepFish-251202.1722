import React, { useState, useEffect } from 'react';
import { AgentProfile, AgentId } from '../types';
import { AGENTS } from '../constants'; // Import agents for Igor lookup
import { Icon } from './Icon';

interface LabsProps {
  agents: Record<string, AgentProfile>;
  onCreateAgent: (agent: AgentProfile) => void;
  agentToEdit: AgentProfile | null;
}

const COLORS = [
  'text-red-400', 'text-orange-400', 'text-amber-400', 'text-yellow-400', 
  'text-lime-400', 'text-green-400', 'text-emerald-400', 'text-teal-400', 
  'text-cyan-400', 'text-sky-400', 'text-blue-400', 'text-indigo-400', 
  'text-violet-400', 'text-purple-400', 'text-fuchsia-400', 'text-pink-400', 
  'text-rose-400'
];

const ICONS = ['Bot', 'Cpu', 'Ghost', 'ScanFace', 'Sparkles', 'Zap', 'Brain', 'Code', 'Database', 'Globe', 'Anchor', 'Aperture', 'Atom', 'Box', 'Briefcase', 'Camera', 'Cast', 'Circle', 'Cloud', 'Coffee', 'Command', 'Compass', 'Component', 'Disc', 'Divide', 'Dna', 'DollarSign', 'Droplet', 'Eye', 'Feather', 'Figma', 'File', 'Filter', 'Flag', 'Flame', 'Flashlight', 'Flower', 'Folder', 'Frown', 'Gamepad', 'Gift', 'GitBranch', 'Grid', 'HardDrive', 'Hash', 'Headphones', 'Heart', 'Hexagon', 'Image', 'Inbox', 'Info', 'Key', 'Layers', 'Layout', 'LifeBuoy', 'Link', 'List', 'Lock', 'Mail', 'Map', 'Maximize', 'Meh', 'Menu', 'MessageCircle', 'MessageSquare', 'Mic', 'Minimize', 'Minus', 'Monitor', 'Moon', 'MoreHorizontal', 'MoreVertical', 'MousePointer', 'Move', 'Music', 'Navigation', 'Network', 'Octagon', 'Package', 'Paperclip', 'Pause', 'PenTool', 'Percent', 'Phone', 'PieChart', 'Play', 'PlayCircle', 'Plus', 'PlusCircle', 'PlusSquare', 'Pocket', 'Power', 'Printer', 'Radio', 'ShieldAlert', 'Share2', 'Terminal', 'Users', 'Landmark', 'Palette', 'GitMerge', 'FlaskConical', 'ClipboardCheck', 'Package'];

const HOOKS = [
  { id: 'gemini-2.5-flash', name: 'Hyper-Flash', desc: 'Standard Intelligence', color: 'text-blue-400' },
  { id: 'gemini-3-pro-preview', name: 'DeepLogic Pro', desc: 'Reasoning & Code', color: 'text-amber-400' },
  { id: 'gemini-2.5-flash-image', name: 'Nano-Banana', desc: 'Vision & Imaging', color: 'text-pink-400' }
];

export const Labs: React.FC<LabsProps> = ({ agents, onCreateAgent, agentToEdit }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [igorComment, setIgorComment] = useState("Awaiting command.");
  
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrompt, setBasePrompt] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Bot');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedHook, setSelectedHook] = useState(HOOKS[0]);

  // Sync prop to local state
  useEffect(() => {
      if (agentToEdit) {
          loadAgentForEditing(agentToEdit);
      } else {
          resetForm();
      }
  }, [agentToEdit]);

  // Igor Effects
  useEffect(() => {
    if (editingId) setIgorComment("Modifying existing neural pathways.");
    else setIgorComment("Initializing fresh neural substrate.");
  }, [editingId]);

  useEffect(() => {
    if (selectedHook.id === 'gemini-3-pro-preview') setIgorComment("Logic Core selected. High compute.");
    else if (selectedHook.id === 'gemini-2.5-flash-image') setIgorComment("Visual Cortex attached.");
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
    setIgorComment("Standby.");
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
    setIgorComment("CONSTRUCT ACTIVE.");
    setTimeout(() => {
        resetForm();
    }, 1500);
  };

  const igor = AGENTS[AgentId.IGOR] || { name: 'Igor', color: 'text-lime-600', icon: 'FlaskConical' };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950/90 backdrop-blur-xl overflow-hidden">
      {/* IGOR HEADER */}
      <header className="h-16 border-b border-white/5 flex items-center px-8 bg-zinc-900/50 justify-between relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <div className={`p-2 rounded-md border border-zinc-700 bg-zinc-800 ${igor.color}`}>
            <Icon name={igor.icon} className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-sm font-bold tracking-widest uppercase text-white`}>Bio-Digital Laboratory</h2>
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono ${igor.color}`}>STATUS: {igorComment}</span>
            </div>
          </div>
        </div>
        
        {editingId && (
            <button 
                onClick={resetForm}
                className="z-10 text-[10px] uppercase font-bold text-red-400 hover:text-red-300 flex items-center gap-2 bg-red-900/10 px-3 py-1.5 rounded border border-red-900/30 hover:bg-red-900/20 transition-colors"
            >
                <Icon name="X" className="w-3 h-3" />
                Abort Modification
            </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-12">
          
          {/* Form - Blueprint Style */}
          <div className="space-y-6">
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                   <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                       {editingId ? `// RE-CALIBRATING: ${name}` : '// INITIALIZING NEW CONSTRUCT'}
                   </h3>
                   <span className="text-[10px] text-zinc-700 font-mono">SYS.VER.2.1</span>
               </div>
               <div className="h-px w-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-transparent"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Identity Designation</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Architect"
                  className="w-full bg-zinc-900/50 border border-zinc-700 rounded-sm p-3 text-zinc-100 focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900 transition-colors placeholder-zinc-700 font-mono text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Functional Role</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Senior Engineer"
                    className="w-full bg-zinc-900/50 border border-zinc-700 rounded-sm p-3 text-zinc-100 focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900 transition-colors placeholder-zinc-700 font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Signature Color</label>
                    <div className="flex flex-wrap gap-2 p-2.5 bg-zinc-900/50 border border-zinc-700 rounded-sm h-[46px] overflow-y-auto">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setSelectedColor(c)}
                                className={`w-3 h-3 rounded-sm ${c.replace('text-', 'bg-')} ${selectedColor === c ? 'ring-2 ring-white scale-110' : 'opacity-40 hover:opacity-100'} transition-all`}
                            />
                        ))}
                    </div>
                </div>
              </div>

              {/* API Hook Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider flex justify-between">
                   <span>Neural Hook (Model Architecture)</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {HOOKS.map(hook => (
                    <button
                      key={hook.id}
                      type="button"
                      onClick={() => setSelectedHook(hook)}
                      className={`flex items-center justify-between p-3 rounded-sm border transition-all relative overflow-hidden group
                        ${selectedHook.id === hook.id 
                          ? 'bg-indigo-900/10 border-indigo-500/40 ring-1 ring-indigo-500/20' 
                          : 'bg-zinc-900/30 border-zinc-800 hover:bg-zinc-900'}
                      `}
                    >
                      <div className="flex flex-col items-start z-10">
                        <span className={`text-xs font-bold font-mono ${hook.color}`}>{hook.name}</span>
                        <span className="text-[10px] text-zinc-500">{hook.desc}</span>
                      </div>
                      {selectedHook.id === hook.id && (
                          <div className={`w-2 h-2 rounded-full ${hook.color.replace('text-', 'bg-')} shadow-[0_0_5px_currentColor]`}></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Mission Parameters</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief summary..."
                  className="w-full bg-zinc-900/50 border border-zinc-700 rounded-sm p-3 text-zinc-100 focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900 transition-colors placeholder-zinc-700 font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Visual Iconography</label>
                 <div className="grid grid-cols-8 gap-2 p-3 bg-zinc-900/50 border border-zinc-700 rounded-sm h-[120px] overflow-y-auto">
                    {ICONS.map(iconName => (
                        <button
                            key={iconName}
                            type="button"
                            onClick={() => setSelectedIcon(iconName)}
                            className={`flex items-center justify-center p-1.5 rounded hover:bg-zinc-800 transition-colors ${selectedIcon === iconName ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-600'}`}
                            title={iconName}
                        >
                            <Icon name={iconName} className="w-4 h-4" />
                        </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Kernel Logic (System Prompt)</label>
                <textarea 
                  value={basePrompt}
                  onChange={e => setBasePrompt(e.target.value)}
                  placeholder="Define behavior parameters..."
                  className="w-full bg-zinc-900/50 border border-zinc-700 rounded-sm p-3 text-zinc-200 h-32 resize-none focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900 transition-colors font-mono text-xs leading-relaxed"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-zinc-100 hover:bg-white text-black font-bold py-3 rounded-sm transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                <Icon name="Zap" className="w-4 h-4" />
                {editingId ? "Upload New Config" : "Activate Construct"}
              </button>

            </form>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
             <div className="space-y-2">
               <div className="flex items-center justify-between">
                   <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                       // SPECIMEN PREVIEW
                   </h3>
               </div>
               <div className="h-px w-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-transparent"></div>
            </div>
            
            {/* The Card - ID Badge Style */}
            <div className="bg-zinc-950 rounded-lg p-1 shadow-2xl border border-zinc-800 relative overflow-hidden group ring-1 ring-white/5 max-w-sm mx-auto">
                {/* Tech lines */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-50"></div>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                <div className="bg-zinc-900/90 backdrop-blur-sm rounded-md p-6 flex flex-col items-center text-center relative z-10 h-full">
                    
                    {/* Top Labels */}
                    <div className="w-full flex justify-between items-start mb-6">
                        <div className="font-mono text-[9px] text-zinc-600 flex flex-col items-start">
                            <span>ID: {editingId ? editingId.toUpperCase() : 'UNDEFINED'}</span>
                            <span>CLASS: {selectedHook.name.toUpperCase()}</span>
                        </div>
                        <div className="w-8 h-8 opacity-20">
                             <Icon name="QrCode" className="w-full h-full text-white" />
                        </div>
                    </div>

                    {/* Avatar */}
                    <div className="relative mb-6">
                        <div className={`w-20 h-20 rounded-md flex items-center justify-center bg-zinc-950 border border-zinc-700 ${selectedColor} shadow-lg relative z-10`}>
                             <Icon name={selectedIcon} className="w-8 h-8" />
                        </div>
                        {/* Glow under */}
                        <div className={`absolute inset-0 bg-current blur-xl opacity-20 ${selectedColor}`}></div>
                    </div>
                    
                    <h2 className={`text-2xl font-bold mb-1 tracking-tight ${selectedColor}`}>{name || "Construct Name"}</h2>
                    <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-6">{title || "Function"}</p>
                    
                    {/* Stats/Details */}
                    <div className="w-full space-y-2 border-t border-dashed border-zinc-800 pt-4">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-zinc-600">STATUS</span>
                            <span className="text-emerald-500">ONLINE</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-zinc-600">MEMORY</span>
                            <span className="text-zinc-400">128TB</span>
                        </div>
                        <p className="text-zinc-500 text-xs leading-snug pt-2 text-left">{description || "Pending input..."}</p>
                    </div>
                </div>
                {/* Bottom Bar */}
                <div className="h-2 w-full bg-zinc-800 mt-1 flex">
                    <div className={`w-1/3 h-full ${selectedColor.replace('text-', 'bg-')} opacity-50`}></div>
                    <div className="w-1/3 h-full bg-zinc-700 opacity-30"></div>
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    Available Units (Select to Tune)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.values(agents) as AgentProfile[]).map(agent => (
                        <button 
                            key={agent.id} 
                            onClick={() => loadAgentForEditing(agent)}
                            className={`flex items-center gap-3 p-2 rounded-sm border transition-all text-left relative group
                                ${editingId === agent.id 
                                    ? 'bg-zinc-800 border-zinc-600' 
                                    : 'bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700'}
                            `}
                        >
                             <div className={`w-8 h-8 rounded-sm bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 ${agent.color}`}>
                                 <Icon name={agent.icon} className="w-4 h-4" />
                             </div>
                             <div className="flex flex-col overflow-hidden">
                                 <span className="text-xs font-bold text-zinc-300 truncate group-hover:text-white transition-colors">{agent.name}</span>
                                 <span className="text-[9px] text-zinc-600 truncate font-mono">{agent.hookName || "Standard"}</span>
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