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
    heading: 'Option 2 of 3 — Named in the QnA, Never Actually Built',
    points: [
      'The main page’s own QnA lists three approaches for non-CRUD actions: (1) PATCH with a status field, (2) a sub-resource action (<code>POST /orders/42/cancellations</code>, "models the action as creating a new resource"), (3) an RPC-style verb path. Every codeTab on the page only ever shows options 1 and 3 — option 2 is described in prose and never implemented.',
      'The QnA’s own guidance for WHEN to prefer option 2 is precise: "Use option 2 when the action has its own attributes (cancellation reason, timestamp)." A plain <code>PATCH { status: \'cancelled\' }</code> has nowhere natural to put a cancellation REASON or a record of WHO cancelled it — a sub-resource endpoint does, because it creates a genuine new resource with its own fields.',
      'This is also the ONLY one of the three approaches that leaves a permanent, queryable RECORD of the action itself — a cancellation resource can be listed, filtered, and audited independently of the order’s current status field, which a status-only PATCH cannot offer at all.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Real Cancellation Sub-Resource',
    language: 'typescript',
    code: `interface CancellationRecord {
  id: string;
  orderId: string;
  reason: string;
  cancelledBy: string;
  cancelledAt: string;
}

router.post('/orders/:id/cancellations', authenticate, async (req, res) => {
  const order = await db.orders.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (order.status === 'cancelled') {
    // A cancellation already exists -- creating a SECOND one for the
    // same order doesn't make sense (unlike a plain status PATCH,
    // which is naturally idempotent -- setting status to 'cancelled'
    // twice has no extra effect either way).
    return res.status(409).json({ error: 'Order is already cancelled' });
  }

  const { reason } = req.body as { reason?: string };
  if (!reason) {
    return res.status(400).json({ error: 'A cancellation reason is required' });
  }

  // The action creates a REAL, independently-addressable resource --
  // not just a field flip on the order itself.
  const cancellation: CancellationRecord = {
    id: crypto.randomUUID(),
    orderId: order.id,
    reason,
    cancelledBy: req.user.sub,
    cancelledAt: new Date().toISOString(),
  };
  await db.cancellations.create(cancellation);
  await db.orders.update(order.id, { status: 'cancelled' });

  res.status(201)
     .header('Location', \`/orders/\${order.id}/cancellations/\${cancellation.id}\`)
     .json(cancellation);
});

// GET the cancellation record independently of the order -- this is
// what the sub-resource approach actually buys over a plain PATCH:
router.get('/orders/:id/cancellations', authenticate, async (req, res) => {
  const cancellations = await db.cancellations.findByOrderId(req.params.id);
  res.json({ data: cancellations });
});`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate argues the sub-resource approach is strictly more work for no real benefit over <code>PATCH /orders/42 { status: \'cancelled\', reason: \'...\' }</code> — "just add a reason field to the order itself." What capability does the sub-resource endpoint have that adding fields directly to the order genuinely cannot offer?',
  hint: 'What happens if an order is cancelled, and — through some business process — later needs a SECOND cancellation attempt recorded (e.g. a partial cancellation followed by a full one), or if the business wants a full history of every cancellation-related event, not just the most recent one?',
  solution: `// Adding "reason" as a field directly on the order can only ever
// hold the MOST RECENT cancellation's reason -- it's a single field
// on a single row. If the order is ever cancelled more than once
// (partial then full, or a cancellation that's reversed and later
// re-cancelled), the earlier reason is simply overwritten and lost.

// The sub-resource approach creates a genuinely SEPARATE row per
// cancellation event -- db.cancellations.create() -- so a full
// history naturally exists: GET /orders/42/cancellations can return
// EVERY cancellation event ever recorded for that order, each with
// its own reason, its own cancelledBy, its own timestamp. This isn't
// just "more normalized" as an abstract database design preference --
// it's a capability (auditable history of a repeatable action) that
// a single mutable status+reason field on the order can never
// provide, no matter how many extra fields get added to it.

// This is the concrete, mechanical reason behind the QnA's own
// guidance ("use option 2 when the action has its own attributes") --
// it's not really about the NUMBER of extra fields needed, it's about
// whether the action can happen MORE THAN ONCE and needs its own
// independent record each time.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A sub-resource action endpoint like POST /orders/42/cancellations is just a fancier, more RESTful-looking name for the exact same thing a status PATCH does.',
    reality: 'It genuinely creates a NEW, independently-addressable resource — the codeTab above stores it in its own <code>db.cancellations</code> table and returns a real <code>201 Created</code> with a <code>Location</code> header pointing at it, exactly like creating any other resource. A status PATCH mutates the order in place and leaves no separate record at all.',
  },
  {
    thought: 'Since a cancellation "happens once," there’s no real difference between overwriting a status field and creating a sub-resource record.',
    reality: 'Real business processes often DO need more than one cancellation-related event recorded for the same order (a partial cancellation, a later full one, a reversed-then-re-applied cancellation) — the Try It above traces exactly why a single mutable field can only ever hold the most recent one, silently losing history a sub-resource naturally preserves.',
  },
  {
    thought: 'Idempotency works the same way for both approaches — sending the same cancellation request twice is safe either way.',
    reality: 'A status PATCH is naturally idempotent (setting <code>status: \'cancelled\'</code> twice has the same end effect as once) — the sub-resource POST is NOT automatically idempotent, since a naive implementation would create a SECOND cancellation record on a repeated request. The codeTab above explicitly guards against this with a <code>409 Conflict</code> check, a real design consideration the PATCH approach doesn’t need to think about at all.',
  },
];

@Component({
  selector: 'app-api-resource-url-cancellations',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sub-resource-actions-a-real-cancellations-endpoint.html',
  styleUrl: './sub-resource-actions-a-real-cancellations-endpoint.scss',
})
export class SubResourceActionsARealCancellationsEndpointSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
