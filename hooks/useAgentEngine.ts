
import { useState, useEffect } from 'react';
import { AgentId, Message, Role, AgentProfile, UpdateAgentArgs, Memory, StoreMemoryArgs, ExecutiveMemo, SendMemoArgs, MemoMessage } from '../types';
import { sendMessageToAgent } from '../services/geminiService';
import { playTextToSpeech } from '../services/elevenLabs';

interface UseAgentEngineProps {
  initialAgents: Record<string, AgentProfile>;
}

export const useAgentEngine = ({ initialAgents }: UseAgentEngineProps) => {
  // --- STATE ---
  const [agents, setAgents] = useState<Record<string, AgentProfile>>(initialAgents);
  const [globalLog, setGlobalLog] = useState<string[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  
  // Mailroom State
  const [inbox, setInbox] = useState<ExecutiveMemo[]>([]);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  // Navigation / Selection
  // CHANGED: Multi-select support
  const [activeParticipantIds, setActiveParticipantIds] = useState<string[]>([AgentId.MEI]); 
  const [isLabsOpen, setIsLabsOpen] = useState(false);
  const [agentToEdit, setAgentToEdit] = useState<AgentProfile | null>(null);
  
  // Chat History - CHANGED: Single Global Stream
  const [messages, setMessages] = useState<Message[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // --- COMPUTED ---
  const activeAgents = activeParticipantIds.map(id => agents[id]).filter(Boolean);

  // --- STARTUP EFFECTS ---
  useEffect(() => {
    // Prime the "Return Status Report" from Mei
    const hasStatusReport = inbox.some(m => m.subject.includes("Protocols Active"));
    if (!hasStatusReport) {
        const timer = setTimeout(() => {
            const statusMemo: ExecutiveMemo = {
                id: "memo_mei_status",
                senderId: AgentId.MEI,
                subject: "Efficiency Protocols Active",
                body: `
**To:** The CEO
**From:** Mei (Chief of Staff)

Boss, the system is calibrated. 
- **GAMIFICATION:** PURGED.
- **SPATIAL LOGIC:** REMOVED.
- **FOCUS:** SPECIALIST COMPETENCE.

All Agents are online and ready for high-bandwidth professional output. Personalities are incidental.

Mei
                `,
                timestamp: new Date(),
                isRead: false,
                status: 'active',
                messages: []
            };
            setInbox(prev => [statusMemo, ...prev]);
            appendGlobalLog("SYSTEM OPTIMIZED: Specialist Protocols Active.");
        }, 3000); 
        return () => clearTimeout(timer);
    }
  }, []);

  // --- ACTIONS ---

  const toggleAgentSelection = (agentId: string) => {
    setActiveParticipantIds(prev => {
        if (prev.includes(agentId)) {
            return prev.filter(id => id !== agentId);
        } else {
            return [...prev, agentId];
        }
    });
    setIsLabsOpen(false);
    setIsInboxOpen(false);
  };

  const appendMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
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
    appendGlobalLog(`New Agent Created/Updated in Labs: ${agent.name} (${agent.title})`);
    setAgentToEdit(null); // Clear editing state after save
  };

  const editAgent = (agentId: string) => {
      const agent = agents[agentId];
      if (agent) {
          setAgentToEdit(agent);
          setIsLabsOpen(true);
      }
  };

  const openLabsForNew = () => {
      setAgentToEdit(null);
      setIsLabsOpen(true);
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
      setInbox(prev => {
          const existing = prev.find(m => m.subject === subject && m.senderId === senderId);
          if (existing) {
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

      // 2. Trigger Agent Response (Async)
      setTimeout(async () => {
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

          const taskMessage: Message = {
            id: 'memo-reply-' + Date.now(),
            role: Role.USER,
            text: prompt,
            timestamp: new Date()
          };

          const systemInstruction = agent.basePrompt + (agent.customInstructions ? `\n\n${agent.customInstructions}` : "");

          try {
              const result = await sendMessageToAgent(
                  [taskMessage], 
                  systemInstruction,
                  agent.model || 'gemini-2.5-flash',
                  targetAgentId
              );
              
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
  };

  // --- SYSTEM SNAPSHOT (BACKUP) ---
  const triggerBackup = () => {
    const snapshot = {
        meta: {
            version: "Beta 251125.1830-PRO",
            timestamp: new Date().toISOString(),
            engine: "DeepFish Core"
        },
        state: {
            agents,
            globalLog,
            memories,
            inbox,
            messages, // Global History
            navigation: {
                activeParticipantIds,
                isLabsOpen: false 
            }
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

  const restoreFromSnapshot = (snapshot: any) => {
      try {
          if (snapshot.meta?.engine !== "DeepFish Core") {
              alert("Invalid Snapshot File: Not a DeepFish Core backup.");
              return;
          }

          setIsLabsOpen(false);

          const state = snapshot.state;
          
          if (state.agents) setAgents(state.agents);
          if (state.globalLog) setGlobalLog(state.globalLog);
          if (state.memories) setMemories(state.memories);
          
          if (state.inbox) {
              const hydratedInbox = state.inbox.map((m: any) => ({
                  ...m,
                  timestamp: new Date(m.timestamp),
                  messages: m.messages?.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }))
              }));
              setInbox(hydratedInbox);
          }
          
          // Hydrate Global Messages
          if (state.messages) {
              const hydratedHistory = state.messages.map((m: any) => ({
                 ...m,
                 timestamp: new Date(m.timestamp)
              }));
              setMessages(hydratedHistory);
          } else if (state.agentMessages) {
              // Backward compatibility for old snapshots
             setMessages([]); 
          }

          if (state.navigation && state.navigation.activeParticipantIds) {
             setActiveParticipantIds(state.navigation.activeParticipantIds);
          }

          appendGlobalLog("!!! SYSTEM RESTORE COMPLETED SUCCESSFULLY !!!");
          alert("System Restored.");

      } catch (e) {
          console.error("Restore failed", e);
          alert("Critical Error during System Restore.");
      }
  };

  // --- AI LOGIC ---

  const generateSystemPrompt = (targetAgentId: string): string => {
    const agent = agents[targetAgentId];
    if (!agent) return "Agent not found.";

    let prompt = `${agent.basePrompt}`;
    if (agent.customInstructions) {
      prompt += `\n\nIMPORTANT UPDATED INSTRUCTIONS:\n${agent.customInstructions}`;
    }

    // Omnipresence & Context Injection
    // Mei, HR, Vesper know everything.
    if (targetAgentId === AgentId.MEI || targetAgentId === AgentId.HR || targetAgentId === AgentId.VESPER) {
      const recentActivity = globalLog.slice(0, 10).join('\n');
      prompt += `
        \n\n=== STUDIO EVENT LOG ===
        ${recentActivity || "No recent activity."}
      `;
    }

    // Inbox Injection for Vesper
    if (targetAgentId === AgentId.VESPER) {
        const unreadCount = inbox.filter(m => !m.isRead).length;
        prompt += `
        \n\n=== MAILROOM STATUS ===
        Total Unread: ${unreadCount}
        If CEO greets you, report unread count.
        `;
    }

    // Inject Memories for Mei
    if (targetAgentId === AgentId.MEI) {
      const memoryBank = memories.length > 0 
        ? memories.map(m => `[${m.category.toUpperCase()}] ${m.content}`).join('\n')
        : "Memory bank is empty.";

      prompt += `
        \n\n=== LONG TERM MEMORY BANK ===
        ${memoryBank}
      `;
    }
    
    return prompt;
  };

  const handleSendMessage = async (input: string) => {
    if (!input.trim() || activeParticipantIds.length === 0) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: input,
      timestamp: new Date()
    };

    appendMessage(newMessage);
    setIsLoading(true);

    // Broadcast to ALL active participants
    // We execute them in parallel but process results as they come
    const agentPromises = activeParticipantIds.map(async (agentId) => {
        const agent = agents[agentId];
        const systemInstruction = generateSystemPrompt(agentId);
        
        try {
            const response = await sendMessageToAgent(
                [...messages, newMessage], 
                systemInstruction,
                agent.model || 'gemini-2.5-flash',
                agentId
            );

             // Tool Handling
            if (response.toolCalls && response.toolCalls.length > 0) {
                for (const call of response.toolCalls) {
                    const args = call.args;

                    if (call.name === 'update_agent_profile') {
                        const { target_agent_id, new_instructions, update_reason } = args as UpdateAgentArgs;
                        if (target_agent_id && new_instructions) {
                            updateAgentProfile(target_agent_id, new_instructions);
                            appendMessage({
                                id: Date.now().toString() + agentId,
                                role: Role.MODEL,
                                text: `✅ **Configuration Updated**\n\n**Agent:** ${target_agent_id.toUpperCase()}\n**Reason:** ${update_reason}`,
                                timestamp: new Date(),
                                isToolCall: true,
                                agentId: agentId as AgentId
                            });
                            appendGlobalLog(`HR updated ${target_agent_id}`);
                        }
                    }

                    if (call.name === 'delegate_task') {
                        appendMessage({
                            id: Date.now().toString() + agentId,
                            role: Role.MODEL,
                            text: `(Delegated task to ${args.target_agent_id}: "${args.task_description}")`,
                            isToolCall: true,
                            timestamp: new Date(),
                            agentId: agentId as AgentId
                        });
                        appendGlobalLog(`${agent.name} delegated to ${args.target_agent_id}`);
                    }

                    if (call.name === 'store_memory') {
                        const { content, category } = args as StoreMemoryArgs;
                        addMemory(content, category);
                        appendGlobalLog(`Mei stored memory: ${content}`);
                    }

                    if (call.name === 'send_executive_memo') {
                        const { subject, body } = args as SendMemoArgs;
                        sendMemo(agentId, subject, body);
                        appendMessage({
                            id: Date.now().toString() + agentId,
                            role: Role.MODEL,
                            text: `📧 **Executive Memo Sent**\n**Subject:** ${subject}`,
                            isToolCall: true,
                            timestamp: new Date(),
                            agentId: agentId as AgentId
                        });
                    }
                }
            }

            // SMART SILENCE PROTOCOL
            // If the agent replied with [SILENCE], we do not display it.
            if (response.text && !response.text.includes('[SILENCE]')) {
                appendMessage({
                    id: (Date.now() + Math.random()).toString(),
                    role: Role.MODEL,
                    text: response.text,
                    timestamp: new Date(),
                    agentId: agentId as AgentId
                });

                if (agent.voiceId) {
                    if (activeParticipantIds.length < 2) {
                         setIsSpeaking(true);
                         await playTextToSpeech(response.text, agent.voiceId);
                         setIsSpeaking(false);
                    }
                }
            }

        } catch (e) {
            console.error(`Error from ${agent.name}`, e);
        }
    });

    await Promise.all(agentPromises);
    setIsLoading(false);
  };

  const handleVoiceCommand = (transcript: string) => {
    // Switch or Add logic could go here
    return transcript; 
  };

  return {
    agents,
    activeParticipantIds,
    activeAgents,
    messages,
    isLoading,
    isSpeaking,
    isLabsOpen,
    inbox,
    isInboxOpen,
    agentToEdit,
    setIsInboxOpen,
    setIsLabsOpen,
    toggleAgentSelection, // Changed from setActiveAgentId
    handleSendMessage,
    handleVoiceCommand,
    createNewAgent,
    editAgent,
    openLabsForNew, // Expose new function
    triggerBackup,
    restoreFromSnapshot,
    markMemoAsRead,
    replyToMemo,
    setMemoStatus
  };
};
