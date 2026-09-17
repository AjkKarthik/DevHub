import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-parsing-acl-logs-object-field-correctly',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './parsing-acl-logs-object-field-correctly.html',
  styleUrl: './parsing-acl-logs-object-field-correctly.scss',
})
export class ParsingAclLogsObjectFieldCorrectlySubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page\'s own Challenge solution got wrong',
      points: [
        'The main page\'s own reference solution for <code>auditAclViolations()</code> parsed ACL LOG\'s <code>object</code> field as <code>"command|key"</code> — splitting on a <code>|</code> character to get the command and key separately. Verified directly against Redis\'s own official ACL LOG documentation, this was never how the field works.',
        'Redis documents <code>object</code> as "the resource that the user had insufficient permissions to access" — for a <code>reason: \'command\'</code> entry it holds the COMMAND name, for <code>reason: \'key\'</code> it holds the KEY name, for <code>reason: \'channel\'</code> it holds the CHANNEL name, and for <code>reason: \'auth\'</code> it is literally the string <code>"AUTH"</code>. It is never a combined string, and the <code>|</code> character only appears for a command|subcommand pair like <code>CONFIG|GET</code>.',
      ],
    },
    {
      heading: 'The fix: client-info\'s own cmd= token',
      points: [
        'Every ACL LOG entry also carries a <code>client-info</code> field — the same info string <code>CLIENT LIST</code> returns for a connected client — which always includes a <code>cmd=&lt;name&gt;</code> token naming the actual command that was running, regardless of which <code>reason</code> triggered the entry.',
        'That means the correct, reliable way to recover the command is to parse <code>cmd=</code> out of <code>client-info</code>, not to guess at the shape of <code>object</code> — and <code>object</code> itself is still the right source for the KEY or CHANNEL, but only when <code>reason</code> says it actually represents one.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Buggy vs. fixed, run against real ACL LOG entry shapes',
      language: 'typescript',
      code: `function toKv(entry: (string | number)[]) {
  return Object.fromEntries(
    entry.reduce<[string, string][]>(
      (acc, v, i) => (i % 2 === 0 ? [...acc, [String(v), String(entry[i + 1])]] : acc),
      [],
    ),
  );
}

// A realistic reason=key entry: user "analytics" denied GET on "secret:key1"
const keyDeniedEntry = [
  'count', 1, 'reason', 'key', 'context', 'toplevel', 'object', 'secret:key1',
  'username', 'analytics', 'age-seconds', '10.0', 'client-info',
  'id=2 addr=1.2.3.4:2 ... cmd=get user=analytics redir=-1 resp=2',
];

// BUGGY: assumes object is "command|key"
const kv = toKv(keyDeniedEntry);
const buggyCommand = (kv['object'] ?? '').split('|')[0];
const buggyKey = (kv['object'] ?? '').split('|')[1] ?? '';
console.log('buggy:', { command: buggyCommand, key: buggyKey });
// -> { command: 'secret:key1', key: '' }
//    the KEY name lands in the command field; the real key is lost entirely

// FIXED: cmd= from client-info; object used as key/channel only when reason says so
const reason = kv['reason'] ?? '';
const object = kv['object'] ?? '';
const cmdMatch = (kv['client-info'] ?? '').match(/(?:^|\\s)cmd=(\\S+)/);
const fixedCommand = cmdMatch ? cmdMatch[1] : (reason === 'command' ? object : '');
const fixedKey = reason === 'key' || reason === 'channel' ? object : '';
console.log('fixed:', { command: fixedCommand, key: fixedKey });
// -> { command: 'get', key: 'secret:key1' } -- both fields correctly populated`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'For an entry with <code>reason: \'auth\'</code> (a failed AUTH attempt), the fixed logic still runs <code>cmdMatch</code> against <code>client-info</code>. What command name does it report for that entry, and is that actually useful information?',
    hint: 'A failed AUTH attempt still comes from a real client connection running a real command — check what cmd= would be set to for that specific request.',
    solution: `For a reason='auth' entry, client-info's own cmd= token is 'auth' (or 'hello' for a failed HELLO-based auth) -- the fixed logic correctly reports command: 'auth' for this case, since cmd= reflects whatever command the client was actually running when the failure was logged, independent of the reason field.

This is genuinely useful: it distinguishes a failed AUTH via the plain AUTH command from a failed authentication attempted through HELLO's own AUTH option, which the reason field alone ('auth' either way) cannot tell apart. The key field correctly stays empty for this entry, since an authentication failure was never about a specific key at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Since client-info always has a cmd= token, the object field is basically redundant and could be dropped from the parsed result entirely."',
      reality: 'object is still the ONLY source for the key or channel name on a reason=key/reason=channel entry — client-info\'s cmd= token never tells you WHICH key or channel was denied, only which command was running when the denial happened. The two fields answer genuinely different questions and the fixed logic needs both.',
    },
    {
      thought: '"This bug would have been caught by TypeScript\'s type checker, since it clearly returns the wrong data."',
      reality: 'The buggy code is completely valid TypeScript — <code>(kv[\'object\'] ?? \'\').split(\'|\')[1] ?? \'\'</code> always type-checks to a string, whether or not a <code>|</code> character is actually present. The bug is purely semantic (a wrong assumption about the data\'s SHAPE), which is exactly the category of bug a type checker cannot catch — only reading Redis\'s own documented field semantics, or running the code against realistic sample data, surfaces it.',
    },
  ];

  topicLabel = 'Redis Security';
  topicRoute = '/redis/security';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'Restricting EVAL Access via ACL -@scripting',
    route: '/redis/security/restricting-eval-access-via-acl-scripting',
  };
}
