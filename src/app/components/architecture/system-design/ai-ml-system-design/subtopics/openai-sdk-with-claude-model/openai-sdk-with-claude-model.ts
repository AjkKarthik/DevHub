import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './openai-sdk-with-claude-model.html',
  styleUrl: './openai-sdk-with-claude-model.scss'
})
export class OpenaiSdkWithClaudeModelSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The RAG pipeline\'s SDK client and its model name didn\'t match',
      points: [
        'The main page\'s "RAG Pipeline" code sample called openai.chat.completions.create({ model: \'claude-sonnet-4-6\', ... }) — the OpenAI SDK\'s own client, invoked with an Anthropic Claude model identifier. The page has been corrected to use a real OpenAI model name (gpt-4o) with the OpenAI client.',
        'This is catchable purely by recognizing that openai.chat.completions.create() is the OpenAI SDK\'s method for calling OpenAI-hosted models — Anthropic\'s Claude models are served through a completely separate API (Anthropic\'s own SDK, or the Messages API), not through OpenAI\'s endpoint, no external research needed.',
      ]
    },
    {
      heading: 'Why this specific mismatch is worth catching in a reference example',
      points: [
        'The SAME code sample correctly uses openai.embeddings.create({ model: \'text-embedding-3-large\', ... }) earlier for the embedding step — a real OpenAI model name paired with the OpenAI client, exactly as it should be. The mismatch is isolated to the LATER completions call, making it a plausible copy/paste or last-minute-edit artifact rather than a wholesale misunderstanding of which SDK does what.',
        'A reader copying this pattern into a real project would get a runtime error (an invalid model identifier rejected by OpenAI\'s API) rather than a working RAG pipeline — a broken example is worse than a missing one, since it looks correct until actually run.',
      ]
    },
    {
      heading: 'The general pattern: LLM provider SDKs are not interchangeable',
      points: [
        'Different LLM providers (OpenAI, Anthropic, Google, open-weight models served via vLLM/Ollama) each expose their own client library and API surface — a model name string alone doesn\'t make a request "work" against a different provider\'s endpoint; the SDK, base URL, authentication, and request/response shape are all provider-specific.',
        'Some tooling DOES bridge this gap deliberately (an OpenAI-compatible proxy in front of a different provider\'s models, which is exactly what the page\'s own "LLM Serving (vLLM)" code sample demonstrates — vLLM exposes an OpenAI-compatible API for an open-weight Llama model) — but that requires an explicit compatibility layer, which the RAG pipeline\'s openai.chat.completions.create() call never set up for a Claude model.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Provider/SDK pairing — what actually works',
      language: 'typescript',
      code: `// WRONG: OpenAI SDK client, Anthropic model name -- doesn't work
const broken = await openai.chat.completions.create({
  model: 'claude-sonnet-4-6',        // Anthropic model ID
  messages: [{ role: 'user', content: 'Hello' }],
});
// OpenAI's API rejects this -- it has no model by this name.

// RIGHT (option A): OpenAI SDK, real OpenAI model
const openaiCorrect = await openai.chat.completions.create({
  model: 'gpt-4o',                    // real OpenAI model ID
  messages: [{ role: 'user', content: 'Hello' }],
});

// RIGHT (option B): Anthropic's own SDK, for an actual Claude call
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic();
const anthropicCorrect = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',         // correct HERE -- matching SDK
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello' }],
});

// RIGHT (option C): an OpenAI-COMPATIBLE proxy in front of a
// different model -- this is what the page's own vLLM example does,
// serving an open-weight Llama model through an OpenAI-shaped API:
const vllmProxied = await openai.chat.completions.create({
  model: 'meta-llama/Llama-3-8B-Instruct',  // vLLM's own served model
  messages: [{ role: 'user', content: 'Hello' }],
  // requires pointing the OpenAI client's baseURL at the vLLM server
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A RAG pipeline\'s generation step calls openai.chat.completions.create({ model: \'claude-sonnet-4-6\', messages: [...] }). What happens when this code actually runs, and what are two different ways to fix it?',
    hint: 'The OpenAI SDK\'s chat.completions.create() method sends the request to OpenAI\'s own API endpoint. Does OpenAI\'s API have a model registered under the name \'claude-sonnet-4-6\'?',
    solution: 'The request fails -- OpenAI\'s API has no model named \'claude-sonnet-4-6\' (that\'s an Anthropic model identifier), so the call is rejected with an invalid-model error. Two fixes: (1) keep the OpenAI SDK and swap in a real OpenAI model name, e.g. model: \'gpt-4o\'; or (2) keep the Claude model and switch to Anthropic\'s own SDK/client (import Anthropic from \'@anthropic-ai/sdk\'; anthropic.messages.create({ model: \'claude-sonnet-4-6\', ... })) instead of the OpenAI client. A third option exists only if a compatibility proxy is deliberately set up in front of the target model (as the page\'s own vLLM example does for an open-weight model) -- but that requires explicit infrastructure, not just changing the model string.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An SDK client\'s chat/completions method is a generic interface that works with any model name string, as long as the request shape (messages array, max_tokens, etc.) is correct.',
      reality: 'Per this subtopic\'s theory, a provider SDK sends requests to THAT provider\'s own API endpoint — the model name has to match a model actually registered with that specific provider; a well-formed request with the wrong provider\'s model name still gets rejected.'
    },
    {
      thought: 'Since a code sample elsewhere on the same page correctly demonstrates provider/SDK pairing (the OpenAI embeddings call), every other call in the same sample is very likely to follow the same correct pairing.',
      reality: 'Per this subtopic\'s theory, this exact page had a correct OpenAI embeddings call paired with an incorrect OpenAI-client-plus-Claude-model completions call in the SAME function — consistency in one part of a code sample doesn\'t guarantee consistency throughout.'
    },
    {
      thought: 'The page\'s own vLLM example, which serves an open-weight model through an "OpenAI-compatible API," proves that any model name can be used with the OpenAI SDK client as long as a server is running somewhere.',
      reality: 'Per this subtopic\'s theory, the vLLM example specifically sets up a COMPATIBILITY PROXY (a vLLM server exposing an OpenAI-shaped API, with the client\'s baseURL pointed at that server) — this is a deliberate infrastructure choice, not something that happens automatically just by using the OpenAI SDK with any arbitrary model string against OpenAI\'s own default endpoint.'
    }
  ];
}
