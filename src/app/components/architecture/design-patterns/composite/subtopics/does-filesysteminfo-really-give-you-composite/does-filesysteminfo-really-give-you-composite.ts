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
    heading: 'A Shared Base Class Is Not Automatically Composite',
    points: [
      'The main page\'s ".NET Examples" originally cited <code>FileInfo</code>/<code>DirectoryInfo</code> ' +
      'sharing <code>FileSystemInfo</code> as a Composite example — but <code>FileSystemInfo</code> declares ' +
      'no operation like the main page\'s own <code>GetSize()</code>, and <code>DirectoryInfo</code> has no ' +
      'built-in method that recursively sums the sizes of everything beneath it.',
      '<code>FileSystemInfo</code> exists to share COMMON METADATA (Name, Exists, Attributes, ' +
      'LastWriteTime) across files and directories — that is ordinary inheritance for code reuse, not ' +
      'Composite\'s defining trait: a shared operation that a container recursively delegates to its children.',
      '<code>DirectoryInfo.GetFiles()</code>/<code>GetDirectories()</code> return flat arrays the CALLER has ' +
      'to manually recurse over — there is no polymorphic call a client can make on either a ' +
      '<code>FileInfo</code> or a <code>DirectoryInfo</code> that "just works" the way the main page\'s own ' +
      '<code>IFileSystemItem.GetSize()</code> does.',
    ],
  },
  {
    heading: 'Getting Real Composite Behavior Over the Real File System',
    points: [
      'To get the main page\'s own uniform-treatment guarantee over the actual file system, you have to build ' +
      'the Composite yourself — wrap <code>FileInfo</code> and <code>DirectoryInfo</code> behind the SAME ' +
      '<code>IFileSystemItem</code> interface the main page already defines, and implement the recursive ' +
      'delegation by hand.',
      'This is a genuinely different, additional layer of work from simply "using FileSystemInfo" — it is ' +
      'closer to writing an Adapter for each of <code>FileInfo</code> and <code>DirectoryInfo</code> that ' +
      'THEN participates in a hand-written Composite, not something the BCL hands you for free.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Wrapping the Real File System',
    language: 'csharp',
    code: `// Reuses the main page's own IFileSystemItem — the real BCL types
// (FileInfo, DirectoryInfo) get wrapped to participate in it.
public class RealFileLeaf(FileInfo file) : IFileSystemItem
{
    public string Name => file.Name;
    public long   GetSize() => file.Length;
    public void   Print(int indent = 0) =>
        Console.WriteLine($"{new string(' ', indent)}- {Name} ({file.Length} bytes)");
}

public class RealFolderComposite(DirectoryInfo dir) : IFileSystemItem
{
    public string Name => dir.Name;

    // The recursion the BCL never gives you — built by hand, once, here.
    public long GetSize() =>
        dir.EnumerateFiles().Sum(f => f.Length) +
        dir.EnumerateDirectories().Sum(d => new RealFolderComposite(d).GetSize());

    public void Print(int indent = 0)
    {
        Console.WriteLine($"{new string(' ', indent)}+ {Name}/");
        foreach (var file in dir.EnumerateFiles())
            new RealFileLeaf(file).Print(indent + 2);
        foreach (var subDir in dir.EnumerateDirectories())
            new RealFolderComposite(subDir).Print(indent + 2);
    }
}

// From here on, client code is IDENTICAL to the main page's own example —
// FileInfo/DirectoryInfo's own lack of a recursive operation is invisible.
IFileSystemItem root = new RealFolderComposite(new DirectoryInfo(@"C:\\Projects\\DevHub\\src"));
root.Print();
Console.WriteLine($"Total: {root.GetSize()} bytes");`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate says "we don\'t need our own IFileSystemItem wrapper — DirectoryInfo already gives us ' +
    'everything Composite needs, since it inherits FileSystemInfo just like FileInfo does." What is the flaw ' +
    'in that reasoning?',
  hint:
    'Ask specifically: what METHOD, inherited from FileSystemInfo, would you call on a plain DirectoryInfo to ' +
    'get its total recursive size?',
  solution:
    'There is no such method — inheriting a common base class only means FileInfo and DirectoryInfo share the ' +
    'SAME METADATA members (Name, Exists, Attributes). Composite specifically requires a shared OPERATION ' +
    '(like GetSize()) that a container recursively delegates to its children, and DirectoryInfo has nothing ' +
    'like that: GetFiles()/GetDirectories() return flat arrays you must recurse over yourself, on every single ' +
    'call site that needs a total. Sharing a base class for metadata reuse and sharing a polymorphic recursive ' +
    'operation are two different things — only the second one is what makes Composite actually work.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'If two classes share a common base class, that automatically makes them a Composite pair.',
    reality:
      'Shared inheritance is necessary but not sufficient. Composite specifically requires the shared type to ' +
      'declare an operation that a container implementation recursively delegates to its children — a base ' +
      'class that only shares metadata properties (like FileSystemInfo\'s Name/Attributes) is just ordinary ' +
      'code-reuse inheritance, unrelated to the Composite pattern.',
  },
  {
    thought: 'Since File System hierarchies are the textbook Composite EXAMPLE, .NET\'s own file system ' +
      'classes must already implement Composite.',
    reality:
      '"File systems are a natural fit for the Composite CONCEPT" and "System.IO\'s actual classes implement ' +
      'Composite" are two different claims. The domain (files nested in folders) is Composite-shaped; the ' +
      'specific BCL types happen not to expose that shape through a shared recursive operation, so using them ' +
      'Composite-style still requires writing your own wrapper.',
  },
];

@Component({
  selector: 'app-composite-does-filesysteminfo-really-give-you-composite',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './does-filesysteminfo-really-give-you-composite.html',
  styleUrl: './does-filesysteminfo-really-give-you-composite.scss',
})
export class DoesFilesysteminfoReallyGiveYouCompositeSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
