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
  templateUrl: './npm-ci-deletes-node-modules-before-installing.html',
  styleUrl: './npm-ci-deletes-node-modules-before-installing.scss'
})
export class NpmCiDeletesNodeModulesBeforeInstallingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'npm ci does not just install deterministically — it deletes any existing node_modules first',
      points: [
        'The main page\'s own theory covers npm ci\'s deterministic-install guarantee (installing exactly what package-lock.json specifies, failing on a lockfile mismatch) but doesn\'t mention a separate, easy-to-miss behavior: npm\'s own documentation states plainly that "if a node_modules is already present, it will be automatically removed before npm ci begins its install." This is one of npm ci\'s explicitly documented differences from npm install, which does not do this — npm install reuses and incrementally updates an existing node_modules rather than wiping it first.',
        'This distinction matters most for any Docker build strategy that tries to cache or reuse node_modules across builds — for example, a BuildKit cache mount (RUN --mount=type=cache,target=/app/node_modules npm ci) intended to speed up repeated builds by persisting node_modules between them. Since npm ci unconditionally deletes whatever it finds in node_modules before installing, a cache mount used this way provides no actual benefit for npm ci specifically — the deletion happens regardless, defeating the purpose of trying to reuse the directory\'s contents across builds.',
      ]
    },
    {
      heading: 'What actually benefits from Docker layer caching with npm ci',
      points: [
        'The main page\'s own Dockerfile already uses the correct caching strategy without spelling out why it works: COPY package.json package-lock.json ./ happens BEFORE COPY src/ ./src/, so Docker\'s own layer cache — not a node_modules cache mount — is what actually provides the speedup. As long as package.json/package-lock.json haven\'t changed since the last build, Docker reuses the cached RUN npm ci layer entirely, skipping the install step altogether rather than trying to reuse a partially-populated node_modules.',
        'A cache mount CAN still help npm ci indirectly — not by preserving node_modules itself, but by pointing at npm\'s own download/tarball cache directory (npm config get cache, typically /root/.npm) rather than node_modules. That still lets repeated npm ci runs skip re-downloading package tarballs from the registry over the network, even though the node_modules directory itself always starts fresh.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A node_modules cache mount gives npm ci no benefit',
      language: 'typescript',
      code: `# This looks like it should speed up repeated builds by
# preserving node_modules across them — it does NOT, for npm ci.
RUN --mount=type=cache,target=/app/node_modules \\
    npm ci --only=production

# npm's own documentation: "If a node_modules is already present,
# it will be automatically removed before npm ci begins its install."
# The cache mount's node_modules contents are wiped before every
# single npm ci run, regardless of whether package-lock.json changed
# at all — the cache mount accomplishes nothing here.`,
    },
    {
      label: 'What actually helps: Docker layer caching + npm\'s OWN download cache',
      language: 'typescript',
      code: `# 1. Docker layer caching (already correct on the main page's own
#    Dockerfile) — copying the lockfile BEFORE source code means this
#    ENTIRE layer, including the npm ci run, is skipped by Docker
#    whenever package-lock.json is unchanged since the last build.
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 2. If the lockfile DOES change and npm ci must actually run, caching
# npm's OWN tarball/download cache (not node_modules) still avoids
# re-downloading every package from the registry over the network:
RUN --mount=type=cache,target=/root/.npm \\
    npm ci --only=production
# node_modules is still wiped and rebuilt fresh every time — but the
# package tarballs themselves are served from the mounted cache
# instead of being re-fetched from the npm registry each build.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team notices their Docker builds are slow whenever package-lock.json changes, and adds a BuildKit cache mount targeting /app/node_modules around their npm ci step, expecting subsequent builds to reuse the previously-installed packages and only install the new/changed ones. Build times do not improve at all. Explain why, using what this subtopic covers, and suggest what to cache instead.',
    hint: 'What does npm\'s own documentation say happens to an existing node_modules directory the moment npm ci starts running, regardless of what was in it beforehand?',
    solution: 'The cache mount provides no improvement because npm ci unconditionally deletes any existing node_modules directory before it begins installing — per npm\'s own documentation, this happens automatically every single time npm ci runs, completely independent of whether the previous contents were still valid or reusable. So no matter what the BuildKit cache mount preserves in /app/node_modules between builds, npm ci wipes it immediately on the next run before doing anything else — the mount\'s contents are thrown away before they could ever provide a speedup. The genuine fix is caching something npm ci actually reuses: mounting a cache at npm\'s own download/tarball cache directory (typically /root/.npm) instead of node_modules — that cache holds the downloaded package tarballs themselves, and npm ci will reuse them from local disk instead of re-fetching from the registry over the network, even though it still rebuilds node_modules from scratch every time. Combined with the main page\'s own Docker layer-caching pattern (copying package.json/package-lock.json before the rest of the source, so the whole npm ci layer is skipped entirely by Docker when the lockfile hasn\'t changed), this is the actual mechanism that makes repeated builds fast — not a node_modules cache mount, which npm ci\'s own delete-first behavior makes pointless.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'npm ci and npm install both work the same way with respect to an existing node_modules directory — both reuse whatever packages are already installed and only add/update what changed, just with npm ci additionally enforcing that the lockfile is respected exactly.',
      reality: 'This subtopic\'s theory shows a genuine, documented difference beyond the lockfile-strictness the main page already covers — npm ci automatically deletes any existing node_modules directory entirely before installing, while npm install does not do this at all, reusing and incrementally updating whatever is already present.'
    },
    {
      thought: 'A Docker BuildKit cache mount targeting node_modules is a reasonable, effective way to speed up any npm-based Docker build, since it preserves installed packages across separate build runs the same way it would for any other cacheable directory.',
      reality: 'This subtopic\'s first code example and exercise both show this is ineffective specifically for npm ci — since npm ci deletes node_modules before installing regardless of the mount\'s prior contents, the cache mount is thrown away before it could ever help; the effective cache target is npm\'s own download/tarball cache directory instead.'
    },
    {
      thought: 'The main page\'s own Dockerfile speeds up repeated builds mainly because Docker somehow caches the contents of node_modules across builds automatically.',
      reality: 'This subtopic\'s second code example explains the real mechanism — the speedup comes from Docker\'s own LAYER caching (copying package.json/package-lock.json before the source code, so the entire npm ci layer is skipped when the lockfile is unchanged), not from any caching of node_modules\' actual contents, which npm ci always rebuilds from scratch regardless.'
    }
  ];
}
