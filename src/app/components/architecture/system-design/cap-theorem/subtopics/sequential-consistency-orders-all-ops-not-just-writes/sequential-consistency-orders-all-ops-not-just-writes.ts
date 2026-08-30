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
  templateUrl: './sequential-consistency-orders-all-ops-not-just-writes.html',
  styleUrl: './sequential-consistency-orders-all-ops-not-just-writes.scss'
})
export class SequentialConsistencyOrdersAllOpsNotJustWritesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A one-line definition that left out the part that actually matters',
      points: [
        'The main page\'s consistency-model spectrum originally defined sequential consistency in one line as "writes appear in order, but not necessarily immediately." This is incomplete in a way that actually erases the distinction the spectrum is trying to teach — it describes something closer to causal consistency\'s guarantee, not sequential consistency\'s stronger one. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: ALL operations, from ALL processes, in ONE agreed-upon order',
      points: [
        'Sequential consistency\'s actual defining property (Lamport\'s original formulation) is that every process observes ALL operations — reads AND writes, from every process in the system — as if they occurred in a single, shared, agreed-upon total order. It does NOT require that order to match real (wall-clock) time — that stronger real-time requirement is what separates sequential consistency from linearizability.',
        'This is meaningfully different from causal consistency, which the main page correctly defines separately as "causally related operations are seen in order" — under causal consistency, operations with NO causal relationship (truly concurrent, unrelated writes from different processes) can be observed in DIFFERENT orders by different processes. Under sequential consistency, EVERY process must agree on the SAME order for ALL operations, related or not.',
        'The original one-line gloss ("writes appear in order") doesn\'t capture either of the two properties that actually define the model: it says nothing about reads being part of the ordering, and it says nothing about that order being the SAME for every process — which is precisely the property that makes sequential consistency stronger than causal consistency, the model listed directly above it on the same spectrum.',
      ]
    },
    {
      heading: 'Why "the same order for everyone" is the load-bearing detail',
      points: [
        'The whole point of listing these four models (linearizable → sequential → causal → eventual) as a SPECTRUM is that each one relaxes exactly one guarantee from the model above it. Sequential consistency relaxes linearizability\'s REAL-TIME ordering requirement, while keeping "everyone agrees on one global order." Causal consistency relaxes that further, to "only causally-related things need a shared order." An incomplete definition of sequential consistency blurs exactly the boundary the spectrum exists to clarify.',
        'In an interview, being able to state precisely "sequential consistency means everyone agrees on the SAME order of ALL operations, just not necessarily real-time order" — versus causal\'s weaker "only causally-related operations need to agree" — is exactly the kind of precise distinction that separates a strong system design answer from a vague one.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A concrete example distinguishing sequential from causal consistency',
      language: 'bash',
      code: `# Two processes, P1 and P2, issue operations with NO causal
# relationship between them (truly concurrent, independent writes):
#   P1 writes: SET x = 1
#   P2 writes: SET y = 2

# Under CAUSAL consistency:
#   Since x and y writes are unrelated, different observers
#   (P3, P4) are allowed to see them in DIFFERENT orders:
#   P3 might observe: [x=1, y=2]
#   P4 might observe: [y=2, x=1]
#   -- both are valid under causal consistency

# Under SEQUENTIAL consistency:
#   ALL observers must agree on the SAME single order,
#   even though x and y are unrelated:
#   Either every observer sees [x=1, y=2],
#   or every observer sees [y=2, x=1] -- but it must be
#   the SAME choice for everyone. This "same order for
#   everyone" requirement is what the original one-line
#   definition on the main page left out entirely.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Using the main page\'s original (now-corrected) definition — "sequential consistency: writes appear in order" — would a system where two DIFFERENT observers see two UNRELATED writes in two DIFFERENT orders still count as sequentially consistent?',
    hint: 'Does the corrected definition require the SAME order for every observer, or just that each individual observer sees writes "in order" by itself?',
    solution: 'Under the corrected, complete definition, no — that scenario is a textbook example of CAUSAL consistency (or weaker), not sequential consistency. Sequential consistency specifically requires every process to observe the exact SAME total order of all operations; if two different observers can legitimately see two unrelated writes in two different orders, the system has only achieved the weaker causal guarantee. The main page\'s original, incomplete one-liner ("writes appear in order") didn\'t rule this scenario out, which is exactly why it blurred the line between the two models.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Sequential consistency just means writes happen "in order" — roughly the same idea as causal consistency, one level up on the spectrum.',
      reality: 'Per this subtopic\'s theory (a definition tightened on the main page during this batch), sequential consistency specifically requires EVERY process to agree on the exact SAME total order of ALL operations (reads and writes) — a materially stronger guarantee than causal consistency\'s "only causally-related operations need shared ordering."'
    },
    {
      thought: 'The difference between sequential and linearizable consistency is that sequential consistency is about writes while linearizability is about reads and writes.',
      reality: 'Per this subtopic\'s theory, both models cover reads AND writes — the actual difference is that linearizability additionally requires the agreed-upon order to match REAL (wall-clock) time, a requirement sequential consistency relaxes.'
    },
    {
      thought: 'A one-line simplified definition of a consistency model is fine for a quick-reference spectrum, even if it omits some nuance.',
      reality: 'Per this subtopic\'s theory, when the omitted detail is precisely the property that distinguishes one model from its neighbor on the same spectrum, the simplification stops being a harmless shorthand and starts actively teaching the wrong mental model.'
    }
  ];
}
