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
    heading: 'Two Places on the Main Page Use Invalid C#',
    points: [
      'The main page\'s own "Report Generator" codeTab declared the template method itself as ' +
      '<code>public sealed void GenerateReport(ReportRequest request)</code>. Mistake #1\'s own "right" ' +
      'example repeated the exact same shape: <code>public sealed void GenerateReport(ReportRequest r)</code>. ' +
      'Neither compiles.',
      'C# only allows the <code>sealed</code> modifier on a method that is ALSO marked <code>override</code> — ' +
      'its entire purpose is to stop a FURTHER derived class from re-overriding a method that is already ' +
      'overriding something. <code>GenerateReport</code> is declared directly on <code>ReportGenerator</code> ' +
      '(the base class itself) — it is not overriding anything, so <code>sealed</code> on its own triggers ' +
      'CS0238: "\'ReportGenerator.GenerateReport(ReportRequest)\' cannot be sealed because it is not an ' +
      'override."',
    ],
  },
  {
    heading: 'What Actually Makes a Method Un-Overridable in C#',
    points: [
      'A plain method with no modifier at all — <code>public void GenerateReport(ReportRequest request)</code> ' +
      '— is ALREADY non-virtual by default in C#, and a non-virtual method cannot be overridden by any ' +
      'subclass. The <code>sealed</code> keyword was never actually needed here at all; the mistake was ' +
      'reaching for a keyword that only makes sense one level further down an inheritance chain.',
      '<code>sealed</code> becomes meaningful specifically when an INTERMEDIATE class overrides a virtual/' +
      'abstract member from ITS OWN base class and wants to stop that override chain from continuing any ' +
      'further — e.g. <code>SalesReportGenerator</code> could mark its own override of a (hypothetical) ' +
      'virtual base method as <code>sealed override</code> if it wanted to prevent a further subclass of ' +
      '<code>SalesReportGenerator</code> from overriding that specific member again.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Invalid vs Valid',
    language: 'csharp',
    code: `// INVALID — does not compile. sealed with no override.
public abstract class ReportGenerator
{
    public sealed void GenerateReport(ReportRequest request) { /* ... */ }
    // CS0238: 'ReportGenerator.GenerateReport(ReportRequest)' cannot be
    // sealed because it is not an override
}

// VALID — a plain, non-virtual method is already un-overridable.
public abstract class ReportGenerator
{
    public void GenerateReport(ReportRequest request) { /* ... */ }
    // No subclass of ReportGenerator can override this — there is no
    // "virtual" or "abstract" modifier making it overridable in the
    // first place, so "sealed" would be redundant even if it compiled.
}

// Where "sealed" DOES apply correctly: stopping an override chain
// one level further down, on a member that genuinely IS an override.
public class Base
{
    public virtual void Step() { }
}

public class Middle : Base
{
    public sealed override void Step() { }
    // Valid — Step() here IS an override (of Base.Step), and sealing
    // it stops any class derived from Middle from overriding it again.
}

public class Bottom : Middle
{
    // public override void Step() { }   // <-- would NOT compile:
    // CS0239: cannot override inherited member 'Middle.Step()'
    // because it is sealed
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Suppose <code>ReportGenerator</code> is later refactored so that <code>GenerateReport</code> IS an ' +
    'override of a virtual method declared on an even higher base class, <code>ProcessorBase</code>. Would ' +
    '<code>public sealed override void GenerateReport(...)</code> now be valid C#?',
  hint:
    'Re-check the exact rule: what does sealed actually require to be present alongside it?',
  solution:
    'Yes — this would now compile, because the rule is specifically "sealed requires override," and this ' +
    'version genuinely has both: GenerateReport is overriding ProcessorBase\'s own virtual method, and sealed ' +
    'stops any class derived from ReportGenerator from overriding it any further. This is exactly why the ' +
    'original bug was easy to write without noticing: the same three keywords (public, sealed, void) LOOK ' +
    'identical whether or not an override is present, and only the compiler catches the missing piece.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'sealed is a general-purpose way to mark "this method must never be changed" — it should work ' +
      'on any method, the same way it works on a class.',
    reality:
      '<code>sealed</code> on a CLASS (<code>public sealed class Foo</code>) is unconditional — it needs no ' +
      'other modifier and simply prevents any class from inheriting from <code>Foo</code> at all. ' +
      '<code>sealed</code> on a METHOD is a narrower, different rule specifically scoped to stopping an ' +
      'override CHAIN partway through — it has no meaning at all on a method that was never virtual or an ' +
      'override to begin with.',
  },
  {
    thought: 'Since this bug appeared in TWO places on the same page (the codeTab and the mistake block\'s ' +
      'own "right" example), it must have been intentional — maybe an older C# version allowed this.',
    reality:
      'The "sealed requires override" rule has been part of C# since the modifier was introduced — this was ' +
      'never valid at any point. The more likely explanation is exactly the kind of copy-propagation error ' +
      'this whole batch of subtopics keeps surfacing: a snippet gets reused as a "template" for a related ' +
      'example, carrying the same mistake along with it, since the mistake block\'s own "right" example is ' +
      'clearly modeled directly on the main codeTab\'s version.',
  },
];

@Component({
  selector: 'app-template-method-why-sealed-requires-override-in-csharp',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './why-sealed-requires-override-in-csharp.html',
  styleUrl: './why-sealed-requires-override-in-csharp.scss',
})
export class WhySealedRequiresOverrideInCsharpSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
