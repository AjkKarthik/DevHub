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
  { name: 'Intent',     type: 'keyword',   desc: 'Compose objects into tree structures and treat individual objects and compositions uniformly.' },
  { name: 'Component',  type: 'interface', desc: 'Common interface for both leaf and composite nodes.' },
  { name: 'Leaf',       type: 'class',     desc: 'Terminal node — has no children. Implements Component directly.' },
  { name: 'Composite',  type: 'class',     desc: 'Non-terminal node — contains a collection of child Components and delegates operations to them.' },
  { name: 'Uniformity', type: 'keyword',   desc: 'Clients treat a single leaf and a whole tree the same way — calls the same method on both.' },
  { name: 'Tree Structure', type: 'keyword', desc: 'File systems, UI component trees, org charts, expression trees — all are natural Composites.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Composite Pattern?',
    points: [
      'Composite lets you compose objects into tree structures to represent part-whole hierarchies.',
      'A Component interface is shared by both Leaf (single item) and Composite (container of items).',
      'Clients treat a single file and an entire folder tree identically — both implement the same interface.',
      'The recursive operation (e.g., GetSize()) on a Composite automatically delegates to all children.',
    ],
  },
  {
    heading: 'Structure: Component, Leaf, Composite',
    points: [
      'Component: interface declaring the operation (Execute(), GetPrice(), GetSize()).',
      'Leaf: implements Component; has no children; performs the operation directly.',
      'Composite: implements Component; holds List<Component>; delegates operation to each child.',
      'Client: works entirely through the Component interface — never distinguishes leaf from composite.',
    ],
  },
  {
    heading: 'When to Use Composite',
    points: [
      'When you have a part-whole hierarchy that should be treated uniformly.',
      'File systems: files (leaves) and directories (composites) both have names and sizes.',
      'UI component trees: individual controls and panels both implement render/measure.',
      'Expression trees: literals (leaves) and operators (composites) — all are expressions.',
    ],
  },
  {
    heading: '.NET Examples',
    points: [
      'System.IO: FileInfo and DirectoryInfo share a common base, FileSystemInfo — but that base class has no recursive size/traversal operation of its own, so it is a shared-metadata base class, not a full Composite; getting genuine Composite behavior (like GetSize()) over the real file system means wrapping it yourself.',
      'LINQ expression trees: Expression<T> — leaves are constants, composites are binary/method expressions.',
      'ASP.NET Core middleware pipeline: each middleware processes the request, then passes to the next (chain of composites).',
      'WPF/MAUI: UIElement is the Component; controls are leaves; panels/grids are composites.',
    ],
  },
  {
    heading: 'Uniform Treatment of Leaves and Composites',
    points: [
      'Composite\'s core value is letting client code treat individual objects (leaves) and groups of objects (composites) through the SAME interface — a client calling render() on a single Shape or an entire group of Shapes uses identical code, without needing to check which case it is dealing with.',
      'This uniformity eliminates a whole category of type-checking code ("is this a leaf or a group") that would otherwise be needed at every point client code interacts with the tree structure, significantly simplifying recursive operations over tree-shaped data.',
      'A common design tension is whether child-management methods (add/remove) should live on the shared Component interface (uniform but meaningless for leaves) or only on the Composite subclass (safer but breaks full uniformity) — this tradeoff between safety and uniformity is a recurring decision when implementing Composite.',
      'Composite is the natural fit for genuinely tree-shaped domain data (file systems, UI component hierarchies, organizational structures) — applying it to fundamentally flat or non-hierarchical data adds structural complexity without any corresponding benefit.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'File System',
    language: 'csharp',
    code: `// Component interface
public interface IFileSystemItem
{
    string Name { get; }
    long   GetSize();
    void   Print(int indent = 0);
}

// Leaf — a single file
public class FileItem(string name, long size) : IFileSystemItem
{
    public string Name { get; } = name;
    public long   GetSize() => size;
    public void   Print(int indent = 0) =>
        Console.WriteLine($"{new string(' ', indent)}- {Name} ({size} bytes)");
}

// Composite — a folder containing other items
public class Folder(string name) : IFileSystemItem
{
    public string Name { get; } = name;
    private readonly List<IFileSystemItem> _children = new();

    public void Add(IFileSystemItem item) => _children.Add(item);
    public void Remove(IFileSystemItem item) => _children.Remove(item);

    // Recursively sums children — client doesn't care about depth
    public long GetSize() => _children.Sum(c => c.GetSize());

    public void Print(int indent = 0)
    {
        Console.WriteLine($"{new string(' ', indent)}+ {Name}/");
        foreach (var child in _children)
            child.Print(indent + 2);
    }
}

// Build a tree — client treats leaves and folders identically
var root = new Folder("Documents");
var images = new Folder("Images");
images.Add(new FileItem("photo.jpg", 2_048_000));
images.Add(new FileItem("logo.png",    512_000));
root.Add(images);
root.Add(new FileItem("notes.txt", 4_096));

root.Print();
Console.WriteLine($"Total: {root.GetSize()} bytes");`,
  },
  {
    label: 'Price Tree',
    language: 'csharp',
    code: `// Component
public interface IPriceComponent
{
    string Description { get; }
    decimal GetTotal();
}

// Leaf — a line item
public record LineItem(string Description, decimal Price) : IPriceComponent
{
    public decimal GetTotal() => Price;
}

// Composite — a group (bundle, order, tax)
public class PriceGroup(string description) : IPriceComponent
{
    public string Description { get; } = description;
    private readonly List<IPriceComponent> _items = new();

    public void Add(IPriceComponent item) => _items.Add(item);

    public decimal GetTotal() => _items.Sum(i => i.GetTotal());
}

// Build an order with nested groups
var order = new PriceGroup("Order #100");

var hardware = new PriceGroup("Hardware");
hardware.Add(new LineItem("Keyboard", 79.99m));
hardware.Add(new LineItem("Mouse",    49.99m));

var tax = new PriceGroup("Taxes");
tax.Add(new LineItem("VAT 20%", hardware.GetTotal() * 0.20m));

order.Add(hardware);
order.Add(new LineItem("Shipping", 9.99m));
order.Add(tax);

Console.WriteLine($"Order total: {order.GetTotal():C}");`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Type-checking leaf vs composite in client code',
    wrong: `if (item is Folder f)
    f.Children.Sum(c => c.GetSize());
else
    ((FileItem)item).Size;`,
    right: `item.GetSize(); // same call regardless of type`,
    explanation: 'If client code type-checks leaf vs composite, the pattern has failed. The Component interface must expose all operations needed by clients. Type-checking defeats uniformity — the core goal of Composite.',
  },
  {
    title: 'Exposing child management on the Component interface',
    wrong: `public interface IFileSystemItem {
    void Add(IFileSystemItem item);    // Leaf can't add children!
    void Remove(IFileSystemItem item);
}`,
    right: `// Add/Remove only on Composite class; Component only has shared operations
public interface IFileSystemItem { long GetSize(); void Print(int indent); }`,
    explanation: 'Leaves do not have children. Putting Add/Remove on the Component interface forces leaves to either throw exceptions or provide no-op implementations — both are design smells.',
  },
  {
    title: 'Not making the operation recursive in the Composite',
    wrong: `public long GetSize() => _children.First().GetSize(); // wrong — only first child`,
    right: `public long GetSize() => _children.Sum(c => c.GetSize()); // all children`,
    explanation: 'The Composite\'s operation must delegate to ALL children, not just one. The recursive delegation through the entire tree is the pattern\'s defining behavior.',
  },
  {
    title: 'Using Composite for flat collections',
    wrong: `// A list of products with no nesting — Composite is overkill
var composite = new ProductGroup();
products.ForEach(composite.Add);`,
    right: `// Use List<IProduct> directly for flat collections
List<IProduct> products = GetProducts();`,
    explanation: 'Composite is only justified for genuinely hierarchical (tree) structures. Wrapping a flat list in a composite adds complexity with no benefit.',
  },
];

