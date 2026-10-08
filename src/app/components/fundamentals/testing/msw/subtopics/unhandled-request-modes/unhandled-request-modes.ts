import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-unhandled-request-modes',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './unhandled-request-modes.html',
  styleUrl: './unhandled-request-modes.scss'
})
export class UnhandledRequestModesSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Measured with msw 2.15 in Node",
      "points": [
        "With <code>onUnhandledRequest: \"warn\"</code>, a request to <code>https://api.example.com/other</code> with no handler printed \"[MSW] Warning: intercepted a request without a matching request handler\" and was then sent to the real network. It failed with ENOTFOUND only because that host does not exist.",
        "With <code>\"error\"</code>, the same request printed \"[MSW] Error: ...\" and the <code>fetch</code> call rejected with \"Cannot bypass a request when using the error strategy\". Handled requests in the same run still returned their mocked data, and the process kept going.",
        "So \"error\" does not crash the suite: it makes the one unhandled request fail, which fails the test that made it. \"warn\" is the riskier choice in tests, because a forgotten handler can reach a real staging or production API.",
        "The page's mistake and its setup tab now use \"error\", and the explanation describes the measured behaviour."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measured",
      "language": "typescript",
      "code": "server.listen({ onUnhandledRequest: 'warn' });\nawait fetch('https://api.example.com/other');\n// [MSW] Warning: intercepted a request without a matching request handler\n// -> sent for real: fetch failed (getaddrinfo ENOTFOUND api.example.com)\n\nserver.listen({ onUnhandledRequest: 'error' });\nawait fetch('https://api.example.com/other');\n// [MSW] Error: intercepted a request without a matching request handler\n// -> rejects: Cannot bypass a request when using the \"error\" strategy"
    },
    {
      "label": "Selective strategy",
      "language": "typescript",
      "code": "server.listen({\n  onUnhandledRequest(request, print) {\n    const url = new URL(request.url);\n    if (url.pathname.startsWith('/static/')) return;   // allow\n    print.error();                                       // fail the rest\n  },\n});"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A test suite uses \"warn\". A developer adds a new API call to a component but forgets the handler, and CI has network access to the staging API. What does the test see, and why is that worse than a failure?",
    "hint": "Under warn the request is not blocked.",
    "solution": "The request reaches the real staging API and the test sees whatever staging returns. The test may pass or fail depending on staging data, and it may even change staging data. A failure under \"error\" points straight at the missing handler instead."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "\"error\" throws an exception that stops the whole test run.",
      "reality": "It rejects the single unhandled request; other tests and handled requests are unaffected."
    },
    {
      "thought": "\"warn\" keeps unhandled requests away from the network.",
      "reality": "It only prints a warning and then performs the request for real."
    }
  ];
}
