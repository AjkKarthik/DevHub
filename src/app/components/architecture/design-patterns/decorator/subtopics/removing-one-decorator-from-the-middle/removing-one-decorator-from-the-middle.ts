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
    heading: 'A Cost Named Once, Never Walked Through',
    points: [
      'The main page\'s QnA lists, among Decorator\'s limitations: "removing a specific decorator from the ' +
      'middle of a deeply nested stack requires reconstructing the stack" — true, but abstract until you try ' +
      'to actually do it against the main page\'s own registration code.',
      'The main page\'s own DI registration is a single nested expression: ' +
      '<code>new LoggingOrderService(new ValidatingOrderService(sp.GetRequiredService&lt;OrderService&gt;()), ' +
      'sp.GetRequiredService&lt;ILogger&lt;LoggingOrderService&gt;&gt;())</code> — there is no "list of active ' +
      'decorators" anywhere to edit; the stack IS the expression.',
    ],
  },
  {
    heading: 'What "Reconstructing the Stack" Actually Means Here',
    points: [
      'To remove <code>ValidatingOrderService</code> while keeping <code>LoggingOrderService</code>, the ' +
      'registration lambda itself has to be rewritten — <code>LoggingOrderService</code> now wraps ' +
      '<code>OrderService</code> directly instead of wrapping <code>ValidatingOrderService</code>.',
      'This is a source-code change to the composition root, not a configuration flag — there is no runtime ' +
      'toggle that skips one layer, because each decorator is compiled directly into the layer above it at the ' +
      'point of construction.',
      'If validation needs to come back later (a different environment, a feature flag), the registration code ' +
      'has to branch explicitly — the nesting itself has no conditional structure to lean on.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before — Three Layers, Hand-Nested',
    language: 'csharp',
    code: `// The main page's own registration, exactly as written.
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<IOrderService>(sp =>
    new LoggingOrderService(
        new ValidatingOrderService(
            sp.GetRequiredService<OrderService>()),
        sp.GetRequiredService<ILogger<LoggingOrderService>>()));

// To remove ValidatingOrderService, you cannot flip a setting — you edit
// this exact expression, by hand, and redeploy:
builder.Services.AddScoped<IOrderService>(sp =>
    new LoggingOrderService(
        sp.GetRequiredService<OrderService>(),      // <-- was wrapped in Validating..., now direct
        sp.GetRequiredService<ILogger<LoggingOrderService>>()));`,
  },
  {
    label: 'A More Reconfigurable Alternative',
    language: 'csharp',
    code: `// A small list-based composition root turns "remove one layer" into a
// one-line edit instead of restructuring a nested expression by hand.
public static class OrderServiceComposition
{
    public static IOrderService Build(IServiceProvider sp, bool includeValidation)
    {
        IOrderService service = sp.GetRequiredService<OrderService>();

        if (includeValidation)
            service = new ValidatingOrderService(service);

        service = new LoggingOrderService(
            service, sp.GetRequiredService<ILogger<LoggingOrderService>>());

        return service;
    }
}

// Removing (or conditionally including) a layer is now a flag, not a
// hand-edit of a nested constructor expression:
builder.Services.AddScoped<IOrderService>(sp =>
    OrderServiceComposition.Build(sp, includeValidation: false));

// The trade-off: this only helps because the layers are written as a
// LIST the builder walks — a deeply nested expression like the main
// page's own Stream example (GZipStream(BufferedStream(FileStream)))
// has no equivalent list form without restructuring the whole call.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The "more reconfigurable alternative" above still hard-codes <code>LoggingOrderService</code> as always ' +
    'present, with only <code>ValidatingOrderService</code> made conditional. What would it take to make ' +
    'EVERY layer optional and reorderable, and is that complexity actually worth it for a 2-decorator stack?',
  hint:
    'Think about what data structure would let you express "an ordered, variable-length list of decorator ' +
    'factories" instead of two separately-named conditional blocks.',
  solution:
    'Making every layer optional and reorderable means replacing the two named, hard-coded ' +
    'if-then-wrap blocks with a genuine ordered list of decorator FACTORIES — something like ' +
    'List<Func<IOrderService, IOrderService>> decorators, built up conditionally, then folded ' +
    'over the base service: decorators.Aggregate(baseService, (svc, decorate) => decorate(svc)). For a ' +
    '2-decorator stack, this generality is very likely NOT worth it — the earlier "one boolean flag" version ' +
    'is far more readable, and the main page\'s own mistake block already warns against exactly this ' +
    'over-engineering: "Using Decorator when subclassing is simpler" generalizes here to "building a fully ' +
    'generic decorator pipeline when two named, conditional wraps would do." The list-based approach earns ' +
    'its complexity once the number of independently-toggleable layers grows enough that hand-writing a ' +
    'conditional for each one becomes unwieldy — not at two.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since Decorator is supposed to make behaviors composable, removing one should always be as ' +
      'easy as adding one.',
    reality:
      'Adding a NEW decorator (a new class, wrapped once at the outermost or innermost point) is genuinely ' +
      'cheap and does not require touching existing decorators. Removing or reordering an EXISTING layer in a ' +
      'hand-nested composition root is a different operation — it means editing the specific expression that ' +
      'names that layer, which is exactly the "reconstructing the stack" cost the main page\'s QnA names.',
  },
  {
    thought: 'The fix is to always build decorator stacks as a reconfigurable list, never as nested ' +
      'constructor calls.',
    reality:
      'The nested-constructor form (the main page\'s own style) is simpler to read for a small, stable number ' +
      'of layers, and the reconfigurability of a list-based builder is a real but genuine COST (an extra layer ' +
      'of indirection, a less obvious call site) — worth paying only when the number of independently-toggled ' +
      'layers or environments actually justifies it, not as a universal default.',
  },
];

@Component({
  selector: 'app-decorator-removing-one-decorator-from-the-middle',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './removing-one-decorator-from-the-middle.html',
  styleUrl: './removing-one-decorator-from-the-middle.scss',
})
export class RemovingOneDecoratorFromTheMiddleSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
