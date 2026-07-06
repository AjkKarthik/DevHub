import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-grpc-web-cors-preflight-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './grpc-web-cors-needs-allowed-request-headers-not-exposed.html',
  styleUrl: './grpc-web-cors-needs-allowed-request-headers-not-exposed.scss',
})
export class GrpcWebCorsNeedsAllowedRequestHeadersNotExposedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own CORS guidance covers EXPOSING response headers to the browser — but says nothing about ALLOWING the request headers gRPC-Web itself sends, which is a completely separate CORS concern',
      points: [
        'The main gRPC page\'s gRPC-Web section says: "Add <code>WithExposedHeaders(\"grpc-status\", \"grpc-message\")</code> to your CORS policy so the browser can read gRPC status information from the trailer-in-body." <code>WithExposedHeaders</code> controls which RESPONSE headers JavaScript is allowed to READ — this is entirely separate from which REQUEST headers the browser is allowed to SEND in the first place. gRPC-Web itself sends specific custom request headers (<code>Content-Type: application/grpc-web+proto</code>, and often <code>X-Grpc-Web: 1</code>) on every call — if the CORS policy does not explicitly ALLOW these via <code>WithHeaders(...)</code>, the browser\'s CORS PREFLIGHT check fails before the actual request is ever sent.',
      ],
    },
    {
      heading: 'A failed CORS preflight produces a generic, unhelpful browser network error — and because the ACTUAL gRPC request never leaves the browser, there is ZERO server-side log entry to investigate, making this a particularly confusing failure to diagnose',
      points: [
        'When a browser needs to send a "non-simple" cross-origin request (which any gRPC-Web call is, due to its custom <code>Content-Type</code>), it FIRST sends an <code>OPTIONS</code> preflight request asking the server "will you allow a request with THESE headers, THIS method, from THIS origin?" If the server\'s CORS policy does not explicitly list gRPC-Web\'s required headers in its allowed-headers configuration, the preflight response says "no," and the browser NEVER sends the actual gRPC-Web request at all. The failure surfaces purely in the browser console as a vague CORS error — nothing reaches the ASP.NET Core pipeline, so there is no request log, no exception, and no breakpoint in server code that would ever be hit to help diagnose it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own CORS guidance — correct for what it covers, but incomplete for a genuinely working browser gRPC-Web setup',
      language: 'csharp',
      code: `// From the main page's own guidance — this configures which
// RESPONSE headers the browser is allowed to READ:
builder.Services.AddCors(options =>
{
    options.AddPolicy("GrpcWebPolicy", policy =>
    {
        policy
            .WithOrigins("https://my-frontend.example.com")
            .AllowAnyMethod()
            .WithExposedHeaders("grpc-status", "grpc-message");
            // ^ THIS ALONE IS NOT ENOUGH — it says nothing about which
            // REQUEST headers the browser is permitted to SEND
    });
});

// Server setup, exactly as the main page's own "gRPC-Web" tab shows:
builder.Services.AddGrpc();
app.UseCors("GrpcWebPolicy");
app.UseGrpcWeb(new GrpcWebOptions { DefaultEnabled = true });
app.MapGrpcService<GreeterService>().EnableGrpcWeb();

// WHAT ACTUALLY HAPPENS with ONLY WithExposedHeaders configured: the
// browser's gRPC-Web client library sends an OPTIONS preflight request
// before the actual call, asking "can I send a request with
// Content-Type: application/grpc-web+proto (and possibly
// X-Grpc-Web: 1) to this origin?" The server's CORS middleware checks
// its configured ALLOWED headers — which was never set — and responds
// with a preflight REJECTION. The actual gRPC-Web call is never sent
// at all. The browser console shows a generic CORS error; the server
// never logs anything, because the real request never arrived.`,
    },
    {
      label: 'The fix — explicitly allow the specific request headers gRPC-Web sends, via WithHeaders (or AllowAnyHeader for development)',
      language: 'csharp',
      code: `builder.Services.AddCors(options =>
{
    options.AddPolicy("GrpcWebPolicy", policy =>
    {
        policy
            .WithOrigins("https://my-frontend.example.com")
            .AllowAnyMethod()
            // FIX: explicitly ALLOW the specific REQUEST headers
            // gRPC-Web sends — this is what the preflight check
            // actually validates against:
            .WithHeaders("Content-Type", "X-Grpc-Web", "X-User-Agent")
            // STILL ALSO NEEDED: expose the RESPONSE headers so
            // JavaScript can read the gRPC status after a successful
            // call — this is a COMPLETELY SEPARATE CORS setting from
            // the one above, covering the OPPOSITE direction of data
            // flow (server → browser, not browser → server):
            .WithExposedHeaders("grpc-status", "grpc-message");
    });
});

// FOR DEVELOPMENT ONLY (never in production, since it is much
// looser): AllowAnyHeader() sidesteps needing to enumerate the exact
// header names gRPC-Web sends, at the cost of allowing ANY request
// header from the allowed origin:
policy.WithOrigins("https://my-frontend.example.com")
      .AllowAnyMethod()
      .AllowAnyHeader()                 // dev convenience — NOT for prod
      .WithExposedHeaders("grpc-status", "grpc-message");

// THE TWO-DIRECTION MENTAL MODEL WORTH INTERNALIZING:
//   WithHeaders(...)          → "what can the BROWSER SEND to me?"
//                                 (validated at PREFLIGHT time)
//   WithExposedHeaders(...)   → "what can JAVASCRIPT READ from my
//                                 RESPONSE?" (validated AFTER a
//                                 successful actual request)
// The main page's own guidance covers ONLY the second — a genuinely
// working browser gRPC-Web setup needs BOTH configured correctly.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that a failed CORS preflight produces zero server-side log entries (since the actual request never arrives), propose a concrete way to distinguish "the CORS preflight failed" from "the actual gRPC-Web request reached the server and failed for some OTHER reason" when debugging a browser client that shows a generic network error.',
    hint: 'Consider what the browser\'s own Network tab (in developer tools) would show for each of these two scenarios — specifically, would an OPTIONS request even appear in the list for the preflight-failure case, and what would its response status/headers look like compared to a genuinely reached server error?',
    solution: `The most direct diagnostic: open the browser's Network tab (DevTools)
and look specifically for the OPTIONS preflight request that precedes
the actual gRPC-Web call. This single check immediately distinguishes
the two failure modes:

1. IF THE PREFLIGHT ITSELF FAILED (the bug this subtopic describes):
   the Network tab shows an OPTIONS request to the gRPC endpoint's URL,
   with a response status that does NOT include the required
   Access-Control-Allow-Headers value matching what the browser asked
   for in its Access-Control-Request-Headers. Critically, NO SUBSEQUENT
   POST request to the same URL ever appears in the Network tab at
   all — the browser refuses to send it once the preflight is
   rejected. This is the unambiguous signature of a CORS
   configuration gap: an OPTIONS entry with no corresponding actual
   request following it.

2. IF THE REQUEST GENUINELY REACHED THE SERVER and failed for some
   OTHER reason (an actual RpcException, an unhandled exception, a
   genuine network timeout to a downstream dependency): the Network
   tab shows BOTH the OPTIONS preflight (succeeding, with the correct
   CORS headers) AND the actual POST/gRPC-Web request, which itself
   has a response (even if that response represents an error) — and
   critically, THIS scenario DOES produce server-side log entries,
   since the request genuinely arrived and was processed by the ASP.NET
   Core pipeline.

The practical debugging rule this establishes: before investigating
server-side gRPC service code, middleware order, or interceptor logic
for a browser gRPC-Web connectivity issue, ALWAYS check the Network tab
for whether the actual request even appears at all (not just the
preflight) — if it's missing entirely, the problem is unambiguously
CORS configuration (specifically WithHeaders, not WithExposedHeaders),
and no amount of server-side debugging will reveal anything, since the
server genuinely never saw the request.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'configuring WithExposedHeaders("grpc-status", "grpc-message") as the main page describes is sufficient CORS configuration for a working browser gRPC-Web client.',
      reality: 'WithExposedHeaders only controls which RESPONSE headers JavaScript can read AFTER a successful request — it says nothing about whether the browser is allowed to SEND the request headers gRPC-Web itself requires (like Content-Type: application/grpc-web+proto), which is validated separately at CORS preflight time via WithHeaders.',
    },
    {
      thought: 'a failed CORS preflight for a gRPC-Web request would still produce some kind of server-side log entry, since the browser is trying to reach the server.',
      reality: 'when a CORS preflight (OPTIONS request) is rejected, the browser never sends the actual gRPC-Web request at all — the ASP.NET Core pipeline never receives anything, so there is zero server-side log, exception, or trace to investigate, making this failure mode look identical to a generic "network error" with no server-side clue.',
    },
    {
      thought: 'debugging a browser gRPC-Web connectivity failure should start by checking server-side gRPC service code, interceptors, or middleware ordering.',
      reality: 'checking the browser\'s own Network tab for whether the actual (non-OPTIONS) request even appears at all is the fastest, most direct way to rule out a CORS preflight failure BEFORE investigating any server-side code — if the request is missing entirely, no amount of server debugging will help, since the server never received it.',
    },
  ];
}
