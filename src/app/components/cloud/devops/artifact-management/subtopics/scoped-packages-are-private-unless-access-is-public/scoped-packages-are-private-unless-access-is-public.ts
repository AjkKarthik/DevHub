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
  templateUrl: './scoped-packages-are-private-unless-access-is-public.html',
  styleUrl: './scoped-packages-are-private-unless-access-is-public.scss'
})
export class ScopedPackagesArePrivateUnlessAccessIsPublicSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own package.json sets access: "public" without ever saying what happens if you don\'t',
      points: [
        'The main page\'s own "npm Package Publishing" code tab shows a `package.json` for `@myorg/my-library` with `publishConfig: { access: "public", registry: "..." }`. The line is presented as routine configuration, alongside `main`, `types`, and `files` — nothing marks it as more consequential than those, or explains what happens if it were simply left out.',
        'npm\'s own documentation is direct about the default: scoped packages (anything named `@scope/name`, exactly the shape the main page\'s own `@myorg/my-library` uses) are published as PRIVATE by default. Publishing publicly requires an explicit opt-in — either `npm publish --access public` on the command line, or the `publishConfig.access: "public"` field the main page\'s own package.json already includes.',
      ]
    },
    {
      heading: 'Why omitting it is a real failure mode, not just a missed optimization',
      points: [
        'npm\'s own docs describe the consequence directly: "If you have an organization that does not have the Private Packages feature, npm publish will fail unless you pass the access flag." For an org on npm\'s free tier (no paid private-packages plan), the FIRST publish of a new scoped package without `access: public` set anywhere doesn\'t just default to private — the publish command errors out entirely.',
        'This is a one-time gotcha specifically at the FIRST publish of a given scoped package name — per npm\'s own docs, setting `access: public` "will publish the package and set access to public as if you had run npm access public after publishing," meaning the access level is a per-package setting established at creation. A team publishing their very first `@org/name` package and hitting this failure has to add the flag/field and republish; a team publishing their TENTH scoped package under the same org, having already set this correctly on their very first one, may never encounter the failure at all and reasonably assume it\'s unnecessary boilerplate.',
        'The main page\'s own `publishConfig.access: "public"` field is the more durable of the two ways to opt in — it\'s committed to `package.json` once and applies to every future `npm publish` for that package automatically, versus needing `--access public` remembered as a command-line flag on every single publish (including the semantic-release-automated ones the same code tab shows a few lines later, which never pass this flag explicitly at all).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What happens on a free-tier org without access: public set anywhere',
      language: 'bash',
      code: `# package.json -- WITHOUT the main page's own publishConfig block:
# {
#   "name": "@myorg/my-library",
#   "version": "2.1.0"
#   # no publishConfig.access at all
# }

npm publish
# npm error 402 Payment Required - PUT https://registry.npmjs.org/@myorg%2fmy-library
# npm error You must sign up for private packages
#
# Per npm's own docs: scoped packages are private by default, and
# "If you have an organization that does not have the Private
# Packages feature, npm publish will fail unless you pass the
# access flag." This isn't a warning -- the publish is REJECTED.`,
    },
    {
      label: 'The main page\'s own fix, and the two equivalent ways to apply it',
      language: 'bash',
      code: `# Option 1 -- exactly what the main page's own package.json does,
# committed once, applies to every future publish automatically:
# {
#   "name": "@myorg/my-library",
#   "publishConfig": {
#     "access": "public",
#     "registry": "https://npm.pkg.github.com"
#   }
# }
npm publish
# Succeeds -- per npm's own docs, this "will publish the package
# and set access to public as if you had run npm access public
# after publishing."

# Option 2 -- the equivalent one-off command-line flag, has to be
# remembered on EVERY publish if not also set in package.json:
npm publish --access public

# The main page's own semantic-release step, a few lines later in
# the same code tab, never passes --access public explicitly:
npx semantic-release
# This only works WITHOUT the flag because publishConfig.access
# is already committed in package.json -- semantic-release's own
# underlying npm publish call inherits it automatically. Without
# the package.json field, semantic-release's automated publish
# would fail the exact same way the manual one does.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team creates a brand-new scoped package, `@myorg/new-utils`, copying most of the main page\'s own package.json shape but forgetting the `publishConfig` block entirely. Their CI pipeline runs `npx semantic-release` (matching the main page\'s own automated flow) and the publish step fails with a 402 error, even though this exact pipeline has successfully published `@myorg/my-library` many times before. Using this subtopic\'s theory, explain why the SAME pipeline behaves differently for the two packages.',
    hint: 'Per this subtopic\'s theory, is the public/private access setting a property of the ORG, the PIPELINE, or something scoped to each individual package name?',
    solution: 'The pipeline behaves differently because, per this subtopic\'s theory, the public/private access setting is established per PACKAGE, not per org or per pipeline — `@myorg/my-library` already has `publishConfig.access: "public"` committed in its own package.json (or had `--access public` used on its first-ever publish), so every subsequent publish, including automated ones via semantic-release, inherits that already-established public access. `@myorg/new-utils` is a brand-new scoped package name with no publishConfig.access set anywhere — per npm\'s own docs, scoped packages default to private, and on an org without the paid private-packages feature, "npm publish will fail unless you pass the access flag." The identical CI pipeline and identical `npx semantic-release` command produce different outcomes purely because the two package.json files differ in this one field — the fix is adding the same `publishConfig: { access: "public" }` block to `@myorg/new-utils`\'s own package.json, exactly matching what `@myorg/my-library` already has.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The `publishConfig.access: "public"` field in the main page\'s own package.json is routine boilerplate, similar in importance to fields like `main` or `types` — worth including for tidiness but not load-bearing.',
      reality: 'Per this subtopic\'s theory, npm\'s own docs describe a real, order-of-magnitude-different consequence for omitting it — on an org without paid private packages, the very first `npm publish` for a new scoped package fails outright with a 402 error, not a warning or a silent default.'
    },
    {
      thought: 'Since a team\'s existing scoped packages publish successfully without ever thinking about access settings, a brand-new scoped package under the same org will behave the same way.',
      reality: 'This subtopic\'s exercise shows the setting is established PER PACKAGE at its first publish, not inherited from the org or from other packages\' history — a team\'s prior packages working fine says nothing about whether a brand-new package name has ever had its own access level configured.'
    },
    {
      thought: 'Passing `--access public` on the command line and setting `publishConfig.access: "public"` in package.json are just two equally-convenient ways to do the same thing, with no practical difference.',
      reality: 'Per this subtopic\'s theory, they differ in durability — the package.json field applies automatically to every future publish, including ones an automated tool like semantic-release triggers without ever passing the flag itself, while the command-line flag has to be remembered and re-supplied on every single manual publish invocation.'
    }
  ];
}
