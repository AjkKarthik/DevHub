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
  { name: 'Intent',     type: 'keyword', desc: 'Capture and restore an object\'s internal state without violating encapsulation.' },
  { name: 'Originator', type: 'class',   desc: 'The object whose state needs to be saved and restored. Creates and restores Mementos.' },
  { name: 'Memento',    type: 'class',   desc: 'An immutable snapshot of the Originator\'s state. Opaque to the Caretaker.' },
  { name: 'Caretaker',  type: 'class',   desc: 'Stores Mementos in a stack/list but never inspects or modifies their contents.' },
  { name: 'Undo Stack', type: 'keyword', desc: 'Caretaker maintains a history stack; undo pops and restores; redo repushes.' },
  { name: 'Encapsulation', type: 'keyword', desc: 'The Caretaker cannot read Memento internals — encapsulation is preserved.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Memento Pattern?',
    points: [
      'Memento saves and restores an object\'s internal state without violating its encapsulation.',
      'The Originator creates a Memento (snapshot) of its state; it also restores from a Memento.',
      'The Caretaker stores Mementos (typically in a history stack) but cannot read or modify their contents.',
      'The Caretaker treats the Memento as an opaque token — it only holds and passes it back.',
    ],
  },
  {
    heading: 'Three Roles',
    points: [
      'Originator: the object whose state changes. Has CreateMemento() and Restore(memento) methods.',
      'Memento: immutable snapshot. Contains state data but exposes nothing to outside code (except the Originator).',
      'Caretaker: manages the memento history stack. Calls CreateMemento() before changes; calls Restore() to undo.',
    ],
  },
  {
    heading: 'Memento vs Command Undo',
    points: [
      'Command Undo: stores the reverse operation (InsertTextCommand knows how to delete the text it inserted).',
      'Memento Undo: stores a full snapshot of the object state — no need to compute the reverse.',
      'Command Undo: efficient for targeted operations; each command knows its own reversal.',
      'Memento Undo: simpler implementation; trades memory (full snapshots) for simplicity (no reverse logic).',
    ],
  },
  {
    heading: '.NET Patterns',
    points: [
      'IUndoable / ISnapshot in document editors.',
      'EF Core change tracking: DbContext tracks original values internally — a form of memento.',
      'Game save files: serialising game state to disk is Memento on a larger scale.',
      'System.Text.Json / Newtonsoft: snapshot-to-JSON and restore-from-JSON is Memento via serialisation.',
    ],
  },
  {
    heading: 'Memento Preserving Encapsulation While Enabling Undo',
    points: [
      'A naive undo implementation might expose an object\'s internal state publicly so external code can save and restore it — this breaks encapsulation, since internal state that should be private becomes part of the object\'s public contract just to support undo functionality.',
      'Memento solves this by having the Originator (the object whose state needs saving) create an opaque Memento object containing a snapshot of its own state — external code (the Caretaker) stores this Memento without ever being able to inspect or modify its contents, preserving the Originator\'s encapsulation.',
      'The Caretaker\'s responsibility is limited to storing and later returning Mementos to the Originator for restoration — it never interprets or manipulates the Memento\'s internal contents, which is what distinguishes this pattern from simply exposing and externally manipulating an object\'s raw state.',
      'Memento can have real memory implications if snapshots are large or numerous (deep copying complex object graphs for every undo step) — production undo implementations often use more memory-efficient techniques (storing diffs/deltas rather than full snapshots) once naive Memento becomes a genuine memory concern.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Text Editor with Snapshots',
    language: 'csharp',
    code: `// Memento — immutable snapshot, opaque to Caretaker
public sealed record EditorSnapshot(string Text, int CursorPosition);

// Originator
public class TextEditor
{
    public string Text           { get; private set; } = "";
    public int    CursorPosition { get; private set; }

    public void Type(string text)
    {
        Text = Text.Insert(CursorPosition, text);
        CursorPosition += text.Length;
    }

    public void MoveCursor(int position) => CursorPosition = position;

    // Create snapshot of current state
    public EditorSnapshot Save() => new(Text, CursorPosition);

    // Restore from snapshot
    public void Restore(EditorSnapshot snapshot)
    {
        Text           = snapshot.Text;
        CursorPosition = snapshot.CursorPosition;
    }
}

// Caretaker — stores snapshots, knows nothing about their contents
public class EditorHistory
{
    private readonly Stack<EditorSnapshot> _undoStack = new();
    private readonly Stack<EditorSnapshot> _redoStack = new();
    private readonly TextEditor _editor;

    public EditorHistory(TextEditor editor) => _editor = editor;

    public void Snapshot()
    {
        _undoStack.Push(_editor.Save());
        _redoStack.Clear();
    }

    public void Undo()
    {
        if (_undoStack.TryPop(out var snapshot))
        {
            _redoStack.Push(_editor.Save());
            _editor.Restore(snapshot);
        }
    }

    public void Redo()
    {
        if (_redoStack.TryPop(out var snapshot))
        {
            _undoStack.Push(_editor.Save());
            _editor.Restore(snapshot);
        }
    }
}

// Usage
var editor  = new TextEditor();
var history = new EditorHistory(editor);

history.Snapshot();
editor.Type("Hello");
history.Snapshot();
editor.Type(" World");

Console.WriteLine(editor.Text); // Hello World
history.Undo();
Console.WriteLine(editor.Text); // Hello
history.Undo();
Console.WriteLine(editor.Text); // ""
history.Redo();
Console.WriteLine(editor.Text); // Hello`,
  },
  {
    label: 'Game Save System',
    language: 'csharp',
    code: `// Memento as a serialisable record
public sealed record GameSave(
    int Level, int Score, Vector2 Position,
    IReadOnlyList<string> Inventory, DateTime SavedAt);

// Originator
public class Player
{
    public int     Level    { get; set; } = 1;
    public int     Score    { get; set; }
    public Vector2 Position { get; set; }
    public List<string> Inventory { get; } = new();

    public GameSave CreateSave() =>
        new(Level, Score, Position, Inventory.AsReadOnly(), DateTime.UtcNow);

    public void LoadSave(GameSave save)
    {
        Level    = save.Level;
        Score    = save.Score;
        Position = save.Position;
        Inventory.Clear();
        Inventory.AddRange(save.Inventory);
    }
}

// Caretaker — persists saves to disk
public class SaveManager
{
    private readonly string _saveDir = "saves";

    public void Save(Player player, string slot)
    {
        var save = player.CreateSave();
        var json = JsonSerializer.Serialize(save);
        File.WriteAllText(Path.Combine(_saveDir, $"{slot}.json"), json);
    }

    public void Load(Player player, string slot)
    {
        var json = File.ReadAllText(Path.Combine(_saveDir, $"{slot}.json"));
        var save = JsonSerializer.Deserialize<GameSave>(json)!;
        player.LoadSave(save);
    }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Caretaker reading or modifying Memento contents',
    wrong: `public void Undo()
{
    var snapshot = _undoStack.Pop();
    snapshot.Text = ""; // Caretaker modifying memento! Breaks encapsulation
    _editor.Restore(snapshot);
}`,
    right: `public void Undo()
{
    if (_undoStack.TryPop(out var snapshot))
        _editor.Restore(snapshot); // opaque — Caretaker never inspects contents
}`,
    explanation: 'The Caretaker must treat Mementos as opaque tokens. Only the Originator should read or write Memento contents — the Caretaker just stores and passes them back.',
  },
  {
    title: 'Not taking a snapshot before making changes',
    wrong: `editor.Type("Hello"); // change made
history.Snapshot();   // too late — snapshot is AFTER the change`,
    right: `history.Snapshot();   // capture state BEFORE
editor.Type("Hello"); // then make the change`,
    explanation: 'Snapshots must be taken BEFORE the change, not after. Taking a snapshot after the change captures the new state — undo would restore to the already-changed state, not the previous one.',
  },
  {
    title: 'Deep-copying mutable state in the Memento',
    wrong: `public EditorSnapshot Save() =>
    new EditorSnapshot(Inventory); // same list reference — mutations affect snapshot!`,
    right: `public EditorSnapshot Save() =>
    new EditorSnapshot([..Inventory]); // copy the list — snapshot is independent`,
    explanation: 'Mementos must be independent snapshots. If mutable collections are stored by reference, changes to the Originator\'s collection corrupt the snapshot. Always deep-copy mutable state.',
  },
  {
    title: 'Using Memento when Command undo is more appropriate',
    wrong: `// Snapshotting a 100MB game world every keypress — huge memory waste`,
    right: `// Large state: use Command pattern (store reversible operations, not full snapshots)
// Small state: use Memento (snapshots are cheap)`,
    explanation: 'Memento trades memory for simplicity — full snapshots are fine for small objects. For large complex state, Command-based undo (storing reversible operations) is far more memory efficient.',
  },
];

