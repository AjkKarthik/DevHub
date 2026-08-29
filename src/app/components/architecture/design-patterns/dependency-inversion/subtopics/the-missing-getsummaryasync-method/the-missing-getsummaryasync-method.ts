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
    heading: 'A Method Called That Was Never Declared',
    points: [
      'The main page\'s own "DIP + Constructor Injection" codeTab declares <code>IOrderRepository</code> with exactly one method: <code>Task SaveAsync(Order order, CancellationToken ct = default)</code>. The SEPARATE "Lifetimes + Captive Dependency" codeTab\'s FIXED version calls <code>repo.GetSummaryAsync()</code> on that same interface — a method that was never declared anywhere on the page.',
      'This is the same undeclared-method pattern this hub keeps finding — just spread across TWO codeTabs sharing one interface, rather than contained in a single class. The first codeTab establishes what <code>IOrderRepository</code> looks like; the second codeTab silently assumes it has more capability than it was ever given.',
    ],
  },
  {
    heading: 'Why the "Correct" Captive-Dependency Fix Needed a Real Method to Call',
    points: [
      'The whole POINT of the fixed <code>OrderSummaryService</code> example is demonstrating <code>IServiceScopeFactory</code> resolving a Scoped dependency correctly, per-operation — but the specific METHOD it calls on that resolved dependency has to actually exist for the example to compile at all. Fixing the interface (adding <code>GetSummaryAsync</code>) and its one registered implementation (<code>SqlOrderRepository</code>) is what makes the captive-dependency fix\'s own code genuinely runnable, not just plausible-looking.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before — IOrderRepository Missing a Method',
    language: 'csharp',
    code: `// Declared in the "DIP + Constructor Injection" codeTab:
public interface IOrderRepository { Task SaveAsync(Order order, CancellationToken ct = default); }

// Used in the SEPARATE "Lifetimes + Captive Dependency" codeTab:
public class OrderSummaryService(IServiceScopeFactory scopeFactory)
{
    public async Task<OrderSummary> GetSummaryAsync()
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var repo = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
        return await repo.GetSummaryAsync();   // does not exist on IOrderRepository
    }
}`,
  },
  {
    label: 'After — Interface and Implementation Both Extended',
    language: 'csharp',
    code: `public interface IOrderRepository
{
    Task SaveAsync(Order order, CancellationToken ct = default);
    Task<OrderSummary> GetSummaryAsync(CancellationToken ct = default);
}

public class SqlOrderRepository(AppDbContext db) : IOrderRepository
{
    public Task SaveAsync(Order order, CancellationToken ct) =>
        db.Orders.AddAsync(order, ct).AsTask();

    public async Task<OrderSummary> GetSummaryAsync(CancellationToken ct) =>
        new(await db.Orders.CountAsync(ct), await db.Orders.SumAsync(o => o.Total, ct));
}

// OrderSummaryService's own code needed NO changes -- it already
// called the method with the right shape; only the interface and
// its one registered implementation were missing it.
public class OrderSummaryService(IServiceScopeFactory scopeFactory)
{
    public async Task<OrderSummary> GetSummaryAsync()
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var repo = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
        return await repo.GetSummaryAsync();   // now compiles
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Suppose a SECOND implementation of <code>IOrderRepository</code> already existed on the page before this fix — an in-memory test double used in unit tests. What would happen to that test double the moment <code>GetSummaryAsync</code> is added to the interface?',
  hint: 'Think about what C# requires of every class declaring <code>: IOrderRepository</code> once the interface\'s own member list changes.',
  solution: `// The in-memory test double would stop compiling the moment
// GetSummaryAsync is added to the interface -- C# requires every
// class implementing an interface to provide ALL of that
// interface's members, with no partial-implementation escape hatch.
// The test double would need its OWN GetSummaryAsync implementation
// added (even a trivial one, like returning a fixed OrderSummary)
// before the project could build again.

// This is exactly why interfaces used across multiple
// implementations are worth extra care when extending them --
// every EXISTING implementer, not just the one being actively
// worked on, has to keep up with the interface's own contract.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since <code>OrderSummaryService</code>\'s own code looks completely reasonable and well-structured, the bug must be somewhere in ITS logic, not in the interface it depends on.',
    reality: '<code>OrderSummaryService</code> is entirely correct as written — it resolves <code>IOrderRepository</code> through a scope exactly the way the captive-dependency fix is supposed to, and calls a method with a completely sensible name and shape. The bug is entirely upstream: the INTERFACE it depends on was simply never given that method in the first place. This is a good example of why undeclared-reference bugs need checking the DEPENDENCY\'s own declaration, not just re-reading the code that calls it.',
  },
  {
    thought: 'This bug would have been caught immediately by anyone reading the page, since the two codeTabs are right next to each other.',
    reality: 'They are two SEPARATE codeTabs, each independently self-contained and individually plausible — a reader working through "Lifetimes + Captive Dependency" in isolation has no reason to scroll back up to double-check every method call against the OTHER codeTab\'s own interface declaration. This is exactly the kind of gap that only surfaces by deliberately cross-checking one codeTab\'s assumptions against another\'s declarations, not by reading either one carefully on its own.',
  },
];

@Component({
  selector: 'app-dp-dip-getsummary',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-missing-getsummaryasync-method.html',
  styleUrl: './the-missing-getsummaryasync-method.scss',
})
export class TheMissingGetsummaryasyncMethodSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
