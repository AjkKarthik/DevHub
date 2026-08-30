import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './polymorphic-cloning-via-iprototype.html',
  styleUrl: './polymorphic-cloning-via-iprototype.scss'
})
export class PolymorphicCloningViaIPrototypeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A named use case, only ever demonstrated with statically-known types',
      points: [
        'The page\'s own theory names it directly: "Also useful when the exact type of the object to create is not known at compile time." The QnA elaborates: "a factory receives a prototype object and clones it to produce new instances without knowing the concrete type."',
        'But both codeTabs on the page use a SPECIFIC, statically-known type the whole way through — <code>EmailTemplate</code> in the first, <code>NotificationConfig</code> in the second. Calling code always knows exactly which concrete type it is cloning. Neither shows the actual scenario the theory and QnA describe: code that clones something WITHOUT knowing its concrete type at all.',
      ]
    },
    {
      heading: 'What makes cloning genuinely polymorphic, not just reusable',
      points: [
        'The key structural piece missing from both existing codeTabs is a shared INTERFACE with its own <code>Clone()</code> method — something like <code>IPrototype&lt;T&gt;</code> — that every concrete prototype implements, returning ITS OWN concrete type.',
        'Client code that only ever holds an <code>IPrototype</code> reference (never <code>Circle</code>, never <code>Square</code> by name) can call <code>.Clone()</code> on ANY of them identically — the calling code genuinely does not need to know, or care, which concrete type it is working with.',
        'This is the same abstraction discipline this hub\'s own Abstract Factory topic uses for CREATION via factories — Prototype achieves the equivalent decoupling for CLONING, via a shared clone interface instead of a shared factory interface.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A shared Clone contract, used without knowing the concrete type',
      language: 'csharp',
      code: `// The shared contract every prototype implements
public interface IShape
{
    IShape Clone();
    void Render();
}

public class Circle : IShape
{
    public int Radius { get; set; }
    public Circle(int radius) { Radius = radius; }
    public IShape Clone() => new Circle(Radius);
    public void Render() => Console.WriteLine($"Circle r={Radius}");
}

public class Square : IShape
{
    public int Side { get; set; }
    public Square(int side) { Side = side; }
    public IShape Clone() => new Square(Side);
    public void Render() => Console.WriteLine($"Square side={Side}");
}

// Client code -- genuinely does NOT know the concrete type at compile
// time. It receives a LIST of IShape references built from configuration,
// user input, or a deserialized file -- not hardcoded new Circle()/new
// Square() calls anywhere in THIS method.
public class ShapeDuplicator
{
    public List<IShape> DuplicateAll(List<IShape> prototypes, int copiesEach)
    {
        var result = new List<IShape>();
        foreach (var shape in prototypes)
        {
            for (int i = 0; i < copiesEach; i++)
                result.Add(shape.Clone()); // works identically for ANY IShape
        }
        return result;
    }
}

// Usage -- the caller assembles a mixed list; DuplicateAll never
// branches on "if it's a Circle, do X; if it's a Square, do Y"
List<IShape> prototypes = [new Circle(5), new Square(3)];
var duplicator = new ShapeDuplicator();
var copies = duplicator.DuplicateAll(prototypes, 2);
foreach (var shape in copies) shape.Render();
// Circle r=5, Circle r=5, Square side=3, Square side=3`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate adds a new Triangle : IShape class. Does DuplicateAll() need any changes to correctly duplicate a list containing Triangle prototypes alongside Circles and Squares?',
    hint: 'Does DuplicateAll()\'s own code reference Circle, Square, or any other concrete type by name anywhere in its body?',
    solution: 'No changes are needed at all. DuplicateAll() only ever calls shape.Clone() through the IShape interface -- it has no branch, switch, or type check referencing any concrete shape type anywhere in its own body. As long as Triangle correctly implements IShape (including its own Clone() returning a new Triangle with the same dimensions), DuplicateAll() will duplicate Triangle prototypes exactly as correctly as it duplicates Circles and Squares, with zero code changes. This is the concrete payoff of the "concrete type not known at compile time" use case the main page names -- new prototype types can be added without touching any client code that only depends on the shared IShape interface.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since both of the main page\'s codeTabs already demonstrate cloning, they already cover the "concrete type unknown at compile time" use case the theory names.',
      reality: 'Per this subtopic\'s theory, both existing codeTabs use a single, statically-known concrete type throughout — neither shows client code that clones something through a shared interface without knowing which concrete type it actually is.'
    },
    {
      thought: 'A shared Clone() interface like IShape is only useful for the SAME reasons a shared factory interface is useful — they solve the same problem.',
      reality: 'Per this subtopic\'s theory, they solve related but distinct problems — a factory interface decouples CREATING a new object from its concrete type, while a Clone() interface decouples DUPLICATING an existing object from its concrete type.'
    },
    {
      thought: 'Polymorphic cloning through an interface like IShape requires some kind of reflection or runtime type inspection to work correctly.',
      reality: 'Per this subtopic\'s theory, no reflection is involved at all — each concrete type\'s own Clone() method already knows its own type and constructs the correct kind of clone; the interface just lets calling code invoke that method without needing to know which implementation it is calling.'
    }
  ];
}