const challenge: Challenge = {
  title: 'Form Draft Saver',
  language: 'typescript',
  description: `Implement Memento for a form editor.
FormEditor has fields: title, body, tags[].
Save() returns a FormSnapshot (the Memento).
Restore(snapshot) reverts to that saved state.
FormHistory (Caretaker) manages undo/redo.`,
  hints: [
    'FormSnapshot is an immutable record — deep-copy tags array',
    'FormHistory.snapshot() called before editing',
    'Caretaker never reads snapshot contents',
  ],
  starterCode: `interface FormSnapshot { title: string; body: string; tags: string[]; }

class FormEditor {
  title = ''; body = ''; tags: string[] = [];
  save(): FormSnapshot { /* TODO */ return { title: '', body: '', tags: [] }; }
  restore(s: FormSnapshot): void { /* TODO */ }
}

class FormHistory {
  private stack: FormSnapshot[] = [];
  // TODO: snapshot(), undo()
}`,
  solution: `interface FormSnapshot { title: string; body: string; tags: string[]; }

class FormEditor {
  title = ''; body = ''; tags: string[] = [];

  save(): FormSnapshot {
    return { title: this.title, body: this.body, tags: [...this.tags] };
  }

  restore(s: FormSnapshot): void {
    this.title = s.title;
    this.body  = s.body;
    this.tags  = [...s.tags];
  }
}

class FormHistory {
  private stack: FormSnapshot[] = [];
  constructor(private editor: FormEditor) {}

  snapshot(): void { this.stack.push(this.editor.save()); }

  undo(): void {
    const s = this.stack.pop();
    if (s) this.editor.restore(s);
  }
}

const editor  = new FormEditor();
const history = new FormHistory(editor);

history.snapshot();
editor.title = 'My Post'; editor.tags = ['tech'];
history.snapshot();
editor.title = 'Updated Post'; editor.tags = ['tech', 'design'];

console.log(editor.title);  // Updated Post
history.undo();
console.log(editor.title);  // My Post
history.undo();
console.log(editor.title);  // ''`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does the Caretaker know about the Memento\'s contents?',
    options: [
      'Everything — it reads and writes the memento state',
      'Nothing — the Memento is opaque to the Caretaker; it only stores and passes it back',
      'Only the timestamp of when the snapshot was taken',
      'The Caretaker and Memento are the same class',
    ],
    answer: 1,
    explanation: 'The Caretaker stores Mementos in a history stack but never reads or modifies their contents. Only the Originator reads/writes Memento internals. This preserves the Originator\'s encapsulation.',
  },
  {
    q: 'When should you take a snapshot (Create Memento) to support undo?',
    options: [
      'After making the change to the Originator',
      'Before making the change to the Originator',
      'At application startup, once',
      'When the user explicitly requests a save',
    ],
    answer: 1,
    explanation: 'Snapshots must capture state BEFORE the change. Snapshotting after the change captures the new (changed) state — restoring it undoes nothing. The caretaker must snapshot, then allow the originator to change.',
  },
  {
    q: 'How does Memento undo differ from Command undo?',
    options: [
      'Memento stores full state snapshots; Command stores reversible operations',
      'Command stores full state snapshots; Memento stores reversible operations',
      'There is no difference — they both store the same information',
      'Memento only works with text editors; Command works with any object',
    ],
    answer: 0,
    explanation: 'Memento stores a full snapshot of the object\'s state — simpler to implement but uses more memory. Command stores the reverse operation — more memory-efficient for large state but requires computing the reversal logic for each command.',
  },
  { q: 'What is the Memento pattern and what does it preserve?', options: ['A caching pattern that stores computed values for expensive methods', 'A behavioral pattern that captures and externalizes an object internal state so that the object can be restored to this state later, without violating encapsulation', 'A pattern for taking database snapshots for disaster recovery', 'A pattern that logs all method calls to enable replay'], answer: 1, explanation: 'Memento captures an object internal state and stores it in a memento object. Later, the memento can be used to restore the object to that state. Key design constraint: the memento is opaque to anything other than the originator that created it, preserving encapsulation. Only the originator knows how to read/write the memento internal state; the caretaker that stores mementos treats them as black boxes. Classic use case: undo/redo in text editors, drawing applications, or database transactions.' },
  { q: 'What are the three participants in the Memento pattern and their roles?', options: ['Client, Server, and Database; clients request state saves, servers process them, databases store them', 'Originator, Memento, and Caretaker; the originator creates and restores from mementos; the memento stores state; the caretaker manages the memento lifecycle', 'Producer, Consumer, and Buffer; the producer creates state, the buffer stores it, the consumer restores it', 'Model, View, and Controller; the model saves state, the view displays it, the controller manages history'], answer: 1, explanation: 'Originator: the object whose state we want to save. Creates a memento containing a snapshot of its state (createMemento()). Can restore its state from a memento (restoreFromMemento()). Memento: stores the originator internal state. Exposes no operations to anything other than the originator (narrow interface to caretaker, wide interface to originator). Caretaker: manages when to save and restore state. Stores mementos (undo stack). Passes mementos back to the originator when undo is requested. Never examines or modifies memento content.' },
  { q: 'How does Memento preserve encapsulation while still externalizing state?', options: ['By storing state only in the originator as private fields that are never exposed', 'By defining two interfaces for Memento: a wide interface for the originator (allows access to state) and a narrow interface for the caretaker (opaque, no state access)', 'By using reflection to access private fields at runtime without exposing them in the public API', 'Memento does not preserve encapsulation; state must be made public for restoration'], answer: 1, explanation: 'The Memento pattern uses interface segregation to preserve encapsulation. In languages that support nested classes (Java, C#): the Memento is an inner class of the Originator. The inner class has access to the outer class private members, but external classes can only hold a reference to the opaque Memento type, not read its contents. In other languages: the Memento exposes a narrow public interface to the caretaker (no state access) and the Originator uses package-private or internal methods to access the full state stored in the Memento.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do you implement Memento for large complex state efficiently?',
    a: 'Use incremental snapshots (delta mementos) instead of full copies. Store only what changed since the last snapshot. For very large state, combine with Command pattern: store reversible commands for granular changes, full snapshots only at checkpoints (e.g., "auto-save every 10 minutes").',
  },
  {
    q: 'Is Entity Framework\'s change tracking an example of Memento?',
    a: 'Yes — EF Core DbContext tracks original values for each entity when it is loaded. On SaveChanges(), EF compares current values against originals to generate UPDATE statements. This is conceptually Memento: the original values are the snapshot (Memento), the entity is the Originator, and DbContext is the Caretaker.',
  },
  { q: 'How does Memento differ from serialization for state capture?', a: 'Serialization converts the entire object graph to a format (JSON, binary) for storage or transfer. Both capture state, but: Memento preserves encapsulation — the internal state format is an implementation detail of the originator, not a public API. Serialization makes the internal structure a public contract that is hard to change without breaking compatibility. Memento is typically in-memory and fast (no conversion overhead). Serialization is needed for persistent storage across sessions or transfer to another machine. Memento mementos can be invalidated when the originator class structure changes; serialized data has the same issue but must also deal with schema migration. Use Memento for in-process undo; use serialization for persistence and inter-process communication.' },
  { q: 'What are the memory implications of storing many mementos?', a: 'Each memento holds a full snapshot of the originator state. If state is large (a complex document, a large game world) and you need many history steps, memory usage grows proportionally. Strategies to manage memory: limit the undo history depth (keep only the last N mementos). Use incremental mementos: store only what changed (deltas), not the full state. Compress memento data if the state is compressible. Checkpoint and clear: periodically save a full checkpoint and clear older incremental mementos. For very large state, consider Command pattern for undo instead: store the inverse operation (delete what was added) rather than copying the entire state.' },
  { q: 'Can Command and Memento be combined in the same undo system, and what would that hybrid look like?', a: 'Yes — a common hybrid uses Command to represent WHICH operation happened (for logging, redo, and audit purposes) while that Command internally captures a Memento of the affected state before executing, so undo() simply restores the captured Memento rather than needing to compute a precise inverse operation. This combines Command\'s benefit of a clear, loggable operation history with Memento\'s benefit of not needing to hand-write a mathematically exact inverse for every operation type — useful when some operations are easy to express as commands (clear intent) but hard to cleanly invert (e.g. a bulk find-and-replace), so the command captures a snapshot as its undo mechanism instead of computing a reverse transform.' },
  { q: 'What are real-world applications of the Memento pattern?', a: 'Real applications: text editors undo/redo (Ctrl+Z): each keystroke or batch operation creates a memento. Undo pops the memento stack and restores state. Database transactions: MVCC (Multi-Version Concurrency Control) stores versions of rows (like mementos) to support transactions rolling back to a prior state. Game save states: capture the entire game state at a checkpoint so the player can reload. Visual design tools (Figma, Photoshop): full history of design state for undo. Git can be loosely understood as a Memento pattern at the file system level: each commit is a snapshot (memento) of the repository state that can be restored. Browser history of form state (drafts auto-saved).' },
];

const revision: RevisionSummary = {
  oneLiner: 'Memento captures an Originator\'s state as an opaque snapshot (Memento) managed by a Caretaker — enabling undo/redo without violating encapsulation.',
  mustKnow: [
    'Originator: creates and restores Mementos; Caretaker: stores them opaquely',
    'Snapshot BEFORE the change — not after',
    'Memento must deep-copy mutable collections — snapshots must be independent',
    'Caretaker never reads Memento contents — encapsulation preserved',
    'Memento (full snapshots) vs Command (reversible operations) — trade-off: memory vs simplicity',
  ],
  interviewFocus: [
    'What is the Caretaker\'s role and what is it NOT allowed to do?',
    'Memento undo vs Command undo — when would you choose each?',
    'How does EF Core change tracking relate to Memento?',
  ],
};

@Component({
  selector: 'app-dp-memento',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './memento.html',
  styleUrl: './memento.scss',
})
export class DpMemento {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
