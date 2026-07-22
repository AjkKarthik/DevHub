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
  templateUrl: './range-copies-each-element-into-the-loop-variable.html',
  styleUrl: './range-copies-each-element-into-the-loop-variable.scss'
})
export class RangeCopiesEachElementIntoTheLoopVariableSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The v in for i, v := range slice is a copy — not a window into the slice',
      points: [
        'The main page\'s own theory shows for i, v := range slice { } as the standard way to "iterate collections," without stating precisely what v actually IS on each pass. Go\'s own reference confirms it directly: for a range expression over an array, pointer-to-array, or slice, the second value produced on each iteration is the element itself — a[i] — assigned to the range variable BY VALUE, not a reference or address into the original data.',
        'This means v is a fresh copy of whatever element[i] held at the moment that iteration began. Mutating v inside the loop body — v.Field = newValue, v = somethingElse — only ever changes that local copy. The original slice\'s underlying array is completely untouched by any assignment to v, no matter how the loop body modifies it.',
        'This is a structurally different problem from the closure-capture issue the main page\'s own mistake entry covers (goroutines all observing the loop variable\'s final value) — that issue is about WHEN a closure reads the variable. This subtopic\'s issue is about the fact that v was never connected to the original slice\'s memory in the first place, regardless of when anything reads it.',
      ]
    },
    {
      heading: 'Fixing it requires going back through the index — not the range variable',
      points: [
        'The correct pattern for mutating elements during a range loop is to write through the slice using the index that range already provides: for i := range slice { slice[i].Field = newValue } — or, when both the index and a working copy are useful, for i, v := range slice { v.Field = x; slice[i] = v }, explicitly writing the modified copy back into the slice at the same position.',
        'One documented exception is worth knowing precisely, since it can look identical at a glance: if the slice\'s element type is itself a pointer (for i, v := range pointerSlice, where pointerSlice is []*SomeStruct), then v is still a COPY — but a copy of the POINTER, not a copy of the struct it points to. Mutating a field through that pointer (v.Field = x, which Go treats as (*v).Field = x) genuinely does reach the original struct, because the copied pointer still points at the same underlying memory the original slice element points at.',
        'This distinction — value-typed elements needing slice[i] to mutate, pointer-typed elements being mutable directly through the copied pointer — is a common source of confusion specifically because both []T and []*T support the identical for i, v := range syntax, with genuinely different mutation semantics depending purely on whether T itself is a pointer type.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Mutating v does nothing to the original slice of value-typed structs',
      language: 'typescript',
      code: `package main

import "fmt"

type Item struct {
	Name  string
	Price float64
}

func applyDiscount(items []Item, pct float64) {
	for _, item := range items {
		// BUG: 'item' is a COPY of items[i] -- this mutation only
		// changes the local copy, never the original slice element.
		item.Price = item.Price * (1 - pct)
	}
}

func main() {
	items := []Item{
		{Name: "Widget", Price: 100},
		{Name: "Gadget", Price: 200},
	}
	applyDiscount(items, 0.10)
	fmt.Println(items)
	// [{Widget 100} {Gadget 200}] -- UNCHANGED! The 10% discount
	// was applied to a local copy of each Item on every iteration,
	// then discarded the moment that iteration ended.
}`,
    },
    {
      label: 'The fix: write back through the index, or use a pointer element type',
      language: 'typescript',
      code: `package main

import "fmt"

type Item struct {
	Name  string
	Price float64
}

// FIX 1: index back into the slice explicitly
func applyDiscountFixed(items []Item, pct float64) {
	for i := range items {
		items[i].Price = items[i].Price * (1 - pct)
	}
}

// FIX 2: use a pointer element type -- the range variable is then
// a COPY OF A POINTER, which still refers to the same underlying
// struct, so mutating through it genuinely reaches the original.
func applyDiscountPointers(items []*Item, pct float64) {
	for _, item := range items {
		item.Price = item.Price * (1 - pct) // reaches the original,
		                                       // since 'item' is a
		                                       // pointer copy, not
		                                       // a struct copy
	}
}

func main() {
	items := []Item{{Name: "Widget", Price: 100}, {Name: "Gadget", Price: 200}}
	applyDiscountFixed(items, 0.10)
	fmt.Println(items)
	// [{Widget 90} {Gadget 180}] -- correctly discounted, since
	// items[i].Price = ... writes through the slice's own memory,
	// not a disposable per-iteration copy.

	pItems := []*Item{{Name: "Widget", Price: 100}, {Name: "Gadget", Price: 200}}
	applyDiscountPointers(pItems, 0.10)
	fmt.Println(*pItems[0], *pItems[1])
	// {Widget 90} {Gadget 180} -- ALSO correct, via the pointer path
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A function normalizeUsers(users []User) sets a default value for any User whose Email field is empty: for _, u := range users { if u.Email == "" { u.Email = "unknown@example.com" } }. A caller reports that after calling this function, users still contains entries with empty Email fields — the function appears to do nothing. Explain exactly why, using what this subtopic covers, and provide the corrected implementation.',
    hint: 'What does u actually refer to on each iteration of for _, u := range users — the original User struct stored inside the users slice, or a separate copy of it? When the function does u.Email = "unknown@example.com", which one does that assignment actually modify?',
    solution: 'The function appears to do nothing because u.Email = "unknown@example.com" only ever modifies a local COPY of the User struct, never the original element stored inside the users slice — per this subtopic\'s theory, the range variable u in for _, u := range users is assigned a fresh copy of users[i] on every iteration, not a reference to it. Since User is a value type (not []*User, a slice of pointers), each iteration\'s u is a genuinely separate struct in memory; setting u.Email changes that separate copy, and the moment the iteration ends, that copy (along with the change) is discarded, with the original users slice left completely untouched. This is exactly why the caller observes users still containing empty Email fields after the call — the function ran, its logic was correct in spirit, but it was mutating the wrong copy of the data the entire time, a mistake that produces no compile error or runtime panic, just silently ineffective code. The corrected implementation needs to write back through the slice\'s own index, following the same fix pattern this subtopic\'s second code example demonstrates: for i := range users { if users[i].Email == "" { users[i].Email = "unknown@example.com" } } — using the index range provides to reach into the slice\'s actual backing array directly, rather than working with (and discarding) a disposable per-iteration copy.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'for i, v := range slice gives v as a live reference into the slice — mutating v.SomeField = newValue inside the loop body directly modifies the corresponding element in the original slice, the same way it would in languages where loop variables are references by default.',
      reality: 'This subtopic\'s theory and first code example show Go\'s range clause assigns each element to v BY VALUE — a genuine copy — per Go\'s own documented range semantics. Mutating v only ever changes that local, per-iteration copy; the original slice element, and the underlying array it lives in, is never touched by that assignment at all.'
    },
    {
      thought: 'The fix for range not letting you mutate slice elements is the same v := v shadowing pattern used to fix the closure-capture-in-goroutines problem covered elsewhere on the main page — both are "loop variable" issues solved the same way.',
      reality: 'This subtopic\'s theory explicitly distinguishes these as two structurally different problems — the closure-capture issue is about WHEN a closure reads a shared variable across iterations (fixed by giving each iteration its own variable, which v := v or Go 1.22\'s own change both address); this subtopic\'s mutation issue is about v never being connected to the slice\'s own memory in the first place, which shadowing does nothing to fix — the only fix is writing back through the slice\'s index, slice[i] = ..., a completely different code change.'
    },
    {
      thought: 'Since for _, v := range slice never lets you mutate the original elements, the fix is always the same regardless of what type the slice holds — always use slice[i] to write changes back.',
      reality: 'This subtopic\'s theory and second code example show the fix genuinely differs depending on the slice\'s element type — for a slice of VALUES ([]Item), slice[i] = ... (or slice[i].Field = ...) is required, exactly as the misconception states; but for a slice of POINTERS ([]*Item), the range variable is a copy of the pointer, which still refers to the same underlying struct, so mutating through it directly (item.Field = x) already reaches the original — no index-based rewrite is needed at all for that case.'
    }
  ];
}
