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
    heading: 'A Named Example, Never Built',
    points: [
      'The main page\'s own Protected Variations QnA gives a SPECIFIC, concrete scenario: "If the storage mechanism might change (from SQL to NoSQL), protect code from this variation by introducing the IRepository interface." The page\'s own codeTab has exactly ONE Protected Variations example — <code>ITaxCalculator</code>, protecting against changing TAX LAWS, not storage.',
      'This subtopic builds the QnA\'s own named example directly: an <code>IOrderRepository</code> interface protecting callers from a SQL-to-NoSQL storage swap, following the SAME "stable interface around a variation point" shape as the tax example, applied to a genuinely different kind of instability.',
    ],
  },
  {
    heading: 'Why a Second Example Sharpens the Principle',
    points: [
      'The tax-law example and the storage example protect against completely different KINDS of change (a business-rule change vs. an infrastructure-technology change) — seeing the SAME pattern applied to two unrelated variation points makes clear that Protected Variations is about the SHAPE of the fix (identify what varies, wrap it in a stable interface), not about any one specific domain.',
      'It also makes concrete what "the caller is protected" actually means in practice: <code>OrderService</code>, below, needs ZERO changes when the storage technology changes — the interface it depends on never changes, only which CONCRETE class implements it.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Protected Variations — Storage Swap',
    language: 'csharp',
    code: `// The stable interface -- the "protection point" the QnA describes.
// OrderService will depend on THIS, never on a concrete store.
public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid id);
    Task SaveAsync(Order order);
}

// Variation 1 -- SQL Server, today's storage technology.
public class SqlOrderRepository(AppDbContext db) : IOrderRepository
{
    public Task<Order?> GetByIdAsync(Guid id) => db.Orders.FindAsync(id).AsTask();
    public Task SaveAsync(Order order) { db.Orders.Update(order); return db.SaveChangesAsync(); }
}

// Variation 2 -- a document database, adopted later for a different
// scaling profile. OrderService below needs NO changes for this swap.
public class CosmosOrderRepository(CosmosClient cosmos) : IOrderRepository
{
    public async Task<Order?> GetByIdAsync(Guid id)
    {
        var container = cosmos.GetContainer("orders", "orders");
        var response = await container.ReadItemAsync<Order>(id.ToString(), new PartitionKey(id.ToString()));
        return response.Resource;
    }

    public Task SaveAsync(Order order)
    {
        var container = cosmos.GetContainer("orders", "orders");
        return container.UpsertItemAsync(order, new PartitionKey(order.Id.ToString()));
    }
}

// Protected: OrderService is shielded from the storage-technology
// variation entirely -- it only ever sees IOrderRepository.
public class OrderService(IOrderRepository orders)
{
    public Task<Order?> GetOrderAsync(Guid id) => orders.GetByIdAsync(id);
}

// The variation point is chosen entirely at the composition root --
// swapping storage technology means changing ONE line here, not
// touching OrderService or anything that depends on it.
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>();
// builder.Services.AddScoped<IOrderRepository, CosmosOrderRepository>();`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The main page\'s own Protected Variations example (<code>ITaxCalculator</code>) protects against a DIFFERENT kind of variation than this one does. What kind of change does each one shield callers from, and is either interface useless against the OTHER kind of change?',
  hint: 'Compare what would happen if a NEW tax region were added versus what would happen if storage technology changed, for each of the two interfaces.',
  solution: `// ITaxCalculator shields OrderTaxService from BUSINESS-RULE
// variation -- a new tax region, or a changed tax rate, only
// requires a new ITaxCalculator implementation; OrderTaxService
// itself never changes.

// IOrderRepository shields OrderService from INFRASTRUCTURE/
// TECHNOLOGY variation -- a new storage backend only requires a new
// IOrderRepository implementation; OrderService itself never changes.

// Neither interface protects against the OTHER kind of change at
// all: ITaxCalculator would be useless if the variation were "which
// database technology," and IOrderRepository would be useless if
// the variation were "which country's tax rules apply." This is
// exactly why Protected Variations is described as identifying
// SPECIFIC variation points, not as one universal interface that
// protects against every possible future change at once.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Once <code>IOrderRepository</code> exists, <code>OrderService</code> is now protected from ALL future changes, not just storage-technology changes.',
    reality: 'It is protected specifically from the ONE variation point the interface was designed around — how orders are physically persisted and retrieved. A change to what <code>Order</code> ITSELF means (new required fields, changed validation rules) still requires touching code that constructs or validates <code>Order</code> objects, interface or no interface. Protected Variations narrows WHICH changes are isolated; it never makes a class immune to every possible future change.',
  },
  {
    thought: 'Building TWO concrete implementations (<code>SqlOrderRepository</code> and <code>CosmosOrderRepository</code>) up front is what makes this Protected Variations — you need multiple implementations for the pattern to apply.',
    reality: 'The protection comes from the INTERFACE existing as the thing callers depend on — even with only ONE concrete implementation ever written, <code>OrderService</code> is still protected, because it never referenced the concrete class directly in the first place. A second implementation is what PROVES the protection works in practice (as this subtopic\'s codeTab does), but the design is already "protected" the moment <code>OrderService</code> depends on <code>IOrderRepository</code> instead of <code>SqlOrderRepository</code> — that decision, not the number of implementations, is what does the protecting.',
  },
];

@Component({
  selector: 'app-dp-grasp-pv-storage',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-second-protected-variations-example.html',
  styleUrl: './a-second-protected-variations-example.scss',
})
export class ASecondProtectedVariationsExampleSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
