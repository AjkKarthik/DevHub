import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-fence-stripping-misses',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './fence-stripping-misses.html',
  styleUrl: './fence-stripping-misses.scss'
})
export class FenceStrippingMissesSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Tested on five replies",
      "points": [
        "The old pattern removed <code>```json</code> and closing fences. On a clean fenced reply it worked.",
        "On <code>Sure! ```json {...} ```</code> it left <code>Sure! {...}</code>, and <code>JSON.parse</code> failed on the word Sure.",
        "On <code>```JSON</code> (uppercase) it removed only the backticks and left the word JSON in front of the object, so parsing failed again.",
        "The new code takes the fenced body case-insensitively when present, then keeps only the text between the first <code>{</code> and the last <code>}</code>. All five test replies parsed, including plain JSON and JSON surrounded by prose."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Extract, do not strip",
      "language": "typescript",
      "code": "function extractJson(raw: string): unknown {\n  const fence = raw.match(/```(?:json)?\\s*([\\s\\S]*?)```/i);\n  const body = (fence ? fence[1] : raw).trim();\n  const start = body.indexOf('{');\n  const end = body.lastIndexOf('}');\n  if (start < 0 || end < start) throw new Error('no JSON object found');\n  return JSON.parse(body.slice(start, end + 1));\n}\n\nextractJson('Sure! ```json\\n{\"a\":1}\\n```');           // { a: 1 }\nextractJson('```JSON\\n{\"a\":1}\\n```');                 // { a: 1 }\nextractJson('Here you go: {\"a\":1} Hope that helps.'); // { a: 1 }"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "The model returns a JSON array of tickets instead of an object. Does extractJson handle it?",
    "hint": "Which characters does it search for?",
    "solution": "No. It looks for { and }, so for an array it would slice from the first object inside the array to the last one and fail to parse, or return the wrong shape. Search for [ and ] when you expect an array, or validate with the schema and retry."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Removing the backticks is enough to get valid JSON.",
      "reality": "Any text outside the fences, and the language tag in another case, still breaks <code>JSON.parse</code>."
    },
    {
      "thought": "If parsing usually works, the retry loop will cover the rest.",
      "reality": "A deterministic parsing bug fails the same way on every retry at temperature 0."
    }
  ];
}
