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
    heading: '"Clients Set Content-Type" — What the Server Actually Does With It',
    points: [
      'The main page’s own QnA on the Connect protocol states: "clients set <code>Content-Type</code> to <code>application/proto</code> or <code>application/json</code>... JSON encoding allows human-readable debugging." No codeTab on the page shows a server actually reading that header and branching its behavior on it.',
      'A Connect server genuinely needs to do TWO things per request based on the same header: DECODE the incoming body using the format the client says it sent, and ENCODE the outgoing response back in that SAME format — a client that sent JSON expects a JSON response back, not protobuf bytes.',
      'This is a real, general content-negotiation pattern, not something specific to Connect — the same idea (the request tells the server what format to respond in) already underlies HTTP’s own <code>Accept</code>/<code>Content-Type</code> header conventions this hub covers elsewhere for plain REST APIs.',
      'An unrecognized <code>Content-Type</code> is a real, expected failure case a Connect server has to handle explicitly — the main page’s own theory doesn’t enumerate every value a real server must guard against, only the two supported ones.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Content-Type-Driven Encode/Decode',
    language: 'typescript',
    code: `type SupportedContentType = 'application/json' | 'application/proto';

// A real protobuf codec would decode actual binary bytes here -- this
// illustrative stand-in wraps the raw payload to keep the DECODE/ENCODE
// symmetry visible without pulling in a real protobuf runtime.
function decodeBody(contentType: string, rawBody: string): any {
  if (contentType === 'application/json') return JSON.parse(rawBody);
  if (contentType === 'application/proto') return { __binary: rawBody };
  throw new Error(\`Unsupported Content-Type: \${contentType}\`);
}

function encodeResponse(contentType: string, data: unknown): string {
  if (contentType === 'application/json') return JSON.stringify(data);
  if (contentType === 'application/proto') return \`<binary:\${JSON.stringify(data)}>\`;
  throw new Error(\`Unsupported Content-Type: \${contentType}\`);
}

function handleUnary(
  contentType: string,
  rawBody: string,
  handler: (req: any) => unknown
): { contentType: string; body: string } {
  const request = decodeBody(contentType, rawBody);
  const response = handler(request);
  // Respond in the SAME format the client requested -- never switch
  // formats between what was sent and what comes back.
  return { contentType, body: encodeResponse(contentType, response) };
}

const getUserHandler = (req: { id: string }) => ({ id: req.id, email: 'jane@example.com' });

console.log(handleUnary('application/json', '{"id":"42"}', getUserHandler));
// { contentType: 'application/json', body: '{"id":"42","email":"jane@example.com"}' }

console.log(handleUnary('application/proto', 'RAW_BYTES_STAND_IN', getUserHandler));
// { contentType: 'application/proto', body: '<binary:{"email":"jane@example.com"}>' }
// -- no "id" in this response: the illustrative proto decoder above never
// extracts a real "id" field from raw bytes, unlike the JSON path.

try {
  handleUnary('text/plain', 'x', getUserHandler);
} catch (e: any) {
  console.log('THREW:', e.message);
  // THREW: Unsupported Content-Type: text/plain
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The <code>application/proto</code> case above produces a response missing the <code>id</code> field, while the identical <code>application/json</code> case correctly includes it. Is this a bug in <code>handleUnary</code>, or an expected consequence of how the illustrative <code>decodeBody</code> stand-in works?',
  hint: 'What does <code>decodeBody</code> actually return for the <code>application/proto</code> branch — does it extract an <code>id</code> field from <code>rawBody</code> at all, the way <code>JSON.parse</code> does for the JSON branch?',
  solution: `// This is an expected consequence of the STAND-IN, not a bug in
// handleUnary itself. The JSON branch of decodeBody genuinely parses
// the raw string into a real object with an "id" field
// (JSON.parse('{"id":"42"}') -> { id: '42' }), which the handler then
// reads and echoes back.

// The proto branch, being an illustrative stand-in rather than a real
// protobuf decoder, just wraps the raw bytes in { __binary: rawBody }
// -- it never actually extracts any named field like "id" from that
// payload at all. So req.id is undefined inside getUserHandler for the
// proto case, and the response correctly reflects that: no id field,
// because none was ever decoded.

// A REAL protobuf decoder would parse the binary bytes against the
// message's own schema and produce a proper { id: '42' } object, just
// like JSON.parse does for JSON -- the missing field here is purely an
// artifact of this subtopic's simplified stand-in, not a flaw in the
// content-negotiation LOGIC (which correctly branches on Content-Type
// and correctly encodes the response back in the same format either
// way) that this subtopic is actually demonstrating.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A Connect server can decode a request in one format (say, JSON) and freely respond in a different format (say, protobuf) — the client just has to parse whatever comes back.',
    reality: 'The codeTab’s <code>handleUnary</code> deliberately reuses the SAME <code>contentType</code> value for both decoding the request AND encoding the response — a client that sent <code>application/json</code> gets an <code>application/json</code> response back, never protobuf. Silently switching formats would break any client that only knows how to parse the format it itself sent.',
  },
  {
    thought: 'Content negotiation via <code>Content-Type</code> is a Connect-specific mechanism, unrelated to how ordinary REST APIs work.',
    reality: 'This is the SAME general HTTP content-negotiation idea this hub already covers for plain REST APIs (a request’s headers determining what format the response comes back in) — Connect isn’t inventing a new mechanism, it’s applying the same well-established pattern to choosing between JSON and binary protobuf encodings specifically.',
  },
  {
    thought: 'An unsupported <code>Content-Type</code> value should be silently ignored, falling back to a default encoding rather than failing the request.',
    reality: 'The codeTab’s <code>decodeBody</code>/<code>encodeResponse</code> both explicitly <code>throw</code> on an unrecognized <code>Content-Type</code> — confirmed by the <code>text/plain</code> example — rather than silently guessing a default. A client that specifies a format the server genuinely cannot handle needs an explicit, clear error, not a response encoded in a format it never asked for and may not be able to parse.',
  },
];

@Component({
  selector: 'app-api-grpc-web-content-negotiation',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './content-negotiation-on-a-connect-server.html',
  styleUrl: './content-negotiation-on-a-connect-server.scss',
})
export class ContentNegotiationOnAConnectServerSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
