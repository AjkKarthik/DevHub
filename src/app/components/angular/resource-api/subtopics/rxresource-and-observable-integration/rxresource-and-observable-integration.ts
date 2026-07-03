import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-rxresource-and-observable-integration-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './rxresource-and-observable-integration.html',
  styleUrl: './rxresource-and-observable-integration.scss',
})
export class RxresourceAndObservableIntegrationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'rxResource() — the RxJS-native sibling of resource()',
      points: [
        '<code>rxResource()</code> (from <code>&#64;angular/core/rxjs-interop</code>) is a variant of <code>resource()</code> whose <code>loader</code> RETURNS AN OBSERVABLE directly, instead of a Promise — <code>rxResource({ params: () =&gt; this.userId(), stream: ({ params }) =&gt; this.userService.getUser(params) })</code>. No <code>lastValueFrom()</code> wrapping needed, which the main resource() topic shows as the manual workaround.',
        'The Observable returned by <code>stream</code> is subscribed to internally, and its emissions become <code>resource.value()</code> — if the source Observable emits MULTIPLE times (not just once-and-complete, like an HTTP call), each new emission updates the resource\'s value reactively, which a plain Promise-based <code>resource()</code> genuinely cannot represent.',
      ],
    },
    {
      heading: 'When rxResource() is the better fit than resource() + lastValueFrom',
      points: [
        'If you already have an EXISTING service returning Observables (a common shape in any codebase with RxJS-based services built before <code>resource()</code> existed), <code>rxResource()</code> lets you adopt the resource pattern WITHOUT rewriting those services to return Promises — a much smaller migration surface.',
        'For a genuinely multi-emission source (a WebSocket-backed Observable, or an RxJS operator chain producing periodic updates), <code>rxResource()</code>\'s ability to reflect EVERY emission as a value update is a capability plain <code>resource()</code> does not have — a Promise resolves exactly once, so <code>lastValueFrom()</code> would only ever capture the FIRST emission (or throw with certain operators), silently dropping subsequent values.',
      ],
    },
    {
      heading: 'Cancellation semantics carry over from RxJS',
      points: [
        'When <code>params()</code> changes and a new <code>stream</code> Observable is created, <code>rxResource()</code> UNSUBSCRIBES from the previous Observable automatically — for a cold Observable backed by HTTP, this correctly cancels the underlying request, mirroring <code>resource()</code>\'s <code>abortSignal</code> cancellation but expressed through RxJS unsubscription instead.',
        'This means operators like <code>switchMap</code> inside the stream function compose naturally with rxResource\'s own automatic cancellation — you rarely need to add your own <code>switchMap</code> at the top level, since rxResource already cancels the PREVIOUS stream when params change.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, delay, interval, map, takeWhile } from 'rxjs';

// Simulates an existing RxJS-based service — no rewrite needed for rxResource
function fetchUser(id: number) {
  return of({ id, name: 'User #' + id }).pipe(delay(400));
}

// A genuinely multi-emission source — periodic updates, impossible with a plain Promise
function watchLiveCount() {
  return interval(1000).pipe(
    map(n => n + 1),
    takeWhile(n => n <= 5, true),
  );
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>rxResource — wraps an existing Observable-returning service, no lastValueFrom()</h3>
    <input type="number" [value]="userId()" (input)="userId.set(+$any($event.target).value)" />
    <p>Status: {{ userResource.status() }}</p>
    <p>{{ userResource.value()?.name }}</p>

    <h3>Multi-emission stream — value updates on EVERY emission, not just once</h3>
    <p>Live count: {{ liveResource.value() }}</p>
  \`,
})
export class App {
  userId = signal(1);

  userResource = rxResource({
    params: () => this.userId(),
    stream: ({ params }) => fetchUser(params),
  });

  liveResource = rxResource({
    params: () => true, // static params — runs once, then the stream itself keeps emitting
    stream: () => watchLiveCount(),
  });
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>rxResource and Observable integration</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change fetchUser\'s delay from 400ms to 1200ms, then rapidly change the userId input twice — confirm only the FINAL request\'s result is ever displayed (proving the previous stream was cancelled).',
    hint: 'The delay(400) becomes delay(1200) in fetchUser — since rxResource unsubscribes from the previous stream when params changes, only the last-requested userId\'s Observable actually resolves and updates userResource.value().',
    solution: `function fetchUser(id: number) {
  return of({ id, name: 'User #' + id }).pipe(delay(1200));
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'rxResource() is just resource() with an Observable wrapped in lastValueFrom() automatically, same behavior either way.',
      reality: 'rxResource() reflects EVERY emission from a multi-emission Observable as a value update — lastValueFrom() only ever captures a single (typically the last, or first depending on operators) emission, silently dropping the rest.',
    },
    {
      thought: 'adopting resource() requires rewriting all existing RxJS-based services to return Promises.',
      reality: 'rxResource() lets you keep existing Observable-returning services entirely unchanged — it subscribes to the Observable directly, no Promise conversion needed anywhere.',
    },
    {
      thought: 'when params changes, the previous stream\'s Observable keeps running in the background alongside the new one.',
      reality: 'rxResource() automatically unsubscribes from the previous stream Observable when params changes — for HTTP-backed Observables this correctly cancels the underlying request, mirroring resource()\'s abortSignal cancellation.',
    },
  ];
}
