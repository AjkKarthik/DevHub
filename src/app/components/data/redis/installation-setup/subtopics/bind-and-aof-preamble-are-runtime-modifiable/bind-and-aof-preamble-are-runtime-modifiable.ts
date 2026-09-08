import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-bind-and-aof-preamble-are-runtime-modifiable',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './bind-and-aof-preamble-are-runtime-modifiable.html',
  styleUrl: './bind-and-aof-preamble-are-runtime-modifiable.scss',
})
export class BindAndAofPreambleAreRuntimeModifiableSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page got wrong',
      points: [
        'The main topic page\'s own QnA claimed "directives like bind, aof-use-rdb-preamble, and cluster-enabled require a restart" — grouping all three together as restart-only.',
        'Verified directly against Redis\'s own <code>config.c</code> source (the file every directive is registered in): only <code>cluster-enabled</code> is genuinely marked <code>IMMUTABLE_CONFIG</code>. Both <code>bind</code> and <code>aof-use-rdb-preamble</code> are registered <code>MODIFIABLE_CONFIG</code> — they can be changed live with <code>CONFIG SET</code>, no restart needed.',
        '<code>bind</code> even has its own dedicated live-reconfiguration handler, <code>applyBind</code>, wired up specifically so a runtime bind change takes effect immediately rather than only updating an in-memory value nothing reads until the next boot.',
      ],
    },
    {
      heading: 'Why this distinction matters operationally',
      points: [
        'If you believe <code>bind</code> needs a restart, you will schedule a maintenance window for what is actually a zero-downtime change — over-cautious, but at least safe.',
        'The more costly direction is the opposite mistake: assuming <code>cluster-enabled</code> is ALSO live-changeable (since two of the three "restart-only" directives turned out not to be) and trying <code>CONFIG SET cluster-enabled yes</code> on a running non-cluster instance. Redis rejects this outright — cluster mode is decided once, at process startup, and genuinely cannot be toggled without a restart.',
        'The general lesson: a directive\'s restart requirement is a per-directive fact baked into its own registration flags, not something you can infer from "this sounds like a fundamental setting."',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Verifying the three flags',
      language: 'typescript',
      code: `// Reproduces exactly what Redis's own src/config.c registers for
// each directive named in the main page's original (wrong) QnA claim.
// (Confirmed by grepping the real config.c source directly.)

type Modifiability = 'MODIFIABLE_CONFIG' | 'IMMUTABLE_CONFIG';

const REDIS_CONFIG_FLAGS: Record<string, Modifiability> = {
  // createBoolConfig("cluster-enabled", NULL, IMMUTABLE_CONFIG, ...)
  'cluster-enabled': 'IMMUTABLE_CONFIG',
  // createBoolConfig("aof-use-rdb-preamble", NULL, MODIFIABLE_CONFIG, ...)
  'aof-use-rdb-preamble': 'MODIFIABLE_CONFIG',
  // createSpecialConfig("bind", NULL, MODIFIABLE_CONFIG | MULTI_ARG_CONFIG, ...)
  'bind': 'MODIFIABLE_CONFIG',
};

function canChangeAtRuntime(directive: string): boolean {
  return REDIS_CONFIG_FLAGS[directive] === 'MODIFIABLE_CONFIG';
}

for (const directive of Object.keys(REDIS_CONFIG_FLAGS)) {
  console.log(
    directive,
    '->',
    canChangeAtRuntime(directive) ? 'CONFIG SET works live' : 'restart required',
  );
}
// cluster-enabled -> restart required
// aof-use-rdb-preamble -> CONFIG SET works live
// bind -> CONFIG SET works live`,
    },
    {
      label: 'CONFIG SET vs. CONFIG REWRITE',
      language: 'bash',
      code: `# Change the bind address live -- takes effect immediately, no restart
redis-cli CONFIG SET bind "127.0.0.1 10.0.0.5"

# The change is now live, but it is ONLY in memory.
# A restart right now would revert to whatever redis.conf still says.
redis-cli CONFIG GET bind
# 1) "bind"
# 2) "127.0.0.1 10.0.0.5"

# Persist the live value back into the config file Redis was started with
redis-cli CONFIG REWRITE

# By contrast, this always fails no matter what:
redis-cli CONFIG SET cluster-enabled yes
# (error) ERR Unsupported CONFIG parameter: cluster-enabled`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given the verified flags above, which of these four directives can you change with a plain <code>CONFIG SET</code> while Redis keeps running, and which force a restart: <code>maxmemory</code>, <code>cluster-enabled</code>, <code>appendonly</code>, <code>databases</code>?',
    hint: '<code>databases</code> is the interesting one to think through — it sets how many numbered logical databases (0-15 by default) exist, and every client connection already has one selected the moment it connects.',
    solution: `maxmemory: MODIFIABLE_CONFIG -- CONFIG SET maxmemory 512mb works live, this is the textbook runtime-tunable case.

appendonly: MODIFIABLE_CONFIG -- CONFIG SET appendonly yes turns AOF on/off live; Redis triggers a background AOF rewrite to bootstrap the file when you do.

cluster-enabled: IMMUTABLE_CONFIG -- confirmed above, restart required. Cluster mode changes core startup behavior (cluster bus port, node ID file, slot ownership) that can only be decided once at boot.

databases: IMMUTABLE_CONFIG -- also confirmed directly against config.c (createIntConfig with no runtime-apply handler at all). Shrinking the count live would orphan any client already SELECTed into a database number that no longer exists, and growing it would need to allocate new per-database dictionaries mid-flight -- Redis sidesteps both problems by only ever deciding this once, at boot.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"If a directive controls something as fundamental as network binding, it must need a restart to change."',
      reality: 'Fundamental-sounding is not the same as restart-only. <code>bind</code> is exactly this kind of "fundamental" setting and it is still <code>MODIFIABLE_CONFIG</code> — Redis just had to build a live re-bind handler (<code>applyBind</code>) for it. The only reliable way to know is checking the actual registration flag in <code>config.c</code>, not guessing from how important the setting sounds.',
    },
    {
      thought: '"CONFIG SET always persists the change, so CONFIG REWRITE is just a nice-to-have."',
      reality: 'CONFIG SET only ever changes the in-memory running configuration. If Redis restarts before you run <code>CONFIG REWRITE</code>, it reloads from whatever redis.conf still says on disk and your live change is gone with no warning.',
    },
  ];

  topicLabel = 'Installation & Setup';
  topicRoute = '/redis/installation-setup';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'Protected-Mode Checks for a Password, Not a Bind',
    route: '/redis/installation-setup/protected-mode-checks-password-not-bind',
  };
}
