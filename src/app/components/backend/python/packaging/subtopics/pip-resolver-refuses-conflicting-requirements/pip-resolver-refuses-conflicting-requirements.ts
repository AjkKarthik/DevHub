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
  templateUrl: './pip-resolver-refuses-conflicting-requirements.html',
  styleUrl: './pip-resolver-refuses-conflicting-requirements.scss'
})
export class PipResolverRefusesConflictingRequirementsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Modern pip refuses to install a broken combination — it used to just install one anyway',
      points: [
        'The main page\'s own theory covers requirements.txt and pip install extensively without mentioning that pip itself has a dependency RESOLVER with its own documented behavior and history. pip\'s own documentation marks a specific, dated change: "pip 20.3: pip defaults to the new resolver in Python 3 environments, but a user can opt-out and choose the old resolver behavior, using the flag --use-deprecated=legacy-resolver."',
        'The behavior difference is not cosmetic. pip\'s own docs state the new resolver\'s core guarantee directly: it "will no longer install a combination of packages that is mutually inconsistent." Before pip 20.3, pip could and would install a set of packages even when their declared requirements directly contradicted each other — silently producing an environment where installed packages didn\'t actually satisfy each other\'s stated dependencies.',
        'pip\'s own docs describe the new, stricter behavior explicitly: "if you ask pip to install two packages with incompatible requirements, it will refuse (rather than installing a broken combination, like it did in previous versions)." This is presented as a deliberate correctness fix — refusing loudly, with an error, in place of installing quietly and incorrectly.',
      ]
    },
    {
      heading: 'What the refusal actually looks like — and its one documented limitation',
      points: [
        'pip\'s own documentation shows the shape of the resulting error directly, with a worked example: "ERROR: Cannot install package_coffee==0.44.1 and package_tea==4.3.0 because these package versions have conflicting dependencies," followed by a specific explanation — "The conflict is caused by: package_coffee 0.44.1 depends on package_water<3.0.0,>=2.4.2 package_tea 4.3.0 depends on package_water==2.3.1." The resolver does not just fail silently or vaguely — it names the exact conflicting constraint chain.',
        'In more complex, multi-package dependency graphs where the resolver cannot find ANY combination of versions that satisfies every constraint simultaneously (not just a simple two-package clash), the failure mode is documented as a ResolutionImpossible-style error — the same underlying philosophy (refuse rather than silently break) applied to a harder search problem across the whole dependency graph, not just one pair of packages.',
        'One documented limitation worth knowing: pip\'s own docs note that "when you run a pip install command, pip only considers the packages you are installing in that command, and may break already-installed packages." The strict, backtracking conflict-detection only applies WITHIN a single install invocation\'s own resolution — it does not retroactively re-validate the ENTIRE existing environment against a new install, so a sequence of individually-successful pip install commands can still end up producing a broken environment overall, even though each individual command refused any conflict it could see at that moment.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A conflicting install fails loudly on modern pip, with the exact conflict named',
      language: 'typescript',
      code: `# Two packages with genuinely incompatible transitive requirements:
#   package-coffee 0.44.1  depends on  package-water>=2.4.2,<3.0.0
#   package-tea 4.3.0      depends on  package-water==2.3.1
# There is NO version of package-water that satisfies both.

pip install package-coffee==0.44.1 package-tea==4.3.0

# Modern pip (20.3+) output -- refuses outright, per pip's own
# documented behavior ("it will refuse rather than installing a
# broken combination, like it did in previous versions"):
#
# ERROR: Cannot install package-coffee==0.44.1 and package-tea==4.3.0
# because these package versions have conflicting dependencies.
#
# The conflict is caused by:
#     package-coffee 0.44.1 depends on package-water<3.0.0,>=2.4.2
#     package-tea 4.3.0 depends on package-water==2.3.1
#
# To fix this you could try to:
# 1. loosen the range of package versions you've specified
# 2. remove package versions to allow pip to attempt to solve
#    the dependency conflict
#
# ERROR: ResolutionImpossible
#
# NOTHING gets installed -- pip refuses the entire operation rather
# than picking one package's requirement over the other silently.`,
    },
    {
      label: 'The one documented gap: pip does not re-check the WHOLE existing environment',
      language: 'typescript',
      code: `# Step 1: install package-coffee first, alone. Succeeds cleanly --
# no conflict exists YET, since package-tea isn't installed at all.
pip install package-coffee==0.44.1
# Resolves package-water to something >=2.4.2,<3.0.0 -- fine.

# Step 2, LATER, in a SEPARATE pip install command: install
# package-tea. pip's resolver only considers what THIS command is
# installing -- per pip's own documented limitation, "pip only
# considers the packages you are installing in that command, and
# may break already-installed packages."
pip install package-tea==4.3.0
# This command's own resolution might succeed on its own terms
# (package-tea + whatever package-water version IT wants) --
# potentially silently downgrading/changing the already-installed
# package-water in a way that now breaks package-coffee, without
# pip re-validating package-coffee's own requirements at this step.

# THE LESSON: the strict, refuse-on-conflict guarantee is real and
# valuable, but it is SCOPED to a single install command's own
# resolution -- it is not an ongoing, whole-environment consistency
# guarantee across a sequence of separate installs over time. Running
# 'pip check' afterward (a separate, dedicated command) is the
# documented way to audit an existing environment for exactly this
# kind of drift, rather than assuming install-time refusal alone
# keeps the whole environment consistent indefinitely.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer on an older machine still running pip 19.x successfully runs pip install package-coffee==0.44.1 package-tea==4.3.0 in one command — no error, both packages report as installed. A teammate on a fresh machine with modern pip (23.x) runs the exact same command and gets a ResolutionImpossible error immediately. Explain why the two machines behave completely differently for the identical command, using what this subtopic covers.',
    hint: 'What changed about pip\'s DEFAULT dependency resolver at version 20.3, specifically regarding what it does when two packages have genuinely conflicting transitive requirements? Does the older pip actually resolve the conflict, or does it just not notice it?',
    solution: 'The two machines behave differently because pip 19.x predates the resolver change documented at pip 20.3, and per this subtopic\'s theory, the pre-20.3 "legacy resolver" could and would install a mutually inconsistent combination of packages without erroring — it simply didn\'t perform the same rigorous conflict-checking the modern resolver does. On the pip 19.x machine, the install "succeeding" does not mean the conflict was actually resolved or avoided — it almost certainly means pip installed SOME version of package-water that satisfies one of the two packages\' requirements (or possibly an intermediate, "last one wins" outcome) while silently leaving the OTHER package\'s stated requirement unsatisfied, producing exactly the kind of broken-but-installed environment pip\'s own docs describe the new resolver as specifically designed to prevent ("it will no longer install a combination of packages that is mutually inconsistent"). The teammate\'s modern pip 23.x, defaulting to the new resolver since 20.3, performs the stricter check this subtopic\'s theory covers, discovers the same genuine conflict the older pip silently glossed over, and correctly refuses with the documented ResolutionImpossible error rather than producing a similarly broken environment. The practical lesson: the pip 19.x install "working" is not evidence the two packages are actually compatible — it is evidence that pip 19.x didn\'t have the machinery to notice they weren\'t. Running pip check on the pip 19.x machine\'s existing environment would very likely reveal the exact same unsatisfied-dependency problem the modern resolver caught immediately at install time.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If pip install succeeds without printing any error, the resulting environment is guaranteed to have every package\'s declared dependency requirements genuinely satisfied — a clean exit code means a consistent environment.',
      reality: 'This subtopic\'s theory and exercise show this guarantee only became true starting with pip 20.3\'s new resolver — pip versions before that could and did report success while installing a "mutually inconsistent" combination of packages, per pip\'s own documented description of the pre-20.3 legacy resolver\'s weaker behavior.'
    },
    {
      thought: 'Since modern pip (20.3+) refuses to install conflicting package combinations within a single command, it is safe to assume a Python environment built through several SEPARATE pip install commands over time is fully internally consistent.',
      reality: 'This subtopic\'s theory and second code example show pip\'s own documentation explicitly limits this guarantee to a single install invocation\'s own resolution — "pip only considers the packages you are installing in that command, and may break already-installed packages" — so a sequence of individually-successful installs can still leave the overall environment broken, a gap the dedicated pip check command exists specifically to audit.'
    },
    {
      thought: 'A ResolutionImpossible error means there is a bug in pip itself, or that pip is being overly cautious about a combination that would actually work fine in practice.',
      reality: 'This subtopic\'s theory and first code example show this error is the resolver correctly and precisely identifying a genuine, real conflict — pip\'s own documented error output names the exact conflicting constraint chain (which package requires which incompatible version of a shared dependency), representing a real incompatibility in the declared requirements, not an overcautious false positive.'
    }
  ];
}
