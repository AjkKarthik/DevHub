import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-async-assert-throws-compile-error',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './async-assert-throws-compile-error.html',
  styleUrl: './async-assert-throws-compile-error.scss'
})
export class AsyncAssertThrowsCompileErrorSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Why it is an error, not a silent pass",
      "points": [
        "An <code>async () =&gt; await svc.GetAsync()</code> lambda converts to <code>Func&lt;Task&gt;</code>. xUnit's assertion library has <code>Assert.Throws</code> overloads for <code>Func&lt;Task&gt;</code> marked <code>[Obsolete(\"You must call Assert.ThrowsAsync&lt;T&gt; (and await the result) when testing async code.\", true)]</code>.",
        "The <code>true</code> in that attribute turns any call into a compiler error, so the page's \"wrong\" example never builds. The xunit.analyzers rule xUnit2014 reports the same thing in the editor.",
        "The page's mistake described the exception as \"never observed\", which is what would happen if the overload existed. xUnit removed that possibility by design. The explanation now quotes the real error.",
        "The correct form is <code>await Assert.ThrowsAsync&lt;T&gt;(...)</code>, which returns the exception for further assertions."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Compile error",
      "language": "csharp",
      "code": "[Fact]\npublic void GetAsync_Throws()\n{\n    Assert.Throws<NotFoundException>(async () => await svc.GetAsync(-1));\n    // error CS0619: 'Assert.Throws<T>(Func<Task>)' is obsolete:\n    // 'You must call Assert.ThrowsAsync<T> (and await the result) when testing async code.'\n}"
    },
    {
      "label": "Correct",
      "language": "csharp",
      "code": "[Fact]\npublic async Task GetAsync_Throws()\n{\n    var ex = await Assert.ThrowsAsync<NotFoundException>(() => svc.GetAsync(-1));\n    Assert.Contains(\"-1\", ex.Message);\n}"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A developer fixes the compile error by writing <code>Assert.ThrowsAsync&lt;NotFoundException&gt;(() =&gt; svc.GetAsync(-1));</code> without <code>await</code>, in a <code>public void</code> test. What can go wrong?",
    "hint": "ThrowsAsync returns a Task.",
    "solution": "The returned Task is discarded, so the test method returns before the assertion finishes and the test passes even if nothing is thrown. Make the test async Task and await the call; analyzer rule xUnit2021 warns about the missing await."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Assert.Throws with an async lambda quietly passes.",
      "reality": "In xUnit it does not compile, because the Func of Task overloads are marked obsolete as errors."
    },
    {
      "thought": "Adding <code>.Result</code> or <code>.Wait()</code> to the async call is a fine workaround.",
      "reality": "Blocking wraps the exception in an AggregateException and can deadlock; use ThrowsAsync."
    }
  ];
}
