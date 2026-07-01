import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'Intent',   type: 'keyword',   desc: 'Allow an object to alter its behaviour when its internal state changes — appears to change its class.' },
  { name: 'Context',  type: 'class',     desc: 'The object whose behaviour changes; delegates to the current IState.' },
  { name: 'IState',   type: 'interface', desc: 'Interface for all concrete states — declares methods for each context behaviour.' },
  { name: 'Transition', type: 'keyword', desc: 'A state changes the Context\'s current state by calling context.SetState(newState).' },
  { name: 'vs Strategy', type: 'keyword', desc: 'Strategy: client chooses algorithm. State: object transitions itself — client doesn\'t set the state.' },
  { name: 'FSM',      type: 'keyword',   desc: 'State pattern is an OO implementation of a Finite State Machine.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the State Pattern?',
    points: [
      'State allows an object to change its behaviour when its internal state changes — it appears to change its class.',
      'Instead of large if/switch blocks on a status field, each state is a separate class handling the object\'s behaviour for that state.',
      'The Context delegates all state-dependent behaviour to the current IState object.',
      'State transitions are typically triggered by the context (from outside) or by states themselves (self-transitioning).',
    ],
  },
  {
    heading: 'Why State Pattern Beats Switch Statements',
    points: [
      'A switch on OrderStatus in every method means adding a new state touches every method.',
      'With State: each state class handles all methods for that state; adding a new state = one new class.',
      'Open/Closed: new states require new classes, not modification of existing code.',
      'States encapsulate transition logic: a state knows which states it can transition to.',
    ],
  },
  {
    heading: 'State vs Strategy',
    points: [
      'Strategy: client explicitly chooses and sets the algorithm/strategy.',
      'State: the context transitions its own state internally — the client rarely sets states directly.',
      'Strategy strategies are independent and don\'t know about each other.',
      'State states know about other states (to trigger transitions).',
    ],
  },
  {
    heading: '.NET Examples',
    points: [
      'Order lifecycle: Draft → Submitted → Processing → Shipped → Delivered / Cancelled.',
      'Connection state machine: Closed → Connecting → Open → Closing.',
      'Workflow engines: Elsa Workflow uses State pattern for workflow step execution.',
      'Game character states: Idle → Running → Jumping → Attacking — each with different physics/animations.',
    ],
  },
  {
    heading: 'State Pattern Eliminating Sprawling Conditional Logic',
    points: [
      'Without the State pattern, an object with distinct behavioral states (a document that is Draft, InReview, or Published) typically ends up with large conditional blocks (switch statements) scattered across every method, checking the current state before deciding what to do — logic for a single state ends up spread across many methods.',
      'State pattern instead extracts each state into its own class implementing a common interface, with state-specific behavior living entirely within that state\'s class — all the behavior for the "InReview" state lives in one InReviewState class, rather than being scattered across many if-branches in many methods.',
      'Transitioning between states becomes explicit — a state class can trigger a transition to a different state object, making state transition logic centralized and traceable, rather than implicit in scattered conditional checks that must all agree on what a valid transition even looks like.',
      'State pattern is closely related to Strategy structurally (both delegate behavior to a swappable object implementing a common interface) but differs in intent — State represents an object\'s intrinsic, self-managed behavioral mode that changes over its lifecycle, while Strategy represents an externally-selected algorithm variant.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Order State Machine',
    language: 'csharp',
    code: `// State interface
public interface IOrderState
{
    void Submit(Order order);
    void Pay(Order order);
    void Ship(Order order);
    void Cancel(Order order);
}

// Context
public class Order
{
    public int    Id     { get; init; }
    public string Status => _state.GetType().Name.Replace("State", "");

    private IOrderState _state = new DraftState();

    public void SetState(IOrderState state) => _state = state;
    public void Submit() => _state.Submit(this);
    public void Pay()    => _state.Pay(this);
    public void Ship()   => _state.Ship(this);
    public void Cancel() => _state.Cancel(this);
}

// Concrete States
public class DraftState : IOrderState
{
    public void Submit(Order o)
    {
        Console.WriteLine("Order submitted");
        o.SetState(new SubmittedState());
    }
    public void Pay(Order o)    => Console.WriteLine("Cannot pay a draft order");
    public void Ship(Order o)   => Console.WriteLine("Cannot ship a draft order");
    public void Cancel(Order o) { Console.WriteLine("Draft cancelled"); o.SetState(new CancelledState()); }
}

public class SubmittedState : IOrderState
{
    public void Submit(Order o) => Console.WriteLine("Already submitted");
    public void Pay(Order o)    { Console.WriteLine("Payment received"); o.SetState(new PaidState()); }
    public void Ship(Order o)   => Console.WriteLine("Must pay before shipping");
    public void Cancel(Order o) { Console.WriteLine("Order cancelled"); o.SetState(new CancelledState()); }
}

public class PaidState : IOrderState
{
    public void Submit(Order o) => Console.WriteLine("Already submitted");
    public void Pay(Order o)    => Console.WriteLine("Already paid");
    public void Ship(Order o)   { Console.WriteLine("Order shipped!"); o.SetState(new ShippedState()); }
    public void Cancel(Order o) => Console.WriteLine("Cannot cancel — already paid. Initiate refund.");
}

public class ShippedState : IOrderState
{
    public void Submit(Order o) => Console.WriteLine("Not applicable");
    public void Pay(Order o)    => Console.WriteLine("Already paid");
    public void Ship(Order o)   => Console.WriteLine("Already shipped");
    public void Cancel(Order o) => Console.WriteLine("Cannot cancel shipped order");
}

public class CancelledState : IOrderState
{
    public void Submit(Order o) => Console.WriteLine("Order is cancelled");
    public void Pay(Order o)    => Console.WriteLine("Order is cancelled");
    public void Ship(Order o)   => Console.WriteLine("Order is cancelled");
    public void Cancel(Order o) => Console.WriteLine("Already cancelled");
}

// Usage
var order = new Order { Id = 1 };
order.Submit(); // Draft → Submitted
order.Pay();    // Submitted → Paid
order.Ship();   // Paid → Shipped
order.Cancel(); // "Cannot cancel shipped order"`,
  },
  {
    label: 'Traffic Light FSM',
    language: 'csharp',
    code: `public interface ITrafficLightState
{
    string Color { get; }
    ITrafficLightState Next();
}

public record RedState    : ITrafficLightState { public string Color => "Red";    public ITrafficLightState Next() => new GreenState(); }
public record GreenState  : ITrafficLightState { public string Color => "Green";  public ITrafficLightState Next() => new YellowState(); }
public record YellowState : ITrafficLightState { public string Color => "Yellow"; public ITrafficLightState Next() => new RedState(); }

public class TrafficLight
{
    private ITrafficLightState _state = new RedState();

    public void Advance()
    {
        Console.WriteLine($"Current: {_state.Color}");
        _state = _state.Next();
        Console.WriteLine($"Next:    {_state.Color}");
    }
}

var light = new TrafficLight();
light.Advance(); // Red → Green
light.Advance(); // Green → Yellow
light.Advance(); // Yellow → Red`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Putting all state logic in the Context with if/switch',
    wrong: `public void Ship()
{
    if (_status == "Paid")    { _status = "Shipped"; }
    else if (_status == "Draft") { throw new Exception("not paid"); }
    // Adding new states requires editing this method AND every other method
}`,
    right: `public void Ship() => _state.Ship(this); // delegates to current state class`,
    explanation: 'The whole point of State is to eliminate the switch/if-on-status pattern. Each state class encapsulates all behaviour for that state — adding a new state never touches existing code.',
  },
  {
    title: 'Letting clients set states directly',
    wrong: `order.SetState(new ShippedState()); // client bypasses state machine logic`,
    right: `order.Ship(); // call the action; the state determines the transition`,
    explanation: 'State transitions should be triggered by actions on the Context, not by clients setting states directly. Direct state injection bypasses transition validation (e.g., you can\'t ship before paying).',
  },
  {
    title: 'States holding references to domain data instead of using the Context',
    wrong: `public class PaidState(string customerId, List<OrderItem> items) : IOrderState { ... }`,
    right: `public class PaidState : IOrderState {
    public void Ship(Order order) { /* use order.X, not local copies */ }
}`,
    explanation: 'States must not duplicate data from the Context. They receive the Context as a parameter in each method call — all domain data lives in the Context, not the state.',
  },
  {
    title: 'Not handling all transitions in every state',
    wrong: `public class DraftState : IOrderState {
    public void Submit(Order o) { ... }
    // Pay, Ship, Cancel not implemented — compile error or NotImplementedException
}`,
    right: `// Every state must implement all IOrderState methods
// Invalid transitions log/throw a meaningful message`,
    explanation: 'Every state must implement every method — even if some are no-ops or throw "invalid transition". Missing implementations lead to runtime errors or unexpected behaviour when a client calls an unsupported action.',
  },
];

