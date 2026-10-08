import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-router-testing-harness',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './router-testing-harness.html',
  styleUrl: './router-testing-harness.scss'
})
export class RouterTestingHarnessTopicSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "What the typings say",
      "points": [
        "In <code>@angular/router</code> 22, <code>RouterTestingModule</code> is marked <code>@deprecated Use provideRouter or RouterModule/RouterModule.forRoot instead.</code>",
        "<code>RouterTestingHarness.create(initialUrl?)</code> builds its own root component containing a <code>RouterOutlet</code>. <code>navigateByUrl(url)</code> navigates, waits for completion and returns the activated component, or <code>null</code> if a guard blocked it.",
        "The harness also exposes <code>routeNativeElement</code> and <code>detectChanges()</code>, so a routed component can be checked through its DOM without writing a host component.",
        "The page's two Router QnAs now use <code>provideRouter</code> and point to the harness. Spying on <code>Router.navigate</code> is still fine for components that only trigger navigation."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Routed component",
      "language": "typescript",
      "code": "import { provideRouter } from '@angular/router';\nimport { RouterTestingHarness } from '@angular/router/testing';\n\nit('shows the user page for /users/1', async () => {\n  TestBed.configureTestingModule({\n    providers: [provideRouter([{ path: 'users/:id', component: UserPageComponent }])],\n  });\n\n  const harness = await RouterTestingHarness.create();\n  const page = await harness.navigateByUrl('/users/1');\n\n  expect(page).toBeInstanceOf(UserPageComponent);\n  expect(harness.routeNativeElement?.textContent).toContain('User 1');\n});"
    },
    {
      "label": "Guard that redirects",
      "language": "typescript",
      "code": "TestBed.configureTestingModule({\n  providers: [provideRouter([\n    { path: 'admin', component: AdminComponent, canActivate: [() => inject(Router).parseUrl('/login')] },\n    { path: 'login', component: LoginComponent },\n  ])],\n});\n\nconst harness = await RouterTestingHarness.create();\nawait harness.navigateByUrl('/admin');\nexpect(TestBed.inject(Router).url).toBe('/login');"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Why is RouterTestingHarness a better fit than spying on Router.navigate when testing that /admin redirects to /login?",
    "hint": "Who performs the redirect?",
    "solution": "The redirect is done by the guard during real navigation, not by the component calling navigate. A spy on navigate never sees it. The harness runs the real router with the real guard, so you can assert on the final URL or the rendered component."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "RouterTestingModule is required to use the router in tests.",
      "reality": "provideRouter works in TestBed the same way it works in the app; the testing module is deprecated."
    },
    {
      "thought": "Routed components need a hand-written host component with a router-outlet.",
      "reality": "RouterTestingHarness creates that host for you."
    }
  ];
}
