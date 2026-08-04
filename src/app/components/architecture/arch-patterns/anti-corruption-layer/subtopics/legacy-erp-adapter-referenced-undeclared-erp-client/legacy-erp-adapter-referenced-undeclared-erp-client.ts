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
  templateUrl: './legacy-erp-adapter-referenced-undeclared-erp-client.html',
  styleUrl: './legacy-erp-adapter-referenced-undeclared-erp-client.scss'
})
export class LegacyErpAdapterReferencedUndeclaredErpClientSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A field used in one method, but never declared anywhere on the class',
      points: [
        'The "ACL: Legacy ERP Integration" codeTab\'s <code>LegacyErpAdapter</code> class originally declared exactly one member: a private <code>STATUS_MAP</code> property initializer. No constructor was shown at all.',
        'Its <code>getOrder()</code> method calls <code>this.erpClient.fetchOrder(orderId)</code> — but <code>erpClient</code> was never declared as a constructor parameter, a property initializer, or anything else on the class.',
        'Exactly like the sibling "PlaceOrderHandler" bug covered elsewhere in this hub\'s DDD topics, TypeScript strict mode rejects this at compile time: <code>Property \'erpClient\' does not exist on type \'LegacyErpAdapter\'.</code> This is not a style nit — the class as originally written could not compile.',
      ]
    },
    {
      heading: 'Why this specific class made the gap easy to miss',
      points: [
        'The class already has one declared member (<code>STATUS_MAP</code>), which makes it LOOK complete on a skim — a reader\'s eye naturally checks "does this class have SOME fields?" rather than "does this class have EVERY field its methods actually use?"',
        '<code>translate()</code>, the method right above <code>getOrder()</code>, uses no external fields at all — it is a pure function of its <code>record</code> parameter. Reading top to bottom, a reviewer gets used to "these methods are self-contained" right before hitting the one method that is not.',
        'The fix follows the same pattern already established for <code>StripePaymentAdapter</code> earlier on the same page: add a constructor that declares the dependency, exactly the way <code>constructor(private stripe: StripeClient) {}</code> already does for the Stripe adapter.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Before and after — giving the ERP adapter a real constructor',
      language: 'typescript',
      code: `// BEFORE -- no constructor at all; erpClient used but never declared
class LegacyErpAdapter {
  private readonly STATUS_MAP: Record<string, Order['status']> = {
    '10': 'pending', '20': 'processing', '30': 'shipped', '40': 'cancelled',
  };

  translate(record: ErpOrderRecord): Order {
    // ... pure translation logic, no external dependencies ...
    return {} as Order;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    // TS2339: Property 'erpClient' does not exist on type 'LegacyErpAdapter'.
    const record = await this.erpClient.fetchOrder(orderId);
    return record ? this.translate(record) : null;
  }
}

// AFTER -- constructor declares the dependency getOrder() already uses
class LegacyErpAdapter {
  constructor(private erpClient: ErpClient) {}   // <-- the missing piece

  private readonly STATUS_MAP: Record<string, Order['status']> = {
    '10': 'pending', '20': 'processing', '30': 'shipped', '40': 'cancelled',
  };

  translate(record: ErpOrderRecord): Order {
    // ... unchanged ...
    return {} as Order;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const record = await this.erpClient.fetchOrder(orderId); // now valid
    return record ? this.translate(record) : null;
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "This class only had one field before (<code>STATUS_MAP</code>), so adding a constructor now is a bigger structural change than just adding the missing field directly as a property." Do those two fixes actually differ in any meaningful way?',
    hint: 'Where does an <code>ErpClient</code> instance actually come from — can a plain property initializer, like <code>STATUS_MAP</code>, obtain one?',
    solution: 'They are not equivalent, and the constructor is the correct fix. <code>STATUS_MAP</code> works as a bare property initializer because its VALUE is a literal object known entirely at class-definition time — nothing needs to be supplied from outside. <code>erpClient</code> is fundamentally different: it is a COLLABORATOR (a client wrapping a network connection to the ERP system) that has to be constructed and configured somewhere else and handed to this class — there is no literal value to initialize it with inline. A constructor parameter is how the class receives something it cannot construct for itself, which is exactly what <code>erpClient</code> needs. This is the same reasoning already used for <code>StripePaymentAdapter</code>\'s own <code>constructor(private stripe: StripeClient)</code> on this same page — the fix is not a bigger change, it is the SAME kind of fix already modeled once on the page, just applied to the class that was missing it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a class already has one declared field, any other field its methods use is probably declared too — you would not need to check every method individually.',
      reality: 'Per this subtopic\'s theory, that is exactly the assumption that let this bug through — <code>STATUS_MAP</code> being declared said nothing about whether <code>erpClient</code>, used in a completely different method, was declared anywhere at all.'
    },
    {
      thought: 'A class with a pure, self-contained method (like <code>translate()</code>) is unlikely to have a dependency-injection bug elsewhere in the same class.',
      reality: 'Per this subtopic\'s theory, <code>translate()</code> being pure had no bearing on <code>getOrder()</code>\'s own separate, real dependency on <code>erpClient</code> — each method\'s dependencies have to be checked on their own terms.'
    },
    {
      thought: 'Adding a missing dependency as a bare property initializer (like <code>STATUS_MAP</code>) is a simpler fix than adding a constructor parameter.',
      reality: 'Per this subtopic\'s theory, a property initializer only works for values known entirely at class-definition time — a collaborator like <code>erpClient</code> has to be supplied from outside via the constructor, since there is no literal value that could initialize it inline.'
    }
  ];
}
