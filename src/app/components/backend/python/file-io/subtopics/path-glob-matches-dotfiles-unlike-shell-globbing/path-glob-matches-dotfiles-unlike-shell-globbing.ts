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
  templateUrl: './path-glob-matches-dotfiles-unlike-shell-globbing.html',
  styleUrl: './path-glob-matches-dotfiles-unlike-shell-globbing.scss'
})
export class PathGlobMatchesDotfilesUnlikeShellGlobbingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Path.glob("*") matches dotfiles by default — the opposite of shell globbing and the standalone glob module',
      points: [
        'The main page\'s own theory and challenge both use Path.rglob("*.py") to recursively find Python files, framed as directly analogous to shell wildcard patterns. Anyone with shell experience knows *.py in a Unix shell (or the standalone Python glob module) never matches a file starting with a dot — .hidden.py would be silently skipped. It is entirely reasonable to assume pathlib\'s Path.glob() follows the exact same convention. It does not.',
        'Python\'s own pathlib documentation states this explicitly, precisely because it is a deliberate divergence worth calling out: "Files beginning with a dot are not special in pathlib. This is like passing include_hidden=True to glob.glob()." So Path(".").glob("*") — or any pattern using a plain wildcard — DOES match dotfiles/dot-directories like .env, .git, .gitignore, right alongside every ordinary file, with no special-casing at all.',
        'This is the reverse of the standalone glob module\'s own default behavior (which DOES skip dot-prefixed names unless the pattern itself starts with a dot, matching shell convention) — meaning code migrating from glob.glob() to pathlib\'s Path.glob(), expecting identical filtering behavior, will find pathlib silently including files the old code silently excluded.',
      ]
    },
    {
      heading: 'Why this is easy to miss and where it actually causes problems',
      points: [
        'The main page\'s own log-analyser challenge uses Path(dir_path).rglob("*.log") to find log files — this specific case is safe from the dotfile issue only because log files are conventionally never dot-prefixed in the first place, not because the code explicitly guards against matching hidden files. A superficially similar recursive glob searching for ANY common extension used by dotfiles (.env, .gitignore-style config patterns, or dot-prefixed backup files some tools create) would silently sweep in files the developer never intended to touch.',
        'This has real consequences beyond noise: a script that globs for all files in a project directory to process, archive, or upload (Path(project_dir).rglob("*")) will include .git\'s entire internal structure, .env files containing secrets, and any other dotfile — none of which shell-based tooling or the standalone glob module would have included by default, making this a genuine, security-relevant difference to be aware of, not just a cosmetic one.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Path.glob() includes dotfiles; glob.glob() does not',
      language: 'typescript',
      code: `from pathlib import Path
import glob, os

# Set up a directory with both ordinary and hidden files.
os.makedirs("demo", exist_ok=True)
Path("demo/app.py").write_text("...")
Path("demo/.env").write_text("SECRET=abc123")
Path("demo/.hidden_config.py").write_text("...")

# The standalone glob module — matches shell convention,
# SKIPS dot-prefixed names with a plain wildcard.
print(sorted(glob.glob("demo/*")))
# ['demo/app.py']   — .env and .hidden_config.py are excluded

# pathlib's Path.glob() — matches dotfiles too, no special-casing.
print(sorted(str(p) for p in Path("demo").glob("*")))
# ['demo/.env', 'demo/.hidden_config.py', 'demo/app.py']
# — ALL THREE, including the dotfiles the glob module skipped`,
    },
    {
      label: 'Explicitly excluding dotfiles when using Path.glob()',
      language: 'typescript',
      code: `from pathlib import Path

def find_files_excluding_dotfiles(root: Path, pattern: str) -> list[Path]:
    # Path.glob()/.rglob() never filter dotfiles automatically —
    # filtering has to be done explicitly, unlike the glob module.
    return [
        p for p in root.rglob(pattern)
        if not any(part.startswith(".") for part in p.parts)
    ]

# Safe: won't sweep in .git internals, .env, or any dot-prefixed
# file/directory anywhere in the matched path.
safe_files = find_files_excluding_dotfiles(Path("."), "*")

# For a project-wide archive/upload script, this exclusion is not
# just tidiness — it prevents accidentally including secrets (.env)
# or unnecessary VCS internals (.git) that a shell-based equivalent
# command would have excluded by default.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A deployment script uses Path(project_dir).rglob("*") to collect every file in a project directory before uploading it to a build artifact bucket, on the assumption that this behaves like the shell command cp -r project_dir/* (which would never touch dot-prefixed files like .env or .git). After a security review, a .env file containing production database credentials is found inside a previously-uploaded artifact. Explain how this happened, using what this subtopic covers.',
    hint: 'Does Path.rglob("*") apply the same dotfile-skipping convention that Unix shell wildcards and cp project_dir/* do — or does pathlib intentionally behave differently here?',
    solution: 'The .env file ended up in the uploaded artifact because Path.rglob("*") does not skip dot-prefixed files the way shell wildcards (and cp project_dir/*) do — the assumption that pathlib mirrors shell globbing behavior here was the actual root cause. Python\'s own pathlib documentation states this explicitly and directly: "Files beginning with a dot are not special in pathlib. This is like passing include_hidden=True to glob.glob()." So Path(project_dir).rglob("*") matched every single file recursively, dotfiles included — .env, along with anything inside .git, were all swept into the collected file list right alongside ordinary source files, with no special-casing applied anywhere in that call. This is the precise opposite of what cp project_dir/* or a shell glob would have done, and precisely opposite of the standalone glob.glob() module\'s own default behavior too — the script\'s author reasonably assumed pathlib followed the more familiar shell/glob-module convention, when in fact pathlib deliberately does not. The fix is adding an explicit filter before uploading — either checking each matched path\'s parts for a leading dot (as shown in this subtopic\'s second code example) and excluding those, or maintaining an explicit denylist/allowlist of what should actually be included in a deployment artifact — since relying on Path.rglob("*") alone to "behave like shell globbing" is exactly the assumption that let this happen.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since pathlib\'s Path.glob() uses the exact same wildcard pattern syntax (*, **, ?) as Unix shell globbing and the standalone glob module, it must also follow the same convention of skipping files and directories whose name starts with a dot.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — Python\'s own pathlib documentation explicitly states dotfiles "are not special in pathlib," meaning Path.glob() matches them by default, the exact opposite of shell globbing and the standalone glob module\'s own default behavior.'
    },
    {
      thought: 'Migrating code from the standalone glob module (glob.glob()) to pathlib\'s Path.glob() is a safe, behavior-preserving refactor as long as the same pattern string is used, since both are described as working "like" shell-style wildcard matching.',
      reality: 'This subtopic\'s first code example shows a real behavioral difference this migration can introduce silently — the exact same pattern string ("*") returns DIFFERENT results between the two, since Path.glob() includes dotfiles the glob module would have excluded, with no error or warning to flag the change.'
    },
    {
      thought: 'Since dotfiles are conventionally used for "hidden," internal, or configuration purposes, any reasonable file-processing tool would naturally exclude them from a broad wildcard match without needing an explicit check, the same way a file manager\'s default view hides them.',
      reality: 'This subtopic\'s exercise shows the opposite — pathlib\'s Path.glob()/.rglob() apply NO such filtering automatically, so any script relying on a broad glob pattern to skip dotfiles "naturally" will silently include them (including sensitive files like .env) unless an explicit exclusion check is added.'
    }
  ];
}
