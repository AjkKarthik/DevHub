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
    heading: 'Named as "the Standard" — Never Shown as an Actual Header Value',
    points: [
      'The main page’s own correlation-ID QnA names it directly: "W3C Trace Context (traceparent header) is the standardized format for distributed tracing. OpenTelemetry implements this standard." No codeTab on the page ever shows what a real <code>traceparent</code> value actually looks like or how to parse one.',
      'Verified against the W3C Trace Context specification itself: the header is four dash-separated fields — a 2-hex-char <code>version</code>, a 32-hex-char <code>trace-id</code> (16 bytes, identifies the whole distributed trace), a 16-hex-char <code>parent-id</code> (8 bytes, identifies THIS specific hop), and a 2-hex-char <code>trace-flags</code> bit field (currently only a "sampled" bit is defined).',
      'This is the mechanism behind the main page’s own correlation-ID QnA description ("the API gateway generates a UUID... passes it as a header to all backend services") — <code>traceparent</code> is a standardized, structured version of exactly that idea, letting every service in a call chain both identify the SAME overall trace and generate its OWN new hop identifier for the next service downstream.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Parsing and Generating a Real traceparent Header',
    language: 'typescript',
    code: `interface TraceContext {
  version: string;
  traceId: string;
  parentId: string;
  traceFlags: string;
  sampled: boolean;
}

function parseTraceparent(header: string): TraceContext | null {
  // version(2)-traceId(32)-parentId(16)-traceFlags(2), dash-separated
  const match = header.match(/^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/);
  if (!match) return null;

  const [, version, traceId, parentId, traceFlags] = match;
  if (traceId === '0'.repeat(32) || parentId === '0'.repeat(16)) return null; // both forbidden

  return {
    version, traceId, parentId, traceFlags,
    sampled: (parseInt(traceFlags, 16) & 0x01) === 1, // bit 0 = sampled
  };
}

function generateParentId(): string {
  return require('crypto').randomBytes(8).toString('hex'); // 8 bytes = 16 hex chars
}

// The exact example value from the W3C spec itself:
const incoming = parseTraceparent('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01');
console.log(incoming);
// { version: '00', traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
//   parentId: '00f067aa0ba902b7', traceFlags: '01', sampled: true }`,
  },
  {
    label: 'Propagating the Trace to the Next Service',
    language: 'typescript',
    code: `// A gateway or middle-tier service receives an incoming request,
// keeps the SAME trace-id (it's the same overall trace), but
// generates a NEW parent-id representing ITS OWN hop -- so the next
// downstream service sees THIS service as its immediate parent.
app.use((req, res, next) => {
  const incoming = req.headers['traceparent']
    ? parseTraceparent(req.headers['traceparent'] as string)
    : null;

  const traceId = incoming?.traceId ?? require('crypto').randomBytes(16).toString('hex');
  const newParentId = generateParentId(); // THIS service's own hop id

  req.traceContext = { traceId, parentId: newParentId, sampled: incoming?.sampled ?? true };

  // Attach the error's own instance field to this SAME trace, so a
  // correlation-ID-based log lookup finds every hop of the request
  // that eventually produced the error -- not just the one service
  // that happened to throw.
  res.locals.buildErrorInstance = () => \`/errors/\${traceId}\`;

  next();
});

// Forwarding to a downstream service reuses traceId, sends the NEW parentId:
async function callDownstreamService(req: Request, url: string) {
  const { traceId, parentId, sampled } = req.traceContext;
  const traceFlags = sampled ? '01' : '00';
  return fetch(url, {
    headers: { traceparent: \`00-\${traceId}-\${parentId}-\${traceFlags}\` },
  });
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A request arrives at Service A with no <code>traceparent</code> header at all (a brand-new request from an external client). Service A calls Service B, which calls Service C. Trace what <code>traceId</code> each of the three services ends up using, and what <code>parentId</code> Service C sees as its OWN incoming parent.',
  hint: 'Look at the propagation codeTab’s own fallback: <code>incoming?.traceId ?? require(\'crypto\').randomBytes(16).toString(\'hex\')</code> — what happens the FIRST time there is no incoming header at all, and what happens on every hop AFTER that?',
  solution: `// Service A: no incoming traceparent, so the fallback fires --
// randomBytes(16) generates a BRAND NEW traceId. This is the ONE
// moment a new traceId is ever created for this request; every
// downstream hop reuses it. Service A also generates its own NEW
// parentId (its own hop identifier) via generateParentId().

// Service A calls Service B, sending traceparent with the traceId
// just generated and Service A's own parentId. Service B parses
// this: incoming.traceId is now defined, so the SAME traceId flows
// through (no new one generated) -- but Service B generates its OWN
// new parentId for its own hop before calling Service C.

// Service B calls Service C, sending the SAME traceId (unchanged
// since Service A) and Service B's own parentId. Service C parses
// this header: it sees Service B's parentId as ITS OWN incoming
// parent -- meaning Service C now knows "B called me directly, as
// part of the trace that started at A."

// End state: all three services share the exact same traceId (one
// trace, generated once, at the very first hop). Each service's own
// parentId in the header it SENDS downstream is different (A's own
// hop id, then B's own hop id) -- and Service C's own incoming
// parentId is specifically B's hop id, not A's, since C only ever
// talks directly to B.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'traceId and parentId are the same identifier, just different names used at different points in the spec.',
    reality: '<code>traceId</code> identifies the ENTIRE distributed trace and stays IDENTICAL across every service in the call chain — <code>parentId</code> identifies one SPECIFIC hop and is regenerated fresh by every service before it calls the next one downstream, as the codeTab above demonstrates explicitly.',
  },
  {
    thought: 'The correlation ID a client sees in an error response’s "instance" field and the traceparent header used for internal service-to-service tracing are unrelated identifiers.',
    reality: 'They can be, and often should be, THE SAME identifier — the second codeTab above builds the error’s own <code>instance</code> field directly from the request’s <code>traceId</code>, meaning a support engineer looking up that one ID finds every log entry from every service the request touched, not just the service where the error surfaced.',
  },
  {
    thought: 'A brand-new traceId is generated at every hop in a distributed call chain, the same way a new parentId is.',
    reality: 'A new <code>traceId</code> is only generated ONCE — at the very first service that receives a request with no existing <code>traceparent</code> header at all (traced concretely in the Try It above). Every downstream hop REUSES that same <code>traceId</code>; only <code>parentId</code> is regenerated at each hop.',
  },
];

@Component({
  selector: 'app-api-error-response-traceparent',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-real-traceparent-header-w3c-trace-context.html',
  styleUrl: './a-real-traceparent-header-w3c-trace-context.scss',
})
export class ARealTraceparentHeaderW3cTraceContextSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
