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
    heading: 'One Technique Named Among Several, Never Built',
    points: [
      'The main page\'s own QnA on return values lists SIX different techniques for what a Null Object ' +
      'should return per return type — empty collection, zero, empty string, false, ' +
      '<code>Task.CompletedTask</code>, and: "return another Null Object for object return types: a ' +
      '<code>NullCustomerRepository.FindById()</code> returns a <code>NullCustomer</code>." Only the FIRST of ' +
      'these six (empty collection, via <code>Array.Empty&lt;Product&gt;()</code>) is actually demonstrated ' +
      'anywhere on the page.',
      'The "return another Null Object" case is the most structurally interesting of the six, because it is ' +
      'RECURSIVE — a Null Object\'s own method can itself return a DIFFERENT Null Object, and that returned ' +
      'object needs its own complete, safe, no-op implementation of whatever interface it satisfies.',
    ],
  },
  {
    heading: 'What Makes a Nested Null Object Genuinely Safe',
    points: [
      'A method like <code>ICustomerRepository.FindById(id)</code> that returns <code>ICustomer</code> cannot ' +
      'return a bare <code>null</code> without reintroducing exactly the defensive-check problem Null Object ' +
      'exists to eliminate — every property and method a caller might reach for on the returned ' +
      '<code>ICustomer</code> needs a genuinely safe answer, all the way down.',
      'This means <code>NullCustomer</code> itself needs to think through EVERY member of ' +
      '<code>ICustomer</code> the same way the top-level Null Object did — a <code>NullCustomer.Orders</code> ' +
      'property, for instance, should itself return an empty collection (another Null-Object-style default), ' +
      'not throw or return null, keeping the "always safe to use" guarantee intact at every level a caller ' +
      'might navigate to.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'NullCustomerRepository / NullCustomer',
    language: 'csharp',
    code: `public interface ICustomer
{
    string Name { get; }
    string Email { get; }
    IReadOnlyList<Order> Orders { get; }
    bool IsVip { get; }
}

public class Customer(string name, string email, IReadOnlyList<Order> orders, bool isVip) : ICustomer
{
    public string Name { get; } = name;
    public string Email { get; } = email;
    public IReadOnlyList<Order> Orders { get; } = orders;
    public bool IsVip { get; } = isVip;
}

// The Null Object for ICustomer — every member has a safe default,
// not just the top-level "does this customer exist" question.
public sealed class NullCustomer : ICustomer
{
    public static readonly NullCustomer Instance = new();
    private NullCustomer() { }

    public string Name  => "(no customer)";
    public string Email => "";
    public IReadOnlyList<Order> Orders => Array.Empty<Order>(); // Null Object all the way down
    public bool IsVip => false; // a safe, conservative default — never grant VIP treatment to "nobody"
}

public interface ICustomerRepository
{
    ICustomer FindById(int id);
}

public class CustomerRepository(IDbConnection db) : ICustomerRepository
{
    public ICustomer FindById(int id)
    {
        var row = db.QueryFirstOrDefault<CustomerRow>("SELECT * FROM Customers WHERE Id = @id", new { id });
        // The recursive step: instead of returning null, return the
        // Null Object — a genuinely safe ICustomer, not an absence.
        return row is null
            ? NullCustomer.Instance
            : new Customer(row.Name, row.Email, LoadOrders(row.Id), row.IsVip);
    }
}

// Caller — never null-checks, at any level.
var customer = repo.FindById(userId);
Console.WriteLine($"Welcome, {customer.Name}!"); // safe even for a not-found ID
foreach (var order in customer.Orders) Display(order); // safe — empty, not null
if (customer.IsVip) ApplyVipDiscount(); // safe — false for a not-found customer`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page\'s own mistake block warns that Null Object is WRONG "when the caller needs to know about ' +
    'absence" — its own example is a <code>NullUser</code> that a caller "never knows if the user was found ' +
    'or not." Does <code>NullCustomer</code> above commit this exact mistake?',
  hint:
    'Check what the CALLER in this subtopic\'s own usage example actually does with the result — does it ' +
    'need to distinguish a real customer from <code>NullCustomer.Instance</code> anywhere?',
  solution:
    'It depends entirely on what the CALLER actually needs to do — and this is exactly the judgment call the ' +
    'main page\'s own fourth mistake block is about. For a welcome banner or an order-history display (this ' +
    'subtopic\'s own usage example), the caller genuinely does not care whether the customer was found — ' +
    'showing "(no customer)" and an empty order list is a perfectly reasonable degraded experience, so ' +
    'NullCustomer is the right tool here. But if a caller needed to show a specific "customer not found" ' +
    'error page, or decide whether to CREATE a new customer record, it would need to actually distinguish the ' +
    'two cases — at which point FindById should return a nullable ICustomer? (or throw a not-found exception) ' +
    'instead, exactly as the main page\'s own mistake block argues.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since NullCustomer.IsVip returns false, this is somehow a special case chosen specifically for ' +
      'this property — every other property on a Null Object should return the same kind of "default" value ' +
      'without much more thought needed.',
    reality:
      'Choosing false specifically (rather than some other value) is itself a real design decision, not an ' +
      'automatic default: a boolean has exactly two possible values, and the SAFE choice for "grant VIP ' +
      'treatment" specifically has to be the conservative one (false), not an arbitrary pick. A DIFFERENT ' +
      'boolean property on a different Null Object — e.g. "CanBeDeleted" — might need the OPPOSITE default ' +
      '(true, if "nothing to delete" should count as trivially satisfied) — each property genuinely needs its ' +
      'own reasoning about what "safe" means for that specific meaning, not a single universal rule.',
  },
  {
    thought: 'A recursive Null Object like this one is a rare, advanced technique that would not come up in ' +
      'ordinary application code.',
    reality:
      'It comes up naturally anywhere a repository or service method returns a rich domain object rather than ' +
      'a primitive — exactly the shape most real applications are full of. The main page\'s own QnA lists it ' +
      'as one of SIX ordinary, everyday return-value patterns (alongside empty collections and zero), not as ' +
      'an unusual edge case — it is simply the one none of the page\'s own codeTabs happened to demonstrate.',
  },
];

@Component({
  selector: 'app-null-object-nested-null-objects-for-object-returning-methods',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './nested-null-objects-for-object-returning-methods.html',
  styleUrl: './nested-null-objects-for-object-returning-methods.scss',
})
export class NestedNullObjectsForObjectReturningMethodsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
