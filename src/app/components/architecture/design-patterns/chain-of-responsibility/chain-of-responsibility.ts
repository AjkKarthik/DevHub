import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'Intent',    type: 'keyword',   desc: 'Pass a request along a chain of handlers; each handler decides to handle or pass it to the next.' },
  { name: 'Handler',   type: 'interface', desc: 'Declares the handle method and a reference to the next handler in the chain.' },
  { name: 'Chain',     type: 'keyword',   desc: 'A linked sequence of handlers; the request travels until one handles it or the chain ends.' },
  { name: 'Middleware', type: 'keyword',  desc: 'ASP.NET Core middleware pipeline is Chain of Responsibility — each middleware calls next().' },
  { name: 'Short-circuit', type: 'keyword', desc: 'A handler can stop propagation — return early without calling the next handler.' },
  { name: 'vs Decorator', type: 'keyword', desc: 'Decorator always passes through and adds behaviour. CoR may stop propagation mid-chain.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is Chain of Responsibility?',
    points: [
      'Chain of Responsibility passes a request along a chain of handlers; each handler either handles the request or passes it to the next.',
      'The sender does not know which handler will process the request — it just sends to the first handler.',
      'Handlers are linked; the chain is assembled at runtime, not in the sender.',
      'A handler can stop the chain (short-circuit) or pass it on after partial processing.',
    ],
  },
  {
    heading: 'Handler Structure',
    points: [
      'Each handler has a SetNext(IHandler next) method and a Handle(request) method.',
      'If the handler can process the request, it does so and optionally stops the chain.',
      'If it cannot (or after processing), it calls next?.Handle(request).',
      'The last handler in the chain receives a null next — no further propagation.',
    ],
  },
  {
    heading: 'CoR vs Decorator vs Observer',
    points: [
      'Decorator: always passes through; adds behaviour — chain never stops.',
      'CoR: may stop at any point; one handler processes the request, others are skipped.',
      'Observer: all observers receive every event — no stopping, no chain order.',
      'ASP.NET Core middleware is CoR: each middleware calls next() to continue OR returns early to stop.',
    ],
  },
  {
    heading: '.NET Examples',
    points: [
      'ASP.NET Core middleware: app.UseAuthentication(), UseAuthorization(), UseEndpoints() form a CoR chain.',
      'HttpMessageHandler pipeline in HttpClient: DelegatingHandler subclasses form a request processing chain.',
      'MediatR pipeline behaviors: IPipelineBehavior<TRequest,TResponse> forms a CoR around handlers.',
      'Exception handling chains: try specific → try general → try global fallback.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Approval Chain',
    language: 'csharp',
    code: `// Handler interface
public abstract class ApprovalHandler
{
    private ApprovalHandler? _next;

    public ApprovalHandler SetNext(ApprovalHandler next)
    {
        _next = next;
        return next; // enable fluent chaining: a.SetNext(b).SetNext(c)
    }

    public abstract void Handle(ExpenseRequest request);

    protected void PassToNext(ExpenseRequest request) =>
        _next?.Handle(request);
}

// Concrete handlers
public class TeamLeadApprover : ApprovalHandler
{
    public override void Handle(ExpenseRequest request)
    {
        if (request.Amount <= 1_000)
            Console.WriteLine($"TeamLead approved {request.Amount}");
        else
            PassToNext(request);
    }
}

public class ManagerApprover : ApprovalHandler
{
    public override void Handle(ExpenseRequest request)
    {
        if (request.Amount <= 10_000)
            Console.WriteLine($"Manager approved {request.Amount}");
        else
            PassToNext(request);
    }
}

public class DirectorApprover : ApprovalHandler
{
    public override void Handle(ExpenseRequest request)
    {
        if (request.Amount <= 100_000)
            Console.WriteLine($"Director approved {request.Amount}");
        else
            Console.WriteLine($"{request.Amount} requires board approval");
    }
}

// Wire the chain
var lead    = new TeamLeadApprover();
var manager = new ManagerApprover();
var director = new DirectorApprover();
lead.SetNext(manager).SetNext(director);

// Send requests — sender has no idea which handler will process
lead.Handle(new ExpenseRequest(500));     // TeamLead approved
lead.Handle(new ExpenseRequest(5_000));   // Manager approved
lead.Handle(new ExpenseRequest(50_000));  // Director approved
lead.Handle(new ExpenseRequest(200_000)); // Board required`,
  },
  {
    label: 'Middleware Pipeline',
    language: 'csharp',
    code: `// ASP.NET Core middleware IS Chain of Responsibility
// Each middleware receives the context and a next delegate

// Logging middleware — always calls next()
app.Use(async (context, next) =>
{
    Console.WriteLine($"→ {context.Request.Method} {context.Request.Path}");
    await next(context); // pass to next handler
    Console.WriteLine($"← {context.Response.StatusCode}");
});

// Auth middleware — short-circuits if unauthenticated
app.Use(async (context, next) =>
{
    if (!context.User.Identity?.IsAuthenticated ?? false)
    {
        context.Response.StatusCode = 401;
        await context.Response.WriteAsync("Unauthorized");
        return; // short-circuit — next() not called
    }
    await next(context);
});

// MediatR pipeline behavior — CoR around command handlers
public class ValidationBehavior<TRequest, TResponse>(IValidator<TRequest>? validator = null)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    public async Task<TResponse> Handle(TRequest request,
        RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        if (validator is not null)
        {
            var result = await validator.ValidateAsync(request, ct);
            if (!result.IsValid)
                throw new ValidationException(result.Errors);
        }
        return await next(); // continue to real handler
    }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not calling the next handler when request is not handled',
    wrong: `public override void Handle(ExpenseRequest request)
{
    if (request.Amount > 1000) return; // silently drops the request!
}`,
    right: `public override void Handle(ExpenseRequest request)
{
    if (request.Amount > 1000) { PassToNext(request); return; }
    Approve(request);
}`,
    explanation: 'If a handler cannot process the request, it must pass it to the next handler. Silently returning loses the request — no handler processes it and the sender gets no response.',
  },
  {
    title: 'Hardcoding the chain inside handlers',
    wrong: `public override void Handle(ExpenseRequest r)
{
    if (r.Amount > 1000) new ManagerApprover().Handle(r); // tight coupling!
}`,
    right: `protected void PassToNext(ExpenseRequest r) => _next?.Handle(r);
// Chain is assembled externally; handler knows nothing about next type`,
    explanation: 'Handlers must not know about or instantiate the next handler in the chain. The chain is assembled by the caller — handlers only know about the IHandler interface.',
  },
  {
    title: 'Confusing CoR with Decorator',
    wrong: `// CoR and Decorator look the same — "they both chain handlers"`,
    right: `// Decorator: ALL handlers process every request (no short-circuiting)
// CoR: ONE handler (or none) processes each request; chain can stop`,
    explanation: 'In Decorator, every wrapper in the chain processes every call. In CoR, only one handler (or none) handles a given request — any handler can stop propagation by not calling next.',
  },
  {
    title: 'Making chains non-configurable at runtime',
    wrong: `// Chain hardcoded in constructor — cannot reorder or add handlers`,
    right: `// Assemble the chain in the composition root / DI registration
// This allows different chains for different contexts (roles, environments)`,
    explanation: 'The power of CoR is that chains are assembled at runtime. Hard-coding the chain loses this flexibility — you can no longer reorder, add, or remove handlers for different scenarios.',
  },
];

