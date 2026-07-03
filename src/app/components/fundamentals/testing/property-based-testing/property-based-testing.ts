import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-property-based-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './property-based-testing.html',
  styleUrl: './property-based-testing.scss',
})
export class PropertyBasedTesting {
  quickRef: QuickRefItem[] = [
    { name: 'fc.property()',    type: 'function', desc: 'fast-check: define a property with arbitraries and an assertion function.' },
    { name: 'fc.assert()',      type: 'function', desc: 'Run the property — generates 100 test cases by default.' },
    { name: 'Arbitrary',        type: 'keyword',  desc: 'A generator for random values of a specific type (fc.string(), fc.integer()).' },
    { name: 'Shrinking',        type: 'keyword',  desc: 'When a failure is found, fast-check finds the smallest failing input automatically.' },
    { name: 'fc.string()',      type: 'function', desc: 'Generates random strings — length and character set configurable.' },
    { name: 'fc.array()',       type: 'function', desc: 'Generates arrays of random length containing values from another arbitrary.' },
    { name: 'FsCheck',          type: 'keyword',  desc: '.NET property-based testing library (F# + C#) — equivalent to fast-check.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'Example-Based vs Property-Based Testing', points: [
      'Example-based: you pick specific inputs and assert specific outputs.',
      'Property-based: you describe invariants that must hold for ALL valid inputs.',
      'The library generates hundreds of random inputs and verifies the invariant for each.',
      'Edge cases you never thought of (empty strings, MAX_INT, null bytes) are tried automatically.',
    ]},
    { heading: 'What Is a Property?', points: [
      'A property is a universal statement: "for all inputs x, some invariant holds."',
      'Example: "sort is idempotent — sort(sort(arr)) equals sort(arr) for any array."',
      'Example: "encode then decode returns the original — decode(encode(s)) === s for any string."',
      'Properties are more powerful than examples — they hold across the entire input domain.',
    ]},
    { heading: 'Shrinking', points: [
      'When a failure is found, fast-check tries smaller inputs that still fail.',
      'It reports the smallest counter-example — e.g. the empty string instead of a 100-char string.',
      'Shrinking makes the failure actionable — you can understand it immediately.',
      'Without shrinking, a random failure with a complex input is hard to debug.',
    ]},
    { heading: 'When to Use Property-Based Testing', points: [
      'Pure functions with well-defined invariants: parsers, encoders, sorters, calculators.',
      'Round-trip properties: serialise → deserialise → original.',
      'Commutativity: a + b === b + a for all a, b.',
      'Not ideal for: UI behaviour, side effects, business rules that are hard to express as invariants.',
    ]},
    { heading: 'Why Property-Based Testing Finds Bugs Example-Based Tests Miss', points: [
      'Example-based tests only verify the specific inputs a developer thought to write — property-based testing generates hundreds of random inputs automatically, exploring edge cases a human would never think to hand-write.',
      'A property (like "sorting is idempotent — sorting twice equals sorting once" or "encode then decode returns the original value") describes an invariant that must hold for ALL valid inputs, not just a handful of examples.',
      'When a property-based test finds a failing case, most frameworks automatically "shrink" it to the smallest input that still reproduces the failure, turning an obscure random failure into a minimal, debuggable reproduction case.',
      'Property-based testing complements rather than replaces example-based tests — specific known edge cases (empty input, a documented bug\'s exact reproduction) are still best captured as explicit examples for clarity.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'fast-check Basics', language: 'typescript', code:
`import fc from 'fast-check';

// Property: sort is stable and idempotent
test('sort is idempotent', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), arr => {
      const sorted = [...arr].sort((a, b) => a - b);
      const sortedTwice = [...sorted].sort((a, b) => a - b);
      // Sorting an already-sorted array produces the same result
      expect(sortedTwice).toEqual(sorted);
    })
  );
});

// Property: encode/decode round-trip
test('base64 encode then decode returns original', () => {
  fc.assert(
    fc.property(fc.string(), original => {
      const encoded = Buffer.from(original).toString('base64');
      const decoded = Buffer.from(encoded, 'base64').toString('utf8');
      expect(decoded).toBe(original);
    })
  );
});` },
    { label: 'Arbitraries', language: 'typescript', code:
`import fc from 'fast-check';

// Combining arbitraries
const UserArbitrary = fc.record({
  id:    fc.uuid(),
  name:  fc.string({ minLength: 1, maxLength: 100 }),
  age:   fc.integer({ min: 0, max: 130 }),
  email: fc.emailAddress(),
});

test('user serialization round-trip', () => {
  fc.assert(
    fc.property(UserArbitrary, user => {
      const json = JSON.stringify(user);
      const parsed = JSON.parse(json);
      expect(parsed).toEqual(user);
    })
  );
});

// Conditional generation with fc.filter()
const PositiveInt = fc.integer({ min: 1, max: 1_000_000 });

test('dividing positive numbers is always positive', () => {
  fc.assert(
    fc.property(PositiveInt, PositiveInt, (a, b) => {
      expect(a / b).toBeGreaterThan(0);
    })
  );
});` },
    { label: 'Shrinking Example', language: 'typescript', code:
`import fc from 'fast-check';

// Broken implementation for demo
function buggyAdd(a: number, b: number): number {
  // Bug: returns wrong result when both inputs > 100
  if (a > 100 && b > 100) return a + b + 1;
  return a + b;
}

test('addition is commutative (WILL FAIL)', () => {
  fc.assert(
    fc.property(fc.integer(), fc.integer(), (a, b) => {
      expect(buggyAdd(a, b)).toBe(buggyAdd(b, a));
    })
  );
});

// fast-check output:
// Property failed after 1 tests
// { seed: 42, path: "0", endOnFailure: true }
// Counterexample: [101, 101]   ← shrunk to smallest failing input
// Explanation: Property failed by returning Promise<false>` },
    { label: 'FsCheck (.NET)', language: 'csharp', code:
`using FsCheck;
using FsCheck.Xunit;
using Xunit;

public class StringUtilsProperties
{
    // [Property] runs with 100 random inputs by default
    [Property]
    public bool ReverseOfReverse_IsOriginal(string s)
    {
        if (s == null) return true;  // guard for null inputs
        var reversed = new string(s.Reverse().ToArray());
        var doubleReversed = new string(reversed.Reverse().ToArray());
        return doubleReversed == s;
    }

    [Property]
    public bool Sort_IsIdempotent(int[] arr)
    {
        if (arr == null) return true;
        var sorted = arr.OrderBy(x => x).ToArray();
        var sortedTwice = sorted.OrderBy(x => x).ToArray();
        return sorted.SequenceEqual(sortedTwice);
    }
}` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Writing too-weak properties', wrong: 'fc.property(fc.integer(), n => { const result = fn(n); return true; })', right: 'fc.property(fc.integer(), n => { expect(fn(fn(n))).toBe(fn(n)); })', explanation: 'A property that always returns true finds nothing. The invariant must be strong enough to catch real bugs.' },
    { title: 'Using property tests where example tests are clearer', wrong: 'fc.assert(fc.property(...)) to test that add(2, 3) === 5', right: 'test("add(2,3) = 5", () => expect(add(2,3)).toBe(5))', explanation: 'Property tests shine for universal invariants. Specific, well-known examples are better expressed as example-based tests.' },
    { title: 'Not seeding for reproducibility', wrong: 'failed test — no seed logged, cannot reproduce', right: 'fc.assert(fc.property(...), { seed: 12345 }) to reproduce a specific failure', explanation: 'fast-check logs the seed when a test fails. Use fc.assert(..., { seed: x }) to replay the exact same sequence of random values.' },
    { title: 'Generating invalid domain inputs without filtering', wrong: 'fc.integer() generates negative IDs — function throws, test fails unhelpfully', right: 'fc.integer({ min: 1 }) or fc.filter(n => n > 0) to constrain to valid domain', explanation: 'Arbitrary generators produce any value in their range. Constrain them to your function\'s valid input domain to avoid testing error paths unintentionally.' },
    { title: 'Mixing property and example assertions in one test', wrong: 'fc.assert(fc.property(fc.string(), s => { expect(fn(s)).toBe("Alice"); }))', right: 'keep example assertions in separate test(); use property for invariants only', explanation: 'An assertion like toBe("Alice") inside a property runs for every random input and will fail on most of them.' },
  ];

  challenge: Challenge = {
    title: 'Write a property for a clamp function',
    language: 'typescript',
    description: 'Using fast-check, write property-based tests for clamp(n, min, max). Test two properties: (1) result is always within [min, max], (2) clamp is idempotent — clamping twice gives the same result as clamping once.',
    hints: [
      'Use fc.tuple(fc.integer(), fc.integer()).map(([a, b]) => [Math.min(a,b), Math.max(a,b)]) for valid [min, max] pairs.',
      'Idempotency: clamp(clamp(n, min, max), min, max) === clamp(n, min, max).',
    ],
    starterCode:
`import fc from 'fast-check';

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

// Write two fc.assert() property tests here`,
    solution:
`import fc from 'fast-check';

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

const MinMax = fc.tuple(fc.integer(-1000, 1000), fc.integer(-1000, 1000))
  .map(([a, b]) => [Math.min(a, b), Math.max(a, b)] as [number, number]);

test('clamp result is always within [min, max]', () => {
  fc.assert(
    fc.property(fc.integer(-1000, 1000), MinMax, (n, [min, max]) => {
      const result = clamp(n, min, max);
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
    })
  );
});

test('clamp is idempotent', () => {
  fc.assert(
    fc.property(fc.integer(-1000, 1000), MinMax, (n, [min, max]) => {
      const once  = clamp(n, min, max);
      const twice = clamp(once, min, max);
      expect(twice).toBe(once);
    })
  );
});`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What is "shrinking" in property-based testing?', options: ['Reducing the number of test cases to run faster', 'Automatically finding the smallest input that still causes a failure', 'Compressing the test output for CI logs', 'Removing properties that always pass'], answer: 1, explanation: 'When fast-check finds a failing input, it tries smaller/simpler inputs to find the minimal counterexample. This makes failures immediately understandable rather than leaving you with a random 100-character string.' },
    { q: 'Which type of function is best suited for property-based testing?', options: ['UI event handlers', 'Pure functions with well-defined invariants (encoders, parsers, sorters)', 'Database migration scripts', 'Network request handlers'], answer: 1, explanation: 'Property-based testing works best for pure functions where you can express universal invariants (round-trip, commutativity, idempotency). Side-effectful or UI code is harder to express as properties.' },
    { q: 'What is the main advantage of property-based tests over example-based tests?', options: ['They run faster', 'They test with hundreds of automatically-generated inputs, finding edge cases you never thought of', 'They produce better error messages', 'They do not require a test runner'], answer: 1, explanation: 'Hand-written examples only cover what you thought of. Property-based tests generate inputs you would never write — empty strings, very large numbers, null bytes — often finding bugs lurking in edge cases.' },
  { q: 'What is property-based testing?', options: ['Testing specific input-output pairs', 'Testing with randomly generated inputs to verify invariants hold for all valid inputs', 'Testing CSS properties', 'Generating test reports'], answer: 1, explanation: 'Property-based testing defines properties that must hold for ANY valid input, then generates random inputs to try to falsify them. Unlike example-based testing, it explores the input space automatically, finding edge cases you wouldn\'t think to write.' },
  { q: 'What is a "model-based" property test, and how does it differ from a plain invariant property test?', options: ['They are the same technique', 'A model-based test generates a random SEQUENCE of operations and checks the system under test stays consistent with a simplified reference model (e.g. a plain array standing in for a complex data structure) after each step', 'Model-based tests only work on machine learning models', 'It replaces the need for arbitraries entirely'], answer: 1, explanation: 'A plain property test checks one function\'s output against an invariant for a single random input. A model-based test generates a random sequence of commands (push, pop, clear) applied to both the real implementation and a simple reference model in parallel, then asserts their observable state matches after every step — well suited for testing stateful objects like queues, caches, or a custom data structure against a trusted reference implementation.' },
  { q: 'Which JavaScript library is used for property-based testing?', options: ['Faker.js', 'fast-check', 'Chance.js', 'Bogus'], answer: 1, explanation: 'fast-check is the most popular TypeScript/JavaScript property-based testing library. It provides arbitraries (data generators) and integrates with Jest/Vitest: fc.assert(fc.property(fc.integer(), n => n + 0 === n)).' },
  ];

  qna: QnaItem[] = [
    { q: 'How many test cases does fast-check run per property?', a: 'By default, 100. Configure with fc.assert(property, { numRuns: 1000 }). For CI you might run 100 and increase to 10,000 for a nightly fuzz run. The seed is logged on failure so you can replay the exact sequence.' },
    { q: 'Can I use fast-check with Vitest?', a: 'Yes — fast-check is test-runner-agnostic. Import from "fast-check" and use it inside Vitest\'s test() blocks exactly as you would in Jest. There is also @fast-check/vitest with a fc.test() shorthand that integrates the runner more tightly.' },
    { q: 'What is the difference between property-based testing and fuzzing?', a: 'Property-based testing generates structured random inputs within a defined type domain and checks invariants — it is integrated into your normal test suite. Fuzzing generates arbitrary byte sequences and looks for crashes, hangs, or security issues — it typically runs continuously in a separate harness (AFL, libFuzzer). Both find edge cases, but at different layers.' },
  { q: 'What is an arbitrary in property-based testing?', a: 'An arbitrary is a data generator. fast-check provides built-ins: fc.integer(), fc.string(), fc.array(fc.nat()), fc.record({ name: fc.string(), age: fc.nat() }). Compose them: fc.tuple(fc.string(), fc.boolean()). Create custom arbitraries with fc.nat().map(n => n * 2) for even numbers. Arbitraries also know how to shrink.' },
  { q: 'What kind of properties are good candidates for property-based testing?', a: 'Good properties: (1) Idempotency: sort(sort(arr)) === sort(arr); (2) Round-trip: decode(encode(x)) === x; (3) Commutativity: add(a, b) === add(b, a); (4) Invariants: output.length === input.length for map; (5) Comparison oracle: compare a fast implementation to a slow correct reference implementation.' },
  { q: 'How do you reproduce a property-based test failure?', a: 'fast-check prints the seed on failure. Reproduce by passing the same seed to the options: fc.assert(fc.property(...), { seed: -1294967296 }). This runs with the exact same random sequence. Use fc.sample(arb, { seed }) to inspect generated values interactively.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Property-based tests verify invariants hold for hundreds of auto-generated inputs — fast-check finds edge cases and shrinks failures to minimal examples.',
    mustKnow: [
      'Property: a universal statement that holds for all valid inputs',
      'fc.assert(fc.property(arbitrary, n => { /* invariant */ }))',
      'Shrinking: auto-finds smallest failing input on failure',
      'Arbitraries: fc.string(), fc.integer(), fc.array(), fc.record()',
      'Best for: pure functions — round-trip, idempotency, commutativity',
      'Seed in failure output — use { seed: x } to reproduce',
    ],
    interviewFocus: [
      'Property-based vs example-based — complementary, not competing',
      'What shrinking is and why it matters for debugging',
      'Types of properties: round-trip, idempotency, commutativity',
    ],
  };
}
