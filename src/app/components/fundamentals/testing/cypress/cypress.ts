import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-cypress-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './cypress.html',
  styleUrl: './cypress.scss',
})
export class CypressTesting {
  quickRef: QuickRefItem[] = [
    { name: 'cy.visit(url)',          type: 'method', desc: 'Navigate to a URL. Waits for the page to fully load.' },
    { name: 'cy.get(selector)',       type: 'method', desc: 'Find element(s) by CSS selector. Retries until found or timeout.' },
    { name: 'cy.contains(text)',      type: 'method', desc: 'Find element containing the specified text.' },
    { name: 'cy.intercept()',         type: 'method', desc: 'Stub or spy on network requests before they leave the browser.' },
    { name: 'cy.task()',              type: 'method', desc: 'Run Node.js code from a test (e.g. seed DB, read a file).' },
    { name: 'Cypress.Commands.add()', type: 'method', desc: 'Define reusable custom commands for repeated interactions.' },
    { name: '.should()',              type: 'method', desc: 'Assertion — retries until the condition passes or times out.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'In-Browser Architecture', points: [
      'Cypress runs inside the same browser as your app — giving direct access to window, DOM, and network.',
      'Tests and app share the same JavaScript context — you can call app internals from tests.',
      'The Cypress proxy sits between the browser and the internet — enabling request interception.',
      'This architecture makes the time-travel debugger possible: every command is snapshotted.',
    ]},
    { heading: 'Command Chaining', points: [
      'Cypress commands are asynchronous and queue up — they run in order after the test function returns.',
      'cy.get(".btn").click().should("have.class", "active") — chained commands share context.',
      'Do NOT use async/await in Cypress — the queue handles ordering automatically.',
      'Use .then(el => ...) to work with the yielded element value in a callback.',
    ]},
    { heading: 'cy.intercept() — Network Control', points: [
      'cy.intercept(method, url, response) stubs the request before it leaves the browser.',
      'cy.intercept(url).as("alias") + cy.wait("@alias") ensures the request completed before asserting.',
      'Use { fixture: "users.json" } to return data from a fixture file.',
      'Intercept can also spy (no stub): you observe the request and assert on it after it completes.',
    ]},
    { heading: 'Custom Commands and Component Testing', points: [
      'Cypress.Commands.add("login", (email, pw) => {...}) — define once, call cy.login() everywhere.',
      'Add commands to cypress/support/commands.ts; they are available globally in all specs.',
      'Component testing (Cypress ct): mount() a single component in a real browser — no full app needed.',
      'cy.mount(<Counter />) + assertions — same Cypress API, faster than full E2E, real browser rendering.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Basic E2E', language: 'typescript', code:
`// cypress/e2e/login.cy.ts
describe('Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('logs in with valid credentials', () => {
    cy.get('[data-testid="email"]').type('alice@example.com');
    cy.get('[data-testid="password"]').type('secret');
    cy.get('[type="submit"]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('Welcome, Alice').should('be.visible');
  });

  it('shows error for invalid credentials', () => {
    cy.get('[data-testid="email"]').type('alice@example.com');
    cy.get('[data-testid="password"]').type('wrong');
    cy.get('[type="submit"]').click();

    cy.get('[role="alert"]').should('contain', 'Invalid credentials');
  });
});` },
    { label: 'cy.intercept()', language: 'typescript', code:
`describe('Products page', () => {
  it('displays mocked product list', () => {
    cy.intercept('GET', '/api/products', {
      fixture: 'products.json',  // cypress/fixtures/products.json
    }).as('getProducts');

    cy.visit('/products');
    cy.wait('@getProducts');  // waits for the intercepted request

    cy.get('[data-testid="product-item"]').should('have.length', 3);
    cy.contains('Widget').should('be.visible');
  });

  it('shows error when API fails', () => {
    cy.intercept('GET', '/api/products', {
      statusCode: 500,
      body: { message: 'Server error' },
    });

    cy.visit('/products');
    cy.get('[role="alert"]').should('contain', 'Failed to load products');
  });
});` },
    { label: 'Custom Commands', language: 'typescript', code:
`// cypress/support/commands.ts
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid="email"]').type(email);
  cy.get('[data-testid="password"]').type(password);
  cy.get('[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

// Declare for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}

// In your tests — clean, readable
describe('Dashboard', () => {
  beforeEach(() => {
    cy.login('alice@example.com', 'secret');
  });

  it('shows user name', () => {
    cy.contains('Alice').should('be.visible');
  });
});` },
    { label: 'Component Testing', language: 'typescript', code:
`// counter.cy.tsx — Cypress component test
import { mount } from 'cypress/react18';
import { Counter } from './Counter';

describe('Counter component', () => {
  it('starts at 0', () => {
    mount(<Counter />);
    cy.get('[data-testid="count"]').should('have.text', '0');
  });

  it('increments on click', () => {
    mount(<Counter />);
    cy.get('[data-testid="increment"]').click();
    cy.get('[data-testid="count"]').should('have.text', '1');
  });
});` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Using async/await in Cypress tests', wrong: 'it("test", async () => { const el = await cy.get(".btn"); })', right: 'it("test", () => { cy.get(".btn").click(); cy.contains("Done"); })', explanation: 'Cypress uses a command queue, not promises. Using async/await breaks the queue ordering — commands may run out of sequence.' },
    { title: 'Hard-coding cy.wait(ms) for timing', wrong: 'cy.wait(3000); cy.get(".result")', right: 'cy.intercept("/api/data").as("load"); cy.wait("@load"); cy.get(".result")', explanation: 'cy.wait(ms) is a fixed sleep that makes tests slow and flaky. Wait for a specific intercept or assertion instead.' },
    { title: 'Selecting by fragile CSS selectors', wrong: 'cy.get(".MuiButton-root.css-abc123")', right: 'cy.get("[data-testid=submit]") or cy.contains("Submit")', explanation: 'Generated class names (CSS-in-JS, Tailwind) change on every build. Use data-testid or text content for stable selectors.' },
    { title: 'Not aliasing intercepts before visit', wrong: 'cy.visit("/page"); cy.intercept("/api")', right: 'cy.intercept("/api").as("req"); cy.visit("/page"); cy.wait("@req")', explanation: 'If cy.visit triggers the request before cy.intercept registers, the stub is missed. Always set up intercepts BEFORE visiting.' },
    { title: 'Writing tests that depend on each other', wrong: 'it("creates a user"); it("finds the user created above")', right: 'each it() is independent — seed data in beforeEach or cy.task()', explanation: 'Cypress can run specs in any order and retry individual tests. Test B that relies on test A\'s side effect will fail when run alone.' },
  ];

  challenge: Challenge = {
    title: 'Write a Cypress test with intercept',
    language: 'typescript',
    description: 'Write a Cypress E2E test for a /users page that: (1) intercepts GET /api/users and returns a fixture of 2 users, (2) visits the page and waits for the request, (3) asserts both user names appear in the list.',
    hints: [
      'cy.intercept("GET", "/api/users", { fixture: "users.json" }).as("getUsers")',
      'cy.wait("@getUsers") before asserting on DOM elements.',
    ],
    starterCode:
`// cypress/fixtures/users.json:
// [{ "id": 1, "name": "Alice" }, { "id": 2, "name": "Bob" }]

describe('Users page', () => {
  it('displays users from API', () => {
    // write your test here
  });
});`,
    solution:
`describe('Users page', () => {
  it('displays users from API', () => {
    cy.intercept('GET', '/api/users', {
      body: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
    }).as('getUsers');

    cy.visit('/users');
    cy.wait('@getUsers');

    cy.contains('Alice').should('be.visible');
    cy.contains('Bob').should('be.visible');
    cy.get('[data-testid="user-item"]').should('have.length', 2);
  });
});`,
  };

  quiz: QuizQuestion[] = [
    { q: 'Why should you NOT use async/await in Cypress tests?', options: ['Cypress does not support TypeScript', 'Cypress uses a command queue — async/await breaks the ordering of queued commands', 'await is slower than callbacks', 'Cypress commands are synchronous'], answer: 1, explanation: 'Cypress commands are queued and executed asynchronously internally. Adding await bypasses the queue and causes commands to run out of order.' },
    { q: 'What does cy.intercept().as("alias") + cy.wait("@alias") give you?', options: ['It makes the test wait a fixed number of milliseconds', 'It ensures the intercepted HTTP request completed before proceeding with assertions', 'It creates a stub that returns null', 'It cancels the request'], answer: 1, explanation: 'Aliasing and waiting on an intercept is deterministic — Cypress pauses the test until that specific request-response cycle completes. This replaces unreliable cy.wait(ms) sleeps.' },
    { q: 'Where should cy.intercept() be called relative to cy.visit()?', options: ['After cy.visit()', 'It does not matter', 'Before cy.visit() — to capture the request triggered by page load', 'Inside a .then() callback'], answer: 2, explanation: 'Intercepts must be registered before the action that triggers the request. If the page load makes the API call, register the intercept before cy.visit().' },
  ];

  qna: QnaItem[] = [
    { q: 'What is Cypress component testing and when should I use it?', a: 'Cypress component testing mounts a single component in a real Chromium browser using cy.mount(). Use it when you want real browser rendering (unlike jsdom) but don\'t need a full application. It\'s faster than E2E and catches CSS and layout issues that jsdom-based tests miss.' },
    { q: 'How do I seed database state for Cypress tests?', a: 'Use cy.task() to run Node.js code from the test — cy.task("seedDb", { user: {...} }). Define tasks in cypress.config.ts under on("task", {...}). This keeps DB logic on the server side while Cypress controls it from the test.' },
    { q: 'Should I choose Cypress or Playwright for a new project?', a: 'Both are production-ready. Playwright: stronger for multi-browser, multi-tab, and iframe scenarios; better in CI headless performance; supports Firefox and WebKit natively. Cypress: superior time-travel debugger; excellent developer experience; larger plugin ecosystem. For teams new to E2E, Cypress is often easier to adopt; Playwright scales better for complex apps.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Cypress tests run in the browser, use a command queue (no async/await), cy.intercept() for network stubs, and custom commands for reuse.',
    mustKnow: [
      'No async/await — Cypress uses a command queue',
      'cy.get() retries until element found or timeout',
      'cy.intercept() BEFORE cy.visit() to capture page-load requests',
      '.as("alias") + cy.wait("@alias") for deterministic request waiting',
      'Custom commands in cypress/support/commands.ts for DRY login etc.',
      'Component testing: cy.mount() for single-component real-browser tests',
    ],
    interviewFocus: [
      'Why async/await breaks Cypress (command queue model)',
      'cy.intercept() vs cy.wait(ms) — determinism over sleeps',
      'Cypress vs Playwright trade-offs',
    ],
  };
}
