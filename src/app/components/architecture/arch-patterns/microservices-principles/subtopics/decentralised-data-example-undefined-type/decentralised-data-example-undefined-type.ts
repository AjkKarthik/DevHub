import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './decentralised-data-example-undefined-type.html',
  styleUrl: './decentralised-data-example-undefined-type.scss'
})
export class DecentralisedDataExampleUndefinedTypeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A type annotation with no matching declaration',
      points: [
        'The page\'s "Decentralised Data" code example originally annotated a variable as <code>product: ProductDto</code>, and a separate helper function returned <code>Promise&lt;ProductDto | null&gt;</code> — but <code>ProductDto</code> was never actually declared anywhere in that code sample or elsewhere on the page.',
        'This is a self-contained catch: no external research needed, just reading the sample as if you were about to paste it into a real file. A reader trying to copy this pattern into their own codebase would hit a compiler error immediately (<code>Cannot find name \'ProductDto\'</code>), even though the SURROUNDING logic (fetch, fallback, timeout) is completely correct.',
        'The page has been corrected to declare the interface at the top of the sample before it\'s used.',
      ]
    },
    {
      heading: 'Why this specific kind of gap is easy to miss on a read-through',
      points: [
        'The missing piece doesn\'t break the READING experience at all — a human scanning the code understands exactly what <code>ProductDto</code> is meant to represent from context (the shape of whatever <code>response.json()</code> returns), so the sample still teaches its intended lesson (call the API, don\'t query another service\'s database directly) perfectly well without the type actually existing.',
        'It only becomes a problem the moment someone tries to RUN or extend the example as real code — which is exactly the gap between "reads fine" and "compiles" that a quick mental compile-check (would this actually build?) catches and a plain read-through does not.',
        'This is a narrower, code-specific version of the same principle behind fact-checking a prose claim: a code sample can be pedagogically clear while still being technically incomplete, and the two need to be checked separately.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reads fine, doesn\'t compile — and the one-line fix',
      language: 'typescript',
      code: `// BEFORE — annotates a type that's never declared. Reads clearly,
// fails to compile the moment it's pasted into a real project:
async function getProductWithFallback(productId: string): Promise<ProductDto | null> {
  // ...
}
// error TS2304: Cannot find name 'ProductDto'.

// AFTER — declare the shape the API response actually has before using it:
interface ProductDto {
  productId: string;
  name: string;
  unitPrice: number;
  inStock: boolean;
}

async function getProductWithFallback(productId: string): Promise<ProductDto | null> {
  // ... same logic as before, now type-checks correctly
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You\'re reviewing a teammate\'s pull request. The diff adds a helper function annotated <code>Promise&lt;OrderSummary | null&gt;</code>, and the PR description says "tested locally, works great." Is "it reads clearly and the reviewer understands the intent" enough to approve, or is there a separate check worth doing first?',
    hint: 'Does <code>OrderSummary</code> actually exist anywhere in the codebase the PR touches — as an import, or declared in the same file?',
    solution: 'Reading clearly and actually compiling are two different checks, and passing one doesn\'t guarantee the other. Before approving, grep the codebase (or just let the TypeScript compiler run) for a declaration or import of OrderSummary — if it doesn\'t exist, the PR won\'t build despite reading perfectly clearly and despite the author\'s local testing (which may have been against a cached build, a different branch, or simply not re-run after a late edit). This mirrors this subtopic\'s own finding: a code sample can teach its intended lesson clearly while still being technically incomplete.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a code sample\'s intent is obvious from context, a missing type declaration is a cosmetic issue, not a real bug.',
      reality: 'Per this subtopic\'s theory, "reads clearly" and "actually compiles" are separate properties — a reader who copies the sample as-is into a real project hits an immediate compiler error, regardless of how clear the surrounding logic reads.'
    },
    {
      thought: 'A missing type declaration would have been caught by simply reading the code sample carefully.',
      reality: 'Per this subtopic\'s theory, the gap is specifically invisible to a read-through, since a human infers the missing type\'s shape from context automatically — it only surfaces when the code is mentally (or actually) compiled, a distinct check from reading.'
    },
    {
      thought: 'This kind of gap only matters for complex, unfamiliar types — a simple DTO-shaped interface like ProductDto is unlikely to be missing.',
      reality: 'Per this subtopic\'s theory, the missing type here was about as simple as they come (a flat DTO shape) — simplicity doesn\'t protect against a declaration being forgotten, it just makes the eventual fix quick once caught.'
    }
  ];
}
