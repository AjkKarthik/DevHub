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
    heading: 'Two Styles Named, Zero Styles Shown',
    points: [
      'The theory names all three DI styles: "Constructor Injection... Property Injection: dependencies set via public properties — less preferred (optional dependencies only). Method Injection: dependencies passed as method parameters — used when a dependency varies per call." Every single codeTab on the page uses ONLY constructor injection — Property and Method Injection are never demonstrated.',
      'This subtopic builds both, using the exact scenarios the theory\'s own parentheticals describe: an OPTIONAL dependency (Property Injection) and a dependency that VARIES PER CALL (Method Injection).',
    ],
  },
  {
    heading: 'Why Constructor Injection Stays the Default Even With These Two Available',
    points: [
      'Property Injection makes a dependency easy to FORGET to set — unlike a constructor parameter, there\'s no compiler error for leaving a property at its default (often <code>null</code>), only a runtime failure the first time it\'s actually used. This is exactly why the theory calls it "less preferred" and scopes it to genuinely OPTIONAL dependencies, where a sensible no-op default is safe.',
      'Method Injection is a genuinely different SHAPE of problem, not a lesser version of constructor injection — it fits when the dependency isn\'t a fixed part of the object\'s own identity, but instead varies with EACH individual operation, which a constructor (set once, at creation) can\'t express at all.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Property Injection — Optional Dependency',
    language: 'csharp',
    code: `// ILogger is genuinely OPTIONAL -- OrderValidator works correctly
// with no logger at all; logging is a nice-to-have, not a required
// collaborator the way IOrderRepository is for OrderService.
public interface ILogger { void Log(string message); }

public class OrderValidator
{
    // Property Injection: settable after construction, defaults to
    // a safe no-op so the class works correctly even if never set.
    public ILogger? Logger { get; set; }

    public bool Validate(Order order)
    {
        var isValid = order.Items.Count > 0;
        if (!isValid)
            Logger?.Log($"Order {order.Id} failed validation: no items");   // safe if Logger is null
        return isValid;
    }
}

// Usage -- works with or without setting the optional dependency:
var silentValidator = new OrderValidator();               // no logger -- perfectly valid
var loggedValidator  = new OrderValidator { Logger = new ConsoleLogger() }; // opted in`,
  },
  {
    label: 'Method Injection — Varies Per Call',
    language: 'csharp',
    code: `// The discount strategy genuinely varies per INVOCATION, not per
// PricingService instance -- a constructor dependency can't express
// "a different strategy for every call," only "one fixed strategy
// for the object's whole lifetime."
public interface IDiscountStrategy { decimal Apply(decimal price); }

public class PricingService
{
    // Method Injection: the dependency is a parameter, not a field --
    // no constructor dependency at all for this concern.
    public decimal CalculateFinalPrice(decimal basePrice, IDiscountStrategy discount) =>
        discount.Apply(basePrice);
}

// The SAME PricingService instance handles completely different
// discount strategies across different calls -- something neither
// constructor injection (fixed at creation) nor property injection
// (would need resetting between every call, awkward and error-prone)
// expresses as naturally as a plain method parameter does.
var pricing = new PricingService();
var memberPrice   = pricing.CalculateFinalPrice(100m, new PercentageDiscount(10));
var employeePrice = pricing.CalculateFinalPrice(100m, new PercentageDiscount(20));
var noDiscount    = pricing.CalculateFinalPrice(100m, new NoDiscount());`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Someone proposes refactoring <code>PricingService</code> to take <code>IDiscountStrategy</code> as a CONSTRUCTOR parameter instead, reasoning "it\'s more consistent with the rest of the codebase\'s DIP style." What capability would <code>PricingService</code> lose if this refactor happened?',
  hint: 'Check whether the three example calls at the bottom of the Method Injection codeTab would still be possible with a constructor-injected strategy.',
  solution: `// It would lose the ability to use a DIFFERENT discount strategy
// per call using the SAME service instance. With constructor
// injection, one PricingService instance is permanently bound to
// ONE IDiscountStrategy chosen at creation -- computing
// memberPrice, employeePrice, and noDiscount from the SAME instance
// (as the example does) would no longer be possible; a caller would
// need to construct THREE separate PricingService instances, one
// per strategy, purely to vary something that's naturally a
// per-call concern, not a per-instance one.

// This is exactly why "more consistent" isn't automatically
// "better" -- the theory's own point is that each DI style fits a
// different SHAPE of dependency; forcing every dependency through
// constructor injection for consistency's sake can make a genuinely
// per-call concern awkward to express.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Property Injection and Method Injection are just weaker, less-preferred substitutes for Constructor Injection — always reach for the constructor if possible.',
    reality: 'They solve genuinely DIFFERENT problems Constructor Injection can\'t express at all, not lesser versions of the same problem. Constructor Injection fixes a dependency at OBJECT creation time, for the object\'s whole lifetime — it has no way to represent "this dependency is optional" (every constructor parameter is required, or needs an awkward overload) or "this dependency changes with every call" (a constructor runs once). The main page\'s own "less preferred" language about Property Injection is specifically scoped to when a dependency COULD be constructor-injected but doesn\'t need to be — not a blanket ranking of all three styles.',
  },
  {
    thought: 'The nullable <code>ILogger?</code> property in the Property Injection example is a code smell that should be avoided by making <code>Logger</code> required instead.',
    reality: 'The nullability is deliberate and load-bearing here — it\'s what lets <code>OrderValidator</code> function correctly whether or not a caller opts into logging, matching the theory\'s own scoping of Property Injection to "optional dependencies only." Making <code>Logger</code> non-nullable would force every caller to supply SOME logger even when they genuinely don\'t want one, which is precisely the unnecessary requirement Property Injection exists to avoid — that would just turn an optional dependency back into a mandatory one with extra steps.',
  },
];

@Component({
  selector: 'app-dp-dip-injection-styles',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './property-and-method-injection-shown.html',
  styleUrl: './property-and-method-injection-shown.scss',
})
export class PropertyAndMethodInjectionShownSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
