import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-route-resolvers-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-route-resolvers.html',
  styleUrl: './testing-route-resolvers.scss',
})
export class TestingRouteResolversSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A ResolveFn is just a function — call it directly, same as a functional guard',
      points: [
        'Like <code>CanActivateFn</code>, a <code>ResolveFn</code> likely calls <code>inject()</code> internally, so testing it directly requires <code>TestBed.runInInjectionContext(() =&gt; postResolver(mockSnapshot, mockState))</code> — the SAME wrapping technique used for testing functional route guards, since both are plain functions that need a valid injection context to run in a test.',
        'Mock whatever service the resolver injects via the standard <code>TestBed.configureTestingModule({ providers: [{ provide: PostService, useValue: mockService }] })</code> BEFORE calling <code>runInInjectionContext</code> — controlling exactly what data (or error) the resolver receives.',
      ],
    },
    {
      heading: 'Testing the async and error/redirect paths',
      points: [
        'If the resolver returns an Observable or Promise, <code>await firstValueFrom(result as Observable&lt;Post&gt;)</code> (or simply <code>await result</code> for a Promise) resolves the actual value in the test — asserting on the resolved data confirms the resolver correctly transforms/passes through whatever the mocked service returned.',
        'To test the REDIRECT path (resolver returns a <code>UrlTree</code> when data is missing), mock the service to return <code>null</code>/empty, call the resolver, and assert the result IS a <code>UrlTree</code> — <code>expect(result instanceof UrlTree).toBe(true)</code> or, for a readable assertion, serialize it: <code>expect(router.serializeUrl(result as UrlTree)).toBe(\'/not-found\')</code>, exactly the same serialization technique used for testing guard redirects.',
      ],
    },
    {
      heading: 'Testing a component that CONSUMES resolved data',
      points: [
        'A component reading resolved data via <code>ActivatedRoute.data</code> needs a MOCK <code>ActivatedRoute</code> whose <code>data</code> property is an Observable emitting the shape the resolver would have produced: <code>{ provide: ActivatedRoute, useValue: { data: of({ post: mockPost }) } }</code> — the component under test never actually runs the real resolver; the mock simulates its OUTPUT.',
        'A component using <code>withComponentInputBinding()</code> instead (reading resolved data as a plain <code>input()</code>) is tested even more simply — just <code>fixture.componentRef.setInput(\'post\', mockPost)</code>, the SAME technique used for testing any signal input, with no <code>ActivatedRoute</code> mock needed at all.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/post.resolver.ts',
      content: `import { inject } from '@angular/core';
import { ResolveFn, Router, UrlTree } from '@angular/router';
import { PostService } from './post.service';

export interface Post { id: string; title: string; }

export const postResolver: ResolveFn<Post | UrlTree> = (route) => {
  const postService = inject(PostService);
  const router = inject(Router);
  const id = route.paramMap.get('id')!;

  const post = postService.getById(id);
  return post ?? router.createUrlTree(['/not-found']);
};
`,
    },
    {
      path: 'src/app/post.service.ts',
      content: `import { Injectable } from '@angular/core';
import { Post } from './post.resolver';

@Injectable({ providedIn: 'root' })
export class PostService {
  getById(id: string): Post | null {
    throw new Error('real implementation elsewhere');
  }
}
`,
    },
    {
      path: 'src/app/post.resolver.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, convertToParamMap } from '@angular/router';
import { postResolver } from './post.resolver';
import { PostService } from './post.service';

describe('postResolver', () => {
  it('returns the post when found', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PostService, useValue: { getById: () => ({ id: '1', title: 'Hello' }) } }],
    });

    const mockRoute = { paramMap: convertToParamMap({ id: '1' }) } as any;
    const result = TestBed.runInInjectionContext(() => postResolver(mockRoute, {} as any));

    expect(result).toEqual({ id: '1', title: 'Hello' });
  });

  it('redirects to /not-found when the post is missing', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PostService, useValue: { getById: () => null } }],
    });

    const mockRoute = { paramMap: convertToParamMap({ id: '999' }) } as any;
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => postResolver(mockRoute, {} as any));

    // Serializing gives a readable, reliable assertion — same technique as testing guard redirects
    expect(router.serializeUrl(result as UrlTree)).toBe('/not-found');
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { PostService } from './post.service';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>The resolver under test — see post.resolver.spec.ts for the actual tests</h3>
    <p>This app demonstrates the resolver's dependency; the resolver itself
    is exercised directly by TestBed.runInInjectionContext() in the spec file.</p>
  \`,
})
export class App {
  private postService = inject(PostService);
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
  <head><title>Testing route resolvers</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third test asserting that when getById returns a post with an empty title, the resolver still returns that post as-is (no special empty-title handling exists in this resolver).',
    hint: 'Mock getById to return { id: \'2\', title: \'\' }, call the resolver, and expect(result).toEqual({ id: \'2\', title: \'\' }) — this confirms the resolver passes through whatever the service returns without extra validation.',
    solution: `it('passes through a post with an empty title unchanged', () => {
  TestBed.configureTestingModule({
    providers: [{ provide: PostService, useValue: { getById: () => ({ id: '2', title: '' }) } }],
  });

  const mockRoute = { paramMap: convertToParamMap({ id: '2' }) } as any;
  const result = TestBed.runInInjectionContext(() => postResolver(mockRoute, {} as any));

  expect(result).toEqual({ id: '2', title: '' });
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a ResolveFn requires spinning up a full router and navigating to trigger it.',
      reality: 'a ResolveFn is just a plain function — calling it directly (wrapped in TestBed.runInInjectionContext, since it likely uses inject() internally) is the most direct way to test both its success and redirect branches, mirroring how functional guards are tested.',
    },
    {
      thought: 'a component consuming resolved data must be tested by actually running the real resolver through a full route navigation.',
      reality: 'a mock ActivatedRoute whose data property emits the shape the resolver WOULD have produced is enough to test the component in isolation — the real resolver never needs to run in a component-level test.',
    },
    {
      thought: 'a resolver\'s UrlTree redirect result should be compared directly to another UrlTree instance with toEqual().',
      reality: 'serializing it with router.serializeUrl() (the same technique used for testing guard redirects) gives a far more readable and reliable assertion than comparing UrlTree object structures directly.',
    },
  ];
}
