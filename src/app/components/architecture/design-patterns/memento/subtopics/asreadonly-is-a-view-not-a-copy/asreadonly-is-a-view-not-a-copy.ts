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
    heading: 'The Main Page\'s Own Mistake Block, Committed by Its Own Second codeTab',
    points: [
      'The main page\'s "Deep-copying mutable state in the Memento" mistake block is explicit: storing a ' +
      'mutable collection by REFERENCE means later mutations to the Originator\'s collection corrupt the ' +
      'snapshot, so the fix is to copy it (<code>[..Inventory]</code>).',
      'The "Game Save System" codeTab\'s own <code>Player.CreateSave()</code> originally wrote ' +
      '<code>Inventory.AsReadOnly()</code>, which LOOKS like a safe, defensive choice — "read-only" sounds ' +
      'like "cannot be mutated, therefore safe." It is neither.',
      '<code>List&lt;T&gt;.AsReadOnly()</code> returns a <code>ReadOnlyCollection&lt;T&gt;</code> that WRAPS ' +
      'the original list — it is a live VIEW, not a copy. If the underlying <code>List&lt;string&gt;</code> ' +
      'is mutated later, the "read-only" wrapper immediately reflects the change, because there was never a ' +
      'second, independent list to begin with — only a different way of looking at the SAME one.',
    ],
  },
  {
    heading: 'Why "Read-Only" Reads as "Safe" But Isn\'t',
    points: [
      '"Read-only" describes what the WRAPPER lets external code do to it (nothing) — it says nothing about ' +
      'whether the underlying data itself is protected from change through some OTHER reference, like the ' +
      'Originator\'s own private field still holding a mutable <code>List&lt;string&gt;</code>.',
      'This is a real, well-documented .NET gotcha, not specific to Memento — but it is especially dangerous ' +
      'INSIDE a Memento implementation specifically, because the entire point of a Memento is that its ' +
      'snapshot must stay frozen at the moment it was taken. A live view defeats that guarantee silently, ' +
      'with no exception, no warning — the snapshot just quietly changes underneath the code holding it.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before / After',
    language: 'csharp',
    code: `// BEFORE — the main page's own Player.CreateSave(), unmodified.
public GameSave CreateSave() =>
    new(Level, Score, Position, Inventory.AsReadOnly(), DateTime.UtcNow);

var player = new Player();
player.Inventory.Add("Sword");
var save = player.CreateSave();   // "snapshot" taken here

player.Inventory.Add("Shield");   // change made AFTER the snapshot

Console.WriteLine(save.Inventory.Count);
// Prints 2, NOT 1 — "Shield" leaked into the already-taken save,
// because save.Inventory is a live wrapper over player's own list,
// not an independent copy.

// AFTER — copy the list, exactly like the Text Editor codeTab's own
// [..Inventory] fix for the same mistake.
public GameSave CreateSave() =>
    new(Level, Score, Position, [..Inventory], DateTime.UtcNow);

var player2 = new Player();
player2.Inventory.Add("Sword");
var save2 = player2.CreateSave();

player2.Inventory.Add("Shield");

Console.WriteLine(save2.Inventory.Count);
// Prints 1, correctly — save2.Inventory is now an independent
// snapshot, unaffected by anything added to player2.Inventory after
// CreateSave() returned.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Would the same bug occur if <code>GameSave.Inventory</code> were typed as <code>string[]</code> ' +
    '(an array) instead of <code>IReadOnlyList&lt;string&gt;</code>, and <code>CreateSave()</code> wrote ' +
    '<code>Inventory.ToArray()</code> instead of <code>Inventory.AsReadOnly()</code>?',
  hint:
    'The bug is about whether a NEW, independent collection is allocated, not about which interface or type ' +
    'the result is exposed through — check what <code>ToArray()</code> actually does versus what ' +
    '<code>AsReadOnly()</code> does.',
  solution:
    'No — ToArray() would NOT have this bug. Unlike AsReadOnly(), List<T>.ToArray() allocates a brand-new ' +
    'array and copies every element into it — a genuine, independent snapshot, immune to later mutations of ' +
    'the original list. The lesson is not "never use AsReadOnly()" in general — it is a fine choice when the ' +
    'CALLER genuinely just needs a read-only VIEW of live data. The bug is specifically about using it where ' +
    'an INDEPENDENT SNAPSHOT was actually required, which is exactly what a Memento is.',
};

const misconceptions: Misconception[] = [
  {
    thought: '"Read-only" and "immutable snapshot" mean the same thing — if I can\'t change it, it\'s frozen.',
    reality:
      '"Read-only" only restricts what the HOLDER of the reference can do through that specific reference. It ' +
      'says nothing about whether some OTHER reference to the same underlying data can still mutate it — ' +
      'which is exactly the case with <code>AsReadOnly()</code>, since the Originator still holds its own ' +
      'fully mutable <code>List&lt;T&gt;</code> pointing at the identical backing storage.',
  },
  {
    thought: 'This bug only matters for the "Game Save System" codeTab specifically — the "Text Editor" ' +
      'codeTab\'s own <code>EditorSnapshot</code> is safe by comparison.',
    reality:
      '<code>EditorSnapshot</code> is safe for a different reason entirely: its two fields, ' +
      '<code>string Text</code> and <code>int CursorPosition</code>, are both VALUE TYPES / immutable ' +
      'reference types (strings never mutate in place in C#) — there is no mutable collection to ' +
      'accidentally alias in the first place. The bug is specific to MUTABLE COLLECTION fields, which is why ' +
      'it surfaces in <code>GameSave.Inventory</code> and not in <code>EditorSnapshot</code>.',
  },
];

@Component({
  selector: 'app-memento-asreadonly-is-a-view-not-a-copy',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './asreadonly-is-a-view-not-a-copy.html',
  styleUrl: './asreadonly-is-a-view-not-a-copy.scss',
})
export class AsreadonlyIsAViewNotACopySubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
