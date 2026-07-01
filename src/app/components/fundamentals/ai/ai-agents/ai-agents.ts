import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-ai-agents',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './ai-agents.html',
  styleUrl: './ai-agents.scss',
})
export class AiAgents {
  quickRef: QuickRefItem[] = [
    { name: 'AI Agent',       type: 'keyword', desc: 'LLM + tools + memory + execution loop — autonomously plans and acts to complete goals.' },
    { name: 'Tool use',       type: 'keyword', desc: 'Model calls a function (web search, code exec, DB query). Also called function calling.' },
    { name: 'ReAct',          type: 'keyword', desc: 'Reason→Act→Observe loop — model alternates reasoning traces and tool calls.' },
    { name: 'Tool schema',    type: 'keyword', desc: 'JSON schema describing a function: name, description, parameters. Model decides when to call it.' },
    { name: 'Function calling',type:'keyword', desc: 'API-level structured tool invocation (OpenAI, Anthropic) — model returns a structured call, not text.' },
    { name: 'Agentic loop',   type: 'keyword', desc: 'Perception → reasoning → action → observation — repeated until task is complete or max_steps reached.' },
    { name: 'Memory',         type: 'keyword', desc: 'In-context (recent messages), external (vector DB), episodic (past runs), or parametric (fine-tuned).' },
    { name: 'Multi-agent',    type: 'keyword', desc: 'Multiple specialised LLM agents collaborating — orchestrator + worker pattern.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What Makes an AI Agent',
      points: [
        'An agent is an LLM extended with: (1) tools it can call, (2) memory across steps, (3) an execution loop that runs until the task is done.',
        'The agent perceives its environment (context window), reasons (generates text), acts (calls a tool), and observes the result — then repeats.',
        'Tools are the agent\'s actuators: web search, code execution, file I/O, database queries, API calls, browser automation.',
        'Memory types: in-context (conversation history in the prompt), episodic (past runs retrieved from a DB), procedural (skills encoded in tools), semantic (knowledge in a vector store).',
        'Agents are powerful but fragile — each tool call is a new inference, errors compound, and debugging is hard. Prefer simple chains when possible.',
      ],
    },
    {
      heading: 'Tool Use and Function Calling',
      points: [
        'Tool schema: each tool is described with a JSON schema (name, description, parameters) provided to the model at inference time.',
        'Model decision: when the model decides a tool is needed, it returns a structured tool_call object instead of (or before) text.',
        'Execution: your code invokes the actual function with the model\'s parameters, captures the result, and feeds it back as a tool_result message.',
        'Parallel tool use: modern APIs allow the model to call multiple tools in one turn — search + calculate + lookup simultaneously.',
        'Anthropic tool use: model returns {type: "tool_use", name: "...", input: {...}}. OpenAI: {tool_calls: [{function: {name, arguments}}]}.',
      ],
    },
    {
      heading: 'ReAct and Agentic Patterns',
      points: [
        'ReAct (Reason + Act): model generates Thought (reasoning), Action (tool call), Observation (tool result) in alternating steps.',
        'Plan-and-execute: first generate a full plan, then execute each step. More predictable than step-by-step ReAct.',
        'Reflection: after completing a task, the model critiques its own output and decides whether to retry or refine.',
        'Orchestrator-worker: one orchestrator LLM breaks the task, routes sub-tasks to specialised worker agents, aggregates results.',
        'Safety: always set max_iterations, validate tool parameters, implement timeouts, and never give agents irreversible access (delete, send, publish) without a human checkpoint.',
      ],
    },
    {
      heading: 'Multi-Agent Systems',
      points: [
        'When a single agent\'s context fills up or task requires specialised skills, use multiple agents.',
        'Handoff pattern: orchestrator passes task + context to a worker agent; worker returns result; orchestrator continues.',
        'Parallel agents: fan out independent sub-tasks to multiple agents simultaneously, aggregate results.',
        'Debate: multiple agents argue different positions; a judge agent synthesises the best answer. Reduces single-model bias.',
        'Frameworks: LangGraph (stateful multi-agent graphs), CrewAI (role-based crews), AutoGen (conversational agents), Claude agent SDK.',
      ],
    },
    {
      heading: 'Why Agents Need Guardrails, Not Just Capability',
      points: [
        'An agent with tool access (file system, code execution, API calls) can take real, irreversible actions — unlike a plain chatbot, this means a hallucinated plan or misunderstood instruction can cause actual damage, not just an incorrect text response.',
        'Human-in-the-loop checkpoints (requiring explicit approval before destructive or high-stakes actions) are the standard mitigation, trading some autonomy for a safety net against the agent confidently executing a wrong plan.',
        'Scoped, least-privilege tool access (an agent that can only read files, not delete them, unless explicitly needed) limits the blast radius of a bad decision, following the same principle as least-privilege access control in traditional software security.',
        'Agent loops that lack a clear termination condition or budget (max steps, max cost) risk running indefinitely on a stuck or looping plan, silently consuming API cost and compute without producing useful progress — explicit limits are a necessary safeguard, not an optional nicety.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tool Schema & Loop',
      language: 'typescript',
      code: `// Minimal agentic loop with tool use (Anthropic-style)
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// Define tools
const tools: Anthropic.Tool[] = [
  {
    name: 'web_search',
    description: 'Search the web for current information',
    input_schema: {
      type: 'object' as const,
      properties: { query: { type: 'string', description: 'Search query' } },
      required: ['query'],
    },
  },
  {
    name: 'calculate',
    description: 'Evaluate a mathematical expression',
    input_schema: {
      type: 'object' as const,
      properties: { expression: { type: 'string', description: 'Math expression to evaluate' } },
      required: ['expression'],
    },
  },
];

// Mock tool implementations
function executeTool(name: string, input: Record<string, string>): string {
  if (name === 'web_search') return \`Search results for "\${input['query']}": [result 1, result 2]\`;
  if (name === 'calculate') {
    try { return String(eval(input['expression'])); }
    catch { return 'Error: invalid expression'; }
  }
  return 'Unknown tool';
}

// Agentic loop
async function runAgent(userMessage: string, maxSteps = 10): Promise<string> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userMessage }];

  for (let step = 0; step < maxSteps; step++) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      tools,
      messages,
    });

    // Model is done
    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text');
      return textBlock?.type === 'text' ? textBlock.text : '';
    }

    // Model wants to call tools
    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = response.content
        .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
        .map(toolUse => ({
          type: 'tool_result' as const,
          tool_use_id: toolUse.id,
          content: executeTool(toolUse.name, toolUse.input as Record<string, string>),
        }));
      messages.push({ role: 'user', content: toolResults });
    }
  }
  return 'Max steps reached';
}`,
    },
    {
      label: 'ReAct Pattern',
      language: 'typescript',
      code: `// ReAct pattern: Thought → Action → Observation loop

const REACT_SYSTEM = \`You are a helpful assistant with access to tools.
For each step, output exactly:
Thought: <your reasoning>
Action: <tool_name>(<json_params>)

When you have the final answer, output:
Thought: I now have the answer.
Final Answer: <your answer>
\`;

interface ReActStep {
  thought: string;
  action?: string;
  observation?: string;
}

function parseReActResponse(text: string): { thought: string; action?: string; finalAnswer?: string } {
  const thought = text.match(/Thought: (.+)/)?.[1] ?? '';
  const action = text.match(/Action: (.+)/)?.[1];
  const finalAnswer = text.match(/Final Answer: (.+)/)?.[1];
  return { thought, action, finalAnswer };
}

async function reactLoop(question: string): Promise<string> {
  const history: ReActStep[] = [];
  let context = \`Question: \${question}\n\`;

  for (let i = 0; i < 8; i++) {
    // const response = await llm.complete(REACT_SYSTEM + context);
    // const parsed = parseReActResponse(response);
    // if (parsed.finalAnswer) return parsed.finalAnswer;
    // if (parsed.action) {
    //   const [toolName, paramsStr] = parsed.action.split('(');
    //   const params = JSON.parse(paramsStr.slice(0, -1));
    //   const observation = executeTool(toolName, params);
    //   history.push({ thought: parsed.thought, action: parsed.action, observation });
    //   context += \`Thought: \${parsed.thought}\\nAction: \${parsed.action}\\nObservation: \${observation}\\n\`;
    // }
  }
  return 'Max steps reached';
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not setting a max_iterations limit',
      wrong: `// Infinite agent loop — will run forever if the model keeps calling tools
while (true) {
  const response = await agent.step();
  if (response.done) break;
  // No safety limit — burns API credits, may never terminate
}`,
      right: `// Always cap the loop
const MAX_STEPS = 10;
for (let step = 0; step < MAX_STEPS; step++) {
  const response = await agent.step();
  if (response.done) break;
  if (step === MAX_STEPS - 1) throw new Error('Agent did not complete within max steps');
}`,
      explanation: 'LLM agents can get stuck in reasoning loops, call tools repeatedly without progress, or hallucinate tool results. Always set a hard iteration limit. 5–15 steps cover most real tasks.',
    },
    {
      title: 'Writing tool descriptions that are too vague',
      wrong: `// Vague tool — model doesn't know when or how to use it
{ name: 'search', description: 'Search for things' }
// Model: calls it for everything, or never, or with wrong parameters`,
      right: `// Precise description with when-to-use and parameter guidance
{
  name: 'web_search',
  description: 'Search the internet for current events, facts, or prices AFTER your training cutoff. Use specific, targeted queries. Do NOT use for code generation or reasoning tasks.',
  input_schema: { properties: { query: { type: 'string', description: 'Concise search query (max 10 words)' } } }
}`,
      explanation: 'Tool descriptions are prompts. Vague descriptions cause the model to misuse tools — calling web_search for math questions or calculate for text tasks. Be explicit about WHEN to use each tool and what parameters to pass.',
    },
    {
      title: 'Giving agents irreversible access without human approval',
      wrong: `// Agent can directly send emails, delete files, execute DB commands
tools = [send_email_tool, delete_file_tool, drop_table_tool]
// A hallucinated tool call deletes production data or spams customers`,
      right: `// Separate read-only tools from write tools
// Require human confirmation for any irreversible action
const writeTools = tools.filter(t => t.reversible === false);
if (writeTools.length > 0) {
  const confirmed = await humanCheckpoint(pendingAction);
  if (!confirmed) return 'Action cancelled by user';
}`,
      explanation: 'Agents make mistakes. An irreversible write (send email, delete row, commit code) with a bad parameter can cause real damage. Use read-only tools for autonomous operation; gate write operations behind a human checkpoint.',
    },
    {
      title: 'Stuffing all tools into every agent call',
      wrong: `// 30 tools in every call — model picks randomly, costs more tokens
const response = await llm.withTools(allThirtyTools).complete(message);`,
      right: `// Only expose tools relevant to the current task
// Or route to specialised agents with focused tool sets
function selectTools(taskType: string): Tool[] {
  const toolMap: Record<string, Tool[]> = {
    research: [webSearch, calculator],
    coding: [codeExecutor, fileReader],
    data: [sqlQuery, csvReader],
  };
  return toolMap[taskType] ?? [];
}`,
      explanation: 'More tools = more tokens = higher cost and more confusion. The model must read every tool description at every step. Expose only the tools a specific task needs. Specialised agents with focused tool sets outperform generalist agents with 30 tools.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Tool Schema',
    language: 'typescript',
    description: 'Create a well-structured tool schema for a "get_weather" function that accepts a city name and an optional unit (celsius or fahrenheit). Follow the JSON Schema pattern used by AI APIs.',
    hints: [
      'Schema needs: name, description, input_schema with type, properties, required',
      'Optional fields go in properties but NOT in required array',
    ],
    starterCode: `interface ToolSchema {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

function buildWeatherToolSchema(): ToolSchema {
  // Return a well-structured tool schema for get_weather
}`,
    solution: `interface ToolSchema {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

function buildWeatherToolSchema(): ToolSchema {
  return {
    name: 'get_weather',
    description: 'Get the current weather for a city. Use this when the user asks about weather conditions.',
    input_schema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'The city name, e.g. "London" or "New York"',
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'Temperature unit. Defaults to celsius if not specified.',
        },
      },
      required: ['city'],  // unit is optional — not in required
    },
  };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In an agentic loop, what happens after the model calls a tool?',
      options: [
        'The model generates the final answer immediately',
        'The tool result is fed back into the model\'s context, and the model decides whether to call another tool or answer',
        'The loop terminates automatically',
        'A new model instance is created',
      ],
      answer: 1,
      explanation: 'The tool result is appended to the message history as a tool_result message. The model then sees the result in its context and decides: call another tool, or produce the final answer. This continues until stop_reason is "end_turn".',
    },
    {
      q: 'What is the ReAct pattern?',
      options: [
        'A React.js framework for AI applications',
        'A prompting pattern where the model alternates Thought (reasoning) and Action (tool call) steps before producing an answer',
        'A reward model architecture',
        'A method for reducing hallucination',
      ],
      answer: 1,
      explanation: 'ReAct (Reason + Act) prompts the model to alternate between reasoning traces ("Thought: I need to search for...") and tool calls ("Action: web_search(...)"). Observations are fed back, and the loop continues until "Final Answer:".',
    },
    {
      q: 'Why should you NOT give agents access to irreversible operations by default?',
      options: [
        'Irreversible operations are too slow',
        'LLM agents make mistakes — a wrong parameter on an irreversible operation (delete, send, publish) can cause real damage',
        'Tool schemas don\'t support write operations',
        'It increases the context window usage',
      ],
      answer: 1,
      explanation: 'Agents hallucinate, misinterpret instructions, or get stuck in error loops. An irreversible write tool with a bad parameter can delete production data, spam customers, or publish incorrect content. Always gate write operations behind human confirmation.',
    },
  { q: 'What distinguishes an AI agent from a simple LLM chatbot?', options: ['Agents use larger models', 'Agents can take actions (tool use, API calls) and reason iteratively toward a goal', 'Agents only work with voice input', 'Agents require cloud deployment'], answer: 1, explanation: 'An agent uses an LLM as its reasoning engine but adds tools, memory, and feedback loops. The LLM decides which actions to take; the agent framework executes them and feeds results back. Chatbots just respond; agents act.' },
  { q: 'What is "reflection" (self-critique) as an agentic pattern, and how does it differ from the base ReAct loop?', options: ['It is just another name for ReAct', 'After producing an output, the agent (or a second LLM call) critiques its own attempt against the goal and revises it before finalizing — an extra self-review step ReAct does not include', 'It replaces tool calls with pure reasoning', 'It only applies to code-generation agents'], answer: 1, explanation: 'The base ReAct loop interleaves reasoning and tool actions but has no explicit step where the agent evaluates whether its OWN output actually solved the task well. Reflection adds a dedicated critique step: generate a draft, prompt the model (or a separate "critic" call) to identify flaws or gaps against the original goal, then revise — this catches errors ReAct\'s forward-only reasoning would otherwise carry through to the final answer unchecked.' },
  { q: 'What is the purpose of a tool schema in function calling?', options: ['To train the LLM on new tools', 'To tell the LLM the tool name, parameters, and descriptions so it can invoke it correctly', 'To limit which users can call tools', 'To cache tool results'], answer: 1, explanation: 'Function calling (OpenAI, Anthropic): you provide tool definitions (name, description, JSON Schema of parameters). The LLM decides if/when to call a tool and returns structured JSON. Your code executes the actual tool and returns results to the LLM.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I prevent an agent from hallucinating tool parameters?',
      a: 'Use typed JSON schemas with enums for constrained values, validate input parameters before executing the tool, and return clear error messages the model can learn from. Structured output (function calling API) produces much more reliable parameters than parsing free-text tool calls. Also: describe exactly what the parameter should contain, include examples in the description, and use strict mode (OpenAI strict:true) to enforce the schema. Log tool call inputs/outputs — they\'re usually where things go wrong.',
    },
    {
      q: 'When should I use a multi-agent system vs a single agent?',
      a: 'Use a single agent when: the task fits in one context window, tools are simple, and the workflow is sequential. Use multi-agent when: the task has truly parallel sub-tasks (fan-out), you need specialised skills (researcher + coder + reviewer), the context would overflow with all steps, or you want independent verification (debate pattern). The orchestrator-worker pattern scales well: orchestrator decomposes, workers execute in parallel, orchestrator synthesises. Start single-agent and move to multi-agent only when you hit context or capability limits.',
    },
  { q: 'What is the main risk of a multi-agent system where agents communicate results back and forth freely?', a: 'Compounding errors and context drift: if agent A slightly misinterprets the task and passes a flawed summary to agent B, agent B builds on that flawed premise, and by the time a third agent produces the final output, the original intent may be unrecognizable — with no single agent having "seen" the full original context to catch the drift. Mitigations include giving the orchestrator (not peer agents) sole responsibility for interpreting the original goal and validating each agent\'s output against it, and keeping inter-agent messages structured/schema-validated rather than free-form text summaries that can silently lose or distort information.' },
  { q: 'How do you prevent infinite loops in an autonomous agent?', a: 'Safeguards: (1) Maximum step limit (abort after N iterations); (2) Track seen states — if agent produces the same action twice, break loop; (3) Timeout on the entire agent run; (4) Human-in-the-loop checkpoints for risky actions; (5) Scratchpad review — log all reasoning steps; detect when the model is stuck. Production agents must have hard cutoffs and error handling for tool failures.' },
  { q: 'How does agent memory work?', a: 'Four types: (1) In-context (working) memory: the current conversation/scratchpad in the prompt window — limited by context length; (2) External memory: vector databases for semantic search over past interactions; (3) Entity memory: structured store of known facts (user preferences, entities); (4) Episodic memory: logs of past agent runs. Most frameworks combine in-context memory with a vector store for long-term retrieval.' },
  { q: 'What are the main failure modes of LLM-based agents?', a: 'Common failures: (1) Hallucinated tool calls (wrong parameter names/values); (2) Infinite loops when the goal is ambiguous or tools fail repeatedly; (3) Context stuffing (too much history causes degraded reasoning); (4) Over-autonomy (taking irreversible actions without confirmation); (5) Tool dependency — if one tool is down, agent fails. Mitigation: structured outputs, sandboxed tool execution, human approval for high-stakes actions.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Agents = LLM + tools + memory + agentic loop. ReAct: Thought→Action→Observation. Always cap iterations, use precise tool descriptions, and gate irreversible actions.',
    mustKnow: [
      'Agent = LLM + tools + memory + execution loop with max_iterations',
      'Tool schema: name, description (when to use), input_schema (JSON Schema)',
      'Function calling returns structured tool_call; code executes and returns tool_result',
      'ReAct: Thought (reasoning) → Action (tool) → Observation (result) → repeat',
      'Parallel tool use: model can call multiple tools in one turn',
      'Gate irreversible operations (delete/send/publish) behind human confirmation',
    ],
    interviewFocus: [
      'Describe the agentic loop and how tool results feed back to the model',
      'What makes a good tool description?',
      'When would you use multi-agent vs single-agent architecture?',
    ],
  };
}
