import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-fc-integer-positional-args',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './fc-integer-positional-args.html',
  styleUrl: './fc-integer-positional-args.scss'
})
export class FcIntegerPositionalArgsSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "What actually ran",
      "points": [
        "The Challenge solution declared <code>fc.tuple(fc.integer(-1000, 1000), fc.integer(-1000, 1000))</code> and used <code>fc.integer(-1000, 1000)</code> for <code>n</code>.",
        "With fast-check 4.10, <code>fc.sample(fc.integer(-1000, 1000), 3)</code> returned <code>[-11, -6, 1743045805]</code>: the arguments were ignored and the full integer range was used. <code>fc.integer({ min: -1000, max: 1000 })</code> stayed inside the range.",
        "The clamp properties still passed, because clamp is correct for any integers, so nothing pointed at the problem. In TypeScript the call does not compile, since <code>integer</code> takes one optional constraints object.",
        "The Challenge now uses <code>fc.integer({ min: -1000, max: 1000 })</code> everywhere, which matches its own hint and the page's other arbitraries."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measured",
      "language": "typescript",
      "code": "import fc from 'fast-check';   // 4.10\n\nfc.sample(fc.integer(-1000, 1000), 3);\n// [-11, -6, 1743045805]     <- bounds ignored\n\nfc.sample(fc.integer({ min: -1000, max: 1000 }), 3);\n// [646, -5, -830]           <- bounds respected"
    },
    {
      "label": "Fixed Challenge arbitraries",
      "language": "typescript",
      "code": "const Int = fc.integer({ min: -1000, max: 1000 });\n\nconst MinMax = fc.tuple(Int, Int)\n  .map(([a, b]) => [Math.min(a, b), Math.max(a, b)] as [number, number]);\n\nfc.assert(fc.property(Int, MinMax, (n, [min, max]) => {\n  const result = clamp(n, min, max);\n  expect(result).toBeGreaterThanOrEqual(min);\n  expect(result).toBeLessThanOrEqual(max);\n}));"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Why did the broken Challenge still pass both properties, and what kind of property would have exposed that the range was ignored?",
    "hint": "The properties check clamp, not the generator.",
    "solution": "clamp is correct for every integer, so a wider input range cannot make it fail. Only a property that depends on the range would notice, for example asserting -1000 <= n <= 1000 inside the property, or checking the generator with fc.sample before relying on it."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "If the tests pass, the arbitraries generated what I asked for.",
      "reality": "Arbitraries can silently generate something else. Inspect them with <code>fc.sample</code> when the range matters."
    },
    {
      "thought": "fast-check throws on unexpected arguments.",
      "reality": "At runtime the extra positional arguments are simply ignored. Only the TypeScript type check catches them."
    }
  ];
}
