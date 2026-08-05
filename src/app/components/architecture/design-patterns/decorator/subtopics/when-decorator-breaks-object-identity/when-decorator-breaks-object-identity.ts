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
    heading: 'A Limitation Named in One Sentence, Never Demonstrated',
    points: [
      'The main page\'s own QnA lists, among Decorator\'s limitations: "Object identity: a decorated object ' +
      'is not the same object as the unwrapped original; identity checks fail" — stated once, in passing, ' +
      'with no example of what actually goes wrong.',
      'This is not a hypothetical edge case — the main page\'s own DI registration wraps ' +
      '<code>OrderService</code> in <code>ValidatingOrderService</code> then <code>LoggingOrderService</code>, ' +
      'meaning ANY code that resolves <code>IOrderService</code> gets a ' +
      '<code>LoggingOrderService</code> instance, never the raw <code>OrderService</code> — the exact ' +
      'situation the QnA\'s warning describes.',
    ],
  },
  {
    heading: 'Where This Actually Bites',
    points: [
      'Any code that tracks specific service instances by REFERENCE — an instrumentation registry, a ' +
      '"has this exact object already been processed" cache, a test assertion capturing the raw service before ' +
      'DI wraps it — breaks silently the moment decoration is introduced, because the object callers actually ' +
      'receive is never reference-equal to the one that registry was built against.',
      'The failure is silent specifically because <code>Contains()</code>/lookup-style checks against a ' +
      'reference-keyed collection simply return false or empty for an unrecognized reference — there is no ' +
      'exception, no obvious symptom pointing at decoration as the cause.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Break, Reproduced',
    language: 'csharp',
    code: `// A startup-time registry that tracks "trusted" service instances by
// REFERENCE — a realistic pattern for instrumentation, audit tooling, or
// test harnesses that need to recognize a SPECIFIC object later.
public static class TrustedServiceRegistry
{
    private static readonly HashSet<IOrderService> _trusted =
        new(ReferenceEqualityComparer.Instance);

    public static void Register(IOrderService service) => _trusted.Add(service);
    public static bool IsTrusted(IOrderService service) => _trusted.Contains(service);
}

// Registered against the RAW service, before decoration:
var rawOrderService = new OrderService();
TrustedServiceRegistry.Register(rawOrderService);

// The main page's own DI registration wraps it in two decorators —
// this is EXACTLY what services.AddScoped<IOrderService>(sp => ...) does:
IOrderService decorated = new LoggingOrderService(
    new ValidatingOrderService(rawOrderService),
    logger);

// Every real caller resolves 'decorated', never 'rawOrderService':
Console.WriteLine(TrustedServiceRegistry.IsTrusted(decorated));       // false!
Console.WriteLine(ReferenceEquals(decorated, rawOrderService));       // false
Console.WriteLine(TrustedServiceRegistry.IsTrusted(rawOrderService)); // true — but nobody has this reference`,
  },
  {
    label: 'The Fix — Track by a Stable ID, Not Reference',
    language: 'csharp',
    code: `// Decorators cannot preserve reference identity by definition — a
// wrapper is, by construction, a different object. The fix is to stop
// relying on reference identity and track something stable instead.
public interface IOrderService
{
    string ServiceInstanceId { get; } // stable across every decoration layer
    Task<OrderResult> PlaceOrderAsync(Order order);
}

public class OrderService : IOrderService
{
    public string ServiceInstanceId { get; } = Guid.NewGuid().ToString();
    // ...
}

// A decorator must EXPLICITLY forward the ID — it does not happen for free,
// this is another place "delegate everything to inner" has to be deliberate.
public class LoggingOrderService(IOrderService inner, ILogger<LoggingOrderService> logger)
    : IOrderService
{
    public string ServiceInstanceId => inner.ServiceInstanceId;
    // ...
}

public static class TrustedServiceRegistry
{
    private static readonly HashSet<string> _trustedIds = new();
    public static void Register(IOrderService service) => _trustedIds.Add(service.ServiceInstanceId);
    public static bool IsTrusted(IOrderService service) => _trustedIds.Contains(service.ServiceInstanceId);
}
// Now IsTrusted(decorated) is true — the check no longer depends on which
// specific wrapper layer happens to be holding the reference.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Why can no amount of clever decorator implementation ever preserve <code>ReferenceEquals(decorated, ' +
    'raw)</code> — is this a bug that could theoretically be fixed, or something more fundamental?',
  hint:
    'Think about what a decorator object actually IS at the CLR level — is it possible for two separately ' +
    'allocated objects to ever be the same object?',
  solution:
    'It is fundamental, not fixable. A decorator is, by definition, a NEW object allocated to wrap the ' +
    'original — LoggingOrderService and OrderService are two distinct instances on the heap, with two distinct ' +
    'memory addresses. ReferenceEquals() checks whether two variables point at the exact same memory location, ' +
    'and by construction they never can once one object wraps another. The only way to avoid this would be to ' +
    'not create a wrapper object at all — which is precisely what the sibling subtopic on PostSharp\'s IL ' +
    'weaving does, at the cost of losing every OTHER benefit Decorator\'s object-composition approach provides ' +
    '(runtime reconfigurability, DI-friendliness, working with sealed classes aside).',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Object identity only matters for esoteric reflection-heavy code — ordinary application code ' +
      'never relies on it.',
    reality:
      'Reference-keyed collections are an ordinary, common pattern — <code>ConditionalWeakTable&lt;TKey, ' +
      'TValue&gt;</code>, a <code>HashSet&lt;T&gt;</code> with <code>ReferenceEqualityComparer</code>, or even ' +
      'just an unintentional <code>==</code> comparison on a class without overridden equality all rely on ' +
      'reference identity. Any of these breaking silently after introducing Decorator is a realistic, not ' +
      'exotic, failure mode.',
  },
  {
    thought: 'Since the fix is "track a stable ID instead of a reference," decorators should always expose an ' +
      'ID property just in case.',
    reality:
      'Adding an ID-forwarding member to every decorator "just in case" is unnecessary overhead for services ' +
      'that never need reference-based tracking — the fix shown here is worth applying specifically when a ' +
      'system ALREADY needs to recognize a particular instance later (audit trails, test harnesses, ' +
      'instrumentation), not as a default addition to the Component interface.',
  },
];

@Component({
  selector: 'app-decorator-when-decorator-breaks-object-identity',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './when-decorator-breaks-object-identity.html',
  styleUrl: './when-decorator-breaks-object-identity.scss',
})
export class WhenDecoratorBreaksObjectIdentitySubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
