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
  templateUrl: './method-sets-t-vs-pointer-t.html',
  styleUrl: './method-sets-t-vs-pointer-t.scss'
})
export class MethodSetsTVsPointerTSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the rule — this subtopic explains the mechanism behind it',
      points: [
        'The main page\'s own mistake entry warns "if any method needs a pointer receiver... make ALL methods pointer receivers. Mixing causes subtle bugs: an interface holding a value type cannot call pointer-receiver methods." That is correct, actionable advice — but it states the CONSEQUENCE without explaining the actual rule that produces it: Go\'s own concept of a method set.',
        'The Go language spec defines this precisely: "The method set of a defined type T consists of all methods declared with receiver type T." A plain value of type T — not a pointer to it — only has access to methods that were declared with a value receiver, func (t T) M(). Pointer-receiver methods, func (t *T) M(), are simply not IN that type\'s method set at all.',
        'The spec draws the asymmetry directly: "The method set of a pointer to a defined type T... is the set of all methods declared with receiver *T or T." A *T value\'s method set is the UNION of both kinds — every value-receiver method AND every pointer-receiver method. This is not symmetric: *T can do everything T can do, plus more; T cannot reach into *T\'s exclusive pointer-receiver methods at all.',
      ]
    },
    {
      heading: 'Why this explains the interface-satisfaction rule precisely — and why direct calls still work',
      points: [
        'Interface satisfaction in Go is checked against a type\'s method set: a type satisfies an interface only if its method set contains every method the interface requires. Combine this with the method-set rule above and the main page\'s own warning follows directly, as a logical consequence rather than an arbitrary restriction: if SetName has a pointer receiver, it exists only in (*Person)\'s method set, not Person\'s — so assigning a plain Person value (not a *Person) to an interface requiring SetName fails to compile, precisely because Person\'s own method set never included it.',
        'This deliberately does not contradict the main page\'s own quick reference showing p.Scale(10) working directly on an addressable Point variable elsewhere on the page — calling a pointer-receiver method DIRECTLY on an addressable value is a special case the Go compiler handles by implicitly rewriting p.Scale(10) into (&p).Scale(10). That implicit address-taking only happens for direct method calls on addressable values; it does NOT retroactively add the method to the value type\'s own method set for purposes of interface satisfaction, which is exactly why the two situations (calling directly vs. satisfying an interface) can behave completely differently for the identical type and method.',
        'This is the deeper reason the main page\'s own "be consistent" advice matters beyond just tidiness: mixing receiver types on one type creates a type whose value form and pointer form have genuinely, formally DIFFERENT method sets — some interfaces will accept the pointer form but reject the value form of the exact same conceptual object, a distinction that only becomes visible (often confusingly, as a compile error at an assignment far from the method\'s own definition) when that type is actually used to satisfy an interface.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Direct calls work either way — interface satisfaction does not',
      language: 'typescript',
      code: `package main

import "fmt"

type Counter struct{ n int }

func (c Counter) Value() int   { return c.n }   // VALUE receiver
func (c *Counter) Increment()  { c.n++ }         // POINTER receiver

type Incrementer interface {
	Increment()
}

func main() {
	c := Counter{}

	// Direct calls: BOTH work fine on an addressable value --
	// Go implicitly takes the address for the pointer-receiver call.
	fmt.Println(c.Value())   // 0 -- value receiver, no issue
	c.Increment()             // implicitly (&c).Increment() -- also fine
	fmt.Println(c.Value())   // 1

	var i Incrementer

	// i = c        // COMPILE ERROR: Counter does not implement
	//                Incrementer (Increment method has pointer receiver)
	//                -- per the spec: Counter's OWN method set only
	//                contains VALUE-receiver methods (Value), never
	//                Increment, which was declared with receiver *Counter.

	i = &c            // WORKS -- *Counter's method set is the union of
	                    // BOTH value- and pointer-receiver methods,
	                    // per the spec's own documented rule.
	i.Increment()
	fmt.Println(c.Value()) // 2`,
    },
    {
      label: 'Why "be consistent" matters: two variables of the "same" type, different capability',
      language: 'typescript',
      code: `package main

import "fmt"

type Reporter struct{ label string }

func (r Reporter) Report() string { return "report: " + r.label }
func (r *Reporter) SetLabel(s string) { r.label = s }

type Labeled interface {
	SetLabel(s string)
}

func acceptsLabeled(l Labeled) {
	l.SetLabel("updated")
}

func main() {
	value := Reporter{label: "original"}
	ptr := &Reporter{label: "original"}

	// acceptsLabeled(value)
	// COMPILE ERROR: Reporter does not implement Labeled --
	// value's method set (Report only) does not contain SetLabel,
	// per the spec's method-set rule for a plain defined type T.

	acceptsLabeled(ptr)
	// WORKS -- *Reporter's method set contains BOTH Report and
	// SetLabel (value- and pointer-receiver methods combined),
	// per the spec's rule for pointer-to-defined-type method sets.
	fmt.Println(ptr.Report()) // report: updated

	// The SAME underlying data, the SAME two methods -- but 'value'
	// and 'ptr' have formally DIFFERENT method sets, and only one
	// of the two can be passed where Labeled is required.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer defines type Cache struct { data map[string]string } with a value-receiver Get(key string) string method and a pointer-receiver Set(key, value string) method, then defines an interface type Store interface { Get(key string) string; Set(key, value string) }. They write var s Store = Cache{data: make(map[string]string)} and get a compile error: "Cache does not implement Store (Set method has pointer receiver)." A teammate suggests just changing var s Store = Cache{...} to var s Store = &Cache{...}, and the error disappears. Explain precisely why this fix works, using what this subtopic covers.',
    hint: 'Per this subtopic\'s theory, which method set does a plain Cache value have — only value-receiver methods, or value- and pointer-receiver methods combined? Which method set does a *Cache value have? Does the Store interface require any pointer-receiver methods?',
    solution: 'The fix works because it changes which method set the compiler checks Store\'s requirements against. Per this subtopic\'s theory, and Go\'s own spec, "the method set of a defined type T consists of all methods declared with receiver type T" — so a plain Cache value\'s method set contains ONLY Get (its value-receiver method); Set, declared with a pointer receiver (func (c *Cache) Set(...)), is simply not a member of Cache\'s own method set at all. Since Store requires both Get and Set, and Cache\'s method set is missing Set, the compiler correctly rejects var s Store = Cache{...} — this is not a bug or an overly strict compiler, it is the direct, documented consequence of the method-set rule. Changing to &Cache{...} constructs a *Cache value instead, and per the spec\'s own complementary rule, "the method set of a pointer to a defined type T... is the set of all methods declared with receiver *T or T" — meaning *Cache\'s method set is the UNION of both Get and Set, satisfying everything Store requires. The underlying Cache data and both method IMPLEMENTATIONS are completely unchanged by this fix — only the STATIC TYPE of what gets assigned to s changed, from Cache (whose method set is missing Set) to *Cache (whose method set has both). This is exactly the mechanism the main page\'s own advice to "make ALL methods pointer receivers" for consistency is trying to help developers avoid running into via trial and error.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a method with a pointer receiver can be called directly on a plain (non-pointer) value in Go — like c.Increment() on a Counter value c, thanks to Go\'s implicit address-taking — then that method must also be part of the plain value type\'s own method set, and any interface requiring it should accept the value type too.',
      reality: 'This subtopic\'s theory and first code example show these are two separate mechanisms with different rules — implicit address-taking only applies to DIRECT method calls on addressable values, per Go\'s own convenience feature for call sites; it does NOT add the pointer-receiver method to the value type\'s own method set for the PURPOSES OF INTERFACE SATISFACTION, which is governed by the spec\'s separate, stricter method-set definition.'
    },
    {
      thought: 'A type T and its pointer form *T are essentially interchangeable in Go — since methods can be called on either one seamlessly, they should be treated as having the same capabilities everywhere, including when satisfying interfaces.',
      reality: 'This subtopic\'s theory and second code example show T and *T have genuinely, formally DIFFERENT method sets per Go\'s own spec — *T\'s method set is always a superset of T\'s (containing everything T has, plus every pointer-receiver method), meaning some interfaces will accept a *T value while rejecting the "equivalent" T value of the exact same underlying data.'
    },
    {
      thought: 'The main page\'s advice to keep all of a type\'s methods on the same receiver kind (all value, or all pointer) is mainly a stylistic convention for readability, similar to formatting or naming conventions, without a hard technical consequence if violated.',
      reality: 'This subtopic\'s theory and exercise show this has a real, mechanical consequence rooted directly in the Go spec\'s method-set rules — mixing receiver kinds on one type creates a genuine, load-bearing asymmetry between that type\'s value and pointer forms for interface satisfaction specifically, which can surface as a real compile error at an interface-assignment call site far removed from where the methods were originally defined.'
    }
  ];
}
