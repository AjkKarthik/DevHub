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
    heading: 'A One-Sentence Boundary, Never Actually Drawn',
    points: [
      'The main page\'s own QnA answers "Can lambdas/delegates replace the Command interface?" with: "For ' +
      'simple use cases — yes... The full pattern with a named class is justified when you need undo state, ' +
      'logging, serialisation, or meaningful type names for debugging and audit." That is a real, useful ' +
      'boundary — but it is never shown failing in actual code anywhere on the page.',
      'Every codeTab on the main page already uses full Command classes (<code>InsertTextCommand</code>, ' +
      '<code>CreateOrderCommand</code>), so the page never demonstrates the LAMBDA side of this trade-off at ' +
      'all, let alone the exact moment it stops working.',
    ],
  },
  {
    heading: 'Where a Lambda Genuinely Works',
    points: [
      'A lambda IS a Command in its simplest form: it encapsulates a piece of behavior as a value that can be ' +
      'stored, passed around, and invoked later — the exact core idea the main page\'s own theory opens with.',
      'For a one-shot action with no need to reverse it, log it meaningfully, or send it anywhere — a button ' +
      'click handler stored as an <code>Action</code>, for instance — a lambda captures everything a full ' +
      '<code>ICommand</code> class would, with none of the ceremony.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Where a Lambda Command Is Genuinely Enough',
    language: 'csharp',
    code: `// A simple invoker that just stores and later runs an Action —
// this genuinely IS the Command pattern, in its simplest legitimate form.
public class SimpleInvoker
{
    private Action? _pending;
    public void SetCommand(Action command) => _pending = command;
    public void Run() => _pending?.Invoke();
}

var invoker = new SimpleInvoker();
invoker.SetCommand(() => Console.WriteLine("Saved!"));
invoker.Run(); // "Saved!" — no undo, no logging, no serialization needed here`,
  },
  {
    label: 'Where It Breaks Down — Each Requirement, One at a Time',
    language: 'csharp',
    code: `// Requirement 1: UNDO. A lambda has nowhere to STORE the state it
// needs to reverse itself — you would have to smuggle mutable state
// into the closure, which is exactly what a Command class's fields
// are FOR.
Action deleteAction = () => editor.DeleteText(0, 5); // once run, the
// deleted text is GONE — there is no deleteAction.Undo() to call, and
// no field on a bare Action to have stashed the deleted text into.

// Requirement 2: MEANINGFUL LOGGING / AUDIT. A lambda has no name a
// log can record beyond "some delegate ran":
logger.LogInformation("Executed: {Command}", deleteAction);
// logs something like "Executed: System.Action" — useless for an audit
// trail. A named Command class logs its own real type:
logger.LogInformation("Executed: {Command}", nameof(DeleteTextCommand)); // "Executed: DeleteTextCommand"

// Requirement 3: SERIALIZATION (the Outbox pattern this page's own QnA
// names). A delegate cannot be serialized to a database row or a
// message queue at all — there is no reflection-safe way to persist
// "a pointer to compiled code plus its captured closure."
await outbox.SaveAsync(deleteAction); // does not compile / has no
                                        // meaningful serialized form
// A record-based Command DOES serialize cleanly:
public record DeleteTextCommand(int Position, int Length); // plain
                                                              // data — trivially
                                                              // JSON-serializable
await outbox.SaveAsync(new DeleteTextCommand(0, 5)); // works`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate wants to add "the ability to log which button was clicked, by name, for analytics" to the ' +
    '<code>SimpleInvoker</code> shown above, while KEEPING commands as plain <code>Action</code> delegates ' +
    'rather than switching to full Command classes. Is this achievable, and if so, what is the real cost of ' +
    'achieving it while staying lambda-based?',
  hint:
    'Think about what information an <code>Action</code> alone carries versus what you would have to add ' +
    'ALONGSIDE it to recover a meaningful name.',
  solution:
    'It is achievable, but only by pairing the Action with something that carries a name — for example ' +
    'changing SetCommand to accept a (string Name, Action Execute) tuple or a small wrapper record instead of ' +
    'a bare Action, and logging the Name field explicitly wherever the command runs. The real cost is that ' +
    'this is no longer meaningfully "simpler" than a Command class — you have reinvented, ad hoc, exactly the ' +
    'piece of state (a meaningful identity attached to the behavior) a named Command class gives you for free ' +
    'through its own type name. This is precisely the QnA\'s own boundary in action: the moment a real ' +
    'requirement (here, a name for logging) appears, the lambda approach either fails outright or has to grow ' +
    'extra structure that converges back toward the full pattern.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'A lambda "becomes" a full Command class automatically once you need undo, logging, or ' +
      'serialization — there is no real extra work involved.',
    reality:
      'The transition requires deliberately introducing a real class with fields to hold the state each ' +
      'requirement needs — undo state must be captured somewhere a lambda\'s closure does not naturally ' +
      'expose for later reversal, a meaningful name has to come from somewhere (the class\'s own type, not the ' +
      'delegate), and serialization needs actual data fields a compiler can reflect over, none of which a bare ' +
      'delegate provides without deliberately restructuring the code.',
  },
  {
    thought: 'Since lambdas can capture variables from their enclosing scope, they can already "store" undo ' +
      'state just as well as a Command class\'s fields can.',
    reality:
      'A lambda\'s closure captures state that exists AT THE MOMENT the lambda is created, for use when it ' +
      'RUNS — but Undo() needs state captured AT THE MOMENT the ORIGINAL action ran, computed fresh each time ' +
      '(the main page\'s own mistake block covers exactly this: undo state must be captured inside Execute(), ' +
      'not the constructor). A plain Action has no second method (Undo) to even receive that captured state ' +
      'later, regardless of what its closure holds.',
  },
];

@Component({
  selector: 'app-command-when-a-lambda-command-stops-being-enough',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './when-a-lambda-command-stops-being-enough.html',
  styleUrl: './when-a-lambda-command-stops-being-enough.scss',
})
export class WhenALambdaCommandStopsBeingEnoughSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