const challenge: Challenge = {
  title: 'Request Filter Chain',
  language: 'typescript',
  description: `Build a Chain of Responsibility for HTTP-like request filtering.
Each filter is a Handler with handle(req) that either processes or passes to next.
Implement: AuthFilter (reject if no token), RateLimitFilter (reject if > 100 req/min), LogFilter (log all, always pass through).
Chain: auth → rateLimit → log → (endpoint).`,
  hints: [
    'BaseFilter has setNext() and abstract handle()',
    'AuthFilter checks req.token — stop chain if missing',
    'LogFilter always calls next — it just logs',
  ],
  starterCode: `interface Request { path: string; token?: string; }

abstract class Filter {
  protected next: Filter | null = null;
  setNext(filter: Filter): Filter { this.next = filter; return filter; }
  abstract handle(req: Request): string;
}

// TODO: AuthFilter, RateLimitFilter, LogFilter`,
  solution: `interface Request { path: string; token?: string; }

abstract class Filter {
  protected next: Filter | null = null;
  setNext(filter: Filter): Filter { this.next = filter; return filter; }
  abstract handle(req: Request): string;
}

class AuthFilter extends Filter {
  handle(req: Request): string {
    if (!req.token) return '401 Unauthorized';
    return this.next?.handle(req) ?? 'OK';
  }
}

class RateLimitFilter extends Filter {
  private count = 0;
  handle(req: Request): string {
    this.count++;
    if (this.count > 100) return '429 Too Many Requests';
    return this.next?.handle(req) ?? 'OK';
  }
}

class LogFilter extends Filter {
  handle(req: Request): string {
    console.log(\`LOG: \${req.path}\`);
    return this.next?.handle(req) ?? 'OK'; // always pass through
  }
}

const auth      = new AuthFilter();
const rateLimit = new RateLimitFilter();
const log       = new LogFilter();
auth.setNext(rateLimit).setNext(log);

console.log(auth.handle({ path: '/api/data' }));              // 401
console.log(auth.handle({ path: '/api/data', token: 'abc' })); // LOG + OK`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the key difference between Chain of Responsibility and Decorator?',
    options: [
      'Chain of Responsibility is structural; Decorator is behavioral',
      'In CoR, a handler may stop propagation; in Decorator, all wrappers always process every call',
      'Decorator uses interfaces; CoR uses abstract classes',
      'CoR is for single objects; Decorator is for multiple objects',
    ],
    answer: 1,
    explanation: 'In Decorator, every wrapper processes every call — no handler can stop the chain. In CoR, any handler may stop propagation (short-circuit). CoR handlers compete to handle a request; Decorators cooperate.',
  },
  {
    q: 'ASP.NET Core middleware (app.Use(async (ctx, next) => ...)) implements which pattern?',
    options: ['Observer', 'Decorator', 'Chain of Responsibility', 'Mediator'],
    answer: 2,
    explanation: 'ASP.NET Core middleware is Chain of Responsibility. Each middleware either calls next(context) to continue or returns early (short-circuits). Authentication middleware can stop the chain by returning 401 without calling next.',
  },
  {
    q: 'What happens if no handler in the chain can handle the request?',
    options: [
      'The first handler reprocesses it',
      'An exception is always thrown',
      'The request reaches the end of the chain unhandled — the sender receives no response (or null)',
      'The chain loops back to the beginning',
    ],
    answer: 2,
    explanation: 'If no handler processes the request, it falls off the end of the chain. The design must decide: throw, return a default, or accept no-op. This is an important design decision when building a CoR.',
  },
  { q: 'What is the Chain of Responsibility pattern?', options: ['A linked-list data structure for processing requests in order', 'A behavioral pattern where a request is passed along a chain of handlers, each deciding whether to handle it or pass it to the next handler', 'A pattern for chaining method calls on the same object', 'A network pattern where each node forwards traffic to the next'], answer: 1, explanation: 'In Chain of Responsibility, potential handlers are linked in a chain. A request enters at the head of the chain. Each handler decides: process the request and stop, or pass it to the next handler. Handlers are decoupled from each other and from the request sender: the sender does not know which handler will process the request, and each handler does not know the entire chain. This allows building processing pipelines where the chain can be reconfigured at runtime by adding, removing, or reordering handlers.' },
  { q: 'What are real-world examples of Chain of Responsibility in software?', options: ['Database connection pooling and thread management', 'HTTP middleware pipelines, event bubbling in DOM, logging handlers, and authentication filters in web frameworks', 'Design pattern categories: Creational, Structural, and Behavioral', 'Load balancer routing algorithms distributing traffic across servers'], answer: 1, explanation: 'Chain of Responsibility appears in: HTTP middleware in Express.js and ASP.NET Core (each middleware calls next() to pass to the next handler). Servlet filters in Java EE (each filter calls chain.doFilter() to continue). DOM event bubbling where an event handler on a child calls stopPropagation() or lets it bubble to parent elements. Java logging Handler objects (ConsoleHandler, FileHandler, SocketHandler) chained to route log records. ASP.NET Core authorization policies form a chain of requirement handlers.' },
  { q: 'What is the difference between Chain of Responsibility and Strategy?', options: ['Chain of Responsibility executes all handlers; Strategy executes only one', 'Both patterns involve passing work to one of several objects; Chain of Responsibility passes along a chain until one handles it; Strategy selects exactly one algorithm from several alternatives upfront', 'Strategy creates a chain; Chain of Responsibility selects a strategy', 'They are the same pattern with different names'], answer: 1, explanation: 'Chain of Responsibility: request passed along a chain; each handler may or may not handle it; if not, it passes to the next. Multiple handlers may participate. No upfront decision about which will handle. Strategy: a single algorithm is selected once and used. The context delegates to the chosen strategy. No chain, no passing along. Strategy gives the entire work to one selected algorithm. Chain of Responsibility gives the request to each handler in sequence until one accepts. In a pipeline processing multiple transformations, all handlers participate (a variant called Middleware rather than strict CoR).' },
];

