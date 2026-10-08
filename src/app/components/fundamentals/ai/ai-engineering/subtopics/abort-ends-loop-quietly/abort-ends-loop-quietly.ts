import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-abort-ends-loop-quietly',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './abort-ends-loop-quietly.html',
  styleUrl: './abort-ends-loop-quietly.scss'
})
export class AbortEndsLoopQuietlySubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Observed with a fake upstream",
      "points": [
        "The client disconnected after 250 ms and the server aborted the upstream request.",
        "The <code>for await</code> loop over the stream stopped after 2 chunks without an exception; the catch block never ran.",
        "Execution continued to the next line, which in the original tab wrote <code>data: [DONE]</code> to a closed response.",
        "The fixed tab returns early when <code>abortController.signal.aborted</code> is true after the loop."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Check after the loop",
      "language": "typescript",
      "code": "for await (const chunk of stream) {\n  const delta = chunk.choices[0]?.delta?.content ?? '';\n  if (delta) res.write('data: ' + JSON.stringify({ delta }) + '\\n\\n');\n}\n\nif (abortController.signal.aborted) return; // stopped early: nothing more to send\nres.write('data: [DONE]\\n\\n');\nres.end();"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Your code saves usage-based billing for each request after the stream loop. What goes wrong for aborted requests without the aborted check?",
    "hint": "What does the loop leave in the usage variable?",
    "solution": "The usage chunk only arrives at the end, so after an abort usage is still undefined. Billing code would record nothing or crash on undefined; check aborted first and bill from a token estimate instead."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Every abort surfaces as an AbortError.",
      "reality": "Here the stream iterator just finished early."
    },
    {
      "thought": "Writing [DONE] to a disconnected client is harmless, so the check is optional.",
      "reality": "It is harmless for the socket, but the same path usually runs logging and billing too."
    }
  ];
}
