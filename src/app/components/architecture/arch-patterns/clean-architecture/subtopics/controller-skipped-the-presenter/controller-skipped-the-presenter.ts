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
  templateUrl: './controller-skipped-the-presenter.html',
  styleUrl: './controller-skipped-the-presenter.scss'
})
export class ControllerSkippedThePresenterSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Three parts of the page said a presenter belongs here — the actual code sample didn\'t use one',
      points: [
        'The page\'s own "Ring Structure" file listing names OrderPresenter.ts as a distinct file: "Http/ OrdersController.ts # adapter: HTTP → use case command OrderPresenter.ts # adapter: result → HTTP response DTO." The theory section states the same split explicitly: "controllers parse HTTP → command; presenters map result → response DTO" — two separate responsibilities. The mistakes block\'s own "right" example for "Returning domain entities from HTTP controllers" shows exactly this pattern in code: return Response.json(OrderPresenter.toDto(result));.',
        'Yet the page\'s separate "Infrastructure Adapter" code sample\'s actual OrdersController.post() method originally built the HTTP response directly inline — return Response.json({ orderId: result.orderId }, { status: 201 }); — never referencing OrderPresenter at all, despite the ring-structure diagram planning for that exact file. The page has been corrected to use OrderPresenter.toDto(result), with a matching OrderPresenter class added.',
      ]
    },
    {
      heading: 'Why this specific gap is exactly the anti-pattern the mistakes block itself warns about',
      points: [
        'The mistakes block\'s "Returning domain entities from HTTP controllers" entry warns against controllers building response shapes without a presenter — and the ORIGINAL "Infrastructure Adapter" code sample did precisely that: assembled the response object ({ orderId: result.orderId }) directly inside the controller method, the same shape of mistake the page explicitly names elsewhere, just with a small literal object instead of a raw domain entity.',
        'This is a case where a page CORRECTLY explains an anti-pattern in one section (the mistakes block) while a DIFFERENT code sample on the same page (the Infrastructure Adapter tab) quietly commits a milder version of that exact anti-pattern — worth checking for specifically when a page has multiple, separately-authored code samples covering overlapping ground.',
      ]
    },
    {
      heading: 'Why this particular mapping step matters even when it looks trivial',
      points: [
        'In this specific example, the mapping is nearly a no-op ({ orderId: result.orderId } vs. an equivalent OrderPresenter.toDto(result)) — which is likely exactly why it was easy to skip without the omission looking obviously wrong. But the whole point of a dedicated presenter is that the response SHAPE can grow more complex (adding fields, renaming for API versioning, redacting internal fields) without that logic creeping back into the controller — a controller that builds its own response object, even a trivial one, is the first step toward that logic re-accumulating there over time.',
        'Keeping the presenter as a real, separate class — even for a currently-trivial mapping — matches the SAME discipline the page\'s own "Putting business logic in the controller" mistakes-block entry argues for: controllers should stay thin adapters, not accumulate logic just because a given case looks simple today.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Inline response building vs. a real presenter',
      language: 'typescript',
      code: `// BEFORE: controller builds the response shape directly --
// exactly the pattern the page's own mistakes block warns against.
class OrdersControllerInline {
  constructor(private useCase: PlaceOrderUseCase) {}

  async post(req: Request): Promise<Response> {
    const cmd = PlaceOrderCommand.fromRequest(req.body);
    const result = await this.useCase.execute(cmd);
    // Response shape built INLINE, in the controller:
    return Response.json({ orderId: result.orderId }, { status: 201 });
  }
}

// AFTER: a real OrderPresenter class does the mapping -- matching
// the page's own Ring Structure file listing and mistakes-block
// "right" example (OrderPresenter.toDto(result)).
class OrderPresenter {
  static toDto(result: PlaceOrderResult): { orderId: string } {
    return { orderId: result.orderId };
  }
}

class OrdersControllerFixed {
  constructor(private useCase: PlaceOrderUseCase) {}

  async post(req: Request): Promise<Response> {
    const cmd = PlaceOrderCommand.fromRequest(req.body);
    const result = await this.useCase.execute(cmd);
    return Response.json(OrderPresenter.toDto(result), { status: 201 });
  }
}

// The mapping logic is trivial TODAY, but living in its own class
// means it can grow (versioned fields, redaction, renaming) without
// that logic creeping back into the controller over time.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A page\'s file-structure diagram lists a separate OrderPresenter.ts file, its theory explicitly splits controller and presenter responsibilities, and its mistakes block shows OrderPresenter.toDto(result) as the correct pattern. A DIFFERENT code sample on the SAME page shows an OrdersController building its JSON response directly inline, with no presenter involved. What is the inconsistency, and why does it matter even though the mapping looks trivial?',
    hint: 'Compare the actual code the controller\'s post() method runs against what the mistakes block\'s own "right" example shows for the identical scenario (mapping a result to an HTTP response).',
    solution: 'The Infrastructure Adapter code sample\'s controller builds the response shape directly ({ orderId: result.orderId }) instead of delegating to a presenter -- the exact anti-pattern the page\'s own mistakes block warns against ("Returning domain entities from HTTP controllers"), just with a small literal object instead of a raw domain entity. It matters even though the mapping is currently trivial because the whole point of a dedicated presenter class is that response-shaping logic (added fields, API versioning, redaction) can grow there over time without leaking back into the controller -- a controller that builds even a TRIVIAL response object directly is the first step toward that logic re-accumulating, which is exactly the discipline the page\'s own "Putting business logic in the controller" mistake warns against in a different but related form.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a controller\'s inline response-mapping code is trivial (a single field, no real transformation logic), skipping a dedicated presenter class for it doesn\'t meaningfully violate the separation-of-concerns principle a presenter exists to enforce.',
      reality: 'Per this subtopic\'s theory, the presenter\'s value isn\'t about how complex TODAY\'s mapping is — it\'s about having a stable, dedicated place for that mapping to live so it doesn\'t grow back into the controller as the response shape evolves; skipping it "because it\'s trivial right now" is exactly how that discipline erodes over time.'
    },
    {
      thought: 'A page whose mistakes block correctly and explicitly warns against an anti-pattern is very unlikely to commit a milder version of that same anti-pattern in a different code sample elsewhere on the page.',
      reality: 'Per this subtopic\'s theory, this is exactly what happened here — the mistakes block correctly shows OrderPresenter.toDto(result) as the right pattern, while a SEPARATE code sample (the Infrastructure Adapter tab) built the response inline instead, showing that explaining an anti-pattern correctly in one place doesn\'t guarantee every other code sample on the same page avoids it.'
    },
    {
      thought: 'A file-structure diagram (like the page\'s own "Ring Structure" listing OrderPresenter.ts) is purely illustrative and not something later code samples on the same page need to actually honor.',
      reality: 'Per this subtopic\'s theory, when a page plans for a specific file/class in its own structure diagram, a later code sample that skips using it entirely is a real, checkable inconsistency — not a stylistic choice — especially when the theory and mistakes block both independently reinforce that the planned class should exist and be used.'
    }
  ];
}
