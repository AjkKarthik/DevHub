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
    heading: 'A Distinction Stated Twice in Prose, Never in Code',
    points: [
      'The main page states the difference between Facade and Mediator twice — once in the theory ("Mediator ' +
      'reduces coupling BETWEEN subsystem objects... Facade simplifies FOR clients") and once in the quick ' +
      'reference — but neither codeTab ever shows subsystem objects actually talking to EACH OTHER, which is ' +
      'what would make a Mediator version concretely different.',
      'In the main page\'s own <code>CheckoutFacade</code>, <code>InventoryService</code>, ' +
      '<code>PaymentGateway</code>, <code>ShippingService</code>, and <code>EmailService</code> never ' +
      'reference one another at all — every coordination decision (what to call, and in what order) lives ' +
      'entirely inside the Facade, outside all four subsystem classes.',
    ],
  },
  {
    heading: 'What a Genuinely Mediator-Shaped Version Looks Like',
    points: [
      'In a Mediator design, the subsystem objects themselves hold a reference to a shared coordinator and ' +
      'CALL IT when something happens — <code>InventoryService</code> notifies the mediator once stock is ' +
      'committed, and the mediator decides what happens next (triggering shipment), rather than an external ' +
      'Facade method deciding the whole sequence up front.',
      'This means the ORDER of operations lives inside the Mediator\'s own event-handling logic, not as a ' +
      'straight-line sequence of method calls the way the main page\'s <code>CheckoutAsync</code> reads — the ' +
      'Mediator reacts to what subsystems report, rather than dictating a fixed script to them.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Facade Shape — Coordination Lives Outside the Subsystems',
    language: 'csharp',
    code: `// Subsystems know NOTHING about each other or about any coordinator —
// they only expose their own operations. All sequencing lives in the Facade.
internal class InventoryService
{
    public bool Reserve(string productId, int qty) => true;
    public void Commit(string productId, int qty) { }
}
internal class ShippingService
{
    public string CreateShipment(string orderId, Address address) => "SHIP-" + orderId;
}

public class CheckoutFacade(InventoryService inventory, ShippingService shipping)
{
    // The Facade OWNS the sequence: reserve, then (elsewhere) commit, then ship.
    // Neither subsystem class has any idea the other one exists.
    public void Commit(string productId, int qty, string orderId, Address address)
    {
        inventory.Commit(productId, qty);
        shipping.CreateShipment(orderId, address); // Facade decides "commit implies ship"
    }
}`,
  },
  {
    label: 'Mediator Shape — Subsystems Talk Through a Coordinator',
    language: 'csharp',
    code: `// Subsystems hold a reference to a SHARED mediator and report events to it —
// the mediator decides what happens next, not an external orchestration method.
public interface ICheckoutMediator
{
    void NotifyInventoryCommitted(string orderId, Address address);
}

internal class InventoryService(ICheckoutMediator mediator)
{
    public void Commit(string productId, int qty, string orderId, Address address)
    {
        // ... reduce stock ...
        mediator.NotifyInventoryCommitted(orderId, address); // reports the event; does
                                                               // not know WHO reacts to it
    }
}

internal class ShippingService
{
    public string CreateShipment(string orderId, Address address) => "SHIP-" + orderId;
}

// The mediator — not a Facade method — decides "committed inventory triggers shipment."
public class CheckoutMediator(ShippingService shipping) : ICheckoutMediator
{
    public void NotifyInventoryCommitted(string orderId, Address address) =>
        shipping.CreateShipment(orderId, address);
}

// Client code creates the mediator and wires InventoryService to it — the
// "commit implies ship" DECISION now lives in CheckoutMediator, not in a
// Facade's own straight-line method body.
var shipping  = new ShippingService();
var mediator  = new CheckoutMediator(shipping);
var inventory = new InventoryService(mediator);
inventory.Commit("SKU-1", 2, "ORD-1", address); // triggers shipment via the mediator`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'In the Mediator version above, if you wanted to ALSO send an email confirmation after shipment is ' +
    'created, where would that new logic go — inside <code>ShippingService</code>, inside ' +
    '<code>CheckoutMediator</code>, or inside a client caller? Compare this to where the equivalent change ' +
    'would go in the main page\'s own Facade version.',
  hint:
    'Ask: in the Mediator design, which class is responsible for deciding WHAT HAPPENS NEXT after any given ' +
    'subsystem event? In the Facade design, where does that same decision currently live?',
  solution:
    'In the Mediator version, the new logic belongs in CheckoutMediator — specifically, ' +
    'CreateShipment\'s result would need to be reported back to the mediator (e.g. a new ' +
    'NotifyShipmentCreated event), and the mediator would then call EmailService in response, exactly the ' +
    'same way it currently reacts to NotifyInventoryCommitted by calling ShippingService. ShippingService ' +
    'itself stays unaware that anything happens after it — it just reports its own event and moves on. In the ' +
    'main page\'s own Facade version, the equivalent change is simpler to locate but structurally different: ' +
    'you add one more line, in sequence, directly inside CheckoutAsync\'s own method body, right after the ' +
    'CreateShipment call — the Facade\'s method body IS the sequence, so extending it means editing that one ' +
    'straight-line method rather than adding a new event/handler pair.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Facade and Mediator are really the same pattern under two different names — both just ' +
      '"coordinate several classes."',
    reality:
      'They coordinate DIFFERENT relationships. Facade coordinates the relationship between an EXTERNAL ' +
      'CLIENT and a subsystem — the subsystem classes themselves stay mutually unaware of each other. ' +
      'Mediator coordinates the relationship BETWEEN the subsystem classes themselves — they report events to ' +
      'a shared coordinator instead of calling each other directly, and there may be no external "client-facing ' +
      'simplification" goal at all.',
  },
  {
    thought: 'Since the Mediator version also ends up calling ShippingService after inventory changes, it ' +
      'produces the exact same runtime behavior as the Facade version — the two are interchangeable.',
    reality:
      'They can produce the same OBSERVABLE sequence of calls while organizing the DECISION about that ' +
      'sequence completely differently. In the Facade, the sequence is a fixed script the Facade method reads ' +
      'top to bottom. In the Mediator, the sequence emerges from each subsystem independently reporting events ' +
      'and the mediator reacting — which scales differently as more subsystems and reactions are added, even ' +
      'when the net effect looks identical for a simple two-step case.',
  },
];

@Component({
  selector: 'app-facade-facade-vs-mediator-made-concrete',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './facade-vs-mediator-made-concrete.html',
  styleUrl: './facade-vs-mediator-made-concrete.scss',
})
export class FacadeVsMediatorMadeConcreteSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
