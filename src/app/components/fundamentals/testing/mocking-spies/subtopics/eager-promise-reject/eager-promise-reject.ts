import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-eager-promise-reject',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './eager-promise-reject.html',
  styleUrl: './eager-promise-reject.scss'
})
export class EagerPromiseRejectSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "When the promise is created",
      "points": [
        "Jest documents <code>mockResolvedValue(v)</code> as sugar for <code>mockImplementation(() =&gt; Promise.resolve(v))</code>: a new promise each call. <code>mockReturnValue(Promise.resolve(v))</code> creates one promise during setup and returns that same promise every time.",
        "Measured with jest-mock 30.5: <code>a() === a()</code> was false for <code>mockResolvedValue</code> and true for <code>mockReturnValue(Promise.resolve(...))</code>. For resolved values that rarely matters.",
        "For rejections it does. <code>mockReturnValue(Promise.reject(new Error(\"eager\")))</code> creates a rejected promise immediately with nothing attached to it. Node reported an unhandled rejection before the test called the mock, then a PromiseRejectionHandledWarning when it was finally caught.",
        "<code>mockRejectedValue(new Error(\"lazy\"))</code> did not: the rejected promise only exists once the code under test calls the mock and awaits it. The quiz explanation on the page now states the difference."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measured",
      "language": "typescript",
      "code": "process.on('unhandledRejection', e => console.log('UNHANDLED:', e.message));\n\nconst lazy  = jest.fn().mockRejectedValue(new Error('lazy'));\nconst eager = jest.fn().mockReturnValue(Promise.reject(new Error('eager')));\n\n// ...later, inside the test\nawait eager().catch(e => e);   // caught, but too late\nawait lazy().catch(e => e);    // caught\n\n// Output:\n// UNHANDLED: eager\n// PromiseRejectionHandledWarning: Promise rejection was handled asynchronously"
    },
    {
      "label": "Use the async helpers",
      "language": "typescript",
      "code": "mockEmail.send.mockRejectedValue(new Error('SMTP failure'));\nawait expect(svc.sendWelcome('user@example.com')).rejects.toThrow('SMTP failure');\n\n// One call fails, later calls succeed:\nmockEmail.send\n  .mockRejectedValueOnce(new Error('timeout'))\n  .mockResolvedValue(undefined);"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A test file sets <code>const fetchUser = jest.fn().mockReturnValue(Promise.reject(new Error(\"404\")))</code> at the top. Only one of its five tests calls <code>fetchUser</code>. What can go wrong in the other four, and what is the fix?",
    "hint": "The rejected promise exists as soon as the file is loaded.",
    "solution": "The rejected promise is created when the file loads and nobody handles it until (or unless) the one test calls the mock, so Node reports an unhandled rejection. Depending on configuration that prints noise or fails the run, and it can be blamed on an unrelated test. Use mockRejectedValue(new Error(\"404\")), ideally set inside the test that needs it."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "<code>mockResolvedValue(v)</code> and <code>mockReturnValue(Promise.resolve(v))</code> are the same thing.",
      "reality": "They resolve to the same value but differ in when the promise is created. With rejections that timing difference causes unhandled-rejection warnings."
    },
    {
      "thought": "Creating a new promise per call means each call gets a fresh copy of the value.",
      "reality": "The promise is new, but the value it resolves to is the same object. Mutating it in one test affects the next call."
    }
  ];
}
