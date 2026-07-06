import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-explicit-interface-implementation-resolving-name-collisions-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './explicit-interface-implementation-resolving-name-collisions.html',
  styleUrl: './explicit-interface-implementation-resolving-name-collisions.scss',
})
export class ExplicitInterfaceImplementationResolvingNameCollisionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A real C# feature the main topic never mentions',
      points: [
        'The main OOP page shows <code>class Service : IRepository&lt;T&gt;, IDisposable</code> — implementing multiple interfaces — but every method implementation shown is IMPLICIT (a normal public method that happens to satisfy the interface). C# also supports EXPLICIT interface implementation: <code>void IDisposable.Dispose()</code> (note: no access modifier, and the interface name is part of the method signature) — a genuinely different mechanism with real, specific use cases the main topic\'s examples never trigger.',
      ],
    },
    {
      heading: 'The problem explicit implementation solves — name collisions across interfaces',
      points: [
        'When a class implements TWO interfaces that both declare a method with the SAME name and signature (e.g. both <code>IPrintable.Print()</code> and <code>ILoggable.Print()</code>), an ordinary IMPLICIT implementation cannot satisfy both with different behavior — one <code>public void Print()</code> method necessarily implements BOTH interfaces identically, which is often not what you want if the two interfaces conceptually mean different things by "Print."',
        'Explicit implementation resolves this: <code>void IPrintable.Print() &#123; ... &#125;</code> and <code>void ILoggable.Print() &#123; ... &#125;</code> can coexist in the SAME class with COMPLETELY DIFFERENT implementations — the compiler disambiguates them by which interface they belong to, not just by name.',
      ],
    },
    {
      heading: 'Accessing an explicit implementation — only through the interface type',
      points: [
        'An explicitly-implemented member is NOT accessible through a variable of the CLASS\'s own type — <code>var doc = new Document(); doc.Print();</code> is a COMPILE ERROR if <code>Print()</code> was implemented explicitly, since explicit implementations are not part of the class\'s own public surface at all. You must access it through the INTERFACE type specifically: <code>IPrintable printable = doc; printable.Print();</code> or an inline cast: <code>((IPrintable)doc).Print();</code>.',
        'This "hidden unless accessed via the interface" property is not just a side effect of resolving name collisions — it is ALSO used deliberately even with NO collision, specifically to keep a class\'s own public API surface clean. <code>IDisposable.Dispose()</code> is the most common real-world example: many BCL types implement it explicitly so that <code>using</code> statements and interface-typed code can call <code>Dispose()</code>, without <code>Dispose()</code> cluttering the type\'s own IntelliSense/public surface for code that just wants to use the class directly.',
      ],
    },
    {
      heading: 'When to reach for it — and the real trade-off',
      points: [
        'Use explicit implementation for TRUE name collisions between unrelated interfaces (rare, but real once a class implements enough interfaces), or DELIBERATELY to keep a rarely-needed interface member (like <code>IDisposable.Dispose()</code> on a type most consumers use directly, not through the interface) out of the class\'s primary public API.',
        'The real cost: explicit members are genuinely LESS DISCOVERABLE — a developer using the class via IntelliSense will never see an explicitly-implemented method unless they specifically know to cast to the interface first. For an interface member that IS the class\'s main public API surface (like <code>IRepository&lt;T&gt;.GetByIdAsync</code> in the main topic\'s example), implicit implementation remains the right default — reach for explicit only for the specific collision/hiding scenarios above, not as a general habit.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Resolving a name collision across two interfaces',
      language: 'csharp',
      code: `public interface IPrintable
{
    void Print(); // means "send to a physical/PDF printer"
}

public interface ILoggable
{
    void Print(); // means "write a diagnostic dump to the log"
}

public class Document : IPrintable, ILoggable
{
    private readonly string _content;
    public Document(string content) => _content = content;

    // Explicit implementations — the interface name disambiguates which
    // "Print" each one satisfies. Both can coexist with DIFFERENT bodies.
    void IPrintable.Print()
    {
        Console.WriteLine($"[PRINTER] Sending to printer: {_content}");
    }

    void ILoggable.Print()
    {
        Console.WriteLine($"[LOG] Document dump: {_content.Length} chars");
    }
}

var doc = new Document("Quarterly report");

// doc.Print(); // COMPILE ERROR — Print() is not part of Document's own public surface

IPrintable printable = doc;
printable.Print(); // [PRINTER] Sending to printer: Quarterly report

ILoggable loggable = doc;
loggable.Print(); // [LOG] Document dump: 17 chars

// Or cast inline without a separate variable:
((IPrintable)doc).Print();`,
    },
    {
      label: 'Deliberate hiding — even with no collision',
      language: 'csharp',
      code: `// A common real BCL pattern: hide Dispose() from the type's own primary
// surface, since most consumers use the resource directly and only need
// Dispose() when working through the IDisposable interface (e.g. inside
// a using statement, or generic disposal code).
public class DatabaseConnection : IDisposable
{
    public void Query(string sql)
    {
        Console.WriteLine($"Running: {sql}");
    }

    // Explicit — NOT part of DatabaseConnection's own visible public API.
    void IDisposable.Dispose()
    {
        Console.WriteLine("Connection closed.");
    }
}

var conn = new DatabaseConnection();
conn.Query("SELECT * FROM Orders"); // fine — Query() is implicit, always visible

// conn.Dispose(); // COMPILE ERROR — Dispose() is hidden from this view

// The 'using' statement works via the IDisposable INTERFACE, not the class's
// own surface — so this still works correctly despite the explicit hiding:
using (var conn2 = new DatabaseConnection())
{
    conn2.Query("SELECT * FROM Users");
} // Dispose() is called automatically here, through IDisposable`,
    },
    {
      label: 'Implicit vs explicit — same interface, two different classes',
      language: 'csharp',
      code: `public interface IShape
{
    double Area();
}

// IMPLICIT — the DEFAULT choice, right here: Area() is the class's main
// public API, so it should be visible directly.
public class Circle(double radius) : IShape
{
    public double Area() => Math.PI * radius * radius;
}

var c = new Circle(5);
Console.WriteLine(c.Area()); // works directly — no cast needed, discoverable

// EXPLICIT — reserved for the collision/hiding scenarios above, NOT the default.
public class LegacyShapeAdapter(double radius) : IShape
{
    // Suppose this class ALSO has its own unrelated 'Area' concept (e.g. a
    // UI screen-region property) that would collide in meaning with IShape's.
    public string Area { get; set; } = "north-wing"; // an unrelated property

    double IShape.Area() => Math.PI * radius * radius; // disambiguated explicitly
}

var adapter = new LegacyShapeAdapter(5);
Console.WriteLine(adapter.Area);              // "north-wing" — the class's own property
Console.WriteLine(((IShape)adapter).Area());  // 78.54 — the interface's method, via cast`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third interface, <code>IExportable</code>, with its own <code>void Print()</code> method meaning "export to a file," and implement it explicitly on <code>Document</code> alongside the existing two — so <code>Document</code> now implements three interfaces that all declare a colliding <code>Print()</code> method, each with distinct behavior.',
    hint: 'Declare public interface IExportable { void Print(); }, add it to Document\'s interface list (class Document : IPrintable, ILoggable, IExportable), and add void IExportable.Print() { ... } with its own distinct console output — following the exact same explicit-implementation pattern as the other two.',
    solution: `public interface IExportable
{
    void Print();
}

public class Document : IPrintable, ILoggable, IExportable
{
    private readonly string _content;
    public Document(string content) => _content = content;

    void IPrintable.Print()  => Console.WriteLine($"[PRINTER] {_content}");
    void ILoggable.Print()   => Console.WriteLine($"[LOG] {_content.Length} chars");
    void IExportable.Print() => Console.WriteLine($"[EXPORT] Saved to file: {_content}");
}

var doc = new Document("Quarterly report");
((IPrintable)doc).Print();  // [PRINTER] Quarterly report
((ILoggable)doc).Print();   // [LOG] 17 chars
((IExportable)doc).Print(); // [EXPORT] Saved to file: Quarterly report`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a class can only implement multiple interfaces that share a method name if the method behaves IDENTICALLY for both, since there is only one public method to satisfy them both.',
      reality: 'explicit interface implementation lets a class provide COMPLETELY DIFFERENT bodies for each interface\'s same-named method — void IPrintable.Print() and void ILoggable.Print() coexist in one class with unrelated behavior, disambiguated by which interface each belongs to.',
    },
    {
      thought: 'an explicitly-implemented interface member can still be called directly off an instance of the class, the same as any other public method.',
      reality: 'explicit implementations are NOT part of the class\'s own public surface at all — calling doc.Print() is a compile error; you must access it through the interface type specifically, e.g. ((IPrintable)doc).Print() or via an interface-typed variable.',
    },
    {
      thought: 'explicit interface implementation is an obscure feature with no real-world use beyond resolving rare name collisions.',
      reality: 'it is used deliberately and commonly even with NO collision — the BCL pattern of implementing IDisposable.Dispose() explicitly (so it doesn\'t clutter a type\'s primary public API, while still working correctly through using statements) is a widespread, intentional application of the same mechanism.',
    },
  ];
}
