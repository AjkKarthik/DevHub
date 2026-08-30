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
    heading: 'A Condition That Never Actually Changed Anything',
    points: [
      'The main page\'s own <code>SelectStrategy</code> pattern-matches on ' +
      '<code>(customer.IsPremium, order.Total)</code> with THREE arms: premium customers get ' +
      '<code>FreeShipping</code>, non-premium orders over $100 get one result, and non-premium orders at or ' +
      'under $100 get another. Reading the ORIGINAL code closely: the second and third arms both returned ' +
      '<code>new StandardShipping()</code> — the exact same result — meaning the entire ' +
      '<code>order.Total > 100m</code> check accomplished nothing. A $50 order and a $500 order from a ' +
      'non-premium customer got identical shipping, despite the code visibly branching on the distinction.',
      'This is the kind of bug that survives casual review specifically because the SHAPE of the code looks ' +
      'intentional — three arms, a clear condition, a plausible-looking business rule — while the actual ' +
      'BEHAVIOR silently collapses to two outcomes instead of three.',
    ],
  },
  {
    heading: 'Choosing the Right Fix, Not Just Any Fix',
    points: [
      'Simply deleting the redundant third arm (collapsing to two branches) would "fix" the redundancy but ' +
      'lose whatever business rule the <code>> 100m</code> check was originally meant to express — the more ' +
      'useful fix is figuring out what the THIRD, distinct outcome should plausibly have been.',
      '"Free shipping over $100" is one of the most common real e-commerce thresholds — a natural, ' +
      'well-motivated interpretation of what the missing third outcome was meant to be, and the one applied ' +
      'to the main page\'s own fix: non-premium orders over $100 now correctly return ' +
      '<code>FreeShipping</code> instead of a second, dead copy of <code>StandardShipping</code>.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before / After',
    language: 'csharp',
    code: `// BEFORE — the second and third arms are IDENTICAL. The
// order.Total > 100m check is dead — it can never change the result.
public IShippingStrategy SelectStrategy(Order order, Customer customer) =>
    (customer.IsPremium, order.Total) switch
    {
        (true,  _)      => new FreeShipping(),
        (false, > 100m) => new StandardShipping(),
        (false, _)      => new StandardShipping()   // same as the arm above!
    };

var cheapOrder = new Order { Weight = 1m, Total = 50m };
var bigOrder   = new Order { Weight = 1m, Total = 500m };
// Both return StandardShipping for a non-premium customer — the
// $100 threshold makes literally no difference to the outcome.

// AFTER — the threshold now actually produces a different result,
// matching the common "free shipping over $100" business rule.
public IShippingStrategy SelectStrategy(Order order, Customer customer) =>
    (customer.IsPremium, order.Total) switch
    {
        (true,  _)      => new FreeShipping(),
        (false, > 100m) => new FreeShipping(),  // qualifies for free shipping too
        (false, _)      => new StandardShipping()
    };

// Now bigOrder (Total = 500m) correctly returns FreeShipping, while
// cheapOrder (Total = 50m) still returns StandardShipping.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A non-premium customer places an order with <code>Total = 100m</code> EXACTLY (not over it). Under the ' +
    'FIXED <code>SelectStrategy</code>, which shipping strategy do they get?',
  hint:
    'Look closely at the pattern used in the second arm — is it <code>&gt;= 100m</code> or ' +
    '<code>&gt; 100m</code>?',
  solution:
    'StandardShipping — the fixed code uses > 100m (strictly greater than), so an order of EXACTLY $100 does ' +
    'not match the second arm and falls through to the third, catch-all arm. This is worth checking ' +
    'explicitly because "free shipping over $100" is genuinely ambiguous in plain English about whether ' +
    '$100.00 itself qualifies — the code makes a specific, testable choice (it does not) that a reader could ' +
    'easily assume the opposite of without looking at the actual operator.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'A bug like this — two branches producing the same result — would obviously be caught by any ' +
      'code review or test suite before reaching production.',
    reality:
      'It is exactly the kind of bug that slips through easily: every individual test case still produces a ' +
      'CORRECT-LOOKING result (StandardShipping is a perfectly valid shipping strategy for both a $50 and a ' +
      '$500 non-premium order, in isolation) — nothing throws, nothing crashes, and no single assertion looks ' +
      'wrong on its own. The bug only becomes visible when specifically comparing the $100-threshold case ' +
      'against a case just below it, side by side, which a test suite has to be deliberately written to do.',
  },
  {
    thought: 'Since both original arms returned <code>StandardShipping</code>, the safest interpretation is ' +
      'that <code>order.Total</code> was never meant to affect the shipping strategy at all — the fix should ' +
      'have been to remove the condition, not add a new outcome.',
    reality:
      'That is a DEFENSIBLE alternative reading, but it is a genuine judgment call, not a certainty — the ' +
      'fix applied here (free shipping over $100) is a common, plausible business rule that gives the visibly ' +
      'three-armed pattern match a reason to exist as written. Either fix removes the bug; which one is ' +
      '"correct" depends on requirements this main page never states outright, which is itself worth noticing ' +
      'as a real limitation of fixing a bug from code alone, without the original requirements.',
  },
];

@Component({
  selector: 'app-strategy-identical-branches-bug-in-selectstrategy',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './identical-branches-bug-in-selectstrategy.html',
  styleUrl: './identical-branches-bug-in-selectstrategy.scss',
})
export class IdenticalBranchesBugInSelectstrategySubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
