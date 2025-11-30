

import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { Message, Role, AgentId } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- TOOLS ---

const DELEGATE_TOOL: FunctionDeclaration = {
  name: 'delegate_task',
  description: 'Delegate a specific task to a specialized agent (Skillz, Creative, Slash, etc).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      target_agent_id: {
        type: Type.STRING,
        description: 'The ID of the agent to call.',
        enum: ['skillz', 'slash', 'creative', 'mcp', 'qc', 'subs', 'shipping', 'call_center', 'it', 'hr', 'social']
      },
      task_description: {
        type: Type.STRING,
        description: 'The specific instruction for the specialist agent.'
      },
      context_summary: {
        type: Type.STRING,
        description: 'A brief summary of the project context.'
      }
    },
    required: ['target_agent_id', 'task_description']
  }
};

const UPDATE_AGENT_TOOL: FunctionDeclaration = {
  name: 'update_agent_profile',
  description: 'HR Tool: Update the behavioral instructions or personality of an agent.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      target_agent_id: {
        type: Type.STRING,
        description: 'The ID of the agent to modify.',
        enum: ['mei', 'skillz', 'slash', 'creative', 'mcp', 'qc', 'subs', 'shipping', 'call_center', 'it', 'abacus', 'social', 'vesper']
      },
      new_instructions: {
        type: Type.STRING,
        description: 'The new specific instructions that define how this agent should behave. This will be added to their system prompt.'
      },
      update_reason: {
        type: Type.STRING,
        description: 'Why this change is being made (for logging).'
      }
    },
    required: ['target_agent_id', 'new_instructions', 'update_reason']
  }
};

const STORE_MEMORY_TOOL: FunctionDeclaration = {
  name: 'store_memory',
  description: 'Mei Tool: Store a fact, preference, or future reminder in long-term memory.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      content: {
        type: Type.STRING,
        description: 'The information to remember.'
      },
      category: {
        type: Type.STRING,
        enum: ['actionable', 'memory', 'reference', 'personality'],
        description: 'Category: actionable (tasks for later), memory (facts/history), reference (data), personality (user preferences).'
      },
      trigger_context: {
        type: Type.STRING,
        description: 'Optional: When should this memory be recalled? e.g., "visiting parents", "starting a new project".'
      }
    },
    required: ['content', 'category']
  }
};

const TOUCH_RAFFLE_TOOL: FunctionDeclaration = {
  name: 'touch_raffle_jar',
  description: 'Lunchroom Tool: Interact with the Gacha Raffle Jar.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ['add_ticket', 'spin_gacha'],
        description: 'Action to perform: add_ticket (daily login) or spin_gacha (spend ticket for prize).'
      }
    },
    required: ['action']
  }
};

const SEND_MEMO_TOOL: FunctionDeclaration = {
  name: 'send_executive_memo',
  description: 'Send a formal Memo/Email to the CEO. It will appear in their Inbox at Vesper\'s Desk.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      subject: {
        type: Type.STRING,
        description: 'The subject line of the email/memo.'
      },
      body: {
        type: Type.STRING,
        description: 'The full content of the report or message. Format with Markdown.'
      }
    },
    required: ['subject', 'body']
  }
};

export interface AgentResponse {
  text: string;
  toolCalls?: any[];
}

// Map of allowed tools per agent ID
// NOTE: IT, Mei, HR, MCP, Skillz can all send memos
const AGENT_TOOLS: Record<string, FunctionDeclaration[]> = {
  [AgentId.MEI]: [DELEGATE_TOOL, STORE_MEMORY_TOOL, SEND_MEMO_TOOL],
  [AgentId.HR]: [UPDATE_AGENT_TOOL, SEND_MEMO_TOOL],
  [AgentId.LUNCHROOM]: [TOUCH_RAFFLE_TOOL],
  [AgentId.IT]: [SEND_MEMO_TOOL],
  [AgentId.MCP]: [SEND_MEMO_TOOL],
  [AgentId.SKILLZ]: [SEND_MEMO_TOOL],
  [AgentId.VESPER]: [SEND_MEMO_TOOL], // Vesper can send memos too
  [AgentId.ROOT]: [] // Root doesn't use tools, he IS the tool
};

export const sendMessageToAgent = async (
  history: Message[],
  systemInstruction: string,
  modelName: string = "gemini-2.5-flash",
  agentId: string
): Promise<AgentResponse> => {
  // Filter out error messages from history before sending
  const cleanHistory = history.filter(m => !m.isError).map(msg => ({
    role: msg.role === Role.USER ? 'user' : 'model',
    parts: msg.image 
      ? [{ text: msg.text }, { inlineData: { mimeType: 'image/png', data: msg.image } }]
      : [{ text: msg.text }] 
  }));

  try {
    const config: any = {
      systemInstruction,
      temperature: 0.7,
    };

    // Dynamically inject tools based on who is speaking
    // Also inject SEND_MEMO_TOOL for everyone in Boardroom to allow reports
    if (AGENT_TOOLS[agentId]) {
      config.tools = [{ functionDeclarations: AGENT_TOOLS[agentId] }];
    } else {
        // Fallback: everyone can send memos? Let's restrict it for now to the list above.
        // Or if we want dynamic, we check the list.
    }

    const chat = ai.chats.create({
      model: modelName,
      config: config,
      history: cleanHistory.slice(0, -1) // All but last
    });

    const lastMessage = history[history.length - 1];
    const result = await chat.sendMessage({ message: lastMessage.text });
    
    // Check for tool calls
    const toolCalls = result.functionCalls;

    // Check for inline images (Hanna/Creative)
    let base64Image: string | undefined = undefined;
    if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
        for (const part of result.candidates[0].content.parts) {
            if (part.inlineData) {
                base64Image = part.inlineData.data;
            }
        }
    }

    return {
      text: result.text || "",
      toolCalls: toolCalls
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Agent communication failed.");
  }
};

// Function to run a specialist agent (Stateless, single turn usually)
export const runSpecialistAgent = async (
  agentId: string,
  systemInstruction: string,
  taskDescription: string,
  contextSummary: string,
  modelName: string
): Promise<string> => {
  const prompt = `
    CONTEXT SUMMARY: ${contextSummary}
    
    YOUR TASK: ${taskDescription}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      config: { systemInstruction },
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    return response.text || "(No output generated)";
  } catch (e: any) {
    return `[Agent Error]: ${e.message}`;
  }
};
