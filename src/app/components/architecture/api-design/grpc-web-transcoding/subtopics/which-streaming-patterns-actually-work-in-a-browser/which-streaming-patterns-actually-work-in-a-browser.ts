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
    heading: 'Connecting This Page’s Capability Claims to the Sibling gRPC Service Patterns Topic',
    points: [
      'The main page states the capability split precisely: "gRPC-Web supports unary and server-streaming... Client and bidirectional streaming are NOT supported in gRPC-Web" while "Connect supports all 4 streaming patterns in browsers." No codeTab checks a GIVEN rpc’s pattern against a chosen transport and answers "can this actually be called from a browser?"',
      'This hub’s sibling gRPC Service Patterns topic already built a <code>identifyGrpcPattern()</code> function (in its own Challenge) that classifies a proto rpc definition into exactly one of four named patterns: <code>\'Unary\'</code>, <code>\'Server Streaming\'</code>, <code>\'Client Streaming\'</code>, <code>\'Bidirectional Streaming\'</code>. Reusing those SAME pattern names lets a browser-compatibility check be expressed as a simple lookup, rather than reinventing a separate classification.',
      'The two transports’ capability sets aren’t just "Connect is a superset with more features" in some vague sense — Connect’s set literally CONTAINS gRPC-Web’s entire set plus the two patterns gRPC-Web cannot do at all, which is exactly what makes Connect a safe default choice when browser streaming support is uncertain.',
      'This check answers "can I call this rpc from a browser via this transport at all" — a separate, prior question from whether the call will actually SUCCEED at runtime (network errors, auth failures, etc.), which no static capability table can predict.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Browser Transport Capability Check',
    language: 'typescript',
    code: `type GrpcPattern = 'Unary' | 'Server Streaming' | 'Client Streaming' | 'Bidirectional Streaming';
type BrowserTransport = 'grpc-web' | 'connect';

// Matches this page's own stated capabilities exactly:
// gRPC-Web: unary + server streaming only.
// Connect: all four patterns.
const CAPABILITIES: Record<BrowserTransport, Set<GrpcPattern>> = {
  'grpc-web': new Set(['Unary', 'Server Streaming']),
  connect: new Set(['Unary', 'Server Streaming', 'Client Streaming', 'Bidirectional Streaming']),
};

function canCallFromBrowser(transport: BrowserTransport, pattern: GrpcPattern): boolean {
  return CAPABILITIES[transport].has(pattern);
}

// Reuses the SAME classifier this hub's gRPC Service Patterns topic
// already built in its own Challenge -- no need to reclassify by hand.
function identifyGrpcPattern(proto: string): GrpcPattern | 'Unknown' {
  const parts = proto.split('returns');
  if (parts.length !== 2) return 'Unknown';
  const [requestPart, responsePart] = parts;
  const clientStream = requestPart.includes('stream');
  const serverStream = responsePart.includes('stream');
  if (clientStream && serverStream) return 'Bidirectional Streaming';
  if (clientStream) return 'Client Streaming';
  if (serverStream) return 'Server Streaming';
  return 'Unary';
}

const rpcs = [
  'rpc GetUser(GetUserRequest) returns (User)',
  'rpc WatchUsers(WatchRequest) returns (stream User)',
  'rpc ImportUsers(stream CreateUserRequest) returns (ImportResult)',
  'rpc Chat(stream ChatMessage) returns (stream ChatMessage)',
];

for (const rpc of rpcs) {
  const pattern = identifyGrpcPattern(rpc) as GrpcPattern;
  console.log(
    pattern.padEnd(24),
    'grpc-web:', canCallFromBrowser('grpc-web', pattern),
    ' connect:', canCallFromBrowser('connect', pattern)
  );
}
// Unary                    grpc-web: true   connect: true
// Server Streaming         grpc-web: true   connect: true
// Client Streaming         grpc-web: false  connect: true
// Bidirectional Streaming  grpc-web: false  connect: true`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The <code>Chat</code> rpc from this hub’s sibling gRPC Service Patterns topic is Bidirectional Streaming — <code>canCallFromBrowser(\'grpc-web\', \'Bidirectional Streaming\')</code> correctly returns <code>false</code>. The main page’s own mistake block on THIS topic recommends "batch the upload in a single unary call" as one fix for a similar Client Streaming rpc that can’t be called via gRPC-Web. Would that same "batch into unary" fix work for making <code>Chat</code> callable via gRPC-Web too?',
  hint: 'What does the "batch into unary" fix actually change about the RPC — does it eliminate ALL streaming, or specifically the CLIENT side of a stream? What would batching a genuinely bidirectional, ongoing conversation (like chat) into one single request/response pair actually mean for the feature?',
  solution: `// The "batch into unary" fix genuinely works for Client Streaming (the
// UploadFiles example this page's own mistake block uses) because that
// pattern's entire job is collecting many pieces of data and producing
// ONE final result -- batching all the chunks into a single request
// array and sending it as one unary call preserves the actual USE CASE
// (get all the data uploaded, get back one confirmation) while only
// changing HOW the data arrives at the server.

// Bidirectional streaming's whole point (as this hub's own gRPC Service
// Patterns topic states) is an ONGOING, back-and-forth exchange where
// EITHER side can send at any time, independently of the other -- a
// live chat conversation doesn't have a natural "collect everything,
// then send it all at once" batching point, because there is no fixed
// end to when the exchange stops. Converting Chat to a single unary
// call would mean giving up real-time back-and-forth entirely, not
// preserving it in a different transport -- it isn't a workaround for
// the SAME feature, it's replacing the feature with a fundamentally
// different one (a poll-based chat, at best). For Chat specifically,
// the real options are Connect (full streaming support) or a different
// browser-native mechanism entirely (WebSockets), not batching.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'gRPC-Web and Connect support roughly overlapping but different sets of streaming patterns — some things work in one but not the other, and vice versa.',
    reality: 'The codeTab’s own <code>CAPABILITIES</code> table shows Connect’s set is a strict SUPERSET of gRPC-Web’s — every pattern gRPC-Web supports (Unary, Server Streaming), Connect also supports, PLUS the two gRPC-Web cannot do at all (Client Streaming, Bidirectional Streaming). There is no pattern gRPC-Web supports that Connect does not.',
  },
  {
    thought: 'Checking whether an rpc CAN be called from a browser via a given transport also tells you whether that specific call will succeed at runtime.',
    reality: 'The capability check answers a purely STATIC question — is this streaming pattern even supported by this transport at the protocol level — completely independent of whether a specific call at a specific moment succeeds. A <code>canCallFromBrowser</code> result of <code>true</code> says nothing about network failures, authentication, or server-side errors that could still make an individual call fail; it only rules out an entire category of "this transport structurally cannot do this at all."',
  },
  {
    thought: '"Batch into a single unary call" is a general-purpose fix for any streaming pattern gRPC-Web doesn’t support, including bidirectional streaming.',
    reality: 'The Try It above traces why this fix is specific to Client Streaming’s own shape (many inputs, one final output) — it does not generalize to Bidirectional Streaming, whose entire value is an ongoing, real-time exchange with no natural single "batch point." For a genuinely bidirectional use case like chat, the real options are a transport that supports it (Connect) or a different mechanism (WebSockets), not batching.',
  },
];

@Component({
  selector: 'app-api-grpc-web-capability-check',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './which-streaming-patterns-actually-work-in-a-browser.html',
  styleUrl: './which-streaming-patterns-actually-work-in-a-browser.scss',
})
export class WhichStreamingPatternsActuallyWorkInABrowserSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
