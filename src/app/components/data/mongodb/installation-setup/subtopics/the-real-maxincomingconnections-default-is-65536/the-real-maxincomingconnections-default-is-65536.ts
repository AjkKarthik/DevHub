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
    heading: 'The Configured Default Is a Ceiling, Not a Guarantee',
    points: [
      'The main page\'s own QnA on connection pooling stated the server-side connection limit "default 1,000,000 but typically limited by OS and RAM." Verified via WebSearch: MongoDB\'s own documented default for <code>net.maxIncomingConnections</code> is 65536 — not 1,000,000 — and even that configured default is itself automatically capped LOWER by the operating system\'s own file-descriptor limit.',
      'The exact rule, per MongoDB\'s own docs: on Linux, <code>net.maxIncomingConnections</code> must not exceed <code>(RLIMIT_NOFILE / 2) * 0.8</code>. If a configured or default value would exceed that, MongoDB silently falls back to whatever the OS ulimit actually allows — meaning the real, effective ceiling on a given machine can be far below 65536 if the OS file-descriptor limit (<code>ulimit -n</code>) hasn\'t been raised from an old, low default.',
      'This is the SAME server-side ceiling the Fundamentals topic\'s own subtopic already traced from the driver side — <code>maxPoolSize</code> (100, per-client, driver-enforced) versus <code>net.maxIncomingConnections</code> (this figure, server-enforced). Both numbers were wrong in different places on this hub before these two subtopics fixed them: one said "100" was the server\'s limit, this one said the server\'s limit was "1,000,000" — the real figure, 65536, sits between both wrong claims.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'What the RLIMIT_NOFILE Cap Actually Does',
    language: 'typescript',
    code: `// MongoDB's own documented rule (Linux):
// net.maxIncomingConnections <= (RLIMIT_NOFILE / 2) * 0.8
// If the configured/default value exceeds this, MongoDB silently
// falls back to whatever the OS ulimit actually allows.

function effectiveConnectionCap(rlimitNofile: number): number {
  return Math.floor((rlimitNofile / 2) * 0.8);
}

const CONFIGURED_DEFAULT = 65536; // net.maxIncomingConnections's own default

for (const ulimit of [1024, 4096, 64000, 1048576]) {
  const cap = effectiveConnectionCap(ulimit);
  const binding = Math.min(cap, CONFIGURED_DEFAULT);
  console.log(
    \`ulimit -n = \${ulimit} -> OS-derived cap = \${cap} -> \` +
    \`effective ceiling = \${binding} \${cap < CONFIGURED_DEFAULT ? '(OS ulimit is the binding constraint)' : '(the 65536 default is the binding constraint)'}\`
  );
}
// -> ulimit -n = 1024:    OS-derived cap = 409    -> effective ceiling = 409    (OS ulimit is binding)
// -> ulimit -n = 4096:    OS-derived cap = 1638   -> effective ceiling = 1638   (OS ulimit is binding)
// -> ulimit -n = 64000:   OS-derived cap = 25600  -> effective ceiling = 25600  (OS ulimit is binding)
// -> ulimit -n = 1048576: OS-derived cap = 419430 -> effective ceiling = 65536  (the 65536 default is binding)`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A production server has been carefully raised to <code>ulimit -n 163840</code> — following the standard operational advice to raise file descriptor limits for MongoDB. What is the effective connection ceiling now, and is the OS ulimit or the configured 65536 default the binding constraint?',
  hint: 'Compute (163840 / 2) * 0.8 and compare the result directly against 65536.',
  solution: `// (163840 / 2) * 0.8 = 81920 * 0.8 = 65536 exactly.
//
// At this specific ulimit value, the OS-derived cap and the configured
// default LAND on the exact same number -- 65536. Neither is strictly
// "more binding" than the other at this precise threshold; raising
// ulimit -n any further than 163840 would make the configured 65536
// default the binding constraint instead, and net.maxIncomingConnections
// would then need to be explicitly raised in mongod.conf to actually use
// the extra OS-level headroom. This is exactly why "raise the ulimit"
// alone isn't sufficient advice -- past this threshold, the config value
// itself also needs raising to see any further benefit.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since MongoDB automatically falls back to whatever the OS allows, there\'s no need to think about net.maxIncomingConnections at all — the OS ulimit handles it.',
    reality: 'The fallback only ever LOWERS the effective ceiling, never raises it — MongoDB uses <code>min(configured value, OS-derived cap)</code>. A server with a generously raised ulimit (like the 1,048,576 case above) is still capped at the CONFIGURED value (65536 by default) unless <code>net.maxIncomingConnections</code> is also explicitly raised in <code>mongod.conf</code>. Both numbers matter — the OS ulimit sets a ceiling MongoDB can never exceed, and the config value sets a separate ceiling that has to be raised independently to use any OS-level headroom above it.',
  },
  {
    thought: 'This 65536 figure is the same thing as the driver\'s own maxPoolSize (100) — just a bigger version of the same setting.',
    reality: 'They are two structurally different settings enforced on two different sides of the connection, not one setting scaled up. <code>maxPoolSize</code> is a per-<code>MongoClient</code> cap the DRIVER enforces locally, with no awareness of the server at all. <code>net.maxIncomingConnections</code> is the SERVER\'s own total capacity across every client combined, enforced by mongod itself. A single client hitting its own maxPoolSize cap has nothing to do with the server\'s ceiling being reached — they are independent limits that happen to both be about "connections," which is exactly the confusion this hub\'s own sibling subtopic on maxPoolSize traces from the opposite direction.',
  },
];

@Component({
  selector: 'app-mongo-install-max-incoming-connections',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-real-maxincomingconnections-default-is-65536.html',
  styleUrl: './the-real-maxincomingconnections-default-is-65536.scss',
})
export class TheRealMaxincomingconnectionsDefaultIs65536Subtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
