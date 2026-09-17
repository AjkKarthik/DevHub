import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-restricting-eval-access-via-acl-scripting',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './restricting-eval-access-via-acl-scripting.html',
  styleUrl: './restricting-eval-access-via-acl-scripting.scss',
})
export class RestrictingEvalAccessViaAclScriptingSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: '`lua-time-limit` does not disable anything',
      points: [
        'The main page originally claimed Lua scripts could be "disabled if not needed with `lua-time-limit 0`." Verified directly against Redis\'s own <code>redis.conf</code> comments, this directive has nothing to do with disabling scripting at all — it sets the maximum execution time (default 5000ms) before Redis starts responding BUSY to other clients while a slow script keeps running in the background.',
        'Setting <code>lua-time-limit</code> to 0 or a negative value, per Redis\'s own documentation, actually DISABLES that busy-detection mechanism entirely — a script can then run completely uninterrupted, with no warning to other clients at all. This is the opposite of restricting anything.',
      ],
    },
    {
      heading: 'The real fix: ACL',
      points: [
        'Since a Lua script executed via EVAL/EVALSHA can run arbitrary Redis commands, the correct way to restrict who can invoke scripting is the same ACL mechanism this page already covers for every other command category — deny the <code>@scripting</code> category (which covers EVAL, EVALSHA, FCALL, FCALL_RO, SCRIPT, and FUNCTION) for any user that does not genuinely need it.',
        'A user still needs <code>+@read</code>/<code>+@write</code> for their own ordinary commands — <code>-@scripting</code> only removes the scripting-specific command set, leaving everything else the user was already allowed to run untouched.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ACL SETUSER without scripting access',
      language: 'bash',
      code: `# app-service gets ordinary read/write access, but never EVAL/EVALSHA/SCRIPT --
# this is the correct fix for the main page's own (corrected) "restrict who has
# access to EVAL" theory bullet; lua-time-limit plays no role in it.
ACL SETUSER app-service on >AppSecret123 ~session:* ~cache:* &* +@read +@write -@scripting

# A dedicated user that DOES need scripting (e.g. an internal rate-limiter job)
ACL SETUSER script-runner on >RunnerPass ~ratelimit:* &* +@read +@write +@scripting

ACL LIST
# Verify: app-service should be denied, script-runner allowed
ACL DRYRUN app-service EVAL "return 1" 0
ACL DRYRUN script-runner EVAL "return 1" 0`,
    },
    {
      label: 'Simulated permission check',
      language: 'typescript',
      code: `interface UserAcl {
  allowedCategories: Set<string>;
  deniedCategories: Set<string>;
}

const SCRIPTING_COMMANDS = new Set(['EVAL', 'EVALSHA', 'FCALL', 'FCALL_RO', 'SCRIPT']);
const READ_COMMANDS = new Set(['GET', 'MGET']);
const WRITE_COMMANDS = new Set(['SET', 'DEL']);

function canRunCommand(user: UserAcl, command: string): boolean {
  const cmd = command.toUpperCase();
  if (user.deniedCategories.has('scripting') && SCRIPTING_COMMANDS.has(cmd)) return false;
  if (user.allowedCategories.has('all')) return true;
  if (user.allowedCategories.has('read') && READ_COMMANDS.has(cmd)) return true;
  if (user.allowedCategories.has('write') && WRITE_COMMANDS.has(cmd)) return true;
  return false;
}

const appService: UserAcl = {
  allowedCategories: new Set(['read', 'write']),
  deniedCategories: new Set(['scripting']),
};

console.log('app-service GET:', canRunCommand(appService, 'GET'));       // true
console.log('app-service EVAL:', canRunCommand(appService, 'EVAL'));     // false
console.log('app-service SCRIPT:', canRunCommand(appService, 'SCRIPT')); // false`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A defineCommand()-registered custom Lua command (like the atomic rate-limiter this hub\'s own Redis with Node.js topic builds) is called via EVALSHA under the hood by ioredis. If <code>app-service</code> is denied <code>@scripting</code>, does calling that custom command still work?',
    hint: 'What does the ACL check actually inspect — the friendly method name ioredis exposes, or the real Redis command it sends over the wire?',
    solution: `No -- ACL enforcement happens on the Redis server, checking the ACTUAL command sent over the wire, not the friendly JavaScript method name a client library exposes. ioredis's defineCommand() is purely a client-side convenience: calling redis.rateLimit(...) still sends a genuine EVALSHA (or EVAL on first call) to the server underneath.

Since -@scripting denies EVALSHA/EVAL at the ACL layer regardless of how the client constructed the call, app-service would be rejected with a NOPERM error the moment it tried to invoke that custom command -- even though defineCommand() makes the call site look like an ordinary method call with no visible EVAL/EVALSHA anywhere. A user that legitimately needs a custom Lua command needs +@scripting (or a narrower +EVALSHA), the same as any other script.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"`lua-time-limit 0` sounds like it should mean \'no scripts allowed\' — a limit of zero seconds is the strictest possible setting."',
      reality: 'This reads intuitively but is backwards for this specific directive: 0 (or any negative value) is Redis\'s own documented way to say "no limit at all," not "zero allowed." The directive was never designed as an access-control mechanism — it exists purely to control how long Redis waits before warning other clients about a slow script, an entirely different concern from WHO is allowed to run one.',
    },
    {
      thought: '"Disabling @scripting for a user also blocks that user from being affected by OTHER users\' scripts."',
      reality: '@scripting only controls whether the denied user can THEMSELVES invoke EVAL/EVALSHA/SCRIPT/FUNCTION — a script run by a DIFFERENT, permitted user can still read or write keys the denied user has permission to access, exactly as if that write had happened through an ordinary command. ACL restricts what a given connection can DO, not what effects other connections\' actions can have on shared data.',
    },
  ];

  topicLabel = 'Redis Security';
  topicRoute = '/redis/security';
  prev: SubtopicLink | null = {
    label: 'Parsing ACL LOG’s object Field Correctly',
    route: '/redis/security/parsing-acl-logs-object-field-correctly',
  };
  next: SubtopicLink | null = {
    label: 'ACL SAVE Requires an aclfile',
    route: '/redis/security/acl-save-requires-an-aclfile',
  };
}
