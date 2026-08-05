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
    heading: 'A Design Named in Prose, Never Shown in Code',
    points: [
      'The main page\'s own theory, quiz, and QnA all discuss the "Transparency" design (putting ' +
      'Add/Remove on the shared Component interface) versus the "Safety" design (Add/Remove only on ' +
      'Composite) — but every codeTab and every mistake block on the page only ever SHOWS the Safety design.',
      'This means the main page\'s own quiz answer — "clients must downcast to add children — accepted in ' +
      'classic GoF" — describes a real consequence of the Safety design that is never actually demonstrated ' +
      'anywhere on the page.',
    ],
  },
  {
    heading: 'What Transparency Actually Costs a Leaf',
    points: [
      'Putting <code>Add()</code>/<code>Remove()</code> on <code>IFileSystemItem</code> forces ' +
      '<code>FileItem</code> (a leaf with no children) to implement them somehow — the two honest options are ' +
      'throwing (<code>NotSupportedException</code>) or silently no-oping. Neither is satisfying: throwing ' +
      'means a method that exists on the interface can blow up at runtime for half the implementing types; ' +
      'no-oping means calling <code>Add()</code> on a file silently does nothing, with no signal anything went ' +
      'wrong.',
      'This is precisely why mistake #2 on the main page calls the transparency version a design smell — but ' +
      'seeing the actual throwing/no-op code makes that judgment concrete instead of abstract.',
    ],
  },
  {
    heading: 'What Safety Actually Costs a Client',
    points: [
      'The main page\'s own Safety-design codeTabs never show a client actually trying to ADD to an existing ' +
      'tree at a specific node — every example builds the tree bottom-up with variables already typed as ' +
      '<code>Folder</code>, never through the <code>IFileSystemItem</code> interface.',
      'A realistic client that only has an <code>IFileSystemItem</code> reference (say, from a search result) ' +
      'and wants to add a new file into it MUST downcast: <code>if (item is Folder f) f.Add(newFile); else ' +
      '/* cannot add to a leaf */</code> — the exact downcast the main page\'s own quiz explanation warns is ' +
      'the trade-off, but never actually writes out.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Transparency Design',
    language: 'csharp',
    code: `// Add/Remove live on the SHARED interface — "uniform" in the sense that
// every IFileSystemItem has these methods, meaningless for a leaf.
public interface ITransparentFileSystemItem
{
    string Name { get; }
    long   GetSize();
    void   Add(ITransparentFileSystemItem item);
    void   Remove(ITransparentFileSystemItem item);
}

public class TransparentFileItem(string name, long size) : ITransparentFileSystemItem
{
    public string Name { get; } = name;
    public long   GetSize() => size;

    // A leaf has no children — throwing is the HONEST option; a silent
    // no-op would hide a real programming error at the call site.
    public void Add(ITransparentFileSystemItem item) =>
        throw new NotSupportedException($"{Name} is a file — cannot add children to it.");
    public void Remove(ITransparentFileSystemItem item) =>
        throw new NotSupportedException($"{Name} is a file — cannot remove children from it.");
}

public class TransparentFolder(string name) : ITransparentFileSystemItem
{
    public string Name { get; } = name;
    private readonly List<ITransparentFileSystemItem> _children = new();

    public long GetSize() => _children.Sum(c => c.GetSize());
    public void Add(ITransparentFileSystemItem item) => _children.Add(item);
    public void Remove(ITransparentFileSystemItem item) => _children.Remove(item);
}

// The payoff: client code can call Add() through the interface with NO
// downcast, at the cost of that call potentially throwing if item is a leaf.
ITransparentFileSystemItem SearchForFolder(string name) => new TransparentFolder(name);
ITransparentFileSystemItem found = SearchForFolder("Downloads");
found.Add(new TransparentFileItem("report.pdf", 1_024_000)); // no cast needed`,
  },
  {
    label: 'Safety Design — the Downcast the Main Page Never Shows',
    language: 'csharp',
    code: `// Reusing the main page's own IFileSystemItem / Folder / FileItem —
// Add()/Remove() exist ONLY on Folder, not on the shared interface.
IFileSystemItem SearchForFolder(string name)
{
    // ... returns something typed only as IFileSystemItem, e.g. from a
    // recursive search function that doesn't know the caller's intent.
    return new Folder(name);
}

IFileSystemItem found = SearchForFolder("Downloads");

// found.Add(...) does not compile — IFileSystemItem has no Add() member.
// The client MUST downcast, and MUST decide what happens if it guessed wrong:
if (found is Folder folder)
    folder.Add(new FileItem("report.pdf", 1_024_000));
else
    Console.WriteLine($"{found.Name} is a file — cannot add children to it.");
// Same outcome as the Transparency version's exception, but the client
// chooses HOW to fail (a message, a log, a silent skip) instead of an
// exception being forced on them by the interface itself.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'In the Transparency design shown above, calling <code>Add()</code> on a ' +
    '<code>TransparentFileItem</code> throws <code>NotSupportedException</code>. In the Safety design, the ' +
    'equivalent mistake (trying to add to a leaf) is caught differently. Where, precisely, does each design ' +
    'catch the mistake — and which one catches it EARLIER?',
  hint:
    'One design catches the mistake when the code is COMPILED; the other catches it only when that specific ' +
    'line actually RUNS.',
  solution:
    'The Safety design catches the mistake at COMPILE time, in the specific sense that ' +
    'IFileSystemItem.Add() does not exist at all — code that tries found.Add(...) without first downcasting ' +
    'simply fails to compile, forcing the developer to handle the leaf/composite distinction explicitly (the ' +
    'if/else shown above) before the code can even build. The Transparency design catches the SAME mistake ' +
    'only at RUNTIME, and only if that exact code path actually executes with a leaf — Add() compiles ' +
    'successfully on any ITransparentFileSystemItem reference, leaf or composite, and the NotSupportedException ' +
    'only fires the moment a leaf actually receives the call. This is the real trade-off behind "safety": ' +
    'catching the error earlier (compile time) costs the downcast; catching it later (runtime) costs a ' +
    'test-coverage gap where a leaf-targeted Add() call might never get exercised before shipping.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'The Transparency design is simply "worse" than Safety, since it can throw at runtime.',
    reality:
      'Both designs can fail for the same underlying mistake — Transparency at runtime via an exception, ' +
      'Safety at compile time via a missing method (forcing an explicit downcast). Transparency is a genuine, ' +
      'defensible trade-off when the CALLING code is not expected to need to distinguish leaf from composite ' +
      'often, and an occasional exception is an acceptable cost for never needing a cast.',
  },
  {
    thought: 'A no-op Add() on a leaf is a reasonable middle ground between throwing and forcing a downcast.',
    reality:
      'A silent no-op is the worst of both options: it neither fails at compile time (like Safety) nor signals ' +
      'anything went wrong at runtime (like the throwing Transparency version) — the caller\'s Add() call ' +
      'simply appears to succeed while doing nothing, which is far harder to debug than either alternative.',
  },
  {
    thought: 'Once a codebase picks Safety over Transparency, downcasting to add children is a mistake worth ' +
      'eliminating entirely.',
    reality:
      'The downcast IS the mechanism by which Safety achieves its compile-time guarantee — removing it would ' +
      'mean either giving Composite an Add() (reintroducing Transparency) or finding some other way to add ' +
      'children, which for a tree built through a shared interface generally means one of the two designs ' +
      'shown here, not a third option that avoids both trade-offs.',
  },
];

@Component({
  selector: 'app-composite-the-transparency-design-made-concrete',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-transparency-design-made-concrete.html',
  styleUrl: './the-transparency-design-made-concrete.scss',
})
export class TheTransparencyDesignMadeConcreteSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
