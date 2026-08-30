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
    heading: 'Two Places the Original Checkout Facade Could Leak Reserved Inventory',
    points: [
      'The main page\'s original <code>CheckoutAsync</code> reserved inventory for each cart item in a loop, ' +
      'and if a LATER item in the SAME cart turned out to be out of stock, it returned ' +
      '<code>CheckoutResult.Failure(...)</code> immediately — with no code anywhere to release the items that ' +
      'had ALREADY been successfully reserved earlier in that same loop.',
      'Separately, the sequence "charge payment, then commit inventory" had no exception handling at all — if ' +
      '<code>payment.Charge(...)</code> had thrown (a realistic outcome for any real payment gateway call: a ' +
      'timeout, a declined card, a network error), every item would remain reserved indefinitely, since the ' +
      'method would exit via the exception before ever reaching <code>inventory.Commit(...)</code>.',
      'Both bugs share the same root cause: the Facade orchestrates several stateful subsystem calls in ' +
      'sequence, but only ever handles the HAPPY path — nothing undoes the earlier steps when a later step ' +
      'fails or throws.',
    ],
  },
  {
    heading: 'Why This Is the Facade\'s Job, Not a Layering Violation',
    points: [
      'The main page\'s own mistake block warns against putting BUSINESS LOGIC in a Facade — but rolling back ' +
      'a failed multi-step orchestration is not business logic, it is the ORCHESTRATION ITSELF staying ' +
      'correct under failure. The Facade is precisely the place that knows the full sequence of steps and is ' +
      'therefore the only place positioned to undo them correctly.',
      'A subsystem class like <code>InventoryService</code> cannot roll back on its own — ' +
      '<code>Reserve()</code> has no idea whether a LATER, unrelated step (payment) is going to fail; only the ' +
      'Facade, which sees the whole sequence, can decide when a rollback is needed.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before — No Rollback on Either Failure Path',
    language: 'csharp',
    code: `public async Task<CheckoutResult> CheckoutAsync(CartSummary cart, PaymentInfo payInfo)
{
    // 1. Reserve inventory
    foreach (var item in cart.Items)
        if (!inventory.Reserve(item.ProductId, item.Qty))
            return CheckoutResult.Failure($"Out of stock: {item.ProductId}");
            // BUG: any items reserved earlier in THIS loop are never released here.

    // 2. Charge payment
    var paymentId = payment.Charge(payInfo.CardToken, cart.Total);
    // BUG: if Charge() throws, every reserved item leaks — Commit() is never reached,
    // and there is no catch block anywhere to release the reservations.

    // 3. Commit inventory
    foreach (var item in cart.Items)
        inventory.Commit(item.ProductId, item.Qty);

    // ...
}`,
  },
  {
    label: 'After — Both Failure Paths Release the Hold',
    language: 'csharp',
    code: `public async Task<CheckoutResult> CheckoutAsync(CartSummary cart, PaymentInfo payInfo)
{
    // 1. Reserve inventory — track what succeeded so a partial failure can be undone
    var reserved = new List<CartItem>();
    foreach (var item in cart.Items)
    {
        if (!inventory.Reserve(item.ProductId, item.Qty))
        {
            foreach (var r in reserved) inventory.Release(r.ProductId, r.Qty);
            return CheckoutResult.Failure($"Out of stock: {item.ProductId}");
        }
        reserved.Add(item);
    }

    try
    {
        // 2. Charge payment
        var paymentId = payment.Charge(payInfo.CardToken, cart.Total);

        // 3. Commit inventory — only once payment has actually succeeded
        foreach (var item in cart.Items)
            inventory.Commit(item.ProductId, item.Qty);

        // 4-5. Shipment + confirmation ...
        var shipmentId = shipping.CreateShipment(paymentId, payInfo.ShippingAddress);
        email.SendOrderConfirmation(payInfo.Email, paymentId);
        return CheckoutResult.Success(paymentId, shipmentId);
    }
    catch
    {
        // Anything failing between reservation and commit releases the hold —
        // no reserved item ever outlives a checkout that didn't complete.
        foreach (var item in cart.Items) inventory.Release(item.ProductId, item.Qty);
        throw;
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A cart has 3 items. Item 1 and item 2 reserve successfully; item 3 fails the stock check. In the ORIGINAL ' +
    '(buggy) code, what is the inventory system\'s state for item 1 and item 2 after ' +
    '<code>CheckoutAsync</code> returns <code>Failure</code>? Walk through why.',
  hint:
    'Trace the loop line by line — does anything run for item 1 or item 2 AFTER item 3\'s check fails?',
  solution:
    'Item 1 and item 2 remain RESERVED, indefinitely, even though the checkout as a whole failed. The loop ' +
    'reserves item 1 (succeeds), reserves item 2 (succeeds), then checks item 3 and gets false back from ' +
    'Reserve() — at that exact point the method returns CheckoutResult.Failure(...) immediately. Nothing in ' +
    'the original code ever revisits items 1 or 2 to release their reservations; the loop simply stops. From ' +
    'the inventory system\'s point of view, those two items are held for an order that will never be placed, ' +
    'silently reducing available stock for every other customer until some other process (if one even exists) ' +
    'eventually expires the reservation.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Adding a try/catch with a rollback to a Facade method is exactly the "business logic in the ' +
      'Facade" mistake the main page warns against.',
    reality:
      'The main page\'s own mistake block specifically calls out DOMAIN rules (a volume discount calculation) ' +
      'as the kind of business logic that does not belong in a Facade. Undoing the Facade\'s OWN prior steps ' +
      'when a later step fails is not a domain rule — it is the orchestration staying correct, which is ' +
      'exactly what a Facade coordinating multiple stateful subsystem calls is responsible for.',
  },
  {
    thought: 'Since InventoryService.Reserve() already checks stock before committing, the reservation itself ' +
      'cannot cause a bug.',
    reality:
      'The reservation succeeding is not the problem — the problem is what happens to that SUCCESSFUL ' +
      'reservation when a LATER, unrelated step in the same checkout fails. Reserve() has no way to know ' +
      'whether the overall checkout will ultimately succeed; only the orchestrating Facade can see the whole ' +
      'sequence and decide a rollback is needed.',
  },
];

@Component({
  selector: 'app-facade-the-missing-rollback-on-partial-checkout-failure',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-missing-rollback-on-partial-checkout-failure.html',
  styleUrl: './the-missing-rollback-on-partial-checkout-failure.scss',
})
export class TheMissingRollbackOnPartialCheckoutFailureSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
