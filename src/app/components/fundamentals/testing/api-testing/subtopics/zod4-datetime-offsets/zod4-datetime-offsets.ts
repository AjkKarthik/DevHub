import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-zod4-datetime-offsets',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './zod4-datetime-offsets.html',
  styleUrl: './zod4-datetime-offsets.scss'
})
export class Zod4DatetimeOffsetsSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Checked with zod 4.6.5",
      "points": [
        "The type definitions mark <code>z.string().email()</code> with \"@deprecated Use z.email() instead\" and <code>z.string().datetime()</code> with \"@deprecated Use z.iso.datetime() instead\".",
        "Running the page's schema: <code>2026-10-08T10:00:00Z</code> passed, but <code>2026-10-08T10:00:00+02:00</code> failed. The default datetime check accepts only the Z (UTC) form.",
        "<code>z.iso.datetime({ offset: true })</code> accepted the +02:00 value.",
        "The schema tab now uses <code>z.email()</code> and <code>z.iso.datetime({ offset: true })</code> with comments."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Before and after",
      "language": "typescript",
      "code": "import { z } from 'zod';\n\nconst Old = z.object({ createdAt: z.string().datetime() });\nOld.safeParse({ createdAt: '2026-10-08T10:00:00+02:00' }).success; // false\n\nconst New = z.object({\n  email: z.email(),\n  createdAt: z.iso.datetime({ offset: true }),\n});\nNew.safeParse({ email: 'a@b.co', createdAt: '2026-10-08T10:00:00+02:00' }).success; // true"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "An API contract says timestamps are always UTC. Should the test schema use <code>{ offset: true }</code>?",
    "hint": "What should happen if the server starts sending +02:00?",
    "solution": "No. Use z.iso.datetime() without offset so the test fails if the server breaks the UTC promise. Allow offsets only when the contract allows them."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Any ISO 8601 timestamp passes z.string().datetime().",
      "reality": "By default only the UTC Z form passes; offsets need <code>{ offset: true }</code>."
    },
    {
      "thought": "Deprecated Zod methods already throw.",
      "reality": "They still work in Zod 4; the deprecation is a warning for future removal."
    }
  ];
}
