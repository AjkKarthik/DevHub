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
    heading: 'The Same Pattern, One Layer Up',
    points: [
      'The main page\'s QnA describes the API Gateway pattern as "an architectural Facade: one entry point for ' +
      'clients that aggregates calls to multiple backend services" — structurally, this is the exact same ' +
      'shape as the main page\'s own <code>CheckoutFacade</code>, just with the "subsystem classes" replaced ' +
      'by separate SERVICES reached over the network instead of in-process object references.',
      'A client calling <code>POST /checkout</code> on a gateway, which then calls the inventory service, the ' +
      'payment service, and the shipping service over HTTP, is doing precisely what ' +
      '<code>CheckoutFacade.CheckoutAsync</code> does in-process — orchestrate several calls behind one simple ' +
      'entry point.',
    ],
  },
  {
    heading: 'What Actually Changes at the Network Boundary',
    points: [
      'In-process, the sibling subtopic on this page\'s rollback bug showed a Facade\'s calls either all ' +
      'complete or the exception propagates immediately — there is no window where a caller sees a HALF-DONE ' +
      'result, because everything happens on one thread inside one process.',
      'Across a network, a call to any one backend service can fail INDEPENDENTLY of the others — a timeout, a ' +
      'dropped connection, a 503 — and the gateway can be left holding results from SOME calls but not others, ' +
      'in a way that a plain in-process try/catch around a sequence of method calls does not have to reason ' +
      'about at all.',
      'This means an API Gateway needs the SAME rollback discipline the sibling subtopic added to ' +
      '<code>CheckoutFacade</code> — but now each "step" can fail in ways an in-process call cannot (timeout, ' +
      'partial network partition, the backend accepting the request but the RESPONSE never arriving) so the ' +
      'gateway cannot always be certain whether a step actually completed or not.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'In-Process Facade (Recap)',
    language: 'csharp',
    code: `// The main page's own shape: one process, one thread, calls either
// all complete or the exception is caught immediately — no ambiguity
// about whether a step "actually happened."
public class CheckoutFacade(InventoryService inventory, PaymentGateway payment)
{
    public async Task<CheckoutResult> CheckoutAsync(CartSummary cart, PaymentInfo payInfo)
    {
        inventory.Reserve(cart.Items[0].ProductId, cart.Items[0].Qty); // in-process call —
                                                                         // succeeds or throws, never "unknown"
        var paymentId = payment.Charge(payInfo.CardToken, cart.Total);
        return CheckoutResult.Success(paymentId, "");
    }
}`,
  },
  {
    label: 'Network-Boundary Facade — the Gateway Cannot Always Know',
    language: 'csharp',
    code: `// Same shape, but each "subsystem call" is now an HTTP call to a
// SEPARATE service — and a timeout means the gateway genuinely does not
// know whether the backend applied the change or not.
public class CheckoutGateway(HttpClient inventoryClient, HttpClient paymentClient)
{
    public async Task<CheckoutResult> CheckoutAsync(CartSummary cart, PaymentInfo payInfo)
    {
        HttpResponseMessage reserveResponse;
        try
        {
            reserveResponse = await inventoryClient.PostAsJsonAsync("/reserve", cart);
        }
        catch (TaskCanceledException)
        {
            // A timeout here is fundamentally different from an in-process exception:
            // the inventory service may have ALREADY reserved the stock before the
            // response was lost — the gateway cannot distinguish "it never ran" from
            // "it ran but the response never arrived." A blind retry can double-reserve.
            return CheckoutResult.Failure("Inventory service timed out — retry with the SAME idempotency key");
        }

        if (!reserveResponse.IsSuccessStatusCode)
            return CheckoutResult.Failure("Inventory unavailable");

        // The payment call needs its OWN failure handling — a compensating call to
        // release the reservation, made over the network, which can ALSO fail or time out.
        var paymentResponse = await paymentClient.PostAsJsonAsync("/charge", payInfo);
        if (!paymentResponse.IsSuccessStatusCode)
        {
            await inventoryClient.PostAsJsonAsync("/release", cart); // this call can fail too
            return CheckoutResult.Failure("Payment declined");
        }

        return CheckoutResult.Success("", "");
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The comment in the gateway version says a timeout means "the gateway cannot distinguish \'it never ran\' ' +
    'from \'it ran but the response never arrived.\'" Why does this exact ambiguity never occur in the ' +
    'in-process <code>CheckoutFacade</code> version shown alongside it?',
  hint:
    'Think about what could possibly separate "the method call happened" from "the caller found out about ' +
    'it" inside a single process, versus across a network.',
  solution:
    'Inside a single process, a method call and its result are inseparable — if inventory.Reserve(...) runs ' +
    'at all, the calling thread either gets its return value or an exception propagates up that same call ' +
    'stack; there is no way for the call to "have happened" without the caller finding out, because they are ' +
    'the same operation on the same thread. Across a network, the REQUEST reaching the server and the ' +
    'RESPONSE reaching the client are two separate events connected only by an unreliable network — a timeout ' +
    'can occur after the server has already fully processed the request and reserved the stock, with only the ' +
    'response packet lost in transit. This gap between "the operation happened" and "the caller was told it ' +
    'happened" simply has no equivalent in an in-process call, which is exactly why network-boundary Facades ' +
    'need idempotency keys and explicit compensating actions that an in-process Facade\'s plain try/catch ' +
    'never has to reason about.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'An API Gateway just needs the same try/catch-and-rollback pattern as an in-process Facade, ' +
      'applied to HTTP calls instead of method calls.',
    reality:
      'The STRUCTURE is the same, but the FAILURE SEMANTICS are not — a caught exception from an in-process ' +
      'call means "this definitely did not complete," while a caught timeout from an HTTP call means "this ' +
      'might have completed, might not have — there is no way to be certain from the client side alone." A ' +
      'correct network-boundary Facade needs idempotency keys (so a retry after an ambiguous timeout is safe) ' +
      'in addition to the compensating-rollback logic an in-process Facade already needs.',
  },
  {
    thought: 'Since the API Gateway pattern has a different name from Facade, it must solve a genuinely ' +
      'different problem.',
    reality:
      'The main page\'s own QnA is explicit that this is "an architectural Facade" — same core intent (one ' +
      'simplified entry point over multiple underlying components), applied at the network/service boundary ' +
      'instead of the in-process object boundary. The different name reflects the different DEPLOYMENT ' +
      'context, not a different design pattern.',
  },
];

@Component({
  selector: 'app-facade-api-gateway-a-network-boundary-facade',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './api-gateway-a-network-boundary-facade.html',
  styleUrl: './api-gateway-a-network-boundary-facade.scss',
})
export class ApiGatewayANetworkBoundaryFacadeSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
