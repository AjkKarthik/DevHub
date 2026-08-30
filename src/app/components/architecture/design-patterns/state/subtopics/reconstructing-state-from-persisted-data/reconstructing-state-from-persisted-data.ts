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
    heading: 'A One-Sentence Sketch, Never Built Out',
    points: [
      'The main page\'s own QnA on persistence sketches the fix in one line: "Factory or switch-on-load: ' +
      'if (stored == "PENDING") state = new PendingState()." Nowhere on the page is a full, working version ' +
      'of this shown — including what happens to the main page\'s OWN five-state Order lifecycle specifically.',
      'The main page\'s own <code>Order.Status</code> property already derives a display string FROM the ' +
      'current state object (<code>_state.GetType().Name.Replace("State", "")</code>) — persistence needs ' +
      'the exact REVERSE direction: given that same stored string back from a database, reconstruct the ' +
      'correct <code>IOrderState</code> instance to resume from.',
    ],
  },
  {
    heading: 'Why This Needs a Deliberate Design Decision, Not Just a Switch',
    points: [
      'A naive switch/if-chain reconstructing states from a string works, but silently accepts ANY stored ' +
      'value that happens to match a known state name — it has no way to distinguish "this order genuinely ' +
      'has status Shipped" from "this database row is corrupted and the string just happens to spell a valid ' +
      'state name."',
      'The reconstruction factory is also the natural place to apply the earlier singleton-states ' +
      'optimization: since every concrete state in the main page\'s own example is stateless, reconstructing ' +
      'an order from storage can hand back a SHARED singleton instance rather than allocating a fresh state ' +
      'object for every single row loaded from the database.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Save / Load Round Trip',
    language: 'csharp',
    code: `// The main page's own derivation, unchanged: state -> string.
public class Order
{
    public string Status => _state.GetType().Name.Replace("State", "");
    private IOrderState _state = new DraftState();
    public void SetState(IOrderState state) => _state = state;
    // ... Submit/Pay/Ship/Cancel unchanged
}

// SAVE: persisting the derived string is already trivial with the
// main page's own Status property.
void SaveOrder(Order order, int orderId, IDbConnection db) =>
    db.Execute("UPDATE Orders SET Status = @Status WHERE Id = @Id",
        new { order.Status, Id = orderId });

// LOAD: the direction the main page's own QnA sketches but never
// completes — reconstructing the right IOrderState from that string.
public static class OrderStateFactory
{
    public static IOrderState FromStoredStatus(string status) => status switch
    {
        "Draft"     => new DraftState(),
        "Submitted" => new SubmittedState(),
        "Paid"      => new PaidState(),
        "Shipped"   => new ShippedState(),
        "Cancelled" => new CancelledState(),
        _ => throw new InvalidOperationException(
            $"Unknown or corrupted order status in database: '{status}'"),
        // Deliberately throws rather than silently defaulting to
        // DraftState — a corrupted status string should surface as
        // an error at load time, not quietly reset the order's
        // lifecycle back to the beginning.
    };
}

Order LoadOrder(int orderId, IDbConnection db)
{
    var row = db.QuerySingle<(int Id, string Status)>(
        "SELECT Id, Status FROM Orders WHERE Id = @Id", new { Id = orderId });

    var order = new Order { Id = row.Id };
    order.SetState(OrderStateFactory.FromStoredStatus(row.Status));
    return order;
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A database row somehow has <code>Status = "shipped"</code> (lowercase "s") instead of the expected ' +
    '<code>"Shipped"</code> — perhaps from a manual SQL fix by someone on the team. What does ' +
    '<code>OrderStateFactory.FromStoredStatus</code> above do with this value, and is that the right ' +
    'behavior?',
  hint:
    'C#\'s <code>switch</code> pattern matching on string literals is case-SENSITIVE by default — check ' +
    'which arm, if any, "shipped" actually matches.',
  solution:
    'It matches NONE of the five named arms (they are all capitalized: "Draft", "Submitted", etc.) and falls ' +
    'through to the discard pattern, throwing an InvalidOperationException naming the exact bad value. ' +
    'Whether this is "right" depends on the actual data contract: if the Status column is meant to be an ' +
    'exact, case-sensitive match to the C# type names (as the main page\'s own Status property produces), ' +
    'then throwing on "shipped" correctly surfaces a real data-integrity problem rather than silently ' +
    'guessing what was meant. If case-insensitive matching is actually an acceptable, intended possibility ' +
    '(e.g. because rows can be edited by hand), the fix is an explicit ' +
    '<code>status.ToLowerInvariant()</code> normalization before the switch — a deliberate design decision ' +
    'either way, not something to leave to chance.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'A switch/if-chain reconstructing state from a string is just boilerplate with no real design ' +
      'decisions involved — any working version is as good as any other.',
    reality:
      'The main page\'s own one-line sketch glosses over a real decision this subtopic makes explicit: what ' +
      'happens on an UNRECOGNIZED value. Silently defaulting to a starting state, throwing, and logging-then-' +
      'defaulting are three genuinely different behaviors with different consequences for a corrupted or ' +
      'unexpected database row — "boilerplate" undersells how much this single default-case decision ' +
      'actually matters for data integrity.',
  },
  {
    thought: 'Since the reconstruction factory returns a fresh <code>new DraftState()</code> etc. for every ' +
      'call, this contradicts the earlier "states should be singletons" subtopic.',
    reality:
      'It doesn\'t contradict it — it is exactly where that optimization applies. ' +
      '<code>OrderStateFactory.FromStoredStatus</code> could just as easily return ' +
      '<code>DraftState.Instance</code> instead of <code>new DraftState()</code> once the states are made ' +
      'singletons, with zero other change to this file — the factory function\'s SIGNATURE and CALLERS stay ' +
      'identical either way, which is exactly the point of hiding the allocation decision behind a factory ' +
      'in the first place.',
  },
];

@Component({
  selector: 'app-state-reconstructing-state-from-persisted-data',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './reconstructing-state-from-persisted-data.html',
  styleUrl: './reconstructing-state-from-persisted-data.scss',
})
export class ReconstructingStateFromPersistedDataSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
