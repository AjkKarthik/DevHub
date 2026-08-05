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
    heading: 'Named Twice, Shown Nowhere',
    points: [
      'The main page\'s own theory names macro commands directly: "a composite of multiple individual ' +
      'commands executed as one unit... combining Command with Composite" — and the QnA elaborates further: ' +
      '"Undoing the macro calls undo() on each sub-command in REVERSE order." Neither codeTab on the page ' +
      'ever shows a <code>MacroCommand</code> class.',
      'The REVERSE-order requirement is not a minor detail — get it backwards and undo can corrupt state, ' +
      'exactly the class of bug the main page\'s own mistake block already warns about for a single command\'s ' +
      'undo state.',
    ],
  },
  {
    heading: 'Why Reverse Order Specifically Matters',
    points: [
      'If sub-commands depend on each other\'s state (a common case — e.g. "select all text" then "delete ' +
      'selection" only makes sense in that order), undoing FORWARD would try to undo "select all" while the ' +
      'text is still deleted, and then undo "delete" against a text state the selection undo never restored ' +
      'correctly.',
      'Undoing in REVERSE exactly mirrors how a stack-based undo history already works for individual ' +
      'commands (the main page\'s own <code>CommandHistory.Undo()</code> pops the MOST RECENTLY executed ' +
      'command first) — a MacroCommand is really just a small, self-contained execution/undo stack of its ' +
      'own, nested inside one Command.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'MacroCommand — Composite + Command',
    language: 'csharp',
    code: `// Combines Command with Composite, exactly as the main page's own
// theory names it — a MacroCommand IS a Command, and it CONTAINS Commands.
public class MacroCommand(IReadOnlyList<ICommand> commands) : ICommand
{
    public void Execute()
    {
        // Forward order — later sub-commands may depend on earlier ones
        // having already run (e.g. "select text" must happen before "delete").
        foreach (var command in commands)
            command.Execute();
    }

    public void Undo()
    {
        // REVERSE order — undo the LAST thing that happened first, mirroring
        // how CommandHistory.Undo() already pops the most recent command.
        for (int i = commands.Count - 1; i >= 0; i--)
            commands[i].Undo();
    }
}

// Usage: a "clear formatting and replace" macro made of 3 ordinary commands
var editor = new TextEditor();
var macro = new MacroCommand(new ICommand[]
{
    new SelectAllCommand(editor),
    new DeleteTextCommand(editor, 0, editor.Text.Length),
    new InsertTextCommand(editor, "Replacement text", 0),
});

var history = new CommandHistory();
history.Execute(macro);   // runs all 3 sub-commands, in order, as ONE history entry
history.Undo();           // reverses all 3, in REVERSE order, as ONE atomic undo`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Suppose <code>MacroCommand.Undo()</code> were mistakenly written to undo sub-commands in the SAME order ' +
    'as Execute() (forward, not reverse). Using the "select text, delete, insert replacement" macro above, ' +
    'trace what actually happens when Undo() runs — what does the editor end up containing?',
  hint:
    'Trace each sub-command\'s own undo() individually, in forward order, and think about what STATE each ' +
    'one assumes is true at the moment it runs.',
  solution:
    'Forward-order undo would run: SelectAllCommand.Undo() first (clearing the selection — a no-op on the ' +
    'text itself), then DeleteTextCommand.Undo() (re-inserting the ORIGINAL deleted text at position 0), then ' +
    'InsertTextCommand.Undo() (deleting the "Replacement text" that was inserted, since it correctly targets ' +
    'the region it itself inserted). The final result would actually happen to leave the original text back ' +
    'in place in THIS specific example — but only by coincidence, because InsertTextCommand.Undo() computes ' +
    'its own deletion range from its own stored text.Length rather than depending on the editor\'s state at ' +
    'undo-time. Change the macro slightly (say, insert additional commands between these three, or have a ' +
    'later sub-command depend on an EARLIER one\'s output value rather than just its own fixed parameters) and ' +
    'forward-order undo breaks concretely: an undo step can run against editor state that has not yet been ' +
    'restored to what IT expects, corrupting the result in ways that will not always be as forgiving as this ' +
    'particular example.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since each sub-command\'s Undo() only touches its OWN piece of state, the order they run in ' +
      'during undo should not matter.',
    reality:
      'Sub-commands can share and depend on the SAME underlying receiver state (the whole text editor, not ' +
      'independent pieces) — a later sub-command\'s Execute() may depend on an EARLIER sub-command already ' +
      'having run, which means its Undo() implicitly depends on later sub-commands having ALREADY been undone ' +
      'first. Order is exactly the mechanism that keeps each Undo() call operating against the state it ' +
      'actually expects.',
  },
  {
    thought: 'A MacroCommand is just a convenience wrapper for calling several commands\' Execute() methods ' +
      'in a loop — nothing more sophisticated than that.',
    reality:
      'It is a genuine, self-contained application of TWO patterns at once: Composite (a container of ' +
      'Commands that is itself treated as a single Command — the main page\'s own theory names this ' +
      'explicitly) and Command\'s own undo contract (the macro must correctly reverse ITS OWN composite ' +
      'effect, which requires the reverse-order discipline shown here, not just a forward loop run backward ' +
      'by accident).',
  },
];

@Component({
  selector: 'app-command-a-real-macrocommand-undone-in-reverse',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-real-macrocommand-undone-in-reverse.html',
  styleUrl: './a-real-macrocommand-undone-in-reverse.scss',
})
export class ARealMacrocommandUndoneInReverseSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
