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
    heading: 'A Parameter the Type System Allows, the Logic Doesn\'t',
    points: [
      'The main page\'s own Challenge solution declares <code>step: number = 1</code> in the ' +
      '<code>Range</code> constructor — a plain <code>number</code>, with nothing in the type system ' +
      'preventing a caller from passing a negative value like <code>new Range(10, 1, -1)</code> to count ' +
      'down.',
      'The <code>next()</code> implementation hardcodes an ascending check: <code>if (current &lt;= end)</code>. ' +
      'For a descending range, <code>current</code> starts at 10 and <code>end</code> is 1 — the FIRST call to ' +
      '<code>next()</code> already sees <code>10 &lt;= 1</code> as false, so the iterator reports ' +
      '<code>done: true</code> immediately, producing ZERO values instead of counting down.',
    ],
  },
  {
    heading: 'Why This Silently Slips Past the Main Page\'s Own Demo',
    points: [
      'The main page\'s own usage examples — <code>new Range(1, 10)</code> and ' +
      '<code>new Range(1, 10).filter(...)</code> — both use the default positive step, so the ascending-only ' +
      'assumption baked into <code>next()</code> is never exercised, let alone tested, against a negative ' +
      'step anywhere on the page.',
      'This is not a crash or a thrown error — it is a SILENT empty iteration, exactly the kind of failure ' +
      'mode that is easy to miss in casual testing, since <code>for (const n of new Range(10, 1, -1)) { }</code> ' +
      'simply does nothing at all, with no exception to point at the cause.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before / After',
    language: 'typescript',
    code: `// BEFORE — the main page's own [Symbol.iterator](), unmodified.
// Hardcodes ascending-only iteration: current <= end.
[Symbol.iterator](): Iterator<number> {
  let current = this.start;
  const { end, step } = this;
  return {
    next(): IteratorResult<number> {
      if (current <= end) {
        const value = current;
        current += step;
        return { value, done: false };
      }
      return { value: 0, done: true };
    }
  };
}

for (const n of new Range(10, 1, -1)) console.log(n);
// Prints NOTHING — the first next() call already sees 10 <= 1 as
// false, so the range reports done immediately.

// AFTER — the continuation check depends on the SIGN of step, so
// both ascending and descending ranges terminate correctly.
[Symbol.iterator](): Iterator<number> {
  let current = this.start;
  const { end, step } = this;
  const stillInRange = (): boolean => step >= 0 ? current <= end : current >= end;
  return {
    next(): IteratorResult<number> {
      if (stillInRange()) {
        const value = current;
        current += step;
        return { value, done: false };
      }
      return { value: 0, done: true };
    }
  };
}

for (const n of new Range(10, 1, -1)) console.log(n);
// Prints 10, 9, 8, 7, 6, 5, 4, 3, 2, 1 — correctly counts down.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'What does <code>new Range(1, 10, -1)</code> do in the ORIGINAL (buggy) implementation — a range whose ' +
    'start is LESS than end, with a NEGATIVE step? Is this case also silently broken, or does it behave ' +
    'differently from the <code>new Range(10, 1, -1)</code> case described above?',
  hint:
    'Check the very first evaluation of <code>current &lt;= end</code> — with start=1 and end=10, does that ' +
    'condition start out true or false, before considering what the negative step will do next?',
  solution:
    'This case is WORSE than silently empty — it runs forever. current starts at 1, end is 10, so ' +
    '1 <= 10 is true on the very first check, and the loop proceeds to yield 1, then adds step (-1) to get ' +
    'current = 0. The check 0 <= 10 is STILL true, so it yields 0, then -1, then -2, continuing to count DOWN ' +
    'toward negative infinity forever, since current is moving further AWAY from satisfying "current > end" ' +
    'rather than toward it — the loop never reaches a state where current <= end becomes false. This is a ' +
    'genuinely different, more severe failure than the "silently empty" case: an infinite loop that would hang ' +
    'a real program (or exhaust memory materializing it into an array), rather than just doing nothing.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the Challenge only ever asks for an ascending Range in its own description, a negative ' +
      'step was never actually a supported use case — this is not really a bug.',
    reality:
      'The constructor\'s own type signature — <code>step: number = 1</code> — places NO restriction on the ' +
      'sign of step, and TypeScript happily compiles <code>new Range(10, 1, -1)</code> with no warning or ' +
      'error. A parameter the type system freely accepts but the implementation silently mishandles is exactly ' +
      'the shape of a real bug, whether or not the original Challenge prose happened to demonstrate it.',
  },
  {
    thought: 'A silent empty iteration is a fairly harmless failure mode — at worst, nothing happens.',
    reality:
      'As the Try It exercise above shows, the SAME underlying flaw produces two very different failure modes ' +
      'depending on the exact inputs: <code>Range(10, 1, -1)</code> silently does nothing, while ' +
      '<code>Range(1, 10, -1)</code> loops forever. "Silent and harmless" is not a safe assumption to make ' +
      'about a hardcoded directional check without tracing every combination of inputs it could actually ' +
      'receive.',
  },
];

@Component({
  selector: 'app-iterator-what-happens-when-range-step-is-negative',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './what-happens-when-range-step-is-negative.html',
  styleUrl: './what-happens-when-range-step-is-negative.scss',
})
export class WhatHappensWhenRangeStepIsNegativeSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
