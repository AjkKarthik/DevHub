import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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

const quickRef: QuickRefItem[] = [
  { name: '.proto file',     type: 'syntax', desc: 'Schema definition language — defines messages and services for gRPC.' },
  { name: 'message',         type: 'keyword', desc: 'Strongly typed data structure — equivalent to a JSON object or C# class.' },
  { name: 'field number',    type: 'keyword', desc: 'Integer tag on each field — used for binary encoding; enables backwards compatibility.' },
  { name: 'protoc',          type: 'keyword', desc: 'Protocol Buffer compiler — generates typed classes/stubs in Go, TypeScript, C#, Java, etc.' },
  { name: 'proto3',          type: 'keyword', desc: 'Current major version — all fields optional by default, simpler than proto2.' },
  { name: 'WireType',        type: 'keyword', desc: 'Binary encoding type (varint, 64-bit, length-delimited, 32-bit) — determines how the value is encoded.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Protocol Buffers Overview',
    points: [
      'Protocol Buffers (protobuf) is Google\'s language-neutral, platform-neutral binary serialization format and IDL (Interface Definition Language).',
      'You define types in a .proto file and run protoc (the compiler) to generate typed client and server code in any supported language.',
      'Key advantages over JSON: smaller payload (3–10x smaller), faster serialization, schema-enforced types, and generated code eliminates hand-written serialization.',
      'Key trade-offs: binary (not human-readable without tooling), requires schema file to decode, slightly more complex tooling than JSON.',
    ],
  },
  {
    heading: 'Proto File Structure',
    points: [
      'Every .proto file starts with `syntax = "proto3";` and optionally `package` and `option go_package` / `option csharp_namespace`.',
      'Messages define the data structures. Each field has a type, name, and a field number. Field numbers must be unique within a message and NEVER reused once published.',
      'Scalar types: string, bytes, bool, int32, int64, uint32, uint64, float, double. No native Date type — use int64 (Unix timestamp) or google.protobuf.Timestamp.',
      'Repeated fields: `repeated string tags = 3;` — equivalent to an array. Map fields: `map<string, int32> labels = 4;`.',
      'Enum: `enum Status { UNKNOWN = 0; ACTIVE = 1; INACTIVE = 2; }` — the 0 value is the default and must be defined.',
    ],
  },
  {
    heading: 'Field Numbers and Backwards Compatibility',
    points: [
      'Field numbers are the key to backwards compatibility. The wire format encodes values by field number, not field name.',
      'Adding new fields with NEW field numbers is safe — old decoders ignore unknown fields; new decoders get zero/empty values for missing fields.',
      'NEVER reuse a field number. If you remove a field, mark it `reserved 3;` and `reserved "old_field_name";` to prevent future reuse causing corruption.',
      'Changing a field\'s type is usually a breaking change unless the new type is wire-compatible (e.g., int32 → int64 is usually fine; string → bytes is safe).',
    ],
  },
  {
    heading: 'Generated Code and Toolchain',
    points: [
      'Run `protoc --ts_out=. --ts_opt=target=node user.proto` to generate TypeScript. For Go: `--go_out=.`. For C#: `--csharp_out=.`.',
      'Generated code includes: message classes with getters/setters, serialization/deserialization methods, and gRPC service stubs (client + server interfaces).',
      'buf (buf.build) is the modern alternative to raw protoc — manages dependencies, linting, breaking change detection, and code generation in one tool.',
      'buf lint catches schema anti-patterns; `buf breaking` detects wire-breaking changes between versions of your .proto files.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: '.proto Schema',
    language: 'typescript',
    code: `// user.proto — Protocol Buffer schema definition
syntax = "proto3";

package user.v1;

import "google/protobuf/timestamp.proto";

// Enum — 0 value must be defined (proto3 default)
enum UserStatus {
  USER_STATUS_UNSPECIFIED = 0;
  USER_STATUS_ACTIVE      = 1;
  USER_STATUS_INACTIVE    = 2;
  USER_STATUS_SUSPENDED   = 3;
}

// Message — equivalent to a typed DTO/class
message User {
  string id           = 1;  // field number 1
  string email        = 2;  // field number 2
  string display_name = 3;  // snake_case in proto → camelCase in generated code
  UserStatus status   = 4;
  repeated string tags = 5;  // string[] equivalent
  google.protobuf.Timestamp created_at = 6;
  map<string, string> metadata = 7;

  // NEVER reuse field numbers. If you remove a field:
  // reserved 8;
  // reserved "old_phone_field";
}

// Service definition — defines the gRPC API
service UserService {
  rpc GetUser    (GetUserRequest)    returns (User);
  rpc CreateUser (CreateUserRequest) returns (User);
  rpc ListUsers  (ListUsersRequest)  returns (ListUsersResponse);
  rpc WatchUsers (WatchUsersRequest) returns (stream User); // server streaming
}

message GetUserRequest    { string id = 1; }
message CreateUserRequest { string email = 1; string display_name = 2; }
message ListUsersRequest  { int32 page_size = 1; string page_token = 2; }
message ListUsersResponse {
  repeated User users    = 1;
  string next_page_token = 2;
}
message WatchUsersRequest { repeated UserStatus statuses = 1; }`,
  },
  {
    label: 'TypeScript Generated Usage',
    language: 'typescript',
    code: `// Using generated TypeScript code from protoc / buf
import { UserServiceClient } from './generated/user/v1/user_grpc_pb';
import { GetUserRequest, CreateUserRequest } from './generated/user/v1/user_pb';
import * as grpc from '@grpc/grpc-js';

const client = new UserServiceClient(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// Strongly typed: no JSON.parse, no type casting
async function getUser(id: string) {
  const request = new GetUserRequest();
  request.setId(id);

  return new Promise((resolve, reject) => {
    client.getUser(request, (err, response) => {
      if (err) return reject(err);
      // response is a fully typed User message
      console.log(response.getEmail());       // string
      console.log(response.getStatus());      // UserStatus enum
      console.log(response.getTagsList());    // string[]
      resolve(response);
    });
  });
}

// With connect-es (modern typed client)
import { createPromiseClient } from '@connectrpc/connect';
import { UserService } from './generated/user/v1/user_connect';
import { createGrpcTransport } from '@connectrpc/connect-node';

const transport = createGrpcTransport({ baseUrl: 'http://localhost:50051' });
const connectClient = createPromiseClient(UserService, transport);

const user = await connectClient.getUser({ id: '42' });
// user is fully typed: user.email, user.status, user.tags, etc.`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Reusing field numbers after removing a field',
    wrong: `// v1: string old_name = 3;
// v2: removed old_name, added new_phone = 3;  ← REUSING NUMBER 3!
// Clients with cached v1 data will decode new_phone as old_name`,
    right: `// v2: mark removed field as reserved
reserved 3;
reserved "old_name";
// Then add new field with a NEW number
string new_phone = 8;`,
    explanation: 'Field numbers are encoded in the binary wire format. Reusing a number for a different field causes data corruption — old encoded data with field 3 will be decoded as the new field with field 3. Always mark removed fields as reserved.',
  },
  {
    title: 'Using 0 as a meaningful enum value (proto3 default issue)',
    wrong: `enum OrderStatus {
  PENDING   = 0;  // 0 is the default — unset fields look like PENDING
  PAID      = 1;
  CANCELLED = 2;
}`,
    right: `enum OrderStatus {
  ORDER_STATUS_UNSPECIFIED = 0;  // default; never a real status
  ORDER_STATUS_PENDING     = 1;
  ORDER_STATUS_PAID        = 2;
  ORDER_STATUS_CANCELLED   = 3;
}`,
    explanation: 'In proto3, unset enum fields default to 0. If 0 is a meaningful value (like PENDING), you can\'t distinguish "unset" from "pending". Always make 0 an UNSPECIFIED/UNKNOWN value. Also use the enum name as a prefix for each value to avoid naming conflicts across messages.',
  },
  {
    title: 'Using int64 for timestamps instead of google.protobuf.Timestamp',
    wrong: `int64 created_at = 5;  // Unix timestamp — loses timezone info, ambiguous units`,
    right: `import "google/protobuf/timestamp.proto";
google.protobuf.Timestamp created_at = 5;  // RFC 3339 compatible, nanosecond precision`,
    explanation: 'int64 for timestamps is ambiguous — is it seconds, milliseconds, or nanoseconds? google.protobuf.Timestamp (seconds + nanos) is the standard. It maps to well-known time types in generated code and is unambiguous.',
  },
  {
    title: 'Not prefixing enum value names with the enum type name',
    wrong: `enum Color { RED = 0; GREEN = 1; BLUE = 2; }
// In proto, enums are global — RED may conflict with another enum`,
    right: `enum Color { COLOR_UNSPECIFIED = 0; COLOR_RED = 1; COLOR_GREEN = 2; COLOR_BLUE = 3; }`,
    explanation: 'In Protocol Buffers, enum values are scoped to the package, not the enum type. Two enums with a RED = 1 value in the same package conflict. Prefix every enum value with the enum name in SCREAMING_SNAKE_CASE.',
  },
];

const challenge: Challenge = {
  title: 'Proto Field Validator',
  language: 'typescript',
  description: `Implement validateProtoFields(fields: {name: string, number: number}[]): string[] that returns an array of validation errors:
1. 'Duplicate field number {n}' if any field number appears more than once
2. 'Field number 0 is reserved in proto3' if any field uses number 0
3. 'Field name must be snake_case: {name}' if any name contains uppercase letters
Return [] if all fields are valid.`,
  hints: [
    'Use a Set or Map to detect duplicate field numbers',
    'Check for uppercase with /[A-Z]/.test(name)',
    'Field number 0 is always invalid in proto3',
  ],
  starterCode: `function validateProtoFields(fields: {name: string, number: number}[]): string[] {
  const errors: string[] = [];
  // TODO: validate fields
  return errors;
}`,
  solution: `function validateProtoFields(fields: {name: string, number: number}[]): string[] {
  const errors: string[] = [];
  const seen = new Map<number, string>();

  for (const field of fields) {
    if (field.number === 0) {
      errors.push('Field number 0 is reserved in proto3');
    } else if (seen.has(field.number)) {
      errors.push(\`Duplicate field number \${field.number}\`);
    } else {
      seen.set(field.number, field.name);
    }
    if (/[A-Z]/.test(field.name)) {
      errors.push(\`Field name must be snake_case: \${field.name}\`);
    }
  }
  return errors;
}

console.log(validateProtoFields([
  { name: 'user_id', number: 1 },
  { name: 'displayName', number: 2 }, // camelCase error
  { name: 'email', number: 1 },       // duplicate number
]));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why should you never reuse a Protocol Buffer field number after removing a field?',
    options: [
      'It causes a compilation error in protoc',
      'Field numbers are used in the binary wire format — reusing one corrupts old encoded data when decoded with new schema',
      'The protoc compiler automatically blocks field number reuse',
      'Field numbers must be sequential and gaps cause padding bytes',
    ],
    answer: 1,
    explanation: 'The binary wire format encodes values by field number (not by name). If you reuse field number 3 for a new field, old binary data that has field 3 encoded with the old type will be decoded as the new type — causing data corruption or parsing errors. Always mark removed field numbers as "reserved".',
  },
  {
    q: 'In proto3, what should the field with value 0 in an enum represent?',
    options: [
      'The most common / default value, like PENDING or ACTIVE',
      'An UNSPECIFIED or UNKNOWN sentinel — never a real business value',
      'The "null" or "empty" representation of the enum',
      'Field 0 is not allowed in proto3 enums',
    ],
    answer: 1,
    explanation: 'In proto3, enum fields default to 0 when not set. If 0 represents a real business value like PENDING, you cannot distinguish "unset" from "pending". Convention: always make 0 an UNSPECIFIED/UNKNOWN value (e.g., ORDER_STATUS_UNSPECIFIED = 0). Then PENDING = 1, etc.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use Protocol Buffers vs JSON?',
    a: '<strong>Use Protocol Buffers when</strong>: you need smaller payloads and faster serialization (IoT, mobile, high-throughput services); you control both client and server; you want schema-enforced types and generated code; you\'re building gRPC services. <strong>Use JSON when</strong>: you\'re building a public API consumed by third parties; human readability in logs/debugging matters; clients are browser JavaScript without complex build pipelines; the API is REST-first and schema is managed via OpenAPI. Many large systems use both: gRPC+protobuf for internal microservice communication, REST+JSON for public APIs.',
  },
  {
    q: 'What is buf and how does it differ from protoc?',
    a: '<code>protoc</code> is the raw Protocol Buffer compiler — you manage plugins, include paths, and flags manually. It\'s powerful but complex to configure. <code>buf</code> is a modern build tool that wraps protoc: it adds dependency management (buf.yaml), a module registry (buf.build), linting (buf lint), breaking change detection (buf breaking), and managed code generation (buf generate). For new projects, buf is the recommended approach. buf\'s breaking change detection is especially valuable — it runs in CI and fails the build if you accidentally introduce a wire-breaking proto change.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Protocol Buffers define strongly-typed messages and services in .proto files; field numbers are binary-encoded and must never be reused; protoc/buf generates typed client/server code.',
  mustKnow: [
    '.proto schema: syntax="proto3"; message with typed fields + field numbers; service with rpc methods',
    'Field numbers: never reuse — mark removed fields as reserved; enables backwards-compatible evolution',
    'Enum: 0 value must be UNSPECIFIED; prefix each value with enum name in SCREAMING_SNAKE_CASE',
    'google.protobuf.Timestamp for dates — not int64 (ambiguous units)',
    'repeated fields = arrays; map<K,V> for key-value stores',
    'buf is the modern toolchain: linting, breaking change detection, managed code generation',
  ],
  interviewFocus: [
    'Why should field numbers in Protocol Buffers never be reused?',
    'What is the advantage of Protocol Buffers over JSON for inter-service communication?',
    'How does protobuf enable backwards-compatible schema evolution?',
  ],
};

@Component({
  selector: 'app-api-protocol-buffers',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './protocol-buffers.html',
  styleUrl: './protocol-buffers.scss',
})
export class ApiProtocolBuffers {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
