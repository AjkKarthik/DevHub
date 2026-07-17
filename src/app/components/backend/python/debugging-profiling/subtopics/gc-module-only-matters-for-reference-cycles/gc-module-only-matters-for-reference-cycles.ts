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
  templateUrl: './gc-module-only-matters-for-reference-cycles.html',
  styleUrl: './gc-module-only-matters-for-reference-cycles.scss'
})
export class GcModuleOnlyMattersForReferenceCyclesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Most Python objects are never touched by the gc module at all',
      points: [
        'The main page\'s own theory mentions gc.collect() and gc.garbage as tools for finding memory leaks — "Python\'s gc module can detect reference cycles: gc.collect(); gc.garbage for uncollectable objects" — without explaining why reference cycles specifically need this separate mechanism, when Python already tracks references on every object. The answer is that Python has TWO distinct memory-reclamation mechanisms running at once, and the gc module is only responsible for one narrow case.',
        'The primary mechanism, always running, needs no import and no function call: reference counting. Every Python object carries a count of how many references point to it; the instant that count reaches zero, CPython frees the object immediately. Python\'s own gc module documentation confirms this is the base mechanism the gc module builds on top of, not replaces: "Since the collector supplements the reference counting already used in Python, you can disable the collector if you are sure your program does not create reference cycles."',
        'That sentence is the key to the whole mechanic: it is explicitly SAFE to disable the gc module\'s cyclic collector entirely, for a program that never creates reference cycles — which only makes sense if reference counting alone is already fully sufficient to reclaim every ordinary (acyclic) object\'s memory, with nothing left over for the gc module to need to clean up.',
      ]
    },
    {
      heading: 'Reference cycles are the one case refcounting genuinely cannot solve on its own',
      points: [
        'A reference cycle is exactly what it sounds like: object A holds a reference to object B, and object B (directly, or through a longer chain) holds a reference back to A. Even after every OUTSIDE reference to both A and B is gone, their reference counts never reach zero on their own — each is still being kept alive by the other, purely internally to the cycle. Refcounting alone has no way to detect or break this kind of mutual, self-contained reference loop.',
        'This is precisely the gap the gc module\'s cyclic collector exists to fill — periodically scanning for groups of objects that are unreachable from anywhere OUTSIDE the group, even though their internal reference counts are still non-zero, and freeing that whole group together. This is a fundamentally different kind of work than refcounting\'s simple "count hits zero, free immediately" rule — it requires actively searching for cycles, not just watching a counter.',
        'The practical consequence, following directly from this: calling gc.collect() manually, or seeing gc-related activity in a memory profile, is a meaningful SIGNAL specifically that reference cycles exist somewhere in the program\'s object graph — not a general "the program has too much memory pressure" signal. A memory-hungry program with zero reference cycles would see gc.collect() find and free essentially nothing, since refcounting had already reclaimed everything eligible the instant it became unreferenced, well before the cyclic collector\'s next scheduled pass.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'An ordinary (acyclic) object is freed immediately — gc.collect() has nothing to do',
      language: 'typescript',
      code: `import gc
import weakref

class Widget:
    def __init__(self, name):
        self.name = name

# Track whether the object still exists, without keeping it alive
w = Widget("acyclic")
ref = weakref.ref(w)

print(ref() is not None)   # True -- the object exists

del w   # the ONLY reference to the Widget is gone
        # -- refcount hits 0 IMMEDIATELY, no gc.collect() involved

print(ref() is not None)   # False -- already freed, before we even
                             # called gc.collect() -- confirming the
                             # object needed nothing beyond ordinary
                             # reference counting to be reclaimed.

collected = gc.collect()
print(f"gc.collect() found and freed {collected} objects")
# Reports 0 (or a number unrelated to our Widget) -- there was
# nothing left for the cyclic collector to do here, because refcounting
# alone had already fully handled this acyclic object's cleanup.`,
    },
    {
      label: 'A genuine reference cycle needs the gc module specifically',
      language: 'typescript',
      code: `import gc
import weakref

class Node:
    def __init__(self, name):
        self.name = name
        self.partner = None   # will hold a reference back

# Create a genuine reference CYCLE: a refers to b, b refers to a
a = Node("a")
b = Node("b")
a.partner = b
b.partner = a   # <-- the cycle: a -> b -> a

ref_a = weakref.ref(a)
ref_b = weakref.ref(b)

del a
del b
# Both OUTSIDE references are gone -- but a.partner still holds a
# reference to b, and b.partner still holds a reference to a.
# Refcounting alone CANNOT free either object: neither one's
# reference count ever reaches 0, since they're still keeping each
# other alive internally.

print(ref_a() is not None)   # True -- STILL ALIVE, refcounting
print(ref_b() is not None)   # True -- alone could not free this cycle

gc.collect()   # the cyclic collector specifically scans for and
                 # breaks exactly this kind of mutually-referencing,
                 # externally-unreachable group

print(ref_a() is not None)   # False -- NOW freed, specifically
print(ref_b() is not None)   # False -- because gc.collect() ran`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A long-running service periodically calls gc.collect() manually "just to be safe," and a developer notices it consistently reports collecting thousands of objects every time it runs. A teammate says this is expected and healthy — "the garbage collector is doing its job, cleaning up memory." Explain, using what this subtopic covers, why consistently finding thousands of collectable objects is actually a signal worth investigating rather than routine, healthy behavior.',
    hint: 'Per this subtopic\'s theory, what kind of object does gc.collect() actually find and free — any object that happens to be unreferenced, or specifically objects trapped in reference cycles? If ordinary (acyclic) objects are already freed immediately by reference counting alone, what does it mean that gc.collect() keeps finding thousands more objects to free on top of that?',
    solution: 'The teammate\'s framing is backwards — consistently finding thousands of collectable objects on every gc.collect() call is not routine cleanup of "leftover" memory; it is a direct signal that the service is CONTINUOUSLY CREATING reference cycles at a meaningful rate, since per this subtopic\'s theory, gc.collect() only finds and frees objects trapped in reference cycles specifically — every ordinary, acyclic object in the program is already freed immediately by reference counting alone, the instant it becomes unreferenced, with nothing left for gc.collect() to do. If gc.collect() genuinely finds thousands of objects each time it runs, those are thousands of objects that reference counting alone was UNABLE to reclaim on its own, meaning the service\'s own code is creating reference cycles somewhere in its normal operation — most commonly through parent-child object relationships that reference each other both ways (a common pattern in tree/graph structures, or event-handler registration systems that keep a reference back to their subscriber), or through closures/callbacks that capture objects which, in turn, reference the closure itself. The fix is not "keep calling gc.collect() to clean up after this" — that treats the symptom, and each of those thousands of cyclic objects still had to survive (using memory, and adding CPU cost for the cyclic collector to scan and untangle it) between collection passes. The actual fix is to find and break the cycle-creating pattern in the code itself, restructuring the relevant object relationships (e.g., using weakref.ref or weakref.WeakValueDictionary, which the main page itself already recommends for caches, for one side of a mutual reference) so reference counting alone becomes sufficient again, and gc.collect() genuinely has little or nothing left to find.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Python\'s garbage collector (the gc module) is the single, primary mechanism responsible for freeing every unreferenced object\'s memory — calling gc.collect() is the general-purpose way to reclaim memory from anything no longer in use.',
      reality: 'This subtopic\'s theory and first code example show reference counting, not the gc module, is the primary, always-on mechanism that frees the vast majority of objects — the instant an ordinary object\'s reference count reaches zero, CPython frees it immediately, with no gc.collect() call needed or involved at all. The gc module\'s own docs confirm it merely "supplements" this base mechanism.'
    },
    {
      thought: 'Reference counting and the gc module\'s cyclic collector do fundamentally the same job (finding and freeing unreferenced objects) — the gc module is just a periodic, automatic backup in case reference counting misses something occasionally.',
      reality: 'This subtopic\'s theory and second code example show these solve two genuinely different problems — reference counting can NEVER free a reference cycle on its own, no matter how long it waits, since a cycle\'s internal references keep every object\'s count above zero indefinitely; the gc module\'s cyclic collector uses a fundamentally different technique (actively scanning for externally-unreachable groups) specifically because refcounting is structurally incapable of solving this one case.'
    },
    {
      thought: 'A program with a genuine memory leak will always show gc.collect() finding and freeing a large number of objects, since that is generally what "memory leak" symptoms look like in a garbage-collected language.',
      reality: 'This subtopic\'s exercise shows the opposite framing is more accurate — gc.collect() finding many objects is specifically a signal of reference-cycle creation, not memory leaks in general. A memory leak caused by, for example, an ever-growing global cache with no eviction (a cause the main page itself lists) involves objects that are still genuinely REFERENCED (by the cache itself) — reference counting correctly keeps them alive because they are still in active use, and gc.collect() would find nothing wrong with them at all, since there is no cycle for it to detect.'
    }
  ];
}
