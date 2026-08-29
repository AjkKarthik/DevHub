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
    heading: 'A Field Used, Never Declared',
    points: [
      'The main page\'s own "Null Discount &amp; Collection" codeTab declared ' +
      '<code>public class ProductRepository</code> with NO constructor and NO field declaration at all — ' +
      'then its own <code>GetRecommendations</code> method referenced <code>_db.GetRecs(userId)</code>. ' +
      '<code>_db</code> was never introduced anywhere in the class — a genuine CS0103 compile error: "The ' +
      'name \'_db\' does not exist in the current context."',
      'This is a different category of mistake from most of this hub\'s own generic-syntax or apostrophe ' +
      'gotchas — it is a plain, ordinary reference to an undeclared identifier, the kind any C# compiler would ' +
      'reject immediately on the very first build attempt.',
    ],
  },
  {
    heading: 'Why This Specific Field Was Easy to Miss',
    points: [
      'The rest of the SAME codeTab consistently uses primary constructors for dependency injection — ' +
      '<code>PercentageDiscount(decimal percent)</code>, <code>Checkout(IDiscount discount)</code> — but ' +
      '<code>ProductRepository</code> alone was written without one, likely because the snippet\'s FOCUS is ' +
      'the <code>?? Array.Empty&lt;Product&gt;()</code> line specifically, and the surrounding class shape ' +
      'was assembled around it without also writing the dependency it needed.',
      'The fix follows the SAME primary-constructor pattern already established by every other class in this ' +
      'exact codeTab — <code>ProductRepository(IProductDb db)</code> — keeping the fix consistent with the ' +
      'page\'s own established style rather than introducing a different DI pattern.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before / After',
    language: 'csharp',
    code: `// BEFORE — _db is referenced but never declared anywhere in the
// class. Does not compile.
public class ProductRepository
{
    public IReadOnlyList<Product> GetRecommendations(int userId)
    {
        var products = _db.GetRecs(userId);
        // CS0103: The name '_db' does not exist in the current context
        return products ?? Array.Empty<Product>();
    }
}

// AFTER — a primary constructor parameter, matching the SAME
// dependency-injection style already used by every other class in
// this exact codeTab (PercentageDiscount, Checkout).
public class ProductRepository(IProductDb db)
{
    public IReadOnlyList<Product> GetRecommendations(int userId)
    {
        var products = db.GetRecs(userId);
        return products ?? Array.Empty<Product>(); // Array.Empty<T>() is Null Object
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Instead of a primary constructor, a teammate proposes fixing this with an ORDINARY constructor and a ' +
    'private readonly field: <code>private readonly IProductDb _db; public ProductRepository(IProductDb db) ' +
    '=> _db = db;</code>, keeping the method body\'s original <code>_db.GetRecs(userId)</code> call ' +
    'unchanged. Would this also fix the compile error?',
  hint:
    'The compile error is specifically about <code>_db</code> not existing ANYWHERE in the class — check ' +
    'whether this alternative actually introduces a member with that exact name.',
  solution:
    'Yes — this is an equally valid fix. It declares an actual field literally named _db, so the original ' +
    'method body (_db.GetRecs(userId)) now compiles completely unchanged. The two fixes differ only in HOW ' +
    'the dependency reaches the class (a primary constructor parameter used directly, versus an explicit ' +
    'field assigned in an ordinary constructor) — both correctly introduce SOME member the method body can ' +
    'actually reference, which is the one thing the original code was missing entirely.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'A codeTab this far into a well-reviewed page is unlikely to have a plain, ordinary undeclared-' +
      'identifier compile error — that feels like too basic a mistake to survive this many revisions.',
    reality:
      'This exact category of mistake — a field or method referenced in one codeTab that was never actually ' +
      'declared anywhere in the same class — has recurred repeatedly across many topics in this hub (Mediator, ' +
      'Command, Design patterns generally), usually in the LAST, smallest snippet of a multi-example codeTab, ' +
      'exactly where this one appeared. It is a genuinely common category of authoring slip, not a rare one.',
  },
  {
    thought: 'Since <code>IProductDb</code> is never defined anywhere on the page either, the FIXED version ' +
      'still does not really compile as a complete, standalone program.',
    reality:
      'This matches the page\'s own established convention throughout every codeTab — interfaces like ' +
      '<code>IProductDb</code>, <code>IOrderRepository</code>, or <code>ISalesRepository</code> elsewhere on ' +
      'this hub are illustrative dependencies, understood to exist elsewhere in a real project, not something ' +
      'every snippet needs to define inline. The BUG being fixed here is specifically that ' +
      '<code>ProductRepository</code> never introduced ANY way to reach <code>_db</code> at all — not that ' +
      'every referenced interface lacks its own full definition, which is the normal, expected shape for an ' +
      'illustrative code sample.',
  },
];

@Component({
  selector: 'app-null-object-the-undeclared-db-field-in-productrepository',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-undeclared-db-field-in-productrepository.html',
  styleUrl: './the-undeclared-db-field-in-productrepository.scss',
})
export class TheUndeclaredDbFieldInProductrepositorySubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
