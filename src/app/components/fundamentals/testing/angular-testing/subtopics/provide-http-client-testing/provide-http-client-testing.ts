import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-provide-http-client-testing',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './provide-http-client-testing.html',
  styleUrl: './provide-http-client-testing.scss'
})
export class ProvideHttpClientTestingSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "What changed",
      "points": [
        "In <code>@angular/common</code> 22 (installed in this repo), the type definition of <code>HttpClientTestingModule</code> carries <code>@deprecated Add provideHttpClientTesting() to your providers instead.</code>",
        "The replacement is two providers: <code>provideHttpClient()</code>, which sets up <code>HttpClient</code> the same way the app does, and <code>provideHttpClientTesting()</code>, which swaps in the testing backend. Angular's HTTP testing guide asks for them in that order.",
        "This mirrors how standalone apps configure HTTP. Interceptors and features passed to <code>provideHttpClient(withInterceptors([...]))</code> in the test behave as in production, which the module version could not easily express.",
        "The page's quick reference, theory, Service Test tab, quiz and revision card now use the providers. <code>HttpTestingController</code> is unchanged."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Before",
      "language": "typescript",
      "code": "import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';\n\nTestBed.configureTestingModule({\n  imports: [HttpClientTestingModule],   // deprecated\n  providers: [UserService],\n});"
    },
    {
      "label": "Now",
      "language": "typescript",
      "code": "import { provideHttpClient, withInterceptors } from '@angular/common/http';\nimport { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';\n\nTestBed.configureTestingModule({\n  providers: [\n    UserService,\n    provideHttpClient(withInterceptors([authInterceptor])),  // same as the app\n    provideHttpClientTesting(),\n  ],\n});\nconst controller = TestBed.inject(HttpTestingController);"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "An app adds an <code>authInterceptor</code> that sets an Authorization header. Write the TestBed providers and the assertion that checks the header on the request to <code>/api/users</code>.",
    "hint": "The interceptor must be registered on provideHttpClient in the test, then inspect req.request.headers.",
    "solution": "providers: [UserService, provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()]. After subscribing: const req = controller.expectOne('/api/users'); expect(req.request.headers.get('Authorization')).toBe('Bearer test-token'); req.flush([]);"
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Deprecated means the module has already stopped working.",
      "reality": "It still works, but new code should use the providers, and deprecated APIs can be removed in a later major version."
    },
    {
      "thought": "provideHttpClientTesting() replaces provideHttpClient().",
      "reality": "You need both: one creates HttpClient, the other replaces its backend."
    }
  ];
}
