import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './anonymous-volumes-orphan-on-every-recreation.html',
  styleUrl: './anonymous-volumes-orphan-on-every-recreation.scss'
})
export class AnonymousVolumesOrphanOnEveryRecreationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own volume-cleanup discussion is scoped entirely to NAMED volumes',
      points: [
        'The main page\'s own mistake entry, "Forgetting that docker compose down does NOT remove named volumes," and its own quiz question both discuss volume cleanup purely in terms of the NAMED `db-data` volume — `docker compose down -v` removes it, or it can be targeted individually with `docker volume rm project_db-data`.',
        'The main page\'s own separate dev override code tab uses a completely different kind of volume for `/app/node_modules` — an ANONYMOUS one (no name given, just a bare container path). Nothing on the page connects these two code tabs, or discusses whether the same cleanup story applies to both kinds of volume the SAME page teaches.',
        'It does not. Anonymous volumes have a genuinely different lifecycle than named ones, in a way that matters specifically for the exact dev-override pattern the main page\'s own code demonstrates.',
      ]
    },
    {
      heading: 'What actually happens to the anonymous node_modules volume across repeated container recreations',
      points: [
        'Every time a container mounting an anonymous volume is recreated (a normal, frequent event during local development — rebuilding the image, running `docker compose up --build`, or just `docker compose restart api`), Docker creates a BRAND NEW anonymous volume for that mount point. The previous anonymous volume is not automatically deleted; it becomes an orphan, disconnected from any running container, sitting on disk with an auto-generated hash-like name.',
        'This is a direct, structural consequence of anonymity itself: a named volume (`db-data`) is a single, stable, addressable resource that every container recreation reconnects to — but an anonymous volume has no name to reconnect BY, so Compose has no way to know "this new container\'s node_modules mount should reuse that old orphaned volume from three rebuilds ago" even if it wanted to.',
        'Per Docker\'s own confirmed behavior, `docker compose down` WITHOUT `-v` leaves these orphaned anonymous volumes in place exactly like it leaves named volumes — but unlike named volumes, orphaned anonymous ones cannot be targeted individually by a memorable name (`docker volume rm project_db-data` has no anonymous-volume equivalent); they can only be found by listing all volumes and identifying the ones with no readable name, or cleared in bulk with `docker volume prune` or `docker compose down -v`.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Watching anonymous volumes accumulate across normal dev-loop rebuilds',
      language: 'bash',
      code: `# Starting point: a clean project, no volumes yet.
docker volume ls
# (empty)

# A normal local dev cycle: start, make a Dockerfile/dependency
# change, rebuild.
docker compose up -d
docker volume ls
# DRIVER    VOLUME NAME
# local     myproj_db-data                          <- named, stable
# local     a1b2c3d4e5f67890...                      <- anonymous (node_modules)

# Change package.json, rebuild api's image:
docker compose up -d --build api
docker volume ls
# DRIVER    VOLUME NAME
# local     myproj_db-data                          <- SAME as before
# local     a1b2c3d4e5f67890...                      <- OLD anonymous vol,
#                                                        now orphaned
# local     f9e8d7c6b5a43210...                      <- NEW anonymous vol,
#                                                        just created

# Repeat this rebuild cycle 10 times over a normal week of
# development, and docker volume ls now shows myproj_db-data plus
# 10 accumulated, orphaned, unnamed anonymous volumes -- none of
# which "docker compose down" (without -v) ever cleaned up.`,
    },
    {
      label: 'Cleaning them up, and why they can\'t be targeted individually like db-data can',
      language: 'bash',
      code: `# The main page's own mistake-entry fix for the NAMED db-data
# volume, targeting it specifically by name:
docker volume rm myproj_db-data

# There is no equivalent for an orphaned anonymous volume -- its
# name IS the random hash, which tells you nothing about which
# service or mount it used to belong to. You cannot write
# "docker volume rm api-node-modules" because that name was never
# assigned in the first place.

# The only practical cleanup options are bulk operations:

# Remove ALL unused volumes (named AND anonymous) not currently
# referenced by any container:
docker volume prune -f

# Or, scoped to a specific compose project, remove containers AND
# every volume (named + anonymous) the project's compose.yml
# references, in one step:
docker compose down -v

# Neither of these lets you selectively keep db-data (which you
# usually WANT to persist) while only clearing the accumulated
# node_modules orphans -- "docker compose down -v" clears both
# together, which is exactly why the main page's own mistake entry
# frames -v as something to reach for carefully, not routinely.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer notices their laptop\'s disk usage from Docker volumes has grown steadily over several months of using the main page\'s own dev override pattern, despite running `docker compose down` (no -v) religiously at the end of every work session, specifically to avoid losing their local db-data. Using this subtopic\'s theory, explain what is accumulating, and why their careful habit of omitting -v doesn\'t actually prevent it.',
    hint: 'Per this subtopic\'s theory, does docker compose down without -v leave BOTH named and anonymous volumes in place — and does a NEW anonymous volume get created every time the api container is rebuilt or recreated?',
    solution: 'Per this subtopic\'s theory, the developer\'s habit is correctly preserving db-data (their actual goal), but it is doing nothing to prevent the real source of the disk growth: the anonymous /app/node_modules volume from the dev override pattern. Every time their api container gets recreated — a rebuild after a dependency change, a `docker compose up --build`, even some plain restarts — a brand NEW anonymous volume is created, and `docker compose down` without -v leaves EVERY anonymous volume it ever created sitting on disk as an orphan, exactly as it leaves db-data. Since anonymous volumes have no stable name, none of them get reused or cleaned up automatically across rebuilds — they simply accumulate, one per recreation, indefinitely. The fix isn\'t to start using -v routinely (which would also delete db-data, the thing they\'re trying to protect) — it\'s a targeted `docker volume prune` run periodically (which only removes volumes not currently attached to any running container, so db-data stays safe as long as its container is up when prune runs), or naming the node_modules volume explicitly in compose.yml so it becomes a stable, reused resource like db-data instead of a fresh orphan every time.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Avoiding docker compose down -v (to protect a named volume like db-data) is enough to prevent ANY volume accumulation over repeated development cycles.',
      reality: 'Per this subtopic\'s theory, omitting -v protects named volumes from deletion, but does nothing to stop anonymous volumes (like the dev override\'s own /app/node_modules mount) from accumulating a brand new orphan on every single container recreation — a completely separate accumulation problem with no relationship to the -v flag\'s own behavior.'
    },
    {
      thought: 'An anonymous volume created for a container gets reused automatically the next time that same service\'s container is recreated, the same way a named volume like db-data does.',
      reality: 'Per this subtopic\'s theory, a named volume is reconnected across recreations specifically because it has a stable, addressable name — an anonymous volume has no name to reconnect BY, so Docker has no way to associate a new container\'s mount with any specific prior anonymous volume, and creates a fresh one every time instead.'
    },
    {
      thought: 'Orphaned anonymous volumes can be cleaned up individually and selectively, the same way the main page\'s own mistake entry shows for the named db-data volume (docker volume rm <name>).',
      reality: 'Per this subtopic\'s exercise, an anonymous volume\'s name is an auto-generated hash that carries no information about which service or mount it came from, so there is no equivalent of docker volume rm myproj_db-data for it — cleanup is only practical in bulk, via docker volume prune or docker compose down -v, both of which also affect other volumes indiscriminately.'
    }
  ];
}
