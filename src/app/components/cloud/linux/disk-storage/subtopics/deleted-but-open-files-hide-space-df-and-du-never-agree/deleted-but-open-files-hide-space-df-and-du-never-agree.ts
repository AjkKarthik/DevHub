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
  templateUrl: './deleted-but-open-files-hide-space-df-and-du-never-agree.html',
  styleUrl: './deleted-but-open-files-hide-space-df-and-du-never-agree.scss'
})
export class DeletedButOpenFilesHideSpaceDfAndDuNeverAgreeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page asks this exact question, but never answers it anywhere on the page',
      points: [
        'The main page\'s own interviewFocus list includes: "A server\'s disk is full but df -h shows free space — what do you check?" — posed as an important interview question, but no QnA entry, mistake, or theory point anywhere else on the page actually answers it. The closest related content ("check df -i for inode exhaustion") answers a DIFFERENT symptom (can\'t create new files despite free blocks), not this one (df -h itself already reports free space, yet something is behaving as if the disk is full).',
      ]
    },
    {
      heading: 'The actual answer: a deleted file whose space is still held by a running process',
      points: [
        'On Linux, deleting a file with <code>rm</code> only removes its directory entry — the underlying disk blocks are not actually freed while ANY process still has that file open (via an open file descriptor). A long-running process (a web server, a database, a log daemon) that opened a huge log file and never closed it keeps consuming that file\'s full disk space indefinitely, even after the file itself has been deleted and no longer appears in any directory listing.',
        'This directly explains the apparent contradiction: <code>df -h</code> reports the FILESYSTEM-LEVEL free-space counter, which only decreases when blocks are actually released back to the free pool — a deleted-but-still-open file\'s blocks are still allocated, so <code>df -h</code> correctly shows them as USED. Meanwhile <code>du</code>, which walks the actual directory tree, can never see the deleted file at all (it has no directory entry), so <code>du</code>\'s own totals will never add up to what <code>df</code> reports — this gap between <code>df</code> and <code>du</code> totals is itself the diagnostic signature of this exact scenario.',
      ]
    },
    {
      heading: 'Diagnosis and the fix',
      points: [
        'The diagnostic tool is <code>lsof</code> — specifically <code>lsof +L1</code>, which lists open files whose link count has dropped to 0 (meaning: deleted, but still open). A large SIZE value on one of those rows is exactly the gap between what <code>df</code> and <code>du</code> report.',
        'The clean, complete fix is restarting or gracefully reloading the specific process holding the file open — once it closes its file descriptor, the kernel actually releases the blocks, and <code>df -h</code>\'s free-space number immediately increases with no further action needed.',
        'If restarting the process isn\'t immediately possible, a common workaround for a LOG file specifically (rather than the underlying disk space) is truncating it in place without deleting it: <code>: > /var/log/huge.log</code> (or <code>truncate -s 0 /var/log/huge.log</code>) empties the file\'s CONTENT while the process keeps writing to the same still-existing file descriptor — this reclaims the space immediately without needing to restart anything, though it only works because the file still exists (it was truncated, not deleted).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the df/du mismatch',
      language: 'bash',
      code: `# A service has a large log file open, and it gets deleted directly
# (common mistake: "rm the log to free space" instead of truncating)
ls -lh /var/log/myapp.log
# -rw-r--r-- 1 root root 8.2G Jul 24 10:00 myapp.log

rm /var/log/myapp.log
# The file is gone from any directory listing:
ls /var/log/myapp.log
# ls: cannot access '/var/log/myapp.log': No such file or directory

# ...but df -h shows NO change at all -- the 8.2G is still "used":
df -h /var/log
# Filesystem  Size  Used  Avail  Use%  Mounted on
# /dev/sda1    50G   48G    2G   97%   /
# -- exactly as full as before the "successful" deletion

# du walking the directory tree can never see it (no directory
# entry exists), so du and df now visibly disagree:
du -sh /var/log
# 1.1G    /var/log      <-- 1.1G, nowhere near the 48G df reports
#                            for the whole filesystem -- the gap
#                            IS the deleted-but-open file`,
    },
    {
      label: 'Diagnosis with lsof, and the fix',
      language: 'bash',
      code: `# lsof +L1: list open files with a link count of 0 (deleted, still
# held open by a running process)
sudo lsof +L1
# COMMAND   PID  USER   FD   TYPE DEVICE SIZE/OFF NLINK  NODE NAME
# myapp    4821  root   3w   REG   8,1   8.2G      0    5501234 /var/log/myapp.log (deleted)
# -- SIZE 8.2G, NLINK 0 -- this row IS the missing 8.2G, still
#    fully allocated and counted by df, invisible to du and ls alike

# Fix #1 -- the clean fix, actually releases the space immediately:
sudo systemctl restart myapp
df -h /var/log
# Filesystem  Size  Used  Avail  Use%  Mounted on
# /dev/sda1    50G   40G   10G   80%   /     <-- 8.2G reclaimed

# Fix #2 -- if restarting isn't an option right now, and the goal
# is reclaiming space from a STILL-EXISTING log file (not this
# already-deleted one -- truncate BEFORE deleting next time):
: > /var/log/myapp.log          # or: truncate -s 0 /var/log/myapp.log
# The process keeps its existing file descriptor to the same
# (now-empty) file -- no restart needed, space reclaimed instantly.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An on-call engineer sees a disk-full alert for `/`. `df -h /` reports 97% used with only 2GB free — matching the alert. But `du -sh /*` summed across every top-level directory only adds up to about 30GB on a 50GB filesystem, nowhere close to the 48GB df reports as used. The engineer is confused about where the missing ~18GB is. What is the most likely explanation, and what single command would confirm it?',
    hint: 'df reads a filesystem-level counter of allocated blocks; du walks the actual directory tree. Think about what kind of file could be counted by one but completely invisible to the other.',
    solution: 'The most likely explanation is a deleted-but-still-open file — some process still holds an open file descriptor to a file that was already deleted (rm removed its directory entry, but the underlying disk blocks stay allocated as long as ANY process keeps it open). df -h reads the filesystem\'s own free-block counter, which correctly counts those still-allocated blocks as used; du walks the actual directory tree and can never see a file with no directory entry at all, so its total will always undercount by exactly the size of any deleted-but-open files — which is exactly the ~18GB gap here. The command to confirm it is `sudo lsof +L1`, which lists open files with a link count of 0 (deleted but still held open) — a large SIZE value on one of those rows identifies exactly which process and which file account for the missing space. The fix is restarting (or gracefully reloading) that specific process, which releases its file descriptor and immediately returns the blocks to the free pool.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Deleting a large file with rm immediately frees its disk space, visible right away in df -h.',
      reality: 'Per this subtopic\'s theory, rm only removes the file\'s directory entry — if ANY process still has that file open via a file descriptor, the underlying disk blocks stay fully allocated, and df -h continues reporting them as used until that process closes the file or is restarted.'
    },
    {
      thought: 'df and du should always report roughly the same total disk usage for a filesystem, since they\'re both measuring the same thing.',
      reality: 'Per this subtopic\'s theory, df reads a filesystem-level allocated-block counter while du walks the actual directory tree — a deleted-but-open file is counted by df (blocks still allocated) but completely invisible to du (no directory entry exists), producing exactly the kind of gap this scenario describes.'
    },
    {
      thought: 'If df -h shows a filesystem is nearly full, the fix must be finding and deleting more files somewhere on that filesystem.',
      reality: 'Per this subtopic\'s theory, if the space is already consumed by a deleted-but-open file, there is nothing left to find and delete — du has already stopped seeing it. The fix is identifying the process holding it open (via lsof +L1) and restarting or reloading that process specifically.'
    }
  ];
}
