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
  templateUrl: './pip-freeze-editable-installs-output-local-path.html',
  styleUrl: './pip-freeze-editable-installs-output-local-path.scss'
})
export class PipFreezeEditableInstallsOutputLocalPathSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'pip freeze does not turn an editable install into a version pin — it stays a path',
      points: [
        'The main page\'s own mistake entry recommends pip freeze > requirements.txt as the standard way to capture a reproducible environment: "Generate requirements.txt: pip freeze > requirements.txt." That guidance is correct for ordinary, PyPI-installed packages — but the main page never covers what happens to the ONE package almost every project also has installed locally: itself, via pip install -e . (editable mode), which the main page\'s own theory recommends for development.',
        'pip\'s own requirements-file-format documentation confirms an editable, local-path reference is a first-class, recognized line form in a requirements file — listing "[-e] <local project path>" and "[-e] <vcs project url>" as valid structures alongside plain version pins. This is not a workaround or unofficial syntax; it is documented as one of the legitimate ways a requirements file can specify a dependency.',
        'pip freeze\'s own documented options confirm editable packages are included by default rather than silently skipped: the --exclude-editable flag ("Exclude editable package from output") only makes sense as an option to exist if editable-installed packages are otherwise present in freeze\'s normal output — meaning a project\'s own editable-installed package shows up in a generated requirements.txt as an -e line referencing wherever it was installed FROM, not as a plain name==version pin the way every other, normally-installed dependency does.',
      ]
    },
    {
      heading: 'Why this makes a straightforward pip freeze > requirements.txt non-portable',
      points: [
        'An -e line pointing at a local project path is meaningful only on the machine where that exact path exists. If a developer runs pip freeze > requirements.txt inside a project checked out at /Users/alice/projects/myapp, and the resulting file contains a line like -e /Users/alice/projects/myapp, that line is not just unhelpful on another machine — it can outright break the install there, since no such path exists on a CI server, a teammate\'s machine, or a Docker container being built from that requirements.txt.',
        'This risk exists specifically because of the exact workflow the main page itself recommends elsewhere: pip install -e . is presented as the standard way to develop a package locally ("changes to src/ take effect without reinstall"). Any project following that recommended editable-install workflow will, by construction, have exactly this kind of local-path entry show up the moment someone runs pip freeze inside that same environment.',
        'The practical fix mirrors a technique pip itself documents through the same --exclude-editable flag: generating the reproducible dependency list with pip freeze --exclude-editable > requirements.txt omits the local project\'s own editable entry entirely, leaving only the genuinely portable, PyPI-sourced dependencies pinned to exact versions — with the local project\'s own installation handled separately (documented, not frozen) via its own pyproject.toml or an explicit pip install -e . step in setup instructions, rather than being folded into the same generated file at all.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'pip freeze silently captures the local editable path, not a version',
      language: 'typescript',
      code: `# Inside a project directory, after the recommended development
# workflow the main page itself describes:
#   /Users/alice/projects/myapp/
#     src/mypackage/...
#     pyproject.toml

pip install -e .          # editable install, per the main page's
                            # own recommended development pattern
pip install fastapi==0.111.0
pip install pydantic==2.7.1

pip freeze > requirements.txt

# requirements.txt now contains something like:
#
#   fastapi==0.111.0
#   pydantic==2.7.1
#   -e git+... (if installed from a VCS URL) OR, far more commonly
#   for local development:
#   -e /Users/alice/projects/myapp
#
# The fastapi/pydantic lines are genuinely portable version pins.
# The '-e /Users/alice/projects/myapp' line is NOT -- it is a path
# that exists ONLY on Alice's own machine, per pip's own documented
# '[-e] <local project path>' requirement-line format.

# On a teammate's machine, or in CI, or inside a Docker build:
pip install -r requirements.txt
# FAILS on that one line -- no such directory exists there, even
# though every OTHER line in the same file installs correctly.`,
    },
    {
      label: 'The fix: --exclude-editable, and handling the local package separately',
      language: 'typescript',
      code: `# THE FIX: pip's own --exclude-editable flag, documented directly
# as "Exclude editable package from output" -- generates a
# requirements.txt containing ONLY the genuinely portable,
# version-pinned dependencies.

pip freeze --exclude-editable > requirements.txt

# requirements.txt now contains ONLY:
#   fastapi==0.111.0
#   pydantic==2.7.1
# -- no local path, no machine-specific line at all.

# The project's OWN package is handled through its own, separate,
# genuinely portable mechanism instead -- its pyproject.toml (which
# IS portable, since it describes the package declaratively, not
# via a hardcoded path) plus a documented setup step:
#
#   git clone <repo-url>
#   cd myapp
#   pip install -r requirements.txt   # third-party deps, pinned
#   pip install -e .                  # the project itself, editable
#
# This two-step pattern keeps the genuinely portable, pinned
# dependency list separate from the always-machine-specific,
# always-freshly-run editable install of the project itself --
# rather than trying to capture both in one frozen snapshot.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s CI pipeline runs pip install -r requirements.txt as its first step to set up the test environment, using a requirements.txt that a developer generated by running pip freeze > requirements.txt (no flags) on their own laptop. The pipeline fails immediately with a "No such file or directory" style error referencing a path that looks like it belongs to someone\'s personal machine. Explain what almost certainly happened, using what this subtopic covers, and describe the fix.',
    hint: 'What kind of line does a plain pip freeze (with no --exclude-editable flag) generate for a package that was installed via pip install -e . — a version pin, or something else? Would that something else make sense on a completely different machine, like a CI runner?',
    solution: 'The CI failure is almost certainly caused by an -e line in the developer\'s requirements.txt pointing at their own local project path — per this subtopic\'s theory, a plain pip freeze (with no flags) includes an editable-installed package as an -e <local project path> line rather than a normal version pin, exactly matching pip\'s own documented "[-e] <local project path>" requirement-line format. Since that developer almost certainly followed the standard, recommended development workflow of running pip install -e . inside their own project checkout before generating requirements.txt, freeze captured a line referencing wherever THEIR project happened to be checked out on THEIR own machine — a path that has no meaning at all on the CI runner\'s completely different filesystem, producing exactly the kind of "No such file or directory"-style failure described. The fix is for the developer to regenerate the file using pip freeze --exclude-editable > requirements.txt instead, which per pip\'s own documented flag ("Exclude editable package from output") omits that local-path line entirely, leaving only the genuinely portable, version-pinned third-party dependencies. The CI pipeline\'s own setup step then needs a small addition to still install the project\'s own code — typically pip install -e . run as its own separate step, using the project\'s own pyproject.toml (checked out fresh by CI itself, so the path is always correct in that context) rather than relying on a frozen path baked into requirements.txt from someone else\'s machine.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'pip freeze > requirements.txt always produces a fully portable list of version pins that will install identically on any machine, regardless of how the current environment\'s packages were originally installed.',
      reality: 'This subtopic\'s theory and first code example show this breaks down specifically for editable-installed packages — pip\'s own documented requirement-line formats include "[-e] <local project path>" as a recognized, non-version-pin line type, and a plain pip freeze includes exactly this kind of line for any package installed via pip install -e ., making the resulting file non-portable to any machine without that exact local path.'
    },
    {
      thought: 'Since the main page recommends pip install -e . as the standard development workflow, and separately recommends pip freeze > requirements.txt for reproducibility, these two recommended practices are meant to be used together in the most straightforward way — running freeze directly inside a dev environment that has the project installed editable.',
      reality: 'This subtopic\'s theory and second code example show these two practices actually conflict when combined naively — a plain pip freeze run inside an editable-install development environment captures a machine-specific local path for the project itself, which is exactly why pip documents a dedicated --exclude-editable flag: to let developers use both practices together correctly, by excluding the editable entry from the frozen, shareable file.'
    },
    {
      thought: 'The --exclude-editable flag on pip freeze is a rarely-needed, niche option only relevant to unusual workflows involving version-control-based editable installs (like -e git+https://...), not something a typical project using a simple local pip install -e . needs to think about.',
      reality: 'This subtopic\'s theory and exercise show --exclude-editable is directly relevant to the extremely common, main-page-recommended local development workflow — any project where a developer runs the standard pip install -e . and then generates requirements.txt with plain pip freeze will produce a non-portable file, making this flag broadly useful rather than a niche VCS-specific tool.'
    }
  ];
}
