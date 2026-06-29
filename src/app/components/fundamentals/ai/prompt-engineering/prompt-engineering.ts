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
  selector: 'app-ai-prompt-engineering',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './prompt-engineering.html',
  styleUrl: './prompt-engineering.scss',
})
export class AiPromptEngineering {
  quickRef: QuickRefItem[] = [
    { name: 'Zero-shot',      type: 'keyword', desc: 'No examples in the prompt — rely purely on the model\'s instruction following.' },
    { name: 'Few-shot',       type: 'keyword', desc: 'Include 2–5 input/output examples in the prompt to steer format and reasoning style.' },
    { name: 'Chain-of-thought', type:'keyword', desc: '"Think step by step" — ask the model to reason before answering. Improves accuracy on multi-step tasks.' },
    { name: 'System prompt',  type: 'keyword', desc: 'Persistent instructions for the model\'s role, tone, and constraints — evaluated before every turn.' },
    { name: 'Structured output', type:'keyword',desc: 'Ask for JSON/XML/markdown format. Use JSON schema or function calling for reliable parsing.' },
    { name: 'Temperature 0',  type: 'keyword', desc: 'Greedy decoding — use for deterministic tasks (classification, extraction, code).' },
    { name: 'XML tags',       type: 'keyword', desc: 'Separate sections with <tag> delimiters to reduce ambiguity for the model.' },
    { name: 'Role prompting', type: 'keyword', desc: '"You are a senior TypeScript engineer..." — context primes relevant knowledge.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Prompt Structure and Anatomy',
      points: [
        'System prompt: role, persona, constraints, output format. Loaded once; applies to all turns. Keep it focused — bloated system prompts dilute each instruction.',
        'User message: the actual task. Be specific: WHO (role), WHAT (task), HOW (format/constraints), WHY (context).',
        'Separate sections clearly: use XML tags (<context>, <task>, <format>), markdown headers, or explicit delimiters (---) — prevents the model from confusing instructions with data.',
        'Few-shot examples: the most powerful tool for controlling format. 2–5 examples beat a paragraph of format instructions.',
        'Order matters: models attend more strongly to the beginning and end of a prompt. Put critical instructions at the start or end, not buried in the middle.',
      ],
    },
    {
      heading: 'Chain-of-Thought and Reasoning',
      points: [
        'Chain-of-Thought (CoT): adding "think step by step" or "let\'s reason through this" before answering dramatically improves accuracy on multi-step reasoning.',
        'Zero-shot CoT: just append "Let\'s think step by step" to the prompt. Works surprisingly well on most models.',
        'Few-shot CoT: provide examples that include the reasoning steps, not just the final answer. The model learns the reasoning pattern to apply.',
        'Self-consistency: sample 5–10 CoT completions, take the majority answer. More reliable than a single CoT sample.',
        'ReAct (Reason + Act): interleave reasoning and tool use — Thought→Action→Observation loops. Foundation for AI agents.',
      ],
    },
    {
      heading: 'Structured Output',
      points: [
        'Ask for JSON explicitly and show the schema in the prompt. Without a schema, models invent their own structure.',
        'Use OpenAI function calling / response_format: {type: "json_object"} to enforce JSON output at the API level.',
        'For complex schemas, use Zod + Instructor library (TypeScript) or Pydantic (Python) to validate and retry on schema mismatch.',
        'XML is often more reliable than JSON for models trained on web data — most web content uses HTML/XML, not JSON.',
        'Always wrap output parsing in try/catch + retry logic — even with structured output APIs, models occasionally deviate.',
      ],
    },
    {
      heading: 'Advanced Techniques',
      points: [
        'Role prompting: "You are an expert TypeScript engineer with 10 years experience..." primes the model to use relevant knowledge and vocabulary.',
        'Negative instructions: "Do NOT include introductory filler" reduces hedging. But models follow positive instructions more reliably than negative ones.',
        'Prompt chaining: break complex tasks into sequential prompts — extract → validate → format. Easier to debug and improve per step.',
        'Metaprompting: ask the model to generate/improve its own prompts. Useful for creating task-specific prompts at scale.',
        'Evaluation: A/B test prompts on 50–100 representative examples. One anecdote is not evidence; systematic eval is.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Prompt Patterns',
      language: 'typescript',
      code: `// Core prompt patterns

// 1. Zero-shot — rely on instruction following
const zeroShot = \`
Classify the sentiment of the following review as POSITIVE, NEGATIVE, or NEUTRAL.
Reply with only the label.

Review: "The product arrived on time but the packaging was damaged."
\`;

// 2. Few-shot — steer format and reasoning
const fewShot = \`
Classify sentiment. Reply with only the label.

Review: "Great product, fast shipping!" → POSITIVE
Review: "Broken on arrival, terrible quality." → NEGATIVE
Review: "It's okay, nothing special." → NEUTRAL

Review: "The product arrived on time but the packaging was damaged." →
\`;

// 3. Chain-of-thought
const cot = \`
A store has 45 items. They sell 12 and receive a shipment of 30.
They then sell 8 more. How many items do they have?
Let's think step by step.
\`;

// 4. Structured output with schema
const structuredOutput = \`
Extract the following fields from the support ticket as JSON.
Schema: { "issue": string, "priority": "low"|"medium"|"high", "category": string }

Ticket: "The app crashes every time I try to export to PDF on Windows 11. Blocking my entire team."

Return ONLY valid JSON, no markdown fences.
\`;`,
    },
    {
      label: 'OpenAI API with Types',
      language: 'typescript',
      code: `// Structured output with OpenAI API + Zod validation
// npm install openai zod

import OpenAI from 'openai';
import { z } from 'zod';

const client = new OpenAI();

// Define expected schema
const TicketSchema = z.object({
  issue: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.string(),
});

type Ticket = z.infer<typeof TicketSchema>;

async function extractTicket(ticketText: string): Promise<Ticket> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are a support ticket analyser. Always respond with valid JSON matching the schema: { issue: string, priority: "low"|"medium"|"high", category: string }',
      },
      {
        role: 'user',
        content: \`Extract ticket fields from: \${ticketText}\`,
      },
    ],
  });

  const raw = JSON.parse(response.choices[0].message.content ?? '{}');
  return TicketSchema.parse(raw);  // throws ZodError if schema mismatch — retry here
}

// Few-shot via message history
async function classifyWithFewShot(review: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      { role: 'system', content: 'Classify sentiment as POSITIVE, NEGATIVE, or NEUTRAL. Reply with only the label.' },
      { role: 'user', content: 'Great product, fast shipping!' },
      { role: 'assistant', content: 'POSITIVE' },
      { role: 'user', content: 'Broken on arrival.' },
      { role: 'assistant', content: 'NEGATIVE' },
      { role: 'user', content: review },
    ],
  });
  return response.choices[0].message.content?.trim() ?? '';
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Vague instructions without format specification',
      wrong: `// "Summarise this text" — model invents format, length, style
const prompt = "Summarise this article: " + article;
// Result: sometimes 1 sentence, sometimes 10 paragraphs, sometimes bullet points`,
      right: `// Specify format, length, audience, and what to include
const prompt = \`Summarise the article below in exactly 3 bullet points.
Each bullet: 1 sentence, present tense, focused on the key finding.
Audience: busy executives who need to act on this.

Article: \${article}\`;`,
      explanation: 'The model fills in ambiguous specifications with its own defaults. Always specify format, length, audience, and what to emphasise. Concrete constraints produce consistent, useful outputs.',
    },
    {
      title: 'Relying on JSON without validation',
      wrong: `const response = await llm.complete(prompt);
const data = JSON.parse(response);  // crashes 20% of the time
// Model included markdown fences, explanatory text, or trailing commas`,
      right: `async function extractWithRetry(prompt: string, schema: z.ZodType, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const raw = await llm.complete(prompt);
      const json = raw.replace(/\`\`\`json?\\n?|\\n?\`\`\`/g, '').trim();
      return schema.parse(JSON.parse(json));
    } catch { /* retry */ }
  }
  throw new Error('Failed to get valid structured output');
}`,
      explanation: 'LLMs frequently wrap JSON in markdown fences, add explanations, or produce trailing commas. Always strip fences, validate with a schema (Zod/Pydantic), and implement retry logic.',
    },
    {
      title: 'Putting critical instructions in the middle of a long prompt',
      wrong: `// 500 tokens of context, then buried: "IMPORTANT: always respond in French"
// then 300 more tokens. Model often misses instructions in the middle.`,
      right: `// Lead with critical constraints in the system prompt
// Repeat key constraints at the end of the user message
// Models attend more to beginning and end (primacy + recency effect)`,
      explanation: 'Research shows LLMs have a "lost in the middle" effect — they attend more strongly to the beginning and end of their context. Put critical format and constraint instructions at the start (system prompt) or the very end of the user message.',
    },
    {
      title: 'Not using few-shot examples for format-sensitive tasks',
      wrong: `// Describing the format in prose — model interprets it differently each time
"Return the output as a table with columns for name, date, and amount."
// Sometimes markdown table, sometimes CSV, sometimes just text`,
      right: `// Show don't tell — 2–3 examples are worth 100 words of description
"Format examples:
Input: John paid 50 on Jan 5
Output: | John | Jan 5 | $50.00 |

Input: ..."`,
      explanation: 'Prose format descriptions are ambiguous. A single concrete example shows exactly what you mean — including spacing, punctuation, and edge cases. Few-shot examples are the most reliable format control technique.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a CoT Prompt',
    language: 'typescript',
    description: 'Write a function that builds a chain-of-thought prompt for a math word problem. The prompt should include the problem, ask the model to reason step by step, and request the final numeric answer on the last line.',
    hints: [
      'Append "Let\'s solve this step by step." to trigger CoT',
      'End with a clear extraction instruction like "Final answer (number only):"',
    ],
    starterCode: `function buildCotPrompt(problem: string): string {
  // Return a chain-of-thought prompt string
}`,
    solution: `function buildCotPrompt(problem: string): string {
  return \`Solve the following math problem.

Problem: \${problem}

Let's solve this step by step.

[Work through the reasoning here]

Final answer (number only):\`;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does "chain-of-thought" prompting improve?',
      options: [
        'The speed of model inference',
        'The model\'s accuracy on multi-step reasoning tasks by making it show its work before answering',
        'The model\'s ability to use tools',
        'The model\'s context window size',
      ],
      answer: 1,
      explanation: 'CoT prompting asks the model to reason step-by-step before producing an answer. This moves computation into the generated tokens, dramatically improving accuracy on arithmetic, logic, and multi-step reasoning tasks.',
    },
    {
      q: 'Why are few-shot examples more reliable than prose format descriptions?',
      options: [
        'Few-shot examples use fewer tokens',
        'Prose descriptions are not supported by the API',
        'Examples demonstrate the exact format unambiguously, whereas prose descriptions are interpreted differently each time',
        'Few-shot examples bypass the system prompt',
      ],
      answer: 2,
      explanation: 'Prose format instructions are ambiguous — "return a table" could mean markdown, CSV, or plain text. A concrete example shows exactly what you want, including whitespace, punctuation, and edge cases. Models imitate examples reliably.',
    },
    {
      q: 'What is the "lost in the middle" effect?',
      options: [
        'The model forgets earlier conversation turns',
        'LLMs attend more strongly to content at the beginning and end of their context, missing content in the middle',
        'Tokens in the middle of the context are tokenised differently',
        'The model stops generating after a certain token count',
      ],
      answer: 1,
      explanation: 'Research shows LLMs have reduced attention to content in the middle of long prompts. Critical instructions and retrieved context should be placed at the start (system prompt) or the end of the prompt.',
    },
  { q: 'What is chain-of-thought (CoT) prompting and when is it most effective?', options: ['Chaining multiple API calls', 'Including step-by-step reasoning examples that encourage the model to think before answering', 'Using smaller models for faster chains', 'Caching prompt responses'], answer: 1, explanation: 'CoT: include examples showing intermediate reasoning steps in the prompt (few-shot CoT) or just instruct think step by step (zero-shot CoT). Most effective for math, multi-step reasoning, logic. Less useful for simple factual recall. Works because models generate better answers when they generate reasoning first.' },
  { q: 'What is the difference between zero-shot and few-shot prompting?', options: ['Zero-shot is for code; few-shot for text', 'Zero-shot: task description only (no examples); few-shot: include 2-8 input-output examples in the prompt', 'Few-shot requires model retraining', 'Zero-shot always produces worse results'], answer: 1, explanation: 'Zero-shot: describe the task in the system prompt with no examples — relies on model\'s pretrained knowledge. Few-shot: include examples of desired input-output format — clarifies task requirements and output style. Few-shot is more reliable for specific formats; zero-shot is simpler and works well for clear instructions.' },
  { q: 'What is a system prompt and how does it differ from a user message?', options: ['They are identical', 'System prompt: sets the model\'s persona, constraints, and instructions; user message: the actual query from the user', 'System prompt is optional metadata', 'User message overrides the system prompt'], answer: 1, explanation: 'System prompt: persistent instructions applied to all turns (tone, format, constraints, persona). User message: per-turn input. In chat APIs, the system message is given higher weight. Models are trained to follow system instructions. System prompt injection vulnerability: user input that escapes the intended context and overrides system instructions.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I systematically improve a prompt?',
      a: 'Use an eval-driven loop: (1) Collect 50–100 representative inputs. (2) Define success criteria (exact match, human rating, LLM-as-judge). (3) Baseline: score your current prompt. (4) Hypothesise a change (add examples, clarify instructions, add CoT). (5) Apply the change, re-score, compare. (6) Keep if better, discard if not. One anecdote is not signal. Repeated A/B testing on your eval set is the only reliable way to improve prompts — random vibes-based editing converges slowly.',
    },
    {
      q: 'When should I use XML tags vs markdown in prompts?',
      a: 'Use XML tags (<context>, <task>, <output>) when: you need to clearly separate multiple sections of content (especially when the content itself contains markdown), or you\'re working with Claude (trained to follow XML-delimited instructions especially well). Use markdown (##, ```) when: the output itself is markdown (documentation, READMEs), or the content is simple and single-section. Key rule: use delimiters that the content is unlikely to contain itself, to prevent the model from confusing data with instructions.',
    },
  { q: 'How do you make prompts more robust and reliable?', a: 'Best practices: (1) Be explicit about format (Respond with a JSON object with fields: name, category, confidence); (2) Provide negative examples (Do NOT include explanations); (3) Break complex tasks into subtasks; (4) Add a scratchpad step before the final answer (chain-of-thought); (5) Specify edge cases explicitly; (6) Test with adversarial inputs. Use templating libraries (LangChain PromptTemplate, Jinja2) for parameterized prompts with validation.' },
  { q: 'What is prompt compression and when is it needed?', a: 'Prompt compression reduces token count to lower cost and latency while preserving key information. Techniques: (1) LLMLingua: use a smaller model to drop non-essential tokens; (2) Summarize conversation history instead of including full history; (3) Retrieval-augmented compression: only include relevant context chunks; (4) Selective tool schemas: only send schemas for relevant tools. Needed when: context window approaching limit, cost per call too high, latency too slow.' },
  { q: 'What is the meta-prompt pattern and when do you use it?', a: 'Meta-prompting: use an LLM to generate, refine, or optimize prompts for another LLM task. Example: prompt an LLM to generate 10 variations of a customer service prompt, evaluate each, pick the best. Use when: manually crafting prompts is tedious and test-driven prompt optimization is feasible. Automated prompt optimization tools (DSPy) systematically generate and evaluate prompt variants using your eval metrics.' },
  { q: 'How do you handle multi-turn conversations in prompt engineering?', a: 'Multi-turn context management: (1) Include the full conversation history up to the context limit (simple, common); (2) Summarize older turns when approaching the limit; (3) Entity extraction: maintain a separate state of key facts from the conversation, inject as context; (4) Window approach: include last N turns. Track token count in the conversation to avoid errors. For long-running conversations, a hybrid memory system (recent turns + vector-retrieved past relevant exchanges) works well.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Prompt engineering: specify WHO+WHAT+HOW+WHY; use few-shot examples for format; CoT for reasoning; structured output + schema validation; place critical instructions at start/end.',
    mustKnow: [
      'System prompt: role, constraints, format — applies every turn',
      'Few-shot: 2–5 examples beat prose format descriptions',
      'Chain-of-thought: "think step by step" improves multi-step reasoning',
      'Structured output: use JSON schema / function calling + Zod validation + retry',
      '"Lost in the middle": put critical instructions at start or end of prompt',
      'Eval-driven: test prompts on 50+ examples, not individual anecdotes',
    ],
    interviewFocus: [
      'What is chain-of-thought prompting and why does it work?',
      'How do you reliably extract structured JSON from an LLM?',
      'How would you systematically improve a prompt\'s performance?',
    ],
  };
}
