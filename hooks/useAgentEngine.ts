
import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentId, Message, Role, Room, AgentProfile, UpdateAgentArgs, Memory, StoreMemoryArgs, RaffleActionArgs, ExecutiveMemo, SendMemoArgs, MemoMessage, DelegateTaskArgs } from '../types';
import { sendMessageToAgent, runSpecialistAgent } from '../services/geminiService';
import { playTextToSpeech } from '../services/elevenLabs';
import { ORACLE_OVERRIDE_PROMPT, COMMON_CONTEXT } from '../constants';

interface UseAgentEngineProps {
  initialAgents: Record<string, AgentProfile>;
  initialRooms: Room[];
}

export const useAgentEngine = ({ initialAgents, initialRooms }: UseAgentEngineProps) => {
  // --- STATE ---
  const [agents, setAgents] = useState<Record<string, AgentProfile>>(initialAgents);
  const [globalLog, setGlobalLog] = useState<string[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  
  // Asset Registry (The Asset Bus)
  // Maps specific token IDs (e.g. "ASSET_123") to Base64 strings
  const assetRegistry = useRef<Record<string, string>>({});
  
  // Mailroom State
  const [inbox, setInbox] = useState<ExecutiveMemo[]>([]);

  // Game State
  const [raffleTickets, setRaffleTickets] = useState(0);
  const [lastTicketDate, setLastTicketDate] = useState<string | null>(null);

  // Navigation
  const [activeRoomId, setActiveRoomId] = useState<string>(initialRooms[0].id);
  const [tempActiveAgentId, setTempActiveAgentId] = useState<string | null>(null);
  const [isLabsOpen, setIsLabsOpen] = useState(false);
  
  // Oracle Override State
  const [isOracleMode, setIsOracleMode] = useState(false);

  // Chat History
  const [roomMessages, setRoomMessages] = useState<Record<string, Message[]>>({
    [initialRooms[0].id]: [],
    [initialRooms[1].id]: [],
    [initialRooms[2].id]: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // --- COMPUTED ---
  const activeRoom = initialRooms.find(r => r.id === activeRoomId) || initialRooms[0];
  const activeAgentId = tempActiveAgentId || activeRoom.agentId;
  const activeAgent = agents[activeAgentId];
  const historyKey = tempActiveAgentId ? tempActiveAgentId : activeRoomId;
  const messages = roomMessages[historyKey] || [];

  // --- STARTUP EFFECTS (Mailroom Simulation) ---
  useEffect(() => {
    // Prime the "Server Report" memo from IT (Simulation of work done 'overnight')
    const hasServerReport = inbox.some(m => m.subject.includes("Server Infrastructure"));
    if (!hasServerReport) {
        const timer = setTimeout(() => {
            const serverReport: ExecutiveMemo = {
                id: "memo_001",
                senderId: AgentId.IT,
                subject: "Server Infrastructure 101 (Requested)",
                body: `
**To:** The CEO
**From:** IT Department
**Re:** Servers (Why, When, How)

Per your request for a "half-page summary":

### 1. Why do we need a server?
Currently, DeepFish lives in your browser. If you close the laptop, we die.
A **Server** is just a computer that never sleeps.
- **UseCase:** You want "Social Sally" to post to Twitter at 3 AM.
- **UseCase:** You want agents to email you real reports while you are offline.

### 2. When do we need it?
**NOW.** If you want "Asynchronous Work" (agents working while you are away), we need a persistent environment.

### 3. How do we get one? (Rent vs Buy)
**Never Buy.** Hardware fails.
**We Rent.** We use "Cloud Computing".
- **Recommendation:** A small VPS (Virtual Private Server) or Google Cloud Run.
- **Cost:** ~$5-10/month.
- **Action:** I can deploy the "DeepFish Core" to a container if you authorize the budget.

Signed,
IT Dept (Backend Engineering)
                `,
                timestamp: new Date(Date.now() - 10000000), // Sent "in the past"
                isRead: false,
                status: 'active',
                messages: []
            };
            setInbox(prev => [serverReport, ...prev]);
            appendGlobalLog("INCOMING MEMO: Server Report from IT");
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const hasDeploymentMemo = inbox.some(m => m.subject.includes("DFAIS"));
    if (!hasDeploymentMemo) {
         const timer = setTimeout(() => {
            const deploymentMemo: ExecutiveMemo = {
                id: "memo_002",
                senderId: AgentId.IT,
                subject: "Project DFAIS: Deployment Strategy",
                body: `
**To:** The Architect (CEO)
**From:** IT Department
**Re:** Taking "DFAIS" Live (Static URL)

Boss, I ran the numbers for the "Deface" (DFAIS) global rollout. You mentioned a $10/mo budget. We can do a lot with that.

### The Problem
Right now, we live in your browser's "LocalStorage".
- **Result:** If you switch to your Tablet/Phone to use Root Access, **we won't be there**. The brain is trapped on your Desktop.

### The Solution (The Stack)
To have a "Whole-Screen App" accessible via a static URL on any device, we need two things:

1. **The Host (Frontend):** 
   - **Vercel** or **Netlify**. 
   - **Cost:** Free (Hobby Tier) or $20/mo (Pro).
   - **Benefit:** Gives us \`https://deepfish.ai\` (if we buy the domain).

2. **The Synapse (Database):**
   - We need a cloud database so Mei remembers you on your Phone *and* your PC.
   - **Supabase** (Postgres) or **Firebase**.
   - **Cost:** Free tiers are generous.

### The Plan
1. Export this code from Google AI Studio.
2. Push to a GitHub Repository (Private).
3. Connect GitHub to Vercel.
4. Buy Domain (~$12/yr).

**Ready to execute on your command.**

- IT
                `,
                timestamp: new Date(),
                isRead: false,
                status: 'active',
                messages: []
            };
            setInbox(prev => [deploymentMemo, ...prev]);
            appendGlobalLog("INCOMING MEMO: Project DFAIS Strategy from IT");
         }, 8000);
         return () => clearTimeout(timer);
    }
  }, [inbox.length]);

  // --- ACTIONS ---

  const appendMessage = useCallback((key: string, msg: Message) => {
    setRoomMessages(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), msg]
    }));
  }, []);

  const appendGlobalLog = useCallback((entry: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setGlobalLog(prev => [`[${timestamp}] ${entry}`, ...prev].slice(50));
  }, []);

  const updateAgentProfile = useCallback((targetId: string, newInstructions: string) => {
    setAgents(prev => ({
      ...prev,
      [targetId]: {
        ...prev[targetId],
        customInstructions: newInstructions
      }
    }));
  }, []);

  const createNewAgent = useCallback((agent: AgentProfile) => {
    setAgents(prev => ({
      ...prev,
      [agent.id]: agent
    }));
    appendGlobalLog(`New Agent Created in Labs: ${agent.name} (${agent.title})`);
  }, [appendGlobalLog]);

  const addMemory = useCallback((content: string, category: Memory['category'], triggerContext?: string) => {
    const newMemory: Memory = {
      id: crypto.randomUUID(),
      content,
      category,
      triggerContext,
      timestamp: new Date()
    };
    setMemories(prev => [newMemory, ...prev]);
  }, []);

  const sendMemo = useCallback((senderId: string, subject: string, body: string) => {
      setInbox(prev => {
          const existing = prev.find(m => m.subject === subject && m.senderId === senderId);
          if (existing) {
               const newMessage: MemoMessage = {
                  id: crypto.randomUUID(),
                  role: 'agent',
                  text: body,
                  timestamp: new Date()
              };
              return prev.map(m => m.id === existing.id ? { 
                  ...m, 
                  isRead: false, 
                  timestamp: new Date(),
                  messages: [...(m.messages || []), newMessage]
              } : m);
          } else {
              const newMemo: ExecutiveMemo = {
                id: crypto.randomUUID(),
                senderId: senderId as AgentId,
                subject,
                body,
                timestamp: new Date(),
                isRead: false,
                status: 'active',
                messages: []
            };
            appendGlobalLog(`MEMO RECEIVED from ${senderId}: ${subject}`);
            return [newMemo, ...prev];
          }
      });
  }, [appendGlobalLog]);

  const markMemoAsRead = useCallback((memoId: string) => {
      setInbox(prev => prev.map(m => m.id === memoId ? { ...m, isRead: true } : m));
  }, []);

  const setMemoStatus = useCallback((memoId: string, status: 'active' | 'archived' | 'deleted') => {
      setInbox(prev => prev.map(m => m.id === memoId ? { ...m, status } : m));
  }, []);

  const replyToMemo = useCallback(async (memoId: string, text: string) => {
      const userMsg: MemoMessage = {
          id: crypto.randomUUID(),
          role: 'ceo',
          text,
          timestamp: new Date()
      };

      let targetAgentId: string = AgentId.MEI;
      let subject = "";
      let history: MemoMessage[] = [];

      setInbox(prev => prev.map(m => {
          if (m.id === memoId) {
              targetAgentId = m.senderId;
              subject = m.subject;
              history = m.messages || [];
              return {
                  ...m,
                  messages: [...(m.messages || []), userMsg]
              };
          }
          return m;
      }));

      if (targetAgentId === AgentId.ORACLE) return;

      setTimeout(async () => {
          const agent = agents[targetAgentId];
          const prompt = `
            You are ${agent.name}. 
            REPLYING TO MEMO: ${subject}
            LATEST CEO MSG: ${text}
            Write a concise reply.
          `;

          try {
              const result = await sendMessageToAgent([], prompt, agent.model || 'gemini-2.5-flash', targetAgentId);
              
              const agentMsg: MemoMessage = {
                  id: crypto.randomUUID(),
                  role: 'agent',
                  text: result.text,
                  timestamp: new Date()
              };

              setInbox(prev => prev.map(m => {
                  if (m.id === memoId) {
                      return {
                          ...m,
                          isRead: false,
                          timestamp: new Date(),
                          messages: [...(m.messages || []), agentMsg]
                      };
                  }
                  return m;
              }));
              appendGlobalLog(`MEMO REPLY from ${agent.name}`);
              
              if (agents[AgentId.VESPER]?.voiceId) {
                  playTextToSpeech(`New reply from ${agent.name}`, agents[AgentId.VESPER].voiceId);
              }

          } catch (e) {
              console.error("Memo reply failed", e);
          }
      }, 2000);
  }, [agents, appendGlobalLog]);

  const toggleOracleMode = useCallback(() => {
    setIsOracleMode(prev => !prev);
  }, []);

  const triggerBackup = useCallback(() => {
    const snapshot = {
        meta: {
            version: "Beta 251125.1830",
            timestamp: new Date().toISOString(),
            engine: "DeepFish Core"
        },
        state: {
            agents,
            globalLog,
            memories,
            inbox,
            gameState: { raffleTickets, lastTicketDate },
            chatHistory: roomMessages
        }
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepfish_snapshot_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    appendGlobalLog("SYSTEM SNAPSHOT SAVED.");
  }, [agents, globalLog, memories, inbox, raffleTickets, lastTicketDate, roomMessages, appendGlobalLog]);

  const restoreFromSnapshot = useCallback((snapshot: any) => {
      // Restoration logic...
      if (snapshot.state.agents) setAgents(snapshot.state.agents);
      if (snapshot.state.chatHistory) setRoomMessages(snapshot.state.chatHistory);
      alert("System Restore Completed.");
  }, []);

  // --- AI LOGIC ---

  const generateSystemPrompt = (targetAgentId: string, isBoardroom: boolean): string => {
    const agent = agents[targetAgentId];
    if (!agent) return "Agent not found.";

    let prompt = agent.basePrompt;
    if (targetAgentId !== AgentId.ORACLE) {
        // Dynamic Context Injection
        prompt = `${COMMON_CONTEXT}\n\n${prompt}`;
    }

    if (agent.customInstructions) {
      prompt += `\n\nIMPORTANT UPDATED INSTRUCTIONS:\n${agent.customInstructions}`;
    }

    // Omnipresence
    if (targetAgentId === AgentId.MEI || isBoardroom || targetAgentId === AgentId.HR) {
      const teamRoster = (Object.values(agents) as AgentProfile[]).map(a => 
        `- ${a.name} (${a.title}): ${a.model}`
      ).join('\n');
      prompt += `\n\n=== TEAM ROSTER ===\n${teamRoster}`;
    }

    // Memories
    if (targetAgentId === AgentId.MEI && memories.length > 0) {
      prompt += `\n\n=== MEMORY BANK ===\n${memories.map(m => `[${m.category}] ${m.content}`).join('\n')}`;
    }

    if (isOracleMode) prompt += ORACLE_OVERRIDE_PROMPT;

    return prompt;
  };

  const handleSendMessage = useCallback(async (input: string, image?: string) => {
    if (!input.trim() && !image) return;

    // 1. Add User Message
    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: Role.USER,
      text: input,
      image: image,
      timestamp: new Date()
    };

    const currentKey = historyKey;
    appendMessage(currentKey, newMessage);
    setIsLoading(true);

    try {
      const isBoardroom = !!(activeRoom.isBoardroom && !tempActiveAgentId);
      
      // 2. Initial Model Call
      const systemInstruction = generateSystemPrompt(activeAgentId, isBoardroom);
      let historyToUse = [...messages, newMessage];
      
      let response = await sendMessageToAgent(
        historyToUse, 
        systemInstruction,
        activeAgent.model || 'gemini-2.5-flash',
        activeAgentId
      );

      // 3. Tool Loop (Parallel Agent Execution)
      if (response.toolCalls && response.toolCalls.length > 0) {
          
          for (const call of response.toolCalls) {
              const args = call.args;

              // --- DELEGATION (The "Compilation" Logic) ---
              if (call.name === 'delegate_task') {
                 let { target_agent_id, task_description, context_summary } = args as DelegateTaskArgs;
                 
                 // ASSET BUS: Check if task description refers to an ASSET token and inject data
                 if (target_agent_id === AgentId.IT) {
                     const assetTokens = task_description.match(/ASSET_[A-Z0-9_]+/g);
                     if (assetTokens) {
                         assetTokens.forEach(token => {
                             const base64 = assetRegistry.current[token];
                             if (base64) {
                                 // Replace token with actual data URI for IT
                                 // We use a shorter placeholder in logs, but full data for the agent
                                 task_description = task_description.replace(token, `data:image/png;base64,${base64}`);
                                 appendGlobalLog(`Injected Asset Data for ${token} into IT payload.`);
                             }
                         });
                     }
                 }

                 // Log the delegation
                 appendMessage(currentKey, {
                   id: crypto.randomUUID(),
                   role: Role.MODEL,
                   text: `🔄 **Delegating to ${target_agent_id.toUpperCase()}...**\n"${task_description.substring(0, 150)}${task_description.length > 150 ? '...' : ''}"`,
                   isToolCall: true,
                   timestamp: new Date()
                 });
                 appendGlobalLog(`Mei delegating to ${target_agent_id}`);

                 // EXECUTE SUB-AGENT IN PARALLEL
                 const subAgent = agents[target_agent_id];
                 const subResult = await runSpecialistAgent(
                     target_agent_id,
                     subAgent.basePrompt + (subAgent.customInstructions || ""),
                     task_description,
                     context_summary,
                     subAgent.model || 'gemini-2.5-flash' 
                 );

                 // ASSET BUS: Capture Output Images
                 let assetContext = "";
                 if (subResult.images && subResult.images.length > 0) {
                     subResult.images.forEach((imgBase64, idx) => {
                         const assetId = `ASSET_${target_agent_id.toUpperCase()}_${Date.now()}_${idx}`;
                         assetRegistry.current[assetId] = imgBase64; // Store in Registry
                         assetContext += `\n[SYSTEM]: GENERATED_ASSET_ID: ${assetId}`;
                         
                         // Show the image to the user
                         appendMessage(currentKey, {
                             id: crypto.randomUUID(),
                             role: Role.MODEL,
                             text: `🎨 ${target_agent_id} generated an asset (${assetId})`,
                             image: imgBase64,
                             agentId: target_agent_id as AgentId,
                             timestamp: new Date()
                         });
                     });
                 }

                 // Feed result back to Lead Agent (Mei)
                 const toolOutputMsg: Message = {
                     id: crypto.randomUUID(),
                     role: Role.MODEL,
                     text: `[SYSTEM]: ${target_agent_id.toUpperCase()} HAS COMPLETED THE TASK.\n\nOUTPUT:\n${subResult.text}\n${assetContext}\n\nINSTRUCTION: If this contains code, present it. If it contains Asset IDs, pass them to the next agent if needed.`,
                     timestamp: new Date(),
                     isToolCall: true
                 };

                 // Append the tool output to history
                 appendMessage(currentKey, {
                     ...toolOutputMsg,
                     text: `✅ **${target_agent_id.toUpperCase()} Output Received.**`
                 });
                 
                 // RECURSE: Ask Mei to synthesize
                 historyToUse = [...historyToUse, toolOutputMsg];
                 response = await sendMessageToAgent(
                     historyToUse,
                     systemInstruction,
                     activeAgent.model || 'gemini-2.5-flash',
                     activeAgentId
                 );
              }

              // --- MEMORY ---
              if (call.name === 'store_memory') {
                const { content, category, trigger_context } = args as StoreMemoryArgs;
                addMemory(content, category, trigger_context);
                appendGlobalLog(`Memory stored: ${content}`);
              }

              // --- MEMOS ---
              if (call.name === 'send_executive_memo') {
                  const { subject, body } = args as SendMemoArgs;
                  sendMemo(activeAgentId, subject, body);
                  appendMessage(currentKey, {
                      id: crypto.randomUUID(),
                      role: Role.MODEL,
                      text: `📧 **Executive Memo Sent:** ${subject}`,
                      isToolCall: true,
                      timestamp: new Date()
                  });
              }

               // --- RAFFLE ---
              if (call.name === 'touch_raffle_jar') {
                 const { action } = args as RaffleActionArgs;
                 let resultText = action === 'add_ticket' ? "Ticket Added" : "Raffle Spun";
                 appendMessage(currentKey, {
                    id: crypto.randomUUID(),
                    role: Role.MODEL,
                    text: `🎲 ${resultText}`,
                    isToolCall: true,
                    timestamp: new Date()
                 });
              }
          }
      }

      // 4. Final Text Response
      if (response.text) {
          appendMessage(currentKey, {
            id: crypto.randomUUID(),
            role: Role.MODEL,
            text: response.text,
            timestamp: new Date(),
            agentId: activeAgentId as AgentId
          });

          if (!isOracleMode && activeAgent.voiceId) {
            setIsSpeaking(true);
            await playTextToSpeech(response.text, activeAgent.voiceId);
            setIsSpeaking(false);
          }
      }

    } catch (error: any) {
      console.error(error);
      appendMessage(currentKey, {
        id: crypto.randomUUID(),
        role: Role.MODEL,
        text: "Error: " + error.message,
        timestamp: new Date(),
        isError: true
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeRoom, activeAgentId, tempActiveAgentId, agents, historyKey, isOracleMode, messages, appendGlobalLog, updateAgentProfile, addMemory, sendMemo, activeAgent]);

  const handleVoiceCommand = useCallback((transcript: string) => {
     return transcript;
  }, [agents, initialRooms]);

  return {
    agents,
    activeRoom,
    activeAgent,
    messages,
    isLoading,
    isSpeaking,
    isLabsOpen,
    isOracleMode,
    inbox, 
    setIsLabsOpen,
    setActiveRoomId,
    setTempActiveAgentId,
    handleSendMessage,
    handleVoiceCommand,
    createNewAgent,
    toggleOracleMode,
    triggerBackup,
    restoreFromSnapshot,
    markMemoAsRead,
    replyToMemo,
    setMemoStatus
  };
};
