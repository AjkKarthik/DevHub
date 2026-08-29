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
    heading: 'Two Undeclared Methods, One in Each CodeTab',
    points: [
      'The main page\'s own "Layer Structure" codeTab defines <code>Order.Cancel()</code> calling <code>AddDomainEvent(new OrderCancelledEvent(Id, reason));</code> — but <code>AddDomainEvent</code> is never declared anywhere on the <code>Order</code> class, and <code>Order</code> extends no base class that might provide it either.',
      'The SEPARATE "Testing Without Infrastructure" codeTab has a test calling <code>order.Ship();</code> — but <code>Order</code>, as shown in the OTHER codeTab, has no <code>Ship()</code> method at all. The test message even implies it should exist ("Cannot cancel a shipped order" — something has to be able to reach <code>OrderStatus.Shipped</code> in the first place).',
      'Both are the same category of bug this hub keeps finding — a call site referencing something the class was never actually given — just spread across TWO codeTabs on the same page instead of contained in one, which is exactly what makes this pair easy to miss: reading either codeTab in isolation looks complete.',
    ],
  },
  {
    heading: 'Why AddDomainEvent Matters for a Clean Architecture Aggregate Specifically',
    points: [
      'The main page\'s own theory doesn\'t explicitly walk through domain event PLUMBING, but <code>Order.Cancel()</code> already assumes it exists — recording an <code>OrderCancelledEvent</code> is exactly the kind of thing Infrastructure needs to pick up AFTER a commit (to publish it, per this hub\'s own Outbox Pattern topic) without the Domain layer needing to know anything about HOW it gets published.',
      'The fix keeps that same separation: <code>Order</code> gets a private list and an <code>AddDomainEvent</code> method that just RECORDS events — no dependency on MediatR, an event bus, or anything from Infrastructure. Something OUTSIDE the Domain (a repository, a pipeline behaviour) is responsible for reading <code>Order.DomainEvents</code> after <code>SaveChangesAsync()</code> and dispatching them.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before — Two Missing Methods',
    language: 'csharp',
    code: `public class Order
{
    public Guid   Id         { get; private set; }
    public Guid   CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    // ... Items, _items unchanged ...

    public static Order Create(Guid customerId, IEnumerable<OrderItem> items) { /* ... */ }

    public void Cancel(string reason)
    {
        if (Status == OrderStatus.Shipped) throw new DomainException("Cannot cancel a shipped order");
        Status = OrderStatus.Cancelled;
        AddDomainEvent(new OrderCancelledEvent(Id, reason));   // AddDomainEvent doesn't exist
    }
    // No Ship() method anywhere -- yet a test elsewhere calls order.Ship()
}`,
  },
  {
    label: 'After — Both Fixed',
    language: 'csharp',
    code: `public class Order
{
    public Guid   Id         { get; private set; }
    public Guid   CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    // ... Items, _items unchanged ...

    // Domain events raised by this aggregate -- recorded only,
    // dispatched by Infrastructure after commit.
    private readonly List<object> _domainEvents = new();
    public IReadOnlyList<object> DomainEvents => _domainEvents.AsReadOnly();
    private void AddDomainEvent(object domainEvent) => _domainEvents.Add(domainEvent);

    public static Order Create(Guid customerId, IEnumerable<OrderItem> items) { /* ... */ }

    public void Ship()
    {
        if (Status != OrderStatus.Pending) throw new DomainException("Only a pending order can be shipped");
        Status = OrderStatus.Shipped;
        AddDomainEvent(new OrderShippedEvent(Id));
    }

    public void Cancel(string reason)
    {
        if (Status == OrderStatus.Shipped) throw new DomainException("Cannot cancel a shipped order");
        Status = OrderStatus.Cancelled;
        AddDomainEvent(new OrderCancelledEvent(Id, reason));   // now compiles
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The fixed <code>Ship()</code> method only allows shipping a <code>Pending</code> order. Trace what happens if <code>Cancel_ThrowsDomainException_WhenOrderIsShipped()</code> is run against the fixed code: <code>Order.Create(...)</code>, then <code>order.Ship()</code>, then <code>order.Cancel("test")</code>. Does the test still pass?',
  hint: 'Check the Status each method requires versus what Status the order actually holds at each step.',
  solution: `// Order.Create(...) sets Status = Pending.
// order.Ship() checks "Status != Pending" -- false, since it IS
// Pending -- so it proceeds and sets Status = Shipped.
// order.Cancel("test") checks "Status == Shipped" -- true, since
// Ship() just set it -- so it throws DomainException with the
// message "Cannot cancel a shipped order".

// Yes, the test still passes: act.Should().Throw<DomainException>()
// .WithMessage("*Cannot cancel a shipped order*") matches exactly
// the exception Cancel() throws. The fix didn't just make the code
// compile -- it made the test's own ORIGINAL intent (verifying a
// shipped order can't be cancelled) actually reachable for the
// first time.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since <code>Order.Cancel()</code> and the <code>Ship()</code> test call are in two SEPARATE codeTabs, they can\'t really "contradict" each other the way two methods in the same class would.',
    reality: 'They don\'t contradict each other so much as the SECOND codeTab silently ASSUMES a capability (<code>Ship()</code>) the FIRST codeTab never actually gave the class. This is exactly the kind of gap that reading each codeTab in isolation hides — the test reads perfectly reasonably on its own, and the <code>Order</code> class reads perfectly reasonably on its own; only checking one against the other reveals the mismatch.',
  },
  {
    thought: 'A private <code>AddDomainEvent</code> method with no matching public "dispatch" logic anywhere is itself incomplete or pointless.',
    reality: 'It is deliberately incomplete FROM THE DOMAIN\'S OWN PERSPECTIVE — and that is the point. The main page\'s own Dependency Rule says Domain must have zero knowledge of Infrastructure (no MediatR, no message bus, no EF Core). <code>Order</code> recording events into its own list and exposing them via <code>DomainEvents</code> is the full extent of what Domain should do; something in Infrastructure (or an EF Core <code>SaveChangesInterceptor</code>) is responsible for reading that list after a successful commit and actually publishing each event — a responsibility that belongs OUTSIDE Domain by design, not a piece the aggregate itself forgot to implement.',
  },
];

@Component({
  selector: 'app-dp-ca-missing-methods',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-order-aggregates-missing-ship-and-adddomainevent.html',
  styleUrl: './the-order-aggregates-missing-ship-and-adddomainevent.scss',
})
export class TheOrderAggregatesMissingShipAndAdddomaineventSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