const challenge: Challenge = {
  title: 'Vending Machine',
  language: 'typescript',
  description: `Implement a vending machine using the State pattern.
States: Idle, HasMoney, Dispensing.
Actions: insertCoin(), selectItem(), dispense().
Idle + insertCoin → HasMoney.
HasMoney + selectItem → Dispensing.
Dispensing + dispense → Idle.`,
  hints: [
    'IVendingState has insertCoin, selectItem, dispense methods',
    'Each state transitions by calling machine.setState(new NextState())',
    'Invalid actions in a state print an error message',
  ],
  starterCode: `interface IVendingState {
  insertCoin(m: VendingMachine): void;
  selectItem(m: VendingMachine): void;
  dispense(m: VendingMachine): void;
}

class VendingMachine {
  private state: IVendingState = new IdleState();
  setState(s: IVendingState): void { this.state = s; }
  insertCoin(): void { this.state.insertCoin(this); }
  selectItem(): void { this.state.selectItem(this); }
  dispense(): void   { this.state.dispense(this); }
}

// TODO: IdleState, HasMoneyState, DispensingState`,
  solution: `interface IVendingState {
  insertCoin(m: VendingMachine): void;
  selectItem(m: VendingMachine): void;
  dispense(m: VendingMachine): void;
}

class VendingMachine {
  private state: IVendingState = new IdleState();
  setState(s: IVendingState): void { this.state = s; }
  insertCoin(): void { this.state.insertCoin(this); }
  selectItem(): void { this.state.selectItem(this); }
  dispense(): void   { this.state.dispense(this); }
}

class IdleState implements IVendingState {
  insertCoin(m: VendingMachine): void { console.log('Coin inserted'); m.setState(new HasMoneyState()); }
  selectItem(_: VendingMachine): void { console.log('Insert coin first'); }
  dispense(_: VendingMachine): void   { console.log('Insert coin first'); }
}

class HasMoneyState implements IVendingState {
  insertCoin(_: VendingMachine): void  { console.log('Already has coin'); }
  selectItem(m: VendingMachine): void  { console.log('Item selected'); m.setState(new DispensingState()); }
  dispense(_: VendingMachine): void    { console.log('Select an item first'); }
}

class DispensingState implements IVendingState {
  insertCoin(_: VendingMachine): void { console.log('Please wait'); }
  selectItem(_: VendingMachine): void { console.log('Please wait'); }
  dispense(m: VendingMachine): void   { console.log('Dispensing item!'); m.setState(new IdleState()); }
}

const vm = new VendingMachine();
vm.insertCoin();  // Coin inserted
vm.selectItem();  // Item selected
vm.dispense();    // Dispensing item!
vm.dispense();    // Insert coin first`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'How does State differ from Strategy?',
    options: [
      'State and Strategy are identical patterns',
      'Strategy: client explicitly picks an algorithm; State: object transitions itself based on internal logic',
      'Strategy allows state transitions; State does not allow algorithm changes',
      'State uses inheritance; Strategy uses composition',
    ],
    answer: 1,
    explanation: 'Both use composition with a swappable object. The difference is intent: Strategy — the client consciously selects an algorithm; State — the object transitions between states internally as a result of actions, typically without the client choosing the new state.',
  },
  {
    q: 'What is the main advantage of State pattern over switch statements on a status field?',
    options: [
      'State pattern is faster at runtime',
      'Adding a new state requires a new class only, not editing every switch in every method',
      'State pattern prevents all invalid state transitions automatically',
      'State pattern uses less memory than switch statements',
    ],
    answer: 1,
    explanation: 'With switch statements, adding a new status means editing every method that switches on status. With State, adding a new state requires one new class — all other state classes and the Context remain unchanged (Open/Closed Principle).',
  },
  {
    q: 'Where does state transition logic (e.g., Draft → Submitted) belong?',
    options: [
      'In the Context (Order), which switches on the current state',
      'In the ConcreteState class for the current state — it knows which state to transition to',
      'In a separate TransitionManager service',
      'In the calling code (controller, service) that triggers the action',
    ],
    answer: 1,
    explanation: 'State transitions belong in the ConcreteState classes — DraftState.Submit() knows it transitions to SubmittedState. This keeps all transition logic for a given state in one place and prevents the Context from needing to know about state relationships.',
  },
  { q: 'What is the State pattern and what does it replace?', options: ['A database pattern for managing transaction state across requests', 'A behavioral pattern that allows an object to alter its behavior when its internal state changes; the object appears to change its class, replacing large if-else or switch statements that branch on state', 'A pattern for persisting application state to a file or database', 'A pattern for managing React or Angular component state'], answer: 1, explanation: 'Without State pattern: a method contains a large switch statement: switch(currentState) { case IDLE: ...; case RUNNING: ...; case STOPPED: ...; }. As states grow, the switch grows. Each new state requires modifying every switch across the class. With State pattern: each state is a separate class implementing the State interface. The context delegates to the current state object: state.handle(context). Adding a new state adds a new class without touching existing state classes. The context appears to change behavior when currentState changes — it delegates to a different state object.' },
  { q: 'What are the components of the State pattern?', options: ['Observable, Observer, and Notification', 'Context, State interface, and ConcreteState classes; the Context holds a reference to the current State and delegates to it; ConcreteStates implement the behavior for each state', 'Command, Handler, and History', 'Subject, Predicate, and Transition'], answer: 1, explanation: 'Context: the object whose behavior varies by state. Holds a reference to the current ConcreteState. Provides a method to change state: setState(state). Delegates behavior to the current state: state.handle(context). State (interface): declares methods for each behavior that varies across states. ConcreteState (one per state): implements the State interface. Each ConcreteState contains the behavior appropriate for that state and may trigger a state transition by calling context.setState(newState). Example: ATM machine states: IdleState, CardInsertedState, PINEnteredState, TransactionState.' },
  { q: 'If you refactor a State-pattern implementation and the state classes stop triggering their own transitions (an external StateMachine object handles all transitions instead), has the code effectively become Strategy instead?', options: ['No — it is still State regardless of who triggers transitions', 'Largely yes in spirit — once transition logic moves out of the state objects into an external coordinator, the states become interchangeable behavior objects selected by something else, which is much closer to Strategy\'s intent than classic State\'s self-transitioning design, even though the interface shape looks identical', 'This refactor is impossible without breaking the interface', 'Strategy and State become literally the same pattern once this happens, with no meaningful distinction ever'], answer: 1, explanation: 'The classic GoF distinction between State and Strategy isn\'t about interface shape (both delegate to interchangeable objects behind an interface) — it\'s about WHO decides the next behavior and WHY. Classic State has the state objects themselves aware of the context and able to trigger the next transition as part of the object\'s lifecycle. If you extract that responsibility into an external coordinator that decides transitions, the state objects become passive, selectable behaviors — structurally and intentionally much closer to Strategy, illustrating that the two patterns exist on a spectrum defined by transition ownership, not by an inherent, unchangeable interface difference.' },
];

