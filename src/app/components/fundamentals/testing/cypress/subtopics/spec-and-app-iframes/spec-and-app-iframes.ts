import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-spec-and-app-iframes',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './spec-and-app-iframes.html',
  styleUrl: './spec-and-app-iframes.scss'
})
export class SpecAndAppIframesSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Two iframes, one tab",
      "points": [
        "Cypress loads the spec code in one iframe and the application under test in another iframe in the same tab. Because they share the browser and (normally) the origin, the spec can reach into the app without a remote protocol like WebDriver.",
        "They are still different global objects. A variable the app puts on its <code>window</code> is not on the spec's <code>window</code>.",
        "<code>cy.window()</code> yields the app's window and <code>cy.document()</code> its document; both retry like other commands.",
        "To replace something before the app reads it (for example <code>fetch</code> or a feature flag), use the <code>onBeforeLoad</code> callback of <code>cy.visit()</code>, which receives the app window."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Wrong window",
      "language": "typescript",
      "code": "cy.visit('/');\n// window here is the spec iframe, not the app\nexpect((window as any).appStore).to.be.undefined;"
    },
    {
      "label": "App window",
      "language": "typescript",
      "code": "cy.visit('/', {\n  onBeforeLoad(win) {\n    (win as any).FEATURE_FLAGS = { newCheckout: true }; // before app code runs\n  },\n});\n\ncy.window().its('appStore.cart.items').should('have.length', 0);\n\ncy.window().then(win => {\n  cy.stub(win, 'open').as('popup');\n});"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A test does <code>cy.stub(window, 'open')</code>, then clicks a Share button that calls <code>window.open()</code> in the app. The assertion that the stub was called fails. Why?",
    "hint": "Which window object was stubbed?",
    "solution": "The stub was put on the spec iframe window, but the app calls open on its own window in the app iframe. Stub it through cy.window().then(win => cy.stub(win, \"open\").as(\"popup\")) and then assert on @popup."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "The spec and the app share one global scope.",
      "reality": "They run in separate iframes; use <code>cy.window()</code> to reach the app globals."
    },
    {
      "thought": "Running in the same tab means Cypress can drive several tabs.",
      "reality": "Cypress controls one tab; popups are usually stubbed or opened in the same tab."
    }
  ];
}
