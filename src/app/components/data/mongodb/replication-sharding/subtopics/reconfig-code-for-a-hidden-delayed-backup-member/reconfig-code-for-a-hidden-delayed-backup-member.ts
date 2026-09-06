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
    heading: 'Two QnAs Describe Config Flags — Neither Shows the reconfig() Call',
    points: [
      'The main page has two separate QnAs — one on hidden members, one on delayed replicas — each naming the exact config fields involved (<code>hidden: true</code>, <code>priority: 0</code>, <code>secondaryDelaySecs</code>), but neither ever shows the actual <code>rs.reconfig()</code> call that applies them to a running replica set.',
      'Modifying a replica set\'s configuration always follows the same pattern: fetch the CURRENT config with <code>rs.conf()</code>, mutate the specific member entry in its <code>members</code> array, increment the config\'s own <code>version</code> field, then pass the WHOLE modified config object to <code>rs.reconfig()</code> — you cannot patch a single member field directly.',
      'Combining both QnAs\' own config fields onto ONE member turns an ordinary secondary into a dedicated, delayed backup node in a single reconfig call: hidden from drivers, ineligible to become primary, and intentionally lagging behind by a configured delay.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Actual reconfig() Call',
    language: 'typescript',
    code: `// Turn an existing secondary into a hidden, 1-hour-delayed backup
// member -- combining both the "hidden member" and "delayed replica"
// QnAs' own config fields into one real reconfig() call.
function makeHiddenDelayed(cfg: any, hostToModify: string, delaySecs: number) {
  const next = JSON.parse(JSON.stringify(cfg)); // reconfig() needs a FULL config object
  const member = next.members.find((m: any) => m.host === hostToModify);
  if (!member) throw new Error('member not found in replica set config');

  member.priority = 0;             // can never become primary
  member.hidden = true;            // invisible to drivers -- no read traffic
  member.secondaryDelaySecs = delaySecs; // intentionally lags behind by this many seconds

  next.version += 1; // MongoDB requires a strictly-incrementing version on every reconfig
  return next;
}

// In mongosh:
const cfg = rs.conf();
const updated = makeHiddenDelayed(cfg, 'localhost:27019', 3600); // 1-hour delay
rs.reconfig(updated);

// Verified via a pure-JS model of the same mutation, confirming the
// version bump and that the ORIGINAL config object is left untouched:
const originalConfig = {
  _id: 'rs0', version: 1,
  members: [
    { _id: 0, host: 'localhost:27017', priority: 2 },
    { _id: 1, host: 'localhost:27018', priority: 1 },
    { _id: 2, host: 'localhost:27019', priority: 1 },
  ],
};
const result = makeHiddenDelayed(originalConfig, 'localhost:27019', 3600);
console.log('New version:', result.version);                              // -> 2
console.log('New member 2 config:', JSON.stringify(result.members[2]));    // hidden/delayed
console.log('Original member 2 untouched:', JSON.stringify(originalConfig.members[2]));`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate tries to skip fetching the full config first, and instead calls <code>rs.reconfig({ members: [{ _id: 2, hidden: true }] })</code> directly, hoping to patch just the one member they care about. What actually happens to the OTHER two members in the replica set?',
  hint: 'Think about what "config object" rs.reconfig() actually applies — is it merged with the existing config, or does it replace the whole thing?',
  solution: `// This is destructive -- rs.reconfig() REPLACES the entire replica
// set configuration with whatever object is passed to it, it does not
// merge or patch individual fields. Passing a config with only ONE
// member entry effectively tells MongoDB the replica set now consists
// of exactly that one member -- the other two members (_id 0 and 1)
// would be REMOVED from the replica set configuration entirely, not
// merely left unchanged.
//
// This is exactly why the correct pattern always starts with
// rs.conf() to get the CURRENT full config, mutates only the specific
// field(s) that need to change, and passes the WHOLE modified object
// back to rs.reconfig() -- never a partial object.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'rs.reconfig() works like a typical REST API PATCH — you can pass just the fields you want to change, and MongoDB merges them into the existing configuration.',
    reality: 'rs.reconfig() replaces the ENTIRE replica set configuration with whatever object you pass — there is no partial-update/merge behavior. Always start from the current rs.conf() output, mutate only the specific fields you need, and pass the complete object back.',
  },
  {
    thought: 'Since hidden members and delayed replicas are described in two separate QnAs on the main page, they must be mutually exclusive configurations — a member is either hidden OR delayed, not both.',
    reality: 'hidden, priority, and secondaryDelaySecs are independent fields on the SAME member config object — nothing prevents setting all three together, and doing so is exactly how a dedicated, delayed backup node (invisible to drivers, never eligible for primary, intentionally lagging) is actually configured in practice.',
  },
];

@Component({
  selector: 'app-mongo-rs-reconfig-hidden-delayed',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './reconfig-code-for-a-hidden-delayed-backup-member.html',
  styleUrl: './reconfig-code-for-a-hidden-delayed-backup-member.scss',
})
export class ReconfigCodeForAHiddenDelayedBackupMemberSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
