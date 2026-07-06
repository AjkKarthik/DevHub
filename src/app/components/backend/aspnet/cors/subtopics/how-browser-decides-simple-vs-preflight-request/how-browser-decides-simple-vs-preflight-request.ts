import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-how-browser-decides-preflight-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-browser-decides-simple-vs-preflight-request.html',
  styleUrl: './how-browser-decides-simple-vs-preflight-request.scss',
})
export class HowBrowserDecidesSimpleVsPreflightRequestSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states "requests with custom headers trigger a preflight" as if it were a server-side decision — but the decision happens ENTIRELY client-side, before a single byte reaches the network, purely by comparing the outgoing request against a fixed, narrow "safelist" baked into the Fetch/CORS spec',
      points: [
        'A request is "simple" (no preflight) ONLY if ALL of these hold: the method is <code>GET</code>, <code>HEAD</code>, or <code>POST</code>; every request header is on the CORS-safelisted set (<code>Accept</code>, <code>Accept-Language</code>, <code>Content-Language</code>, <code>Content-Type</code> — with restrictions, plus a few rarely-used ones); and if <code>Content-Type</code> is present, its value is EXACTLY one of three: <code>application/x-www-form-urlencoded</code>, <code>multipart/form-data</code>, or <code>text/plain</code>. Anything else — any custom header, any other method, ANY other Content-Type — fails the safelist and forces a preflight.',
        '<strong>This is why <code>application/json</code> always preflights</strong>, even with zero custom headers and no Authorization token at all. It has nothing to do with authentication or CORS policy configuration — <code>application/json</code> is simply not one of the three safelisted Content-Type values. The main page\'s own troubleshooting section blames "custom headers (Authorization, Content-Type: application/json)" together, as if they were the same category of cause — they are actually two independent, unrelated triggers that both happen to force the same outcome.',
      ],
    },
    {
      heading: 'The safelist check runs entirely inside the browser, against the request the CLIENT is ABOUT to send — the server\'s CORS configuration plays no role in whether a preflight happens, only in whether the preflight (once sent) succeeds',
      points: [
        'This produces a subtle, testable consequence: a preflight fires the same way (or doesn\'t) regardless of what the server\'s CORS policy actually allows. A fetch() call with <code>Content-Type: application/json</code> triggers an OPTIONS preflight against a server with NO CORS configuration whatsoever — the preflight will simply fail (missing <code>Access-Control-Allow-Origin</code>), but it is still SENT. The decision to preflight is made by inspecting the OUTGOING request in isolation; it is never influenced by anything the server would have said.',
        'Because the safelist is about the shape of the request, not the target server, switching a fetch call from <code>Content-Type: application/json</code> to <code>text/plain</code> (with the SAME JSON string as the body, just mislabeled) makes the browser treat it as a simple request and skip the preflight entirely — while the server, ignoring the Content-Type label, still parses the body as JSON successfully via <code>[FromBody]</code> model binding. This is a real technique some teams have used (usually inadvertently, via a misconfigured client) to "avoid CORS issues" — and a genuine anti-pattern, since it silently disables the preflight\'s implicit safety check for anything requiring elevated CORS permissions.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The exact safelist, and why application/json always preflights',
      language: 'typescript',
      code: `// SIMPLE — no preflight — ALL conditions below must hold:
fetch('https://api.example.com/search?q=widgets', {
  method: 'GET',                 // GET/HEAD/POST only
});

fetch('https://api.example.com/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'name=Alice&email=alice@example.com',
});                              // one of exactly 3 safelisted Content-Types

// NON-SIMPLE — preflight fires — Content-Type not on the safelist:
fetch('https://api.example.com/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },   // <-- NOT safelisted
  body: JSON.stringify({ item: 'Widget', qty: 2 }),
});
// Preflight fires here EVEN with no Authorization header and no other
// custom headers — application/json alone is sufficient.

// NON-SIMPLE — preflight fires — method not in the simple set:
fetch('https://api.example.com/orders/1', { method: 'DELETE' });

// NON-SIMPLE — preflight fires — custom header, regardless of method:
fetch('https://api.example.com/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded', // safelisted...
    'X-Request-Id': 'abc-123',                            // ...but this isn't
  },
});`,
    },
    {
      label: 'Proving the decision is client-side and target-agnostic',
      language: 'typescript',
      code: `// Point BOTH requests at a server with ZERO CORS configuration.
// Watch the browser Network tab, not the response — the PRESENCE of
// an OPTIONS request is decided before the server is ever consulted.

// 1. This one preflights — an OPTIONS request appears in the Network
//    tab, gets no Access-Control-Allow-Origin back, and the browser
//    blocks the actual POST from ever being sent:
await fetch('https://no-cors-configured.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{"x":1}',
}).catch(e => console.log('blocked:', e));

// 2. This one does NOT preflight — no OPTIONS request appears at all.
//    The POST is sent directly. It may still be blocked from being
//    READ by JS afterward (no Access-Control-Allow-Origin on the
//    actual response) — but the request itself reaches the server
//    and executes server-side, preflight or not:
await fetch('https://no-cors-configured.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },   // safelisted — no preflight
  body: '{"x":1}',                             // same JSON body, relabeled
}).catch(e => console.log('response unreadable:', e));

// On the ASP.NET Core side, [FromBody] model binding for a JSON
// endpoint ignores the declared Content-Type mismatch in many
// configurations and still parses the body — meaning case 2's request
// can succeed SERVER-SIDE with zero preflight, purely because of a
// client-side content-type relabeling, independent of any CORS policy.
app.MapPost("/data", (DataDto data) => Results.Ok(data));`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A client sends a GET request with an Authorization: Bearer <token> header attached (a very common pattern for authenticated API calls) to a cross-origin endpoint. Does this preflight? Now compare: the same request, but as a same-origin call. Explain both answers using the safelist rule.',
    hint: 'Authorization is NOT on the CORS-safelisted header list, regardless of method. Does the safelist apply at all when there is no cross-origin boundary being crossed?',
    solution: `The cross-origin GET with an Authorization header DOES preflight.
Authorization is not among the CORS-safelisted request headers (Accept,
Accept-Language, Content-Language, and a restricted form of
Content-Type) — its mere presence disqualifies the request from being
"simple," regardless of the method being GET. This surprises people who
associate preflighting only with POST/PUT/DELETE — but the safelist
check applies uniformly across ALL methods in the simple set; GET is
not automatically exempt.

The same-origin case never triggers the CORS preflight machinery at
all — not because it passes the safelist differently, but because the
Fetch spec's CORS algorithm only activates in the first place for
requests that cross an origin boundary (different scheme, host, or
port). Same-origin requests are handled by the browser's ordinary
same-origin request path; the "simple vs. preflight" safelist
distinction is specifically a CORS concept and is simply never
consulted for a same-origin call, regardless of what headers are
attached.

The general lesson: the safelist decides the preflight ONLY once a
request is already established to be cross-origin. Two separate gates,
evaluated in order — "is this cross-origin at all?" then, only if yes,
"does this specific request qualify as simple?" — and Authorization
fails the second gate every time it appears on a cross-origin request.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a preflight is triggered by "custom headers like Authorization or Content-Type: application/json" as if these were one category of cause the server\'s CORS configuration determines.',
      reality: 'these are two independent, unrelated triggers evaluated client-side against a fixed spec safelist — Authorization fails because it is not a safelisted header at all, while application/json fails because Content-Type is only simple for exactly three specific values, none of which is application/json; neither check has anything to do with the server\'s CORS policy.',
    },
    {
      thought: 'whether a preflight fires depends on what the target server\'s CORS configuration allows — a permissive server-side policy means fewer preflights.',
      reality: 'the simple-vs-preflight decision is made entirely by the browser inspecting the OUTGOING request in isolation, before any network round trip — the server\'s CORS configuration only affects whether a preflight (once sent) SUCCEEDS, never whether one is sent in the first place.',
    },
    {
      thought: 'GET requests never trigger a CORS preflight since preflighting is associated with "unsafe" methods like POST/PUT/DELETE.',
      reality: 'GET is in the simple-method set, but a GET request that attaches a non-safelisted header (most commonly Authorization: Bearer <token>) still triggers a preflight — the method being simple is only one of several independent conditions that must ALL hold.',
    },
  ];
}
