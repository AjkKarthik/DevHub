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
  templateUrl: './mkdir-exist-ok-still-raises-if-a-file-blocks-the-path.html',
  styleUrl: './mkdir-exist-ok-still-raises-if-a-file-blocks-the-path.scss'
})
export class MkdirExistOkStillRaisesIfAFileBlocksThePathSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'exist_ok=True only means "OK if a directory is already there" — not "OK no matter what\'s there"',
      points: [
        'The main page\'s own quick reference describes Path.mkdir(parents=True) with "exist_ok=True avoids FileExistsError" — a natural reading of that is exist_ok=True making the call succeed unconditionally whenever something already occupies the target path. That is not quite what it does.',
        'Python\'s own pathlib documentation is precise about the actual condition: "If exist_ok is true, FileExistsError will not be raised unless the given path already exists in the file system and is not a directory (same behavior as the POSIX mkdir -p command)." The suppression is conditional on what already exists there — specifically, that it\'s a directory.',
        'So if a regular FILE (not a directory) already exists at the exact path being created, mkdir(exist_ok=True) still raises FileExistsError — exist_ok only forgives "a directory is already there," not "literally anything is already there." This matches the well-known behavior of the POSIX mkdir -p shell command, which the Python docs explicitly reference as the model exist_ok follows.',
      ]
    },
    {
      heading: 'Why this distinction matters in practice',
      points: [
        'This becomes a real, confusing bug specifically when a path component is reused for two different purposes across a codebase\'s lifetime — for example, a script that once wrote a single output.txt file directly, later refactored to instead treat output as a directory containing multiple files. Any leftover output file from the old version silently breaks output.mkdir(exist_ok=True) in the new version, with an error message that can look identical to "the directory doesn\'t exist and couldn\'t be created" at first glance, obscuring the real cause (a stale FILE blocking the path).',
        'The main page\'s own file-analyser challenge and log-processing examples create directories for organizing output — code following that exact pattern (base.mkdir(parents=True, exist_ok=True)) will work reliably as long as nothing else in the same codebase (or a previous run) ever wrote a plain file at that exact path; verifying this assumption explicitly (or catching FileExistsError and checking .is_dir() on the offending path) is worth doing for any script whose output location isn\'t fully under its own control.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'exist_ok=True suppresses the error only for an existing DIRECTORY',
      language: 'typescript',
      code: `from pathlib import Path

base = Path("output")

# First run: creates the directory fine.
base.mkdir(parents=True, exist_ok=True)   # succeeds — no error

# Second run, directory already there: exist_ok=True correctly
# suppresses FileExistsError, since a DIRECTORY already occupies
# the path — this is the case exist_ok is actually designed for.
base.mkdir(parents=True, exist_ok=True)   # succeeds — no error, silently no-op

# Now simulate a stale FILE (not a directory) at that exact path —
# e.g. left over from an earlier version of the script.
base.rmdir()
base.write_text("leftover from an old script version")

base.mkdir(parents=True, exist_ok=True)
# FileExistsError: [Errno 17] File exists: 'output'
# exist_ok=True did NOT suppress this — because 'output' exists,
# but as a FILE, not a directory.`,
    },
    {
      label: 'Detecting the real cause when mkdir still fails',
      language: 'typescript',
      code: `from pathlib import Path

def ensure_output_dir(path_str: str) -> Path:
    path = Path(path_str)
    try:
        path.mkdir(parents=True, exist_ok=True)
    except FileExistsError:
        if path.is_file():
            raise RuntimeError(
                f"Cannot create directory '{path}' — a FILE already "
                f"exists at that exact path. Remove or rename it first."
            ) from None
        raise   # some other FileExistsError scenario — re-raise as-is
    return path

# Now the error message points directly at the real cause, instead
# of leaving the caller to guess why exist_ok=True "didn't work."
ensure_output_dir("output")`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A deployment script runs cache_dir.mkdir(parents=True, exist_ok=True) at startup on every deploy, and it has worked reliably for months. After a teammate\'s unrelated change accidentally writes a plain file named cache (not a directory) during an earlier build step, the next deploy fails with FileExistsError at the mkdir call — even though exist_ok=True is set. A teammate argues this must be a bug in pathlib, since "exist_ok=True is supposed to prevent exactly this error." Evaluate this claim using what this subtopic covers.',
    hint: 'What does exist_ok=True actually check for before suppressing FileExistsError — does it suppress the error for ANYTHING that might already be at that path, or specifically for the case where a directory is already there? What is now actually at the cache path, per the scenario described?',
    solution: 'This is not a bug in pathlib — exist_ok=True is working exactly as documented, and the actual root cause is the unrelated build-step change that left a plain FILE at the cache path instead of a directory. Per Python\'s own pathlib documentation, exist_ok=True only prevents FileExistsError "unless the given path already exists in the file system and is not a directory" — meaning it was only ever designed to forgive the specific case where a directory already occupies the target path (the normal, expected case for a repeatedly-run deploy script), not the case where something else (a file) occupies it instead. Since the earlier build step wrote a plain file named cache, the mkdir call\'s target path now exists but is NOT a directory, which is exactly the one case Python\'s own documentation states exist_ok=True does not suppress — matching the same behavior as the POSIX mkdir -p command it\'s explicitly modeled on. The teammate\'s assumption that exist_ok=True "prevents exactly this error" for any pre-existing thing at that path is the actual misunderstanding; the fix is addressing the real cause (the stray file left by the unrelated build-step change), for example by having the deploy script explicitly check cache_dir.is_file() and remove/rename it before calling mkdir, or fixing the earlier build step so it never writes a plain file at that path in the first place.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Path.mkdir(exist_ok=True) suppresses FileExistsError unconditionally whenever anything already exists at the target path, regardless of whether that existing thing is a directory or a regular file.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — per Python\'s own pathlib documentation, exist_ok=True only suppresses the error "unless the given path already exists... and is not a directory," meaning a pre-existing FILE at that exact path still raises FileExistsError even with exist_ok=True set.'
    },
    {
      thought: 'A FileExistsError raised from mkdir(exist_ok=True) must indicate that exist_ok itself was set incorrectly or is somehow not working, since the whole point of that parameter is to avoid this exact error.',
      reality: 'This subtopic\'s exercise shows the opposite — exist_ok=True is functioning exactly as documented; a FileExistsError still being raised despite exist_ok=True is a genuine, specific signal that a non-directory (a file) is blocking the target path, not an indication that the parameter is broken or misused.'
    },
    {
      thought: 'This behavior (exist_ok=True not covering the "a file blocks the path" case) is a pathlib-specific design quirk, unrelated to how directory creation works anywhere else.',
      reality: 'This subtopic\'s theory explains the opposite — Python\'s own documentation explicitly states this matches "the same behavior as the POSIX mkdir -p command," meaning this is a deliberate, cross-platform-consistent design choice mirroring long-established Unix shell behavior, not an arbitrary Python-specific limitation.'
    }
  ];
}
