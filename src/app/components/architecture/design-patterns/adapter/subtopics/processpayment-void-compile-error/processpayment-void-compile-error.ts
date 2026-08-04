import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A One-Liner That Does Not Compile',
    points: [
      'The main page\'s original adaptee wrote <code>ProcessPayment</code> as an expression-bodied method: ' +
      '<code>Console.WriteLine(...) is null || true;</code> — an attempt to squeeze a side effect and a return ' +
      'value into a single expression.',
      '<code>Console.WriteLine</code> returns <code>void</code>. C# does not let you compare a void expression ' +
      'to anything, including <code>null</code> — <code>is null</code> requires an operand that actually ' +
      'produces a value, and void produces none.',
      'The real compiler error here is CS0023 (\"Operator \'is\' cannot be applied to operand of type ' +
      '\'void\'\"), thrown at the exact point the expression tries to treat a void call as a value.',
      'This is a real, reproducible compile error — the adaptee class as originally written would fail to ' +
      'build, which means every downstream example depending on it (the adapter, the checkout service, the DI ' +
      'wiring) would never even reach the point of being tested.',
    ],
  },
  {
    heading: 'Why the Trick Was Attempted at All',
    points: [
      'The author was likely trying to write a "log a message, then return true" one-liner without a full ' +
      'method body — a common instinct when the method genuinely only does two trivial things.',
      '<code>expr1, expr2</code>-style comma sequencing (common in C-family languages like JavaScript) does not ' +
      'exist in C# expression syntax — there is no operator that runs one expression purely for its side effect ' +
      'and then evaluates to a second, unrelated value.',
      'The closest legitimate C# equivalent for "do a side effect, then return a fixed value" as a single ' +
      'expression is a comma-free trick like <code>_ = SideEffect(); return value;</code> inside a real method ' +
      'body — but that is no longer a single expression, so it needs the expanded <code>{ }</code> form anyway.',
    ],
  },
  {
    heading: 'The Fix, and the General Lesson',
    points: [
      'The corrected version simply expands to a normal method body: call <code>Console.WriteLine(...)</code> ' +
      'as its own statement, then <code>return true;</code> on the next line — two statements instead of one ' +
      'contorted expression.',
      'A useful sanity check before writing an expression-bodied member: does the expression you are writing ' +
      'actually produce the value your return type promises? If any part of the chain calls a void-returning ' +
      'method, the expression as a whole cannot itself be that value — it needs a statement body instead.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before / After',
    language: 'csharp',
    code: `// BEFORE — does not compile (CS0023: operator 'is' cannot be
// applied to operand of type 'void')
public class LegacyPaymentGateway
{
    public bool ProcessPayment(int clientId, double amount, string currencyCode) =>
        Console.WriteLine($"Legacy: charging {clientId} {amount} {currencyCode}") is null || true;
}

// AFTER — a normal statement body: side effect, then a real return value
public class LegacyPaymentGateway
{
    public bool ProcessPayment(int clientId, double amount, string currencyCode)
    {
        Console.WriteLine($"Legacy: charging {clientId} {amount} {currencyCode}");
        return true;
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Without running a compiler, explain in your own words exactly which part of ' +
    '<code>Console.WriteLine(...) is null || true</code> fails, and why adding <code>|| true</code> at the end ' +
    'does not rescue the expression.',
  hint:
    'Work from the inside out: what does <code>Console.WriteLine(...)</code> itself evaluate to, BEFORE the ' +
    '<code>is null</code> check ever gets applied to it?',
  solution:
    'Console.WriteLine(...) evaluates to nothing at all — its return type is void, meaning the call produces ' +
    'no value the rest of the expression can use. The is null check immediately to its right tries to test ' +
    'that non-existent value against null, which the compiler rejects outright (CS0023) because is requires ' +
    'an actual operand. The failure happens at that first is null check — the code never even reaches the ' +
    '|| true part, because the left-hand side of || already failed to compile. Appending || true cannot ' +
    'rescue anything, because C# does not evaluate || lazily past a compile error; the whole expression has ' +
    'to be well-formed before it can run at all.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Adding <code>|| true</code> at the end of an expression makes the earlier part of it "not ' +
      'matter."',
    reality:
      '<code>||</code> short-circuits at RUNTIME (skipping the right-hand side once the left-hand side is ' +
      'already true) — but this is a COMPILE-time failure, which happens before any code ever runs. A broken ' +
      'left-hand operand stops the whole expression from compiling at all, regardless of what comes after it.',
  },
  {
    thought: 'Console.WriteLine must return something, since you can chain other calls after it in some ' +
      'languages.',
    reality:
      'In C#, <code>Console.WriteLine</code> is declared <code>public static void WriteLine(...)</code> — it ' +
      'genuinely returns nothing. Some languages (JavaScript\'s <code>console.log</code> returning ' +
      '<code>undefined</code>, which participates in expressions more permissively) blur this line, which is ' +
      'part of why the mistake is an easy one to reach for out of habit.',
  },
  {
    thought: 'This is a stylistic nitpick, not a real bug — the intent of the code is obvious.',
    reality:
      'It is a hard compile error, not a style issue — the project containing this class simply would not ' +
      'build. "The intent is obvious to a human reader" and "the compiler accepts it" are unrelated questions; ' +
      'C# requires every expression to type-check regardless of how clear its intent reads.',
  },
];

@Component({
  selector: 'app-adapter-processpayment-void-compile-error',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './processpayment-void-compile-error.html',
  styleUrl: './processpayment-void-compile-error.scss',
})
export class ProcesspaymentVoidCompileErrorSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
