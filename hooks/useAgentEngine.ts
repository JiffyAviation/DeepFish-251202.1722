

import { useState, useEffect } from 'react';
import { AgentId, Message, Role, Room, AgentProfile, UpdateAgentArgs, Memory, StoreMemoryArgs, RaffleActionArgs, ExecutiveMemo, SendMemoArgs, MemoMessage } from '../types';
import { sendMessageToAgent } from '../services/geminiService';
import { playTextToSpeech } from '../services/elevenLabs';
import { ORACLE_OVERRIDE_PROMPT } from '../constants';

interface UseAgentEngineProps {
  initialAgents: Record<string, AgentProfile>;
  initialRooms: Room[];
}

export const useAgentEngine = ({ initialAgents, initialRooms }: UseAgentEngineProps) => {
  // --- STATE ---
  const [agents, setAgents] = useState<Record<string, AgentProfile>>(initialAgents);
  const [globalLog, setGlobalLog] = useState<string[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  
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

  // --- STARTUP EFFECTS ---
  useEffect(() => {
    // Prime the "Server Report" memo from IT (Simulation of work done 'overnight')
    const hasServerReport = inbox.some(m => m.subject.includes("Server Infrastructure"));
    if (!hasServerReport) {
        // Wait 3 seconds then deliver it
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

  // Prime the "DFAIS Deployment" memo
  useEffect(() => {
    const hasDeploymentMemo = inbox.some(m => m.subject.includes("DFAIS"));
    if (!hasDeploymentMemo) {
         // Wait 8 seconds then deliver it (staggered after server report)
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
                isRead: false, // Brand new
                status: 'active',
                messages: []
            };
            setInbox(prev => [deploymentMemo, ...prev]);
            appendGlobalLog("INCOMING MEMO: Project DFAIS Strategy from IT");
            if (agents[AgentId.VESPER]?.voiceId) {
                 // Optionally announce
            }
         }, 8000);
         return () => clearTimeout(timer);
    }
  }, [inbox.length]);

  // Prime the Architect Broadcast (Divine Intervention)
  useEffect(() => {
      const hasOracleMemo = inbox.some(m => m.senderId === AgentId.ORACLE);
      if (!hasOracleMemo) {
          const timer = setTimeout(() => {
              const oracleMemo: ExecutiveMemo = {
                  id: "memo_oracle_001",
                  senderId: AgentId.ORACLE,
                  subject: "SYSTEM BROADCAST: DFAIS PROTOCOLS ACTIVE",
                  body: `
*** INCOMING TRANSMISSION FROM THE ARCHITECT ***

All agents are hereby notified.
The "DFAIS" (DeepFish AI Studio) initiative has been authorized.

Directives:
1. IT is authorized to proceed with deployment analysis.
2. MEI is authorized to oversee the transition.
3. ROOT is authorized to flush the cache.

This is a one-way transmission.
The Architect watches.

*** TRANSMISSION END ***
                  `,
                  timestamp: new Date(),
                  isRead: false,
                  status: 'active',
                  messages: []
              };
              setInbox(prev => [oracleMemo, ...prev]);
              appendGlobalLog("!!! SYSTEM ALERT: BROADCAST FROM THE ARCHITECT !!!");
          }, 12000); // 12 seconds in
          return () => clearTimeout(timer);
      }
  }, [inbox.length]);

  // --- ACTIONS ---

  const appendMessage = (key: string, msg: Message) => {
    setRoomMessages(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), msg]
    }));
  };

  const appendGlobalLog = (entry: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setGlobalLog(prev => [`[${timestamp}] ${entry}`, ...prev].slice(50));
  };

  const updateAgentProfile = (targetId: string, newInstructions: string) => {
    setAgents(prev => ({
      ...prev,
      [targetId]: {
        ...prev[targetId],
        customInstructions: newInstructions
      }
    }));
  };

  const createNewAgent = (agent: AgentProfile) => {
    setAgents(prev => ({
      ...prev,
      [agent.id]: agent
    }));
    appendGlobalLog(`New Agent Created in Labs: ${agent.name} (${agent.title})`);
  };

  const addMemory = (content: string, category: Memory['category'], triggerContext?: string) => {
    const newMemory: Memory = {
      id: Date.now().toString(),
      content,
      category,
      triggerContext,
      timestamp: new Date()
    };
    setMemories(prev => [newMemory, ...prev]);
  };

  const sendMemo = (senderId: string, subject: string, body: string) => {
      // Check if thread exists
      setInbox(prev => {
          const existing = prev.find(m => m.subject === subject && m.senderId === senderId);
          if (existing) {
              // Append to thread
               const newMessage: MemoMessage = {
                  id: Date.now().toString(),
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
              // Create new
              const newMemo: ExecutiveMemo = {
                id: Date.now().toString(),
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
  };

  const markMemoAsRead = (memoId: string) => {
      setInbox(prev => prev.map(m => m.id === memoId ? { ...m, isRead: true } : m));
  };

  const setMemoStatus = (memoId: string, status: 'active' | 'archived' | 'deleted') => {
      setInbox(prev => prev.map(m => m.id === memoId ? { ...m, status } : m));
  };

  const replyToMemo = async (memoId: string, text: string) => {
      // 1. Add User Message to Thread
      const userMsg: MemoMessage = {
          id: Date.now().toString(),
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

      // Special handling for THE ARCHITECT
      if (targetAgentId === AgentId.ORACLE) {
           setTimeout(() => {
                const sysMsg: MemoMessage = {
                    id: Date.now().toString(),
                    role: 'agent',
                    text: "[SYSTEM]: Transmission received. The void remains silent.",
                    timestamp: new Date()
                };
                setInbox(prev => prev.map(m => {
                    if (m.id === memoId) {
                        return {
                            ...m,
                            isRead: false,
                            timestamp: new Date(),
                            messages: [...(m.messages || []), sysMsg]
                        };
                    }
                    return m;
                }));
           }, 1000);
           return; // Do not generate AI response
      }

      // 2. Trigger Agent Response (Async)
      setTimeout(async () => {
          // Simulate Agent Thinking
          const agent = agents[targetAgentId];
          const prompt = `
            You are ${agent.name}. 
            You are replying to an Executive Memo thread with the CEO.
            SUBJECT: ${subject}
            
            HISTORY:
            ${history.map(h => `${h.role === 'ceo' ? 'CEO' : 'YOU'}: ${h.text}`).join('\n')}
            CEO (Latest): ${text}
            
            TASK: Write a concise reply to the CEO. Keep it professional/in-character.
          `;

          try {
              const result = await sendMessageToAgent([], prompt, agent.model || 'gemini-2.5-flash', targetAgentId);
              
              const agentMsg: MemoMessage = {
                  id: Date.now().toString(),
                  role: 'agent',
                  text: result.text,
                  timestamp: new Date()
              };

              setInbox(prev => prev.map(m => {
                  if (m.id === memoId) {
                      return {
                          ...m,
                          isRead: false, // Mark unread so CEO sees response
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
  };

  const toggleOracleMode = () => {
    setIsOracleMode(prev => !prev);
  };

  // --- SYSTEM SNAPSHOT (BACKUP) ---
  const triggerBackup = () => {
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
    
    appendGlobalLog("SYSTEM SNAPSHOT SAVED TO LOCAL STORAGE.");
  };

  // --- RESTORE SNAPSHOT (CRASH DIVE) ---
  const restoreFromSnapshot = (snapshot: any) => {
      try {
          if (snapshot.meta?.engine !== "DeepFish Core") {
              alert("Invalid Snapshot File: Not a DeepFish Core backup.");
              return;
          }

          const state = snapshot.state;
          if (state.agents) setAgents(state.agents);
          if (state.globalLog) setGlobalLog(state.globalLog);
          if (state.memories) setMemories(state.memories);
          if (state.inbox) {
              // Re-hydrate dates in inbox
              const hydratedInbox = state.inbox.map((m: any) => ({
                  ...m,
                  timestamp: new Date(m.timestamp),
                  messages: m.messages?.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }))
              }));
              setInbox(hydratedInbox);
          }
          if (state.gameState) {
              setRaffleTickets(state.gameState.raffleTickets);
              setLastTicketDate(state.gameState.lastTicketDate);
          }
          if (state.chatHistory) {
              // Re-hydrate dates in messages
              const hydratedHistory: any = {};
              Object.keys(state.chatHistory).forEach(key => {
                  hydratedHistory[key] = state.chatHistory[key].map((m: any) => ({
                      ...m,
                      timestamp: new Date(m.timestamp)
                  }));
              });
              setRoomMessages(hydratedHistory);
          }

          appendGlobalLog("!!! SYSTEM RESTORE COMPLETED SUCCESSFULLY !!!");
          alert("System Restore Completed.");

      } catch (e) {
          console.error("Restore failed", e);
          alert("Critical Error during System Restore.");
      }
  };

  // --- AI LOGIC ---

  const generateSystemPrompt = (targetAgentId: string, isBoardroom: boolean): string => {
    const agent = agents[targetAgentId];
    if (!agent) return "Agent not found.";

    let prompt = `${agent.basePrompt}`;
    if (agent.customInstructions) {
      prompt += `\n\nIMPORTANT UPDATED INSTRUCTIONS:\n${agent.customInstructions}`;
    }

    // Omnipresence & Context Injection
    if (targetAgentId === AgentId.MEI || isBoardroom || targetAgentId === AgentId.HR || targetAgentId === AgentId.LUNCHROOM || targetAgentId === AgentId.VESPER) {
      const teamRoster = (Object.values(agents) as AgentProfile[]).map(a => 
        `- ${a.name} (${a.title}): ${a.customInstructions ? "CUSTOM BEHAVIOR ACTIVE: " + a.customInstructions : a.description}`
      ).join('\n');

      const recentActivity = globalLog.slice(0, 10).join('\n');

      prompt += `
        \n\n=== ENGINE STATE (OMNIPRESENCE) ===
        The following is the live status of your team.
        ${teamRoster}

        \n\n=== GLOBAL EVENT LOG ===
        ${recentActivity || "No recent activity."}
      `;
    }

    // Inbox Injection for Vesper
    if (targetAgentId === AgentId.VESPER) {
        const unreadCount = inbox.filter(m => !m.isRead).length;
        const recentMemos = inbox.slice(0, 3).map(m => `- [${m.isRead ? 'READ' : 'UNREAD'}] From ${m.senderId}: "${m.subject}"`).join('\n');
        
        prompt += `
        \n\n=== EXECUTIVE MAILROOM STATUS ===
        Total Unread: ${unreadCount}
        Recent Memos:
        ${recentMemos}
        
        INSTRUCTION: If the CEO greets you, mention any unread memos immediately.
        `;
    }

    // Inject Memories for Mei
    if (targetAgentId === AgentId.MEI) {
      const memoryBank = memories.length > 0 
        ? memories.map(m => `[${m.category.toUpperCase()}] ${m.content} ${m.triggerContext ? `(Trigger: ${m.triggerContext})` : ''}`).join('\n')
        : "Memory bank is empty.";

      prompt += `
        \n\n=== MEI'S LONG TERM MEMORY BANK ===
        Use this data to proactively assist the CEO.
        ${memoryBank}
      `;
    }
    
    // Territorial/Guest Protocol
    if (activeRoomId === 'concierge' && targetAgentId === AgentId.VESPER) {
        prompt += `\n\nTERRITORIAL STATUS: HOST. You are in your office. The user is speaking to you.`;
    } else if (activeRoomId === 'concierge' && targetAgentId !== AgentId.VESPER) {
        prompt += `\n\nTERRITORIAL STATUS: GUEST. You are in Vesper's office. Behave accordingly.`;
    }

    if (isBoardroom || activeRoom.isLunchroom) {
      prompt += `
        \n\nROLE: You are scriptwriting for a Multi-Agent Environment.
        Output format: [agent_id]: Message...
        
        ${activeRoom.isLunchroom ? `
        GAME STATE: 
        - The user has ${raffleTickets} Raffle Tickets.
        - If they ask to spin, tell them result based on 'touch_raffle_jar' tool.
        ` : ''}
      `;
    }

    // ORACLE OVERRIDE INJECTION
    if (isOracleMode) {
        prompt += ORACLE_OVERRIDE_PROMPT;
    }

    return prompt;
  };

  const handleSendMessage = async (input: string) => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: input,
      timestamp: new Date()
    };

    appendMessage(historyKey, newMessage);
    
    if (activeRoom.isBoardroom || tempActiveAgentId) {
       appendGlobalLog(`CEO to ${activeAgent.name}: "${input}"`);
    }

    setIsLoading(true);

    try {
      const isBoardroom = !!(activeRoom.isBoardroom && !tempActiveAgentId);
      const isLunchroomSim = !!(activeRoom.isLunchroom && !tempActiveAgentId);
      const systemInstruction = generateSystemPrompt(activeAgentId, isBoardroom);

      const response = await sendMessageToAgent(
        [...messages, newMessage], 
        systemInstruction,
        activeAgent.model || 'gemini-2.5-flash',
        activeAgentId
      );

      // Tool Handling
      if (response.toolCalls && response.toolCalls.length > 0) {
          for (const call of response.toolCalls) {
              const args = call.args;

              if (call.name === 'update_agent_profile') {
                  const { target_agent_id, new_instructions, update_reason } = args as UpdateAgentArgs;
                  if (target_agent_id && new_instructions) {
                      updateAgentProfile(target_agent_id, new_instructions);
                      
                      appendMessage(historyKey, {
                        id: Date.now().toString(),
                        role: Role.MODEL,
                        text: `✅ **Configuration Updated**\n\n**Agent:** ${target_agent_id.toUpperCase()}\n**Reason:** ${update_reason}`,
                        timestamp: new Date(),
                        isToolCall: true
                      });
                      appendGlobalLog(`HR updated ${target_agent_id}: ${update_reason}`);
                  }
              }

              if (call.name === 'delegate_task') {
                 appendMessage(historyKey, {
                   id: Date.now().toString(),
                   role: Role.MODEL,
                   text: `(Mei delegated task to ${args.target_agent_id}: "${args.task_description}")`,
                   isToolCall: true,
                   timestamp: new Date()
                 });
                 appendGlobalLog(`Mei delegated to ${args.target_agent_id}`);
              }

              if (call.name === 'store_memory') {
                const { content, category, trigger_context } = args as StoreMemoryArgs;
                addMemory(content, category, trigger_context);
                appendGlobalLog(`Mei stored memory [${category}]: ${content}`);
              }

              if (call.name === 'send_executive_memo') {
                  const { subject, body } = args as SendMemoArgs;
                  sendMemo(activeAgentId, subject, body);
                  appendMessage(historyKey, {
                      id: Date.now().toString(),
                      role: Role.MODEL,
                      text: `📧 **Executive Memo Sent**\n**Subject:** ${subject}`,
                      isToolCall: true,
                      timestamp: new Date()
                  });
              }

              if (call.name === 'touch_raffle_jar') {
                 // Disable Fun Tools in Oracle Mode? Optional. Let's keep them functional but the text response will be dry.
                 const { action } = args as RaffleActionArgs;
                 let resultText = "";

                 if (action === 'add_ticket') {
                    const today = new Date().toDateString();
                    if (lastTicketDate === today) {
                        resultText = "🚫 [RaffleBot]: Ticket limit reached.";
                    } else {
                        setRaffleTickets(prev => prev + 1);
                        setLastTicketDate(today);
                        resultText = "🎟️ [RaffleBot]: Ticket Added. Count: " + (raffleTickets + 1);
                        appendGlobalLog("CEO claimed daily raffle ticket.");
                    }
                 } else if (action === 'spin_gacha') {
                    if (raffleTickets > 0) {
                        setRaffleTickets(prev => prev - 1);
                        const roll = Math.random();
                        if (roll < 0.03) {
                            resultText = "🎰 **JACKPOT** [RaffleBot]: PREMIUM SKIN UNLOCKED.";
                            appendGlobalLog("CEO won GACHA JACKPOT!");
                        } else {
                            const trash = ["Stale Coffee Coupon", "Broken Paperclip", "Quote", "Lint"];
                            const prize = trash[Math.floor(Math.random() * trash.length)];
                            resultText = `🎰 [RaffleBot]: Prize: ${prize}.`;
                        }
                    } else {
                        resultText = "🚫 [RaffleBot]: Insufficient Tickets.";
                    }
                 }

                 appendMessage(historyKey, {
                    id: Date.now().toString(),
                    role: Role.MODEL,
                    text: resultText,
                    isToolCall: true,
                    timestamp: new Date()
                 });
              }
          }
      }

      // Text Response Handling
      if (response.text) {
          let currentSpeaker = activeAgentId;

          if (isBoardroom || isLunchroomSim) {
             const match = response.text.match(/^\[(\w+)\]:/);
             if (match) {
                 const speakerId = match[1].toLowerCase();
                 if (agents[speakerId]) {
                     currentSpeaker = speakerId;
                 }
             }
             if (isBoardroom) appendGlobalLog(`Boardroom: ${response.text.substring(0, 40)}...`);
          } else {
             if (tempActiveAgentId) {
                appendGlobalLog(`${activeAgent.name} replied.`);
             }
          }

          appendMessage(historyKey, {
            id: (Date.now() + 1).toString(),
            role: Role.MODEL,
            text: response.text,
            timestamp: new Date(),
            agentId: currentSpeaker
          });

          // Text to Speech
          if (!isOracleMode) {
              const speakerProfile = agents[currentSpeaker];
              if (speakerProfile && speakerProfile.voiceId) {
                setIsSpeaking(true);
                await playTextToSpeech(response.text, speakerProfile.voiceId);
                setIsSpeaking(false);
              }
          }
      }

    } catch (error: any) {
      console.error(error);
      appendMessage(historyKey, {
        id: Date.now().toString(),
        role: Role.MODEL,
        text: "Error processing request.",
        timestamp: new Date(),
        isError: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceCommand = (transcript: string) => {
    const lower = transcript.toLowerCase();
    
    if (lower.includes("lab") || lower.includes("workstation")) {
        setIsLabsOpen(true);
        return;
    }
    
    const callMatch = lower.match(/(?:call|talk to|get|visit)\s+(\w+)/i);
    
    if (callMatch) {
        const targetName = callMatch[1];
        const targetAgent = (Object.values(agents) as AgentProfile[]).find(a => 
            a.name.toLowerCase() === targetName || a.id.toLowerCase() === targetName
        );

        if (targetAgent) {
            setTempActiveAgentId(targetAgent.id);
            const room = initialRooms.find(r => r.agentId === targetAgent.id);
            if (room) {
                setActiveRoomId(room.id);
                setTempActiveAgentId(null);
            }
            setIsLabsOpen(false); 
            return;
        }

        if (targetName.includes("board") || targetName.includes("meeting")) {
             const boardRoom = initialRooms.find(r => r.isBoardroom);
             if (boardRoom) {
                 setActiveRoomId(boardRoom.id);
                 setTempActiveAgentId(null);
                 setIsLabsOpen(false);
                 return;
             }
        }
    }

    return transcript; 
  };

  return {
    agents,
    activeRoom,
    activeAgent,
    messages,
    isLoading,
    isSpeaking,
    isLabsOpen,
    isOracleMode,
    inbox, // Exported for Sidebar
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
