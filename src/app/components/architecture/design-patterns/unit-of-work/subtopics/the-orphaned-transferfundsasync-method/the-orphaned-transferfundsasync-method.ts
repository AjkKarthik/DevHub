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
    heading: 'A Method Declared Outside Any Class',
    points: [
      'The main page\'s own "EF Core DbContext as UoW" codeTab closed the <code>OrderService</code> class ' +
      '(its final <code>}</code>) and then declared <code>TransferFundsAsync</code> as its own, separate ' +
      '<code>public async Task</code> method directly at that point — outside any class, struct, or ' +
      'interface. C# does not allow a method declaration to sit at that level at all; the closest legal ' +
      'analog (a top-level statement) only applies to a single Program.cs-style entry-point file executing ' +
      'STATEMENTS, not to declaring a full method like this one.',
      'Compounding the structural problem, the orphaned method\'s own body references <code>db</code> — ' +
      'which was only ever in scope as <code>OrderService</code>\'s own primary-constructor parameter. Once ' +
      '<code>TransferFundsAsync</code> sits outside that class entirely, <code>db</code> is not just unused, ' +
      'it genuinely does not exist anywhere the compiler can find it.',
    ],
  },
  {
    heading: 'Two Different Compiler Errors From One Root Cause',
    points: [
      'Both problems stem from the same misplaced closing brace, but they are technically distinct ' +
      'diagnostics a compiler would report: the method declaration itself sitting at namespace scope, and ' +
      '(if the method declaration were somehow legal) <code>db</code> failing to resolve — CS0103, the exact ' +
      'same category of "name does not exist in the current context" error already found once before in this ' +
      'hub\'s own Null Object topic (<code>_db</code> there, <code>db</code> here — same root shape, different ' +
      'topic, different variable name).',
      'The fix is mechanical once spotted: move <code>TransferFundsAsync</code> back inside ' +
      '<code>OrderService</code>, as a second method alongside <code>ProcessOrderAsync</code> — which ' +
      'immediately puts <code>db</code> back in scope with no other change needed anywhere in the method\'s ' +
      'own body.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before / After',
    language: 'csharp',
    code: `// BEFORE — TransferFundsAsync sits AFTER OrderService's own
// closing brace, outside any class at all.
public class OrderService(ShopDbContext db)
{
    public async Task ProcessOrderAsync(Guid orderId, CancellationToken ct)
    {
        // ...
        await db.SaveChangesAsync(ct);
    }
} // <-- OrderService ends here

// Explicit transaction for extra control
public async Task TransferFundsAsync(Guid fromId, Guid toId, decimal amount)
{
    // 'db' does not exist here — OrderService's own primary
    // constructor parameter went out of scope the moment its class
    // body closed. This method declaration is also illegal on its
    // own: a method cannot be declared directly at namespace scope.
    await using var tx = await db.Database.BeginTransactionAsync();
    // ...
}

// AFTER — TransferFundsAsync moved INSIDE OrderService, as a second
// method. 'db' resolves correctly; the declaration is legal C#.
public class OrderService(ShopDbContext db)
{
    public async Task ProcessOrderAsync(Guid orderId, CancellationToken ct)
    {
        // ...
        await db.SaveChangesAsync(ct);
    }

    public async Task TransferFundsAsync(Guid fromId, Guid toId, decimal amount)
    {
        await using var tx = await db.Database.BeginTransactionAsync();
        try
        {
            var from = await db.Accounts.FindAsync(fromId);
            var to   = await db.Accounts.FindAsync(toId);
            from!.Debit(amount);
            to!.Credit(amount);
            await db.SaveChangesAsync();
            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
} // <-- OrderService ends here now, after BOTH methods`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Instead of moving <code>TransferFundsAsync</code> into <code>OrderService</code>, a teammate proposes ' +
    'putting it into its OWN separate class, <code>AccountService(ShopDbContext db)</code>, using the exact ' +
    'same method body unchanged. Would this also fix the compile error?',
  hint:
    'The bug is specifically about <code>db</code> not existing ANYWHERE the method can reach — check whether ' +
    'a brand new class with its own primary constructor parameter named <code>db</code> provides that.',
  solution:
    'Yes — this is an equally valid fix, arguably a BETTER one for a real project: ' +
    'TransferFundsAsync is about bank accounts, a genuinely different domain concept from ' +
    'OrderService\'s own order-processing responsibility, so giving it its own AccountService(ShopDbContext ' +
    'db) class is a reasonable design choice on top of fixing the compile error. Either fix works purely as a ' +
    'compile-error correction; which one is the better DESIGN depends on whether transferring funds and ' +
    'processing orders genuinely belong in the same service, which is a judgment call the original buggy code ' +
    'never actually made — it accidentally left TransferFundsAsync homeless rather than deliberately choosing ' +
    'where it belonged.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'A missing or misplaced closing brace is a trivial, cosmetic mistake that any IDE would catch ' +
      'and auto-fix instantly, so it is not worth a dedicated look.',
    reality:
      'The bug here is not a MISSING brace — every brace in the original snippet is present and balanced; ' +
      'the closing brace is simply in the WRONG PLACE, one method too early. An IDE\'s bracket-matching ' +
      'highlighting would show this file as perfectly balanced (every open brace has a matching close), which ' +
      'is exactly why this category of mistake can slip past a quick visual scan — the problem is structural ' +
      'placement, not a missing character.',
  },
  {
    thought: 'Since TransferFundsAsync references db.Accounts, and ShopDbContext (shown earlier on the same ' +
      'page) only declares Orders, Customers, and Products, THAT is the real bug here — not the misplaced ' +
      'brace.',
    reality:
      'db.Accounts referencing a DbSet not shown on ShopDbContext is a separate, much more minor point — ' +
      'consistent with how this entire hub\'s illustrative code samples routinely reference plausible domain ' +
      'members (interfaces, DbSets, repository methods) without declaring every single one inline, since the ' +
      'method is clearly illustrating a DIFFERENT domain scenario (bank transfers) than the page\'s main order-' +
      'processing example. The genuine, compiler-enforced bug is specifically the method sitting outside any ' +
      'class at all — that one is not a matter of illustrative convention, it simply does not compile.',
  },
];

@Component({
  selector: 'app-unit-of-work-the-orphaned-transferfundsasync-method',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-orphaned-transferfundsasync-method.html',
  styleUrl: './the-orphaned-transferfundsasync-method.scss',
})
export class TheOrphanedTransferfundsasyncMethodSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
