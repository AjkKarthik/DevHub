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
  templateUrl: './arrays-are-comparable-slices-are-not.html',
  styleUrl: './arrays-are-comparable-slices-are-not.scss'
})
export class ArraysAreComparableSlicesAreNotSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry is about slices specifically — not composite types in general',
      points: [
        'The main page\'s own mistake entry, "Comparing structs with == when they contain slices," demonstrates a real compile error and correctly fixes it with reflect.DeepEqual — but the entry\'s own framing ("slice is not comparable") can read as if composite/collection types generally cannot be compared with ==. Go\'s own language specification draws a much narrower, more precise line.',
        'The spec states array comparability directly: "Array values are comparable if values of the array element type are comparable. Two array values are equal if their corresponding elements are equal." Arrays in Go have a length that is part of their TYPE ([3]int and [4]int are different types entirely) and a fixed, known size — this is exactly what makes element-by-element comparison well-defined and efficient at compile time.',
        'Slices get the opposite, explicit treatment in the very same section: "Slice values are not comparable. They can only be compared to nil." A slice is a reference-like structure (a pointer to a backing array, plus a length and capacity) — Go deliberately does not define what "equal" would even mean for two slices with potentially different backing arrays, different capacities, but the same visible elements, so it disallows the comparison outright rather than picking one ambiguous interpretation.',
      ]
    },
    {
      heading: 'This makes a struct\'s comparability depend entirely on which composite type each field actually uses',
      points: [
        'Go\'s own spec defines struct comparability in exactly the same "all fields comparable" terms the main page\'s own theory implies: "Struct values are comparable if all their fields are comparable." Combined with the array/slice rules above, this produces a precise, checkable consequence: a struct made entirely of array fields (with comparable element types) IS comparable with ==, while a struct with even ONE slice field anywhere is NOT — regardless of how similar arrays and slices look in ordinary Go code.',
        'This is a genuinely useful, actionable distinction for API and data-model design: a type like type Point struct { Coords [3]float64 } is fully comparable with == out of the box, usable directly as a map key or in a switch statement\'s case clauses, purely because [3]float64 is a fixed-size array. The visually similar type Path struct { Coords []float64 } is NOT comparable with ==, purely because []float64 is a slice — even though both types "hold some float64 numbers" in an everyday sense.',
        'The main page\'s own fix (reflect.DeepEqual, or the slices.Equal function from Go 1.21+\'s slices package for the slice case specifically) remains the correct approach whenever a type genuinely needs a slice field — but for data that has a FIXED, known-at-compile-time size (a 3D coordinate, an RGB color, a fixed-length hash), deliberately choosing an array field over a slice field is often the simpler fix: it makes == work again by construction, with no comparison helper function needed at all.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A struct of arrays is comparable — a struct of slices is not',
      language: 'typescript',
      code: `package main

import "fmt"

// Struct of ARRAY fields -- fully comparable with ==
type Point struct {
	Coords [3]float64 // fixed-size: exactly 3 float64s, always
}

// Struct of SLICE fields -- NOT comparable with ==
type Path struct {
	Coords []float64 // variable-size: could be any length
}

func main() {
	p1 := Point{Coords: [3]float64{1, 2, 3}}
	p2 := Point{Coords: [3]float64{1, 2, 3}}
	fmt.Println(p1 == p2) // true -- arrays compare element-by-element,
	                        // per Go's own spec: "Array values are
	                        // comparable if values of the array
	                        // element type are comparable."

	path1 := Path{Coords: []float64{1, 2, 3}}
	path2 := Path{Coords: []float64{1, 2, 3}}
	// fmt.Println(path1 == path2)
	// COMPILE ERROR: invalid operation: path1 == path2
	// (struct containing []float64 cannot be compared)
	//
	// Per Go's own spec: "Slice values are not comparable. They
	// can only be compared to nil." -- and per the same spec,
	// "Struct values are comparable if all their fields are
	// comparable" -- since Path has a slice field, the WHOLE
	// struct becomes non-comparable, even though it visually
	// looks almost identical to the fully-comparable Point type.
	_ = path1
	_ = path2
}`,
    },
    {
      label: 'Choosing array over slice as a deliberate fix, when size is genuinely fixed',
      language: 'typescript',
      code: `package main

import "fmt"

// A color that is ALWAYS exactly 3 components (R, G, B) --
// a genuine candidate for array rather than slice, since the
// size is fixed and known by the type's own definition.
type RGB struct {
	Values [3]uint8
}

func main() {
	red := RGB{Values: [3]uint8{255, 0, 0}}
	alsoRed := RGB{Values: [3]uint8{255, 0, 0}}

	fmt.Println(red == alsoRed) // true -- works directly, no
	                              // reflect.DeepEqual or custom
	                              // Equal method needed at all

	// Comparable types can also be used as map keys directly:
	seen := map[RGB]bool{}
	seen[red] = true
	fmt.Println(seen[alsoRed]) // true -- alsoRed hashes/compares
	                             // equal to the already-seen red,
	                             // purely because RGB (built from
	                             // an array field) is comparable.

	// Contrast: a hypothetical 'type RGB struct { Values []uint8 }'
	// version of this SAME type could NOT be used as a map key at
	// all -- 'invalid map key type RGB' would be a compile error,
	// since map keys must be comparable, and a slice-containing
	// struct never is.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer defines type Vector3 struct { X, Y, Z []float64 } (using slices, out of habit from other parts of the codebase where sizes genuinely vary) intending to represent a fixed 3D vector, and later tries to use Vector3 values as keys in a map[Vector3]string for a spatial lookup cache. The code fails to compile with "invalid map key type Vector3." Explain why, using what this subtopic covers, and describe the fix that resolves this without needing a custom comparison function.',
    hint: 'Go requires map key types to be comparable with ==. Per this subtopic\'s theory, is a struct with slice fields ever comparable, regardless of how many elements each slice actually holds at runtime? Does X, Y, Z being individual coordinate VALUES (each conceptually just one number, not a variable-length collection) suggest a different, more appropriate Go type than []float64?',
    solution: 'The map[Vector3]string declaration fails to compile because Go requires map key types to be comparable, and per this subtopic\'s theory, Go\'s own spec states plainly that "struct values are comparable if all their fields are comparable" combined with "slice values are not comparable" — since Vector3\'s X, Y, and Z fields are all declared as []float64 (slices), Vector3 as a whole is never comparable, regardless of how many elements each slice actually holds at runtime or how "fixed" the developer\'s intent for a 3D vector conceptually is. Go\'s comparability rules are determined entirely by the TYPES declared, not by any runtime invariant the developer intends to maintain (like "this slice will always have exactly 1 element"). The root issue is a type-design mismatch: X, Y, and Z are each meant to represent a SINGLE coordinate value, not a variable-length collection of values at all — []float64 was never the right type for a single number in the first place, slice or not. The fix that resolves this without needing a custom comparison function is to redeclare each field as a plain float64 (not even needing an array, since each coordinate genuinely is just one value): type Vector3 struct { X, Y, Z float64 }. Per this subtopic\'s theory, a struct is comparable if ALL its fields are comparable, and float64 is a comparable primitive type — so this corrected Vector3 becomes directly usable as a map key, with == working correctly, and no reflect.DeepEqual or custom Equal method required anywhere. (If the actual use case genuinely needed a fixed-size COLLECTION rather than three separate named fields — e.g., representing coordinates as Coords [3]float64 instead of named X, Y, Z fields — this subtopic\'s own first code example shows that array-based alternative would also restore comparability, for the same underlying reason.)'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own "slice is not comparable" mistake entry means that Go composite/collection types in general (arrays, slices, and similar multi-element types) cannot be compared with == — reflect.DeepEqual is always required for anything beyond simple primitives.',
      reality: 'This subtopic\'s theory and first code example show Go\'s own spec draws a much narrower line — arrays ARE comparable with == (element-by-element, per the spec\'s own stated rule) when their element type is comparable; only slices specifically are excluded from ==, since a slice is a reference-like structure with no well-defined notion of value equality the way a fixed-size array has.'
    },
    {
      thought: 'Whether a struct is comparable with == depends on some overall property of the struct as a whole (its total size, how "simple" it looks, whether it was designed to be a value type) rather than being determined by any single specific field.',
      reality: 'This subtopic\'s theory and exercise show struct comparability is determined with total precision by Go\'s own spec — "comparable if all their fields are comparable" — meaning a SINGLE non-comparable field (one slice, anywhere in the struct) makes the entire struct non-comparable, no matter how many other fields are simple, comparable primitives; there is no partial or "mostly comparable" state.'
    },
    {
      thought: 'If a struct needs to be comparable with == but currently has a slice field holding a fixed, small number of elements, the only fix is switching to reflect.DeepEqual or writing a custom Equal method — the field itself has to stay a slice since that\'s "how you represent a list of values" in Go.',
      reality: 'This subtopic\'s second code example and exercise show a genuinely simpler fix is often available — if the field\'s size is actually fixed and known at compile time (not a true variable-length collection), switching the field\'s TYPE from a slice to an array (or, if it represents a single value rather than a collection at all, to a plain scalar type) restores == comparability directly, with no comparison helper function needed anywhere.'
    }
  ];
}
