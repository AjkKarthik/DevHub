import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-cypress-react-mount',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './cypress-react-mount.html',
  styleUrl: './cypress-react-mount.scss'
})
export class CypressReactMountSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Checked against the installed package",
      "points": [
        "Installing <code>cypress@16.1.1</code> (binary download skipped) and reading its <code>package.json</code> shows the framework entry points it exports: <code>./react</code>, <code>./vue</code>, <code>./angular</code> and <code>./svelte</code>. There is no <code>./react18</code>.",
        "Resolving <code>cypress/react18</code> from inside that package fails with <code>ERR_PACKAGE_PATH_NOT_EXPORTED</code>.",
        "The bundled <code>cypress/react/package.json</code> declares peer dependencies <code>react: ^18 || ^19</code>, so the plain path is the one for current React.",
        "The page's Component Testing tab now imports from <code>cypress/react</code>."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Register once",
      "language": "typescript",
      "code": "// cypress/support/component.ts\nimport { mount } from 'cypress/react';\n\nCypress.Commands.add('mount', mount);\n\ndeclare global {\n  namespace Cypress {\n    interface Chainable {\n      mount: typeof mount;\n    }\n  }\n}"
    },
    {
      "label": "Use in a spec",
      "language": "typescript",
      "code": "// Counter.cy.tsx\nimport { Counter } from './Counter';\n\nit('increments on click', () => {\n  cy.mount(<Counter />);\n  cy.get('[data-testid=\"increment\"]').click();\n  cy.get('[data-testid=\"count\"]').should('have.text', '1');\n});"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Why is registering <code>cy.mount</code> once in the support file better than importing <code>mount</code> in every spec, given this import path change?",
    "hint": "How many files would need editing when the path changes again?",
    "solution": "Only the support file imports from the framework package. When the path changed from cypress/react18 to cypress/react, one line needed updating instead of every component spec, and the specs keep calling cy.mount unchanged."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "React 18 projects must use <code>cypress/react18</code>.",
      "reality": "In current Cypress, <code>cypress/react</code> supports React 18 and 19; the react18 path is not exported."
    },
    {
      "thought": "A wrong mount import only breaks the one test that uses it.",
      "reality": "The spec file fails to bundle, so none of its tests run."
    }
  ];
}
