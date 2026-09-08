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
    heading: 'A Documented Risk the Main Page Never Mentions',
    points: [
      'The sibling subtopic\'s fix pushed <code>\'fullDocument.status\': \'shipped\'</code> into a <code>$match</code> stage, combined with <code>fullDocument: \'updateLookup\'</code> — exactly the pairing MongoDB\'s own official change streams documentation specifically warns about: under rapid deletions or traffic spikes, this combination can produce <strong>"Resume Token Not Found"</strong> errors, and the main page never mentions this risk anywhere.',
      'The documented cause: <code>updateLookup</code> performs a live lookup against the CURRENT state of the collection to fetch the document. If the document has since been DELETED (a real possibility under a high delete rate), that lookup returns null — <code>fullDocument</code> becomes null for that event — which MongoDB\'s own docs state can prevent the change stream from finding the resume token afterward.',
      'MongoDB\'s own documentation recommends the modern fix: use pre- and post-images instead, with <code>fullDocumentBeforeChange: "whenAvailable"</code> and <code>fullDocument: "whenAvailable"</code> (MongoDB 6.0+) — since a pre/post image is captured and durably stored in <code>config.system.preimages</code> at the moment of the ORIGINAL write, it needs no live lookup against a document that might have since been deleted.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Risky Combination vs. the Recommended Fix',
    language: 'typescript',
    code: `// RISKY (per MongoDB's own documented warning): updateLookup + $match
// on a fullDocument field, on a collection with a real delete rate.
const riskyPipeline = [
  { \$match: { operationType: { \$in: ['insert', 'update', 'replace'] }, 'fullDocument.status': 'shipped' } },
];
const riskyStream = collection.watch(riskyPipeline, { fullDocument: 'updateLookup' });
// Under rapid deletions or traffic spikes, a document matched by an
// earlier update can be deleted before updateLookup's live query runs
// for that event -- the lookup returns null, and MongoDB's own docs
// state this specific scenario can produce a "Resume Token Not Found"
// error on a later resume attempt.

// RECOMMENDED FIX -- pre/post images, no live lookup required.
// Step 1: enable pre/post images on the collection (once, at setup):
await client.db('shop').command({
  collMod: 'orders',
  changeStreamPreAndPostImages: { enabled: true },
});

// Step 2: request "whenAvailable" images instead of updateLookup.
const saferStream = collection.watch(riskyPipeline, {
  fullDocument: 'whenAvailable',
  fullDocumentBeforeChange: 'whenAvailable',
});
// The image was captured and stored durably in config.system.preimages
// AT THE MOMENT OF THE ORIGINAL WRITE -- there is no live lookup against
// the collection's current state to race against a later delete.

// Pure-JS model of the actual race, using explicit timestamps:
function simulateUpdateLookupRace(updateAt: number, lookupAt: number, deleteAt: number | null) {
  if (deleteAt !== null && deleteAt > updateAt && deleteAt <= lookupAt) {
    return { fullDocument: null, risk: 'lookup ran AFTER the delete -- null document' };
  }
  return { fullDocument: { status: 'shipped' }, risk: 'none -- lookup beat the delete' };
}

console.log('Update at t=0, lookup at t=5, delete at t=3 (BEFORE lookup runs):',
  simulateUpdateLookupRace(0, 5, 3));
console.log('Update at t=0, lookup at t=5, no delete at all:',
  simulateUpdateLookupRace(0, 5, null));`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Why does switching to <code>fullDocument: "whenAvailable"</code> with pre/post images avoid the race the risky pipeline is exposed to, when the collection has the exact same delete rate either way?',
  hint: 'Compare WHEN the document data is actually captured under each approach — at the moment of the original write, or later, when the change stream event is being read.',
  solution: `// updateLookup performs its lookup LATER -- at the moment the change
// stream event is being read/processed, querying the collection's
// CURRENT state. If the document was deleted in between the original
// write and this later lookup, there is nothing left to find.
//
// A pre/post image is captured and durably stored (in
// config.system.preimages) AT THE MOMENT OF THE ORIGINAL WRITE ITSELF
// -- before any later delete could possibly happen. Reading it back
// later is retrieving already-stored data, not re-querying a
// potentially-already-deleted document. The delete rate is identical
// in both scenarios; what changes is WHEN the document's data gets
// captured relative to that delete.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'fullDocument: "updateLookup" and fullDocument: "whenAvailable" (with pre/post images enabled) are just two different option names for getting the same full-document data — pick whichever reads better in the code.',
    reality: 'They differ in WHEN the document data is captured, which is exactly what determines whether the delete-rate race applies. updateLookup queries live, later; pre/post images are captured once, durably, at write time. Verified against MongoDB\'s own documentation: this is specifically why MongoDB recommends pre/post images as the fix for the "Resume Token Not Found" risk, not merely an alternative syntax for the same behavior.',
  },
  {
    thought: 'The "Resume Token Not Found" risk only matters for exotic, very-high-throughput deployments — an ordinary application with normal delete rates has nothing to worry about.',
    reality: 'MongoDB\'s own documentation frames the risk around "rapid deletions or traffic spikes" — a description that fits an ordinary application experiencing a temporary burst (a bulk cleanup job, a sale-driven traffic spike, a batch delete), not only exotic high-throughput systems. Any application combining updateLookup with a $match on fullDocument fields on a collection that is EVER deleted from in bulk is exposed to this, not just permanently high-throughput ones.',
  },
];

@Component({
  selector: 'app-mongo-cs-updatelookup-match-risk',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './updatelookup-plus-match-resume-token-not-found-risk.html',
  styleUrl: './updatelookup-plus-match-resume-token-not-found-risk.scss',
})
export class UpdatelookupPlusMatchResumeTokenNotFoundRiskSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
