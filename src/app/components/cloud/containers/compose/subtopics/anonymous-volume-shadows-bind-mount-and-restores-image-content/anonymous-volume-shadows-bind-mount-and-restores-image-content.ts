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
  templateUrl: './anonymous-volume-shadows-bind-mount-and-restores-image-content.html',
  styleUrl: './anonymous-volume-shadows-bind-mount-and-restores-image-content.scss'
})
export class AnonymousVolumeShadowsBindMountAndRestoresImageContentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own dev override tab explains WHAT the anonymous volume line does in five words, never HOW',
      points: [
        'The main page\'s own "Dev override pattern" code tab lists two volume lines for the `api` service: `- ./api:/app` (a bind mount for hot-reload) and `- /app/node_modules` with the comment "# anonymous vol: keep container node_modules." The comment states the OUTCOME but not the mechanism.',
        'On its own, this looks contradictory: the bind mount maps the ENTIRE host `./api` directory onto `/app` inside the container — and the host\'s `./api` directory almost certainly does NOT have its own `node_modules` (it\'s typically gitignored and never present on a fresh checkout). If the bind mount governs everything under `/app`, what is `node_modules` at `/app/node_modules` even showing?',
        'The answer is a genuine, distinct Docker mounting behavior — not something specific to Compose or to Node.js — that the main page never names or explains anywhere on the page.',
      ]
    },
    {
      heading: 'The two mechanisms that combine to make this work',
      points: [
        'First: when two volume mounts target overlapping paths, Docker resolves the conflict by specificity — the MORE SPECIFIC (deeper) path wins for everything under it. `/app/node_modules` is more specific than `/app`, so for that one subdirectory, the anonymous volume mount takes priority over the broader bind mount, regardless of which line appears first in the compose.yml.',
        'Second: when Docker mounts a NEW, empty volume (anonymous or named) onto a path that already has content in the image being started, it automatically copies that existing image content into the volume before the container starts using it. Since the runtime image was built with `RUN npm ci` (or similar) already executed, `/app/node_modules` already has real content baked into the image at that exact path — and that content is what populates the fresh anonymous volume.',
        'Combined: the bind mount replaces everything under `/app` with the host\'s (node_modules-less) source, EXCEPT `/app/node_modules` specifically, where the more-specific anonymous volume mount wins instead — and that volume was pre-populated with the image\'s own already-installed dependencies the moment the container started. The result: live-reloading source code from the host, while node_modules stays exactly as the image installed it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What each mount actually resolves to at /app and /app/node_modules',
      language: 'bash',
      code: `# The main page's own dev override, both volume lines:
services:
  api:
    volumes:
      - ./api:/app          # bind mount for hot-reload
      - /app/node_modules   # anonymous vol: keep container node_modules

# What's ACTUALLY visible inside the running container, path by path:
#
#   /app/src/*.ts       -> comes from the HOST's ./api/src (bind mount)
#                           edits on the host appear instantly -- this
#                           is the hot-reload behavior the comment
#                           names as the bind mount's own purpose.
#
#   /app/package.json    -> comes from the HOST's ./api/package.json
#                           (bind mount) -- also live-editable.
#
#   /app/node_modules/*  -> comes from the ANONYMOUS VOLUME, which
#                           Docker auto-populated with whatever was
#                           already at /app/node_modules INSIDE THE
#                           IMAGE at container-start time (i.e. the
#                           result of the image's own "RUN npm ci").
#                           The host's ./api/node_modules (probably
#                           absent, or a different platform's binary
#                           modules) is never consulted here at all.

# Confirm the specificity rule directly:
docker compose exec api ls node_modules | head -3
# Shows real, installed packages -- from the IMAGE, not the host.`,
    },
    {
      label: 'Why mount ORDER in the compose.yml doesn\'t matter, but path specificity does',
      language: 'bash',
      code: `# A common (wrong) assumption: reordering the two volume lines
# would change which one "wins." It would not -- Docker resolves
# overlapping mounts by PATH SPECIFICITY, not by the order they
# appear in the file:

services:
  api:
    volumes:
      - /app/node_modules   # anonymous vol -- order swapped, no effect
      - ./api:/app           # bind mount

# Both orderings produce the IDENTICAL result: /app/node_modules
# still resolves from the anonymous volume, because it is the more
# specific of the two paths, regardless of which line is listed first.

# What WOULD change the outcome: removing the anonymous volume line
# entirely and keeping only the bind mount:
services:
  api:
    volumes:
      - ./api:/app          # bind mount ONLY, no exclusion

# Now /app/node_modules resolves entirely from the HOST's own
# ./api/node_modules -- if that directory is empty or missing
# (the common case, since node_modules is gitignored), the running
# container would have NO installed dependencies at all, and the
# app would fail to start with "Cannot find module" errors, despite
# the image itself having installed everything correctly at build time.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer, trying to "simplify" the main page\'s own dev override pattern, removes the `- /app/node_modules` line, reasoning "the bind mount already covers /app, this second line looks redundant." They rebuild and start the dev override. Using this subtopic\'s theory, what happens to the running api container, and why does it happen even though the image itself was built correctly?',
    hint: 'Per this subtopic\'s theory, once the anonymous volume mount for /app/node_modules is removed, what does the bind mount at /app now govern for that specific subdirectory — and does the host\'s own ./api/node_modules directory typically exist?',
    solution: 'Per this subtopic\'s theory, removing the anonymous volume line does not simplify anything safely — it removes the one thing preventing the broader bind mount from governing /app/node_modules too. With only `./api:/app` in place, EVERY path under /app inside the container now resolves from the host\'s own ./api directory, including node_modules. Since node_modules is almost universally gitignored and therefore absent (or at best stale/wrong-platform) on the host, the running container now sees an empty or broken node_modules directory at runtime — even though the image itself was built correctly with a full `npm ci` already executed. The application fails to start with module-not-found errors, and the failure has nothing to do with the image build (which remains correct) — it is purely a consequence of the bind mount now being allowed to shadow the image\'s own installed dependencies with the host\'s missing ones. The fix is exactly reverting the "simplification" — re-adding the anonymous /app/node_modules volume restores the path-specificity exclusion that was protecting node_modules from the broader bind mount.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The anonymous /app/node_modules volume line in the main page\'s own dev override pattern is redundant, since the broader ./api:/app bind mount already covers everything under /app.',
      reality: 'Per this subtopic\'s theory, the anonymous volume line is what specifically EXCLUDES /app/node_modules from the broader bind mount — Docker resolves overlapping mounts by path specificity, so this more-specific mount intentionally overrides the bind mount for that one subdirectory, and removing it lets the bind mount take over there too.'
    },
    {
      thought: 'Since /app/node_modules is mounted as an anonymous volume, it starts out completely empty when the container first runs, and packages only appear there after an npm install runs inside the container.',
      reality: 'Per this subtopic\'s theory, Docker automatically populates a newly-created volume (anonymous or named) with whatever content already exists at that exact path in the image being started — since the image was built with npm ci already executed, the fresh anonymous volume is pre-populated with the image\'s own already-installed node_modules immediately, with no extra install step needed.'
    },
    {
      thought: 'Reordering the two volume lines in the compose.yml (listing the anonymous volume before or after the bind mount) changes which mount takes effect for /app/node_modules.',
      reality: 'Per this subtopic\'s exercise, Docker resolves overlapping mounts by PATH SPECIFICITY, not by the order the lines appear in the file — /app/node_modules resolves from the anonymous volume regardless of which volume line is listed first.'
    }
  ];
}
