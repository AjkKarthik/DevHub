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
    heading: 'A Resolution Order, Never Applied to One Feature',
    points: [
      'The QnA states the rule directly: "apply them in order — YAGNI first (only build what\'s needed), then DRY (within what you build, eliminate duplication), then KISS (the simplest implementation that satisfies both). Never sacrifice KISS for speculative DRY." No codeTab walks through applying all three, in that order, to ONE concrete feature — the rule stays a one-paragraph recipe.',
      'This subtopic builds a single feature — CSV export for three different report types — through all three stages in sequence, showing what each principle actually VETOES or ALLOWS at its stage of the decision.',
    ],
  },
  {
    heading: 'What Each Stage Actually Decides',
    points: [
      'YAGNI stage: decide SCOPE — build export for the report types actually requested NOW, not a generic "any future report type" system for hypothetical ones.',
      'DRY stage: within that now-fixed scope, find the genuinely SHARED knowledge (CSV formatting rules) versus the genuinely DIFFERENT knowledge (which columns each report type has) and centralize only the former.',
      'KISS stage: check whether the DRY-stage abstraction introduced more machinery than the actual problem needs — and simplify if so, even if that means accepting a LITTLE duplication back.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Stage 1 — YAGNI Sets the Scope',
    language: 'csharp',
    code: `// Requirement: CSV export for Orders and Customers reports.
// A THIRD report type (Inventory) has been "mentioned as a maybe"
// but nobody has actually asked for it yet.

// YAGNI verdict: build export for Orders and Customers ONLY.
// Do NOT build a generic "IReportType" plugin registry, a
// configurable column-mapping DSL, or a report-type enum with a
// placeholder Inventory case "just in case" -- none of that is
// needed for the two report types that actually exist right now.
public interface IOrdersExporter    { string ToCsv(IEnumerable<Order> orders); }
public interface ICustomersExporter { string ToCsv(IEnumerable<Customer> customers); }`,
  },
  {
    label: 'Stage 2 — DRY Finds the Real Shared Knowledge',
    language: 'csharp',
    code: `// Within the now-fixed scope (two exporters), look for genuinely
// SHARED knowledge. Both exporters independently need the SAME CSV
// escaping rule (quote fields containing commas) -- that IS
// duplicated knowledge worth centralizing. The COLUMNS each report
// has are NOT shared knowledge -- Orders and Customers have
// completely different fields.
public static class CsvFormatting
{
    // The one piece of REAL duplicated knowledge -- how to escape a
    // single CSV field correctly.
    public static string EscapeField(string value) =>
        value.Contains(',') ? $"\\"{value.Replace("\\"", "\\"\\"")}\\"" : value;
}

public class OrdersExporter : IOrdersExporter
{
    public string ToCsv(IEnumerable<Order> orders) =>
        string.Join("\\n", orders.Select(o =>
            string.Join(",", CsvFormatting.EscapeField(o.Id.ToString()), CsvFormatting.EscapeField(o.Total.ToString()))));
}

public class CustomersExporter : ICustomersExporter
{
    public string ToCsv(IEnumerable<Customer> customers) =>
        string.Join("\\n", customers.Select(c =>
            string.Join(",", CsvFormatting.EscapeField(c.Id.ToString()), CsvFormatting.EscapeField(c.Name))));
}
// Each exporter still owns its OWN column list -- only the escaping
// rule (the genuinely shared knowledge) was centralized.`,
  },
  {
    label: 'Stage 3 — KISS Checks the Result',
    language: 'csharp',
    code: `// KISS check: is CsvFormatting.EscapeField() -- a single static
// method, one clear job -- appropriately simple for what it does?
// Yes: it's the simplest expression of "escape a CSV field" that
// exists, no unnecessary interface, no DI registration, no factory.

// A KISS VIOLATION would look like this instead -- introducing
// machinery the two-exporter scope never asked for:
public interface ICsvFormatter { string EscapeField(string value); }
public class DefaultCsvFormatter : ICsvFormatter { /* same one line of logic */ }
public class CsvFormatterFactory { public static ICsvFormatter Create() => new DefaultCsvFormatter(); }
// Wrapping ONE stateless method behind an interface, a class, and a
// factory adds three extra files and a DI registration for zero
// actual behavioural flexibility -- nothing in this feature's scope
// (from the YAGNI stage) ever needed a SWAPPABLE CSV formatter.
// The plain static method from Stage 2 is the correct final answer.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Six months later, the Inventory report type IS actually requested. Walk the same three stages again for JUST this new requirement — what changes at each stage, and does <code>CsvFormatting.EscapeField()</code> need to change at all?',
  hint: 'Check which stage 1/2/3 artifact from the original feature is scoped to "Orders and Customers specifically" versus scoped to "CSV formatting in general."',
  solution: `// YAGNI stage (re-applied): scope now genuinely includes Inventory
// -- this is no longer speculative, so building IInventoryExporter
// is now justified where it wasn't before.

// DRY stage (re-applied): Inventory's columns are yet another
// independent set of domain knowledge -- a NEW InventoryExporter
// class, following the exact same shape as OrdersExporter/
// CustomersExporter.

// KISS stage: no new machinery needed here either -- the new
// exporter is exactly as simple as the first two.

// CsvFormatting.EscapeField() needs ZERO changes -- it was already
// scoped to "CSV formatting in general," not to "Orders and
// Customers specifically," so the genuinely shared knowledge from
// the FIRST feature is immediately reusable by the new one with no
// modification. This is exactly what correctly-scoped DRY buys:
// the abstraction extracted at the right knowledge boundary doesn't
// need to be touched when an unrelated new case arrives.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Applying YAGNI, DRY, and KISS "in order" means doing them once, sequentially, at the start of a feature and never revisiting them.',
    reality: 'The Try It above shows the opposite — the same three-stage process runs AGAIN when a genuinely new requirement (Inventory) arrives, six months later. "In order" describes the sequence WITHIN one pass at one point in time (scope first, then dedupe, then simplify) — not a one-time ritual. Each new real requirement gets its own pass through the same three stages.',
  },
  {
    thought: 'The KISS-violation version (<code>ICsvFormatter</code>/<code>DefaultCsvFormatter</code>/<code>CsvFormatterFactory</code>) is wrong in every context, not just this one.',
    reality: 'The main page\'s own theory is explicit that KISS "does not mean write no abstractions — it means each abstraction must earn its place." If a REAL requirement existed for swappable CSV formatting (say, a customer-configurable delimiter or quoting style), the interface-based version would be the CORRECT choice, not a violation. It\'s a KISS violation SPECIFICALLY here, because nothing in this feature\'s actual scope (established at the YAGNI stage) ever asked for that flexibility.',
  },
];

@Component({
  selector: 'app-dp-dky-resolution-order',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './applying-the-yagni-dry-kiss-resolution-order.html',
  styleUrl: './applying-the-yagni-dry-kiss-resolution-order.scss',
})
export class ApplyingTheYagniDryKissResolutionOrderSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
