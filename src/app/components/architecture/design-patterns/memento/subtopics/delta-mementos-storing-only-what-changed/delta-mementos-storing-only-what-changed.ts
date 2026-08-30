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
    heading: 'The QnA Recommends Deltas, But Never Shows One',
    points: [
      'The main page\'s own QnA on efficiency for large state says it directly: "Use incremental snapshots ' +
      '(delta mementos) instead of full copies. Store only what changed since the last snapshot." Neither ' +
      'codeTab on the page implements this — both <code>EditorSnapshot</code> and <code>GameSave</code> copy ' +
      'the ENTIRE state on every single snapshot, no matter how small the actual change was.',
      'Both codeTabs\' full-snapshot approach is a reasonable default for SMALL state (a text cursor position, ' +
      'a player\'s level/score) — the QnA\'s own advice only becomes relevant once the Originator\'s state is ' +
      'genuinely large, which is exactly the case its own answer describes but never demonstrates.',
    ],
  },
  {
    heading: 'What a Delta Memento Actually Stores',
    points: [
      'Instead of copying the WHOLE Originator, a delta Memento records only the minimum information needed ' +
      'to reverse ONE specific change: which piece of state changed, and what it was before.',
      'The cost difference is real, not academic: for a document with M total fields and N edits made to it, ' +
      'full snapshots cost roughly O(N × M) total memory (every snapshot copies everything), while delta ' +
      'snapshots cost roughly O(N) (each delta only stores the one field that actually changed) — completely ' +
      'independent of how large M is.',
      'The trade-off is that undo now means "replay this one specific reversal," not "swap in a whole ' +
      'previously-copied state" — which is fine for a single field change, but requires care if a single ' +
      'logical "edit" the user performed actually touched several fields at once (the delta would then need ' +
      'to capture all of them together, or undo would only partially reverse the user\'s intended action).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Full Snapshot vs Delta',
    language: 'csharp',
    code: `// FULL SNAPSHOT — the main page's own pattern, applied to a large
// document. Every Snapshot() copies EVERY field, regardless of how
// many actually changed.
public sealed record DocumentSnapshot(IReadOnlyDictionary<string, string> Fields);

public class Document
{
    private readonly Dictionary<string, string> _fields = new();
    public string? Get(string key) => _fields.GetValueOrDefault(key);
    public void Set(string key, string value) => _fields[key] = value;

    // Copies ALL fields — expensive if the document has thousands of
    // them and only one changed since the last snapshot.
    public DocumentSnapshot Save() => new(new Dictionary<string, string>(_fields));
    public void Restore(DocumentSnapshot s)
    {
        _fields.Clear();
        foreach (var (k, v) in s.Fields) _fields[k] = v;
    }
}

// DELTA MEMENTO — records only what ONE Set() call actually changed.
public sealed record FieldChange(string Key, string? OldValue);

public class DeltaDocument
{
    private readonly Dictionary<string, string> _fields = new();
    public string? Get(string key) => _fields.GetValueOrDefault(key);

    // Returns a tiny memento — just the key and its PREVIOUS value —
    // capturing exactly enough to reverse THIS ONE change.
    public FieldChange Set(string key, string value)
    {
        var oldValue = Get(key);
        _fields[key] = value;
        return new FieldChange(key, oldValue);
    }

    // Reverses exactly one field, regardless of how many total
    // fields the document has.
    public void Undo(FieldChange change)
    {
        if (change.OldValue is null) _fields.Remove(change.Key);
        else _fields[change.Key] = change.OldValue;
    }
}

// A document with 10,000 fields, 5 edits made:
// Full snapshot approach: 5 snapshots x 10,000 entries each copied.
// Delta approach:         5 FieldChange records, one per actual edit.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A user edits a document by changing BOTH its <code>"title"</code> and its <code>"author"</code> fields ' +
    'as one logical action (say, a "rename document" button that updates both at once), using the ' +
    '<code>DeltaDocument.Set()</code> method shown above — called twice, once per field. If the Caretaker ' +
    'stores only the LAST <code>FieldChange</code> returned and calls <code>Undo()</code> once, what happens?',
  hint:
    'Each call to <code>Set()</code> returns its OWN separate <code>FieldChange</code>, describing only the ' +
    'ONE field it touched — think about what information is lost if the Caretaker only keeps one of the two.',
  solution:
    'Only the SECOND field (whichever was set last, e.g. "author") gets reversed — the first field\'s change ' +
    '("title") stays applied, since its own FieldChange was discarded. This is exactly the trade-off the ' +
    'theory section names: a delta Memento captures ONE atomic change per call, so a Caretaker representing ' +
    'a single user-facing "undo" action that actually spans multiple field changes must collect and store ' +
    'ALL of the resulting deltas together (e.g. as a List<FieldChange> per logical action) and undo every ' +
    'one of them as a group — not just keep the last one.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Delta mementos are strictly better than full snapshots — smaller memory footprint, so why would ' +
      'anyone use the main page\'s own full-copy approach at all?',
    reality:
      'Full snapshots have a real advantage the theory section above understates: restoring is a single, ' +
      'simple swap-in operation with no risk of applying deltas in the wrong order or missing one. For SMALL ' +
      'state (the main page\'s own <code>EditorSnapshot</code>: a string and an int), the memory savings from ' +
      'deltas are negligible, while the added complexity of correctly grouping and ordering deltas is real — ' +
      'full snapshots are the right default until state genuinely grows large enough for the QnA\'s advice to ' +
      'matter.',
  },
  {
    thought: 'A delta Memento is a completely different pattern from the main page\'s own Memento examples, ' +
      'not really "Memento" anymore.',
    reality:
      'It is still Memento — the Originator (<code>DeltaDocument</code>) still creates an opaque snapshot ' +
      'object (<code>FieldChange</code>) that the Caretaker stores without inspecting, and restoration still ' +
      'goes through the Originator\'s own <code>Undo()</code> method. The only thing that changed is WHAT the ' +
      'snapshot captures — the full state versus the minimum needed to reverse one change — which is exactly ' +
      'the "incremental snapshots (delta mementos)" variation the main page\'s own QnA names by that same term.',
  },
];

@Component({
  selector: 'app-memento-delta-mementos-storing-only-what-changed',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './delta-mementos-storing-only-what-changed.html',
  styleUrl: './delta-mementos-storing-only-what-changed.scss',
})
export class DeltaMementosStoringOnlyWhatChangedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
