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
  templateUrl: './embedded-methods-satisfy-interfaces-too.html',
  styleUrl: './embedded-methods-satisfy-interfaces-too.scss'
})
export class EmbeddedMethodsSatisfyInterfacesTooSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Promoted methods are not just callable — they genuinely join the outer type\'s own method set',
      points: [
        'The main page\'s own theory covers embedding purely as a way to reuse code: "Embedding promotes all exported methods and fields of the embedded type to the outer struct." That framing is correct but leaves an important question unanswered — does a "promoted" method count as a REAL member of the outer struct\'s own method set, the specific thing Go checks when deciding whether a type satisfies an interface?',
        'The Go spec answers this directly and unambiguously: "Given a struct type S and a type name T, promoted methods are included in the method set of the struct as follows: If S contains an embedded field T, the method sets of S and *S both include promoted methods with receiver T." This is not a looser, "you can still call it" guarantee — the spec states the promoted method is genuinely INCLUDED IN the method set, the exact same set interface satisfaction is checked against.',
        'The direct, practical consequence: a struct can satisfy an interface ENTIRELY through an embedded field\'s methods, without implementing a single one of the interface\'s required methods itself. If type Base struct{} has a method Base.Speak(), and type Wrapper struct { Base } embeds it with no methods of its own, Wrapper still satisfies any interface requiring only Speak() — purely because Speak() was promoted into Wrapper\'s own method set by the embedding.',
      ]
    },
    {
      heading: 'The pointer-embedding case follows the exact same rule as method sets generally',
      points: [
        'The spec extends this with the identical value/pointer distinction covered by method sets generally: "If S contains an embedded field *T, the method sets of S and *S both include promoted methods with receiver T or *T." Embedding a POINTER to T (rather than T directly) promotes BOTH T\'s value-receiver and pointer-receiver methods into S\'s own method set, unconditionally — even S itself (not just *S) gets the full combined set, since going through the embedded pointer already provides the addressability a pointer-receiver method needs.',
        'This is a genuinely useful, deliberate design pattern worth recognizing on sight: embedding an interface (rather than a concrete struct) inside another struct is a common way to build partial implementations or mocks in tests, per the main page\'s own QnA — "Embedding an interface in a struct is used for partial implementations and mocking in tests... You store a concrete implementation at runtime and only override the methods you care about." That pattern works BECAUSE promoted methods (here, from whatever concrete value is stored in the embedded interface field at runtime) genuinely join the outer struct\'s own method set, letting the outer struct satisfy a larger interface while only explicitly defining the one or two methods a test actually needs to control.',
        'The failure mode worth watching for is the mirror image of the mocking pattern\'s success: if a struct embeds an INTERFACE field and that field is left nil (never assigned a concrete implementation), the struct still formally satisfies whatever interface requires those promoted methods — the compiler is satisfied — but calling one of those promoted methods at runtime panics with a nil pointer dereference, since there is no concrete implementation behind the embedded interface value to actually dispatch the call to.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A struct with ZERO methods of its own satisfies an interface, purely via embedding',
      language: 'typescript',
      code: `package main

import "fmt"

type Logger struct{}

func (l Logger) Log(msg string) { fmt.Println("[LOG]", msg) }

type CanLog interface {
	Log(msg string)
}

// Service defines NO methods of its own at all -- it embeds Logger.
type Service struct {
	Logger
	Name string
}

func acceptsLogger(l CanLog) {
	l.Log("called from acceptsLogger")
}

func main() {
	svc := Service{Name: "billing"}

	// Service satisfies CanLog purely through the PROMOTED Log method
	// from its embedded Logger field -- per the Go spec's own rule:
	// "promoted methods are included in the method set of the struct."
	acceptsLogger(svc)   // [LOG] called from acceptsLogger

	// Confirmed directly: Service itself never wrote "func (s Service)
	// Log(...)" anywhere -- the ENTIRE CanLog contract is satisfied by
	// what Logger contributes through embedding.
	var _ CanLog = Service{}   // compiles -- confirms satisfaction`,
    },
    {
      label: 'The mocking pattern this enables — and its nil-embedded-interface trap',
      language: 'typescript',
      code: `package main

import "fmt"

type Notifier interface {
	Notify(msg string)
}

// TestHarness embeds the INTERFACE, not a concrete type -- letting a
// test substitute exactly one method's behavior at runtime.
type TestHarness struct {
	Notifier // embedded interface field
}

func triggerAlert(n Notifier) {
	n.Notify("something happened")
}

type mockNotifier struct{ received []string }

func (m *mockNotifier) Notify(msg string) { m.received = append(m.received, msg) }

func main() {
	mock := &mockNotifier{}
	harness := TestHarness{Notifier: mock}   // concrete impl provided

	triggerAlert(harness)   // works -- promoted Notify() dispatches
	                          // to mock's own implementation
	fmt.Println(mock.received) // [something happened]

	// THE TRAP: an embedded interface left nil still SATISFIES the
	// interface at compile time (the method is still "promoted" and
	// present in the method set) -- but calling it panics at runtime,
	// since there is no concrete value behind it to dispatch to.
	broken := TestHarness{} // Notifier field is nil -- no assignment
	var _ Notifier = broken  // compiles fine!

	defer func() {
		if r := recover(); r != nil {
			fmt.Println("recovered:", r)
			// recovered: runtime error: invalid memory address or
			// nil pointer dereference
		}
	}()
	broken.Notify("this will panic") // nil embedded interface, no impl`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A codebase has type ReadCloser interface { Read(p []byte) (int, error); Close() error }. A developer defines type BufferedFile struct { *os.File; buf []byte } (embedding a pointer to os.File, which already implements both Read and Close), adds no Read or Close methods of their own, and is surprised that var _ ReadCloser = &BufferedFile{} compiles successfully despite BufferedFile never mentioning Read or Close anywhere in its own definition. Explain why, using what this subtopic covers.',
    hint: 'Per this subtopic\'s theory, when a struct embeds a POINTER to a type (like *os.File), which methods get promoted into the outer struct\'s own method set — only os.File\'s value-receiver methods, or something broader? Does *os.File itself already implement Read and Close?',
    solution: 'The compilation succeeds because BufferedFile\'s own method set already contains Read and Close, entirely through promotion from its embedded *os.File field — per this subtopic\'s theory and Go\'s own spec, "if S contains an embedded field *T, the method sets of S and *S both include promoted methods with receiver T or *T," meaning embedding a POINTER to os.File promotes the FULL combined set of os.File\'s value- and pointer-receiver methods into BufferedFile\'s own method set (and *BufferedFile\'s too). Since *os.File already implements both Read(p []byte) (int, error) and Close() error (as part of the standard library\'s own os.File type), those exact method implementations become part of BufferedFile\'s promoted method set the moment *os.File is embedded, with zero additional code required from the developer. This is exactly the mechanism this subtopic\'s theory describes: BufferedFile satisfies ReadCloser purely through what it embeds, never defining Read or Close itself — the compiler check var _ ReadCloser = &BufferedFile{} succeeds because &BufferedFile{}\'s method set (via promotion) genuinely contains every method ReadCloser requires, exactly matching the interface-satisfaction rule this subtopic\'s theory covers. This is also a common, deliberate Go idiom for "wrapping" an existing type with extra fields (here, a buf []byte) while inheriting its full interface compliance for free — no explicit forwarding methods need to be hand-written.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Struct embedding is purely a code-reuse convenience — a promoted method can be CALLED on the outer struct, but the outer struct does not genuinely "have" that method for stricter purposes like interface satisfaction, which the outer struct\'s own explicitly-defined methods still have to cover.',
      reality: 'This subtopic\'s theory and first code example show the opposite is directly stated in Go\'s own spec — "promoted methods are included in the method set of the struct" — meaning a promoted method is a full, genuine member of the outer struct\'s own method set, sufficient by itself to satisfy an interface requirement, with zero methods needing to be defined directly on the outer struct at all.'
    },
    {
      thought: 'Embedding an interface field (rather than a concrete type) inside a struct is a rare, advanced pattern with no meaningful practical use beyond unusual edge cases.',
      reality: 'This subtopic\'s theory and second code example show this is a well-established, deliberate Go idiom specifically for building test mocks and partial implementations — the main page\'s own QnA already flags it ("used for partial implementations and mocking in tests"), and this subtopic explains precisely why it works: the embedded interface\'s promoted methods join the outer struct\'s own method set, letting the outer struct satisfy a larger interface while a test only needs to override the one or two methods it actually cares about controlling.'
    },
    {
      thought: 'If a struct embeds an interface field and that field is left nil (unassigned), the struct will simply fail to compile against any interface requiring the embedded interface\'s methods, since there is no real implementation available.',
      reality: 'This subtopic\'s second code example shows the opposite — a struct with a nil embedded interface field STILL compiles successfully against any interface requiring those promoted methods, since the method is still formally present in the method set at compile time. The failure only surfaces at RUNTIME, as a nil pointer dereference panic, the moment code actually tries to call the promoted method through the nil embedded field.'
    }
  ];
}
