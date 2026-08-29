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
    heading: 'A Precise Point, Made in Prose Only',
    points: [
      'One of the main page\'s own quiz questions makes a precise, easy-to-miss claim: "If the low-level module defines the interface, the high-level module still depends on something the low-level module controls — true inversion requires the high-level module (or a shared neutral layer) to own the abstraction." A separate QnA answer repeats the same point. Neither ever shows what the WRONG ownership looks like in actual project structure — every codeTab on the page already has the interface correctly positioned, with the "wrong" version never built.',
      'This subtopic builds BOTH project layouts side by side — one where <code>IOrderRepository</code> lives in the Infrastructure project (wrong), one where it lives in the Application project (right) — to make the ownership distinction concrete instead of asserted.',
    ],
  },
  {
    heading: 'Why "Has an Interface" Isn\'t the Same as "DIP Applied"',
    points: [
      'The main page\'s own theory already draws the target distinction ("Without DIP: OrderService depends on SqlOrderRepository... With DIP: OrderService depends on IOrderRepository") — but merely swapping a concrete class for an interface doesn\'t automatically achieve the inversion if the INTERFACE ITSELF still lives in, and is shaped by, the low-level project.',
      'The tell: if <code>OrderService</code> (Application layer) has to add a PROJECT REFERENCE to Infrastructure just to see <code>IOrderRepository</code>\'s definition, the source-code dependency still flows from high-level to low-level — the interface changed nothing about which project depends on which.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Wrong Ownership — Interface Lives in Infrastructure',
    language: 'csharp',
    code: `// ── MyApp.Infrastructure (low-level project) ──────────────────────
// The interface is defined HERE, shaped by what SqlOrderRepository
// finds convenient to implement.
namespace MyApp.Infrastructure;

public interface IOrderRepository
{
    Task SaveAsync(Order order, CancellationToken ct = default);
}

public class SqlOrderRepository(AppDbContext db) : IOrderRepository
{
    public Task SaveAsync(Order order, CancellationToken ct) =>
        db.Orders.AddAsync(order, ct).AsTask();
}

// ── MyApp.Application (high-level project) ────────────────────────
// Application.csproj needs: <ProjectReference Include="../MyApp.Infrastructure/..." />
// just to SEE IOrderRepository's own definition.
namespace MyApp.Application;

using MyApp.Infrastructure;   // <- the dependency direction gives it away

public class OrderService(IOrderRepository repo)
{
    public Task PlaceOrderAsync(Order order, CancellationToken ct) => repo.SaveAsync(order, ct);
}
// Application still depends on Infrastructure's OWN package -- the
// interface changed HOW the dependency is expressed, not WHICH WAY
// it points. This is DI (injecting an abstraction) without DIP
// (the abstraction still isn't owned by the high-level side).`,
  },
  {
    label: 'Correct Ownership — Interface Lives in Application',
    language: 'csharp',
    code: `// ── MyApp.Application (high-level project) ────────────────────────
// The interface is defined HERE, shaped by what OrderService (the
// business logic) actually needs -- not by what's easy to implement.
namespace MyApp.Application;

public interface IOrderRepository
{
    Task SaveAsync(Order order, CancellationToken ct = default);
}

public class OrderService(IOrderRepository repo)
{
    public Task PlaceOrderAsync(Order order, CancellationToken ct) => repo.SaveAsync(order, ct);
}
// Application.csproj has NO reference to Infrastructure at all.

// ── MyApp.Infrastructure (low-level project) ───────────────────────
// Infrastructure.csproj DOES reference Application, specifically to
// implement its interface -- the dependency now points the other way.
namespace MyApp.Infrastructure;

using MyApp.Application;

public class SqlOrderRepository(AppDbContext db) : IOrderRepository
{
    public Task SaveAsync(Order order, CancellationToken ct) =>
        db.Orders.AddAsync(order, ct).AsTask();
}
// The source-code dependency arrow now points Infrastructure ->
// Application -- genuinely inverted from the original "Without DIP"
// direction the main page's own theory describes.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Using the WRONG-ownership version, a new requirement changes <code>IOrderRepository</code> to add a MongoDB-specific method the SQL implementation would need to stub out awkwardly. Why does this happen more easily in the wrong-ownership version than the correct one?',
  hint: 'Think about WHO is actually shaping the interface\'s own member list in each version, and what they\'re likely to reach for when adding a member.',
  solution: `// In the wrong-ownership version, the interface lives in
// Infrastructure -- the same project as SqlOrderRepository AND
// wherever a MongoOrderRepository would eventually live. Whoever
// adds Mongo support is editing a file that's already "theirs" (an
// infrastructure-owned file), with every incentive to add whatever
// shape is convenient for Mongo specifically -- easy to accidentally
// leak Mongo-specific concepts into the interface, which SQL then
// has no clean way to implement.

// In the correct-ownership version, the interface lives in
// Application -- adding a Mongo-specific method means editing a file
// that belongs to the BUSINESS LOGIC project, which naturally
// prompts the question "does OrderService actually need this?"
// rather than "what's convenient for Mongo?" The ownership location
// itself nudges the interface's shape toward what high-level code
// needs, not what any one low-level implementation finds easy.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'As long as <code>OrderService</code>\'s constructor takes <code>IOrderRepository</code> instead of a concrete class, DIP is satisfied — where the interface itself physically lives doesn\'t matter.',
    reality: 'The main page\'s own quiz question is explicit that ownership DOES matter: "if the low-level module defines the interface, the high-level module still depends on something the low-level module controls." Constructor injection of an interface achieves the DI MECHANISM regardless of ownership — but the DIP PRINCIPLE (which direction the source-code dependency points) genuinely depends on which project the interface\'s own definition lives in.',
  },
  {
    thought: 'This is a purely academic distinction with no practical consequence — both versions compile and run identically.',
    reality: 'Both versions do run identically at runtime — the practical consequence shows up in BUILD-TIME coupling and how changes propagate. In the wrong-ownership version, Application.csproj has a real project reference to Infrastructure, meaning Infrastructure changes can force an Application rebuild, and swapping Infrastructure implementations (SQL to Mongo) risks touching a package Application itself references. In the correct-ownership version, Application never references Infrastructure at all — exactly the isolation this hub\'s own Clean Architecture topic\'s Dependency Rule depends on.',
  },
];

@Component({
  selector: 'app-dp-dip-ownership',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './who-should-own-the-abstraction.html',
  styleUrl: './who-should-own-the-abstraction.scss',
})
export class WhoShouldOwnTheAbstractionSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
