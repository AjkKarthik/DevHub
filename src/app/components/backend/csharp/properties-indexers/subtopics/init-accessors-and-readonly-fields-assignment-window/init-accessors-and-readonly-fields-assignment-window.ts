import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-init-accessors-and-readonly-fields-assignment-window-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './init-accessors-and-readonly-fields-assignment-window.html',
  styleUrl: './init-accessors-and-readonly-fields-assignment-window.scss',
})
export class InitAccessorsAndReadonlyFieldsAssignmentWindowSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions this in one line — never demonstrates it',
      points: [
        'The main Properties & Indexers page states: "Inside an init accessor, you can also assign to readonly fields of the same class — the compiler relaxes the readonly restriction during initialization to support this pattern." This is mentioned once, without a code example, and never explains WHY this works or what its actual boundaries are.',
      ],
    },
    {
      heading: 'Why this relaxation exists — init accessors ARE part of the construction phase',
      points: [
        'A <code>readonly</code> field can normally only be assigned inside the DECLARING class\'s own constructors (per the main C# language rule) — not in ordinary methods. An <code>init</code> accessor is special: even though it is syntactically written as a property accessor (not literally inside a constructor body), the CLR and compiler treat it as PART OF the object\'s construction phase, exactly like a constructor — this is the same underlying mechanism (the <code>modreq(IsExternalInit)</code> marker the main page mentions) that restricts <code>init</code> to only being callable during initialization.',
        'Because <code>init</code> accessors are recognized as construction-phase code, the compiler extends the SAME readonly-field-assignment privilege that ordinary constructors have to <code>init</code> accessors specifically — this is a deliberate, coherent design choice, not an accidental loophole.',
      ],
    },
    {
      heading: 'This lets init properties and readonly fields work together for derived/computed immutable state',
      points: [
        'A practical use: an <code>init</code> property setter can perform validation or transformation and store the RESULT into a separate <code>readonly</code> field — rather than the property\'s own compiler-generated backing field holding the raw input directly. This lets you keep the raw <code>init</code> value AND a derived, readonly, pre-computed value both genuinely fixed after construction, without needing a full constructor.',
        'This pattern is especially useful on <code>record</code> types or DTOs where you want <code>init</code>-based ergonomics (clean object-initializer syntax, <code>with</code> expression support) but ALSO want a normalized/derived value computed once, stored in its own readonly field, rather than recomputed via an expression-bodied property on every read.',
      ],
    },
    {
      heading: 'The boundary — only the SAME class\'s own readonly fields, and only from an init accessor',
      points: [
        'This relaxation applies ONLY to <code>readonly</code> fields declared in the SAME class as the <code>init</code> accessor — you cannot use an <code>init</code> accessor to assign a BASE class\'s readonly field directly (the base class\'s own constructor is responsible for its own readonly fields, exactly as normal C# inheritance rules require).',
        'Ordinary property SETTERS (<code>set</code>, not <code>init</code>) do NOT get this relaxation — a normal <code>set</code> accessor trying to assign a <code>readonly</code> field of the class still produces the standard compile error, because a regular setter can be called at ANY time after construction, not just during the initialization phase, so allowing it to mutate a readonly field would break the whole point of <code>readonly</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The pattern — init property computes into its own readonly field',
      language: 'csharp',
      code: `public class NormalizedEmail
{
    // A readonly field, separate from any auto-property backing field —
    // holds a DERIVED value, computed once during initialization:
    private readonly string _normalized;

    public string RawInput { get; init; } = "";

    // The init accessor performs a transformation and stores the RESULT
    // into the readonly field — this is legal ONLY because "init"
    // accessors are treated as part of the construction phase:
    public string Value
    {
        get => _normalized;
        init => _normalized = value.Trim().ToLowerInvariant();
    }
}

var email = new NormalizedEmail
{
    RawInput = "  Alice@Example.COM  ",
    Value    = "  Alice@Example.COM  ",
};

Console.WriteLine(email.Value);    // "alice@example.com" — normalized once,
                                    // stored in the readonly field
// email.Value = "other@x.com";    // compile error — init is write-once`,
    },
    {
      label: 'What does NOT compile — a regular set accessor cannot do this',
      language: 'csharp',
      code: `public class BrokenExample
{
    private readonly string _normalized = "";

    public string Value
    {
        get => _normalized;
        set => _normalized = value.Trim().ToLowerInvariant();
        // COMPILE ERROR: CS0191 — a readonly field cannot be assigned to
        // (except in a constructor or init accessor of the type in which
        // the field is defined)
        //
        // WHY: a regular "set" accessor can be called at ANY POINT after
        // construction, not just during initialization — allowing it to
        // mutate a readonly field would let ANY later code silently
        // change a value that is supposed to be permanently fixed,
        // completely defeating the purpose of "readonly".
    }
}

// The fix — either use "init" instead of "set" (if write-once is
// actually the intent), or make the field an ordinary (non-readonly)
// private field (if genuine post-construction mutation is intended):
public class FixedWithInit
{
    private readonly string _normalized = "";
    public string Value
    {
        get => _normalized;
        init => _normalized = value.Trim().ToLowerInvariant(); // legal
    }
}`,
    },
    {
      label: 'The boundary — cannot reach into a BASE class\'s readonly field',
      language: 'csharp',
      code: `public abstract class Shape
{
    // Base class's OWN readonly field — only Shape's OWN constructors
    // may assign it, regardless of what derived classes do:
    protected readonly string _category;

    protected Shape(string category) => _category = category;
}

public class Circle : Shape
{
    public Circle() : base("2D") { }

    public double Radius { get; init; }

    // This would NOT compile if attempted:
    // public string CategoryOverride
    // {
    //     init => _category = value; // COMPILE ERROR — _category belongs
    //                                  // to Shape, not Circle; Circle's
    //                                  // init accessor cannot assign a
    //                                  // BASE class's readonly field,
    //                                  // even though Circle IS in its
    //                                  // own construction phase.
    // }

    // The correct way to influence a base readonly field is through the
    // base constructor call, exactly like ordinary inheritance rules:
    public Circle(string category, double radius) : base(category)
    {
        Radius = radius;
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given the NormalizedEmail example, would replacing <code>private readonly string _normalized;</code> with a <code>private readonly string _normalized = "default";</code> (an inline initializer) change whether the init accessor can still assign to it? Reason through what "readonly" actually restricts.',
    hint: 'A readonly field can be assigned MULTIPLE times as long as every assignment happens during the construction phase (field initializer AND/OR constructor body AND/OR, as established here, an init accessor) — readonly restricts assignment to OUTSIDE the construction phase, not to a single assignment total. Think about whether an inline field initializer counts as "during construction."',
    solution: `// Yes, this still compiles fine — a readonly field can be assigned
// MULTIPLE times as long as every assignment happens somewhere within
// the construction phase (inline field initializer, constructor body,
// or — as this subtopic covers — an init accessor). The restriction is
// about WHEN assignment is allowed, not HOW MANY TIMES.

public class NormalizedEmail
{
    // Inline initializer — this itself IS a construction-phase
    // assignment, and does not conflict with the init accessor also
    // assigning it later in the SAME construction phase:
    private readonly string _normalized = "default";

    public string Value
    {
        get => _normalized;
        init => _normalized = value.Trim().ToLowerInvariant();
        // This STILL compiles — the field is assigned twice total
        // (once by the inline initializer, once by the init accessor),
        // but BOTH assignments happen during construction, which is
        // exactly what "readonly" permits.
    }
}

var email = new NormalizedEmail { Value = "  Test@Example.com  " };
Console.WriteLine(email.Value); // "test@example.com" — the init
// accessor's assignment is the one that "wins" since it runs after the
// inline initializer, during the same overall construction phase.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'any property accessor (get, set, or init) can assign to a readonly field of the same class, since they are all "part of the class."',
      reality: 'only init accessors (and constructors, and inline field initializers) get this privilege — a regular set accessor assigning a readonly field is a compile error, because set can be called at any point after construction, which would defeat the whole purpose of readonly.',
    },
    {
      thought: 'an init accessor in a derived class can assign to a readonly field declared in its base class, since the derived class is technically still "under construction" at that point.',
      reality: 'the readonly-field-assignment privilege only extends to fields declared in the SAME class as the init accessor — a base class\'s readonly fields remain the exclusive responsibility of the base class\'s own constructors, following ordinary C# inheritance rules.',
    },
    {
      thought: 'a readonly field can only be assigned once, total, anywhere in the class.',
      reality: 'a readonly field can be assigned multiple times as long as every assignment occurs during the construction phase — an inline field initializer, a constructor body, and an init accessor can all legally assign the same readonly field, since all three happen before the object becomes externally observable.',
    },
  ];
}
