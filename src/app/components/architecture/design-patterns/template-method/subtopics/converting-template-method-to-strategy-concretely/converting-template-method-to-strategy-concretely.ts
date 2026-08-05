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
    heading: 'A Named Conversion Procedure, Never Applied to the Page\'s Own Example',
    points: [
      'The main page\'s own QnA lays out an exact conversion recipe: "identify each abstract or hook method... ' +
      'create a corresponding interface... extract each subclass into a separate class implementing only the ' +
      'variable step interface... replace the abstract base class with a concrete class that accepts the step ' +
      'implementations via constructor injection." It even names the target shape using a DIFFERENT example ' +
      '(a reader/writer <code>DataProcessor</code>) than the page\'s own actual codeTab — the recipe is never ' +
      'applied to the page\'s OWN <code>ReportGenerator</code>/<code>SalesReportGenerator</code> example at ' +
      'all.',
      'Applying the QnA\'s own recipe to the page\'s own code is a direct, checkable test of whether the ' +
      'recipe actually works as described — not just a restatement of it.',
    ],
  },
  {
    heading: 'What Changes, and What the Conversion Trades Away',
    points: [
      'Every abstract step (<code>FetchData</code>, <code>FormatData</code>) and hook (<code>FilterData</code>, ' +
      '<code>SortData</code>, <code>SaveReport</code>) becomes its own small interface. ' +
      '<code>SalesReportGenerator</code>, previously a SUBCLASS overriding five methods, becomes a set of ' +
      'STANDALONE classes, each implementing exactly one of those interfaces, wired together at the ' +
      'composition root.',
      'The trade named in the main page\'s own theory (Template Method: compile-time, fixed structure; ' +
      'Strategy: runtime, composable) becomes concrete here: after conversion, a caller can freely mix a ' +
      '<code>SalesFetcher</code> with a DIFFERENT project\'s <code>FormatData</code> implementation — something ' +
      'literally impossible with the original inheritance-based version, where <code>FetchData</code> and ' +
      '<code>FormatData</code> were permanently bundled together inside one <code>SalesReportGenerator</code> ' +
      'subclass.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Template Method vs. Converted Strategy',
    language: 'csharp',
    code: `// BEFORE — Template Method. FetchData and FormatData are locked
// together inside one SalesReportGenerator subclass; you cannot mix
// SalesReportGenerator's FetchData with a different FormatData
// without creating an entirely new subclass.
public abstract class ReportGenerator
{
    public void GenerateReport(ReportRequest request)
    {
        var data      = FetchData(request);
        var filtered  = FilterData(data, request);
        var sorted    = SortData(filtered, request);
        var formatted = FormatData(sorted);
        SaveReport(formatted, request);
    }
    protected abstract IEnumerable<ReportRow> FetchData(ReportRequest request);
    protected abstract string FormatData(IEnumerable<ReportRow> data);
    protected virtual IEnumerable<ReportRow> FilterData(IEnumerable<ReportRow> d, ReportRequest r) => d;
    protected virtual IEnumerable<ReportRow> SortData(IEnumerable<ReportRow> d, ReportRequest r) => d;
    protected virtual void SaveReport(string content, ReportRequest r) => Console.WriteLine(content);
}

// AFTER — Strategy. Each step is its own interface; the "context"
// takes every strategy via constructor injection.
public interface IDataFetcher   { IEnumerable<ReportRow> Fetch(ReportRequest request); }
public interface IDataFormatter { string Format(IEnumerable<ReportRow> data); }
public interface IDataFilter    { IEnumerable<ReportRow> Filter(IEnumerable<ReportRow> data, ReportRequest r); }
public interface IDataSorter    { IEnumerable<ReportRow> Sort(IEnumerable<ReportRow> data, ReportRequest r); }
public interface IReportSaver   { void Save(string content, ReportRequest request); }

// Default (hook-equivalent) implementations for the optional steps.
public class NoOpFilter : IDataFilter { public IEnumerable<ReportRow> Filter(IEnumerable<ReportRow> d, ReportRequest r) => d; }
public class NoOpSorter : IDataSorter { public IEnumerable<ReportRow> Sort(IEnumerable<ReportRow> d, ReportRequest r) => d; }

// The former SalesReportGenerator subclass is now TWO small, mixable
// strategy classes instead of one monolithic subclass.
public class SalesDataFetcher(ISalesRepository repo) : IDataFetcher
{
    public IEnumerable<ReportRow> Fetch(ReportRequest r) =>
        repo.GetSales(r.DateFrom, r.DateTo).Select(s => new ReportRow(s.Id, s.Total, s.Date));
}
public class SalesDataFormatter : IDataFormatter
{
    public string Format(IEnumerable<ReportRow> data) =>
        string.Join("\n", data.Select(r => $"{r.Date:yyyy-MM-dd} | {r.Id} | {r.Total:C}"));
}

// The "context" — a concrete class, not an abstract base, composed
// from injected strategies instead of overridden virtual methods.
public class ReportGenerator(
    IDataFetcher fetcher, IDataFormatter formatter,
    IDataFilter filter, IDataSorter sorter, IReportSaver saver)
{
    public void GenerateReport(ReportRequest request)
    {
        var data      = fetcher.Fetch(request);
        var filtered  = filter.Filter(data, request);
        var sorted    = sorter.Sort(filtered, request);
        var formatted = formatter.Format(sorted);
        saver.Save(formatted, request);
    }
}

// Usage — mixing SalesDataFetcher with a completely different
// formatter, something the original subclass-based version could
// never do without a brand new SalesXyzReportGenerator subclass.
var salesReport = new ReportGenerator(
    new SalesDataFetcher(repo), new SalesDataFormatter(),
    new NoOpFilter(), new NoOpSorter(), new ConsoleReportSaver());
salesReport.GenerateReport(new ReportRequest(DateFrom: lastMonth, DateTo: today));`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'After the conversion, could a caller construct a <code>ReportGenerator</code> using ' +
    '<code>SalesDataFetcher</code> together with a hypothetical <code>ProductDataFormatter</code> (a ' +
    'formatter originally written for an entirely different report type)? Could the ORIGINAL, inheritance-' +
    'based version do the same thing?',
  hint:
    'Check what the "context" class\'s constructor actually depends on after the conversion — concrete ' +
    'subclasses, or independent interfaces?',
  solution:
    'Yes, the converted version can freely mix them — ReportGenerator\'s constructor only depends on the FIVE ' +
    'independent interfaces, with zero knowledge of which concrete class implements each one, so any ' +
    'IDataFetcher can be paired with any IDataFormatter. The ORIGINAL inheritance-based version could NOT do ' +
    'this: FetchData and FormatData were both hardcoded together as overrides inside one single ' +
    'SalesReportGenerator subclass, so using a different FormatData implementation would require writing an ' +
    'entirely new subclass that reimplements FetchData all over again too, even though FetchData itself ' +
    'wouldn\'t need to change at all.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'This conversion is strictly a win — the Strategy version should simply replace the Template ' +
      'Method version on the main page going forward.',
    reality:
      'The main page\'s own theory section is explicit that Strategy suits runtime flexibility while Template ' +
      'Method suits "a fixed overall process" with limited variation — the converted version now needs FIVE ' +
      'constructor parameters wired together at a composition root instead of one subclass definition, a real ' +
      'added complexity cost. If the report types are genuinely fixed and few, the original inheritance-based ' +
      'version is simpler to read and construct, not just an inferior legacy shape.',
  },
  {
    thought: 'Since NoOpFilter and NoOpSorter exist to replace the original hook methods\' default behavior, ' +
      'every step now REQUIRES an explicit implementation to be passed in — there is no way to have an ' +
      '"optional" step anymore.',
    reality:
      'The optionality is preserved, just relocated: instead of a subclass choosing whether to OVERRIDE a ' +
      'virtual hook (with a built-in do-nothing default if it doesn\'t), the CALLER at the composition root ' +
      'chooses whether to pass a genuine implementation or one of the provided no-op defaults ' +
      '(NoOpFilter/NoOpSorter) — the "hook has a sensible default" property survives the conversion, it just ' +
      'moves from inheritance-time to construction-time.',
  },
];

@Component({
  selector: 'app-template-method-converting-template-method-to-strategy-concretely',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './converting-template-method-to-strategy-concretely.html',
  styleUrl: './converting-template-method-to-strategy-concretely.scss',
})
export class ConvertingTemplateMethodToStrategyConcretelySubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
