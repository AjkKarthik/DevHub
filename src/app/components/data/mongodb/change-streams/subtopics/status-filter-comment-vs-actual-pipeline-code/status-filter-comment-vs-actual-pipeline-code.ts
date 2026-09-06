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
    heading: 'The Comment Promised a Server-Side Filter — The Code Didn\'t Deliver One',
    points: [
      'The main page\'s own "Filter Pipeline & Full Document" codeTab opened with a comment claiming "Only receive insert/update events where status === \'shipped\'" — but its <code>$match</code> stage originally filtered ONLY on <code>operationType</code>, with no status condition anywhere in the pipeline at all.',
      'The actual status check lived in the for-await loop, client-side — <code>if (newStatus === \'shipped\') { await sendShippingNotification(...); }</code> — which is exactly the anti-pattern the page\'s OWN "Filtering events in application code instead of the pipeline" mistake block, right below it, explicitly warns against.',
      'The fix pushes <code>\'fullDocument.status\': \'shipped\'</code> directly into the <code>$match</code> stage, matching the mistake block\'s own "right" example — now every event that reaches the client already matched status server-side, with no redundant client-side re-check needed.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before vs. After: Where the Filter Actually Runs',
    language: 'typescript',
    code: `// BEFORE -- the comment claims a server-side status filter, but the
// pipeline never actually filters on status. Every insert/update/replace
// event on the WHOLE collection is transmitted to the client.
const pipelineBefore = [
  { \$match: { operationType: { \$in: ['insert', 'update', 'replace'] } } },
];
// ...client code then does: if (event.fullDocument?.status === 'shipped') { ... }
// -- transmitting (and discarding) every non-'shipped' event over the wire.

// AFTER -- the status condition moves INTO the $match stage itself.
const pipelineAfter = [
  {
    \$match: {
      operationType: { \$in: ['insert', 'update', 'replace'] },
      'fullDocument.status': 'shipped',
    },
  },
];
// Only events that already match BOTH conditions are ever sent to the
// client -- no redundant client-side status check needed at all.

// Pure-JS model quantifying the difference over 10,000 simulated update
// events, only 2% of which actually flip to 'shipped':
function simulate(count: number, shippedFraction: number) {
  const events = Array.from({ length: count }, (_, i) => ({
    operationType: 'update',
    status: i < count * shippedFraction ? 'shipped' : 'pending',
  }));
  const transmittedBefore = events.length; // operationType-only match: everything
  const transmittedAfter = events.filter(e => e.status === 'shipped').length;
  return { transmittedBefore, transmittedAfter };
}

const { transmittedBefore, transmittedAfter } = simulate(10000, 0.02);
console.log('Transmitted BEFORE (operationType-only $match):', transmittedBefore);
console.log('Transmitted AFTER  (status pushed into $match):', transmittedAfter);
console.log('Reduction:', ((1 - transmittedAfter / transmittedBefore) * 100).toFixed(1) + '%');
// -> BEFORE: 10000, AFTER: 200, Reduction: 98.0%`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate "fixes" the original bug differently: they leave the <code>$match</code> stage exactly as it was (operationType-only) and instead move the status check into a SEPARATE <code>$match</code> stage appended right after the <code>$project</code> stage, which strips <code>fullDocument.status</code> down to a shorter field name. Does this achieve the same bandwidth savings as pushing the condition into the ORIGINAL <code>$match</code> stage?',
  hint: 'Think about what "server-side filtering" actually requires — it is about which stage in the pipeline the condition runs in, not merely that a $match stage exists somewhere in the array.',
  solution: `// Yes -- this still works and still filters server-side, AS LONG AS
// the new $match stage comes BEFORE the change stream reaches its
// wire-transmission boundary, which every stage in a change stream
// pipeline does (the whole pipeline runs on the server before any
// event is sent to the client). Placing $match right after $project
// instead of first is a valid pipeline shape too.
//
// The genuine bug in the original code was NOT about stage ORDER --
// it was that no stage anywhere in the pipeline ever checked status
// at all. Any $match stage, anywhere in the pipeline array, that
// checks the condition achieves the same server-side filtering
// benefit, since the entire pipeline executes on the server before
// transmission either way.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A comment describing what a change stream pipeline "receives" or "filters for" is a reliable summary of what the pipeline\'s own $match stage actually does.',
    reality: 'The main page\'s own codeTab is a real, caught example of the opposite: the comment claimed a status filter that the $match stage never implemented at all. Always check the ACTUAL $match/$project conditions against the stated intent, especially when a sibling mistake block on the same page teaches the exact pattern the comment claims to be following.',
  },
  {
    thought: 'As long as SOME filtering happens before the event reaches application code, it does not matter whether that filtering lives in the change stream pipeline or in the async-iteration loop — the bandwidth cost is the same either way.',
    reality: 'It matters a great deal. A pipeline $match runs on the MongoDB server, before any event is transmitted to the client at all — a non-matching event is never sent. A check inside the for-await loop runs AFTER the event has already been transmitted over the network; every non-matching event still cost the same bandwidth and CPU to send, only to be discarded.',
  },
];

@Component({
  selector: 'app-mongo-cs-status-filter-comment',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './status-filter-comment-vs-actual-pipeline-code.html',
  styleUrl: './status-filter-comment-vs-actual-pipeline-code.scss',
})
export class StatusFilterCommentVsActualPipelineCodeSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
