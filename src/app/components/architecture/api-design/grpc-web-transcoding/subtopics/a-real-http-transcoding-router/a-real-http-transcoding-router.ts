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
    heading: 'The Challenge Parses One Annotation — grpc-gateway Routes a Whole Request',
    points: [
      'The main page’s own Challenge implements <code>parseHttpAnnotation()</code>, which extracts the HTTP method and path TEMPLATE from a single <code>google.api.http</code> annotation string. That’s only the first step of what grpc-gateway actually does — the harder problem is taking a real incoming request (a concrete method + path + body) and figuring out WHICH annotated rpc it matches, then extracting the path parameters into the right places on the gRPC request object.',
      'The main page’s own .proto codeTab includes a genuinely trickier annotation than the Challenge ever tests: <code>UpdateUser</code>’s path is <code>/v1/users/{user.id}</code> — a NESTED field-path binding, not a flat <code>{id}</code>. The extracted path parameter needs to land at <code>request.user.id</code>, not a top-level <code>request.id</code>.',
      'Routing works by comparing the incoming path against each registered template segment-by-segment: a literal segment (<code>users</code>) must match exactly; a <code>{param}</code> segment always matches and captures whatever value is in that position.',
      'The request body (for POST/PATCH) and the extracted path bindings are merged together into one final gRPC-style request object — path bindings should never silently overwrite fields the body already set on the same nested object, only add to it.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Matching Routes and Binding Fields',
    language: 'typescript',
    code: `interface Route {
  method: string;
  path: string;   // e.g. '/v1/users/{id}' or '/v1/users/{user.id}'
  rpc: string;
}

interface MatchedRoute {
  rpc: string;
  bindings: Record<string, string>; // e.g. { id: '42' } or { 'user.id': '42' }
}

function matchRoute(routes: Route[], method: string, path: string): MatchedRoute | null {
  for (const route of routes) {
    if (route.method !== method) continue;

    const templateParts = route.path.split('/');
    const pathParts = path.split('/');
    if (templateParts.length !== pathParts.length) continue;

    const bindings: Record<string, string> = {};
    let matched = true;
    for (let i = 0; i < templateParts.length; i++) {
      const tp = templateParts[i];
      if (tp.startsWith('{') && tp.endsWith('}')) {
        bindings[tp.slice(1, -1)] = pathParts[i]; // capture, dotted key kept as-is
      } else if (tp !== pathParts[i]) {
        matched = false;
        break;
      }
    }
    if (matched) return { rpc: route.rpc, bindings };
  }
  return null;
}

// Merges path bindings onto the request body -- a dotted key like
// 'user.id' lands at request.user.id WITHOUT overwriting any sibling
// fields the body already set on the same nested object.
function buildRequest(bindings: Record<string, string>, body: Record<string, any>) {
  const req = { ...body };
  for (const [key, value] of Object.entries(bindings)) {
    const segments = key.split('.');
    let target = req;
    for (let i = 0; i < segments.length - 1; i++) {
      target[segments[i]] = target[segments[i]] || {};
      target = target[segments[i]];
    }
    target[segments[segments.length - 1]] = value;
  }
  return req;
}

const routes: Route[] = [
  { method: 'GET',    path: '/v1/users/{id}',      rpc: 'GetUser' },
  { method: 'POST',   path: '/v1/users',            rpc: 'CreateUser' },
  { method: 'PATCH',  path: '/v1/users/{user.id}',  rpc: 'UpdateUser' },
  { method: 'DELETE', path: '/v1/users/{id}',       rpc: 'DeleteUser' },
];

const getMatch = matchRoute(routes, 'GET', '/v1/users/42');
console.log(getMatch, buildRequest(getMatch!.bindings, {}));
// { rpc: 'GetUser', bindings: { id: '42' } }  { id: '42' }

const patchMatch = matchRoute(routes, 'PATCH', '/v1/users/42');
console.log(patchMatch, buildRequest(patchMatch!.bindings, { user: { email: 'new@example.com' } }));
// { rpc: 'UpdateUser', bindings: { 'user.id': '42' } }
// { user: { email: 'new@example.com', id: '42' } }  -- id added, email preserved

console.log(matchRoute(routes, 'GET', '/v1/orders/42'));
// null -- no registered route matches this method+path combination`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The <code>buildRequest</code> function copies <code>body</code> into <code>req</code> with <code>{ ...body }</code> — a SHALLOW copy — before merging in the path bindings. For the <code>PATCH /v1/users/42</code> example above, why does this shallow copy still correctly preserve <code>user.email</code> when the path binding writes to <code>user.id</code> on the SAME nested <code>user</code> object?',
  hint: 'A shallow copy copies top-level keys by reference — is <code>req.user</code> after the spread the SAME object as <code>body.user</code>, or a fresh copy? What does that mean for mutating <code>req.user.id</code>?',
  solution: `// { ...body } only shallow-copies TOP-LEVEL keys -- req.user after the
// spread is the exact SAME object reference as body.user, not a fresh
// copy of it. So when buildRequest walks into req.user and sets
// req.user.id = '42', it's mutating that SAME shared object, which
// still has its original email field completely untouched -- nothing
// ever replaced or cleared it.

// This happens to produce the correct result here, but it's worth
// noticing it's also mutating the CALLER's original body.user object as
// a side effect (since req.user and body.user are the same reference) --
// a real production version of this function would likely want a DEEP
// clone instead of a shallow spread, specifically to avoid silently
// mutating a request body object the caller might still hold a
// reference to and use again elsewhere.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The main page’s Challenge (<code>parseHttpAnnotation</code>) already implements everything grpc-gateway needs to do — extracting the method and path template from an annotation IS the whole transcoding job.',
    reality: 'Parsing a single annotation string is only the FIRST step. The harder, separate job — demonstrated in this subtopic’s own codeTab — is taking a REAL incoming request and figuring out which of potentially many registered routes it matches, then extracting path parameters (including nested ones like <code>user.id</code>) into the correct place on the outgoing gRPC request. The Challenge never has to solve either of those problems.',
  },
  {
    thought: 'A path binding like <code>{user.id}</code> works exactly like a flat <code>{id}</code> binding — it just happens to have a dot in its name.',
    reality: 'A flat binding sets one top-level field directly. A dotted binding like <code>user.id</code> requires walking INTO a nested object (creating it if it doesn’t exist yet) and setting a field on that inner object — a meaningfully different operation, and one that can go wrong if implemented naively (e.g. by accidentally overwriting the whole <code>user</code> object instead of merging a field into it, which the Try It above specifically confirms this implementation avoids).',
  },
  {
    thought: 'If no registered route matches an incoming request, that’s a bug in the router — every request should always match something.',
    reality: 'The codeTab’s own third example (<code>GET /v1/orders/42</code> against a route table that only registers <code>/v1/users/...</code> paths) correctly returns <code>null</code> — a real REST/gRPC transcoding gateway genuinely needs to handle "no route matched" as an expected outcome, typically responding with a 404, not treating every possible request path as something that must resolve to a known rpc.',
  },
];

@Component({
  selector: 'app-api-grpc-web-transcoding-router',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-real-http-transcoding-router.html',
  styleUrl: './a-real-http-transcoding-router.scss',
})
export class ARealHttpTranscodingRouterSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
