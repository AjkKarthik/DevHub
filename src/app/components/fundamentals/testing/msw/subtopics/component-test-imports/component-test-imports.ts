import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-component-test-imports',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './component-test-imports.html',
  styleUrl: './component-test-imports.scss'
})
export class ComponentTestImportsSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "What the error test needs",
      "points": [
        "The error test overrides the default handler with <code>server.use(http.get(\"/api/users\", () =&gt; HttpResponse.json(..., { status: 500 })))</code>. That line uses three names: <code>server</code>, <code>http</code> and <code>HttpResponse</code>.",
        "The tab imported none of them. <code>server</code> lives in the page's own <code>src/test/setup.ts</code> (it is exported there), and <code>http</code>/<code>HttpResponse</code> come from <code>msw</code>. Without the imports the test fails with \"server is not defined\".",
        "The page's Challenge already shows the correct imports, which is a useful cross-check: the starter code imports <code>http</code>, <code>HttpResponse</code> and <code>server</code> before calling <code>server.use</code>.",
        "The Component Test tab now has the same three imports."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Fixed imports",
      "language": "typescript",
      "code": "import { render, screen } from '@testing-library/react';\nimport { http, HttpResponse } from 'msw';\nimport { server } from '../test/setup';\nimport { UserList } from './UserList';\n\ntest('shows error when API fails', async () => {\n  server.use(\n    http.get('/api/users', () =>\n      HttpResponse.json({ message: 'Server error' }, { status: 500 }),\n    ),\n  );\n  render(<UserList />);\n  expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load');\n});"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "The setup file is listed in <code>setupFiles</code> and also imported by the test for <code>server</code>. Is there a risk of two servers being started?",
    "hint": "Think about module caching inside one test file.",
    "solution": "Within one test file the module is evaluated once and cached, so the import returns the same server the setup file created. Problems appear only if the setup code is copied into a second module, which would create a second server and a second set of lifecycle hooks."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "MSW makes server and http available globally once the setup file runs.",
      "reality": "They are ordinary module exports and must be imported where they are used."
    },
    {
      "thought": "A missing import would surface as an MSW error.",
      "reality": "It is a plain JavaScript ReferenceError, raised before MSW is involved."
    }
  ];
}
