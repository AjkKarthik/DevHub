import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-nullish-vs-or-assignment-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './nullish-assignment-keeps-zero-or-only-assigns.html',
  styleUrl: './nullish-assignment-keeps-zero-or-only-assigns.scss',
})
export class NullishAssignmentKeepsZeroOrOnlyAssignsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #4 Shows the Bug With || — But What About Its Assignment Cousin ||=?',
      points: [
        'Mistake #4 demonstrates <code>vol || 50</code> silently replacing a legitimate <code>0</code> with <code>50</code>. The Operators section separately introduces <code>??=</code>, <code>||=</code>, and <code>&amp;&amp;=</code> as "short-circuit assignments," but never explicitly connects the two — does <code>||=</code> have the EXACT SAME 0-clobbering problem as plain <code>||</code>?',
        'This subtopic runs <code>x ||= 99</code> and <code>x ??= 99</code> against five falsy-but-different values (<code>0</code>, <code>""</code>, <code>false</code>, <code>null</code>, <code>undefined</code>) to show precisely which ones each operator overwrites.',
      ],
    },
    {
      heading: 'Why ||= and ??= Check Different Conditions Before Assigning',
      points: [
        '<code>x ||= value</code> expands to roughly <code>x || (x = value)</code> — it assigns ONLY IF <code>x</code> is currently falsy. Since <code>0</code>, <code>""</code>, and <code>false</code> are all falsy, ALL of them get overwritten, exactly like the plain <code>||</code> operator\'s bug.',
        '<code>x ??= value</code> expands to roughly <code>x ?? (x = value)</code> — it assigns ONLY IF <code>x</code> is currently <code>null</code> or <code>undefined</code>. <code>0</code>, <code>""</code>, and <code>false</code> are left completely untouched; only the two nullish values trigger the assignment.',
        'This means <code>||=</code> is not a "safer" or "modern" version of <code>||</code> in any way — it has the IDENTICAL falsy-value blind spot, just expressed as a compound assignment. The safety only comes from choosing <code>??=</code> specifically, the same distinction the main page draws between <code>||</code> and <code>??</code> as plain operators.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>||= vs ??= demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const testValues: [string, unknown][] = [
  ['0', 0],
  ['"" (empty string)', ''],
  ['false', false],
  ['null', null],
  ['undefined', undefined],
];

console.log('starting value'.padEnd(20), 'after ||= 99'.padEnd(16), 'after ??= 99');
console.log('-'.repeat(56));

for (const [label, startValue] of testValues) {
  let orTest: unknown = startValue;
  orTest ||= 99;

  let nullishTest: unknown = startValue;
  nullishTest ??= 99;

  console.log(label.padEnd(20), String(orTest).padEnd(16), String(nullishTest));
}

console.log('');
console.log('Rows where the two result columns differ show where ||= over-assigns.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. For each starting value (0, "", false, null, undefined), compare the "after ||= 99" and "after ??= 99" columns — which starting values does each operator actually overwrite?',
    hint: '||= assigns whenever the current value is falsy. ??= assigns only when the current value is null or undefined. Which of the 5 test values are falsy but NOT null/undefined?',
    solution: `||= 99 overwrites ALL FIVE starting values with 99 -- 0, "", and
false are falsy (so ||= treats them as "needs a default"), and null
and undefined are also falsy (so ||= correctly catches those too,
just for the same reason as everything else).

??= 99 overwrites ONLY null and undefined -- 0, "", and false all
remain completely unchanged at their original values, because none
of them are null or undefined.

The disagreement is exactly the three falsy-but-not-nullish values:
0, "", and false. For these three specifically, ||= incorrectly
treats "this is a legitimate, intentional value" the same as "this
was never set" -- while ??= correctly distinguishes them.

This directly extends Mistake #4's lesson to the assignment
operators: ||= is not some safer alternative to bare || -- it has
the IDENTICAL blind spot, just written as a compound assignment
instead of x = x || value. If a variable can legitimately hold 0,
"", or false as a meaningful value (a volume level, an empty search
query, a disabled toggle), ||= will silently clobber it exactly like
|| would -- only ??= is safe for those cases.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '||= is a modern ES2021 operator, so it must have the improved, safer null/undefined-only behavior that ?? brought to plain assignment.',
      reality: '||= and ??= were introduced in the SAME ES2021 update, but they wrap DIFFERENT operators — ||= wraps the old falsy-checking || operator and inherits its exact 0/""/false blind spot; only ??= wraps the newer, narrower ?? operator.',
    },
    {
      thought: 'x ||= value and x ??= value are interchangeable for setting a default — the choice is just a style preference.',
      reality: 'they produce genuinely different results whenever x could legitimately be 0, "", or false — x ||= value discards those values as if they were unset, while x ??= value preserves them correctly.',
    },
    {
      thought: 'the || vs ?? distinction only matters for the plain operators (a || b) — once you\'re doing an assignment, JavaScript "figures out" the right behavior automatically.',
      reality: 'the compound assignment operators (||= and ??=) are pure syntactic sugar for their underlying operator — ||= behaves EXACTLY like the plain || operator\'s falsy check, with no additional intelligence applied.',
    },
  ];
}
