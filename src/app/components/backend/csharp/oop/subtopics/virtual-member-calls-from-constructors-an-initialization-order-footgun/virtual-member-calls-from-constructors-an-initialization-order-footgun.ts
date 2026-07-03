import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-virtual-member-calls-from-constructors-an-initialization-order-footgun-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './virtual-member-calls-from-constructors-an-initialization-order-footgun.html',
  styleUrl: './virtual-member-calls-from-constructors-an-initialization-order-footgun.scss',
})
export class VirtualMemberCallsFromConstructorsAnInitializationOrderFootgunSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic\'s constructors never call a virtual member — this is what happens when they do',
      points: [
        'Every constructor example on the main OOP page (<code>Product</code>, <code>Circle</code>, <code>Point</code>) only assigns fields and validates arguments — none of them call a <code>virtual</code> method from within a constructor. This is a genuinely dangerous but LEGAL pattern in C#, and the main topic\'s section on polymorphism ("a variable of type Animal can hold a Dog... the correct overridden method is dispatched at runtime") is EXACTLY what makes it dangerous: that same runtime dispatch happens even during construction, before the derived class\'s own fields have been initialized.',
      ],
    },
    {
      heading: 'The exact construction order that creates the trap',
      points: [
        'When you write <code>new Dog()</code>, the order is: (1) the derived class\'s field initializers have NOT run yet, (2) the BASE class constructor runs FIRST — including any of ITS field initializers and constructor body, (3) THEN the derived class\'s field initializers run, (4) THEN the derived class\'s own constructor body runs.',
        'If the BASE constructor (step 2) calls a <code>virtual</code> method, and that method is OVERRIDDEN in the derived class, C#\'s polymorphism dispatches to the DERIVED override — exactly as the main topic\'s polymorphism section describes — but this happens BEFORE step 3, meaning the derived override runs while the derived class\'s OWN fields are still at their default values (<code>null</code>, <code>0</code>, <code>false</code>), not whatever the derived constructor would have set them to.',
      ],
    },
    {
      heading: 'What this looks like in practice — a null reference from "correctly initialized" code',
      points: [
        'A base class constructor calling <code>Initialize()</code> (a virtual method meant to let derived classes customize setup) seems reasonable — until a derived class\'s override of <code>Initialize()</code> reads one of ITS OWN fields, expecting the derived constructor to have already set it. Because of the ordering above, that field is still <code>null</code> at the moment <code>Initialize()</code> runs, producing a <code>NullReferenceException</code> from code that, read in isolation, looks completely correctly initialized.',
        'This is an especially confusing bug to debug because the STACK TRACE points at the derived override\'s field access — which looks fine on its own — and the ROOT CAUSE (a virtual call from the base constructor) is often in a completely different file, sometimes one the developer debugging the crash has never even opened.',
      ],
    },
    {
      heading: 'The fix — and why "just don\'t do that" isn\'t quite specific enough',
      points: [
        'The reliable fix is structural, not a coding-style reminder: NEVER call a virtual (or abstract) member from a constructor. If a base class genuinely needs derived-class-specific setup logic, use a separate, EXPLICITLY-called initialization method (<code>Initialize()</code> called by the CONSUMER after construction, not automatically by the base constructor) or a factory method/static creation pattern that constructs the object fully before any virtual logic runs.',
        'Analyzer support exists specifically because this bug is easy to introduce accidentally: Roslyn\'s built-in analyzer <code>CA2214</code> ("Do not call overridable methods in constructors") flags exactly this pattern — enabling it (or treating it as an error via <code>.editorconfig</code>) catches the mistake at COMPILE TIME rather than relying on someone noticing a subtle null-reference bug in production.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — reproduced step by step',
      language: 'csharp',
      code: `public class ReportBase
{
    public ReportBase()
    {
        // Seems reasonable: let derived classes customize their own title logic.
        Console.WriteLine($"Title: {GetTitle()}");
    }

    protected virtual string GetTitle() => "Untitled Report";
}

public class SalesReport : ReportBase
{
    // A field the derived class expects to be set before GetTitle() ever runs.
    private readonly string _region = "EMEA";

    public SalesReport() : base()
    {
        // Too late! By the time THIS constructor body runs, GetTitle() has
        // ALREADY been called by the base constructor — and _region was
        // still null (its default) at that moment, not "EMEA".
    }

    protected override string GetTitle() => $"Sales Report — {_region.ToUpper()}";
    //                                                          ^^^^^^^ NullReferenceException
}

var report = new SalesReport();
// Output: throws NullReferenceException from GetTitle() — _region is null
// The stack trace points at GetTitle(), which LOOKS completely correct in isolation.`,
    },
    {
      label: 'Tracing the exact execution order',
      language: 'csharp',
      code: `public class Base
{
    public Base()
    {
        Console.WriteLine("2. Base constructor body — calling virtual method now");
        DoWork(); // virtual call — dispatches to the MOST-DERIVED override
    }

    protected virtual void DoWork() => Console.WriteLine("Base.DoWork");
}

public class Derived : Base
{
    private string _message = "set by field initializer"; // step 3, NOT yet run at step 2

    public Derived() : base()
    {
        Console.WriteLine("4. Derived constructor body");
    }

    protected override void DoWork()
    {
        // This runs as part of step 2 (inside base's constructor), BEFORE
        // step 3 (Derived's field initializers) has executed.
        Console.WriteLine($"3?. Derived.DoWork — _message is: '{_message}'");
    }
}

new Derived();
// Actual output:
// 2. Base constructor body — calling virtual method now
// 3?. Derived.DoWork — _message is: ''      <-- NOT "set by field initializer"!
// 4. Derived constructor body
//
// _message is empty/default at the moment DoWork() runs, because the virtual
// call happens BEFORE Derived's own field initializers — even though DoWork()
// is DERIVED code, dispatched polymorphically exactly as the main topic
// describes, just at a point where Derived's own state isn't ready yet.`,
    },
    {
      label: 'The fix — explicit initialization, not constructor-triggered',
      language: 'csharp',
      code: `public class ReportBase
{
    public ReportBase()
    {
        // No virtual calls here — construction only sets base-level state.
    }

    // Renamed and made NON-virtual-from-constructor: callers invoke this
    // explicitly, AFTER the object (including derived fields) is fully built.
    public string BuildTitle() => GetTitle();

    protected virtual string GetTitle() => "Untitled Report";
}

public class SalesReport : ReportBase
{
    private readonly string _region;

    public SalesReport(string region) : base()
    {
        _region = region; // fully set by the time anyone calls BuildTitle()
    }

    protected override string GetTitle() => $"Sales Report — {_region.ToUpper()}";
}

var report = new SalesReport("EMEA");
Console.WriteLine(report.BuildTitle()); // "Sales Report — EMEA" — safe, no crash
// GetTitle() is still virtual/overridable — it's just no longer INVOKED
// automatically during construction, only when the consumer explicitly asks.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a <code>CA2214</code>-style comment above <code>ReportBase</code>\'s original constructor (the buggy version) explaining exactly why the Roslyn analyzer would flag <code>DoWork()</code>/<code>GetTitle()</code> being called there, and rewrite the constructor to remove the virtual call entirely — moving ALL setup into the explicit <code>BuildTitle()</code>/consumer-invoked pattern.',
    hint: 'The comment should explain: a virtual method called from a constructor can be overridden by a derived class whose own fields are not yet initialized at that point, since base constructors run before derived field initializers. The fix is to remove the call from the constructor and expose an explicitly-invoked method instead (as shown in the third code tab).',
    solution: `public class ReportBase
{
    // CA2214: Do not call overridable methods in constructors.
    // GetTitle() is virtual — if a derived class overrides it and that override
    // reads a derived-class field, the field will still be at its default value
    // here, because base class constructors run BEFORE derived class field
    // initializers and BEFORE the derived constructor body. Calling a virtual
    // member from a constructor risks operating on an incompletely-constructed
    // derived object.
    public ReportBase()
    {
        // No virtual/abstract calls in the constructor — construction only
        // touches THIS class's own state.
    }

    // Consumers call this explicitly, after construction is fully complete.
    public string BuildTitle() => GetTitle();

    protected virtual string GetTitle() => "Untitled Report";
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'calling a virtual method from a base class constructor is safe as long as the derived override doesn\'t throw an obvious error.',
      reality: 'even a "correct-looking" override can silently read a derived field that is still at its default value (null, 0, false) at that point in construction — producing a NullReferenceException or, worse, a silently wrong value with no exception at all, from code that looks completely correctly initialized when read in isolation.',
    },
    {
      thought: 'the fix for this bug is simply "be careful" or "remember not to do this" when writing constructors.',
      reality: 'a structural fix (never call virtual/abstract members from a constructor; use an explicitly-invoked post-construction method instead) combined with enabling Roslyn\'s CA2214 analyzer catches this at COMPILE TIME — relying on developer memory alone is exactly how this bug slips into production in the first place.',
    },
    {
      thought: 'field initializers and constructor bodies in a derived class all run before the base class constructor, since the derived object is what\'s actually being created.',
      reality: 'the order is the OPPOSITE — the base class constructor (including any of its own virtual calls) runs FIRST, then the derived class\'s field initializers, then the derived class\'s own constructor body. This is precisely why a virtual call from the base constructor sees uninitialized derived state.',
    },
  ];
}
