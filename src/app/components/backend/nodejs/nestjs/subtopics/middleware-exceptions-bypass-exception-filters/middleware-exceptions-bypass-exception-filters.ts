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
  templateUrl: './middleware-exceptions-bypass-exception-filters.html',
  styleUrl: './middleware-exceptions-bypass-exception-filters.scss'
})
export class MiddlewareExceptionsBypassExceptionFiltersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own execution-order quiz answer lists the full pipeline as "Middleware → Guards → Interceptors (before) → Pipes → Handler → Interceptors (after) → Exception Filters" — worth noticing that Exception Filters sit at the OTHER END of that chain from Middleware, with real consequences for where a thrown error actually gets caught',
      points: [
        'NestJS\'s documented request lifecycle places Middleware first, running before Guards even begin — and Exception Filters last, positioned to catch errors thrown anywhere from Guards through the Handler and back through Interceptors. Middleware sits entirely outside that in-Nest chain, at the level of the underlying HTTP platform (Express or Fastify) itself.',
        'This ordering has a direct, practical consequence NestJS\'s official documentation does not spell out explicitly (this is a real, currently-open gap in the docs, not settled doctrine to quote verbatim) but that follows directly from the documented pipeline architecture: an exception thrown inside a NestMiddleware implementation is NOT caught by an @Catch() Exception Filter, even a global one, because Nest\'s own exception-handling mechanism operates within the Guards-through-Interceptors chain that middleware runs entirely before.',
        'Practically, this means throwing new BadRequestException(...) inside a custom middleware class\'s use() method will NOT produce the clean, filter-formatted JSON error response a route handler throwing the same exception would produce — instead, the underlying Express/Fastify platform\'s own default (or manually configured) error handling takes over, which typically looks and behaves differently from Nest\'s own exception-filter-formatted output.',
      ]
    },
    {
      heading: 'What to do instead, given this boundary',
      points: [
        'For validation or rejection logic that needs Nest\'s exception-filter-formatted error responses, prefer implementing that logic as a Guard or a Pipe rather than as Middleware — both of those run inside Nest\'s own request-handling chain, where thrown exceptions ARE correctly caught and formatted by Exception Filters.',
        'If middleware-level logic genuinely must reject a request (e.g. a raw header check that needs to run before Nest\'s own routing is even resolved), handle the error response directly within the middleware itself using the underlying platform\'s res object (res.status(400).json({...})), rather than throwing and expecting a Nest Exception Filter to catch it — because it will not.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A thrown exception in middleware is NOT caught by an Exception Filter',
      language: 'typescript',
      code: `// api-key.middleware.ts
import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  use(req, res, next) {
    if (!req.headers['x-api-key']) {
      // This throw does NOT get caught by any @Catch() Exception
      // Filter, even a global one — middleware runs entirely before
      // Nest's own exception-handling chain begins.
      throw new BadRequestException('Missing API key');
    }
    next();
  }
}

// global-exception.filter.ts — registered globally, but NEVER sees
// the exception thrown above, because middleware is outside its reach.
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // This code never runs for the ApiKeyMiddleware throw — Express's
    // own default error handler (or an unhandled-error crash) takes
    // over instead, producing a very different-looking response.
  }
}`,
    },
    {
      label: 'Correct approaches: Guard (in-pipeline) or manual response (in middleware)',
      language: 'typescript',
      code: `// Option 1 — move the check into a Guard, which DOES run inside
// Nest's own exception-handling chain:
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    if (!req.headers['x-api-key']) {
      // This throw IS caught and formatted by Exception Filters,
      // because Guards run inside Nest's own request chain.
      throw new BadRequestException('Missing API key');
    }
    return true;
  }
}

// Option 2 — if the check truly must stay in middleware, respond
// directly instead of throwing:
@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  use(req, res, next) {
    if (!req.headers['x-api-key']) {
      res.status(400).json({ statusCode: 400, message: 'Missing API key' });
      return; // do not call next() — request stops here
    }
    next();
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team has a global Exception Filter that formats every error into a consistent { statusCode, message, timestamp } JSON shape, and it works correctly for every exception thrown from their controllers and guards. They add a new logging middleware that throws an exception when a malformed request ID header is detected, expecting the same consistent error format to appear — but instead they see a raw, differently-shaped error response (or a generic platform error page). Why?',
    hint: 'Where does middleware sit in NestJS\'s documented request-processing pipeline relative to where Guards, Interceptors, and Exception Filters operate?',
    solution: 'The exception thrown inside the middleware is not being caught by the team\'s global Exception Filter at all — it never reaches Nest\'s own exception-handling mechanism in the first place. NestJS\'s documented request lifecycle places Middleware before Guards even begin, running at the underlying HTTP platform (Express or Fastify) level, while Exception Filters are positioned to catch exceptions thrown from within Nest\'s own request-handling chain (Guards through Interceptors, wrapping the Handler). Since middleware runs entirely outside that chain, a thrown exception there falls through to the platform\'s own native error handling instead — which explains the differently-shaped, non-Nest-formatted error response the team is seeing. The fix is to move this validation logic into a Guard (which runs inside Nest\'s own chain and whose thrown exceptions ARE correctly caught and formatted by the global filter) rather than leaving it in middleware — or, if it must stay in middleware for some other reason, to construct and send the error response directly using the platform\'s res object instead of throwing and expecting a Nest filter to intervene.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A globally-registered NestJS Exception Filter catches every thrown exception anywhere in the request lifecycle, including inside custom middleware.',
      reality: 'This subtopic\'s theory and code example both show middleware sits entirely outside the in-Nest chain (Guards through Interceptors) where Exception Filters actually operate — a global filter never sees an exception thrown from inside a NestMiddleware implementation\'s use() method.'
    },
    {
      thought: 'Since NestJS wraps Express or Fastify, throwing a NestJS exception class (like BadRequestException) always behaves identically regardless of which layer of the request pipeline it\'s thrown from.',
      reality: 'This subtopic\'s exercise shows the opposite — the SAME BadRequestException throw produces a clean, filter-formatted response from a Guard but falls through to raw platform-level error handling when thrown from middleware, purely due to where each one sits in the documented request lifecycle.'
    },
    {
      thought: 'Validation or rejection logic that needs to run very early in a request (like a header check) belongs in middleware specifically because it runs first, and any error handling concerns can be addressed the same way as in a Guard.',
      reality: 'This subtopic\'s theory recommends the opposite for logic that needs Nest\'s exception-filter-formatted error responses — moving that logic into a Guard (which still runs early, before Interceptors and the handler, but INSIDE Nest\'s own exception-handling chain) rather than leaving it in middleware.'
    }
  ];
}
