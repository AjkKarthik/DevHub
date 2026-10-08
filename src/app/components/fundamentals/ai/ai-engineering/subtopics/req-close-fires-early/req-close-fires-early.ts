import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-req-close-fires-early',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './req-close-fires-early.html',
  styleUrl: './req-close-fires-early.scss'
})
export class ReqCloseFiresEarlySubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Tested with a local server and a fake streaming upstream",
      "points": [
        "A listener attached before reading the body saw <code>req</code> emit close at 0 ms, with <code>req.complete</code> already true. The page attaches its listener after <code>await readBody(req)</code>, so it missed that event.",
        "The test client aborted after 250 ms. With the page's <code>req.on('close')</code>, nothing was cancelled and the upstream stream ran to the end (5 of 5 chunks).",
        "With <code>res.on('close')</code> and a <code>!res.writableFinished</code> check, the disconnect aborted the upstream call after 2 chunks.",
        "The page now listens on <code>res</code>."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Detect the disconnect",
      "language": "typescript",
      "code": "const abortController = new AbortController();\n\n// Not req.on('close'): it fires once the body has been read.\nres.on('close', () => {\n  if (!res.writableFinished) abortController.abort(); // client went away mid-stream\n});\n\nconst stream = await client.chat.completions.create(\n  { model: 'gpt-4o-mini', messages, stream: true },\n  { signal: abortController.signal },\n);"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Why is the writableFinished check needed, if res only closes when the connection ends?",
    "hint": "When else does res emit close?",
    "solution": "res also emits close after you call res.end() normally. writableFinished is true in that case, so the check only aborts when the response closed before it was finished, which is a client disconnect."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "req close means the client disconnected.",
      "reality": "In current Node it means the request has been fully read."
    },
    {
      "thought": "If the abort never fires you would notice an error.",
      "reality": "Nothing fails; the server quietly keeps streaming and paying for tokens."
    }
  ];
}