const qna: QnaItem[] = [
  {
    q: 'How is MediatR\'s pipeline behavior related to CoR?',
    a: 'MediatR pipeline behaviors (IPipelineBehavior<TRequest, TResponse>) form a CoR chain around the command handler. Each behavior calls next() to continue — enabling validation, logging, and transaction wrapping to be composed around the real handler in any order.',
  },
  {
    q: 'Can a handler both process a request AND pass it to the next handler?',
    a: 'Yes — this is the "pass-through with side effect" variant. Logging and metrics handlers always call next() after recording their data. This overlaps with Decorator, but the structural setup (a chain assembled at runtime vs static wrapping) still classifies it as CoR.',
  },
  { q: 'How do you implement a middleware pipeline using Chain of Responsibility?', a: 'A middleware pipeline is a variant where every handler processes the request rather than stopping when one handles it. In ASP.NET Core: each middleware is a delegate that receives the HttpContext and a next delegate. Calling next() passes control to the subsequent middleware. The pipeline processes the request through all middlewares in order (authentication, logging, routing, etc.) and the response travels back through them in reverse order. Implementation: store handlers in a list, iterate through them calling each in sequence, passing context between them. Each middleware can inspect and modify context before and after calling next(), enabling pre- and post-processing within a single pipeline step.' },
  { q: 'How do you ensure a request is handled if no handler in the chain accepts it?', a: 'Strategies for unhandled requests: include a default handler at the end of the chain that catches any unhandled request and provides a fallback response (404 handler in HTTP middleware). Throw a specific exception from the last handler if no handler accepted the request. Return a null or empty result and let the caller decide. Log unhandled requests for debugging. Using a default handler is the most common approach in frameworks. In logging chains, the root logger acts as a default catch-all. In authorization chains, the default handler denies access if no specific grant was made. Design the chain so that exactly one terminal handler always runs.' },
  { q: 'When should you prefer Chain of Responsibility over multiple if-else conditions?', a: 'Use Chain of Responsibility when: the set of handlers can change at runtime (add or remove handlers without modifying client code). Each handler has distinct responsibilities and should not need to know about the others. You want to apply the Open/Closed Principle: add new handling capabilities by adding new handlers without modifying existing handlers. The sequence of handlers may need to be configurable per deployment or request type. If the handling conditions are fixed, simple, and unlikely to change, a switch statement or if-else chain is often clearer and less over-engineered than a formal Chain of Responsibility implementation.' },
  { q: 'How does Chain of Responsibility support the Single Responsibility Principle?', a: 'Each handler in the chain has a single responsibility: decide whether to handle a specific type of request or condition and process it accordingly. Authentication handler only handles authentication. Rate limiting handler only handles rate limiting. Logging handler only handles request logging. Without the pattern, a single method would contain all the conditional logic for all these concerns, violating the Single Responsibility Principle and making the code harder to maintain, test, and extend. Chain of Responsibility decomposes the monolithic handler into focused single-responsibility handlers that can be independently developed, tested, and deployed.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Chain of Responsibility passes a request along a linked chain of handlers; each handler processes it or passes it on — enabling runtime-assembled, short-circuitable pipelines.',
  mustKnow: [
    'Handler interface: Handle(request) + SetNext(handler); concrete handlers decide to process or pass',
    'A handler MUST pass to next if it cannot handle — silent drops lose requests',
    'CoR vs Decorator: CoR can short-circuit; Decorator always calls through',
    '.NET: ASP.NET Core middleware, HttpMessageHandler pipeline, MediatR behaviors',
    'Chain is assembled externally (composition root) — handlers must not create their own next',
  ],
  interviewFocus: [
    'CoR vs Decorator — key structural and behavioral difference?',
    'How does ASP.NET Core middleware implement CoR?',
    'What should happen if no handler in the chain handles the request?',
  ],
};

@Component({
  selector: 'app-dp-chain-of-responsibility',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './chain-of-responsibility.html',
  styleUrl: './chain-of-responsibility.scss',
})
export class DpChainOfResponsibility {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
