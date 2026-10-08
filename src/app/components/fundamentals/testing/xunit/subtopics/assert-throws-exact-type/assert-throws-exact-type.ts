import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-assert-throws-exact-type',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './assert-throws-exact-type.html',
  styleUrl: './assert-throws-exact-type.scss'
})
export class AssertThrowsExactTypeSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Exact type versus any subtype",
      "points": [
        "The Challenge's <code>BankAccount.Withdraw</code> throws <code>new InvalidOperationException(\"Insufficient funds\")</code>, and its solution correctly asserts <code>Assert.Throws&lt;InvalidOperationException&gt;</code>. The hint said <code>Assert.Throws&lt;InsufficientFundsException&gt;</code>, a type that does not exist in the starter code.",
        "Even if such a class existed and derived from <code>InvalidOperationException</code>, the hinted assertion would still fail: <code>Assert.Throws&lt;T&gt;</code> checks that the thrown type is exactly <code>T</code>.",
        "<code>Assert.ThrowsAny&lt;T&gt;</code> accepts <code>T</code> or any type derived from it. Use it when the precise subtype is an implementation detail.",
        "The hint now names <code>InvalidOperationException</code> and explains the exact-type rule."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Exact vs any",
      "language": "csharp",
      "code": "public class InsufficientFundsException : InvalidOperationException { }\n\nAction withdraw = () => throw new InsufficientFundsException();\n\nAssert.Throws<InsufficientFundsException>(withdraw);   // passes\nAssert.Throws<InvalidOperationException>(withdraw);    // fails: not the exact type\nAssert.ThrowsAny<InvalidOperationException>(withdraw); // passes: subtype allowed"
    },
    {
      "label": "Challenge assertion",
      "language": "csharp",
      "code": "[Fact]\npublic void Withdraw_InsufficientFunds_ThrowsException()\n{\n    var account = new BankAccount();\n    var ex = Assert.Throws<InvalidOperationException>(() => account.Withdraw(100));\n    Assert.Equal(\"Insufficient funds\", ex.Message);\n}"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A method throws <code>ArgumentNullException</code> when its argument is null. Which of <code>Assert.Throws&lt;ArgumentException&gt;</code>, <code>Assert.Throws&lt;ArgumentNullException&gt;</code> and <code>Assert.ThrowsAny&lt;ArgumentException&gt;</code> pass?",
    "hint": "ArgumentNullException derives from ArgumentException.",
    "solution": "Assert.Throws<ArgumentNullException> passes (exact type) and Assert.ThrowsAny<ArgumentException> passes (subtype allowed). Assert.Throws<ArgumentException> fails because the thrown type is not exactly ArgumentException."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "<code>Assert.Throws&lt;T&gt;</code> works like a catch block and accepts subclasses.",
      "reality": "It requires the exact type. <code>Assert.ThrowsAny&lt;T&gt;</code> is the catch-like version."
    },
    {
      "thought": "The exception name in a hint does not matter as long as the idea is right.",
      "reality": "With exact matching, a wrong type name is a failing test."
    }
  ];
}
