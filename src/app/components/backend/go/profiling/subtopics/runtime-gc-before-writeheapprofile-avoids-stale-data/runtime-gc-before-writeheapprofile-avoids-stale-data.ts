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
  templateUrl: './runtime-gc-before-writeheapprofile-avoids-stale-data.html',
  styleUrl: './runtime-gc-before-writeheapprofile-avoids-stale-data.scss'
})
export class RuntimeGcBeforeWriteheapprofileAvoidsStaleDataSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own code comments runtime.GC() as "force GC" without saying what it forces away',
      points: [
        'The main page\'s own CPU + Heap Profile code tab calls runtime.GC() // force GC to get accurate live object count immediately before pprof.WriteHeapProfile(hf). Its theory never expands on this — the comment states the practice without explaining the actual mechanism the heap profile relies on.',
        'The runtime/pprof package documentation states the mechanism directly: "The heap profile reports statistics as of the most recently completed garbage collection; it elides more recent allocation to avoid skewing the profile away from live data and toward garbage." The profile is not a live, up-to-the-instant snapshot — it reflects whatever the LAST completed GC cycle determined was still live.',
        'This means calling WriteHeapProfile without a preceding runtime.GC() reports data from whenever the program\'s last (possibly much earlier, or even zero) GC cycle happened — potentially stale by seconds or minutes in a program with infrequent GC, and per the same documentation\'s own exception clause, "If there has been no garbage collection at all, the heap profile reports all known allocations" (including garbage that was never collected, which is a different but equally misleading kind of inaccuracy).',
      ]
    },
    {
      heading: 'Why this specific ordering matters, not just that runtime.GC() happens somewhere',
      points: [
        'runtime.GC() is a blocking, synchronous call: it runs a full garbage collection cycle and does not return until it completes. Calling it immediately before WriteHeapProfile guarantees the "most recently completed garbage collection" the documentation refers to is as fresh as possible — reflecting the program\'s TRUE live-object state at the moment of profiling, not whatever happened to be true whenever the previous, unrelated GC cycle last ran.',
        'The main page\'s own code correctly places the call right before WriteHeapProfile — this ordering is not a stylistic preference; per the documentation\'s own framing, doing it any earlier (or omitting it) reintroduces exactly the staleness problem the call exists to solve, since any allocation or deallocation that happens between an earlier GC and the profile write would be invisible to the reported statistics.',
        'This generalizes directly to profiling a live server via the HTTP endpoint: go tool pprof http://server/debug/pprof/heap triggers net/http/pprof\'s own heap handler, which — per the same underlying pprof machinery — reports data as of the process\'s last completed GC, not a fresh one triggered on demand by the HTTP request itself. A production service with a long GOGC-driven interval between collections can serve a heap profile that is meaningfully out of date relative to the moment the request was made.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own ordering -- why it is correct',
      language: 'typescript',
      code: `package main

import (
    "os"
    "runtime"
    "runtime/pprof"
)

func main() {
    doWork()

    hf, _ := os.Create("mem.prof")
    defer hf.Close()

    // This exact placement matters -- per the pprof package's own
    // documentation: "The heap profile reports statistics as of the
    // most recently completed garbage collection." Calling GC()
    // HERE, immediately before WriteHeapProfile, guarantees "most
    // recently completed" means "as of right now," not whenever an
    // earlier, unrelated GC cycle happened to run.
    runtime.GC()
    pprof.WriteHeapProfile(hf)
}`,
    },
    {
      label: 'What omitting it (or misplacing it) actually reports',
      language: 'typescript',
      code: `package main

import (
    "os"
    "runtime/pprof"
    "time"
)

func main() {
    // Suppose the program's last GC happened right at startup,
    // and GOGC's default doubling threshold means the NEXT GC
    // won't trigger for a while yet.

    allocateSomeShortLivedGarbage() // creates and discards objects
    time.Sleep(2 * time.Second)
    allocateMoreObjects()           // these are now genuinely LIVE

    hf, _ := os.Create("mem.prof")
    defer hf.Close()

    // No runtime.GC() call before this -- per the documentation,
    // WriteHeapProfile reports statistics "as of the most recently
    // completed garbage collection," which in this scenario is
    // still the one from program startup, BEFORE either
    // allocateSomeShortLivedGarbage or allocateMoreObjects ran.
    pprof.WriteHeapProfile(hf)

    // The resulting mem.prof may show neither the (already garbage)
    // short-lived allocations NOR the (genuinely live) later ones
    // accurately -- it reflects a stale snapshot from startup, not
    // the program's actual current live-object state.
}

// The fix is exactly the main page's own pattern: call runtime.GC()
// immediately before WriteHeapProfile, every time, regardless of
// when the program's own GC last happened to run on its own schedule.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team profiles a long-running batch job by adding hf, _ := os.Create("mem.prof"); defer hf.Close(); pprof.WriteHeapProfile(hf) at the very end of main(), right before the process exits — following the main page\'s own pattern except they forgot the runtime.GC() call. The resulting profile consistently shows far less live heap usage than expvar-reported metrics indicated the process was actually using moments before exit. Using this subtopic\'s theory, explain the discrepancy, and identify the exact one-line fix and where it must go.',
    hint: 'Per this subtopic\'s theory, what specific moment in the program\'s history does a heap profile reflect if runtime.GC() is never called immediately beforehand — "right now," or "whenever the program\'s own GC last happened to run on its own schedule"? Could that be considerably earlier than the moment WriteHeapProfile is actually called?',
    solution: 'The discrepancy is exactly the mechanism this subtopic\'s theory describes: per the pprof documentation, WriteHeapProfile reports statistics "as of the most recently completed garbage collection" — without a runtime.GC() call immediately beforehand, that "most recently completed" GC could have happened much earlier in the program\'s run (governed by GOGC\'s own heap-doubling trigger, not by when the profile happens to be written), so the profile reflects the heap\'s live-object state from that earlier point, not from the moment right before the process exits. Since the job\'s heap usage evidently grew between that earlier GC and the moment of exit (as the expvar metrics independently confirm), the profile understates the true live heap size at exit — it is stale, not wrong in the sense of a bug, just describing an earlier moment in time than the one the team intended to capture. The fix is exactly the main page\'s own pattern, applied in the missing spot: insert runtime.GC() immediately before the pprof.WriteHeapProfile(hf) call, guaranteeing the GC cycle the documentation refers to as "most recently completed" is triggered fresh, right at the moment of profiling, not left to whatever schedule GOGC happened to be running on independently.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'pprof.WriteHeapProfile always captures a live, up-to-the-instant snapshot of the heap at the exact moment it is called — runtime.GC() before it is just a defensive habit, not something the profile\'s own correctness depends on.',
      reality: 'This subtopic\'s theory quotes the documentation directly: the heap profile "reports statistics as of the most recently completed garbage collection" — it is NOT a live snapshot of the current instant. Without a preceding runtime.GC() call, the reported data reflects whenever the program\'s last, possibly much earlier, GC cycle happened to run.'
    },
    {
      thought: 'Since runtime.GC() is mentioned in the main page\'s own code, it does not matter exactly where in the code it is placed, as long as it runs at some point before the program exits.',
      reality: 'This subtopic\'s theory and second code example show the placement matters specifically: runtime.GC() must run IMMEDIATELY before WriteHeapProfile so the "most recently completed garbage collection" the documentation refers to is triggered fresh, at the moment of profiling — calling it earlier, or relying on the program\'s own independent GC schedule, reintroduces the exact staleness problem the call exists to prevent.'
    },
    {
      thought: 'Profiling a live server\'s heap via the HTTP endpoint (go tool pprof http://server/debug/pprof/heap) always triggers a fresh GC on demand, since it is an interactive, on-request profiling tool.',
      reality: 'This subtopic\'s theory notes the same underlying pprof mechanism applies to the HTTP heap endpoint — it also reports data as of the process\'s last completed GC, not a GC triggered fresh by the HTTP request itself. A production service with a long interval between GC cycles can serve a heap profile that is meaningfully out of date relative to when the request was actually made.'
    }
  ];
}
