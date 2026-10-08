import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-json-mode-vs-structured',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './json-mode-vs-structured.html',
  styleUrl: './json-mode-vs-structured.scss'
})
export class JsonModeVsStructuredSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Checked with openai 7.30.1 and zod 4.6.5",
      "points": [
        "<code>{ type: \"json_object\" }</code> (JSON mode) makes the reply parse as JSON, but nothing stops it from having the wrong keys or a priority of \"urgent\".",
        "<code>zodResponseFormat(TicketSchema, \"ticket\")</code> produced <code>{ type: \"json_schema\", json_schema: { name: \"ticket\", strict: true, ... } }</code> with all three fields required and <code>additionalProperties: false</code>.",
        "In this SDK version the helper method is <code>client.chat.completions.parse</code>; it returns the reply with <code>message.parsed</code> already validated against the schema.",
        "So the page's Zod check was doing real work: with JSON mode it is the only thing enforcing the schema. With Structured Outputs it becomes a safety net."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Structured Outputs",
      "language": "typescript",
      "code": "import OpenAI from 'openai';\nimport { zodResponseFormat } from 'openai/helpers/zod';\nimport { z } from 'zod';\n\nconst Ticket = z.object({\n  issue: z.string(),\n  priority: z.enum(['low', 'medium', 'high']),\n  category: z.string(),\n});\n\nconst client = new OpenAI();\nconst completion = await client.chat.completions.parse({\n  model: 'gpt-4o-mini',\n  messages: [{ role: 'user', content: 'Extract the ticket fields: ' + text }],\n  response_format: zodResponseFormat(Ticket, 'ticket'),\n});\nconst ticket = completion.choices[0].message.parsed; // typed and schema-checked"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "You add an optional \"assignee\" field with z.string().optional() and zodResponseFormat throws before any request is sent. Why, and what is the fix?",
    "hint": "What does strict mode require of the properties list?",
    "solution": "Strict mode requires every property to be listed as required, so the SDK rejects .optional() without .nullable() (the error links to the Structured Outputs guide). Use z.string().nullable(): the field stays required, its type becomes string or null, and the model returns null when there is no assignee."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "response_format json_object enforces my schema.",
      "reality": "It enforces valid JSON only; the keys and values can still be wrong."
    },
    {
      "thought": "With Structured Outputs you never need validation.",
      "reality": "Refusals and older models still need handling; keep a check on the parsed result."
    }
  ];
}
