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
    heading: 'A Term Named Once, Never Applied',
    points: [
      'The main page\'s own mistake block says it directly: "Steps that cannot be undone (emails sent, physical shipments) are \'pivot transactions\' — design the saga to minimise work after them." That\'s the ENTIRE treatment — one sentence, no worked example, and neither codeTab orders its steps with this in mind at all.',
      'A "pivot transaction" is the step in a saga after which there is no going back — everything BEFORE it can still be safely compensated if a later step fails; everything AFTER it cannot. The main page\'s own examples (send an email, ship a physical package) are exactly the kind of step that has no real "undo."',
      'The practical design rule this implies: order a saga\'s steps so every step WITHOUT a clean compensation runs LAST, after every step that DOES have one. Put the irreversible step anywhere earlier, and a later failure has nothing left to safely unwind.',
    ],
  },
  {
    heading: 'Applying It to the Main Page\'s Own Order Saga',
    points: [
      'The main page\'s own orchestration codeTab already happens to get this right BY ACCIDENT: <code>ReserveInventory → ProcessPayment → ConfirmOrder</code>, with compensation only ever running for a payment failure (releasing the reservation). Both reservation and payment ARE compensatable (release, refund) — the pivot only shows up once a genuinely irreversible step (shipping, sending a confirmation SMS) is added to the sequence.',
      'The fix below makes that implicit design choice explicit: a saga step list annotated with whether each step IS compensatable, plus a rule the orchestrator can check — every non-compensatable step must come after every compensatable one.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Pivot-Aware Step Ordering',
    language: 'csharp',
    code: `public record SagaStep(string Name, bool IsCompensatable);

public static class OrderSagaSteps
{
    // The full step sequence, each one explicitly marked.
    public static readonly SagaStep[] Steps =
    [
        new("ReserveInventory", IsCompensatable: true),   // ReleaseInventory undoes it
        new("ProcessPayment",   IsCompensatable: true),   // RefundPayment undoes it
        new("ShipOrder",        IsCompensatable: false),  // no real "un-ship"
        new("SendConfirmationEmail", IsCompensatable: false), // no real "un-send"
    ];

    // A design-time check: once a non-compensatable step appears,
    // every step after it must ALSO be non-compensatable — a
    // compensatable step is never allowed to come after the pivot.
    public static void ValidatePivotOrdering()
    {
        var pastPivot = false;
        foreach (var step in Steps)
        {
            if (!step.IsCompensatable) pastPivot = true;
            else if (pastPivot)
                throw new InvalidOperationException(
                    $"'{step.Name}' is compensatable but runs after a non-compensatable " +
                    "step — its compensation would never be safely reachable if a step " +
                    "after the pivot fails.");
        }
    }

    // The FIRST non-compensatable step is the pivot itself — the point
    // of no return. Everything before it is still safely undoable.
    public static string? PivotStepName =>
        Steps.FirstOrDefault(s => !s.IsCompensatable)?.Name;
}

// The state machine's "During" chain follows this exact order —
// ShipOrder only ever runs once ProcessPayment has fully succeeded,
// never before, so a payment failure never needs to un-ship anything.
public class OrderStateMachine : MassTransitStateMachine<OrderSagaState>
{
    // ... InventoryReserved / PaymentProcessed states from the main
    // page's own codeTab are unchanged; ShipOrder is added as a NEW
    // state reached ONLY from PaymentProcessed, never earlier ...
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A well-meaning teammate proposes reordering the saga to <code>ReserveInventory → SendConfirmationEmail → ProcessPayment → ShipOrder</code>, reasoning that customers like an early confirmation email. Run <code>OrderSagaSteps.ValidatePivotOrdering()</code> against this new order mentally — does it pass, and if not, what real-world problem does it predict?',
  hint: 'Walk the steps in the new order and track exactly when <code>pastPivot</code> would flip to true.',
  solution: `// It fails: SendConfirmationEmail (non-compensatable) comes BEFORE
// ProcessPayment (compensatable) in the proposed order. The check
// flips pastPivot=true at SendConfirmationEmail, then sees
// ProcessPayment (IsCompensatable: true) after that and throws.

// The real-world problem it predicts: if ProcessPayment then fails,
// the saga's compensation for it (RefundPayment... except payment
// never even completed, so there's nothing to refund) is moot -- but
// the customer ALREADY received a confirmation email for an order
// that is now failing. There is no "un-send" for that email. Moving
// the irreversible step earlier doesn't just violate the rule
// abstractly -- it creates the exact customer-facing inconsistency
// the rule exists to prevent.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A "pivot transaction" is just whichever step happens to be in the middle of the saga\'s step list.',
    reality: 'It has nothing to do with POSITION in the list and everything to do with COMPENSATABILITY — specifically, the FIRST step (in execution order) that cannot be cleanly undone. A saga with five compensatable steps followed by one irreversible one has its pivot at position 6, not the middle; a saga where the very first step is irreversible has its pivot at position 1.',
  },
  {
    thought: 'Every real saga can be reordered to put ALL its non-compensatable steps at the very end, so this is always just a matter of careful step sequencing.',
    reality: 'Sometimes a step\'s position is constrained by what data it needs — <code>ShipOrder</code> genuinely cannot run before <code>ProcessPayment</code> succeeds in most business flows, regardless of compensatability concerns. The main page\'s own advice — "design the saga to MINIMISE work after them" (the pivot), not "eliminate all work after them" — is deliberately the weaker, more realistic claim: some saga designs simply cannot get every irreversible step to be literally the last one, only as late as the required business ordering allows.',
  },
];

@Component({
  selector: 'app-dp-saga-pivot',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './ordering-steps-around-the-pivot-transaction.html',
  styleUrl: './ordering-steps-around-the-pivot-transaction.scss',
})
export class OrderingStepsAroundThePivotTransactionSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
