import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-one-level-default-doesnt-guard-deeper-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './one-level-default-doesnt-guard-a-deeper-nested-property.html',
  styleUrl: './one-level-default-doesnt-guard-a-deeper-nested-property.scss',
})
export class OneLevelDefaultDoesntGuardADeeperNestedPropertySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #1\'s Fix Adds a Default at ONE Level — Does That Actually Cover Every Level?',
      points: [
        'Mistake #1\'s "right" code is <code>const { user: { name } = {} } = data ?? {};</code> — it adds a default at the OUTER level (in case <code>data</code> or <code>data.user</code> is missing) but the pattern only goes one level deep (just <code>name</code>). The QnA separately shows a genuinely deeper example (<code>address: { street = "" } = {}</code>) but never combines the two into ONE pattern to test whether a shallow fix protects a deeper structure.',
        'This subtopic builds a THREE-level nested pattern where a default is added at only the FIRST intermediate level, then tests it against data missing the SECOND intermediate level — to directly confirm whether that one default is enough, or whether every level genuinely needs its own default.',
      ],
    },
    {
      heading: 'Why Each Nesting Level Needs Its Own Independent Default',
      points: [
        'Destructuring defaults are evaluated independently, level by level, as the pattern is matched against the actual data — a default at level 1 only ever activates if the LEVEL 1 value itself is <code>undefined</code>. It has no awareness of, and provides no protection for, what happens further down the pattern at level 2 or level 3.',
        'If level 1\'s value IS present (even as an empty object <code>{}</code>) but level 2\'s expected property is missing, the level 1 default never even triggers — matching proceeds into level 2 using the object that WAS found, and if THAT level has no default of its own, destructuring level 2\'s missing property as <code>undefined</code>, then trying to destructure INTO that <code>undefined</code> for level 3, throws exactly the same way as if no defaults existed anywhere.',
        'The practical rule: a nested destructuring pattern is only as safe as its LEAST-defaulted level — every single level that might legitimately be missing needs its OWN <code>= {}</code> (or equivalent) default, not just the outermost one.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Nested default level demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// Data where level 1 (user) exists, but level 2 (address) is missing.
const responseA: any = { user: { name: 'Alice' } };   // no address at all

console.log('--- Only a level-1 default (user = {}) ---');
try {
  const {
    user: { address: { city } = {} } = {},
  } = responseA;
  console.log('city:', city);
} catch (err) {
  console.log('THREW:', (err as Error).message);
}

// Data where even level 1 (user) is missing entirely.
const responseB: any = {};

console.log('');
console.log('--- Same pattern, but level 1 (user) is ALSO missing ---');
try {
  const {
    user: { address: { city } = {} } = {},
  } = responseB;
  console.log('city:', city);
} catch (err) {
  console.log('THREW:', (err as Error).message);
}

// Now remove the level-2 default specifically, keeping level 1's.
console.log('');
console.log('--- Level 1 default present, level 2 default REMOVED ---');
try {
  const {
    user: { address: { city } } = {},   // no "= {}" after address
  } = responseA;
  console.log('city:', city);
} catch (err) {
  console.log('THREW:', (err as Error).message);
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Compare all 3 scenarios. Does having a default at level 1 (user = {}) protect against a MISSING level 2 (address)? What happens when the level-2 default is removed specifically?',
    hint: 'Ask: in each failing case, which specific level\'s value was actually undefined at the moment destructuring reached it, and did THAT level have its own default?',
    solution: `Scenario 1 (level-1 default present, address genuinely missing from
responseA): city is undefined -- NO ERROR. This works because BOTH
levels have their own default: user's default never triggers (user
DOES exist), but address's own "= {}" default DOES trigger (address
is genuinely undefined), producing an empty object to destructure
city from, safely giving city = undefined.

Scenario 2 (user ALSO missing, from responseB): city is ALSO
undefined -- also no error, for the same reason at one level up:
user's own default triggers this time (user is undefined),
producing {} to destructure address from, and THAT triggers address's
own default too. Every level's default did its job independently.

Scenario 3 (level-1 default kept, but level-2's own "= {}" removed):
THIS ONE THROWS -- "Cannot destructure property 'city' of
'address' as it is undefined." Even though user: {...} = {} is
still present and DID find a real user object (so its own default
never even needed to trigger), address is genuinely missing from
responseA, and with no default of ITS OWN, destructuring city out
of undefined throws exactly like an unguarded nested destructure
would.

This confirms the theory's rule precisely: a pattern is only as
safe as its LEAST-defaulted level. The outer default having "already
worked" for a different level is irrelevant -- each level's safety
is fully independent of every other level's.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'adding a default value at the outermost level of a nested destructuring pattern (like { user: {...} = {} }) protects the entire pattern against any missing intermediate property, at any depth.',
      reality: 'each nesting level\'s default only protects THAT specific level — a default at level 1 does nothing to guard against a missing value at level 2 or 3; every level that might legitimately be absent needs its own independent default.',
    },
    {
      thought: 'if the outer levels of a nested destructure all resolve successfully (their defaults never even needed to trigger), the pattern as a whole is "safe" and any deeper level will be fine too.',
      reality: 'each level\'s safety is completely independent — an outer level resolving fine (finding a real object, not needing its default) says nothing about whether a DEEPER level\'s value will also be present; that deeper level needs to be checked (or defaulted) on its own merits.',
    },
    {
      thought: 'the main page\'s own fix — const { user: { name } = {} } = data ?? {} — is already fully safe for any depth of nesting, since it demonstrates the general pattern.',
      reality: 'that specific fix only goes ONE level deep (just to name) — a genuinely deeper pattern (like reaching into user.address.city) needs the SAME "= {}" treatment repeated at EVERY additional level, not just the one shown in that specific example.',
    },
  ];
}