const challenge: Challenge = {
  title: 'Menu Tree',
  language: 'typescript',
  description: `Build a restaurant menu using Composite pattern.
IMenuItem has name and getPrice().
Dish is a leaf with a fixed price.
MenuSection is a composite holding multiple menu items.
The total price of a section is the sum of all its items.`,
  hints: [
    'IMenuItem is the Component interface',
    'Dish implements IMenuItem directly (leaf)',
    'MenuSection holds IMenuItem[] and sums them',
  ],
  starterCode: `interface IMenuItem {
  name: string;
  getPrice(): number;
}

// TODO: implement Dish (leaf) and MenuSection (composite)`,
  solution: `interface IMenuItem {
  name: string;
  getPrice(): number;
}

class Dish implements IMenuItem {
  constructor(public name: string, private price: number) {}
  getPrice(): number { return this.price; }
}

class MenuSection implements IMenuItem {
  private items: IMenuItem[] = [];
  constructor(public name: string) {}
  add(item: IMenuItem): this { this.items.push(item); return this; }
  getPrice(): number { return this.items.reduce((s, i) => s + i.getPrice(), 0); }
  print(indent = 0): void {
    console.log(\`\${'  '.repeat(indent)}\${this.name}: \$\{this.getPrice().toFixed(2)}\`);
    this.items.forEach(i => {
      if (i instanceof MenuSection) i.print(indent + 1);
      else console.log(\`\${'  '.repeat(indent + 1)}- \${i.name}: \$\{i.getPrice().toFixed(2)}\`);
    });
  }
}

const starters = new MenuSection('Starters')
  .add(new Dish('Soup', 4.99))
  .add(new Dish('Salad', 6.99));

const mains = new MenuSection('Mains')
  .add(new Dish('Pasta', 12.99))
  .add(new Dish('Steak', 24.99));

const fullMenu = new MenuSection('Full Menu').add(starters).add(mains);
fullMenu.print();
console.log(\`Total: \$\{fullMenu.getPrice().toFixed(2)}\`);`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the key goal of the Composite pattern?',
    options: [
      'Preventing multiple instances from being created',
      'Treating individual objects and compositions of objects uniformly',
      'Adding responsibilities to an object dynamically',
      'Decoupling abstraction from implementation',
    ],
    answer: 1,
    explanation: 'Composite\'s defining goal is uniformity — clients call the same interface on a single leaf (file) and a whole tree (folder) without knowing which one they have. The tree structure is transparent.',
  },
  {
    q: 'Where should Add() and Remove() (child management) methods be placed?',
    options: [
      'On the Component interface so all nodes can be managed uniformly',
      'On the Leaf class only',
      'On the Composite class only — leaves cannot have children',
      'On a separate ChildManager service class',
    ],
    answer: 2,
    explanation: 'Add/Remove belong on Composite only. Putting them on the Component interface forces Leaf to either throw (violation) or no-op (meaningless). The trade-off is that clients must downcast to add children — accepted in classic GoF.',
  },
  {
    q: 'LINQ Expression Trees in .NET represent constants (leaves) and operators (composites). Which pattern does this exemplify?',
    options: ['Chain of Responsibility', 'Visitor', 'Composite', 'Interpreter'],
    answer: 2,
    explanation: 'Expression trees are a textbook Composite — leaves are constant/parameter expressions, composites are binary, unary, and method-call expressions. All implement Expression, allowing uniform traversal.',
  },
  { q: 'What is the Composite pattern and what does it allow?', options: ['A pattern combining two objects into one to reduce class count', 'A structural pattern that composes objects into tree structures to represent part-whole hierarchies, allowing clients to treat individual objects and compositions uniformly', 'A pattern for composing multiple interfaces into one', 'A pattern for merging two class hierarchies using multiple inheritance'], answer: 1, explanation: 'Composite lets you build tree structures where both leaves (individual objects) and branches (containers of other objects) implement the same interface. A client using the interface cannot distinguish a leaf from a composite: the same call to draw() works on a single shape or a group of shapes. Common examples: file system (files and directories), GUI component trees (Button and Panel both implement draw()), organizational charts, DOM tree (both elements and text nodes), abstract syntax trees in compilers.' },
  { q: 'What is the Component interface in the Composite pattern?', options: ['The interface that only leaf objects implement', 'The shared interface implemented by both Leaf and Composite classes, defining operations that apply uniformly to both individual objects and compositions', 'The root object at the top of the tree', 'An interface from an external component library'], answer: 1, explanation: 'The Component interface declares operations that all objects in the tree (leaves and composites) share: draw(), render(), getPrice(), etc. Both Leaf and Composite implement this interface. Leaf implements the operation directly. Composite stores child components and delegates to them: a composite getPrice() sums children prices. Optionally, the Component interface can also declare add(), remove(), and getChild() for tree management, but this may violate the Interface Segregation Principle since leaves cannot add children.' },
  { q: 'When should you use Composite instead of maintaining a list manually?', options: ['Never; manual lists are always simpler and more explicit', 'When you have a recursive tree structure and need to treat individual items and containers of items uniformly through a common interface, without knowing whether you are dealing with a leaf or a group', 'Only when the tree has more than three levels of nesting', 'When you need thread-safe tree operations'], answer: 1, explanation: 'Use Composite when: you have a recursive tree of objects. Clients must treat leaves and containers the same way. You want to add new component types to the tree without modifying existing client code. The alternative is checking with instanceof everywhere: if (item instanceof Group) processGroup(item) else processLeaf(item). Composite eliminates these checks by polymorphism through the Component interface. Well-suited for: menu systems, GUI hierarchies, file systems, organizational units, product categories.' },
];

