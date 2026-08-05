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
    heading: 'The Main Page\'s Own Advice, Never Applied to Its Own Code',
    points: [
      'The main page\'s own QnA states it directly: "Only if they hold no instance state... Stateless state ' +
      'classes can safely be shared as singletons (e.g., static readonly instances)." Every single concrete ' +
      'state in the main page\'s own "Order State Machine" codeTab — <code>DraftState</code>, ' +
      '<code>SubmittedState</code>, <code>PaidState</code>, <code>ShippedState</code>, ' +
      '<code>CancelledState</code> — has ZERO instance fields. They are all provably, exactly the kind of ' +
      'stateless state the QnA describes as safe to share.',
      'Despite this, every single transition in the main page\'s own code allocates a BRAND NEW instance: ' +
      '<code>o.SetState(new SubmittedState())</code>, <code>o.SetState(new PaidState())</code>, and so on. ' +
      'For a system processing a high volume of orders, this is a real, avoidable allocation on every single ' +
      'transition of every single order — not a correctness bug, but a missed optimization the page\'s own ' +
      'QnA already names the fix for.',
    ],
  },
  {
    heading: 'What Actually Changes (and What Doesn\'t) When States Become Singletons',
    points: [
      'The FIX is mechanical: each concrete state class exposes one <code>static readonly</code> instance of ' +
      'itself, and every <code>SetState(new XState())</code> call becomes <code>SetState(XState.Instance)</code> ' +
      '— no change to any state\'s own METHOD bodies at all, since none of them read or write instance ' +
      'fields in the first place.',
      'This is only safe BECAUSE the states are stateless — the moment a state needs to remember something ' +
      'ACROSS calls (e.g. a retry counter, a timestamp of when it entered that state), sharing one instance ' +
      'across every <code>Order</code> currently in that state would corrupt them all, and the state must go ' +
      'back to being allocated per-transition (or store that per-transition data on the Context instead, ' +
      'per the main page\'s own THIRD mistake block).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before / After',
    language: 'csharp',
    code: `// BEFORE — the main page's own DraftState, allocated fresh on
// every single transition despite having zero instance fields.
public class DraftState : IOrderState
{
    public void Submit(Order o)
    {
        Console.WriteLine("Order submitted");
        o.SetState(new SubmittedState()); // new allocation, every time
    }
    public void Pay(Order o)    => Console.WriteLine("Cannot pay a draft order");
    public void Ship(Order o)   => Console.WriteLine("Cannot ship a draft order");
    public void Cancel(Order o) { Console.WriteLine("Draft cancelled"); o.SetState(new CancelledState()); }
}

// AFTER — one shared instance per state, exactly what the main
// page's own QnA describes as safe for stateless states.
public sealed class DraftState : IOrderState
{
    public static readonly DraftState Instance = new();
    private DraftState() { } // force access through Instance

    public void Submit(Order o)
    {
        Console.WriteLine("Order submitted");
        o.SetState(SubmittedState.Instance); // no allocation
    }
    public void Pay(Order o)    => Console.WriteLine("Cannot pay a draft order");
    public void Ship(Order o)   => Console.WriteLine("Cannot ship a draft order");
    public void Cancel(Order o) { Console.WriteLine("Draft cancelled"); o.SetState(CancelledState.Instance); }
}

public sealed class SubmittedState : IOrderState
{
    public static readonly SubmittedState Instance = new();
    private SubmittedState() { }

    public void Submit(Order o) => Console.WriteLine("Already submitted");
    public void Pay(Order o)    { Console.WriteLine("Payment received"); o.SetState(PaidState.Instance); }
    public void Ship(Order o)   => Console.WriteLine("Must pay before shipping");
    public void Cancel(Order o) { Console.WriteLine("Order cancelled"); o.SetState(CancelledState.Instance); }
}

// Order's own field initializer updates the same way:
public class Order
{
    private IOrderState _state = DraftState.Instance; // was: new DraftState()
    // ... everything else on Order is completely unchanged.
}

// Even though EVERY Order currently in the "Draft" status now
// shares the literal SAME DraftState.Instance object, this is safe
// specifically because DraftState reads and writes nothing except
// the Order parameter passed into each method call.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Suppose a future requirement adds a <code>SubmittedAt</code> timestamp that <code>SubmittedState</code> ' +
    'itself needs to remember (not stored on <code>Order</code>) so it can auto-cancel orders left unpaid for ' +
    'more than 24 hours. Can <code>SubmittedState</code> still be a shared <code>static readonly</code> ' +
    'singleton after this change?',
  hint:
    'Think about what happens to that stored timestamp the SECOND time a DIFFERENT order transitions into ' +
    'the Submitted state, if every order shares the exact same state object instance.',
  solution:
    'No — the moment SubmittedState needs to remember a per-transition value like SubmittedAt, it stops ' +
    'being stateless, and singleton sharing becomes actively unsafe: a SECOND order transitioning into ' +
    'Submitted would overwrite the FIRST order\'s stored timestamp on the exact same shared instance, ' +
    'silently corrupting the first order\'s data. The correct fix here is not to go back to a fresh ' +
    'allocation per transition necessarily — it is to store SubmittedAt ON the Order (the Context) instead, ' +
    'exactly as the main page\'s own "States holding references to domain data" mistake block already ' +
    'argues for a different reason — keeping per-transition data on the Context is what lets the STATE ' +
    'itself stay stateless and shareable.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Making states singletons is always a safe, free performance win worth doing by default for ' +
      'every State pattern implementation.',
    reality:
      'It is only safe for GENUINELY stateless states, and verifying that requires actually checking every ' +
      'concrete state class has no instance fields — a state that looks stateless today can silently stop ' +
      'being safe to share the moment a future change (like the exercise above) adds one. This is exactly ' +
      'why the main page\'s own QnA phrases it as a conditional ("Only if they hold no instance state"), not ' +
      'an unconditional recommendation.',
  },
  {
    thought: 'Since DraftState becomes a private-constructor singleton, client code can no longer create its ' +
      'own custom states for testing.',
    reality:
      'Tests can still substitute a completely different <code>IOrderState</code> implementation (a test ' +
      'double), since <code>Order</code> depends only on the <code>IOrderState</code> INTERFACE, not on the ' +
      'concrete singleton classes. Making <code>DraftState</code>\'s constructor private only prevents ' +
      'creating MORE THAN ONE instance of that SPECIFIC class — it does not restrict which types can ' +
      'implement <code>IOrderState</code> at all.',
  },
];

@Component({
  selector: 'app-state-singleton-states-making-them-actually-stateless',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './singleton-states-making-them-actually-stateless.html',
  styleUrl: './singleton-states-making-them-actually-stateless.scss',
})
export class SingletonStatesMakingThemActuallyStatelessSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
