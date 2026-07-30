import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './why-browsers-cannot-call-grpc-directly.html',
  styleUrl: './why-browsers-cannot-call-grpc-directly.scss'
})
export class WhyBrowsersCannotCallGrpcDirectlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The page states the recommendation but not the reason',
      points: [
        'The page says: "gRPC for internal high-throughput service-to-service calls; REST for public APIs and browser clients." True, but it never explains WHY a browser can\'t just call a gRPC service the same way it calls a REST one.',
        'Verified via WebSearch: the specific, mechanical reason is that gRPC sends its final call status (success/failure, error details) in HTTP/2 TRAILERS — a second set of headers sent AFTER all the response data, not in the HTTP status code the way REST does. This lets a server stream results and only report success or failure once streaming finishes.',
        'The browser\'s Fetch API has never exposed trailers to JavaScript — a <code>response.trailers</code> property has existed in the Fetch specification for years but isn\'t implemented in any major browser. Beyond that, browsers deliberately hide raw HTTP/2 framing entirely, exposing only a small, high-level API — there\'s no way for browser JavaScript to read or construct the actual binary frames gRPC needs.',
      ]
    },
    {
      heading: 'How gRPC-Web works around a limitation it can\'t actually fix',
      points: [
        'gRPC-Web is a separate, deliberately restricted protocol variant that encodes the trailer information inside the response BODY instead of relying on real HTTP/2 trailers — a special flagged message appended after the normal response data, which JavaScript CAN read since it\'s just part of the body.',
        'This workaround requires a PROXY sitting between the browser and the real gRPC service (Envoy is the most common choice) that translates gRPC-Web\'s body-encoded format into genuine gRPC with real trailers on the way to the backend, and translates the response back on the way out.',
        'The tradeoff: gRPC-Web deliberately gives up some of gRPC\'s own capabilities to make this work — client-streaming and full bidirectional streaming aren\'t supported through the browser, only server-streaming and simple unary (request/response) calls are. This is a real, structural reason "REST for browser clients" isn\'t just convention — it\'s working around a genuine platform gap, not an arbitrary preference.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the browser actually can and cannot do',
      language: 'typescript',
      code: `// A browser CAN read ordinary response headers via Fetch:
const res = await fetch('/api/products/123');
console.log(res.headers.get('content-type')); // works fine

// A browser CANNOT read HTTP/2 trailers -- this has been in the Fetch
// spec for years and is still not implemented in any major browser:
// const trailers = await res.trailers; // Promise<Headers> -- unimplemented

// Real gRPC's final status arrives as a TRAILER, sent after the response body:
// HEADERS (request)
// DATA, DATA, DATA...      <- streamed response chunks
// HEADERS (trailer)        <- grpc-status, grpc-message -- INVISIBLE to fetch()

// gRPC-Web's workaround: encode the "trailer" as extra bytes appended to
// the BODY instead, with a flag bit marking it as trailer data:
// DATA, DATA, DATA...
// [trailer-flagged bytes containing grpc-status]  <- just body data to fetch()

// This is why gRPC-Web needs a translating proxy (commonly Envoy) in front
// of the real gRPC backend -- something has to convert between "trailers
// encoded in the body" (what the browser can send/receive) and "real HTTP/2
// trailers" (what the actual gRPC service speaks).`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A frontend developer asks: "Can\'t we just skip the proxy and have our React app call the gRPC backend directly over HTTP/2 -- browsers support HTTP/2 fine for regular page loads, so what\'s the actual blocker?" What\'s the accurate answer?',
    hint: 'The blocker isn\'t whether the browser supports HTTP/2 as a transport for loading pages -- it\'s about what JavaScript running IN the browser is allowed to read and construct at the protocol level.',
    solution: 'The browser genuinely does support HTTP/2 as a transport -- that\'s not the issue. The actual blocker is that JavaScript running in the browser has no API to read HTTP/2 trailers (where gRPC puts its final call status) and no access to raw HTTP/2 framing at all -- browsers deliberately expose only a high-level API (fetch, XHR) that hides the underlying protocol details. Since gRPC\'s wire format depends on trailers the browser literally cannot read, a real gRPC backend genuinely cannot be called directly from browser JavaScript -- it requires either gRPC-Web (encoding the trailer data into the body instead, via a translating proxy) or a REST/JSON facade in front of the gRPC service.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"REST for browsers, gRPC for internal services" is mostly a convention or a performance preference, not a hard technical constraint.',
      reality: 'Per this subtopic\'s theory, it\'s a genuine platform limitation — browsers have never implemented the Fetch API\'s own <code>trailers</code> property, and gRPC\'s wire format depends on HTTP/2 trailers the browser simply cannot read.'
    },
    {
      thought: 'Since browsers support HTTP/2 for normal page loads, they should be able to speak gRPC directly too.',
      reality: 'Per this subtopic\'s theory, browser HTTP/2 support and JavaScript\'s ACCESS to HTTP/2\'s low-level features (like trailers and raw framing) are two different things — the browser transport supports HTTP/2 fine, but the JavaScript API deliberately hides those specific low-level details.'
    },
    {
      thought: 'gRPC-Web lets a browser use gRPC exactly as-is, with a proxy that\'s purely an implementation detail with no functional tradeoffs.',
      reality: 'Per this subtopic\'s theory, gRPC-Web is a deliberately restricted variant — it gives up client-streaming and full bidirectional streaming to make browser compatibility work, so a browser client genuinely gets less capability than a real internal gRPC-to-gRPC call.'
    }
  ];
}