const qna: QnaItem[] = [
  {
    q: 'Can Composite and Visitor be used together?',
    a: 'Yes — this is a very common combination. Composite defines the tree structure; Visitor traverses it and performs operations without modifying the node classes. Together they allow adding new operations (visitors) to the tree without changing the node hierarchy.',
  },
  {
    q: 'How do you handle ordering of children in a Composite?',
    a: 'Use an ordered collection (List<T>) if order matters (file system, UI layout). For unordered groups (permissions, tags), use HashSet<T>. The Composite pattern does not dictate collection type — choose based on the domain.',
  },
  { q: 'How do you traverse a composite tree?', a: 'Tree traversal uses recursive delegation. The component interface has a method (render(), calculate(), accept() for visitors). The leaf implements it directly. The composite iterates its children collection and calls the same method on each child. Each composite child may itself be a composite, continuing the recursion until all leaves are reached. Variations: preorder (process self before children), postorder (process children before self), BFS (iterate level by level with a queue). The client calls the method on the root node and the tree traversal completes recursively. Visitor pattern can be combined with Composite for operations that need to vary independently of the tree structure.' },
  { q: 'How does Composite interact with Iterator pattern?', a: 'Iterator and Composite are natural partners. A composite tree can expose an iterator that traverses its elements in a defined order without exposing the tree structure. The iterator hides whether the iteration goes depth-first or breadth-first. In Java, implementing Iterable on the composite node allows for-each loops. In C#, implementing IEnumerable yields the tree elements in traversal order. A recursive iterator uses a stack internally to traverse the tree. This combination is used in file system walkers, GUI frameworks (iterating all controls in a form), and XML/JSON parsers walking element trees.' },
  { q: 'What are the trade-offs of putting child management methods in the Component interface?', a: 'Including add(), remove(), getChild() in the Component interface (Transparency design): pros: clients treat all components uniformly including tree manipulation. Cons: Leaf classes must implement these methods even though they cannot have children, typically by throwing UnsupportedOperationException or returning empty results — this violates the Liskov Substitution Principle. Alternative (Safety design): put child management only in the Composite class. Pros: type safety — clients cannot call add() on a leaf without a cast. Cons: client must know whether it is dealing with a Leaf or Composite to manage children. Choose transparency when uniform treatment is paramount; choose safety when type errors should be caught at compile time.' },
  { q: 'How does the Composite pattern apply in GUI frameworks?', a: 'GUI frameworks are a canonical Composite example. Component interface: UIComponent with render(), setVisible(), getSize(). Leaf: Button, Label, TextField that render themselves. Composite: Panel, Window, Form that contain child UIComponents and delegate render() to all children. Adding a new widget type requires no changes to existing code: just implement UIComponent. Frameworks like Java AWT/Swing (Container extends Component), WPF (UIElement/FrameworkElement/Panel hierarchy), and HTML DOM (Element nodes contain other Elements) all implement Composite. Event propagation also follows the Composite structure in many frameworks.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Composite composes objects into trees and lets clients treat single items and entire trees uniformly via a shared Component interface.',
  mustKnow: [
    'Component: shared interface; Leaf: no children; Composite: holds children and delegates',
    'Composite.GetX() must delegate to ALL children recursively',
    'Child management (Add/Remove) lives on Composite, not Component',
    'Client code must never type-check leaf vs composite — that breaks uniformity',
    '.NET examples: FileSystemInfo, Expression trees, UIElement/Panel hierarchies',
  ],
  interviewFocus: [
    'When should Add/Remove be on Component vs Composite only?',
    'How does Composite differ from a simple List<T>?',
    'How do Composite and Visitor work together?',
  ],
};

@Component({
  selector: 'app-dp-composite',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './composite.html',
  styleUrl: './composite.scss',
})
export class DpComposite {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
