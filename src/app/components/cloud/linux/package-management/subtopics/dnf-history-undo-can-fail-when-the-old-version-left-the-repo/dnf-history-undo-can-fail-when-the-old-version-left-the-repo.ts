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
  templateUrl: './dnf-history-undo-can-fail-when-the-old-version-left-the-repo.html',
  styleUrl: './dnf-history-undo-can-fail-when-the-old-version-left-the-repo.scss'
})
export class DnfHistoryUndoCanFailWhenTheOldVersionLeftTheRepoSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents dnf history undo as a reliable, unconditional rollback',
      points: [
        'The main page\'s own theory states: "dnf history undo N rolls back a specific transaction" — a flat, unqualified claim with no caveat about when it might not work. Its code tab shows exactly one example (<code>sudo dnf history undo 5</code>) with no discussion of failure modes at all.',
      ]
    },
    {
      heading: 'Why undo can genuinely fail: repositories only carry the LATEST version by default',
      points: [
        'Reverting an UPDATE transaction means dnf needs to reinstall the OLDER version of each affected package that was replaced. But package repositories/mirrors typically only host the latest version of each package — once a newer version is published, the older one is usually removed from the repo\'s metadata and file listing entirely.',
        'If the specific older version dnf needs to complete the undo is no longer present in ANY configured repository, the undo simply fails — dnf cannot install a package version it cannot find anywhere, regardless of how straightforward the rollback looks in the transaction history.',
      ]
    },
    {
      heading: 'The mitigation: keep downloaded RPMs around, or fetch the version manually',
      points: [
        'DNF\'s local package cache (<code>/var/cache/dnf/</code>) is cleaned up after a successful install by default — the exact RPM file that would be needed for an undo is usually already gone by the time anyone actually wants to roll back. Setting <code>keepcache=True</code> in <code>/etc/dnf/dnf.conf</code> keeps every downloaded RPM in the local cache indefinitely, meaning even a version the remote repo has since dropped remains available locally for a future undo.',
        'If the cache wasn\'t kept and the undo fails, <code>dnf list --showduplicates packagename</code> shows what versions are STILL available across configured repos — if the needed one genuinely isn\'t there, the fallback is locating and manually installing the specific RPM file directly (from a local mirror, an official archive, or a vendor\'s release page) rather than relying on <code>dnf history undo</code> to fetch it automatically.',
        'The general lesson beyond dnf specifically: any package-manager "undo" or "rollback" feature that works by reinstalling a prior version is only as reliable as that prior version\'s continued availability somewhere — the main page\'s flat "rolls back a specific transaction" claim is true only under that unstated assumption.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing a failed undo',
      language: 'bash',
      code: `# A routine update, following the main page's own pattern:
sudo dnf update -y nginx
# nginx upgraded: 1.20.1-1 -> 1.24.0-1

# Weeks later, the repo mirror has since dropped 1.20.1-1
# entirely (only the latest version is typically retained):
dnf list --showduplicates nginx
# nginx.x86_64  1.24.0-1  @System
# nginx.x86_64  1.25.2-1  updates      <-- 1.20.1-1 is nowhere
#                                          to be found anymore

# Attempting the exact rollback the main page's own example shows:
sudo dnf history undo 5
# Transaction ID :
#   ...
# Error: Problem: package nginx-1.20.1-1.x86_64 is not available
# -- the undo fails outright, not because anything is wrong with
#    dnf or the transaction history itself, but because the
#    specific version needed to complete the rollback simply no
#    longer exists in any configured repository.`,
    },
    {
      label: 'The mitigation: keep the local cache, or fetch manually',
      language: 'bash',
      code: `# Prevention -- keep every downloaded RPM locally indefinitely,
# so a future undo doesn't depend on the remote repo still having it:
sudo sed -i 's/^keepcache=.*/keepcache=True/' /etc/dnf/dnf.conf
# (add the line if it doesn't already exist)

# Cached RPMs then persist under:
ls /var/cache/dnf/*/packages/ | grep nginx
# nginx-1.20.1-1.x86_64.rpm    <-- still here, even after the
#                                   remote repo dropped it

# If the cache wasn't kept and undo already failed, check what's
# actually still available before giving up:
dnf list --showduplicates nginx

# Last resort: locate and install the specific RPM manually
# (from an archive mirror, vendor release page, or internal repo)
sudo dnf install ./nginx-1.20.1-1.x86_64.rpm
# This achieves the same practical outcome as the undo would have,
# just via a manually-sourced file instead of dnf's own automatic
# lookup, which failed because the version wasn't in any repo.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A production server was updated a month ago (`dnf update -y`), and a delayed investigation now shows that update introduced a regression. The team runs `dnf history undo N` for that transaction, following the main page\'s own recommended rollback pattern — and it fails with "package X-old-version is not available." The transaction history itself clearly shows the exact old version that needs to be reinstalled. Why does the undo fail despite the history being completely intact, and what would you check first to recover?',
    hint: 'The transaction HISTORY (dnf\'s own record of what happened) and the actual package FILES needed to reverse it are two different things — think about where dnf would need to fetch that specific old version FROM in order to actually reinstall it.',
    solution: 'The undo fails because dnf\'s transaction history (a record of WHAT happened) is completely separate from whether the actual RPM file needed to REVERSE that transaction is still available anywhere. Package repositories/mirrors typically only host the latest version of each package — a month after the original update, the older version the undo needs to reinstall has very likely already been removed from the remote repo\'s metadata and file listing, even though dnf\'s own history log still perfectly remembers that the update happened and what version it replaced. What to check first: `dnf list --showduplicates X` to confirm whether the needed old version is still available in any configured repository, and whether DNF\'s local cache (`/var/cache/dnf/`) happens to still hold the RPM from when it was originally downloaded (only if `keepcache=True` was set beforehand, which is not the default). If neither has the file, recovery requires manually sourcing that exact RPM version from an archive mirror, vendor release page, or internal package repository, and installing it directly with `dnf install ./package-old-version.rpm` rather than relying on `dnf history undo` to fetch it automatically.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '`dnf history undo N` is a reliable way to reverse any past transaction, as long as the transaction still appears in dnf history.',
      reality: 'Per this subtopic\'s theory, dnf\'s transaction HISTORY and the actual package FILES needed to complete an undo are separate things — the history can be completely intact while the specific older version needed to reverse it has since disappeared from every configured repository.'
    },
    {
      thought: 'Package repositories keep every previously-published version of a package available indefinitely, so an old version is always fetchable if needed.',
      reality: 'Per this subtopic\'s theory, repositories/mirrors typically only host the LATEST version of each package by default — once a newer version is published, the older one is usually removed from the repo entirely, which is exactly what causes dnf history undo to fail on older transactions.'
    },
    {
      thought: 'If dnf history undo fails, the transaction (or the system) must be in some kind of broken or corrupted state.',
      reality: 'Per this subtopic\'s theory, an undo failure with "package X is not available" is the NORMAL, expected outcome once the needed old version has left the repository — nothing about the system or the transaction history itself is broken; the fix is locating that specific version elsewhere (a kept local cache, an archive mirror, or a manually-installed RPM).'
    }
  ];
}
