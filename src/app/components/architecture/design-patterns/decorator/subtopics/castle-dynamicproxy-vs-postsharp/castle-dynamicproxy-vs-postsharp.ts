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
    heading: 'Two AOP Frameworks, Two Different Mechanisms',
    points: [
      'The main page\'s QnA originally lumped Castle DynamicProxy and PostSharp together as both using ' +
      '"attribute-style syntax to generate Decorator proxies" — but they achieve AOP through fundamentally ' +
      'different mechanisms, only one of which is actually Decorator-shaped.',
      'Castle DynamicProxy generates a REAL runtime proxy CLASS that implements the target interface and holds ' +
      'a reference to the real object — this is genuine object composition, indistinguishable in shape from ' +
      'the main page\'s own hand-written <code>LoggingOrderService</code>.',
      'PostSharp works by weaving aspect code directly into the compiled IL at BUILD time — no wrapper object ' +
      'is ever created. The target method\'s own bytecode is rewritten to include the aspect\'s logic inline.',
    ],
  },
  {
    heading: 'Why This Distinction Matters, Not Just Terminology',
    points: [
      'Because Castle DynamicProxy creates a genuine wrapper object, it inherits Decorator\'s own known ' +
      'limitations: it can only intercept members declared <code>virtual</code> (or interface members), and ' +
      'the proxy is a DIFFERENT object from the real one — the exact object-identity issue this hub covers in ' +
      'a sibling subtopic.',
      'Because PostSharp rewrites IL directly, it faces none of those constraints — it can weave aspects onto ' +
      '<code>private</code>, <code>static</code>, or <code>sealed</code> members, and there is no second object ' +
      'whose identity could ever diverge from the original, because no second object exists.',
      'The trade-off runs the other way too: PostSharp requires an extra build step (a commercial postcompiler) ' +
      'and modifies the actual compiled assembly, while Castle DynamicProxy is a plain runtime library with no ' +
      'special build tooling — ordinary Decorator trade-offs (composition flexibility, DI-friendliness) apply ' +
      'to Castle\'s approach and not to PostSharp\'s.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Castle DynamicProxy — Genuine Decorator Shape',
    language: 'csharp',
    code: `// Castle DynamicProxy generates a REAL class at runtime that implements
// IOrderService and wraps the target — structurally identical to the main
// page's own hand-written LoggingOrderService, just generated instead of typed.
public class LoggingInterceptor : IInterceptor
{
    private readonly ILogger _logger;
    public LoggingInterceptor(ILogger logger) => _logger = logger;

    public void Intercept(IInvocation invocation)
    {
        _logger.LogInformation("Calling {Method}", invocation.Method.Name);
        invocation.Proceed(); // delegates to the real object — same as inner.PlaceOrderAsync()
        _logger.LogInformation("{Method} returned", invocation.Method.Name);
    }
}

var generator = new ProxyGenerator();
IOrderService proxy = generator.CreateInterfaceProxyWithTarget<IOrderService>(
    new OrderService(), new LoggingInterceptor(logger));

// 'proxy' is a genuinely SEPARATE object from the real OrderService —
// ReferenceEquals(proxy, realOrderService) is false, exactly like the
// main page's own LoggingOrderService wrapping OrderService.
await proxy.PlaceOrderAsync(order);`,
  },
  {
    label: 'PostSharp — No Wrapper Object at All',
    language: 'csharp',
    code: `// PostSharp: the attribute triggers a BUILD-TIME transformation.
// There is no ProxyGenerator call, no second object — the compiled IL of
// PlaceOrderAsync itself is rewritten to include the logging calls inline.
[LoggingAspect]
public class OrderService : IOrderService
{
    public async Task<OrderResult> PlaceOrderAsync(Order order)
    {
        await SaveOrderAsync(order);
        return OrderResult.Success(order.Id);
    }
}

// After the PostSharp build step, the COMPILED method body is roughly
// equivalent to this — but this code never exists in YOUR source, and
// there is only ever ONE OrderService object, never a wrapper:
public async Task<OrderResult> PlaceOrderAsync(Order order)
{
    Logger.LogInformation("Entering PlaceOrderAsync");
    var result = await SaveOrderAsyncOriginal(order);
    Logger.LogInformation("Exiting PlaceOrderAsync");
    return result;
}

// ReferenceEquals(serviceInstance, serviceInstance) — there is only one
// instance in the first place, so the identity question never even arises.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate wants to add logging to a <code>sealed</code> class with no interface, using an AOP ' +
    'framework. Between Castle DynamicProxy and PostSharp, which one can actually do this, and why does the ' +
    'other one fail?',
  hint:
    'Think about what each mechanism actually NEEDS to do its job: does it need to create a wrapper object ' +
    'that also implements a shared type, or does it operate directly on the existing compiled code?',
  solution:
    'PostSharp can do this; Castle DynamicProxy cannot. Castle DynamicProxy works by generating a proxy class ' +
    'at runtime that either implements the target interface or DERIVES FROM the target class and overrides its ' +
    'virtual members — a sealed class with no interface offers nothing to implement and nothing overridable, ' +
    'so DynamicProxy has no way to insert itself between the caller and the real object. PostSharp needs ' +
    'neither an interface nor an overridable member, because it never creates a second object at all — it ' +
    'rewrites the sealed class\'s own compiled method bodies directly, which works regardless of whether the ' +
    'class is sealed, has an interface, or its methods are virtual.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Any tool that uses attributes to "add behavior" to a class is using the Decorator pattern.',
    reality:
      'The attribute is just a TRIGGER — it tells a tool where to apply some transformation. Whether that ' +
      'transformation IS Decorator depends entirely on the mechanism: Castle DynamicProxy\'s generated wrapper ' +
      'object genuinely is Decorator; PostSharp\'s direct IL rewrite is a different technique (closer to ' +
      'compile-time code generation/weaving) that happens to be reachable through similar-looking attribute ' +
      'syntax.',
  },
  {
    thought: 'Since PostSharp does not create a wrapper object, it must be strictly "better" than a ' +
      'Decorator-based approach.',
    reality:
      'It avoids Decorator\'s specific limitations (virtual-only interception, object identity, an extra ' +
      'indirection layer) at the cost of a completely different set of trade-offs: a required, often ' +
      'commercial, build step; harder-to-debug rewritten IL; and no ability to swap or reconfigure the woven ' +
      'behavior at runtime the way a Decorator stack built via DI can be reconfigured per environment.',
  },
];

@Component({
  selector: 'app-decorator-castle-dynamicproxy-vs-postsharp',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './castle-dynamicproxy-vs-postsharp.html',
  styleUrl: './castle-dynamicproxy-vs-postsharp.scss',
})
export class CastleDynamicproxyVsPostsharpSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
