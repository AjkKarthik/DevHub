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
  templateUrl: './interceptor-skipping-next-handle-skips-the-handler.html',
  styleUrl: './interceptor-skipping-next-handle-skips-the-handler.scss'
})
export class InterceptorSkippingNextHandleSkipsTheHandlerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s theory says interceptors "wrap the handler execution using RxJS operators" and lists caching as a use case — but it never spells out the specific mechanic that makes caching (skipping the real handler entirely) actually possible',
      points: [
        'An interceptor\'s intercept(context, next) method receives a CallHandler whose handle() method returns an Observable representing the eventual result of the route handler. Per NestJS\'s own documentation, this is a genuinely COLD Observable — following standard RxJS semantics, nothing about the route handler actually executes until something SUBSCRIBES to that Observable.',
        'NestJS\'s own platform adapter automatically subscribes to whatever Observable the interceptor\'s intercept() method returns — normally next.handle() itself, piped through whatever RxJS operators the interceptor adds (tap, map, catchError, etc.). Since next.handle() is what triggers the actual route handler method body to run, calling it (and letting that subscription happen) is what makes the handler execute at all.',
        'NestJS\'s documentation states this explicitly: "If you don\'t call the handle() method in your implementation of the intercept() method, the route handler method won\'t be executed at all." Their own caching example returns a completely DIFFERENT Observable — of(cachedValue) — instead of next.handle(), and the docs directly note that in this case "the route handler won\'t be called at all."',
      ]
    },
    {
      heading: 'Why this is a genuine mechanism, not just a metaphor about "skipping" logic',
      points: [
        'This is not simply "the interceptor discards the handler\'s result and substitutes its own" — the handler\'s method body, including any side effects it would have caused (a database write, an external API call, a log statement inside the handler itself), never runs at all in the skipped case. A caching interceptor that returns of(cachedValue) genuinely prevents the underlying controller method from being invoked for that request.',
        'This has a real, practical implication for interceptors that need to conditionally decide whether to hit the real handler: the decision of whether to call next.handle() (executing the real handler) versus returning some other Observable (skipping it) must be made correctly, since getting it backwards either defeats a cache\'s entire purpose (always calling next.handle(), never actually caching) or, more dangerously, silently skips genuine, necessary side effects the caller expected to happen.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Calling next.handle() — the handler DOES run',
      language: 'typescript',
      code: `@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('Before handler runs');
    return next.handle().pipe(
      // next.handle() is subscribed to (by Nest's platform adapter,
      // once this returned Observable is itself subscribed to) —
      // this is what actually triggers the route handler to run.
      tap(() => console.log('After handler ran')),
    );
  }
}
// Output for a request: "Before handler runs" -> [handler body runs,
// e.g. a DB write happens] -> "After handler ran"`,
    },
    {
      label: 'NOT calling next.handle() — the handler NEVER runs',
      language: 'typescript',
      code: `@Injectable()
export class SimpleCacheInterceptor implements NestInterceptor {
  private cache = new Map();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const key = context.switchToHttp().getRequest().url;

    if (this.cache.has(key)) {
      // Returns a COMPLETELY DIFFERENT Observable — next.handle() is
      // never called, never subscribed to. Per NestJS's own docs:
      // "the route handler won't be called at all" in this branch.
      return of(this.cache.get(key));
    }

    return next.handle().pipe(
      tap((response) => this.cache.set(key, response)),
    );
  }
}
// A GET request hitting the cached branch: the controller method's
// actual body — including any console.log, DB read, or other side
// effect inside it — genuinely never executes for that request.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes a rate-limiting interceptor that, when a client has exceeded their limit, is SUPPOSED to reject the request without running the real handler — but they accidentally write `next.handle()` unconditionally at the end of intercept() regardless of the rate-limit check, only adding a `console.log(\'Rate limit exceeded\')` inside the rejection branch first. What actually happens when a rate-limited client makes a request?',
    hint: 'Does merely logging something, or checking a condition, inside intercept() prevent the route handler from running — or is calling next.handle() specifically the thing that determines whether the handler executes?',
    solution: 'The route handler runs anyway, completely bypassing the intended rate limit — the console.log() call is just a side effect of the interceptor\'s own code and has no bearing on whether the handler executes. What determines whether the real route handler runs is specifically whether next.handle() is called (and its resulting Observable ends up subscribed to via whatever the intercept() method ultimately returns) — logging a message, checking a condition, or doing any other work inside intercept() does not, by itself, skip anything. Since this developer\'s code unconditionally calls next.handle() at the end regardless of the rate-limit check, every request — including ones that should have been rejected — still triggers the actual controller method to run, meaning the rate limit has no real effect on request processing at all, only on what gets logged. The fix is to make the rate-limit branch return a different Observable entirely (e.g. throwError(() => new HttpException(\'Too Many Requests\', 429))) instead of falling through to next.handle(), so the real handler genuinely never executes for a rate-limited request.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An interceptor "skipping" the route handler (as in a caching interceptor) means the handler still runs normally in the background, but the interceptor just ignores or discards its result before it reaches the client.',
      reality: 'This subtopic\'s theory and code example both show this is not what happens — when an interceptor returns a different Observable instead of calling next.handle(), the route handler\'s method body genuinely never executes at all, including any side effects (database writes, external calls) it would otherwise have caused.'
    },
    {
      thought: 'Adding conditional logic, logging, or other code inside an interceptor\'s intercept() method is enough to control whether the route handler actually runs for a given request.',
      reality: 'This subtopic\'s exercise shows the opposite — only whether next.handle() is actually called (and its Observable subscribed to) determines whether the handler executes; any other code in intercept(), like a console.log() inside a conditional branch, has no effect on that by itself.'
    },
    {
      thought: 'next.handle() is a regular function call that immediately runs the route handler synchronously when invoked, the same way calling the handler method directly would.',
      reality: 'This subtopic\'s theory clarifies next.handle() returns a COLD RxJS Observable — following standard RxJS semantics, nothing executes until something actually subscribes to it, which normally happens automatically via NestJS\'s own platform adapter subscribing to whatever the interceptor\'s intercept() method ultimately returns.'
    }
  ];
}
