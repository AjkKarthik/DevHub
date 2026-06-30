import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-go-json-encoding',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './json-encoding.html',
  styleUrl: './json-encoding.scss'
})
export class GoJsonEncoding {
  readingTime = 22;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Go 1.21+';
  route = 'go-json-encoding';
  nextRoute = '/go/grpc';
  nextLabel = 'gRPC';

  quickRef: QuickRefItem[] = [
    { name: 'json.Marshal(v)', type: 'function', desc: 'Encode value to []byte; returns error on unsupported types' },
    { name: 'json.Unmarshal(data, &v)', type: 'function', desc: 'Decode []byte into pointer; extra fields ignored by default' },
    { name: 'json.NewEncoder(w).Encode(v)', type: 'function', desc: 'Stream-encode to io.Writer; adds trailing newline' },
    { name: 'json.NewDecoder(r).Decode(&v)', type: 'function', desc: 'Stream-decode from io.Reader; efficient for large payloads' },
    { name: '`json:"name"`', type: 'syntax', desc: 'Rename field in JSON output' },
    { name: '`json:"name,omitempty"`', type: 'syntax', desc: 'Omit field when zero/nil/empty' },
    { name: '`json:"-"`', type: 'syntax', desc: 'Always exclude field from JSON marshalling' },
    { name: 'json.RawMessage', type: 'type', desc: 'Store raw JSON bytes; delay parsing or pass through unchanged' },
    { name: 'MarshalJSON() / UnmarshalJSON()', type: 'method', desc: 'Custom encode/decode logic for a type' },
    { name: 'json.Number', type: 'type', desc: 'Preserve numeric precision when decoding into interface{}' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How encoding/json works',
      points: [
        'encoding/json uses reflection to read struct fields tagged with `json:"..."`. Exported (uppercase) fields only.',
        'json.Marshal encodes to []byte; json.Unmarshal decodes from []byte. For streaming I/O, use Encoder/Decoder.',
        'json.NewEncoder(w).Encode(v) writes directly to an io.Writer — no intermediate []byte allocation. Preferred for HTTP responses.',
        'json.NewDecoder(r).Decode(&v) reads from an io.Reader one token at a time — efficient for large request bodies.',
        'Unexported fields and fields tagged `json:"-"` are silently skipped during both encode and decode.',
      ]
    },
    {
      heading: 'Struct tags',
      points: [
        '`json:"name"` — rename the field in JSON. Convention: snake_case or camelCase depending on your API style.',
        '`json:"name,omitempty"` — omit the field from output when it is the zero value (0, "", false, nil, empty slice/map).',
        '`json:"-"` — always exclude this field. Useful for passwords, internal fields, or computed values.',
        '`json:",string"` — encode/decode number or bool as a JSON string: `Price float64 \\`json:",string"\\``.',
        'Multiple options are comma-separated after the name: `json:"created_at,omitempty"`.',
      ]
    },
    {
      heading: 'Decoding into interface{} and json.Number',
      points: [
        'When unmarshalling into interface{}, JSON numbers become float64 by default — integer precision is lost above 2^53.',
        'Use json.NewDecoder + d.UseNumber() to get json.Number instead of float64; call .Int64() or .Float64() explicitly.',
        'JSON objects become map[string]interface{}; arrays become []interface{}.',
        'Prefer typed structs over interface{} decoding — safer, faster, and self-documenting.',
        'json.RawMessage defers decoding: store unknown JSON as bytes and decode later when the type is known.',
      ]
    },
    {
      heading: 'Custom marshalling',
      points: [
        'Implement json.Marshaler: MarshalJSON() ([]byte, error) — called instead of the default reflection logic.',
        'Implement json.Unmarshaler: UnmarshalJSON([]byte) error — called for custom decode logic.',
        'Common use cases: time.Time formatting, enum string conversion, computed fields, sensitive field masking.',
        'Embed an anonymous struct in MarshalJSON to add/rename fields without changing the real type.',
        'Be careful with pointer receivers in MarshalJSON — a non-pointer type will not satisfy the interface if the method is on a pointer.',
      ]
    },
    {
      heading: 'Performance and common patterns',
      points: [
        'For hot paths: pre-allocate []byte with json.Marshal to an existing buffer; or use github.com/bytedance/sonic / encoding/json/v2 (Go 1.24+).',
        'Use json.Decoder.DisallowUnknownFields() in strict APIs to reject unknown keys — useful for detecting typos in client requests.',
        'json.Decoder.Token() enables true streaming of large JSON arrays without loading the whole document into memory.',
        'Avoid encoding/decoding inside tight loops — batch where possible or use connection-level streaming.',
        'JSON null decodes to nil for pointers and the zero value for non-pointers. A missing key and a null key are indistinguishable with basic Unmarshal.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Marshal / Unmarshal',
      language: 'typescript',
      code: `package main

import (
    "encoding/json"
    "fmt"
    "time"
)

type Product struct {
    ID        int       \`json:"id"\`
    Name      string    \`json:"name"\`
    Price     float64   \`json:"price,omitempty"\` // omit if 0
    CreatedAt time.Time \`json:"created_at"\`
    internal  string    // unexported — skipped automatically
    Password  string    \`json:"-"\`              // always excluded
}

func main() {
    p := Product{
        ID:        1,
        Name:      "Widget",
        Price:     9.99,
        CreatedAt: time.Now(),
        Password:  "secret", // never appears in output
    }

    // Encode
    data, err := json.Marshal(p)
    if err != nil {
        panic(err)
    }
    fmt.Println(string(data))
    // {"id":1,"name":"Widget","price":9.99,"created_at":"2024-01-15T10:30:00Z"}

    // Decode
    var p2 Product
    if err := json.Unmarshal(data, &p2); err != nil {
        panic(err)
    }
    fmt.Println(p2.Name, p2.CreatedAt)
}`
    },
    {
      label: 'Encoder / Decoder',
      language: 'typescript',
      code: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "strings"
)

type User struct {
    ID   int    \`json:"id"\`
    Name string \`json:"name"\`
    Role string \`json:"role,omitempty"\`
}

func main() {
    // Encoder — stream to any io.Writer (e.g. http.ResponseWriter)
    var buf bytes.Buffer
    enc := json.NewEncoder(&buf)
    enc.SetIndent("", "  ") // pretty-print (dev only)

    users := []User{{1, "Alice", "admin"}, {2, "Bob", ""}}
    for _, u := range users {
        enc.Encode(u) // writes one JSON object per line + newline
    }
    fmt.Print(buf.String())

    // Decoder — stream from any io.Reader
    input := \`{"id":3,"name":"Carol","role":"user"}\`
    dec := json.NewDecoder(strings.NewReader(input))
    dec.DisallowUnknownFields() // reject typos in client JSON

    var u User
    if err := dec.Decode(&u); err != nil {
        fmt.Println("decode error:", err)
        return
    }
    fmt.Println(u.Name, u.Role) // Carol user
}`
    },
    {
      label: 'Custom Marshal',
      language: 'typescript',
      code: `package main

import (
    "encoding/json"
    "fmt"
    "strings"
)

type Status int

const (
    StatusPending Status = iota
    StatusActive
    StatusInactive
)

var statusNames = map[Status]string{
    StatusPending:  "pending",
    StatusActive:   "active",
    StatusInactive: "inactive",
}

var statusValues = map[string]Status{
    "pending":  StatusPending,
    "active":   StatusActive,
    "inactive": StatusInactive,
}

// MarshalJSON encodes Status as a JSON string
func (s Status) MarshalJSON() ([]byte, error) {
    name, ok := statusNames[s]
    if !ok {
        return nil, fmt.Errorf("unknown status: %d", int(s))
    }
    return json.Marshal(name) // returns quoted string
}

// UnmarshalJSON decodes a JSON string back to Status
func (s *Status) UnmarshalJSON(data []byte) error {
    var name string
    if err := json.Unmarshal(data, &name); err != nil {
        return err
    }
    v, ok := statusValues[strings.ToLower(name)]
    if !ok {
        return fmt.Errorf("unknown status: %q", name)
    }
    *s = v
    return nil
}

type Account struct {
    ID     int    \`json:"id"\`
    Status Status \`json:"status"\`
}

func main() {
    a := Account{ID: 1, Status: StatusActive}
    data, _ := json.Marshal(a)
    fmt.Println(string(data)) // {"id":1,"status":"active"}

    var a2 Account
    json.Unmarshal([]byte(\`{"id":2,"status":"pending"}\`), &a2)
    fmt.Println(a2.Status == StatusPending) // true
}`
    },
    {
      label: 'json.RawMessage',
      language: 'typescript',
      code: `package main

import (
    "encoding/json"
    "fmt"
)

// Event has a Type field that determines how to decode Data
type Event struct {
    Type string          \`json:"type"\`
    Data json.RawMessage \`json:"data"\` // defer decoding
}

type ClickData struct {
    X, Y int
}

type KeyData struct {
    Key string
}

func handleEvent(raw []byte) {
    var e Event
    if err := json.Unmarshal(raw, &e); err != nil {
        fmt.Println("parse error:", err)
        return
    }

    switch e.Type {
    case "click":
        var d ClickData
        json.Unmarshal(e.Data, &d)
        fmt.Printf("click at (%d, %d)\\n", d.X, d.Y)
    case "key":
        var d KeyData
        json.Unmarshal(e.Data, &d)
        fmt.Printf("key pressed: %s\\n", d.Key)
    }
}

func main() {
    handleEvent([]byte(\`{"type":"click","data":{"X":100,"Y":200}}\`))
    handleEvent([]byte(\`{"type":"key","data":{"Key":"Enter"}}\`))
}`
    },
    {
      label: 'json.Number & Unknown Fields',
      language: 'typescript',
      code: `package main

import (
    "encoding/json"
    "fmt"
    "strings"
)

func main() {
    // Problem: large integer loses precision as float64
    input := \`{"id": 9007199254740993}\` // 2^53 + 1

    var m1 map[string]any
    json.Unmarshal([]byte(input), &m1)
    fmt.Println(m1["id"]) // 9.007199254740992e+15 — wrong!

    // Fix: UseNumber preserves precision
    var m2 map[string]any
    dec := json.NewDecoder(strings.NewReader(input))
    dec.UseNumber()
    dec.Decode(&m2)

    num := m2["id"].(json.Number)
    id, _ := num.Int64()
    fmt.Println(id) // 9007199254740993 — correct

    // DisallowUnknownFields catches client mistakes
    type User struct {
        Name string \`json:"name"\`
    }
    dec2 := json.NewDecoder(strings.NewReader(\`{"name":"Alice","typo":true}\`))
    dec2.DisallowUnknownFields()
    var u User
    err := dec2.Decode(&u)
    fmt.Println(err) // json: unknown field "typo"
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Encoding unexported fields (silently ignored)',
      wrong: `type User struct {
    id   int    // unexported — silently skipped by encoding/json
    Name string
}
// json.Marshal produces {"Name":"Alice"} — id is missing`,
      right: `type User struct {
    ID   int    \`json:"id"\`   // exported + tagged
    Name string \`json:"name"\`
}`,
      explanation: 'encoding/json only processes exported (uppercase) struct fields. Unexported fields are silently skipped — no error, no panic. This is a common source of "why is my field missing?" bugs. Export the field and add a json tag to control the output name.'
    },
    {
      title: 'Losing integer precision through float64',
      wrong: `var m map[string]any
json.Unmarshal([]byte(\`{"id":9007199254740993}\`), &m)
id := int64(m["id"].(float64)) // precision lost — wrong value`,
      right: `dec := json.NewDecoder(strings.NewReader(input))
dec.UseNumber()
dec.Decode(&m)
id, _ := m["id"].(json.Number).Int64() // correct`,
      explanation: 'When decoding into interface{}, JSON numbers become float64, which can only represent integers exactly up to 2^53. IDs, timestamps, and large counters above this lose precision silently. Use dec.UseNumber() to get json.Number and parse explicitly.'
    },
    {
      title: 'Not checking Unmarshal errors',
      wrong: `var user User
json.Unmarshal(data, &user) // ignoring error
fmt.Println(user.Name)      // may be zero-value if parse failed`,
      right: `var user User
if err := json.Unmarshal(data, &user); err != nil {
    return fmt.Errorf("decode user: %w", err)
}`,
      explanation: 'json.Unmarshal returns an error for malformed JSON, type mismatches, and custom UnmarshalJSON errors. Ignoring it leaves the struct partially zero-valued — you silently process garbage data. Always check and propagate the error.'
    },
    {
      title: 'Using json.Marshal for HTTP responses (extra allocation)',
      wrong: `data, _ := json.Marshal(user)
w.Header().Set("Content-Type", "application/json")
w.Write(data) // allocates []byte then copies into ResponseWriter`,
      right: `w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(user) // streams directly, no intermediate []byte`,
      explanation: 'json.Marshal allocates a []byte then you Write it to ResponseWriter — two allocations and a copy. json.NewEncoder(w).Encode(v) writes directly to the ResponseWriter stream with no intermediate buffer. Prefer Encoder for HTTP handlers.'
    },
    {
      title: 'Misunderstanding omitempty with zero values',
      wrong: `type Stats struct {
    Count int  \`json:"count,omitempty"\`  // omitted when Count is 0
    Score float64 \`json:"score,omitempty"\` // omitted when Score is 0.0
}
// A count of 0 is meaningful but gets omitted — bug!`,
      right: `type Stats struct {
    Count *int     \`json:"count"\`  // pointer: nil = omit, 0 = explicit zero
    Score *float64 \`json:"score"\`
}`,
      explanation: 'omitempty omits a field when it equals the zero value: 0, "", false, nil, empty slice/map. If 0 or false is a meaningful value (a score of 0, a flag that is explicitly false), use a pointer — nil means "not set" and 0 means "zero explicitly".'
    },
    {
      title: 'MarshalJSON on value receiver when type is used as pointer',
      wrong: `func (s Status) MarshalJSON() ([]byte, error) { ... }

type Response struct {
    Status *Status \`json:"status"\` // pointer field — value receiver not called!
}`,
      right: `func (s *Status) MarshalJSON() ([]byte, error) { ... }
// OR ensure the field is not a pointer:
type Response struct {
    Status Status \`json:"status"\`
}`,
      explanation: 'If MarshalJSON is defined on a value receiver but the field is stored as a pointer, the interface is not satisfied — the default reflection marshalling is used instead. Either define MarshalJSON on the pointer receiver (*Status) or store the field as a value.'
    },
  ];

  challenge: Challenge = {
    title: 'Polymorphic Event Decoder',
    language: 'typescript',
    description: `Write a decoder that handles a stream of typed events, each with a different \`data\` shape.

\`\`\`json
{"type":"user_created","data":{"id":"u1","email":"a@b.com"}}
{"type":"order_placed","data":{"order_id":"o1","total":49.99}}
{"type":"unknown","data":{}}
\`\`\`

Define these types:
\`\`\`go
type UserCreated struct { ID string \`json:"id"\`; Email string \`json:"email"\` }
type OrderPlaced struct { OrderID string \`json:"order_id"\`; Total float64 \`json:"total"\` }
\`\`\`

Write \`func DecodeEvent(raw []byte) (string, any, error)\` that:
- Returns (type, typed-struct, nil) for known types
- Returns (type, nil, nil) for unknown types — not an error
- Returns ("", nil, err) for malformed JSON`,
    hints: [
      'Use a struct with Type string and Data json.RawMessage to parse in two passes',
      'Switch on the Type to decide which struct to unmarshal Data into',
      'Return the typed struct as the any return value',
      'Malformed outer JSON: Unmarshal error on the envelope struct',
    ],
    starterCode: `package main

import (
    "encoding/json"
    "fmt"
)

type UserCreated struct {
    ID    string \`json:"id"\`
    Email string \`json:"email"\`
}

type OrderPlaced struct {
    OrderID string  \`json:"order_id"\`
    Total   float64 \`json:"total"\`
}

func DecodeEvent(raw []byte) (string, any, error) {
    // TODO: implement
    return "", nil, nil
}

func main() {
    events := []string{
        \`{"type":"user_created","data":{"id":"u1","email":"a@b.com"}}\`,
        \`{"type":"order_placed","data":{"order_id":"o1","total":49.99}}\`,
        \`{"type":"unknown","data":{}}\`,
        \`not valid json\`,
    }
    for _, e := range events {
        typ, data, err := DecodeEvent([]byte(e))
        fmt.Printf("type=%q data=%v err=%v\\n", typ, data, err)
    }
}`,
    solution: `package main

import (
    "encoding/json"
    "fmt"
)

type UserCreated struct {
    ID    string \`json:"id"\`
    Email string \`json:"email"\`
}

type OrderPlaced struct {
    OrderID string  \`json:"order_id"\`
    Total   float64 \`json:"total"\`
}

type envelope struct {
    Type string          \`json:"type"\`
    Data json.RawMessage \`json:"data"\`
}

func DecodeEvent(raw []byte) (string, any, error) {
    var env envelope
    if err := json.Unmarshal(raw, &env); err != nil {
        return "", nil, fmt.Errorf("malformed event: %w", err)
    }

    switch env.Type {
    case "user_created":
        var d UserCreated
        if err := json.Unmarshal(env.Data, &d); err != nil {
            return env.Type, nil, fmt.Errorf("decode user_created: %w", err)
        }
        return env.Type, d, nil
    case "order_placed":
        var d OrderPlaced
        if err := json.Unmarshal(env.Data, &d); err != nil {
            return env.Type, nil, fmt.Errorf("decode order_placed: %w", err)
        }
        return env.Type, d, nil
    default:
        return env.Type, nil, nil // unknown type — not an error
    }
}

func main() {
    events := []string{
        \`{"type":"user_created","data":{"id":"u1","email":"a@b.com"}}\`,
        \`{"type":"order_placed","data":{"order_id":"o1","total":49.99}}\`,
        \`{"type":"unknown","data":{}}\`,
        \`not valid json\`,
    }
    for _, e := range events {
        typ, data, err := DecodeEvent([]byte(e))
        fmt.Printf("type=%q data=%v err=%v\\n", typ, data, err)
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which struct fields does encoding/json process?',
      options: [
        'Only exported (uppercase) fields — unexported fields are silently skipped',
        'All fields including unexported ones',
        'Only fields with a json struct tag',
        'Only fields with json:"..." tags that do not include "-"',
      ],
      answer: 0,
      explanation: 'encoding/json uses reflection and can only access exported fields (those starting with an uppercase letter). Unexported fields are silently ignored — no error is returned. This is a common source of "missing field" bugs when you accidentally leave a field lowercase.'
    },
    {
      q: 'What does `json:"name,omitempty"` do for an int field with value 0?',
      options: [
        'Omits the field from the JSON output because 0 is the zero value for int',
        'Outputs the field with value 0 as normal',
        'Causes a runtime panic',
        'Outputs the field as null',
      ],
      answer: 0,
      explanation: 'omitempty omits a field when it equals its zero value: 0 for int, "" for string, false for bool, nil for pointers/slices/maps. If 0 is a meaningful value in your domain (e.g., a score or counter), use a *int pointer instead so nil means "not set" and 0 means "explicitly zero".'
    },
    {
      q: 'What is the purpose of json.RawMessage?',
      options: [
        'To store raw JSON bytes and defer decoding until the concrete type is known',
        'To skip validation of the JSON structure',
        'To encode binary data as base64',
        'To allow decoding of malformed JSON',
      ],
      answer: 0,
      explanation: 'json.RawMessage is []byte that implements json.Marshaler and json.Unmarshaler — it stores the raw JSON bytes without parsing them. Use it when the type of a field is determined by another field (e.g., an event type+data pattern), or to pass through JSON unchanged.'
    },
    {
      q: 'Why should you prefer json.NewEncoder(w).Encode(v) over json.Marshal + w.Write in HTTP handlers?',
      options: [
        'Encoder streams directly to the writer with no intermediate []byte allocation',
        'Encoder automatically sets the Content-Type header',
        'Encoder is safer — it validates the JSON before writing',
        'Marshal is deprecated in Go 1.21+',
      ],
      answer: 0,
      explanation: 'json.Marshal allocates a []byte buffer for the entire JSON payload, then you Write it to the ResponseWriter — two allocations and a memory copy. json.NewEncoder(w).Encode(v) writes token-by-token directly to the io.Writer, avoiding the intermediate buffer. For large responses this is a meaningful performance difference.'
    },
    {
      q: 'How do you preserve large integer precision when decoding JSON into interface{}?',
      options: [
        'Use json.NewDecoder with dec.UseNumber() to get json.Number instead of float64',
        'Decode into int64 directly',
        'Use json.Marshal then json.Unmarshal to convert',
        'Large integers are always preserved accurately by encoding/json',
      ],
      answer: 0,
      explanation: 'By default, interface{} JSON numbers become float64, which can only represent integers exactly up to 2^53. Use dec.UseNumber() on a json.Decoder — numbers then decode as json.Number (a string type), and you call .Int64() or .Float64() explicitly, preserving full precision.'
    },
    {
      q: 'How do you implement custom JSON marshaling for a Go type?',
      options: ['Use struct tags only', 'Implement the json.Marshaler interface with a MarshalJSON() ([]byte, error) method', 'Implement Stringer interface', 'Use json.RegisterType'],
      answer: 1,
      explanation: 'Any type that implements MarshalJSON() ([]byte, error) controls its own JSON output. Similarly, UnmarshalJSON([]byte) error controls deserialization. This is used for: custom date formats (time.Time default is RFC3339), base64-encoding bytes, flattening nested structs, or adding computed fields. json.RawMessage is a []byte alias that implements both, useful for deferring or forwarding raw JSON.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I encode time.Time in a custom format?',
      a: 'Implement MarshalJSON and UnmarshalJSON on a custom type that wraps time.Time, or on a struct method. For example: func (t MyTime) MarshalJSON() ([]byte, error) { return json.Marshal(t.Time.Format("2006-01-02")) }. Alternatively, use a string field and parse it in your domain logic. The encoding/json package uses time.Time\'s built-in MarshalJSON which outputs RFC 3339 format — fine for most APIs.'
    },
    {
      q: 'How can I detect whether a JSON field was absent vs explicitly null?',
      a: 'Basic json.Unmarshal cannot distinguish between a missing key and an explicit null value — both result in the zero value or nil for pointers. To detect the difference, implement a custom UnmarshalJSON, or use a third-party library like go-optional. A common pattern is a pointer field: *string is nil for both missing and null, so this pattern only works if you can add further logic via a custom type.'
    },
    {
      q: 'What is the difference between json.Encoder.Encode and json.Marshal?',
      a: 'They produce identical JSON — the difference is purely in I/O model. json.Marshal returns a []byte. json.Encoder.Encode writes to an io.Writer and appends a trailing newline (\\n) after each value. The newline matters when encoding multiple values as a JSON stream (newline-delimited JSON / NDJSON) but can be surprising if you do not expect it in a single-value context.'
    },
    {
      q: 'How do I decode a JSON array of heterogeneous objects?',
      a: 'Decode into []json.RawMessage first, then iterate and switch on a discriminator field in each element. Example: json.Unmarshal(data, &raw), then for each element: unmarshal a struct with just the "type" field, switch on type, unmarshal again into the concrete type. This two-pass approach is explicit and handles every case cleanly without reflection tricks.'
    },
    {
      q: 'When should I use a third-party JSON library instead of encoding/json?',
      a: 'encoding/json is correct and sufficient for most Go services. Consider alternatives when: (1) you need maximum throughput — bytedance/sonic (uses JIT) or encoding/json/v2 (Go 1.24 experimental) are 3-10x faster; (2) you need strict schema validation — jsonschema libraries; (3) you need NDJSON streaming with position-aware error reporting — jsoniter or segmentio/encoding/json. Profile before switching — encoding/json is rarely the bottleneck.'
    },
    {
      q: 'How do I add fields to JSON output without changing the original struct?',
      a: 'Use an anonymous struct in MarshalJSON: embed the original struct and add extra fields. func (u User) MarshalJSON() ([]byte, error) { type Alias User; return json.Marshal(struct { Alias; Extra string }{Alias: Alias(u), Extra: "computed"}) }. The Alias trick prevents infinite recursion — without it, MarshalJSON calls itself. This pattern is also used to rename fields in output without changing the real struct.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'encoding/json maps exported struct fields via reflection — use Encoder for streaming, json.RawMessage for deferred decode, and pointer fields when zero values are meaningful.',
    mustKnow: [
      'Only exported fields are marshalled — unexported fields are silently skipped.',
      'json:"name,omitempty" omits zero values; use *T pointers when 0/false is meaningful.',
      'json.NewEncoder(w).Encode(v) streams to io.Writer — preferred for HTTP responses.',
      'json.RawMessage stores raw bytes for deferred or polymorphic decoding.',
      'Large integers lose precision as float64 — use dec.UseNumber() and json.Number.',
      'dec.DisallowUnknownFields() rejects unknown keys — useful for strict API validation.',
      'Custom MarshalJSON/UnmarshalJSON — use pointer receiver and the Alias trick to avoid recursion.',
    ],
    interviewFocus: [
      'What does omitempty do and when does it cause bugs?',
      'How does json.RawMessage enable polymorphic JSON decoding?',
      'Why does decoding large integers into interface{} lose precision?',
      'What is the Alias trick in custom MarshalJSON and why is it needed?',
      'When would you choose json.Encoder over json.Marshal?',
    ],
  };
}
