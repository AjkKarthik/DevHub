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
    heading: 'Named Three Times, Shown Zero Times',
    points: [
      'DAMP gets its own quickRef entry, its own theory bullet ("In tests: prefer DAMP... test independence and clarity are worth some repetition"), and its own QnA mention — but no codeTab on the page ever shows a test written the DRY way next to the SAME test written the DAMP way, so the actual trade-off stays abstract.',
      'This subtopic builds both versions of the SAME test suite side by side — a DRY version sharing setup through a helper, and a DAMP version repeating the setup in each test — to make concrete exactly what "worth some repetition" buys.',
    ],
  },
  {
    heading: 'Why Test Code Gets a Different Rule Than Production Code',
    points: [
      'Production code is READ to understand what the system DOES; a shared abstraction genuinely helps, since callers only care about the result, not how it was computed. A FAILING TEST is read to understand what went WRONG — and a shared setup helper means the reader has to jump to a SEPARATE method just to see what state a specific test actually started from.',
      'The main page\'s own DRY principle (single authoritative representation of KNOWLEDGE) still technically applies to test setup logic — but the main page\'s own "In tests, prefer DAMP" bullet is a deliberate, documented EXCEPTION: a failing test\'s own file should be readable top-to-bottom without cross-referencing a shared helper, even at the cost of some repeated setup code across tests.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'DRY Tests — Shared Setup Helper',
    language: 'csharp',
    code: `public class OrderTests
{
    // Shared setup -- DRY: the "how do I build a valid order" knowledge
    // lives in exactly one place.
    private static Order CreateValidOrder(int itemCount = 1, decimal price = 10m) =>
        Order.Create(Guid.NewGuid(),
            Enumerable.Range(0, itemCount).Select(_ => new OrderItem(Guid.NewGuid(), 1, price)));

    [Fact]
    public void Total_SumsAllLineItems()
    {
        var order = CreateValidOrder(itemCount: 3, price: 10m);
        order.Total.Should().Be(30m);
    }

    [Fact]
    public void Cancel_ThrowsWhenOrderIsShipped()
    {
        var order = CreateValidOrder();   // <- what does this order actually contain?
        order.Ship();
        var act = () => order.Cancel("test");
        act.Should().Throw<DomainException>();
    }
}
// A reader debugging the SECOND test has to jump to CreateValidOrder()
// to see what itemCount/price defaults it's actually using --
// the failing test's own body doesn't show its starting state.`,
  },
  {
    label: 'DAMP Tests — Each Test Self-Contained',
    language: 'csharp',
    code: `public class OrderTests
{
    [Fact]
    public void Total_SumsAllLineItems()
    {
        // Every value this test cares about is visible RIGHT HERE --
        // repeated across tests, but never hidden behind a helper call.
        var order = Order.Create(Guid.NewGuid(),
        [
            new OrderItem(Guid.NewGuid(), 1, 10m),
            new OrderItem(Guid.NewGuid(), 1, 10m),
            new OrderItem(Guid.NewGuid(), 1, 10m),
        ]);

        order.Total.Should().Be(30m);
    }

    [Fact]
    public void Cancel_ThrowsWhenOrderIsShipped()
    {
        // This test's starting state is fully visible without leaving
        // the method -- one item is all this test actually needs.
        var order = Order.Create(Guid.NewGuid(), [new OrderItem(Guid.NewGuid(), 1, 10m)]);
        order.Ship();

        var act = () => order.Cancel("test");
        act.Should().Throw<DomainException>();
    }
}
// A reader debugging EITHER test sees its entire setup without
// jumping anywhere -- at the cost of repeating "new OrderItem(...)"
// across both tests.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The DRY version\'s <code>CreateValidOrder()</code> helper gets a THIRD test added that needs an order with a specific customer ID (not a random <code>Guid.NewGuid()</code>). What has to change, and what does that reveal about the helper\'s own hidden assumption?',
  hint: 'Check whether <code>CreateValidOrder()</code>\'s current parameter list can already express "a specific customer ID" at all.',
  solution: `// CreateValidOrder() would need a NEW parameter added --
// customerId: Guid? = null -- to support the third test's need,
// which means editing a method shared by the FIRST TWO tests just
// to accommodate a requirement neither of them has.

// This reveals the hidden assumption the helper baked in: "every
// test that needs an order is fine with a random customer ID." That
// assumption held for two tests and silently broke the moment a
// third test needed something different -- exactly the kind of
// shared-abstraction fragility the DAMP version never risks, since
// each test's own setup only ever expresses exactly what THAT test
// needs, with no shared assumption to violate.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'DAMP means giving up on DRY entirely inside test files — no shared code of any kind.',
    reality: 'The main page\'s own theory bullet says "some repetition," not "no sharing at all" — genuinely shared, stable INFRASTRUCTURE (a test database fixture, a custom assertion extension, a base test class handling DI container setup) is still worth centralizing; what DAMP specifically pushes back on is hiding the DATA/STATE each individual test actually exercises behind an indirection, since that\'s the part a reader needs to see directly when a test fails.',
  },
  {
    thought: 'The DRY version\'s <code>CreateValidOrder()</code> helper is objectively bad practice and should never be used.',
    reality: 'For a test suite with DOZENS of tests all needing "some valid order, details don\'t matter," a shared builder genuinely reduces noise without hiding anything IMPORTANT — the trade-off shifts based on how much any given test\'s SPECIFIC values actually matter to what it\'s verifying. The main page\'s own "which is right" answer is genuinely contextual, not "DAMP always wins" — this subtopic\'s own two tests happen to care about their specific values (item count and price directly drive the assertion), which is exactly the case where DAMP\'s extra visibility pays for itself.',
  },
];

@Component({
  selector: 'app-dp-dky-damp',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './dry-vs-damp-in-tests-made-concrete.html',
  styleUrl: './dry-vs-damp-in-tests-made-concrete.scss',
})
export class DryVsDampInTestsMadeConcreteSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
