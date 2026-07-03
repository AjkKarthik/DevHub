import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-test-doubles-and-mocking-strategies-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './test-doubles-and-mocking-strategies.html',
  styleUrl: './test-doubles-and-mocking-strategies.scss',
})
export class TestDoublesAndMockingStrategiesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'jasmine.createSpyObj — mocking a service\'s whole interface at once',
      points: [
        '<code>jasmine.createSpyObj(\'UserService\', [\'getUser\', \'saveUser\'])</code> creates a fake object with BOTH methods pre-configured as spies in ONE call — far less boilerplate than manually creating <code>{ getUser: jasmine.createSpy(), saveUser: jasmine.createSpy() }</code>.',
        'Configure return values per-method with <code>.and.returnValue(...)</code> or <code>.and.resolveTo(...)</code> (for a Promise) — <code>mockUserService.getUser.and.returnValue(of({ id: 1, name: \'Alice\' }))</code> makes the spy return a specific Observable when called, letting you test the CONSUMER\'s reaction to that data without a real service.',
      ],
    },
    {
      heading: 'Shallow vs. deep rendering — NO_ERRORS_SCHEMA and its tradeoffs',
      points: [
        '<code>schemas: [NO_ERRORS_SCHEMA]</code> in <code>configureTestingModule</code> tells Angular to IGNORE unknown elements and attributes in the template instead of throwing — this lets you test a PARENT component\'s logic without providing/importing every CHILD component it uses, a "shallow render" that isolates just the component under test.',
        'The tradeoff: with <code>NO_ERRORS_SCHEMA</code>, child components render as EMPTY custom elements with no content — you cannot assert on anything the child WOULD have rendered, and a typo in a child selector or a genuinely broken child binding is silently swallowed rather than caught. Use it deliberately for true unit isolation, not as a default reflex to silence template errors.',
      ],
    },
    {
      heading: 'TestBed.overrideComponent — swapping a child for a test stub',
      points: [
        'A more surgical alternative to <code>NO_ERRORS_SCHEMA</code>: <code>TestBed.overrideComponent(RealChildComponent, { set: { template: \'&lt;p&gt;stub&lt;/p&gt;\' } })</code> replaces a specific child\'s template with a minimal stub while keeping Angular\'s normal template-checking active for everything else — you still get compile-time safety on the PARENT\'s usage of the child\'s selector/inputs, unlike blanket <code>NO_ERRORS_SCHEMA</code>.',
        'This is the right tool when a child component is EXPENSIVE to render in tests (e.g., it initializes a chart library or makes its own HTTP calls) but you still want genuine template validation for the rest of the component tree.',
      ],
    },
    {
      heading: 'Deciding: real service, spy, or fake?',
      points: [
        'REAL service: use when the service is PURE logic with no I/O (a formatting/validation utility) — no reason to mock something with no side effects.',
        'SPY (jasmine.createSpyObj): use for services with I/O (HTTP, storage, timers) where you need to both CONTROL what it returns and ASSERT it was called correctly — the default choice for most service dependencies in component tests.',
        'FAKE (a hand-written lightweight class implementing the same shape): use when a service has meaningful INTERNAL STATE that a test needs to manipulate across several calls (e.g., a fake in-memory cart service) — richer than a spy, still far lighter than the real implementation.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/user-profile.ts',
      content: `import { Component, inject, signal } from '@angular/core';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  template: \`
    <p>{{ name() }}</p>
    <button (click)="save()">Save</button>
  \`,
})
export class UserProfileComponent {
  private userService = inject(UserService);
  name = signal('');

  ngOnInit() {
    this.userService.getUser(1).subscribe(u => this.name.set(u.name));
  }

  save() {
    this.userService.saveUser({ id: 1, name: this.name() });
  }
}
`,
    },
    {
      path: 'src/app/user.service.ts',
      content: `import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface User { id: number; name: string; }

@Injectable({ providedIn: 'root' })
export class UserService {
  getUser(id: number): Observable<User> { throw new Error('real implementation elsewhere'); }
  saveUser(user: User): Observable<void> { throw new Error('real implementation elsewhere'); }
}
`,
    },
    {
      path: 'src/app/user-profile.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UserProfileComponent } from './user-profile';
import { UserService } from './user.service';

describe('UserProfileComponent — jasmine.createSpyObj mocking', () => {
  it('displays the name returned by the mocked service', () => {
    // ONE call creates spies for BOTH methods
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUser', 'saveUser']);
    userServiceSpy.getUser.and.returnValue(of({ id: 1, name: 'Alice' }));

    TestBed.configureTestingModule({
      imports: [UserProfileComponent],
      providers: [{ provide: UserService, useValue: userServiceSpy }],
    });

    const fixture = TestBed.createComponent(UserProfileComponent);
    fixture.detectChanges(); // triggers ngOnInit -> getUser()

    expect(fixture.componentInstance.name()).toBe('Alice');
    expect(userServiceSpy.getUser).toHaveBeenCalledWith(1);
  });

  it('calls saveUser with the current name when Save is clicked', () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUser', 'saveUser']);
    userServiceSpy.getUser.and.returnValue(of({ id: 1, name: 'Bilal' }));
    userServiceSpy.saveUser.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      imports: [UserProfileComponent],
      providers: [{ provide: UserService, useValue: userServiceSpy }],
    });

    const fixture = TestBed.createComponent(UserProfileComponent);
    fixture.detectChanges();

    fixture.componentInstance.save();

    expect(userServiceSpy.saveUser).toHaveBeenCalledWith({ id: 1, name: 'Bilal' });
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { UserProfileComponent } from './user-profile';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UserProfileComponent],
  template: \`
    <h3>The component under test — see user-profile.spec.ts for the mocking strategy</h3>
    <app-user-profile />
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
  <head><title>Test doubles and mocking strategies</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third test that configures getUser to return an Observable that never emits (use NEVER from rxjs, or of() with no arguments won\'t work — use EMPTY or a Subject), and assert name() stays empty, simulating a slow/hanging request.',
    hint: 'import { NEVER } from \'rxjs\'; then userServiceSpy.getUser.and.returnValue(NEVER); — since NEVER never emits, name() should remain its initial empty string after detectChanges().',
    solution: `import { NEVER } from 'rxjs';

it('shows nothing while the request is still pending', () => {
  const userServiceSpy = jasmine.createSpyObj('UserService', ['getUser', 'saveUser']);
  userServiceSpy.getUser.and.returnValue(NEVER);

  TestBed.configureTestingModule({
    imports: [UserProfileComponent],
    providers: [{ provide: UserService, useValue: userServiceSpy }],
  });

  const fixture = TestBed.createComponent(UserProfileComponent);
  fixture.detectChanges();

  expect(fixture.componentInstance.name()).toBe('');
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'NO_ERRORS_SCHEMA is a safe default to add whenever a test complains about an unknown element.',
      reality: 'it silently swallows genuine bugs like a typo in a child selector or a broken input binding — it should be a deliberate choice for true shallow-rendering isolation, not a reflex fix for template errors.',
    },
    {
      thought: 'jasmine.createSpyObj and manually building an object of individual jasmine.createSpy() calls are just two ways to write the same thing.',
      reality: 'createSpyObj creates spies for an entire list of method names in ONE call — meaningfully less boilerplate than manually constructing the object, especially for services with several methods.',
    },
    {
      thought: 'a real service should always be replaced with a mock in component tests, regardless of what it does.',
      reality: 'a service with no I/O and no side effects (pure formatting/validation logic) has no reason to be mocked — reserve mocking for services with I/O, timers, or other real side effects that a test needs to control.',
    },
  ];
}
