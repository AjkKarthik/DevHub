import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-stream-usage-exact',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './stream-usage-exact.html',
  styleUrl: './stream-usage-exact.scss'
})
export class StreamUsageExactSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "What the stream returns",
      "points": [
        "A chunk is a network message, not a token: one chunk can carry several tokens, so counting chunks gives a rough number at best.",
        "With <code>stream_options: { include_usage: true }</code>, the last chunk before <code>[DONE]</code> has <code>choices: []</code> and a <code>usage</code> object with <code>prompt_tokens</code>, <code>completion_tokens</code> and <code>total_tokens</code>.",
        "In the local test the SDK passed that chunk through unchanged and the loop captured <code>{ prompt_tokens: 7, completion_tokens: 5, total_tokens: 12 }</code>.",
        "The page's <code>chunk.choices[0]?.delta?.content ?? ''</code> already copes with the empty choices array; it now also keeps <code>chunk.usage</code>."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Capture usage",
      "language": "typescript",
      "code": "const stream = await client.chat.completions.create({\n  model: 'gpt-4o-mini',\n  messages,\n  stream: true,\n  stream_options: { include_usage: true },\n});\n\nlet usage: OpenAI.CompletionUsage | undefined;\nfor await (const chunk of stream) {\n  const delta = chunk.choices[0]?.delta?.content ?? ''; // [] on the usage chunk\n  if (delta) send(delta);\n  if (chunk.usage) usage = chunk.usage;\n}\n// usage -> { prompt_tokens, completion_tokens, total_tokens }"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A teammate counts tokens by running js-tiktoken over the concatenated output instead. Why can that still differ from usage.completion_tokens?",
    "hint": "Does the client know exactly which tokeniser and special tokens the server used?",
    "solution": "The model may use a different encoding than the one chosen locally, and the server counts any special or hidden tokens it adds. usage comes from the server, so it matches what you are billed."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Each streamed chunk is one token.",
      "reality": "Chunks are transport messages and can hold several tokens."
    },
    {
      "thought": "Streaming responses cannot report usage.",
      "reality": "include_usage adds a final usage chunk."
    }
  ];
}
