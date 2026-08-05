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
    heading: 'A Fix for One Bug That Quietly Caused Another',
    points: [
      'The main page\'s own mistake block ("Forgetting to clear the redo stack on new Execute()") correctly ' +
      'teaches that <code>Execute(ICommand cmd)</code> must clear <code>_redoStack</code> — new commands ' +
      'invalidate stale redo history. But the SAME <code>CommandHistory</code> class\'s own ' +
      '<code>Redo()</code> method originally called that SAME <code>Execute()</code> internally, which meant ' +
      'redoing one command wiped out every OTHER command still waiting in the redo stack.',
      'This is a self-contained bug findable purely by tracing the two methods against each other — no ' +
      'external research needed, just following exactly what <code>_redoStack.Clear()</code> does when it ' +
      'runs as a side effect of code that <code>Redo()</code> itself calls.',
    ],
  },
  {
    heading: 'Tracing the Bug Through a Concrete Sequence',
    points: [
      'Execute A, Execute B, Execute C: <code>_history = [A, B, C]</code>, <code>_redoStack = []</code>.',
      'Undo(), Undo(): <code>_history = [A]</code>, <code>_redoStack = [C, B]</code> (Undo pushes each ' +
      'undone command onto the redo stack, most-recently-undone on top).',
      'Redo(): pops B off <code>_redoStack</code> (now <code>[C]</code>), then calls ' +
      '<code>Execute(B)</code> — which pushes B onto history AND calls ' +
      '<code>_redoStack.Clear()</code>, destroying C\'s redo entry even though nothing about redoing B ' +
      'should have invalidated C\'s ability to also be redone next.',
      'The user who just clicked "Redo" once now finds "Redo" is no longer available at all, even though ' +
      'there was genuinely one more step (C) they should still have been able to redo.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before / After',
    language: 'csharp',
    code: `// BEFORE — Redo() routes through Execute(), which clears _redoStack
// as a side effect meant for genuinely NEW commands.
public class CommandHistory
{
    private readonly Stack<ICommand> _history = new();
    private readonly Stack<ICommand> _redoStack = new();

    public void Execute(ICommand command)
    {
        command.Execute();
        _history.Push(command);
        _redoStack.Clear(); // correct for a NEW command — wrong when Redo() calls this
    }

    public void Undo()
    {
        if (_history.TryPop(out var cmd)) { cmd.Undo(); _redoStack.Push(cmd); }
    }

    public void Redo()
    {
        if (_redoStack.TryPop(out var cmd)) { Execute(cmd); } // BUG: wipes remaining redo entries
    }
}

// AFTER — Redo() re-executes and pushes to history directly, bypassing
// the redo-clearing side effect that only makes sense for new commands.
public class CommandHistory
{
    private readonly Stack<ICommand> _history = new();
    private readonly Stack<ICommand> _redoStack = new();

    public void Execute(ICommand command)
    {
        command.Execute();
        _history.Push(command);
        _redoStack.Clear();
    }

    public void Undo()
    {
        if (_history.TryPop(out var cmd)) { cmd.Undo(); _redoStack.Push(cmd); }
    }

    public void Redo()
    {
        if (_redoStack.TryPop(out var cmd))
        {
            cmd.Execute();
            _history.Push(cmd); // no _redoStack.Clear() — other redo entries survive
        }
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Using the FIXED <code>CommandHistory</code>, walk through: Execute A, Execute B, Execute C, Undo, Undo, ' +
    'Redo. What are the exact contents of <code>_history</code> and <code>_redoStack</code> after each step, ' +
    'and can the user still successfully call Redo() one more time afterward?',
  hint:
    'Track both stacks after EVERY single operation, not just at the end — the bug only shows up by comparing ' +
    'what SHOULD remain in <code>_redoStack</code> against what actually does.',
  solution:
    'Execute A: history=[A], redo=[]. Execute B: history=[A,B], redo=[]. Execute C: history=[A,B,C], redo=[]. ' +
    'Undo: history=[A,B], redo=[C]. Undo: history=[A], redo=[C,B]. Redo: pops B off redo (redo=[C]), calls ' +
    'cmd.Execute() and pushes B onto history directly (history=[A,B]) — critically, redo is NOT cleared, so ' +
    'it correctly remains [C]. Yes, the user can call Redo() again: it pops C (redo=[]), executes it, and ' +
    'pushes it onto history (history=[A,B,C]) — restoring the full original sequence, exactly as the user ' +
    'would expect after redoing every available step.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since Redo() and Execute() both "execute a command and push it to history," reusing Execute() ' +
      'inside Redo() is a reasonable way to avoid duplicating that logic.',
    reality:
      'They share TWO of three steps (execute the command, push to history) but differ on the THIRD ' +
      '(clearing the redo stack) — and that third step is exactly the one that matters for correctness here. ' +
      'Reusing a method for its "mostly the same" behavior, without checking whether every one of its side ' +
      'effects is still appropriate at the new call site, is precisely how this bug was introduced.',
  },
  {
    thought: 'The redo stack should always be cleared whenever ANY command executes, including a redo, since ' +
      'that keeps the logic simple and consistent.',
    reality:
      'Clearing the redo stack specifically models "a genuinely new decision was made, invalidating the old ' +
      'future" — redoing is not a new decision, it is re-applying a decision the user already made and then ' +
      'undid. Treating a redo as equivalent to a fresh command conflates two operations with different, ' +
      'important semantic meanings for the user\'s undo/redo history.',
  },
];

@Component({
  selector: 'app-command-redo-silently-wipes-the-redo-stack',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './redo-silently-wipes-the-redo-stack.html',
  styleUrl: './redo-silently-wipes-the-redo-stack.scss',
})
export class RedoSilentlyWipesTheRedoStackSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
