import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-unhandled-stop-reasons',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './unhandled-stop-reasons.html',
  styleUrl: './unhandled-stop-reasons.scss'
})
export class UnhandledStopReasonsSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Checked against @anthropic-ai/sdk 0.132.1",
      "points": [
        "The SDK type is <code>StopReason = 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | 'pause_turn' | 'refusal' | 'model_context_window_exceeded'</code>.",
        "The original loop returned on end_turn and pushed tool results on tool_use. For the other five it fell through to the next iteration with the messages unchanged.",
        "The next request was therefore identical, so at best it got the same truncated or refused reply again, ten times, before returning \"Max steps reached\" and hiding the real cause.",
        "The fixed loop treats every stop reason except tool_use as terminal, and throws <code>Agent stopped early: max_tokens</code> (or whichever reason) when it is not end_turn."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Fixed branch",
      "language": "typescript",
      "code": "// inside the agent loop\nif (response.stop_reason !== 'tool_use') {\n  if (response.stop_reason !== 'end_turn') {\n    throw new Error('Agent stopped early: ' + response.stop_reason);\n  }\n  const textBlock = response.content.find(b => b.type === 'text');\n  return textBlock?.type === 'text' ? textBlock.text : '';\n}\n// tool_use: push the assistant turn and the tool results, then loop"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Your agent often throws \"Agent stopped early: max_tokens\" while writing long reports. What are two reasonable fixes?",
    "hint": "One changes the request, the other changes the task.",
    "solution": "Raise max_tokens so the reply fits, or have the agent write the report in sections (one tool call or turn per section). Resending the same request would not help because nothing about it changed."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "If stop_reason is not tool_use, the model must be finished.",
      "reality": "max_tokens and refusal also stop the turn, and the text may be incomplete or absent."
    },
    {
      "thought": "A max-steps limit catches these cases well enough.",
      "reality": "It stops the loop, but only after repeating the identical request and with no hint of the real cause."
    }
  ];
}
