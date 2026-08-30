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
    heading: 'A Second, Unrelated Compile Error on the Same Page',
    points: [
      'The main page\'s own "Data Migration Hook" codeTab declared <code>public class AuditController : ' +
      'ControllerBase</code> and then wrote <code>public override void OnActionExecuting(ActionExecutingContext ' +
      'context)</code> inside it. This does not compile: <code>ControllerBase</code> — the lean, API-only ' +
      'base class ASP.NET Core recommends for Web API controllers — does not implement ' +
      '<code>IActionFilter</code> at all, so it has no virtual <code>OnActionExecuting</code>/' +
      '<code>OnActionExecuted</code> methods to override.',
      '<code>Controller</code> (which itself INHERITS FROM <code>ControllerBase</code>, adding view-rendering ' +
      'support) is the class that actually implements <code>IActionFilter</code>/<code>IAsyncActionFilter</code> ' +
      'as virtual no-op methods specifically so a controller CAN opt into being its own filter by overriding ' +
      'them — exactly the technique this codeTab was trying to demonstrate.',
    ],
  },
  {
    heading: 'Why This Is an Easy Mistake, and What to Do for an API-Only Controller',
    points: [
      'The main page\'s own theory section elsewhere correctly says "ASP.NET Core Controller: ' +
      'OnActionExecuting/OnActionExecuted hooks are Template Method pattern" — using the word "Controller," ' +
      'which is technically the correct base class. The codeTab itself just wrote the wrong one of the two ' +
      'very similarly-named classes.',
      'For a genuinely API-only controller that should stay on <code>ControllerBase</code> (no view ' +
      'rendering, smaller base class), the Template-Method-style hook pattern is still available — just via a ' +
      'SEPARATE mechanism: implementing <code>IActionFilter</code> directly on the controller class itself, or ' +
      'writing a standalone <code>ActionFilterAttribute</code> applied to the controller/action — both achieve ' +
      'the same Hollywood-Principle "the pipeline calls into your hook, not the other way around" shape ' +
      'without requiring the heavier <code>Controller</code> base class.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Invalid vs Two Valid Fixes',
    language: 'csharp',
    code: `// INVALID — does not compile. ControllerBase has no
// OnActionExecuting/OnActionExecuted to override.
public class AuditController : ControllerBase
{
    public override void OnActionExecuting(ActionExecutingContext context) { /* ... */ }
    // CS0115: 'AuditController.OnActionExecuting(ActionExecutingContext)':
    // no suitable method found to override
}

// FIX 1 — switch to Controller, which DOES implement IActionFilter
// as virtual no-op hooks (the minimal change, matching the original
// intent exactly).
public class AuditController : Controller
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        Console.WriteLine($"Before action: {context.ActionDescriptor.DisplayName}");
        base.OnActionExecuting(context);
    }
}

// FIX 2 — stay on ControllerBase (API-only, no view support) and
// implement IActionFilter directly instead of relying on Controller's
// own virtual hooks.
public class AuditController : ControllerBase, IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context) =>
        Console.WriteLine($"Before action: {context.ActionDescriptor.DisplayName}");

    public void OnActionExecuted(ActionExecutedContext context) { }
}
// Note: implementing IActionFilter directly on the controller still
// needs the filter registered — e.g. via
// options.Filters.Add<AuditController>() or applying it as an
// attribute-based filter — since a plain interface implementation
// on the controller itself isn't auto-discovered by the MVC pipeline
// the way Controller's own built-in virtual hooks are.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A team has a large existing suite of pure Web API controllers, all correctly inheriting from ' +
    '<code>ControllerBase</code>, and wants EVERY controller to log "before action" without editing each ' +
    'controller class individually. Which of the two fixes above is the better starting point, and what ' +
    'would need to change about it?',
  hint:
    'Neither fix as written applies to MULTIPLE controllers automatically — think about which one is closer ' +
    'in shape to something reusable and centrally registrable.',
  solution:
    'Fix 2 (implementing IActionFilter) is the better starting point, but not as written directly on ' +
    'AuditController itself — the actual reusable version extracts the filter logic into its own standalone ' +
    'class implementing IActionFilter (not attached to any one controller), then registers it GLOBALLY via ' +
    'options.Filters.Add<TheFilterClass>() in AddControllers(), so it runs for every controller\'s actions ' +
    'without any of them needing to change at all. Fix 1 (switching to Controller) does not scale the same ' +
    'way — it would require converting every API-only controller\'s base class, defeating the reason they ' +
    'were on the lighter ControllerBase in the first place.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'ControllerBase and Controller are basically interchangeable base classes — the choice between ' +
      'them is just a style preference.',
    reality:
      '<code>Controller</code> genuinely adds real capability <code>ControllerBase</code> does not have — ' +
      'view-rendering support (<code>View()</code>, <code>ViewData</code>, <code>TempData</code>) and the ' +
      'built-in <code>IActionFilter</code>/<code>IAsyncActionFilter</code> hooks this subtopic covers. ' +
      '<code>ControllerBase</code> is the deliberately leaner choice for a pure Web API that never renders a ' +
      'view — the two are not interchangeable, and the compile error this subtopic traces is a direct ' +
      'consequence of that real difference.',
  },
  {
    thought: 'Since Controller already gives you OnActionExecuting for free, there is never a good reason to ' +
      'use ControllerBase plus a separate IActionFilter implementation instead.',
    reality:
      'The main page\'s own "Not injecting the strategy"-style advice about avoiding unnecessary weight ' +
      'applies here too: a pure API controller pulling in <code>Controller</code>\'s view-rendering machinery ' +
      'purely to get two virtual hook methods is adding capability it will never use, just to access a ' +
      'feature a standalone <code>IActionFilter</code> class provides just as well — without inheriting from ' +
      'the heavier base class at all.',
  },
];

@Component({
  selector: 'app-template-method-controllerbase-vs-controller-for-action-filter-hooks',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './controllerbase-vs-controller-for-action-filter-hooks.html',
  styleUrl: './controllerbase-vs-controller-for-action-filter-hooks.scss',
})
export class ControllerbaseVsControllerForActionFilterHooksSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
