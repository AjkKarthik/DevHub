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
  templateUrl: './userdel-without-r-leaves-orphaned-files-for-uid-reuse.html',
  styleUrl: './userdel-without-r-leaves-orphaned-files-for-uid-reuse.scss'
})
export class UserdelWithoutRLeavesOrphanedFilesForUidReuseSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the orphaning fact but never the reuse consequence',
      points: [
        'The main page\'s own theory states plainly: "userdel -r removes the user AND their home directory. Without -r, files remain orphaned (owned by deleted UID)." That\'s accurate as far as it goes — but "orphaned" reads as a purely cosmetic, inert state, like a dangling reference nobody will ever look at again.',
        'Nothing on the main page connects this orphaning fact to what happens the NEXT time useradd runs without an explicit --uid — which is exactly the default, ordinary way most new users get created, including in the main page\'s own examples (sudo useradd -m -s /bin/bash -c "Alice Smith" alice never specifies a UID at all).',
      ]
    },
    {
      heading: 'Confirmed: a numeric UID, once freed, is silently reused by the next ordinary useradd',
      points: [
        'Per direct analysis of userdel\'s own documented behavior: "files do not become \'unowned\'; they keep the user\'s numeric UID as their owner, now detached from any name." The filesystem itself only ever stores a number, never a username — ls -l resolves that number to a name by looking it up in /etc/passwd at display time, and once the account entry is gone, that lookup simply fails and ls shows the bare UID instead.',
        'The critical consequence, confirmed via the same analysis: "when you next create a user without specifying a UID, useradd allocates the lowest free value in the UID_MIN–UID_MAX range — which may be exactly the UID you just freed. The new user then silently inherits ownership of every orphaned file the old user left behind." No warning, no prompt, no distinguishing message — the new account\'s username is different, but the moment its UID happens to match the freed one, every file still tagged with that number becomes, from the filesystem\'s point of view, owned by the new person.',
        'This is not limited to files inside the deleted user\'s own home directory (which -r does clean up) — per the same analysis, "files owned outside the home directory are never touched... a real risk if that UID is later reused," including anything the old user left behind in /tmp, /var, /srv, or a shared web root, none of which userdel -r ever touches regardless of whether -r was used.',
      ]
    },
    {
      heading: 'Why this is worse than it sounds, and the actual mitigation',
      points: [
        'The main page\'s own example of finding orphaned files (find / -uid 1001 -exec ls -la {} \\; 2>/dev/null) is framed as a cleanup step run right after deletion — but the real risk window isn\'t immediately after deletion, it\'s whenever the NEXT unrelated useradd happens to land on that same freed number, which could be days, weeks, or months later, run by someone with no memory of (or knowledge of) the earlier deletion at all.',
        'The documented mitigation is running that exact find command — find / -uid OLD_UID — proactively at deletion time, before the UID has any chance to be reused, rather than treating it as optional forensic cleanup. Since userdel itself provides no built-in warning when reusing a UID would resurrect orphaned ownership, this check has to be a deliberate, separate step in the deprovisioning process.',
        'A more robust long-term mitigation many organizations adopt is avoiding UID reuse entirely — either by never letting useradd auto-assign UIDs for departed-then-replaced roles, or by tracking retired UIDs and explicitly excluding them from the auto-assignment range — since the alternative is a permanent, silent trust boundary violation risk baked into ordinary day-to-day user provisioning.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the silent inheritance',
      language: 'bash',
      code: `# An employee (alice, UID 1001) leaves. Following the main page's
# own theory ("Without -r, files remain orphaned"), IT runs a quick
# deletion without -r, planning to "clean up files later":
sudo userdel alice   # NO -r -- home dir and other files remain

# Alice had files outside her home directory too -- e.g. a shared
# report she generated, left in a shared location:
ls -l /srv/reports/
# -rw-r--r-- 1 1001 1001 ... /srv/reports/q3-financials.csv
#             ^^^^ the username lookup already fails -- ls shows the
#                  bare number, since /etc/passwd no longer has an
#                  entry for UID 1001 at all.

# Weeks later, an unrelated new hire is onboarded, using the EXACT
# same ordinary useradd pattern the main page's own examples show --
# no explicit --uid given, just the normal default flow:
sudo useradd -m -s /bin/bash -c "New Hire" newperson
id newperson
# uid=1001(newperson) gid=1001(newperson) groups=1001(newperson)
#     ^^^^ useradd allocated the LOWEST FREE UID in range -- which
#          happens to be exactly 1001, alice's old, freed number.

# Check that same shared file again:
ls -l /srv/reports/
# -rw-r--r-- 1 newperson newperson ... /srv/reports/q3-financials.csv
#             ^^^^^^^^^ newperson now OWNS this file -- silently,
#             with zero warning from either userdel or useradd, and
#             zero relationship between newperson and the file's
#             actual original content.`,
    },
    {
      label: 'The actual mitigation: check for orphans BEFORE the UID can be reused',
      language: 'bash',
      code: `# The main page's own find command is correct -- but the timing
# matters: run it as part of the DELETION process itself, not as
# optional later cleanup:

sudo userdel alice   # capture the UID BEFORE this, since userdel
                      # itself won't remind you of it afterward:
OLD_UID=1001

# Immediately audit for anything left behind system-wide, not just
# inside the (already handled if -r was used) home directory:
sudo find / -uid "$OLD_UID" 2>/dev/null

# Reassign or remove ownership of anything found BEFORE the UID
# has any chance to be handed to a future useradd call:
sudo find / -uid "$OLD_UID" -exec chown root:root {} \\; 2>/dev/null

# Longer-term mitigation: explicitly assign UIDs above the range
# useradd auto-allocates from for any account whose UID needs to be
# permanently retired rather than risked for reuse, or track
# retired UIDs so they're deliberately skipped by future
# provisioning -- useradd itself has no memory of a UID it once
# freed and will happily reallocate it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A departed contractor\'s account (bob, UID 1050) is removed with sudo userdel bob (no -r, since IT plans to review his home directory\'s contents before deleting them). Two months later, a new contractor is onboarded with the team\'s standard sudo useradd -m -s /bin/bash newcontractor — no UID specified, following the exact same pattern the main page\'s own examples use. A security review afterward finds that newcontractor appears to "own" several sensitive files bob created in a shared /data/exports directory months before newcontractor was ever hired. Is this a bug in useradd, and what should the original deprovisioning process have included?',
    hint: 'Check what happens to a numeric UID once its account is deleted, and what determines which UID an ordinary useradd call (with no --uid flag) assigns to a brand-new account.',
    solution: 'This is not a bug — it\'s the documented, expected consequence of UID reuse, and the deprovisioning process was missing a step. Deleting bob\'s account without -r left his files (including anything outside his home directory, like /data/exports) tagged with the bare numeric UID 1050, "detached from any name" the moment the account entry was removed. Two months later, an ordinary useradd -m -s /bin/bash newcontractor with no explicit UID allocated "the lowest free value in the UID_MIN–UID_MAX range" — which happened to be exactly 1050, since nothing had claimed it in the meantime. From that moment, every file still tagged with UID 1050 — including bob\'s old files in /data/exports, entirely unrelated to newcontractor — appeared to be owned by newcontractor, with no warning from either userdel or useradd at any point in the process. The original deprovisioning should have included an immediate find / -uid 1050 audit at deletion time (not deferred to "later"), to locate and reassign or remove ownership of every file tagged with that UID before it had any chance of being reallocated to an unrelated future account.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Deleting a user account without -r just leaves their home directory in place — the files remain associated with that person\'s identity indefinitely, harmlessly, until someone gets around to cleaning them up.',
      reality: 'Per this subtopic\'s theory, the files are tagged only with a bare numeric UID, not a name — the moment the account entry is deleted, that association with the original person is already gone, and the number becomes available for the next unrelated account to claim.'
    },
    {
      thought: 'userdel -r fully cleans up everything a deleted user owned, so the UID-reuse risk only applies when -r is skipped.',
      reality: 'Per this subtopic\'s theory, userdel -r only removes the home directory and mail spool — files a user created elsewhere on the system (in /tmp, /var, /srv, or a shared directory) are never touched by -r either, and remain just as exposed to future UID reuse.'
    },
    {
      thought: 'useradd would warn or refuse to reassign a UID that was previously used by a now-deleted account, to prevent exactly this kind of accidental file-ownership handoff.',
      reality: 'Per this subtopic\'s theory, useradd has no memory of a UID it once allocated and later freed — it simply assigns "the lowest free value in the UID_MIN–UID_MAX range" with no distinction between a UID that was never used and one that belonged to a deleted account.'
    }
  ];
}
