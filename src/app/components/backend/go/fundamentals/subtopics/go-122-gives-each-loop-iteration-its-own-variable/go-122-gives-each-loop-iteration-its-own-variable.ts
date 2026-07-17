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
  templateUrl: './go-122-gives-each-loop-iteration-its-own-variable.html',
  styleUrl: './go-122-gives-each-loop-iteration-its-own-variable.scss'
})
export class Go122GivesEachLoopIterationItsOwnVariableSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page flags the fix in a parenthetical — this is what actually changed',
      points: [
        'The main page\'s own mistake entry on capturing loop variables in a goroutine ends with a brief aside: "(Go 1.22+ fixes this for range loops.)" — correctly flagging that a version boundary exists, without explaining the mechanism. Go\'s own official 1.22 release notes state the change precisely: "Previously, the variables declared by a \'for\' loop were created once and updated by each iteration. In Go 1.22, each iteration of the loop creates new variables, to avoid accidental sharing bugs."',
        'Before this change, a for loop\'s own loop variable — whether from a 3-clause for i := 0; ...; i++ loop or a for _, v := range items loop — was a single variable, declared once before the loop began, that every iteration reused and reassigned. Any closure (a goroutine, a deferred function, a function literal stored for later) that captured that variable by reference was capturing the SAME variable every single iteration, which is exactly why all of them ended up observing whatever value the variable held at the LAST iteration by the time they actually ran.',
        'Go\'s own blog post introducing the change describes the goal directly: "For Go 1.22, we plan to change for loops to make these variables have per-iteration scope instead of per-loop scope... it will end the production problems caused by such mistakes; and it will remove the need for imprecise tools that prompt users to make unnecessary changes to their code" — referring to the exact v := v shadowing workaround the main page\'s own "right" code sample demonstrates.',
      ]
    },
    {
      heading: 'The fix is gated by the module\'s own declared Go version — not just the installed toolchain',
      points: [
        'This is the specific detail worth knowing precisely before relying on it: Go\'s own release notes state the new behavior "will only apply in packages contained in modules that declare go 1.22 or later in their go.mod files." Simply installing a Go 1.22+ toolchain is not sufficient on its own — the module\'s go.mod file itself must declare go 1.22 (or later) for that module\'s own code to get the new, safer per-iteration semantics.',
        'This means a project can genuinely be built with a Go 1.22+ compiler while its own code STILL exhibits the old, shared-variable behavior, if its go.mod file has an older go 1.20 or go 1.21 directive left in place from before the project was upgraded. The toolchain version and the module\'s declared language version are two separate things, and only the SECOND one gates this specific change.',
        'The practical consequence: the main page\'s own v := v shadowing workaround is not simply "outdated advice now that Go 1.22 exists" — it remains genuinely necessary for any code that has to compile correctly under an older go.mod directive (a library maintaining broad compatibility, for instance), and it remains harmless, defensive style even in a module that has already adopted go 1.22 or later, since it makes the per-iteration intent explicit regardless of which loop semantics happen to be in effect.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The exact same code, two different outcomes depending on go.mod',
      language: 'typescript',
      code: `package main

import (
	"fmt"
	"sync"
)

func printAll(items []string) {
	var wg sync.WaitGroup
	for _, v := range items {
		wg.Add(1)
		go func() {
			defer wg.Done()
			fmt.Println(v)
		}()
	}
	wg.Wait()
}

func main() {
	printAll([]string{"a", "b", "c"})
}

// WITH "go 1.21" (or earlier) in go.mod:
//   Output is unpredictable, but commonly prints "c" three times --
//   every goroutine's closure captured the SAME 'v' variable, which
//   by the time any goroutine actually ran had already been updated
//   to its final value by the loop finishing.
//
// WITH "go 1.22" or later in go.mod, per Go's own documented change:
//   Output reliably prints "a", "b", "c" (in some order, since
//   goroutine scheduling order isn't guaranteed) -- each iteration
//   now creates its OWN fresh 'v', so each goroutine's closure
//   captures a genuinely distinct variable.
//
// SAME source code. DIFFERENT observed behavior. The only thing
// that changed is the "go 1.2X" directive in go.mod.`,
    },
    {
      label: 'The v := v workaround still compiles and still works either way',
      language: 'typescript',
      code: `package main

import (
	"fmt"
	"sync"
)

func printAllSafe(items []string) {
	var wg sync.WaitGroup
	for _, v := range items {
		v := v // per-iteration copy -- the pre-1.22 idiom
		wg.Add(1)
		go func() {
			defer wg.Done()
			fmt.Println(v)
		}()
	}
	wg.Wait()
}

func main() {
	printAllSafe([]string{"a", "b", "c"})
	// Reliably prints "a", "b", "c" (order varies) REGARDLESS of
	// what "go 1.2X" directive is in go.mod -- this shadowing
	// pattern was already correct under the OLD semantics, and
	// remains harmless (if now redundant) under the NEW ones.
	//
	// This is exactly why Go's own blog describes the 1.22 change
	// as removing "the need for imprecise tools that prompt users
	// to make unnecessary changes to their code" -- the workaround
	// keeps working, it's just no longer REQUIRED for modules that
	// have adopted go 1.22+.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team upgrades their Go toolchain installation from 1.20 to 1.23 to get access to new standard library features. They assume this alone fixes a known loop-variable-capture bug in one of their internal packages (which spawns a goroutine per item in a for range loop, without using the v := v workaround), and remove a TODO comment about it. A code reviewer flags this as premature. Explain why, using what this subtopic covers, and describe what actually needs to change for the bug to genuinely be fixed.',
    hint: 'Per this subtopic\'s theory, does the new per-iteration loop variable behavior activate based on which Go TOOLCHAIN is installed, or based on something declared inside the affected package\'s own go.mod file? Did the team\'s described upgrade touch that second thing at all?',
    solution: 'The reviewer is right to flag this as premature, because per this subtopic\'s theory, Go\'s own release notes state the new per-iteration loop variable behavior "will only apply in packages contained in modules that declare go 1.22 or later in their go.mod files" — this is gated by the module\'s own declared language version, not simply by which Go toolchain happens to be installed on the machine building it. The team upgraded their installed TOOLCHAIN from 1.20 to 1.23, which is necessary but not sufficient — if the internal package\'s own go.mod file still has an older "go 1.20" or "go 1.21" directive left over from before the upgrade (a very common situation, since upgrading the toolchain does not automatically rewrite go.mod), that package\'s loop variables continue to use the OLD, pre-1.22 shared-variable semantics regardless of the newer compiler being used to build it. The bug the team assumed was "automatically fixed" is very likely still present. What actually needs to change is the go.mod file itself — updating its go directive to go 1.22 or later (and confirming the codebase still builds and behaves correctly under the new semantics, since this is a genuine, if narrow, behavioral change) — before the reviewer\'s concern is resolved and the TODO comment can be safely removed. Until that go.mod change is made and verified, re-adding the v := v shadowing workaround (which, per this subtopic\'s second code example, works correctly under either semantics) remains the safer, version-independent fix.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Upgrading to a Go 1.22+ compiler/toolchain automatically gives every existing Go project the new, safer per-iteration loop variable behavior, fixing any latent closure-capture bugs without any other change needed.',
      reality: 'This subtopic\'s theory and first code example show this is incomplete — Go\'s own release notes state the new behavior is gated by the module\'s OWN go.mod file declaring go 1.22 or later, not merely by which toolchain compiles the code. A project built with a modern toolchain but an older go.mod directive still exhibits the pre-1.22, shared-variable behavior.'
    },
    {
      thought: 'The v := v shadowing pattern the main page demonstrates is now outdated, unnecessary advice, since Go 1.22 solved the underlying problem it was working around.',
      reality: 'This subtopic\'s second code example shows the shadowing pattern still compiles and still works correctly under BOTH the old and new semantics — it remains genuinely necessary for any code that must support an older go.mod directive, and Go\'s own blog frames the 1.22 change specifically as removing the NEED for such workarounds, not as making them incorrect or harmful to keep using.'
    },
    {
      thought: 'The Go 1.22 loop variable change is a subtle, low-stakes tweak that only affects unusual edge cases involving goroutines specifically — most ordinary code is unaffected either way.',
      reality: 'This subtopic\'s theory shows the change applies to every for loop\'s variables generally, per Go\'s own release notes ("each iteration of the loop creates new variables") — while goroutines are the most commonly-cited example (since the bug is most visible with concurrent execution), the same shared-vs-per-iteration distinction affects ANY closure capturing a loop variable, including deferred functions and function values stored in a slice for later use, not goroutines exclusively.'
    }
  ];
}
