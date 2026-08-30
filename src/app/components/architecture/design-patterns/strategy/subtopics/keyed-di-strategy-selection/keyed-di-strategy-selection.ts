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
    heading: 'Two QnAs Name the Same Two Techniques, Neither Shows Code',
    points: [
      'The main page has TWO separate QnAs about resolving the right strategy at runtime through DI. One ' +
      'names Keyed Services directly: <code>AddKeyedScoped&lt;IShippingStrategy, ExpressShipping&gt;("express")</code>. ' +
      'The other describes the alternative: injecting <code>IEnumerable&lt;IPaymentStrategy&gt;</code> and ' +
      'having a selector service filter by key or condition. Neither shows a complete, working registration ' +
      'AND resolution example for either technique.',
      'Both are real, valid .NET DI patterns for the exact same underlying problem (the Context needs ONE of ' +
      'several registered strategies, chosen at runtime) — the QnAs correctly distinguish them but never ' +
      'demonstrate either one end to end.',
    ],
  },
  {
    heading: 'Keyed Services vs. Enumerable-Plus-Filter',
    points: [
      'Keyed Services (.NET 8+) resolves DIRECTLY by a string/enum key — <code>GetKeyedService&lt;T&gt;(key)</code> ' +
      'or <code>[FromKeyedServices(key)]</code> constructor injection — the container itself does the lookup, ' +
      'with no custom selector code needed at all.',
      'The <code>IEnumerable&lt;T&gt;</code>-plus-filter approach works on ANY .NET version (predates Keyed ' +
      'Services) — every registered strategy is injected as a collection, and a selector service picks the ' +
      'right one by inspecting each strategy\'s own exposed key or type, at the cost of writing that filtering ' +
      'logic by hand.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Keyed Services vs. Enumerable Filter',
    language: 'csharp',
    code: `// TECHNIQUE 1 — Keyed Services (.NET 8+). The container resolves
// directly by key; no custom selector code at all.
builder.Services.AddKeyedScoped<IShippingStrategy, StandardShipping>("standard");
builder.Services.AddKeyedScoped<IShippingStrategy, ExpressShipping>("express");
builder.Services.AddKeyedScoped<IShippingStrategy, OvernightShipping>("overnight");

public class CheckoutController(
    [FromKeyedServices("express")] IShippingStrategy expressStrategy)
{
    // Or resolve dynamically at runtime instead of at constructor time:
    public decimal Quote(Order order, string method, IServiceProvider sp)
    {
        var strategy = sp.GetRequiredKeyedService<IShippingStrategy>(method);
        return strategy.CalculateCost(order);
    }
}

// TECHNIQUE 2 — IEnumerable<T> + a selector service. Works on any
// .NET version; the filtering logic is written by hand.
public interface IShippingStrategy
{
    string  Key { get; }              // strategies self-identify their key
    decimal CalculateCost(Order order);
}

public class ShippingStrategySelector(IEnumerable<IShippingStrategy> strategies)
{
    public IShippingStrategy Select(string method) =>
        strategies.FirstOrDefault(s => s.Key == method)
            ?? throw new InvalidOperationException($"No shipping strategy registered for '{method}'");
}

// Registration — ordinary registrations, no key metadata needed:
builder.Services.AddScoped<IShippingStrategy, StandardShipping>();
builder.Services.AddScoped<IShippingStrategy, ExpressShipping>();
builder.Services.AddScoped<IShippingStrategy, ShippingStrategySelector>();

// Usage — identical call shape either way from the CONSUMER's side:
var strategy = selector.Select("express");
var cost     = strategy.CalculateCost(order);`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A new shipping method, "SameDay", is added — a new class implementing <code>IShippingStrategy</code>. ' +
    'For Technique 2 (the <code>IEnumerable&lt;T&gt;</code> selector), what has to change for ' +
    '<code>ShippingStrategySelector.Select("sameday")</code> to work? What about for Technique 1 (Keyed ' +
    'Services)?',
  hint:
    'Check exactly what <code>ShippingStrategySelector</code> does with the injected collection — does it ' +
    'need to know about a NEW class by name anywhere, or does registration alone suffice?',
  solution:
    'For Technique 2, ONLY the registration line needs to change — ' +
    'builder.Services.AddScoped<IShippingStrategy, SameDayShipping>() — because ' +
    'ShippingStrategySelector.Select() already works generically off the injected collection and each ' +
    'strategy\'s own Key property; no existing code needs editing. For Technique 1, the equivalent single ' +
    'change is one new AddKeyedScoped<IShippingStrategy, SameDayShipping>("sameday") registration line — ' +
    'both techniques satisfy the Open/Closed Principle the same way the main page\'s own theory describes ' +
    'for Strategy in general: adding a new algorithm variant costs one new registration, not a code change ' +
    'to the selection logic itself.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Keyed Services is strictly the newer, better replacement for the IEnumerable<T>-plus-filter ' +
      'approach, so there is no reason to use the older technique anymore.',
    reality:
      'Keyed Services requires .NET 8 or later — a real constraint for any codebase still targeting an ' +
      'earlier framework version. The <code>IEnumerable&lt;T&gt;</code> approach also has its own advantage ' +
      'Keyed Services doesn\'t: the selector can apply ARBITRARY filtering logic beyond a simple key match ' +
      '(e.g. picking the cheapest applicable strategy, or combining several strategies), which a plain keyed ' +
      'lookup by a single string key cannot express.',
  },
  {
    thought: 'ShippingStrategySelector.Select() throwing InvalidOperationException on an unknown method is ' +
      'overly strict — it should just fall back to a sensible default strategy instead.',
    reality:
      'Silently defaulting on an UNRECOGNIZED shipping method string is a real risk of masking a genuine bug ' +
      'upstream (a typo in the method name, a stale value from a dropped shipping option) — throwing surfaces ' +
      'that immediately at the point of failure instead of quietly charging the customer for the wrong ' +
      'shipping method. This is the same reasoning the main page\'s own mistake #2 applies to keeping ' +
      'business-rule decisions OUT of strategies: an invalid selection is a caller error worth surfacing, not ' +
      'silently absorbing.',
  },
];

@Component({
  selector: 'app-strategy-keyed-di-strategy-selection',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './keyed-di-strategy-selection.html',
  styleUrl: './keyed-di-strategy-selection.scss',
})
export class KeyedDiStrategySelectionSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
