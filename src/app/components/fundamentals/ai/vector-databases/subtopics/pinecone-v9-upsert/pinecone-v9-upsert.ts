import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-pinecone-v9-upsert',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './pinecone-v9-upsert.html',
  styleUrl: './pinecone-v9-upsert.scss'
})
export class PineconeV9UpsertSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Checked against @pinecone-database/pinecone 9.0.0",
      "points": [
        "The type is <code>upsert(options: UpsertOptions)</code>, where <code>UpsertOptions</code> is <code>{ records: PineconeRecord[]; namespace?: string }</code>.",
        "Calling <code>upsert([{ id: 'a', values: [1, 2] }])</code> threw <code>PineconeArgumentError: Must pass in at least 1 record to upsert.</code> — the array has a record, but the SDK looks for a records property.",
        "The positional <code>pc.index('documents')</code> overload is marked deprecated; the options form is <code>pc.index({ name: 'documents' })</code>.",
        "The page now uses the options form for the index and <code>upsert({ records: [...] })</code> in both places."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "v9 shapes",
      "language": "typescript",
      "code": "import { Pinecone } from '@pinecone-database/pinecone';\n\nconst pc = new Pinecone({ apiKey: process.env['PINECONE_API_KEY']! });\nconst index = pc.index({ name: 'documents' });\n\nawait index.upsert({\n  records: [{ id: 'doc-001', values: embedding, metadata: { category: 'policy' } }],\n});\n\n// Namespaces work the same way\nawait index.namespace('user-123').upsert({ records: [{ id: 'note-1', values: embedding }] });"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Why is \"Must pass in at least 1 record\" a misleading error for the old call?",
    "hint": "What does the SDK read from the argument?",
    "solution": "It reads options.records. A bare array has no records property, so the SDK sees undefined and reports zero records, even though the array contains one."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "A validation error about record count means the records are empty.",
      "reality": "Here the records were present but in the wrong shape."
    },
    {
      "thought": "Deprecated overloads stop working.",
      "reality": "pc.index('name') still ran; deprecation is a warning to migrate."
    }
  ];
}