const qna: QnaItem[] = [
  {
    q: 'Should states be singletons?',
    a: 'Only if they hold no instance state (no fields that vary per Context). Stateless state classes can safely be shared as singletons (e.g., static readonly instances). If a state needs to store per-transition data, each transition should create a new state instance.',
  },
  {
    q: 'How does the State pattern relate to workflow engines?',
    a: 'Workflow engines (Elsa Workflow, Windows Workflow Foundation, state machine libraries like Stateless) are State pattern implementations with persistence. They serialise the current state to storage and restore it, enabling long-running multi-day workflows. The core mechanics (states, transitions, actions) are identical to the GoF pattern.',
  },
  { q: 'How does the State pattern implement a finite state machine?', a: 'The State pattern is a natural implementation of a finite state machine (FSM). States are ConcreteState classes. Transitions are triggered by events (methods called on the context or state). The state machine logic lives in the states: each state knows which events it accepts and what state to transition to. Example: a traffic light FSM: GreenState handles timer event by transitioning to YellowState. YellowState handles timer event by transitioning to RedState. RedState transitions back to GreenState. The context (TrafficLight) delegates to current state; state handles the event and calls context.setState(nextState). State pattern encodes the state machine graph in the class structure.' },
  { q: 'When should you use State pattern versus simple boolean flags?', a: 'Use boolean flags when: only two states exist and behavior is simple. A single isActive flag with minimal branching is readable and not over-engineered. Use State pattern when: three or more states exist and behavior differs significantly per state. Boolean combinations (isActive && isAuthenticated && hasPermission) produce many implied states leading to complex if-else logic. New states are expected (State pattern is Open/Closed: add new ConcreteState without modifying existing code). State transitions have complex rules. If a class has many boolean flags that are checked together in many combinations, that is a sign it needs the State pattern to make each meaningful combination explicit as a named state.' },
  { q: 'How do you persist State pattern objects in a database?', a: 'State patterns work with in-memory objects; persistence requires mapping the current state to a storable value. Simple approach: store a state identifier string or enum in the database (OrderStatus = "PENDING"). When loading the entity: reconstruct the corresponding ConcreteState object based on the stored identifier. Factory or switch-on-load: if (stored == "PENDING") state = new PendingState(). State machine frameworks (like Stateless in .NET or XState in JavaScript) provide serialization and deserialization of current state. Store state transitions as an event log (Event Sourcing) to replay the entire state machine history rather than just the current state.' },
  { q: 'What is a State Transition table and when is it preferable to State pattern?', a: 'A state transition table represents all valid state-event-action-nextState tuples in a data structure (dictionary or database table). On an event: look up the current state + event in the table, execute the action function, and transition to the next state. Preferable to State pattern when: transitions are data-driven and stored in configuration or a database. The state machine is very large and adding code classes for each state would be burdensome. The same engine runs many different state machines (workflow engine). State pattern is preferable when: behavior per state is complex and warrants separate classes. State machine is fixed at compile time. Developers want type-safe, documented state classes with IDE support.' },
];

const revision: RevisionSummary = {
  oneLiner: 'State replaces switch-on-status with polymorphic state classes — each state encapsulates its own behaviour and transitions, following Open/Closed Principle.',
  mustKnow: [
    'Context delegates all behaviour to current IState; states call context.SetState() to transition',
    'Adding a new state = one new class, no changes to existing states or Context',
    'State vs Strategy: State transitions itself; Strategy is chosen by the client',
    'States receive Context as parameter — never store domain data themselves',
    'Invalid transitions should produce meaningful errors, not silent no-ops',
  ],
  interviewFocus: [
    'State vs Strategy — structural similarity but different intent?',
    'Why is State preferred over switch statements on a status field?',
    'Where should state transition logic live?',
  ],
};

@Component({
  selector: 'app-dp-state',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './state.html',
  styleUrl: './state.scss',
})
export class DpState {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
