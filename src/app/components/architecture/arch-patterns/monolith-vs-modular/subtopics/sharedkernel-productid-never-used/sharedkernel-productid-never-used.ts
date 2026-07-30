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
  templateUrl: './sharedkernel-productid-never-used.html',
  styleUrl: './sharedkernel-productid-never-used.scss'
})
export class SharedKernelProductIdNeverUsedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A typed value object, exported for cross-module use, that the cross-module method didn\'t actually use',
      points: [
        'The Challenge solution\'s SharedKernel exports Money, ProductId, and CustomerId — value objects specifically meant to be used at module boundaries, per the page\'s own theory ("SharedKernel: A small, agreed-upon subset of the domain model shared across modules"). Yet the ONE actual cross-module interface method in the same solution originally read: <code>getProductPrice(productId: string): Promise&lt;Money&gt;</code> — a bare string, not the ProductId type the SharedKernel exports specifically for this purpose. The page has been corrected to use ProductId.',
        'This is catchable purely by reading the solution\'s own code: it declares interface ProductId { value: string; } as a SharedKernel export, then the only method that takes a product identifier as a parameter uses string instead of ProductId — no domain-driven-design expertise needed, just noticing the declared type isn\'t referenced anywhere.',
      ]
    },
    {
      heading: 'Why this specific gap undercuts the whole point of a typed SharedKernel',
      points: [
        'The entire value proposition of a Money/ProductId/CustomerId-style value-object SharedKernel is TYPE SAFETY at module boundaries — a caller can\'t accidentally pass a customer ID where a product ID was expected, because the compiler enforces the distinction. A bare string parameter provides none of that protection: a customer ID, an order ID, or any other string could be passed to getProductPrice without any compile error.',
        'A solution that DECLARES ProductId as a SharedKernel export but then doesn\'t use it at the one boundary where it would matter is a subtle "looks right, doesn\'t deliver" gap — the SharedKernel section of the answer reads as complete, but the actual cross-module contract doesn\'t benefit from it.',
      ]
    },
    {
      heading: 'What still isn\'t demonstrated, and why that\'s a reasonable scope decision',
      points: [
        'CustomerId remains declared but unused in this specific solution — there\'s no method in this particular example that takes a customer identifier, so there\'s no natural site to demonstrate it. The Challenge\'s own requirement was to "identify what would go in the SharedKernel," not necessarily to demonstrate every listed value object in active use within this one small example.',
        'This is a reasonable scope boundary to draw: fixing ProductId (which DOES have a natural use site — the one cross-module method in the solution) closes the clearest gap, while leaving CustomerId as an identified-but-not-yet-consumed SharedKernel member is honest about what this specific example actually needs.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Untyped vs. typed cross-module boundary',
      language: 'typescript',
      code: `// BEFORE: SharedKernel exports ProductId, but the cross-module
// method that most needs it doesn't use it.
interface ICatalogServiceUntyped {
  getProductPrice(productId: string): Promise<Money>;
  // Nothing stops a caller from accidentally passing a customer ID,
  // an order ID, or any other string here -- the compiler can't help.
}

// SharedKernel value objects (declared, but the interface above
// ignores ProductId entirely):
interface Money { amount: number; currency: string; }
interface ProductId { value: string; }
interface CustomerId { value: string; }

// AFTER: the cross-module method actually uses the typed ID the
// SharedKernel exports specifically for this purpose.
interface ICatalogServiceTyped {
  getProductPrice(productId: ProductId): Promise<Money>;
  // Now a caller MUST construct a ProductId -- passing a bare string,
  // or a CustomerId by mistake, is a compile error, not a runtime bug.
}

// Example of the protection this actually buys:
declare const custId: CustomerId;
// catalogService.getProductPrice(custId);
// ^ TypeScript error: Argument of type 'CustomerId' is not
//   assignable to parameter of type 'ProductId'.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A Challenge solution declares a SharedKernel exporting Money, ProductId, and CustomerId value objects, then defines: <code>interface ICatalogService &#123; getProductPrice(productId: string): Promise&lt;Money&gt;; &#125;</code>. What is inconsistent here, and what does fixing it actually protect against?',
    hint: 'The SharedKernel exports a ProductId type specifically so module boundaries can use it. Does the getProductPrice method\'s parameter type actually use it?',
    solution: 'The method\'s parameter is typed as a bare string, not the ProductId value object the SharedKernel exports -- meaning the one cross-module boundary in this example gets none of the type safety a typed ID is meant to provide. The fix is changing the signature to getProductPrice(productId: ProductId): Promise<Money>. With that fix, passing the wrong kind of identifier (e.g. a CustomerId where a ProductId was expected) becomes a compile-time TypeScript error instead of a bug that could reach production -- which is the entire reason a DDD-style SharedKernel defines distinct ID types in the first place, rather than using bare strings or numbers for every identifier.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a Challenge solution declares a SharedKernel section listing value objects like Money, ProductId, and CustomerId, that alone demonstrates the SharedKernel pattern correctly, regardless of whether those types are actually used elsewhere in the same solution.',
      reality: 'Per this subtopic\'s theory, declaring a type without USING it at the module boundary it\'s meant to protect delivers none of the actual benefit — the whole point of typed IDs in a SharedKernel is enforcing type safety where modules actually call each other, not just listing the types as available.'
    },
    {
      thought: 'A bare string parameter and a single-field value-object wrapper (like ProductId { value: string }) are functionally interchangeable, since both ultimately just hold a string.',
      reality: 'Per this subtopic\'s theory, TypeScript\'s structural typing means a distinct interface like ProductId prevents a DIFFERENT identifier type (like CustomerId) from being passed by mistake — the compiler treats them as incompatible types, a protection a bare string parameter cannot offer regardless of what the string actually contains at runtime.'
    },
    {
      thought: 'Since the Challenge only asked to "identify what would go in the SharedKernel," leaving every listed value object completely unused elsewhere in the solution is an acceptable, fully correct answer.',
      reality: 'Per this subtopic\'s theory, identifying a type as a SharedKernel member is reasonable scope for a type with no natural use site in this specific small example (like CustomerId here) — but when a use site DOES exist (getProductPrice needing a product identifier) and the solution still uses a bare string instead of the declared type, that specific gap is worth fixing, not just documenting.'
    }
  ];
}
