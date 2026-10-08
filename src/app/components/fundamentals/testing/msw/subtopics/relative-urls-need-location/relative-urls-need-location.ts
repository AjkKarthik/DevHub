import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-relative-urls-need-location',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './relative-urls-need-location.html',
  styleUrl: './relative-urls-need-location.scss'
})
export class RelativeUrlsNeedLocationSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Measured with msw 2.15 in Node",
      "points": [
        "Relative URLs are resolved against the current page URL. Under jsdom (the environment for the page's React component tests) that is <code>http://localhost/</code>, so <code>fetch(\"/api/users\")</code> becomes <code>http://localhost/api/users</code> and the relative handler matches.",
        "In a plain Node environment there is no page URL. <code>fetch(\"/api/users\")</code> threw <code>ERR_INVALID_URL</code> immediately, so MSW was never involved.",
        "Fetching the absolute <code>http://localhost/api/users</code> in Node did not match the <code>/api/users</code> handler either. MSW reported it as unhandled, and under \"warn\" it went to the network (ECONNREFUSED).",
        "This matters for API client modules tested with <code>environment: \"node\"</code>. Their handlers and their code both need absolute URLs."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measured",
      "language": "typescript",
      "code": "// testEnvironment: node\nconst server = setupServer(http.get('/api/users', () => HttpResponse.json([])));\nserver.listen();\n\nawait fetch('/api/users');\n// TypeError: Failed to parse URL (ERR_INVALID_URL) - before MSW\n\nawait fetch('http://localhost/api/users');\n// [MSW] Warning: ... GET http://localhost/api/users   (handler did not match)"
    },
    {
      "label": "Absolute URLs for node tests",
      "language": "typescript",
      "code": "// config.ts\nexport const API_BASE = process.env.API_BASE ?? 'https://api.example.com';\n\n// handlers.ts\nexport const handlers = [\n  http.get(`${API_BASE}/users`, () => HttpResponse.json([{ id: 1 }])),\n];\n\n// usersClient.ts\nexport const getUsers = () => fetch(`${API_BASE}/users`).then(r => r.json());"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "The same handlers file is shared by component tests (jsdom) and API client tests (node). Which handler style works for both?",
    "hint": "jsdom can resolve relative URLs; node cannot.",
    "solution": "Absolute URLs built from one shared base (such as API_BASE). They match in both environments, as long as the app code uses the same base. Relative handlers only work where a page URL exists."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "MSW resolves relative handler paths against localhost everywhere.",
      "reality": "Without a document location there is nothing to resolve against, so a relative handler does not match absolute Node requests."
    },
    {
      "thought": "fetch in Node accepts relative URLs like the browser.",
      "reality": "Node's fetch requires an absolute URL and throws ERR_INVALID_URL otherwise."
    }
  ];
}
