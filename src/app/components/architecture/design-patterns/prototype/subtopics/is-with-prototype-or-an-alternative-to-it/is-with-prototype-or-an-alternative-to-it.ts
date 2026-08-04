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
  templateUrl: './is-with-prototype-or-an-alternative-to-it.html',
  styleUrl: './is-with-prototype-or-an-alternative-to-it.scss'
})
export class IsWithPrototypeOrAnAlternativeToItSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two sections of the same page, seemingly disagreeing',
      points: [
        'Mistake #3, "Using Prototype when construction is cheap," shows a hand-rolled <code>Clone()</code> call as the "wrong" example and a record <code>with</code> expression as the "right" fix — phrased in a way that reads as "use <code>with</code> INSTEAD OF Prototype."',
        'The quiz, on a completely different question, says the opposite framing: "Record <code>with</code> expressions are a language-level shallow-clone-and-modify — the prototype pattern made idiomatic." That explicitly calls <code>with</code> an INSTANCE of Prototype, not an alternative to it.',
        'Both cannot be read literally at face value at the same time — either <code>with</code> is Prototype, or it is something you reach for instead of Prototype. This subtopic resolves which one the page actually means.',
      ]
    },
    {
      heading: 'The resolution: with IS Prototype — mistake #3 is really about avoiding unnecessary infrastructure',
      points: [
        'The quiz\'s framing is the technically precise one: <code>with</code> creates a new object by copying an existing one and selectively overriding fields — that is exactly Prototype\'s own definition, just implemented as a language feature instead of a hand-written method.',
        'Mistake #3\'s actual point, read carefully, is narrower than "avoid Prototype for simple objects" — it is "avoid building CUSTOM Prototype INFRASTRUCTURE (an interface, a hand-written <code>Clone()</code> method, possibly a registry) for simple objects, when the language already gives you clone-and-modify for free via <code>with</code>."',
        'The distinction that actually matters is EXPLICIT, GoF-style Prototype (a class opts in with its own <code>Clone()</code> method, following the classic pattern structure) versus IMPLICIT, built-in Prototype (records get clone-and-modify automatically, no method to write) — not "Prototype vs. not-Prototype." The main page\'s own mistake-block wording has been tightened to make this explicit rather than reading as a flat contradiction.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Explicit Prototype vs. built-in Prototype — same underlying operation',
      language: 'csharp',
      code: `// EXPLICIT, GoF-style Prototype -- a class opts in with its own
// hand-written Clone() method, following the classic pattern structure
public class EmailTemplate
{
    public string Subject { get; set; } = "";
    public List<string> Recipients { get; set; } = new();

    public EmailTemplate DeepClone() => new()
    {
        Subject = Subject,
        Recipients = new List<string>(Recipients)
    };
}

var original = new EmailTemplate { Subject = "Welcome!", Recipients = ["a@b.com"] };
var clone1 = original.DeepClone();
clone1.Subject = "Welcome back!";

// IMPLICIT, BUILT-IN Prototype -- records get clone-and-modify for
// free, no Clone() method to write at all. Structurally, this is the
// SAME operation: copy an existing instance, override specific fields.
public record NotificationConfig(string Channel, int RetryCount);

var baseConfig = new NotificationConfig("email", 3);
var clone2 = baseConfig with { RetryCount = 5 };

// Both clone1 and clone2 are genuinely Prototype in the GoF sense --
// "create new objects by copying an existing prototype instance
// instead of using a constructor." The only real difference is
// whether the class had to write its own Clone() method (EmailTemplate)
// or gets clone-and-modify automatically as a language feature
// (NotificationConfig, because it is a record).

// What mistake #3 ACTUALLY warns against: building explicit Prototype
// INFRASTRUCTURE for something records already give you for free --
public interface ICloneable2<T> { T Clone(); } // <-- unnecessary here
public record OverEngineeredConfig(string Name) : ICloneable2<OverEngineeredConfig>
{
    public OverEngineeredConfig Clone() => this with { }; // pointless --
    // records already support 'with' directly; this interface and
    // method add nothing 'baseConfig with { RetryCount = 5 }' doesn't
    // already do on its own.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "Since mistake #3 says to use with instead of Prototype for simple objects, that must mean with-based cloning isn\'t really the Prototype pattern — it\'s just a language convenience." Is that the correct reading of what mistake #3 is actually warning against?',
    hint: 'Does mistake #3\'s own "right" example use a constructor with no cloning at all, or does it clone-and-override via with — and is that structurally different from what Clone() does?',
    solution: 'No -- that reading conflates two different things. Mistake #3\'s "right" example, `original with { Name = "Updated" }`, is still copying an existing instance and overriding one field -- structurally identical to what a hand-written Clone() method does, just without the boilerplate. What mistake #3 is actually warning against is building UNNECESSARY explicit Prototype infrastructure (a Clone() interface, a hand-rolled method) for a type that already gets equivalent behavior for free from being a record. It is not warning against the underlying OPERATION of cloning-and-modifying at all -- that operation is exactly what with itself performs. The quiz\'s framing ("the prototype pattern made idiomatic") and mistake #3 are describing the same technical reality from two different angles, not disagreeing about whether with is Prototype.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Mistake #3 and the quiz\'s "with expressions are Prototype made idiomatic" explanation directly contradict each other, and only one of them can be correct.',
      reality: 'Per this subtopic\'s theory, they describe the same technical reality from different angles — mistake #3 warns against building unnecessary explicit Prototype infrastructure, while the quiz correctly identifies that with itself is structurally the same clone-and-modify operation Prototype defines.'
    },
    {
      thought: 'Record with expressions are a completely different mechanism from Prototype — a language convenience feature that happens to look superficially similar.',
      reality: 'Per this subtopic\'s theory, with is structurally identical to Prototype\'s own definition (copy an existing instance, override specific fields) — it is Prototype implemented as a built-in language feature rather than a hand-written pattern, not an unrelated convenience.'
    },
    {
      thought: 'Adding a Clone() method or interface to a record is always redundant, since records already support with.',
      reality: 'Per this subtopic\'s theory, this holds for the SIMPLE case shown here — but a record needing custom clone logic beyond a plain field copy (like the EmailTemplate-style deep-clone of a mutable nested collection) could still benefit from an explicit method, the same judgment call mistake #3 already applies to non-record classes.'
    }
  ];
}
