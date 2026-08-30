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
    heading: 'The Quiz Names a Technique Neither codeTab Actually Shows',
    points: [
      'One of the main page\'s own quiz explanations describes the CLASSIC narrow/wide-interface ' +
      'implementation directly: "In languages that support nested classes (Java, C#): the Memento is an ' +
      'inner class of the Originator... external classes can only hold a reference to the opaque Memento ' +
      'type, not read its contents."',
      'Neither codeTab on the page actually does this. <code>EditorSnapshot</code> and <code>GameSave</code> ' +
      'are both TOP-LEVEL, fully PUBLIC records — any code anywhere in the project can read every one of ' +
      'their properties directly. "Opaque to the Caretaker" is true only by CONVENTION on the main page\'s ' +
      'own examples — nothing in the compiler actually stops a Caretaker from reading ' +
      '<code>snapshot.Text</code> if it wanted to.',
    ],
  },
  {
    heading: 'Making Opacity a Compile-Time Guarantee, Not a Convention',
    points: [
      'A private class NESTED inside the Originator can implement a PUBLIC, completely EMPTY marker ' +
      'interface. The Caretaker is typed to hold only that marker interface — it has no way to even NAME the ' +
      'concrete nested class from outside the Originator, since <code>private</code> nested types are ' +
      'inaccessible outside their enclosing class.',
      'The Originator itself, on the other hand, has full access to its own private nested class\'s members ' +
      '(this is ordinary C# nested-class visibility — a nested type\'s <code>private</code> members are still ' +
      'visible to the ENCLOSING type). So the Originator can read every field when restoring, while the ' +
      'Caretaker genuinely cannot, even if it tried.',
      'This is the difference between "the Caretaker is not SUPPOSED to read Memento contents" (the main ' +
      'page\'s own records) and "the Caretaker is UNABLE to read Memento contents" (a nested private class) — ' +
      'the same distinction as a private field versus a field merely named with a leading underscore by ' +
      'convention.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Narrow / Wide Interface',
    language: 'csharp',
    code: `public class TextEditor
{
    private string _text = "";
    private int _cursorPosition;

    // WIDE interface — visible only inside TextEditor (private nested
    // class can access TextEditor's own state via the constructor).
    // NARROW interface — the public marker every outside caller sees.
    public interface IMemento { }

    private sealed class Memento(string text, int cursorPosition) : IMemento
    {
        public string Text { get; } = text;
        public int CursorPosition { get; } = cursorPosition;
    }

    public IMemento Save() => new Memento(_text, _cursorPosition);

    public void Restore(IMemento memento)
    {
        // Only TextEditor itself can pattern-match down to the
        // concrete (private) Memento type — this cast is legal ONLY
        // from inside TextEditor.
        if (memento is not Memento m)
            throw new ArgumentException("Unknown memento type", nameof(memento));
        _text = m.Text;
        _cursorPosition = m.CursorPosition;
    }
}

// Caretaker — genuinely CANNOT read the snapshot, not just "shouldn't".
public class EditorHistory
{
    private readonly Stack<TextEditor.IMemento> _undoStack = new();
    private readonly TextEditor _editor;

    public EditorHistory(TextEditor editor) => _editor = editor;

    public void Snapshot() => _undoStack.Push(_editor.Save());

    public void Undo()
    {
        if (_undoStack.TryPop(out var snapshot))
            _editor.Restore(snapshot);
        // EditorHistory only ever sees TextEditor.IMemento — an EMPTY
        // interface with zero members. There is no property to read,
        // and no legal way to cast down to TextEditor.Memento from
        // here, because TextEditor.Memento is PRIVATE to TextEditor.
    }
}

// This line would not compile if written inside EditorHistory:
// var text = ((TextEditor.Memento)snapshot).Text;
// CS0122: 'TextEditor.Memento' is inaccessible due to its protection level`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page\'s own <code>EditorSnapshot</code> is declared as a <code>public sealed record</code>. If ' +
    'a Caretaker written by a DIFFERENT team accidentally wrote ' +
    '<code>Console.WriteLine(snapshot.Text)</code> to peek at a memento\'s contents for a debug log, would ' +
    'that compile against the main page\'s own types? Would it compile against this subtopic\'s ' +
    '<code>TextEditor.IMemento</code> design?',
  hint:
    'Check what each type actually EXPOSES to code outside the Originator — a public record\'s properties ' +
    'versus an empty marker interface\'s.',
  solution:
    'Against the main page\'s own EditorSnapshot, yes — it compiles fine, since Text is a public property on ' +
    'a public record with no access restriction at all. Against this subtopic\'s TextEditor.IMemento, no — ' +
    'it fails to compile, because IMemento declares zero members; there is no .Text to access on the ' +
    'interface type at all, and the concrete Memento class that DOES have a Text property is private and ' +
    'inaccessible from outside TextEditor. This is the concrete difference between a convention ("please ' +
    'don\'t read this") and a compiler-enforced guarantee ("you literally cannot").',
};

const misconceptions: Misconception[] = [
  {
    thought: 'The main page\'s own public-record Mementos are "wrong" — the nested-class version should ' +
      'replace them.',
    reality:
      'Public records are a completely reasonable, common real-world choice — they are simpler to write, ' +
      'easier to serialize (relevant for the Game Save codeTab specifically), and the "Caretaker never reads ' +
      'it" convention is often sufficient within a well-disciplined codebase. The nested-class version is a ' +
      'STRONGER guarantee for cases where an actual encapsulation violation would be a real bug (e.g. a ' +
      'library boundary where you cannot review every caller), not a strictly superior default.',
  },
  {
    thought: 'Since <code>IMemento</code> has zero members, it cannot actually be used for anything — it ' +
      'seems like a pointless type.',
    reality:
      'That is exactly the point, not a flaw — an empty interface is a MARKER type. Its entire job is to give ' +
      'the Caretaker something to hold a reference to and pass around (in a <code>Stack&lt;IMemento&gt;</code>, ' +
      'for instance) without being able to do anything else with it. The Originator is the only code that ' +
      'ever needs to see past the marker to the real data.',
  },
];

@Component({
  selector: 'app-memento-nested-class-memento-narrow-interface',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './nested-class-memento-narrow-interface.html',
  styleUrl: './nested-class-memento-narrow-interface.scss',
})
export class NestedClassMementoNarrowInterfaceSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
