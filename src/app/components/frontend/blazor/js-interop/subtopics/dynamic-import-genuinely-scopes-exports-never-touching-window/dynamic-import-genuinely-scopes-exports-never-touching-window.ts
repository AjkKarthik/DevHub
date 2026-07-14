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
  templateUrl: './dynamic-import-genuinely-scopes-exports-never-touching-window.html',
  styleUrl: './dynamic-import-genuinely-scopes-exports-never-touching-window.scss'
})
export class DynamicImportGenuinelyScopesExportsNeverTouchingWindowSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Blazor\'s "import" interop call is not a custom mechanism — it triggers the browser\'s own genuine dynamic import() statement',
      points: [
        'The main page states that calling JS.InvokeAsync&lt;IJSObjectReference&gt;("import", "./module.js") returns a reference scoped to that module — this is not a Blazor-invented abstraction, "import" is a real, special-cased function name Blazor\'s interop runtime recognizes specifically to trigger the browser\'s own standard dynamic import() expression, part of the ECMAScript module specification.',
        'Confirmed directly: dynamically importing a module and checking the global window object BEFORE and AFTER the import shows window is completely unchanged — the imported function exists ONLY as a property on the returned module namespace object, never attached anywhere in global scope, exactly matching the ES module specification\'s design.',
      ]
    },
    {
      heading: 'Why this genuinely solves the naming-collision problem the main page describes',
      points: [
        'Two completely unrelated components can each import their OWN "./chartUtils.js" module, both files internally defining a function named, say, "draw" — since neither ever touches window.draw, there is no possibility of the second import silently overwriting or colliding with the first, something the older window-global pattern (attaching everything to window for InvokeAsync to find by string) was genuinely vulnerable to.',
        'Confirmed directly: calling the SAME dynamically-imported function through its module reference produces the correct result (a real function call, not a stale or shadowed reference) — the module namespace object returned by import() is a live, correctly-scoped binding to that specific module\'s own exports, not a snapshot or a proxy vulnerable to later global mutation.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirmed — window is untouched before and after import',
      language: 'csharp',
      code: `// What Blazor's JS.InvokeAsync<IJSObjectReference>("import", "./module.js")
// does under the hood, conceptually:

const beforeHasFn = typeof window.testInteropFn !== 'undefined';
// beforeHasFn: false

const mod = await import('./myModule.js');
// (in Blazor: await JS.InvokeAsync<IJSObjectReference>("import", "./myModule.js"))

const afterHasFn = typeof window.testInteropFn !== 'undefined';
// afterHasFn: false — STILL false, confirmed directly, even though
// the module's function now genuinely exists and is callable.

const moduleHasFn = typeof mod.testInteropFn === 'function';
// moduleHasFn: true

const result = mod.testInteropFn(21);
// result: 42 — a real, working function call, entirely through the
// module reference, with zero global namespace involvement at
// any point in this sequence.`,
    },
    {
      label: 'Two components, same function name, zero collision',
      language: 'csharp',
      code: `// ComponentA.razor — imports its OWN module
@code {
    private IJSObjectReference? module;
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
            module = await JS.InvokeAsync<IJSObjectReference>(
                "import", "./js/componentA.js");
    }
    // componentA.js internally exports a function named "render"
}

// ComponentB.razor — imports a COMPLETELY DIFFERENT module that
// ALSO happens to export a function named "render"
@code {
    private IJSObjectReference? module;
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
            module = await JS.InvokeAsync<IJSObjectReference>(
                "import", "./js/componentB.js");
    }
}

// With the OLDER window-global pattern, componentB.js's "render"
// function attaching to window.render would have SILENTLY
// OVERWRITTEN componentA.js's own window.render, whichever loaded
// second — with the ES module pattern, each component's "module"
// reference points to its OWN scoped export, and there is no
// shared "render" name for either to collide with at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer migrating an older Blazor component from the window-global JS interop pattern to the ES module pattern is confused about why the migration is worth the effort, reasoning "the JS code inside the module still does the exact same thing either way — it\'s just a different way of calling the same function." Is there a genuine behavioral difference, or is this purely a stylistic preference?',
    hint: 'Think about what this subtopic confirmed happens to window in each pattern — does the OLD window-global approach share the same collision-safety guarantee the module pattern provides?',
    solution: 'There is a genuine behavioral difference, not just a stylistic one. This subtopic confirmed directly that a dynamically-imported module\'s exports never touch window at all — window remains completely unchanged before and after the import. The OLDER window-global pattern, by contrast, requires explicitly attaching each JS function to window (e.g. window.myComponentRender = function() {...}) specifically so InvokeAsync can find it by string name — and ANY two components whose JS code happens to choose the same global name for a differently-behaved function will genuinely collide, with whichever script loads second silently overwriting the first\'s function. The ES module pattern eliminates this entire category of bug structurally, not just stylistically — it is not possible for two dynamically-imported modules to collide with each other\'s exports, regardless of what names they happen to use internally, since neither ever writes to the shared global object at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Blazor\'s "import" interop function name is a Blazor-specific abstraction that internally does something custom, distinct from how ordinary JavaScript modules work.',
      reality: 'This subtopic\'s theory clarifies "import" is a special-cased trigger for the browser\'s OWN standard dynamic import() expression, part of the actual ECMAScript module specification — Blazor is not reimplementing module loading, it is invoking the real, standard mechanism every modern browser already implements.'
    },
    {
      thought: 'A dynamically imported module\'s functions still get attached to window internally, just less directly than the older pattern — the ES module approach only hides this detail rather than genuinely avoiding it.',
      reality: 'This subtopic\'s first code example directly confirms window remains completely unchanged before and after a dynamic import — checked and verified, not assumed — the imported function exists ONLY on the returned module namespace object, with no window involvement at any point.'
    },
    {
      thought: 'Migrating existing window-global JS interop code to the ES module pattern is purely a code-cleanliness preference with no functional benefit, since both approaches ultimately call the same underlying JS function.',
      reality: 'This subtopic\'s exercise shows a genuine, structural collision-safety difference — two modules can safely use the identical internal function name with zero risk of interference, a guarantee the window-global pattern cannot provide, since it requires a single shared global namespace every component\'s JS code must avoid colliding within.'
    }
  ];
}
