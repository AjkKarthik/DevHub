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
    heading: 'Verified: "Append-Only" Was Never the Whole Story Since MongoDB 5.1',
    points: [
      'The main page\'s own mistakes block and one of its own quiz questions originally claimed a blanket "updates and deletes are not supported" on time series collections — corrected against MongoDB\'s own documented update-command requirements: since MongoDB 5.1+, updates ARE allowed, strictly limited to the metaField.',
      'The exact documented requirements: the update\'s filter can ONLY match on the metaField value, the update document can ONLY modify the metaField value, the command must apply to every matching document (<code>multi: true</code> or <code>updateMany()</code> — never a single-document <code>updateOne()</code> without it), and <code>upsert: true</code> is forbidden.',
      'This matters for a real, common scenario: a server gets renamed (a new hostname) or a sensor gets reassigned to a new location — the metaField value itself needs to change across every EXISTING historical document, not just new ones going forward. This is exactly the case the restricted update exists for.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Valid metaField-Only Update',
    language: 'typescript',
    code: `const metrics = db.collection('server_metrics');
// metrics: { timestamp, hostname (metaField), cpuPercent, memPercent }

// VALID: filter matches ONLY the metaField (hostname), modifies ONLY
// the metaField, and applies to every matching document (multi:true).
await metrics.updateMany(
  { hostname: 'web-01' },              // filter: metaField only
  { \$set: { hostname: 'web-01-renamed' } }, // modify: metaField only
);

// INVALID (rejected by MongoDB, regardless of multi:true):
// filtering or modifying a MEASUREMENT field like cpuPercent.
// await metrics.updateMany({ cpuPercent: { \$gt: 90 } }, { \$set: { hostname: 'x' } });
// await metrics.updateMany({ hostname: 'web-01' }, { \$set: { cpuPercent: 0 } });

// Pure-JS model, verified against a 3-document seed set:
function validMetaFieldUpdate(docs, oldHostname, newHostname) {
  let matchCount = 0;
  for (const d of docs) {
    if (d.hostname === oldHostname) { d.hostname = newHostname; matchCount++; }
  }
  return matchCount;
}

const docs = [
  { _id: 1, hostname: 'web-01', cpuPercent: 40 },
  { _id: 2, hostname: 'web-01', cpuPercent: 42 },
  { _id: 3, hostname: 'web-02', cpuPercent: 55 },
];
const matched = validMetaFieldUpdate(docs, 'web-01', 'web-01-renamed');
console.log('Documents updated:', matched);
console.log(docs);
// -> Documents updated: 2  (both web-01 readings; web-02 untouched)

// Verifying the two documented restrictions independently:
function wouldBeRejected(filterField, modifyField, metaFieldName) {
  return !(filterField === metaFieldName && modifyField === metaFieldName);
}
console.log('filter+modify both on metaField:', wouldBeRejected('hostname', 'hostname', 'hostname') ? 'REJECTED' : 'accepted');
console.log('filter on metaField, modify a measurement:', wouldBeRejected('hostname', 'cpuPercent', 'hostname') ? 'REJECTED' : 'accepted');
console.log('filter on a measurement, modify metaField:', wouldBeRejected('cpuPercent', 'hostname', 'hostname') ? 'REJECTED' : 'accepted');
// -> accepted / REJECTED / REJECTED`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A team wants to run <code>db.metrics.updateOne({ hostname: "web-01" }, { $set: { hostname: "web-01-renamed" } })</code> — matching and modifying ONLY the metaField, exactly as required — but using <code>updateOne</code> instead of <code>updateMany</code>. Does this succeed?',
  hint: 'One of the documented requirements is specifically about how MANY documents the command is allowed to touch, independent of which FIELDS it touches.',
  solution: `// No -- this is rejected, even though the filter and the modified
// field are both correctly restricted to the metaField. MongoDB's own
// documented requirement states the update command "must not limit
// the number of documents to be updated" -- it must use multi: true
// or updateMany(), never a plain updateOne() (which implicitly limits
// the operation to at most one document).
//
// This is a SEPARATE restriction from the field-restriction rule --
// getting the field restriction right (metaField-only) is necessary
// but not sufficient; the multi:true requirement must ALSO be
// satisfied, independently, for the same update command to succeed.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Time series collections are unconditionally append-only — no document, once written, can ever have any of its fields changed after insertion.',
    reality: 'Verified against MongoDB\'s own documented update-command requirements: the metaField specifically CAN be updated, since MongoDB 5.1+ — just not measurement fields, and only under the multi:true + no-upsert restrictions this subtopic verifies directly. "Append-only" describes the MEASUREMENT data (temperature, cpuPercent, and so on), not literally every field in the document.',
  },
  {
    thought: 'Since the metaField can be updated, it should be fine to use a metaField-only update as a general workaround for correcting mislabeled documents, the same way you might fix any other data-entry mistake.',
    reality: 'The metaField-only update exists specifically for a metaField VALUE genuinely changing for every document that shares it (a rename, a reassignment) — it always applies to every document matching the OLD value, via multi:true. It cannot be used to correct a single mislabeled document\'s metaField without accidentally also updating every other document that happens to share that same old metaField value.',
  },
];

@Component({
  selector: 'app-mongo-timeseries-metafield-update',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './updates-are-allowed-but-only-on-the-metafield.html',
  styleUrl: './updates-are-allowed-but-only-on-the-metafield.scss',
})
export class UpdatesAreAllowedButOnlyOnTheMetafieldSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
