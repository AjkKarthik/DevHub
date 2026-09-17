import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-acl-save-requires-an-aclfile',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './acl-save-requires-an-aclfile.html',
  styleUrl: './acl-save-requires-an-aclfile.scss',
})
export class AclSaveRequiresAnAclfileSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Two persistence modes, not two interchangeable commands',
      points: [
        'The main page\'s own theory bullet says runtime ACL changes "must be saved (ACL SAVE or CONFIG REWRITE) to survive restarts" — phrased as if the two commands were interchangeable options for the same job. Verified directly against Redis\'s own official ACL documentation, they are not.',
        'Redis supports exactly two ways to store users: inline <code>user</code> directives directly in <code>redis.conf</code>, or an external file via the <code>aclfile</code> directive — documented as "mutually incompatible," meaning a deployment picks ONE mode, never both. Each mode has its OWN, non-interchangeable persistence command: inline mode uses <code>CONFIG REWRITE</code> (which rewrites redis.conf\'s own <code>user</code> lines); aclfile mode uses <code>ACL SAVE</code> (which writes to the separate ACL file).',
      ],
    },
    {
      heading: 'The trap: CONFIG REWRITE looks like it worked',
      points: [
        'Redis\'s own docs state this explicitly: "CONFIG REWRITE does not also trigger ACL SAVE... the configuration and the ACLs are handled separately." In aclfile mode, calling ONLY <code>CONFIG REWRITE</code> genuinely succeeds — it rewrites redis.conf\'s own settings correctly — but never touches the ACL file\'s contents at all.',
        'This is a silent trap specifically because <code>CONFIG REWRITE</code> reports success either way. A runtime <code>ACL SETUSER</code> change made while using an aclfile, "persisted" with only <code>CONFIG REWRITE</code>, is lost on the next restart with no error anywhere warning that it was never saved.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Which command persists ACL changes, by mode',
      language: 'typescript',
      code: `type AclPersistenceMode = 'inline-redis-conf' | 'aclfile';

// Encodes Redis's own documented rule: the correct persistence command
// depends entirely on which of the two mutually-exclusive modes is in use.
function correctPersistCommand(mode: AclPersistenceMode): string {
  return mode === 'inline-redis-conf'
    ? 'CONFIG REWRITE'   // rewrites redis.conf's own "user ..." lines
    : 'ACL SAVE';        // writes the aclfile's own contents
}

console.log(correctPersistCommand('inline-redis-conf')); // 'CONFIG REWRITE'
console.log(correctPersistCommand('aclfile'));            // 'ACL SAVE'

// The trap, made explicit: calling ONLY CONFIG REWRITE while running in
// aclfile mode reports success (redis.conf itself really is rewritten)
// but silently leaves every ACL SETUSER change unpersisted -- the aclfile
// on disk is untouched, and a restart reverts to whatever it last held.
function wouldSilentlyLoseAclChanges(mode: AclPersistenceMode, calledCommand: string): boolean {
  return mode === 'aclfile' && calledCommand === 'CONFIG REWRITE';
}
console.log(wouldSilentlyLoseAclChanges('aclfile', 'CONFIG REWRITE')); // true`,
    },
    {
      label: 'Correct persistence in aclfile mode',
      language: 'bash',
      code: `# redis.conf
aclfile /etc/redis/users.acl

# Runtime change
> ACL SETUSER app-service on >AppSecret123 ~session:* +@read +@write -@scripting
OK

# WRONG: this succeeds but does NOT save the ACL change
> CONFIG REWRITE
OK

# CORRECT: writes the current in-memory ACL state to /etc/redis/users.acl
> ACL SAVE
OK

# Verify the file was actually updated
$ grep app-service /etc/redis/users.acl`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A deployment uses inline <code>user</code> directives in redis.conf (no aclfile configured). An operator runs <code>ACL SETUSER newuser on &gt;pass +@read</code> at runtime, then calls <code>ACL SAVE</code> to persist it. What happens?',
    hint: 'ACL SAVE writes to a specific target file — check which mode actually has that target configured.',
    solution: `ACL SAVE fails outright, with an error stating the instance is not configured to use an ACL file -- confirmed directly against Redis's own documented behavior. ACL SAVE only has meaning in aclfile mode, since it writes to the aclfile's own path; with no aclfile configured, there is no file for it to write to.

The correct command for this deployment is CONFIG REWRITE, which persists the current in-memory ACL state by rewriting redis.conf's own user directives directly -- the exact inverse pairing of the aclfile-mode case this subtopic's own main example demonstrates. Picking the wrong command for the configured mode does not silently do nothing in EVERY case: in this direction it produces a loud, immediate error rather than a silent no-op.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Since both persistence modes ultimately need SOME command to save runtime ACL changes, calling both ACL SAVE and CONFIG REWRITE together is always the safe choice, regardless of which mode is configured."',
      reality: 'Calling the WRONG command for the configured mode is not harmless: in inline-redis-conf mode, ACL SAVE fails with an explicit error (there is no aclfile to write to); in aclfile mode, CONFIG REWRITE silently succeeds while leaving the ACL file completely untouched. There is exactly one correct command per mode, and calling the other one either errors loudly or does nothing at all — never a safe universal fallback.',
    },
    {
      thought: '"redis.conf can list a few users inline via user directives AND also point at an aclfile for the rest, giving the best of both approaches."',
      reality: 'Redis\'s own documentation states the two methods are "mutually incompatible" — a running instance uses exactly one mode. Attempting to configure both is not a supported hybrid; the deployment has to fully commit to either inline user directives or a single external aclfile.',
    },
  ];

  topicLabel = 'Redis Security';
  topicRoute = '/redis/security';
  prev: SubtopicLink | null = {
    label: 'Restricting EVAL Access via ACL -@scripting',
    route: '/redis/security/restricting-eval-access-via-acl-scripting',
  };
  next: SubtopicLink | null = null;
}
