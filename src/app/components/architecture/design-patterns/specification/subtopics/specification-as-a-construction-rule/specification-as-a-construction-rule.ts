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
    heading: 'Two Uses Get Full Codetabs, the Third Gets None',
    points: [
      'One of the main page\'s own quiz questions names THREE classic uses of Specification: "Selection (query)... validation... construction: build objects that satisfy the specification." Both codeTabs on the page cover selection (<code>Where(spec.ToExpression())</code>) and validation (<code>IsSatisfiedBy()</code>) at length — construction never appears in a single line of code anywhere on the page.',
      'The quiz\'s own example gives the shape: "<code>factory.create(new ConfiguredForPremiumSpec())</code> builds objects configured to satisfy the specification" — the specification isn\'t used to FILTER existing objects here, it\'s used to DRIVE how a NEW one gets built in the first place.',
      'This is a genuinely different relationship between a specification and the object it concerns: selection and validation both start from an object that ALREADY EXISTS and ask "does this satisfy the rule?" — construction starts from NOTHING and asks "what values does this object need so that it WILL satisfy the rule once built?"',
    ],
  },
  {
    heading: 'Why Reusing IsSatisfiedBy() Alone Isn\'t Enough for Construction',
    points: [
      'A specification\'s <code>IsSatisfiedBy(T)</code> can VERIFY a factory built the right thing after the fact — but the factory still needs its OWN knowledge of what values satisfy the specification\'s rule to build one in the first place. A specification that only exposes a yes/no predicate has no way to hand that information over.',
      'The practical pattern: give the specification-aware factory the SAME parameters the specification itself was built from (a minimum order amount, a tier), so the object it constructs is correct by construction — then optionally call <code>IsSatisfiedBy()</code> as a defensive double-check, closing the loop between "built correctly" and "verified correctly."',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Specification-Driven Factory',
    language: 'csharp',
    code: `// The same rule the main page's own PremiumCustomerSpec/
// MinimumOrderAmountSpec encode — but now consulted at CONSTRUCTION
// time, not just at selection/validation time.
public class DiscountEligibilityConfig(CustomerTier requiredTier, decimal minOrderAmount)
{
    public CustomerTier RequiredTier   { get; } = requiredTier;
    public decimal      MinOrderAmount { get; } = minOrderAmount;

    // Builds the SAME rule this config was configured with, as a
    // Specification -- for verifying an already-existing customer.
    public Specification<Customer> ToSpecification() =>
        new ActiveCustomerSpec()
            .And(new CustomerTierSpec(RequiredTier))
            .And(new MinimumOrderAmountSpec(MinOrderAmount));
}

// A factory that CONSTRUCTS a Customer guaranteed to satisfy a
// given discount-eligibility rule -- e.g. for seeding test fixtures
// or backfilling promotional accounts.
public class EligibleCustomerFactory(DiscountEligibilityConfig config)
{
    public Customer Create(string name)
    {
        var customer = new Customer
        {
            Name            = name,
            IsActive        = true,
            IsDeleted       = false,
            Tier            = config.RequiredTier,
            TotalOrderAmount = config.MinOrderAmount,   // exactly satisfies the rule
        };

        // Defensive check: the object this factory just built should
        // ALWAYS satisfy the specification it was configured from --
        // if it doesn't, the factory itself has a bug.
        var spec = config.ToSpecification();
        if (!spec.IsSatisfiedBy(customer))
            throw new InvalidOperationException(
                "EligibleCustomerFactory built a customer that fails its own specification.");

        return customer;
    }
}

// Usage
var config  = new DiscountEligibilityConfig(CustomerTier.Premium, minOrderAmount: 500m);
var factory = new EligibleCustomerFactory(config);
var customer = factory.Create("Test Premium Customer");
// customer.Tier == Premium, customer.TotalOrderAmount == 500m --
// guaranteed to pass the eligibleForDiscount spec from the main page.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Someone edits <code>EligibleCustomerFactory.Create()</code> and accidentally sets <code>TotalOrderAmount = config.MinOrderAmount - 1</code> (one cent under the threshold) instead of exactly meeting it. What happens the next time <code>Create()</code> is called, and why is that better than the bug shipping silently?',
  hint: 'Trace what the defensive <code>IsSatisfiedBy()</code> check at the end of <code>Create()</code> actually does with a customer that fails the specification.',
  solution: `// MinimumOrderAmountSpec's rule is "c.TotalOrderAmount >= minAmount"
// -- one cent under the threshold fails that comparison, so
// spec.IsSatisfiedBy(customer) returns false. The factory then
// throws InvalidOperationException immediately, right where the
// mistake was introduced, instead of silently returning a customer
// that LOOKS eligible for the discount but actually isn't.

// This is better than a silent bug because the failure surfaces at
// the exact moment and exact call site the invariant was broken --
// a unit test calling Create() would fail loudly and immediately,
// rather than some unrelated code path discovering months later
// that a "premium" test fixture never actually qualified for its
// own discount.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Construction is really just validation run in reverse — there\'s nothing genuinely new here beyond calling IsSatisfiedBy() at a different point in time.',
    reality: 'Validation only ever needs the SPECIFICATION\'s own <code>IsSatisfiedBy(T)</code> — it never needs to know how to CREATE a <code>T</code> at all. Construction needs BOTH the specification\'s rule (to verify) AND separate knowledge of what field values would satisfy that rule (to build) — information a bare <code>Specification&lt;T&gt;</code> object, which only exposes a yes/no predicate, doesn\'t carry on its own. That\'s why the factory above needs its own <code>DiscountEligibilityConfig</code> alongside the specification, not just the specification.',
  },
  {
    thought: 'The defensive <code>IsSatisfiedBy()</code> check inside the factory is redundant — if the factory\'s own logic is correct, the object it builds will always satisfy the specification by definition.',
    reality: 'That\'s true only as long as the factory\'s construction logic and the specification\'s rule are kept perfectly in sync BY HAND — and nothing enforces that automatically. If either one changes independently (the specification\'s threshold gets updated, or someone edits the factory without noticing), the check is exactly what catches the two falling out of sync, turning a silent, hard-to-trace mismatch into an immediate, loud failure at the one place responsible for keeping them consistent.',
  },
];

@Component({
  selector: 'app-dp-spec-construction',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './specification-as-a-construction-rule.html',
  styleUrl: './specification-as-a-construction-rule.scss',
})
export class SpecificationAsAConstructionRuleSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
