import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'The "Right" Example Threw the Exact Error It Was Meant to Fix',
    points: [
      'The main page’s own first mistake block contrasts hard-coded URLs (wrong) against following <code>_links</code> from a root endpoint (right). The "right" code originally read <code>const root = await fetch(\'...\'); const usersUrl = root._links.users.href;</code> — but <code>fetch()</code> resolves to a <code>Response</code> object, not the parsed JSON body.',
      '<code>Response</code> objects expose methods like <code>.json()</code>, <code>.text()</code>, properties like <code>.status</code>/<code>.ok</code> — but never arbitrary fields from the response BODY directly. Reading <code>root._links</code> on an unparsed <code>Response</code> is always <code>undefined</code>, so <code>.users</code> on that throws a <code>TypeError</code> immediately.',
      'This has been fixed on the main page to <code>await (await fetch(...)).json()</code> — this subtopic traces the exact failure and confirms the fix via direct execution against a stand-in for the real Fetch API’s own <code>Response</code> shape.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Reproducing the Exact TypeError',
    language: 'typescript',
    code: `// A minimal stand-in for the real Fetch API's Response shape --
// real fetch() Response objects behave identically: the parsed body
// is only reachable through .json()/.text(), never as a direct
// property access on the Response itself.
class FakeResponse {
  constructor(private body: unknown) {}
  async json() { return this.body; }
}

async function fakeFetch(url: string) {
  return new FakeResponse({ _links: { users: { href: '/users' } } });
}

// ── BEFORE: treating the Response as if it were already parsed ──────────────
async function brokenLinkFollowing() {
  const root = await fakeFetch('https://api.example.com/'); // a Response, not JSON
  const usersUrl = (root as any)._links.users.href; // TypeError here
}

brokenLinkFollowing().catch(e => console.log('THREW:', e.message));
// THREW: Cannot read properties of undefined (reading 'users')
// -- root._links is undefined on a Response object; .users on
// undefined is what actually throws.

// ── AFTER: parsing the body before reading _links ────────────────────────────
async function fixedLinkFollowing() {
  const root = await (await fakeFetch('https://api.example.com/')).json();
  const usersUrl = root._links.users.href;
  return usersUrl;
}

fixedLinkFollowing().then(url => console.log('RESOLVED:', url));
// RESOLVED: /users`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate proposes a different fix: keep <code>await fetch(...)</code> as-is, but change <code>root._links.users.href</code> to <code>(await root.json())._links.users.href</code> — calling <code>.json()</code> at the point of USE instead of right after the fetch. Would this work, and is it as good as the fix actually applied?',
  hint: 'A <code>Response</code> body can only be read ONCE — what happens if <code>root.json()</code> (or <code>.text()</code>) is called a second time on the same <code>Response</code> object later in the same function?',
  solution: `// The proposed fix WOULD work for a single read -- calling
// .json() at the point of use is functionally equivalent to calling
// it right after the fetch, since both happen before anything reads
// _links.

// But it's a strictly worse pattern for a subtle reason: a Fetch API
// Response's body is a STREAM that can only be consumed ONCE. If
// "root" were used again later in the same function -- say, to also
// read root.status, or to call .json() a second time for a
// different field -- the SECOND call to .json() (or .text()) on the
// same Response throws "body stream already read." Parsing the body
// immediately, right after the fetch (the fix actually applied),
// establishes a single JS object that can be read from as many times
// and in as many places as needed, with no risk of hitting this
// stream-already-consumed error later. Deferring the .json() call
// to first point-of-use just moves the same fragility further into
// the function instead of removing it.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '<code>fetch()</code> resolves directly to the parsed response body — the same way many other HTTP client libraries (like axios) work by default.',
    reality: 'The Fetch API deliberately resolves to a <code>Response</code> object wrapping the body as a stream — <code>.json()</code>, <code>.text()</code>, or <code>.blob()</code> must be called explicitly to actually consume and parse it. This is a genuine, well-known difference from libraries like axios, which DO parse JSON automatically by default — conflating the two is a common source of exactly this bug.',
  },
  {
    thought: 'Since the original code never threw a compile-time TypeScript error, it must be runtime-correct too.',
    reality: 'The original snippet used untyped/loosely-typed access patterns typical of illustrative code — TypeScript would only catch this at compile time if <code>fetch()</code>’s return type were narrowed precisely and <code>_links</code> access were type-checked against the real <code>Response</code> interface, which does not declare a <code>_links</code> property at all. In practice, this class of bug commonly surfaces only at RUNTIME, exactly as reproduced in the codeTab above.',
  },
  {
    thought: 'A Response object’s body can be read from multiple times, the same way a plain JavaScript object’s properties can be accessed repeatedly.',
    reality: 'A Fetch API Response body is a single-use STREAM — calling <code>.json()</code> or <code>.text()</code> a second time on the SAME Response object throws an error, as the Try It above traces. This is exactly why the fix parses the body into a plain object immediately, rather than deferring the parse to wherever <code>_links</code> first gets read.',
  },
];

@Component({
  selector: 'app-api-hateoas-json-parse',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-missing-json-parse-in-the-link-following-example.html',
  styleUrl: './the-missing-json-parse-in-the-link-following-example.scss',
})
export class TheMissingJsonParseInTheLinkFollowingExampleSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
