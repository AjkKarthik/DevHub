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
  templateUrl: './why-chatty-nanoservices-actually-get-slow.html',
  styleUrl: './why-chatty-nanoservices-actually-get-slow.scss'
})
export class WhyChattyNanoservicesActuallyGetSlowSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The page names the consequence but never shows the arithmetic',
      points: [
        'The page\'s "Services too fine-grained (nanoservices)" mistake block says over-splitting "creates chatty network calls" — true, but stated as a bare assertion. It doesn\'t show WHY a chatty call pattern is actually slow, just that it is.',
        'The mechanism is straightforward once made explicit: every network call between services adds a fixed cost on top of whatever the call itself does — network round-trip time, TLS negotiation (if not reused), serialization/deserialization of the request and response, and the receiving service\'s own processing time. None of that overhead exists for an in-process function call.',
        'When calls happen in SEQUENCE (A waits for B\'s response before calling C), these per-call overheads ADD UP directly — a chain of 5 synchronous calls at ~20ms network overhead each adds roughly 100ms of pure network tax on top of whatever useful work those 5 calls actually do, before any of them have done anything.',
      ]
    },
    {
      heading: 'Why "nano"-sized services make this specific problem worse, not just "more services"',
      points: [
        'The page\'s fix — "One Customer Service owning the full customer lifecycle" instead of separate GetCustomer/UpdateCustomer/DeleteCustomer/CreateCustomer services — isn\'t really about total service COUNT, it\'s about where the boundary falls relative to how operations are actually used together.',
        'If a single business operation (say, "update a customer\'s shipping address") needs to call GetCustomer, then UpdateCustomer, then a separate AuditLog service to record the change, that ONE business operation now pays the network tax three times, sequentially, for something that would be one local function call (and one local transaction) inside a properly-bounded Customer Service.',
        'The nanoservices mistake, correctly read, is really a bounded-context mistake wearing a "too many services" costume — the actual problem is that a single cohesive operation got split across a service boundary that didn\'t need to exist, not merely that there are numerically many services in the system.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The same operation, two boundary choices',
      language: 'typescript',
      code: `// NANOSERVICES -- "update shipping address" crosses 3 service
// boundaries for what is conceptually ONE operation
async function updateShippingAddressNano(customerId: string, address: Address) {
  const customer = await fetch(\`http://get-customer-service/\${customerId}\`);       // hop 1
  await fetch(\`http://update-customer-service/\${customerId}\`, { method: 'PUT', body: JSON.stringify({ address }) }); // hop 2
  await fetch('http://audit-log-service/', { method: 'POST', body: JSON.stringify({ event: 'address_updated', customerId }) }); // hop 3
  // 3 sequential network round trips for one conceptual operation
}

// BOUNDED CONTEXT -- same operation, one service owns the whole lifecycle
class CustomerService {
  async updateShippingAddress(customerId: string, address: Address) {
    const customer = await this.repo.findById(customerId);      // local call
    customer.address = address;
    await this.repo.save(customer);                              // local call, same transaction
    this.auditLog.record('address_updated', customerId);         // local call, same transaction
    // 1 network round trip total (the original caller's own request) --
    // everything after that is in-process
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A checkout flow calls, in sequence: GetCustomer, GetCart, CheckInventory, ChargeCard, CreateOrder, SendConfirmationEmail -- six separate synchronous service calls, each averaging 15ms of pure network/serialization overhead on top of its actual work. How much overhead-only latency does this add to every checkout, before any of those six services have done anything useful?',
    hint: 'The six calls are sequential (each waits for the previous one), so the overheads add directly rather than overlapping.',
    solution: 'Roughly 90ms (6 x 15ms) of pure network/serialization tax, stacked on top of whatever useful work each of the six calls actually does -- and that is the OPTIMISTIC case, assuming no retries and no service is slow that day. This is exactly the arithmetic this subtopic\'s theory describes: the cost is not "chattiness" as a vague quality, it is a literal per-hop overhead that compounds linearly with every SEQUENTIAL synchronous call in the chain. The mistake block\'s own fix (moving non-time-critical steps like SendConfirmationEmail to async) doesn\'t just improve resilience -- it also removes that hop\'s overhead from the synchronous critical path entirely.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Chatty network calls are slow" is really just a general observation about services being small -- fewer, bigger services always avoids the problem.',
      reality: 'Per this subtopic\'s theory, the real issue is a cohesive operation split ACROSS a service boundary that didn\'t need to exist — the fix is drawing the boundary around what changes together, not simply reducing the raw count of services in the system.'
    },
    {
      thought: 'Network overhead per call is negligible compared to the actual work each service does, so counting hops is overthinking it.',
      reality: 'Per this subtopic\'s theory, per-hop overhead (network RTT, serialization, TLS) is a FIXED cost paid on every call regardless of how little work the call does — for a chain of many small, sequential calls, this fixed cost can end up being the dominant contributor to total latency, not a rounding error.'
    },
    {
      thought: 'Moving a slow chain of calls to be asynchronous instead of synchronous removes the overhead this subtopic describes.',
      reality: 'Per this subtopic\'s theory, going async changes WHO waits for the overhead (the original caller no longer blocks on it) but doesn\'t eliminate the overhead itself — the real fix for a cohesive operation is keeping it inside one service boundary so most of the chain never needs the network at all.'
    }
  ];
}
