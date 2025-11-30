
export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  agentId?: AgentId; // The specific agent speaking (e.g., Creative, Skillz)
  isError?: boolean;
  isToolCall?: boolean; // Visual indicator that this was a system action
  image?: string; // Base64 image data
}

export enum AgentId {
  MEI = 'mei', // Formerly Mid
  VESPER = 'vesper',
  HR = 'hr',
  ABACUS = 'abacus',
  SKILLZ = 'skillz',
  MCP = 'mcp',
  SLASH = 'slash',
  SUBS = 'subs',
  CREATIVE = 'creative', // Hanna
  SOCIAL = 'social', // Sally
  QC = 'qc',
  SHIPPING = 'shipping',
  IT = 'it',
  CALL_CENTER = 'call_center',
  LUNCHROOM = 'lunchroom',
  THE_ORACLE = 'the_oracle', // Old Man Root
  ROOT = 'root', // The actual Root character
  ORACLE = 'oracle', // The Abstract Architect
  SKIPPY = 'skippy',
  IGOR = 'igor'
}

export interface AgentProfile {
  id: AgentId;
  name: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  isCore?: boolean; // If true, always visible in roster
  model?: string; // The underlying model name (conceptually)
  hookName?: string; // Marketing name for the API hook (e.g., "DeepLogic Pro")
  voiceId?: string; // ElevenLabs Voice ID
  basePrompt: string; // The immutable core identity
  customInstructions?: string; // The mutable layer managed by HR
}

export interface Room {
  id: string;
  name: string;
  agentId: AgentId; // The primary agent running this room (or 'abacus' for boardroom)
  description: string;
  themeColor: string;
  isBoardroom?: boolean;
  isLunchroom?: boolean;
}

export interface Memory {
  id: string;
  content: string;
  category: 'actionable' | 'memory' | 'reference' | 'personality';
  triggerContext?: string; // e.g., "visiting parents", "start of q3"
  timestamp: Date;
}

export interface ExecutiveMemo {
  id: string;
  senderId: AgentId;
  subject: string;
  body: string;
  timestamp: Date;
  isRead: boolean;
  messages?: MemoMessage[]; // Thread history
  status?: 'active' | 'archived' | 'deleted';
}

export interface MemoMessage {
    id: string;
    role: 'ceo' | 'agent';
    text: string;
    timestamp: Date;
}

// Tool Definitions
export interface DelegateTaskArgs {
  target_agent_id: string;
  task_description: string;
  context_summary: string;
}

export interface UpdateAgentArgs {
  target_agent_id: string;
  new_instructions: string;
  update_reason: string;
}

export interface StoreMemoryArgs {
  content: string;
  category: 'actionable' | 'memory' | 'reference' | 'personality';
  trigger_context?: string;
}

export interface RaffleActionArgs {
  action: 'add_ticket' | 'spin_gacha';
}

export interface SendMemoArgs {
  subject: string;
  body: string;
}