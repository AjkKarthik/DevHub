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
  templateUrl: './shutil-copy-does-not-preserve-timestamps-copy2-does.html',
  styleUrl: './shutil-copy-does-not-preserve-timestamps-copy2-does.scss'
})
export class ShutilCopyDoesNotPreserveTimestampsCopy2DoesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'shutil.copy() gives the copy a fresh timestamp — only shutil.copy2() preserves the original\'s mtime/atime',
      points: [
        'The main page\'s own theory mentions shutil.copy(src, dst) as the go-to for copying "a file with metadata" — but Python\'s own shutil documentation is more precise about exactly WHICH metadata copy() actually preserves, and it is less than that phrasing suggests.',
        'Per Python\'s own docs, shutil.copy() "copies the file data and the file\'s permission mode" — that is the full extent of what it preserves. The same documentation states directly: "Other metadata, like the file\'s creation and modification times, is not preserved." The copied file gets a brand-new modification timestamp (the moment the copy operation ran), not the original file\'s timestamp.',
        'shutil.copy2() is the function that actually preserves timestamps — Python\'s docs describe it as "identical to copy() except that copy2() also attempts to preserve file metadata," specifically by calling shutil.copystat() afterward, which "copies the permission bits, last access time, last modification time, and flags" from source to destination.',
      ]
    },
    {
      heading: 'Why the distinction is easy to miss and where it actually matters',
      points: [
        'copy() and copy2() have nearly identical names, identical signatures, and produce byte-for-byte identical file CONTENT — the only difference is in metadata that\'s invisible unless you specifically check it (via os.stat() or a file manager\'s "Date Modified" column), which is exactly why reaching for the wrong one rarely produces an immediately visible bug.',
        'This matters concretely for anything that relies on file modification time as meaningful data — a backup/sync tool that decides which files are "newer" and need re-syncing, a build system that skips recompilation based on mtime comparisons, or an incremental data pipeline that processes only files modified since the last run. Using shutil.copy() in any of these contexts silently resets the very timestamp the downstream logic depends on, potentially causing files to be treated as "just modified" (triggering unnecessary re-processing) or, worse, masking a file\'s true original modification time entirely.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'copy() resets the timestamp; copy2() preserves it',
      language: 'typescript',
      code: `import shutil, os, time
from pathlib import Path

src = Path("original.txt")
src.write_text("hello")

# Simulate the source file having been last modified a while ago.
old_time = time.time() - 86400   # 24 hours ago
os.utime(src, (old_time, old_time))

# shutil.copy() — content + permission bits only
shutil.copy(src, "copy_via_copy.txt")
copy_mtime = os.stat("copy_via_copy.txt").st_mtime
print(copy_mtime == os.stat(src).st_mtime)   # False — fresh timestamp,
                                               # NOT the original's

# shutil.copy2() — content + permission bits + timestamps
shutil.copy2(src, "copy_via_copy2.txt")
copy2_mtime = os.stat("copy_via_copy2.txt").st_mtime
print(copy2_mtime == os.stat(src).st_mtime)   # True — mtime preserved`,
    },
    {
      label: 'A backup/sync script that depends on preserved mtimes',
      language: 'typescript',
      code: `import shutil
from pathlib import Path

def sync_files_wrong(src_dir: Path, dst_dir: Path):
    for src_file in src_dir.glob("*"):
        dst_file = dst_dir / src_file.name
        # WRONG for an incremental sync tool: every copy gets a
        # fresh timestamp, so a later comparison against dst_file's
        # mtime can never correctly reflect the SOURCE's real
        # modification history — every synced file looks "brand new."
        shutil.copy(src_file, dst_file)

def sync_files_right(src_dir: Path, dst_dir: Path):
    for src_file in src_dir.glob("*"):
        dst_file = dst_dir / src_file.name
        # RIGHT: copy2() preserves the source's real mtime, so a
        # future "only re-sync files modified since X" check against
        # dst_file's own timestamp reflects genuine source history.
        shutil.copy2(src_file, dst_file)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A data pipeline copies raw input files into a processing directory using shutil.copy(), then a downstream step only re-processes files whose modification time is newer than the last successful pipeline run, to avoid redundant work. The team notices every file gets fully re-processed on every single run, even when the underlying source data genuinely has not changed in days. Explain why, using what this subtopic covers, and describe the fix.',
    hint: 'Does shutil.copy() preserve the SOURCE file\'s original modification time on the copy it creates, or does the copy get a new timestamp reflecting when the copy operation itself ran? What would the downstream "only process files newer than X" logic see as a result?',
    solution: 'Every file gets fully re-processed on every run because shutil.copy() does not preserve the source file\'s modification time — per Python\'s own documentation, copy() "copies the file data and the file\'s permission mode," explicitly stating that "other metadata, like the file\'s creation and modification times, is not preserved." Each time the pipeline runs shutil.copy() to bring raw input files into the processing directory, every copied file gets a brand-new modification timestamp reflecting the moment THAT copy operation ran — not the original source data\'s real modification history. So from the downstream step\'s perspective, every single file in the processing directory always appears to have been "just modified" (as recently as the last pipeline run itself), which is always newer than the last successful pipeline run\'s timestamp, triggering full re-processing every time regardless of whether the actual source data changed at all. The fix is switching the copy step from shutil.copy() to shutil.copy2(), which per Python\'s own documentation additionally calls copystat() to preserve "the permission bits, last access time, last modification time, and flags" — with this change, copied files in the processing directory retain the SOURCE data\'s genuine modification timestamps, allowing the downstream "only process files newer than X" comparison to correctly identify which files have actually changed since the last run.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'shutil.copy(src, dst), being described as copying "a file with metadata," preserves everything meaningful about the original file — content, permissions, AND timestamps — making it the complete, general-purpose file-copying function for any use case.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — Python\'s own documentation states plainly that copy() preserves only file content and permission mode bits, explicitly noting that "other metadata, like the file\'s creation and modification times, is not preserved"; copy2() is the function that additionally preserves timestamps.'
    },
    {
      thought: 'Since shutil.copy() and shutil.copy2() produce files with identical content and identical permission bits, any code choosing between them is making a purely stylistic choice with no functional consequence.',
      reality: 'This subtopic\'s second code example and exercise both show this is a real, functional difference with concrete consequences — any downstream logic that depends on a file\'s modification timestamp (sync tools, build systems, incremental pipelines) behaves completely differently depending on which of the two functions was used to create the copy.'
    },
    {
      thought: 'A file-copying bug that causes every file to look "newly modified" after being copied must be caused by something wrong in the downstream comparison logic itself, since the copy operation is "just copying a file" and shouldn\'t affect timestamps.',
      reality: 'This subtopic\'s exercise shows the opposite — the root cause was entirely in the COPY step\'s own choice of function (shutil.copy() resetting timestamps by design), not in the downstream comparison logic, which was behaving correctly given the (incorrect) timestamps it was actually being handed.'
    }
  ];
}
