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
    heading: '"Any Message, Tagged With Its Type URL" — What That Actually Means in Code',
    points: [
      'The main page’s QnA on well-known types describes <code>google.protobuf.Any</code> in one sentence: "can hold any proto message, tagged with its type URL. For polymorphic fields." No codeTab anywhere on the page shows what a type URL actually looks like, or the code that reads one to decode the right message type.',
      'An <code>Any</code> value is really just two things bundled together: a <code>type_url</code> string (by convention, <code>type.googleapis.com/&lt;fully.qualified.MessageName&gt;</code>) and the serialized bytes of that specific message. Nothing about <code>Any</code> itself is polymorphic — the polymorphism comes entirely from a REGISTRY that maps type URLs to the decoder for that specific message type.',
      'This is the same underlying idea as the discriminator-based <code>oneOf</code> routing already covered on this hub’s OpenAPI & Contracts topic — a tag value picks which decoder to run — just using a fully-qualified type name as the tag instead of a short enum-like string.',
      'An <code>Any</code> whose <code>type_url</code> the receiving code doesn’t recognize (a newer message type an older consumer was never updated to understand) is a real, expected case — the correct behavior is a clear, explicit error, not treating the missing registry entry as this specific payload being malformed.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Any: Pack, Unpack, Registry',
    language: 'typescript',
    code: `interface AnyMessage {
  typeUrl: string;
  // Real protobuf.Any stores raw serialized bytes here; a JSON string
  // stands in for that in this illustrative, dependency-free version.
  value: string;
}

type Decoder = (data: any) => unknown;

const registry = new Map<string, Decoder>();

function registerType(typeUrl: string, decode: Decoder): void {
  registry.set(typeUrl, decode);
}

function packAny(typeUrl: string, message: unknown): AnyMessage {
  return { typeUrl, value: JSON.stringify(message) };
}

function unpackAny(any: AnyMessage): unknown {
  const decode = registry.get(any.typeUrl);
  if (!decode) {
    // A genuinely different case from "this payload is malformed" --
    // the payload is well-formed, we just don't have a decoder
    // registered for this specific type yet.
    throw new Error(\`Unknown type URL: \${any.typeUrl}\`);
  }
  return decode(JSON.parse(any.value));
}

registerType('type.googleapis.com/payments.v1.CreditCard', (data) => ({ kind: 'CreditCard', ...data }));
registerType('type.googleapis.com/payments.v1.BankTransfer', (data) => ({ kind: 'BankTransfer', ...data }));

const packedCard = packAny('type.googleapis.com/payments.v1.CreditCard', { cardNumber: '4111' });
const packedBank = packAny('type.googleapis.com/payments.v1.BankTransfer', { accountNumber: '12345' });

console.log(unpackAny(packedCard));
// { kind: 'CreditCard', cardNumber: '4111' }

console.log(unpackAny(packedBank));
// { kind: 'BankTransfer', accountNumber: '12345' }

try {
  unpackAny(packAny('type.googleapis.com/payments.v1.Crypto', { address: 'abc' }));
} catch (e: any) {
  console.log('THREW:', e.message);
  // THREW: Unknown type URL: type.googleapis.com/payments.v1.Crypto
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A field typed <code>google.protobuf.Any events = 1;</code> lets a message hold events of genuinely unrelated types — an <code>OrderPlaced</code> event, a <code>PaymentReceived</code> event, a completely unrelated <code>UserLoggedIn</code> event — all in the same field. What would you have needed to do differently on this page’s own <code>User</code> message (with its fixed <code>UserStatus status</code> field) if <code>status</code> had instead needed to hold values of genuinely different message TYPES depending on context, not just different values of one enum?',
  hint: 'The main page’s own <code>UserStatus</code> enum picks between a small, FIXED, closed set of named values known at schema-design time. What does <code>Any</code> let a field do that a plain enum structurally cannot?',
  solution: `// An enum like UserStatus picks between a small, closed set of VALUES
// of the SAME type -- the schema author enumerates every possible
// status up front (UNSPECIFIED, ACTIVE, INACTIVE, SUSPENDED), and every
// consumer's generated code knows the complete list at compile time.

// Any is a fundamentally different mechanism: it lets a field hold a
// message of a TYPE the schema author never had to enumerate in
// advance -- including a brand-new message type added to the system
// LONG AFTER the field itself was defined, with zero changes needed to
// the .proto file declaring the Any field. A UserStatus enum can never
// do this -- adding a new possible "status" always requires editing
// the enum's own .proto definition and regenerating code everywhere.

// If status needed to hold genuinely different message TYPES (not just
// different values of one closed enum), the field's type would need to
// change from "UserStatus status = 4;" to something like
// "google.protobuf.Any status_detail = 4;" -- trading the enum's
// compile-time exhaustiveness checking for Any's open-ended
// extensibility, plus the registry-lookup responsibility (and the
// "unknown type URL" failure mode) demonstrated in the codeTab above.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '<code>google.protobuf.Any</code> is itself a polymorphic type — the protobuf runtime automatically knows how to decode whatever message is packed inside it.',
    reality: '<code>Any</code> is genuinely just a plain struct holding a <code>type_url</code> string and raw bytes — it carries NO decoding intelligence of its own. Every bit of the actual polymorphism comes from application code maintaining a registry (as the codeTab’s <code>registry</code> Map does) that maps a type URL to the specific decoder for that type. Remove the registry, and an <code>Any</code> is just an opaque tagged blob nothing can meaningfully decode.',
  },
  {
    thought: 'An unrecognized type URL means the packed payload itself is corrupted or invalid.',
    reality: 'The payload can be perfectly well-formed — the codeTab’s <code>Crypto</code> example packs a completely valid <code>{ address: \'abc\' }</code> object with a syntactically correct type URL. The failure is entirely about the RECEIVING code’s registry not having an entry for that specific type yet — a very normal situation when a newer message type is introduced and an older consumer hasn’t been updated to recognize it.',
  },
  {
    thought: '<code>Any</code> is protobuf’s equivalent of TypeScript’s <code>any</code> type — a way to opt out of type safety entirely.',
    reality: 'Despite the shared name, <code>google.protobuf.Any</code> is closer to a TAGGED UNION than to TypeScript’s escape-hatch <code>any</code> — every packed value carries an explicit type identifier (<code>typeUrl</code>) that tells a REGISTRY-AWARE consumer exactly how to decode it safely. It’s open-ended (new types can be added later) but not untyped — the codeTab’s own <code>unpackAny()</code> throws rather than silently returning garbage for a type it doesn’t recognize.',
  },
];

@Component({
  selector: 'app-api-protobuf-any',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './google-protobuf-any-real-polymorphic-pack-unpack.html',
  styleUrl: './google-protobuf-any-real-polymorphic-pack-unpack.scss',
})
export class GoogleProtobufAnyRealPolymorphicPackUnpackSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
