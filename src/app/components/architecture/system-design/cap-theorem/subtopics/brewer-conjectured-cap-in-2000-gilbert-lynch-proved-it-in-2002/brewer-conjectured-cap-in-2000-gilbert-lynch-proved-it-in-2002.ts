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
  templateUrl: './brewer-conjectured-cap-in-2000-gilbert-lynch-proved-it-in-2002.html',
  styleUrl: './brewer-conjectured-cap-in-2000-gilbert-lynch-proved-it-in-2002.scss'
})
export class BrewerConjecturedCapIn2000GilbertLynchProvedItIn2002Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A gap in the main page\'s own attribution, not a wrong fact',
      points: [
        'The main page correctly credits "Brewer\'s theorem (2000)" but never mentions that Brewer\'s 2000 PODC keynote was a CONJECTURE, not a proof — and never names who actually proved it, or under what specific formal conditions. This subtopic closes that gap.',
      ]
    },
    {
      heading: 'The reality: Brewer conjectured it in 2000; Gilbert and Lynch formally proved it in 2002',
      points: [
        'Eric Brewer presented the CAP conjecture as a keynote talk at the 2000 ACM Symposium on Principles of Distributed Computing (PODC) — an informal, practitioner-oriented framing based on his experience building large-scale web infrastructure at Inktomi.',
        'Seth Gilbert and Nancy Lynch (MIT) published the formal proof in 2002, in a paper titled "Brewer\'s Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services" — this is the actual peer-reviewed theorem most system design material (including this main page) is implicitly citing when it says "CAP theorem."',
        'The formal proof has specific conditions worth knowing: it\'s proven for ASYNCHRONOUS network models (no bound on message delay) and defines consistency specifically as ATOMIC (linearizable) consistency — a narrower, more precise definition than the informal "everyone sees the same data" framing most system design content (including this page\'s own quick-reference) uses casually.',
      ]
    },
    {
      heading: 'Why the conjecture-vs-proof distinction is worth having in your back pocket',
      points: [
        'A candidate who can say "Brewer conjectured this in 2000, Gilbert and Lynch proved it formally in 2002 under an asynchronous network model with atomic consistency" demonstrates a level of precision beyond reciting "pick 2 of 3" — the kind of depth that differentiates a strong system design answer.',
        'Knowing the proof\'s specific formal assumptions (asynchronous networks, linearizable consistency) also explains why CAP is sometimes criticized or seen as "too simple" in modern distributed systems literature — those criticisms are usually about applying the THEOREM\'s narrow formal guarantees too broadly, past the specific conditions Gilbert and Lynch actually proved it under.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The two-step history behind "the CAP theorem"',
      language: 'bash',
      code: `# 2000: Eric Brewer's CAP CONJECTURE
#   - PODC keynote, based on practitioner experience at Inktomi
#   - Informal: "you can only have 2 of Consistency,
#     Availability, Partition tolerance"

# 2002: Seth Gilbert & Nancy Lynch's FORMAL PROOF
#   - Paper: "Brewer's Conjecture and the Feasibility of
#     Consistent, Available, Partition-Tolerant Web Services"
#   - Proves it specifically for:
#     * Asynchronous network model (no bound on message delay)
#     * Atomic (linearizable) consistency, specifically
#   - This is the actual "CAP THEOREM" citation

# What most system design material calls "CAP theorem"
# is really: Brewer's 2000 conjecture, as formally proven
# by Gilbert & Lynch in 2002 -- two names, two years,
# one result.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An interviewer asks "who came up with the CAP theorem, and when?" Using only the main page\'s original (now-expanded) content, you\'d answer "Brewer, in 2000." Is there a more complete, accurate answer available?',
    hint: 'Was Brewer\'s 2000 presentation a proof, or was it proven later by someone else?',
    solution: 'A more complete answer: "Eric Brewer conjectured it in a 2000 PODC keynote, based on his experience at Inktomi — but it wasn\'t formally PROVEN until 2002, when Seth Gilbert and Nancy Lynch published a proof specifically for asynchronous networks and atomic (linearizable) consistency." This is both more historically accurate (crediting the actual proof to its authors) and demonstrates the kind of precision — knowing conjecture vs. proof, and the proof\'s specific formal conditions — that differentiates a strong answer from simply reciting "Brewer, 2000, pick 2 of 3."'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Eric Brewer both proposed AND formally proved the CAP theorem in his 2000 presentation.',
      reality: 'Per this subtopic\'s theory (a gap closed on the main page during this batch), Brewer\'s 2000 talk was an informal conjecture — the formal proof came two years later, from Seth Gilbert and Nancy Lynch in 2002.'
    },
    {
      thought: 'The CAP theorem applies universally to any definition of "consistency" and any network model, since it\'s a general theorem about distributed systems.',
      reality: 'Per this subtopic\'s theory, Gilbert and Lynch\'s actual proof is scoped to a SPECIFIC formal setting — asynchronous networks and atomic (linearizable) consistency — not every possible network model or consistency definition.'
    },
    {
      thought: 'The distinction between "Brewer\'s CAP conjecture" and "Gilbert & Lynch\'s CAP proof" is a historical footnote, not something worth knowing for a system design interview.',
      reality: 'Per this subtopic\'s theory, this precision is exactly the kind of depth that differentiates a strong interview answer from a surface-level "pick 2 of 3" recitation, and also explains why some modern critiques of CAP target its narrow formal scope rather than the theorem itself being wrong.'
    }
  ];
}
