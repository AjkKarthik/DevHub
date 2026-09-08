import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-config-rewrite-needs-a-config-file',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './config-rewrite-needs-a-config-file.html',
  styleUrl: './config-rewrite-needs-a-config-file.scss',
})
export class ConfigRewriteNeedsAConfigFileSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The gap in the main page\'s own QnA',
      points: [
        'The main page\'s QnA on persisting CONFIG SET changes correctly names <code>CONFIG REWRITE</code> as the way to write the running config back to redis.conf — but never mentions that it can fail outright, with no config file to write.',
        'Verified directly against Redis\'s own <code>configRewriteCommand</code> in config.c: the very first thing it checks is <code>server.configfile == NULL</code>. If Redis was started with no config-file path at all, this check fails immediately and Redis replies with the exact error <code>"The server is running without a config file"</code> — no partial rewrite, no fallback location, nothing written anywhere.',
        '<code>server.configfile</code> is set from the command-line argument used to start <code>redis-server</code> — if you never pass a path to a .conf file (whether directly or via a container\'s CMD), it simply stays unset for the lifetime of that process.',
      ],
    },
    {
      heading: 'This directly affects the main page\'s own Docker Setup examples',
      points: [
        'Fetched directly from the official redis Docker image\'s own Dockerfile: the default <code>CMD ["redis-server"]</code> passes zero arguments, and the image\'s <code>docker-entrypoint.sh</code> does not inject a config path either — it just execs whatever CMD was given.',
        'So the main page\'s first Docker command (<code>docker run -d --name redis -p 6379:6379 redis:7-alpine</code>) and its second (adding <code>redis-server --requirepass "secret"</code>) both start Redis with <code>server.configfile</code> unset — CONFIG REWRITE would fail on either container.',
        'Only the main page\'s third command — the one that mounts a redis.conf file AND passes its path as an explicit argument (<code>redis-server /usr/local/etc/redis/redis.conf</code>) — gives Redis a real config file to rewrite.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the configfile check',
      language: 'typescript',
      code: `// Mirrors Redis's own configRewriteCommand exactly:
//   if (server.configfile == NULL) {
//     addReplyError(c, "The server is running without a config file");
//     return;
//   }

interface ContainerLaunch {
  label: string;
  args: string[]; // the arguments actually passed after "redis-server"
}

function serverConfigFile(launch: ContainerLaunch): string | null {
  // server.configfile is set from a bare, non-flag .conf-looking argument
  // passed on the redis-server command line -- anything else leaves it null.
  const confArg = launch.args.find(a => !a.startsWith('-') && a.endsWith('.conf'));
  return confArg ?? null;
}

function wouldConfigRewriteSucceed(launch: ContainerLaunch): boolean {
  return serverConfigFile(launch) !== null;
}

const launches: ContainerLaunch[] = [
  { label: 'docker run redis:7-alpine (no args)', args: [] },
  { label: 'docker run redis:7-alpine redis-server --requirepass "secret"', args: ['--requirepass', 'secret'] },
  { label: 'docker run ... redis-server /usr/local/etc/redis/redis.conf', args: ['/usr/local/etc/redis/redis.conf'] },
];

for (const launch of launches) {
  console.log(launch.label, '-> CONFIG REWRITE would', wouldConfigRewriteSucceed(launch) ? 'succeed' : 'fail: "The server is running without a config file"');
}
// docker run redis:7-alpine (no args) -> CONFIG REWRITE would fail: "The server is running without a config file"
// docker run redis:7-alpine redis-server --requirepass "secret" -> CONFIG REWRITE would fail: "The server is running without a config file"
// docker run ... redis-server /usr/local/etc/redis/redis.conf -> CONFIG REWRITE would succeed`,
    },
    {
      label: 'The real official Dockerfile',
      language: 'bash',
      code: `# From redis/docker-library-redis's own Dockerfile -- fetched directly,
# not assumed:
#   ENTRYPOINT ["docker-entrypoint.sh"]
#   EXPOSE 6379
#   CMD ["redis-server"]
#
# And docker-entrypoint.sh's own logic: if the first argument doesn't
# look like a flag or a *.conf path, it just execs "$@" unchanged --
# it never injects a default config-file path on your behalf.

# This container genuinely has no config file at all:
docker run -d --name redis -p 6379:6379 redis:7-alpine
docker exec -it redis redis-cli CONFIG REWRITE
# (error) ERR The server is running without a config file

# This one does, because the path is passed explicitly:
docker run -d --name redis -p 6379:6379 \\
  -v /path/to/redis.conf:/usr/local/etc/redis/redis.conf \\
  redis:7-alpine redis-server /usr/local/etc/redis/redis.conf
docker exec -it redis redis-cli CONFIG REWRITE
# +OK`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate runs <code>docker run -d --name redis -p 6379:6379 redis:7-alpine redis-server --requirepass "prod_secret" --maxmemory 512mb</code>, then does <code>CONFIG SET maxmemory 1gb</code> and <code>CONFIG REWRITE</code> to make it stick. Will the CONFIG REWRITE succeed, and if not, what happens to their maxmemory change on the next container restart?',
    hint: 'Apply the same <code>serverConfigFile()</code> check from the code above to this exact launch command — does anything in the argument list end in <code>.conf</code>?',
    solution: `CONFIG REWRITE fails. Every argument after "redis-server" here is a CLI flag (--requirepass, --maxmemory) -- none of them is a bare .conf file path, so server.configfile is never set, and Redis replies with the same "server is running without a config file" error every time.

The CONFIG SET maxmemory 1gb change IS live and working right now -- Redis is using 1gb as its actual memory limit this instant. But it exists only in the running process's memory. There is no file anywhere for CONFIG REWRITE to have written it to, and there never was one to begin with.

If this container restarts (a redeploy, an OOM kill, a host reboot), the NEW redis-server process starts fresh from the same "redis-server --requirepass prod_secret --maxmemory 512mb" command -- it has no memory of the CONFIG SET that happened to the OLD process. maxmemory silently reverts to 512mb. The fix is not CONFIG REWRITE at all here -- it is changing the launch command itself (or switching to a real mounted redis.conf) so the new value survives a restart.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"CONFIG REWRITE always works as long as I have permission to run it — it will just create a config file somewhere if one does not exist."',
      reality: 'Verified against Redis\'s own source: <code>configRewriteCommand</code> checks <code>server.configfile == NULL</code> BEFORE attempting anything, and returns immediately with an error if there is no path at all. It rewrites an EXISTING known file (creating one from scratch is only possible if that file used to exist and was deleted after Redis started with it) — it never invents a brand-new config file location on its own.',
    },
    {
      thought: '"Passing --requirepass or --maxmemory directly on the redis-server command line is basically the same as putting them in a config file, for CONFIG REWRITE purposes."',
      reality: 'They configure Redis identically at startup, but only a real .conf FILE PATH argument sets server.configfile. CLI flags like --requirepass and --maxmemory set the corresponding values directly with no file involved at all — CONFIG REWRITE has nothing to write to.',
    },
  ];

  topicLabel = 'Installation & Setup';
  topicRoute = '/redis/installation-setup';
  prev: SubtopicLink | null = {
    label: 'Protected-Mode Checks for a Password, Not a Bind',
    route: '/redis/installation-setup/protected-mode-checks-password-not-bind',
  };
  next: SubtopicLink | null = null;
}
