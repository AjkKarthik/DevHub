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
    heading: 'A Class Name That Contradicted the Page\'s Own Vocabulary',
    points: [
      'The main page\'s own theory is explicit: "Decorator: same interface; purpose is ADDING BEHAVIOUR ' +
      '(logging, retry, validation)" versus "Proxy: same interface; purpose is ACCESS CONTROL (lazy, cache, ' +
      'security, remote)" — logging is named as a textbook DECORATOR example, in this page\'s own words.',
      'The QnA on "How does Proxy interact with dependency injection?" originally used ' +
      '<code>LoggingOrderProxy</code> as its illustrative class name — directly contradicting the theory ' +
      'section a few scrolls above it, and matching almost exactly the <code>LoggingOrderService</code> class ' +
      'this hub\'s own Decorator topic uses as ITS canonical Decorator example.',
    ],
  },
  {
    heading: 'Why the Distinction Is Worth Defending, Not Just a Naming Nitpick',
    points: [
      'The mistake block on this very page ("Confusing Proxy with Decorator") already warns that "the ' +
      'structural difference is subtle — intent is what matters" — a QnA elsewhere on the SAME page using a ' +
      'Decorator-shaped example under a Proxy-labeled class name is exactly the confusion that mistake block ' +
      'is trying to prevent readers from falling into.',
      'Logging genuinely fails the page\'s own definition of Proxy\'s purpose: a logging wrapper does not ' +
      'decide WHETHER or WHEN to forward the call (Proxy\'s job, per the page\'s own theory) — it ALWAYS ' +
      'forwards, and only adds behavior around that forwarding, which is precisely Decorator\'s job as the ' +
      'page itself defines it.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Sorting Concerns by the Page\'s Own Rule',
    language: 'csharp',
    code: `// The page's own test: does the wrapper decide WHETHER/WHEN to call
// through (Proxy), or does it ALWAYS call through and add behavior
// around the call (Decorator)?

// Genuinely a PROXY — decides WHETHER to forward (auth check can block it)
public class SecureDocumentService(IDocumentService inner, ICurrentUser user)
    : IDocumentService
{
    public string Read(int docId)
    {
        if (!user.IsAuthenticated)
            throw new UnauthorizedAccessException("Login required.");
        return inner.Read(docId); // may NEVER reach this line
    }
}

// Genuinely a PROXY — decides WHETHER to forward (cache hit skips the real call)
public class CachingOrderProxy(IOrderService inner, IMemoryCache cache) : IOrderService
{
    public Task<Order> GetAsync(int id) =>
        cache.GetOrCreateAsync($"order:{id}", _ => inner.GetAsync(id)); // may skip inner entirely
}

// Genuinely a DECORATOR — ALWAYS forwards, only adds behavior around the call
public class LoggingOrderService(IOrderService inner, ILogger<LoggingOrderService> logger)
    : IOrderService
{
    public async Task<Order> GetAsync(int id)
    {
        logger.LogInformation("Fetching order {Id}", id);
        var result = await inner.GetAsync(id); // ALWAYS reaches this line
        logger.LogInformation("Fetched order {Id}", id);
        return result;
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate writes a <code>RetryOrderProxy</code> that catches a transient exception from ' +
    '<code>inner.GetAsync(id)</code> and calls <code>inner.GetAsync(id)</code> again up to 3 times before ' +
    'giving up. Using the page\'s own WHETHER/WHEN-to-forward test, is "Proxy" or "Decorator" the more ' +
    'accurate name for this class?',
  hint:
    'Does a retry wrapper ever decide NOT to call the inner object at all, the way the caching and auth ' +
    'examples above do? Or does it always end up calling through, just possibly more than once?',
  solution:
    'Decorator is the more accurate name — RetryDecorator, not RetryProxy. A retry wrapper always intends ' +
    'to reach the inner object (that is the whole point — it keeps trying until it succeeds or exhausts its ' +
    'attempts); it never decides to skip calling inner.GetAsync(id) altogether the way a cache hit or a failed ' +
    'auth check does. Retrying, like logging, is adding BEHAVIOR around a call that always happens — it never ' +
    'controls WHETHER the call happens at all, which is the dividing line the page\'s own theory draws between ' +
    'the two patterns.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since Proxy and Decorator are "structurally identical" (per the page\'s own quiz answer), the ' +
      'class name does not really matter — either name is fine for the same code.',
    reality:
      'Structural identity (both wrap the same interface, both hold a reference to the wrapped object) is ' +
      'exactly why INTENT-carrying names matter more here, not less — nothing about the code\'s shape signals ' +
      'which pattern is in play, so the class name is often the only place that communicates whether a wrapper ' +
      'controls access or adds behavior. A misleading name actively works against the one signal a reader has.',
  },
  {
    thought: 'A caching wrapper and a logging wrapper are similar enough in spirit that using "Proxy" for ' +
      'both is a reasonable simplification.',
    reality:
      'They differ on the exact test the page\'s own theory establishes: caching can skip the real call ' +
      'entirely on a hit (controls WHETHER — genuinely Proxy); logging always lets the real call happen and ' +
      'only wraps around it (adds behavior — genuinely Decorator). The "same implementation" claim the page\'s ' +
      'own QnA makes elsewhere is specifically scoped to caching (proxy vs. decorator naming being ' +
      'interchangeable FOR CACHING specifically) — it was never meant to extend to logging.',
  },
];

@Component({
  selector: 'app-proxy-loggingorderproxy-isnt-a-proxy-its-a-decorator',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './loggingorderproxy-isnt-a-proxy-its-a-decorator.html',
  styleUrl: './loggingorderproxy-isnt-a-proxy-its-a-decorator.scss',
})
export class LoggingorderproxyIsntAProxyItsADecoratorSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
