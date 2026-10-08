import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-js-tiktoken-api',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './js-tiktoken-api.html',
  styleUrl: './js-tiktoken-api.scss'
})
export class JsTiktokenApiSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run with the installed js-tiktoken",
      "points": [
        "The package exports <code>Tiktoken</code>, <code>encodingForModel</code>, <code>getEncoding</code> and <code>getEncodingNameForModel</code>. There is no <code>encoding_for_model</code>.",
        "<code>encodingForModel('gpt-4').encode('Hello, how are you?')</code> returned the plain array <code>[9906, 11, 1268, 527, 499, 30]</code> — the IDs on the page were right, but it is not a Uint32Array.",
        "The encoder object has no <code>free</code> method; manual freeing is needed only for the WebAssembly <code>tiktoken</code> package.",
        "For gpt-4o the same text encodes to <code>[13225, 11, 1495, 553, 481, 30]</code>, because gpt-4o uses a different encoding."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Correct usage",
      "language": "typescript",
      "code": "import { encodingForModel } from 'js-tiktoken';\n\nconst enc = encodingForModel('gpt-4');\nenc.encode('Hello, how are you?'); // [9906, 11, 1268, 527, 499, 30]\n\nencodingForModel('gpt-4o').encode('Hello, how are you?');\n// [13225, 11, 1495, 553, 481, 30]  - different encoding"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "You count tokens with the gpt-4 encoding but send the request to gpt-4o. Will your count be exact?",
    "hint": "Do the two models share a tokeniser?",
    "solution": "Not exactly. gpt-4 uses cl100k_base and gpt-4o uses o200k_base, so counts and IDs differ. Use the encoding for the model you call."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "js-tiktoken and tiktoken share the same API.",
      "reality": "js-tiktoken is pure JavaScript with camelCase names; the WASM tiktoken package uses snake_case and needs free()."
    },
    {
      "thought": "All OpenAI models tokenise text the same way.",
      "reality": "gpt-4 and gpt-4o produced different IDs for the same sentence."
    }
  ];
}
