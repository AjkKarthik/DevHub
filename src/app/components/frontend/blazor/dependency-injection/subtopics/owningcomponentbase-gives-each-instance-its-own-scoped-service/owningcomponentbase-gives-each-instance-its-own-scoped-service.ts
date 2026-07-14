import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './owningcomponentbase-gives-each-instance-its-own-scoped-service.html',
  styleUrl: './owningcomponentbase-gives-each-instance-its-own-scoped-service.scss'
})
export class OwningcomponentbaseGivesEachInstanceItsOwnScopedServiceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A regular Scoped service is shared by every component in the SAME circuit — OwningComponentBase creates a genuinely separate, nested scope just for one component',
      points: [
        'A different subtopic in this hub already covers that Scoped in Blazor Server means "one instance per SignalR circuit" — the practical consequence here is that EVERY component within that same circuit, injecting the same Scoped service type, shares the IDENTICAL instance. For a stateless or genuinely shareable service, that is exactly the intended behavior.',
        'A DbContext is a specific case where this sharing becomes actively dangerous: EF Core\'s DbContext is not thread-safe and is not designed to be used concurrently by multiple unrelated pieces of code — two components on the same page, both independently querying the SAME Scoped DbContext instance during the SAME render pass, can produce a genuine runtime exception (a classic "a second operation was started on this context before a previous operation completed" error) or silently corrupted tracked-entity state.',
        'OwningComponentBase&lt;TService&gt; solves this by creating its OWN CHILD DI scope, nested inside the circuit\'s scope, exclusively for that ONE component instance — the TService resolved via its Service property is scoped to THIS component alone, never shared with any sibling component even though they are all still within the same overall circuit.',
      ]
    },
    {
      heading: 'The child scope\'s lifetime is tied to the component instance, not the circuit — disposal happens earlier and more granularly',
      points: [
        'Because the child scope belongs to the component instance specifically, it is disposed the moment THAT component unmounts — not when the whole circuit ends. This means a DbContext obtained through OwningComponentBase is correctly torn down (releasing its connection, its tracked entities) as soon as the user navigates away from that specific component, rather than lingering for the user\'s entire session the way an ordinary Scoped DbContext would.',
        'This is precisely why the main page recommends OwningComponentBase specifically for EF Core DbContext in Blazor Server — it converts a resource whose default lifetime (whole circuit) is inappropriately long for a stateful, non-thread-safe object into one scoped tightly to the single component that actually uses it.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The danger — two components sharing one Scoped DbContext',
      language: 'csharp',
      code: `// Program.cs
builder.Services.AddDbContext<AppDbContext>();  // Scoped by default

<!-- Dashboard.razor — hosts TWO independent components on one page -->
<OrderSummary />
<InventoryPanel />

<!-- OrderSummary.razor -->
@inject AppDbContext Db
@code {
    protected override async Task OnInitializedAsync()
        => orders = await Db.Orders.ToListAsync();
    // Uses the SAME Db instance as InventoryPanel below —
    // both components share ONE Scoped DbContext for this circuit.
}

<!-- InventoryPanel.razor -->
@inject AppDbContext Db
@code {
    protected override async Task OnInitializedAsync()
        => items = await Db.Items.ToListAsync();
    // If both components' OnInitializedAsync run concurrently
    // (which Blazor's render pipeline can genuinely do), this and
    // OrderSummary's query can collide on the SAME DbContext
    // instance — EF Core throws, since a DbContext cannot safely
    // run two operations concurrently.
}`,
    },
    {
      label: 'The fix — each component gets its own isolated scope',
      language: 'csharp',
      code: `<!-- OrderSummary.razor -->
@inherits OwningComponentBase<AppDbContext>
@code {
    protected override async Task OnInitializedAsync()
        => orders = await Service.Orders.ToListAsync();
    // "Service" here is a DIFFERENT DbContext instance from
    // InventoryPanel's own — each OwningComponentBase creates its
    // OWN child scope, exclusively for that one component.
}

<!-- InventoryPanel.razor -->
@inherits OwningComponentBase<AppDbContext>
@code {
    protected override async Task OnInitializedAsync()
        => items = await Service.Items.ToListAsync();
    // Genuinely isolated from OrderSummary's DbContext — no
    // possibility of the two concurrent queries colliding on a
    // single shared instance, since they are not sharing one.
}
// Both components' own child scopes (and their DbContext instances)
// are disposed independently, each when ITS OWN component unmounts —
// not both tied to the whole circuit's lifetime.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer converts OrderSummary to use OwningComponentBase&lt;AppDbContext&gt; but leaves InventoryPanel injecting the ordinary Scoped AppDbContext directly via @inject. Does this partial fix eliminate the concurrent-access risk described in this subtopic?',
    hint: 'Think about whether OrderSummary\'s NEW isolated DbContext instance and InventoryPanel\'s ORIGINAL shared Scoped instance could still collide with each other, or with some THIRD component still using the same shared instance.',
    solution: 'This partial fix does eliminate the SPECIFIC collision between OrderSummary and InventoryPanel, since OrderSummary now has its own separate DbContext instance entirely — it is no longer sharing anything with InventoryPanel\'s instance. However, it does NOT eliminate the underlying risk category in general: InventoryPanel is still using the ordinary Scoped AppDbContext, meaning it still shares that SAME instance with any OTHER component on the page (or added later) that also injects AppDbContext via plain @inject rather than OwningComponentBase. If a third component, ReportsWidget, is added later using plain @inject AppDbContext, it would collide with InventoryPanel exactly as OrderSummary originally did. The genuinely safe pattern is for EVERY component using a non-thread-safe Scoped resource like DbContext to consistently use OwningComponentBase (or an equivalent per-component scoping mechanism, like IDbContextFactory), not just the one component that happened to be fixed first.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'OwningComponentBase&lt;T&gt; is purely a code-organization convenience — it provides the same underlying Scoped service instance as plain @inject, just accessed through a differently-named "Service" property.',
      reality: 'OwningComponentBase&lt;T&gt; creates a GENUINELY SEPARATE child DI scope exclusively for that one component instance — confirmed in this subtopic\'s code examples, where two components each using OwningComponentBase&lt;AppDbContext&gt; get two DIFFERENT DbContext instances, unlike plain @inject where both components would share the identical Scoped instance.'
    },
    {
      thought: 'Since DbContext is registered as Scoped by default, using it directly via @inject in multiple components on the same page is safe as long as those components do not run their queries at the EXACT same millisecond.',
      reality: 'EF Core\'s DbContext is fundamentally not designed for ANY form of concurrent use by unrelated code, regardless of precise timing — this subtopic\'s first code example describes a genuine, real EF Core exception ("a second operation was started...") that can occur specifically because Blazor\'s own render pipeline can process multiple components\' OnInitializedAsync methods in an overlapping way, not because of some rare exact-timing coincidence.'
    },
    {
      thought: 'Converting ONE component in a page to use OwningComponentBase fully resolves the shared-DbContext risk for that entire page, since the problematic component now has its own isolated instance.',
      reality: 'This subtopic\'s exercise shows a partial conversion only resolves the specific collision involving the converted component — every OTHER component still using plain @inject for the same Scoped resource remains at risk of colliding with EACH OTHER, meaning the fix needs to be applied consistently across every component sharing that resource, not just one.'
    }
  ];
}
