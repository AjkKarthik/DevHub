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
    heading: 'A Suggested Optimisation, Never Built',
    points: [
      'The main page\'s own "performance implications" QnA suggests a specific pattern for specifications too complex to translate to SQL at all: "Hybrid approach: use database specification for initial filtering, then apply more complex in-memory specifications on the smaller result set... For specifications that cannot be expressed as SQL (calling external services, complex domain logic), fetch candidates from the database and filter in memory." No codeTab on the page ever builds this two-stage pipeline.',
      'The mistakes block\'s own "leaks infrastructure" example is a related but different problem — a specification that WORKS in SQL but fails in-memory due to an unloaded navigation property. This subtopic is the opposite direction: a specification whose rule genuinely CANNOT be expressed as SQL at all (it needs to call an external service, or run logic no SQL translator understands), so SOME filtering has to happen after the data leaves the database no matter how the specification is written.',
    ],
  },
  {
    heading: 'The Two-Stage Shape',
    points: [
      'Stage 1 (database): a specification (or plain LINQ) that CAN be translated to SQL narrows the candidate set down as much as possible — cutting a million-row table down to a few thousand candidates before anything leaves the database.',
      'Stage 2 (in-memory): a specification that CANNOT be translated — because it needs an external API call, or logic no SQL provider can express — runs <code>IsSatisfiedBy()</code> against that already-narrowed candidate set, which is now small enough to filter in memory without materialising the whole table.',
      'The ORDER matters for performance specifically because of that narrowing: running the in-memory-only stage FIRST (against the full unfiltered table) would defeat the entire point — the database stage exists specifically to shrink the set BEFORE the expensive in-memory work runs on it.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Two-Stage Hybrid Pipeline',
    language: 'csharp',
    code: `// A rule that genuinely CANNOT be expressed as SQL — it calls an
// external fraud-scoring service, which no LINQ provider can
// translate into a WHERE clause.
public class PassesFraudCheckSpec(IFraudScoringService fraudService) : Specification<Customer>
{
    // No ToExpression() override at all — this specification is
    // ONLY ever usable via IsSatisfiedBy(), never via SQL translation.
    public override Expression<Func<Customer, bool>> ToExpression() =>
        throw new NotSupportedException(
            "PassesFraudCheckSpec calls an external service and cannot be translated to SQL. " +
            "Use IsSatisfiedBy() against an already-narrowed, in-memory candidate set instead.");

    public new bool IsSatisfiedBy(Customer customer) =>
        fraudService.GetRiskScore(customer.Id) < 0.3m;   // below the risk threshold
}

// The hybrid pipeline: SQL-translatable specs narrow the set first;
// the non-translatable spec runs last, on the smaller result.
public class DiscountEligibilityService(AppDbContext db, IFraudScoringService fraudService)
{
    public async Task<List<Customer>> FindEligibleForDiscountAsync(CancellationToken ct)
    {
        // STAGE 1 (database): everything here CAN be translated to SQL,
        // shrinking a potentially huge table down before anything else runs.
        var sqlEligible = new ActiveCustomerSpec()
            .And(new PremiumCustomerSpec())
            .And(new MinimumOrderAmountSpec(500m));

        var candidates = await db.Customers
            .Where(sqlEligible.ToExpression())
            .ToListAsync(ct);   // e.g. 50,000 rows down to 300 candidates

        // STAGE 2 (in-memory): the non-translatable spec runs ONLY
        // against the already-narrowed 300, not the original 50,000.
        var fraudCheck = new PassesFraudCheckSpec(fraudService);
        return candidates.Where(fraudCheck.IsSatisfiedBy).ToList();
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A teammate proposes swapping the pipeline\'s stage order — run <code>PassesFraudCheckSpec</code> (via <code>IsSatisfiedBy</code>) against the ENTIRE customer table first, then apply the SQL-translatable specs afterward on whatever survives. What breaks, beyond just being slower?',
  hint: 'Think about how many rows would actually need to be loaded into memory before the in-memory stage could even start running.',
  solution: `// It's not just slower -- it may not even be POSSIBLE at scale.
// Running PassesFraudCheckSpec.IsSatisfiedBy() first means every
// SINGLE customer row (all 50,000, not just the 300 that survive
// filtering) has to be loaded into memory AND has to trigger a
// separate external fraud-scoring API call, before the cheap
// SQL-translatable filters (ActiveCustomerSpec, PremiumCustomerSpec,
// MinimumOrderAmountSpec) ever get a chance to narrow anything down.

// This inverts the entire point of the hybrid pattern: the whole
// reason the SQL stage runs FIRST is to shrink the candidate set
// BEFORE the expensive, per-row external-service stage ever has to
// run on it. Reversing the order means the expensive stage pays its
// full cost on the UNFILTERED table -- 50,000 fraud-check API calls
// instead of 300, for the exact same final result.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since <code>PassesFraudCheckSpec</code> extends <code>Specification&lt;Customer&gt;</code> just like the SQL-translatable specs, it should be composable with them the same way — e.g. <code>sqlEligible.And(fraudCheck)</code>.',
    reality: 'Composing it into the SAME expression tree via <code>And()</code> would force the COMBINED specification through <code>ToExpression()</code> the moment anyone tries to use it for a database query — and <code>PassesFraudCheckSpec</code>\'s own <code>ToExpression()</code> deliberately throws, since there is no SQL translation of an external API call. The two specifications belong to genuinely different STAGES of the pipeline precisely because one can be expressed as SQL and the other structurally cannot — keeping them as two SEPARATE filtering steps, not one composed specification, is what makes both usable.',
  },
  {
    thought: 'The hybrid pattern is really just "call the database, then call some code" — nothing about it is specific to the Specification pattern at all.',
    reality: 'The KEY property the Specification pattern contributes here is that BOTH stages stay named, reusable, and independently testable — <code>ActiveCustomerSpec</code>, <code>PremiumCustomerSpec</code>, and <code>PassesFraudCheckSpec</code> can each be unit-tested and reused in other pipelines on their own, rather than the narrowing logic and the fraud-check logic being written as two anonymous, one-off blocks of inline code specific to this ONE method. The hybrid SHAPE (SQL stage, then in-memory stage) could exist without Specification, but the main page\'s own emphasis on named, composable rules is exactly what keeps each stage independently meaningful outside this one pipeline.',
  },
];

@Component({
  selector: 'app-dp-spec-hybrid',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-hybrid-database-then-in-memory-pipeline.html',
  styleUrl: './a-hybrid-database-then-in-memory-pipeline.scss',
})
export class AHybridDatabaseThenInMemoryPipelineSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
