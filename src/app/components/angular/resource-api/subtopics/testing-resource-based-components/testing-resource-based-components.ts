import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-resource-based-components-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-resource-based-components.html',
  styleUrl: './testing-resource-based-components.scss',
})
export class TestingResourceBasedComponentsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Why a resource-based component needs an async test, not a sync one',
      points: [
        'Unlike a plain <code>signal()</code> whose value is available synchronously the instant you call <code>.set()</code>, a <code>resource()</code>\'s loader runs a REAL (or mocked) asynchronous operation — <code>fixture.detectChanges()</code> alone does NOT wait for the loader\'s Promise to settle, so asserting on <code>resource.value()</code> immediately after creating the fixture reads the PRE-resolution state (<code>undefined</code>, status <code>loading</code>).',
        'The correct pattern: <code>await fixture.whenStable()</code> (or wrap the test in <code>async</code> and <code>await</code> the loader\'s own Promise directly) BEFORE asserting on the resolved value — this waits for all pending microtasks, including the resource\'s internal loader Promise, to settle.',
      ],
    },
    {
      heading: 'Mocking the loader\'s dependency (fetch, HttpClient, or a service)',
      points: [
        'If the loader calls <code>fetch()</code> directly, mock <code>window.fetch</code> with a Jasmine spy returning a resolved Promise wrapping a fake <code>Response</code> object — the exact same technique used for any code calling the global fetch API, since <code>resource()</code> itself has no special test-only API for this.',
        'For <code>httpResource()</code>, use the STANDARD <code>HttpTestingController</code> setup (<code>provideHttpClient()</code> + <code>provideHttpClientTesting()</code>) exactly as you would for a service using <code>HttpClient</code> directly — <code>httpResource()</code> goes through the real interceptor chain, so <code>httpTesting.expectOne(url)</code> and <code>req.flush(mockData)</code> work identically to testing any other HTTP-calling code.',
      ],
    },
    {
      heading: 'Testing error states and reload behavior',
      points: [
        'To test the ERROR path, make the mocked loader dependency REJECT (or flush an error response for <code>httpResource()</code> via <code>req.flush(null, { status: 500, statusText: \'Server Error\' })</code>), then await stability and assert <code>resource.error()</code> is populated and <code>resource.status()</code> equals <code>\'error\'</code>.',
        'To test <code>reload()</code>, call it explicitly in the test, await stability again, and assert the loader/mock was called a SECOND time (e.g. via a spy call count) — this is the only way to verify a "Refresh" button\'s click handler actually triggers a genuine re-fetch rather than silently doing nothing.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/user-card.ts',
      content: `import { Component, resource, input } from '@angular/core';

interface User { id: number; name: string; }

function fetchUser(id: number): Promise<User> {
  return fetch('/api/users/' + id).then(r => r.json());
}

@Component({
  selector: 'app-user-card',
  standalone: true,
  template: \`
    @if (userResource.isLoading()) {
      <p>Loading...</p>
    } @else if (userResource.error()) {
      <p>Failed to load user.</p>
    } @else if (userResource.value(); as user) {
      <p>{{ user.name }}</p>
    }
    <button (click)="userResource.reload()">Refresh</button>
  \`,
})
export class UserCardComponent {
  userId = input.required<number>();
  userResource = resource({
    params: () => this.userId(),
    loader: ({ params }) => fetchUser(params),
  });
}
`,
    },
    {
      path: 'src/app/user-card.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { UserCardComponent } from './user-card';

describe('UserCardComponent (resource-based)', () => {
  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    fetchSpy = spyOn(window, 'fetch');
  });

  it('shows the resolved user name after the loader settles', async () => {
    fetchSpy.and.returnValue(
      Promise.resolve({ json: () => Promise.resolve({ id: 1, name: 'Alice' }) } as Response),
    );

    const fixture = TestBed.createComponent(UserCardComponent);
    fixture.componentRef.setInput('userId', 1);
    fixture.detectChanges();

    // detectChanges() alone does NOT wait for the loader's Promise
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Alice');
  });

  it('shows an error state when the loader rejects', async () => {
    fetchSpy.and.returnValue(Promise.reject(new Error('network error')));

    const fixture = TestBed.createComponent(UserCardComponent);
    fixture.componentRef.setInput('userId', 1);
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Failed to load user');
  });

  it('reload() triggers a second fetch call', async () => {
    fetchSpy.and.returnValue(
      Promise.resolve({ json: () => Promise.resolve({ id: 1, name: 'Alice' }) } as Response),
    );

    const fixture = TestBed.createComponent(UserCardComponent);
    fixture.componentRef.setInput('userId', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.userResource.reload();
    await fixture.whenStable();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { UserCardComponent } from './user-card';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UserCardComponent],
  template: \`
    <h3>The resource-based component under test — see user-card.spec.ts</h3>
    <app-user-card [userId]="1" />
  \`,
})
export class App {}
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
  <head><title>Testing resource()-based components</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a fourth test asserting that BEFORE awaiting whenStable(), the component still shows "Loading..." (proving detectChanges() alone doesn\'t wait for the loader).',
    hint: 'After fixture.detectChanges() but BEFORE await fixture.whenStable(), assert fixture.nativeElement.textContent contains "Loading..." — this proves the synchronous state is still pending.',
    solution: `it('shows Loading before the loader Promise has settled', () => {
  fetchSpy.and.returnValue(
    Promise.resolve({ json: () => Promise.resolve({ id: 1, name: 'Alice' }) } as Response),
  );

  const fixture = TestBed.createComponent(UserCardComponent);
  fixture.componentRef.setInput('userId', 1);
  fixture.detectChanges();

  // No await here — the loader Promise has not resolved yet
  expect(fixture.nativeElement.textContent).toContain('Loading...');
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'fixture.detectChanges() waits for a resource()\'s loader to finish, the same way it handles synchronous signal updates.',
      reality: 'detectChanges() does NOT wait for the loader\'s Promise — you must await fixture.whenStable() (or the loader\'s own Promise) before asserting on the resolved resource.value().',
    },
    {
      thought: 'httpResource() needs a special resource-specific testing utility, different from testing any other HttpClient-based code.',
      reality: 'httpResource() goes through the same interceptor chain as HttpClient — the standard HttpTestingController setup (provideHttpClientTesting, expectOne, flush) works identically, no special API needed.',
    },
    {
      thought: 'testing that a "Refresh" button works just means clicking it and checking the button doesn\'t error.',
      reality: 'a meaningful test asserts the underlying loader/fetch mock was actually called a SECOND time after calling reload() — otherwise a button that silently does nothing on click would still pass a weaker test.',
    },
  ];
}
