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
    heading: 'Named as an Alternative, Never Built',
    points: [
      'The main page\'s own QnA describes an entire ALTERNATIVE to the class-per-state approach: "A state ' +
      'transition table represents all valid state-event-action-nextState tuples in a data structure... On ' +
      'an event: look up the current state + event in the table... and transition to the next state." It ' +
      'even names exactly when this is preferable ("transitions are data-driven," "the same engine runs many ' +
      'different state machines"). No codeTab on the page shows what this actually looks like.',
      'A transition table trades the main page\'s own five separate <code>IOrderState</code> CLASSES for one ' +
      'small piece of DATA — a lookup keyed by (current state, event) pairs — which is exactly the shape a ' +
      'generic workflow engine needs when it can\'t know its state machines\' shapes at compile time.',
    ],
  },
  {
    heading: 'What a Table Gains and What It Gives Up',
    points: [
      'Gains: the entire state machine becomes ONE piece of inspectable data instead of five separate classes ' +
      'spread across five files — useful when transitions themselves need to be configured, logged, or ' +
      'changed WITHOUT a recompile (e.g. loaded from a database row per tenant).',
      'Gives up: the main page\'s own per-state SIDE EFFECTS (<code>Console.WriteLine("Payment received")</code> ' +
      'inside <code>SubmittedState.Pay</code>) don\'t fit neatly into a pure lookup table — a table maps ' +
      '(state, event) to a next state, not to arbitrary code, so any side effect needs a separate action ' +
      'delegate stored alongside the transition, or a shared dispatcher that runs the SAME logic for every ' +
      'transition regardless of which states are involved.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Class-Per-State vs. Table',
    language: 'csharp',
    code: `// The main page's own approach: transition logic lives INSIDE each
// of five separate classes.
public class SubmittedState : IOrderState
{
    public void Pay(Order o) { Console.WriteLine("Payment received"); o.SetState(new PaidState()); }
    // ... Submit, Ship, Cancel handled the same way, one method each
}

// A DATA-DRIVEN transition table — the entire Order lifecycle
// reduced to one lookup structure instead of five classes.
public enum OrderState { Draft, Submitted, Paid, Shipped, Cancelled }
public enum OrderEvent { Submit, Pay, Ship, Cancel }

public class TableDrivenOrder
{
    // (currentState, event) -> nextState. Missing entries = invalid
    // transition, handled explicitly below rather than silently.
    private static readonly Dictionary<(OrderState, OrderEvent), OrderState> Transitions = new()
    {
        [(OrderState.Draft,     OrderEvent.Submit)] = OrderState.Submitted,
        [(OrderState.Draft,     OrderEvent.Cancel)] = OrderState.Cancelled,
        [(OrderState.Submitted, OrderEvent.Pay)]     = OrderState.Paid,
        [(OrderState.Submitted, OrderEvent.Cancel)]  = OrderState.Cancelled,
        [(OrderState.Paid,      OrderEvent.Ship)]    = OrderState.Shipped,
    };

    public OrderState State { get; private set; } = OrderState.Draft;

    public bool TryFire(OrderEvent evt)
    {
        if (!Transitions.TryGetValue((State, evt), out var next))
        {
            Console.WriteLine($"Cannot {evt} from {State}");
            return false; // invalid transition — same "meaningful message"
                          // the main page's own mistake block requires,
                          // just centralized in one place instead of one
                          // method per state class.
        }
        Console.WriteLine($"{State} --{evt}--> {next}");
        State = next;
        return true;
    }
}

var order = new TableDrivenOrder();
order.TryFire(OrderEvent.Submit); // Draft --Submit--> Submitted
order.TryFire(OrderEvent.Pay);    // Submitted --Pay--> Paid
order.TryFire(OrderEvent.Ship);   // Paid --Ship--> Shipped
order.TryFire(OrderEvent.Cancel); // Cannot Cancel from Shipped`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page\'s own <code>SubmittedState.Pay</code> prints a SPECIFIC message ("Payment received") on ' +
    'a valid transition. Looking at <code>TableDrivenOrder.TryFire</code> above, does the table-driven ' +
    'version have an equivalent way to run a DIFFERENT message or side effect per specific transition, or ' +
    'does every successful transition share the exact same generic logging line?',
  hint:
    'Check what <code>TryFire</code> actually DOES on a successful lookup — is there anywhere a ' +
    'PER-TRANSITION piece of custom code could run, the way each state class\'s own method body could?',
  solution:
    'As written, every successful transition shares the exact same generic ' +
    '"{State} --{evt}--> {next}" log line — there is no per-transition custom message or side effect at all. ' +
    'To get the class-per-state version\'s per-transition messages back, the Dictionary would need to map to ' +
    'something richer than just the next OrderState — e.g. a small record holding both the next state AND ' +
    'an Action to run, or a separate parallel dictionary of (state, event) -> Action<Order>. This is exactly ' +
    'the "gives up" trade-off the theory section names: a pure lookup table naturally fits transitions with ' +
    'uniform or no side effects far better than it fits transitions each needing distinct custom logic.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'A transition table is a strictly simpler, better version of the class-per-state approach — ' +
      'fewer files, less code, so it should always be preferred.',
    reality:
      'The main page\'s own QnA is explicit that the class-per-state approach is preferable specifically when ' +
      '"behavior per state is complex" — which describes the main page\'s own Order example reasonably well ' +
      '(each transition has its own distinct message and logic). A transition table shines when transitions ' +
      'are mostly UNIFORM or need to be DATA-DRIVEN (configurable without a recompile), not as a universal ' +
      'replacement.',
  },
  {
    thought: 'Since TryFire logs an explicit "Cannot X from Y" message on an invalid transition, this table ' +
      'is less safe than the class-per-state version, which throws exceptions instead.',
    reality:
      'The main page\'s own class-per-state version does NOT throw on invalid transitions either — every one ' +
      'of its invalid-action handlers (e.g. <code>DraftState.Pay</code>) just prints a message and returns, ' +
      'exactly matching <code>TryFire</code>\'s own behavior. The table-driven version additionally returns a ' +
      'bool the caller CAN check, which the original class-per-state void methods do not offer at all.',
  },
];

@Component({
  selector: 'app-state-data-driven-state-transition-table',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './data-driven-state-transition-table.html',
  styleUrl: './data-driven-state-transition-table.scss',
})
export class DataDrivenStateTransitionTableSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
