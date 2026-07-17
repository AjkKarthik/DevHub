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
  templateUrl: './poetry-caret-special-case-for-0-x-versions.html',
  styleUrl: './poetry-caret-special-case-for-0-x-versions.scss'
})
export class PoetryCaretSpecialCaseFor0XVersionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The caret rule is not "major version stays fixed" — it is "the left-most non-zero digit stays fixed"',
      points: [
        'The main page\'s own theory states the caret rule with a single example: "^1.2.3 allows >=1.2.3, <2.0.0 (caret = compatible updates)." That description is correct for 1.2.3, but it describes the CONSEQUENCE for that specific version, not the actual underlying rule — and generalizing it as "the major version never changes" breaks down completely for pre-1.0 versions.',
        'Poetry\'s own documentation states the real rule precisely: "An update is allowed if the new version number does not modify the left-most non-zero digit in the major, minor, patch grouping." For 1.2.3, the left-most non-zero digit is the major version (1) — so the main page\'s example is a correct special case of this rule, not the rule itself.',
        'Poetry\'s own docs give a worked table showing what happens once the major version is 0: ^0.2.3 allows >=0.2.3, <0.3.0 — NOT <1.0.0. Since the major version is 0 (itself zero, so not the "left-most non-zero digit"), the rule skips over it and locks onto the minor version (2) instead, treating IT as the thing that must not change.',
      ]
    },
    {
      heading: 'A further, nested special case: when BOTH major and minor are zero',
      points: [
        'The pattern nests one level deeper still. Poetry\'s own documented table continues: ^0.0.3 allows >=0.0.3, <0.0.4 — an even tighter constraint than the ^0.2.3 case, because now both the major (0) and minor (0) are zero, so the left-most non-zero digit is the PATCH version (3) itself. The caret constraint essentially collapses to an exact-version pin in this case, since there is nothing left to vary.',
        'Poetry\'s own docs summarize the underlying philosophy directly: "0.0.x is not considered compatible with any other version" — reflecting the semantic versioning convention that a 0.0.x release carries no compatibility guarantees at all, so Poetry\'s caret constraint deliberately refuses to allow ANY drift for such a version, not even a patch bump.',
        'Two more documented edge points worth knowing precisely: ^0.0 (no patch component at all) allows >=0.0.0, <0.1.0 — treating the minor version as the fixed digit once no patch is specified — and ^0 (major only) allows >=0.0.0, <1.0.0, falling back to the "normal" major-version-fixed behavior since there is no more specific digit available to lock onto.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The same ^ syntax means something different depending on the leading digits',
      language: 'typescript',
      code: `# pyproject.toml — [tool.poetry.dependencies]

# Normal case: major version is non-zero (the LEFT-MOST non-zero
# digit is the major version itself) -- matches the main page's
# own documented example exactly.
requests = "^2.31.0"     # allows >=2.31.0, <3.0.0

# Pre-1.0 case: major version IS zero -- the left-most non-zero
# digit is now the MINOR version instead, so THAT is what stays
# fixed, not the (already-zero) major.
some-beta-lib = "^0.5.2"   # allows >=0.5.2, <0.6.0
                             # NOT <1.0.0 -- a common, wrong assumption
                             # if you only know the "major stays fixed"
                             # simplification.

# Nested case: BOTH major and minor are zero -- the left-most
# non-zero digit is now the PATCH version -- the constraint
# collapses to effectively pinning the exact version.
very-early-lib = "^0.0.3"   # allows >=0.0.3, <0.0.4 -- ONLY 0.0.3
                              # itself satisfies this, per Poetry's
                              # own documented "0.0.x is not
                              # considered compatible with any other
                              # version" philosophy.

# No-patch-specified case: falls back one level, treating minor
# as the fixed digit since there's no patch component at all.
another-lib = "^0.0"         # allows >=0.0.0, <0.1.0

# Major-only, zero: falls all the way back to normal caret shape,
# since there's no more specific non-zero digit available.
bleeding-edge = "^0"         # allows >=0.0.0, <1.0.0`,
    },
    {
      label: 'A real consequence: pinning a pre-1.0 dependency more precisely than intended',
      language: 'typescript',
      code: `# A team adds a pre-1.0 internal library, assuming the caret
# behaves the way it does for their other, post-1.0 dependencies:

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.111.0"    # <-- the team assumes this allows any
                          # 0.x.x release, the same "generous" way
                          # ^2.31.0 allows any 2.x.x release

# THE REALITY, per Poetry's own documented rule:
# ^0.111.0 -> the left-most non-zero digit is 111 (the MINOR
# version, since major is 0) -- this allows >=0.111.0, <0.112.0
# ONLY. It does NOT allow 0.112.0, 0.115.0, or any other later
# 0.x release the team may have assumed was covered.

# poetry update will silently refuse to pick up a newer 0.112.x
# release of fastapi, even though the constraint LOOKS as
# permissive as any other ^X.Y.Z entry in the same file -- the
# actual allowed range is far narrower than a post-1.0 caret
# constraint of the same visual "shape" would be.

# THE FIX, if broader 0.x updates are genuinely wanted:
fastapi = ">=0.111.0,<1.0.0"   # explicit range, not relying on
                                  # caret's zero-major special case`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A pyproject.toml lists internal-auth-lib = "^0.4.0" for a pre-1.0 internal library. The team publishes internal-auth-lib 0.4.9 (a bugfix), then later 0.5.0 (a new feature, still pre-1.0). A teammate expects poetry update to pick up whichever is newer whenever either is released, since "the caret allows compatible updates." Explain exactly which of these two releases poetry update will actually install, using what this subtopic covers.',
    hint: 'Per Poetry\'s own documented caret rule, is the major version (0) the "left-most non-zero digit" in ^0.4.0, or is it a different digit? Which specific digit does the caret constraint actually lock in place here?',
    solution: 'poetry update will install 0.4.9 but will NOT install 0.5.0, because ^0.4.0 locks onto the MINOR version (4), not the major version, per Poetry\'s own documented rule that an update is allowed only if it "does not modify the left-most non-zero digit" — and since the major version here is 0 (itself zero), the left-most non-zero digit is the minor version, 4. This means ^0.4.0 resolves to the documented range >=0.4.0, <0.5.0: 0.4.9 falls comfortably inside that range (only the patch component changed), so poetry update happily picks it up. But 0.5.0 falls OUTSIDE that range entirely — it changes the minor version from 4 to 5, exactly the digit the caret constraint is protecting — so Poetry will not select it automatically, no matter how long it has been available, until the pyproject.toml constraint itself is manually bumped to something like "^0.5.0" or a broader range. The teammate\'s intuition ("the caret allows compatible updates") is directionally correct but applies the WRONG definition of "compatible" here — for a post-1.0 dependency, compatible would indeed mean "any release with the same major version," but for this pre-1.0 dependency, Poetry\'s own documented semantics define "compatible" as "any release with the same minor version" instead, since the major version being 0 signals (per semver convention) that there are no compatibility guarantees across even minor version bumps.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Poetry\'s caret (^) constraint always means "the major version number stays fixed, everything else can increase" — that is the general rule the ^1.2.3 example on the main page demonstrates.',
      reality: 'This subtopic\'s theory and first code example show the actual documented rule is "the left-most NON-ZERO digit stays fixed" — for a normal version like 1.2.3 this happens to be the major version, but for any version whose major component is 0, the rule locks onto the minor version instead (or the patch version, if both major and minor are 0), producing a much narrower allowed range than the "major stays fixed" simplification would suggest.'
    },
    {
      thought: '^0.5.2 and ^2.31.0 are the "same kind" of caret constraint, just with different starting version numbers — both should allow updates within their respective major version, treating 0.x and 2.x symmetrically.',
      reality: 'This subtopic\'s theory and second code example show these are genuinely asymmetric per Poetry\'s own documented table — ^2.31.0 allows the entire 2.x.x range (>=2.31.0, <3.0.0), while ^0.5.2 allows only the narrower 0.5.x range (>=0.5.2, <0.6.0), because the zero major version shifts which digit the caret actually protects.'
    },
    {
      thought: 'A dependency constraint like ^0.0.3 is unusually permissive since it starts so low in version numbers, likely allowing a wide range of early releases.',
      reality: 'This subtopic\'s theory shows the opposite is true — Poetry\'s own documented table shows ^0.0.3 is the MOST restrictive form of the caret constraint, allowing only >=0.0.3, <0.0.4 (effectively pinning that exact version), reflecting Poetry\'s stated philosophy that "0.0.x is not considered compatible with any other version" at all.'
    }
  ];
}
