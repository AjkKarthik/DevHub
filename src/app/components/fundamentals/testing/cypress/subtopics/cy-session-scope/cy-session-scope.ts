import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-cy-session-scope',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './cy-session-scope.html',
  styleUrl: './cy-session-scope.scss'
})
export class CySessionScopeSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "From the Cypress 16.1.1 typings and release notes",
      "points": [
        "Cypress 12.0 removed the <code>experimentalSessionAndOrigin</code> flag and made <code>cy.session()</code> generally available. Before that it was experimental (8.x and 9.x needed the flag).",
        "The typings describe <code>cacheAcrossSpecs</code> as \"Whether or not to persist the session across all specs in the run\" with <code>@default false</code>. So by default a session is reused only by tests in the same spec file.",
        "The <code>validate</code> option runs after the session is created or restored; if it fails or returns <code>false</code>, Cypress throws away the cached session and runs <code>setup</code> again.",
        "The page's QnA now gives the correct version and meaning."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Shared login",
      "language": "typescript",
      "code": "Cypress.Commands.add('login', (email: string, role: string) => {\n  cy.session(\n    [email, role],                       // id: change it when inputs change\n    () => {\n      cy.request('POST', '/api/login', { email, password: Cypress.env('PW') });\n    },\n    {\n      cacheAcrossSpecs: true,            // default false = per spec file\n      validate() {\n        cy.request('/api/me').its('status').should('eq', 200);\n      },\n    },\n  );\n});"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Ten spec files each call <code>cy.login('alice@example.com', 'admin')</code> in <code>beforeEach</code>, without <code>cacheAcrossSpecs</code>. Roughly how many times does the setup function run in one <code>cypress run</code>?",
    "hint": "Where is the cache kept by default?",
    "solution": "About ten times: once per spec file. Inside each file the later tests restore the cached session, but the next spec starts without it. With cacheAcrossSpecs: true it runs once for the whole run, plus any rebuilds when validate fails."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "<code>cacheAcrossSpecs: true</code> clears the session between specs.",
      "reality": "It keeps the session for all specs in the run; the default (false) is what limits it to one spec."
    },
    {
      "thought": "A cached session is always still valid.",
      "reality": "Tokens expire; without <code>validate</code>, Cypress restores a dead session and the test fails later."
    }
  ];
}
