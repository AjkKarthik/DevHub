import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Two Different Timelines, Told as if They’re the Same One',
    points: [
      'The page’s own Quick Reference defines MTTD as "average time from incident start to first alert fire" and MTTR as "average time from detection to service restoration." The page’s own "Postmortem Template" code tab gives a full, real timeline with exact timestamps — but never once applies either formula to it. The prose "What Went Well" section instead makes an informal claim ("SLO alert fired 5 minutes after error rate began") using its own, different reference points.',
      'Applying the page’s OWN Challenge function (<code>computeIncidentMetrics</code>) to the canonical reference points — incident START as the deployment at 14:23, RESTORATION as the full-recovery confirmation at 15:10 — gives MTTD = 8 minutes and MTTR = 39 minutes. The informal narrative’s own reference points (error rate first visibly climbing at 14:26, and the baseline-return signal at 14:47, which is a MITIGATION signal, not the RESOLUTION the quickRef’s MTTR definition actually asks for) give 5 minutes and 16 minutes instead.',
      'Neither set of numbers is "wrong" as a description of what it measures — but mixing them in the same postmortem, without stating which timestamps were used, makes the "good MTTD" claim look more precise and more directly comparable to other incidents’ MTTD/MTTR figures than it actually is.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Same Timeline, Two Different Reference-Point Choices',
    language: 'typescript',
    code: `interface Incident {
  startTime: number;
  detectedTime: number;
  resolvedTime: number;
}

function computeIncidentMetrics(incidents: Incident[]): { mttdMinutes: number; mttrMinutes: number } {
  if (incidents.length === 0) return { mttdMinutes: 0, mttrMinutes: 0 };
  const sumMttd = incidents.reduce((s, i) => s + (i.detectedTime - i.startTime), 0);
  const sumMttr = incidents.reduce((s, i) => s + (i.resolvedTime - i.detectedTime), 0);
  const n = incidents.length;
  return {
    mttdMinutes: Math.round(sumMttd / n / 60_000 * 10) / 10,
    mttrMinutes: Math.round(sumMttr / n / 60_000 * 10) / 10,
  };
}

function toMs(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h * 60 + m) * 60_000;
}

const deployTime         = toMs('14:23');
const errorClimbTime     = toMs('14:26');
const alertFiredTime     = toMs('14:31');
const errorBaselineTime  = toMs('14:47'); // mitigation visible, NOT resolution
const fullRecoveryTime   = toMs('15:10'); // "Monitoring confirms full recovery"

// ── CANONICAL, using the page's own quickRef definitions ──────────
console.log('Canonical (deploy -> alert, alert -> full recovery):');
console.log(computeIncidentMetrics([
  { startTime: deployTime, detectedTime: alertFiredTime, resolvedTime: fullRecoveryTime },
]));

// ── The "What Went Well" narrative's own implicit reference points ─
console.log('Narrative (error-climb -> alert, alert -> baseline return):');
console.log(computeIncidentMetrics([
  { startTime: errorClimbTime, detectedTime: alertFiredTime, resolvedTime: errorBaselineTime },
]));
// -> Canonical:  { mttdMinutes: 8, mttrMinutes: 39 }
// -> Narrative:  { mttdMinutes: 5, mttrMinutes: 16 }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The canonical MTTR (39 minutes) is more than double the narrative’s implicit 16 minutes. Which of the two is the more USEFUL number for deciding whether this incident’s response was actually fast — and does "more useful" always mean "the one the quickRef’s definition literally asks for"?',
  hint: 'Think about what each number is actually meant to answer: "how long were users affected" versus "how long did our specific response actions take."',
  solution: `// The canonical 39-minute figure is the more useful one for the
// question MTTR is meant to answer -- "how long, from the moment we
// knew something was wrong, until the problem was ACTUALLY fixed for
// users." The 16-minute narrative figure describes something real and
// worth knowing too (how long from alert-fire to the first visible
// sign of recovery), but it stops at a MITIGATION signal, not
// resolution -- the page's own theory distinguishes these as separate
// lifecycle phases for exactly this reason. A team that only ever
// reports the shorter, mitigation-based number risks understating how
// long users were actually still affected in some smaller way between
// "error rate visibly improving" and "monitoring confirms full
// recovery."
//
// That said, "more useful" isn't automatically "always use the
// quickRef's literal definition and nothing else" -- a team explicitly
// tracking BOTH numbers, clearly labeled (time-to-mitigation vs.
// time-to-full-resolution), gets strictly more diagnostic value than
// picking only one. The actual problem this subtopic found isn't that
// the narrative's own number is illegitimate -- it's that the
// postmortem template never labels which one it's reporting.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since both calculations use the exact same underlying timeline and the exact same <code>computeIncidentMetrics</code> function, getting two different results must mean there’s a bug in the function itself.',
    reality: 'The function is correct and behaves identically both times — it simply computes <code>detectedTime - startTime</code> and <code>resolvedTime - detectedTime</code> exactly as documented. The two different RESULTS come entirely from passing it two different sets of input timestamps, chosen from the same real timeline but representing different definitions of "start" and "restoration." This is precisely the point: the formula was never the problem, the ambiguity about which real-world moment maps to each of its three parameters was.',
  },
  {
    thought: 'MTTD should always be measured from when the underlying code change (the deployment) happened, since that’s the objectively "true" start of the incident.',
    reality: 'That’s one defensible choice, and it’s the one this subtopic calls "canonical" for consistency with the quickRef’s own "incident start" wording — but it’s not the only reasonable interpretation. Some teams deliberately measure MTTD from when user-facing impact objectively BEGAN (the error-rate-climb timestamp), reasoning that a deployment that hasn’t yet caused any real symptom shouldn’t count against detection speed. Either choice is legitimate as long as it’s used CONSISTENTLY and stated explicitly — the actual problem this subtopic surfaces is silently mixing the two within the same document, not that one choice is objectively wrong.',
  },
];

@Component({
  selector: 'app-obs-oncall-mttd-mttr',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './computing-the-postmortems-own-mttd-and-mttr.html',
  styleUrl: './computing-the-postmortems-own-mttd-and-mttr.scss',
})
export class ComputingThePostmortemsOwnMttdAndMttrSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
