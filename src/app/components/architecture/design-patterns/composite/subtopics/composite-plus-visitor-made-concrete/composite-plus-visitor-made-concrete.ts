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
    heading: 'A Combination Described in One Sentence, Never in Code',
    points: [
      'The main page\'s QnA states: "Composite defines the tree structure; Visitor traverses it and performs ' +
      'operations without modifying the node classes... allows adding new operations (visitors) to the tree ' +
      'without changing the node hierarchy" — but every operation the main page\'s own codeTabs demonstrate ' +
      '(<code>GetSize()</code>, <code>Print()</code>, <code>GetTotal()</code>) is baked directly into ' +
      '<code>FileItem</code>/<code>Folder</code> as ordinary interface methods.',
      'Adding a genuinely NEW operation to the main page\'s own file-system tree — say, counting how many ' +
      'files exceed some size threshold — means editing <code>IFileSystemItem</code> and every implementing ' +
      'class, exactly the kind of change the QnA claims Visitor avoids.',
    ],
  },
  {
    heading: 'What Visitor Actually Adds on Top of Composite',
    points: [
      'Each node exposes one single, permanent <code>Accept(IFileSystemVisitor visitor)</code> method that ' +
      'never has to change again — new behavior arrives as a NEW visitor class, not a new method on the node ' +
      'hierarchy.',
      'The visitor interface declares one method per CONCRETE node type ' +
      '(<code>VisitFile(FileItem)</code>, <code>VisitFolder(Folder)</code>) — this is what lets a ' +
      '<code>Folder</code>\'s <code>Accept()</code> call back into the visitor differently than a ' +
      '<code>FileItem</code>\'s does, without either node needing to know what the visitor actually computes.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Adding Accept() — the One-Time Node Change',
    language: 'csharp',
    code: `// The main page's own IFileSystemItem gains exactly ONE new member,
// added ONCE, that never needs to change again for future operations.
public interface IFileSystemItem
{
    string Name { get; }
    long   GetSize();
    void   Print(int indent = 0);
    void   Accept(IFileSystemVisitor visitor);
}

public class FileItem(string name, long size) : IFileSystemItem
{
    public string Name { get; } = name;
    public long   GetSize() => size;
    public void   Print(int indent = 0) =>
        Console.WriteLine($"{new string(' ', indent)}- {Name} ({size} bytes)");
    public void   Accept(IFileSystemVisitor visitor) => visitor.VisitFile(this);
}

public class Folder(string name) : IFileSystemItem
{
    public string Name { get; } = name;
    private readonly List<IFileSystemItem> _children = new();
    public void Add(IFileSystemItem item) => _children.Add(item);

    public long GetSize() => _children.Sum(c => c.GetSize());
    public void Print(int indent = 0)
    {
        Console.WriteLine($"{new string(' ', indent)}+ {Name}/");
        foreach (var child in _children) child.Print(indent + 2);
    }

    // A composite's Accept() visits itself, then delegates to every child —
    // this is the ONLY place recursion needs to be written for ANY visitor.
    public void Accept(IFileSystemVisitor visitor)
    {
        visitor.VisitFolder(this);
        foreach (var child in _children) child.Accept(visitor);
    }
}`,
  },
  {
    label: 'New Operations Arrive as New Visitors',
    language: 'csharp',
    code: `public interface IFileSystemVisitor
{
    void VisitFile(FileItem file);
    void VisitFolder(Folder folder);
}

// Operation 1: count files over a size threshold — NO changes to
// IFileSystemItem, FileItem, or Folder needed to add this.
public class LargeFileCounterVisitor(long thresholdBytes) : IFileSystemVisitor
{
    public int Count { get; private set; }
    public void VisitFile(FileItem file)
    {
        if (file.GetSize() > thresholdBytes) Count++;
    }
    public void VisitFolder(Folder folder) { /* nothing to do for folders */ }
}

// Operation 2: build a flat list of every file's full path — again, zero
// changes anywhere in the tree's own classes.
public class FlattenPathsVisitor : IFileSystemVisitor
{
    private readonly List<string> _paths = new();
    private readonly Stack<string> _pathStack = new();
    public IReadOnlyList<string> Paths => _paths;

    public void VisitFile(FileItem file) =>
        _paths.Add(string.Join("/", _pathStack.Reverse().Append(file.Name)));
    public void VisitFolder(Folder folder) => _pathStack.Push(folder.Name);
}

// Usage — the SAME tree, two independent operations, neither touching
// FileItem or Folder's own source code.
var counter = new LargeFileCounterVisitor(thresholdBytes: 1_000_000);
root.Accept(counter);
Console.WriteLine($"Large files: {counter.Count}");`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A new requirement arrives: compute the total size of only the <code>.jpg</code> files in the tree. Using ' +
    'the Visitor design shown above, does implementing this require ANY change to ' +
    '<code>IFileSystemItem</code>, <code>FileItem</code>, or <code>Folder</code>? Sketch what you would ' +
    'actually write.',
  hint:
    'Compare this to how you would add the SAME feature to the main page\'s own original codeTab, which bakes ' +
    'GetSize() directly into the node classes.',
  solution:
    'No changes to IFileSystemItem, FileItem, or Folder are needed at all — you write one new class, a ' +
    'JpgSizeVisitor implementing IFileSystemVisitor, whose VisitFile(FileItem file) checks whether ' +
    'file.Name ends with ".jpg" and, if so, adds file.GetSize() to a running total; VisitFolder(Folder folder) ' +
    'does nothing, since Folder.Accept() already handles walking into every child on its own. Call ' +
    'root.Accept(new JpgSizeVisitor()) and read the total off the visitor afterward. Contrast this with the ' +
    'main page\'s own original design: adding "total size of .jpg files" there would mean either bolting a ' +
    'new, narrowly-specific method onto IFileSystemItem (polluting the interface for one niche use case) or ' +
    'writing a free function that manually recurses through Folder\'s own children — reimplementing the ' +
    'traversal logic Accept() already centralizes once, here, for every future operation.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Adding Accept() to every node is itself a violation of "new operations need no node changes" — ' +
      'you still had to touch every class.',
    reality:
      'Accept() is added exactly ONCE, as infrastructure, before any specific operations exist — after that ' +
      'one-time cost, every FUTURE operation (LargeFileCounterVisitor, FlattenPathsVisitor, JpgSizeVisitor, ' +
      'and anything added later) needs zero further changes to FileItem or Folder. The claim is about the ' +
      'MARGINAL cost of each new operation, not a claim that the node classes are permanently frozen from the ' +
      'very first line of code.',
  },
  {
    thought: 'A Visitor and a plain method baked into the node classes accomplish exactly the same thing, so ' +
      'Visitor is just extra ceremony.',
    reality:
      'They trade off in OPPOSITE directions: baking operations into the node classes makes adding a new NODE ' +
      'TYPE easy (implement the interface once) but adding a new OPERATION expensive (touch every node class). ' +
      'Visitor makes adding a new OPERATION easy (write one new visitor class) but adding a new NODE TYPE ' +
      'expensive (every existing visitor needs a new VisitX method). Which one is "extra ceremony" depends on ' +
      'which axis — node types or operations — actually grows more often in your specific system.',
  },
];

@Component({
  selector: 'app-composite-composite-plus-visitor-made-concrete',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './composite-plus-visitor-made-concrete.html',
  styleUrl: './composite-plus-visitor-made-concrete.scss',
})
export class CompositePlusVisitorMadeConcreteSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
