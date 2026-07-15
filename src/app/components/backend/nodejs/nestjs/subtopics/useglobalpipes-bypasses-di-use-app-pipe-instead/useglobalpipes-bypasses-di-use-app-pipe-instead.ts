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
  templateUrl: './useglobalpipes-bypasses-di-use-app-pipe-instead.html',
  styleUrl: './useglobalpipes-bypasses-di-use-app-pipe-instead.scss'
})
export class UseglobalpipesBypassesDiUseAppPipeInsteadSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own bootstrap() code sample calls app.useGlobalPipes(new ValidationPipe(...)) and app.useGlobalInterceptors(new LoggingInterceptor()) directly — this works fine for those two specific examples, but silently breaks the moment a global pipe/guard/interceptor/filter needs an injected dependency',
      points: [
        'app.useGlobalPipes(), useGlobalGuards(), useGlobalInterceptors(), and useGlobalFilters() all construct their argument with a plain "new SomeClass(...)" call inside main.ts\'s bootstrap() function — a location entirely OUTSIDE any NestJS module, and therefore outside Nest\'s dependency injection container\'s reach.',
        'NestJS\'s own documentation states this directly for guards (identical wording applies to pipes, interceptors, and filters): a global guard "registered from outside of any module... cannot inject dependencies since this is done outside the context of any module." The ValidationPipe and LoggingInterceptor in the main page\'s own examples happen to have no constructor dependencies, so this limitation never surfaces — but it is a real, documented restriction, not a hypothetical edge case.',
        'The documented fix: register the pipe/guard/interceptor/filter as an ordinary PROVIDER inside a module\'s own providers array, using one of the special DI tokens from @nestjs/core — APP_PIPE, APP_GUARD, APP_INTERCEPTOR, or APP_FILTER. Because Nest\'s own DI container constructs providers registered this way, THIS version of a "global" pipe/guard/interceptor/filter can have its own constructor-injected dependencies (a ConfigService, a database connection, anything else) — while still applying globally to every route, exactly like the useGlobalXxx() version does.',
      ]
    },
    {
      heading: 'Why this specific failure mode is easy to miss until it happens',
      points: [
        'A pipe or interceptor with no constructor dependencies (like the main page\'s own ValidationPipe/LoggingInterceptor examples) works completely correctly with useGlobalPipes()/useGlobalInterceptors() — there is nothing wrong with those specific examples. The problem only appears the moment someone later adds a constructor dependency to that same class (e.g. injecting a ConfigService to read a feature flag inside the pipe), at which point the DI silently fails with an "undefined" dependency rather than a clear, immediate error pointing at the real cause.',
        'Both approaches genuinely apply globally to every route in the application — APP_PIPE/APP_GUARD/etc. is not a "more limited" alternative, it is the DI-capable version of the exact same global-scope behavior. There is no reason to prefer useGlobalXxx() once a project has adopted APP_PIPE-style registration, other than it being marginally less code for the simplest, dependency-free case.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Fails silently: DI does not work here',
      language: 'typescript',
      code: `// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Constructed with "new" — OUTSIDE any module, outside Nest's DI.
  app.useGlobalPipes(new CustomValidationPipe());
  await app.listen(3000);
}
bootstrap();

// custom-validation.pipe.ts
@Injectable()
export class CustomValidationPipe implements PipeTransform {
  // Nest's DI container never touched this instance — it was built
  // with a plain "new" call in main.ts — so this constructor argument
  // is simply undefined at runtime, with no clear error pointing here.
  constructor(private config: ConfigService) {}

  transform(value: any) {
    if (this.config.get('STRICT_VALIDATION')) { /* ... */ }
    return value;
  }
}`,
    },
    {
      label: 'Fixed: APP_PIPE token registers it through Nest\'s own DI',
      language: 'typescript',
      code: `// app.module.ts
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { CustomValidationPipe } from './custom-validation.pipe';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: CustomValidationPipe, // Nest's DI container builds this
    },
  ],
})
export class AppModule {}

// custom-validation.pipe.ts — UNCHANGED from the broken version above
@Injectable()
export class CustomValidationPipe implements PipeTransform {
  // Now correctly injected, because Nest's own DI container
  // constructed this instance as a real provider.
  constructor(private config: ConfigService) {}

  transform(value: any) {
    if (this.config.get('STRICT_VALIDATION')) { /* ... */ }
    return value;
  }
}
// Still applies globally to every route — same scope as
// app.useGlobalPipes() — just constructed the DI-capable way.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer\'s LoggingInterceptor works perfectly when registered with app.useGlobalInterceptors(new LoggingInterceptor()). They then add a constructor dependency — a MetricsService they want to inject to also record request timing to a metrics backend — and the app crashes at startup, or MetricsService is undefined inside the interceptor at runtime. What is the root cause, and what is the fix?',
    hint: 'Where is app.useGlobalInterceptors() called relative to any NestJS module — is that location inside Nest\'s dependency injection container\'s reach at all?',
    solution: 'The root cause is that app.useGlobalInterceptors(new LoggingInterceptor()) constructs the LoggingInterceptor instance with a plain "new" call inside main.ts\'s bootstrap() function — a location entirely outside any NestJS module, and therefore outside the reach of Nest\'s dependency injection container. As long as LoggingInterceptor had zero constructor dependencies, this worked fine, because there was nothing for the DI container to need to supply. The moment a constructor dependency (MetricsService) is added, there is no DI container involved in constructing this particular instance to actually resolve and inject it — the dependency is simply never provided. The fix is to switch from useGlobalInterceptors() to registering the interceptor as a provider inside a module\'s own providers array using the APP_INTERCEPTOR token from @nestjs/core: { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }. Since Nest\'s own DI container constructs providers registered this way, MetricsService (and any other constructor dependency) will now be correctly resolved and injected — while the interceptor continues to apply globally to every route, exactly as before.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'app.useGlobalPipes(), useGlobalGuards(), useGlobalInterceptors(), and useGlobalFilters() are simply a more concise alternative to APP_PIPE/APP_GUARD/APP_INTERCEPTOR/APP_FILTER — interchangeable, with no real functional difference between them.',
      reality: 'This subtopic\'s theory shows a real, documented functional difference — useGlobalXxx() constructs its argument OUTSIDE Nest\'s dependency injection container, so any pipe/guard/interceptor/filter registered this way CANNOT have its own injected constructor dependencies, unlike the APP_PIPE-style provider registration.'
    },
    {
      thought: 'Since the main page\'s own bootstrap() code example uses app.useGlobalPipes(new ValidationPipe(...)) and app.useGlobalInterceptors(new LoggingInterceptor()) successfully, this pattern is always safe to use for any global pipe or interceptor.',
      reality: 'This subtopic\'s theory clarifies those specific examples work only because ValidationPipe and LoggingInterceptor happen to have no constructor dependencies — the same pattern silently breaks DI the moment a constructor dependency is added to a class registered this way.'
    },
    {
      thought: 'A pipe/guard/interceptor/filter registered via the APP_PIPE/APP_GUARD/etc. token pattern has a more limited scope than one registered with useGlobalPipes()/useGlobalGuards()/etc. — it only applies within the module where it\'s declared.',
      reality: 'This subtopic\'s code example and exercise both confirm the opposite — a provider registered with APP_PIPE (or the equivalent tokens) applies GLOBALLY to every route in the application, the exact same scope as useGlobalPipes(), just constructed through Nest\'s DI container instead of a plain "new" call.'
    }
  ];
}
