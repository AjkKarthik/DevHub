import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-protected-mode-checks-password-not-bind',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './protected-mode-checks-password-not-bind.html',
  styleUrl: './protected-mode-checks-password-not-bind.scss',
})
export class ProtectedModeChecksPasswordNotBindSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page\'s quiz got wrong',
      points: [
        'The original quiz answer described protected-mode as rejecting external connections "unless (a) a bind address is explicitly configured, or (b) requirepass is set" — implying either condition alone is enough to lift the restriction.',
        'Verified directly against Redis\'s own <code>networking.c</code> accept-time check: the actual guard is <code>server.protected_mode && DefaultUser-&gt;flags &amp; USER_FLAG_NOPASS</code> — nothing in that condition looks at whether <code>bind</code> was ever explicitly set.',
        'So the real rule is single-condition, not two-condition: protected-mode blocks non-loopback connections whenever the default user has no password, full stop. An explicit <code>bind 0.0.0.0</code> does not open the door on its own.',
      ],
    },
    {
      heading: 'Why the wrong version is dangerous, not just imprecise',
      points: [
        'The wrong version reads as reassuring: "I set bind 0.0.0.0 on purpose, so protected-mode must have let me through deliberately." That is backwards — if it let you through with no password, protected-mode was not doing its job at all.',
        'In current Redis, that scenario cannot happen: <code>bind 0.0.0.0</code> plus no <code>requirepass</code>/ACL password still gets every external connection rejected with the built-in DENIED error, exactly as if <code>bind</code> had never been touched.',
        'The only thing that actually lifts the restriction is giving the default user a password — either <code>requirepass</code> in redis.conf, or an ACL password for the default user set some other way.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the accept-time check',
      language: 'typescript',
      code: `// Mirrors Redis's own networking.c logic exactly:
//   if (server.protected_mode && DefaultUser->flags & USER_FLAG_NOPASS) {
//     if (connIsLocal(conn) != 1) { reject }
//   }
// Note what is NOT in this condition: bind status plays no part at all.

function wouldRejectConnection(
  protectedMode: boolean,
  hasPassword: boolean,
  isLocal: boolean,
): boolean {
  if (protectedMode && !hasPassword) {
    if (!isLocal) return true; // DENIED
  }
  return false; // accepted
}

const scenarios: [string, boolean, boolean, boolean][] = [
  ['default config, external client', true, false, false],
  ['default config, connecting from localhost', true, false, true],
  ['requirepass set, external client', true, true, false],
  // "bind 0.0.0.0" was set explicitly here -- but that fact never
  // reaches this function at all, because Redis's own check doesn't
  // read it either.
  ['bind 0.0.0.0 explicit, still no password, external client', true, false, false],
];

for (const [desc, pm, pw, local] of scenarios) {
  console.log(desc, '->', wouldRejectConnection(pm, pw, local) ? 'REJECTED' : 'accepted');
}
// default config, external client -> REJECTED
// default config, connecting from localhost -> accepted
// requirepass set, external client -> accepted
// bind 0.0.0.0 explicit, still no password, external client -> REJECTED`,
    },
    {
      label: 'The real DENIED error text',
      language: 'bash',
      code: `# redis.conf: bind 0.0.0.0, no requirepass, protected-mode yes (default)
$ redis-cli -h your-server-ip PING
(error) DENIED Redis is running in protected mode because protected
mode is enabled and no password is set for the default user.
In this mode connections are only accepted from the loopback interface.
If you want to connect from external computers to Redis you
may adopt one of the following solutions:
1) Just disable protected mode sending the command
'CONFIG SET protected-mode no' from the loopback interface ...
4) Set up an authentication password for the default user.

# Notice: nothing in this message mentions bind at all. Only two
# real fixes exist -- disable protected-mode, or set a password.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You inherit a Redis instance with <code>bind 0.0.0.0</code>, <code>protected-mode yes</code> (the default), and no <code>requirepass</code>/ACL password anywhere in the config. A colleague says "we already fixed security by explicitly binding to all interfaces instead of leaving it unset." Using the verified check above, what will an external client actually experience when it connects?',
    hint: 'Trace the exact two conditions the real check reads: <code>protected_mode</code> and whether the default user has <code>USER_FLAG_NOPASS</code>. Neither one is affected by what <code>bind</code> was set to.',
    solution: `The colleague is wrong about what fixed anything. protected_mode is still yes, and the default user still has NOPASS (no requirepass, no ACL password) -- those are the only two things the real check reads. bind being explicitly 0.0.0.0 instead of implicit changes nothing about that check.

So the external client gets exactly the same DENIED error it would have gotten with no bind directive at all: "protected mode is enabled and no password is set for the default user... connections are only accepted from the loopback interface."

The instance is not actually more exposed than before either -- protected-mode is still correctly blocking it. But the colleague's mental model is dangerous: the next change they make (assuming bind is the security control) might be to disable protected-mode "since we already secured it with bind," which really would open the instance up. The only real fix is requirepass or an ACL password for the default user.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Explicitly setting bind (to anything, even 0.0.0.0) is one of two ways to satisfy protected-mode."',
      reality: 'Verified against Redis\'s own accept-time source: bind status is not part of the check at all. The only thing that lifts the non-loopback restriction is giving the default user a password, or turning protected-mode off outright.',
    },
    {
      thought: '"protected-mode and bind do two unrelated jobs, so it does not matter which one \'wins\' for security."',
      reality: '<code>bind</code> controls which network interfaces Redis listens on at the OS socket level (a connection to an unbound interface can never even reach Redis). protected-mode is a second, independent, application-level check that runs after a connection is already accepted on a bound interface. They are complementary layers, not alternatives -- neither substitutes for the other, and neither substitutes for a real password.',
    },
  ];

  topicLabel = 'Installation & Setup';
  topicRoute = '/redis/installation-setup';
  prev: SubtopicLink | null = {
    label: 'bind and aof-use-rdb-preamble Are Runtime-Modifiable',
    route: '/redis/installation-setup/bind-and-aof-preamble-are-runtime-modifiable',
  };
  next: SubtopicLink | null = {
    label: 'CONFIG REWRITE Needs a Config File to Rewrite',
    route: '/redis/installation-setup/config-rewrite-needs-a-config-file',
  };
}
