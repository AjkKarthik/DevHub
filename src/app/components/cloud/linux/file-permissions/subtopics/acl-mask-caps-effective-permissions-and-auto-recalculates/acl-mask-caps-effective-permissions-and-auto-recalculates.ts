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
  templateUrl: './acl-mask-caps-effective-permissions-and-auto-recalculates.html',
  styleUrl: './acl-mask-caps-effective-permissions-and-auto-recalculates.scss'
})
export class AclMaskCapsEffectivePermissionsAndAutoRecalculatesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions the mask in a single clause, with no explanation of what it does',
      points: [
        'The main page\'s own ACL theory lists it almost in passing: "getfacl file shows the ACL. setfacl -m u:alice:rw file adds Alice with read-write. setfacl -m m:r- sets the effective mask." Three different setfacl operations, given equal one-clause weight — but the mask entry works completely differently from adding a user or group entry, and the main page never says how.',
        'This leaves a reader with a plausible but wrong mental model: that setfacl -m m:r- is just another named-entry-style permission grant, similar to setfacl -m u:alice:rw, rather than something that can silently OVERRIDE what alice\'s own entry appears to grant.',
      ]
    },
    {
      heading: 'Confirmed: the mask caps named users/groups and the owning group — never the file owner or "other"',
      points: [
        'Per standard POSIX ACL documentation: "the mask is the effective rights mask entry that limits the effective rights granted to all groups and to named users. The file owner and others permissions are not affected by the effective rights mask; all other entries are." This is a genuinely asymmetric rule — exactly two of the ACL\'s participant categories (the traditional owner triplet\'s owner and other) are IMMUNE to the mask, while everything else (named users, named groups, and even the traditional owning-group entry) is capped by it.',
        'The practical effect: setfacl -m u:alice:rw myfile granting alice rw does not mean alice actually GETS rw — her EFFECTIVE permission is the intersection of her own entry and the mask. If the mask is only r--, alice\'s effective permission on that file is read-only, regardless of what her own named-user entry says, and getfacl will show BOTH numbers side by side (her entry, and the effective result after the mask is applied) once a mask conflicts with an entry.',
        'This is precisely why the main page\'s own three-clause list treats setfacl -m m:r- as just another peer operation when it is structurally different — it is not granting a permission to a participant, it is capping what every OTHER named entry\'s permission can actually achieve.',
      ]
    },
    {
      heading: 'The second, more operationally dangerous surprise: the mask recalculates itself automatically',
      points: [
        'Confirmed via the same POSIX ACL documentation: "unless otherwise specified, the mask permissions are recalculated on subsequent setfacl calls," and when that recalculation happens, "the mask entry is set to the union of all permissions of the owning group, and all named user and group entries." A mask that was deliberately set narrow (e.g. r-- to keep every named entry\'s effective permission capped at read-only) can be silently WIDENED again the next time an unrelated setfacl call adds or modifies a completely different entry on the same file.',
        'The documented way to prevent this automatic widening is the -n flag: "to prevent automatic recalculation, you can use -n alongside setfacl to restrict the ACL you\'re adding to the maximum permissions allowed by the mask." Without -n, every setfacl call on a file is implicitly also a mask-recalculation event, not just a change to the specific entry named in that command.',
        'The combination of these two facts means a deliberately restrictive mask set today can be undone by ANY future setfacl call from a completely different, unrelated administrative action — not just a call that explicitly touches the mask entry itself — unless every subsequent setfacl invocation on that file consistently uses -n.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A mask silently overriding a granted permission',
      language: 'bash',
      code: `# Main page's own example, granting alice read-write:
setfacl -m u:alice:rw myfile

# Now deliberately restrict the mask to read-only, per the main
# page's own "setfacl -m m:r- sets the effective mask" mention:
setfacl -m m:r-- myfile

getfacl myfile
# user::rw-
# user:alice:rw-      #effective:r--   <-- alice's ENTRY still says
#                                            rw-, but her EFFECTIVE
#                                            permission is r--
# group::r--
# mask::r--
# other::r--

# Per POSIX ACL documentation: "the mask is the effective rights
# mask entry that limits the effective rights granted to all groups
# and to named users. The file owner and others permissions are not
# affected by the effective rights mask."
#
# Alice's own ACL entry was never changed or removed -- it still
# reads "rw-" -- but her ACTUAL access is capped to read-only by
# the mask, and getfacl's own output flags this explicitly with the
# "#effective:r--" annotation whenever a mask conflicts with an
# entry.`,
    },
    {
      label: 'The mask silently widening again on an unrelated setfacl call',
      language: 'bash',
      code: `# Starting state from the previous example: mask is deliberately
# r-- (alice's effective rw entry is capped to read-only).
getfacl myfile | grep mask
# mask::r--

# A completely unrelated administrative action -- adding a
# DIFFERENT user's ACL entry, with no intention of touching the
# mask at all:
setfacl -m u:bob:rwx myfile

# Check the mask again:
getfacl myfile | grep mask
# mask::rwx    <-- silently widened! Per POSIX ACL documentation:
#                  "unless otherwise specified, the mask permissions
#                  are recalculated on subsequent setfacl calls...
#                  set to the union of all permissions of the
#                  owning group, and all named user and group
#                  entries."

# Alice's ORIGINAL rw entry, previously capped to r-- effective, is
# now ALSO effectively rw- again -- an unrelated change to bob's
# access silently restored alice's full permission too.

# The fix: use -n on EVERY setfacl call touching this file, to
# prevent the automatic mask recalculation:
setfacl -n -m u:bob:rwx myfile
# Per POSIX ACL documentation: "-n... restrict the ACL you're
# adding to the maximum permissions allowed by the mask" instead of
# recalculating the mask to fit the new entry.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security team deliberately caps a shared file\'s ACL mask at r-- so that every named user or group entry on it — regardless of what each individual entry says — can only ever read the file, never write. Weeks later, during an unrelated onboarding task, an administrator runs setfacl -m u:newhire:rwx sharedfile to grant a new team member access, intending only read-write-execute for that one specific person. A security audit afterward finds that SEVERAL other users\' ACL entries, untouched by the onboarding command, now also have full effective read-write-execute access, not the read-only the team originally intended. What happened, and how should the onboarding command have been run instead?',
    hint: 'Check what happens to an ACL\'s mask entry, by default, on any subsequent setfacl call that adds or modifies a different entry — is the mask left alone, or automatically recalculated?',
    solution: 'The onboarding command\'s own setfacl call silently widened the mask for everyone, not just the new hire. Per POSIX ACL documentation, "unless otherwise specified, the mask permissions are recalculated on subsequent setfacl calls," recalculating it "to the union of all permissions of the owning group, and all named user and group entries." Adding newhire with rwx meant the new union now included rwx, so the mask was automatically widened from r-- to rwx — and because the mask caps the EFFECTIVE permission of every other named user and group entry on the file (not just the one being added), every existing user whose own ACL entry already granted more than read-only (previously capped down to r-- effective by the old mask) instantly regained their full effective permissions the moment the mask widened, with zero direct change to their own entries. The onboarding command should have used the -n flag — setfacl -n -m u:newhire:rwx sharedfile — which, per the same documentation, "restrict[s] the ACL you\'re adding to the maximum permissions allowed by the mask" instead of recalculating the mask to accommodate it, preserving the original r-- cap for every entry, old and new alike.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'setfacl -m m:PERM works the same way as granting a named user or group a permission — it just applies to "everyone" instead of one specific entry.',
      reality: 'Per this subtopic\'s theory, the mask is structurally different from a named entry — it doesn\'t grant permissions to any participant at all, it CAPS the effective permissions that named users, named groups, and the owning group entry can actually exercise, while leaving the file owner and "other" completely unaffected.'
    },
    {
      thought: 'Once a restrictive ACL mask is set on a file, it stays that way until someone explicitly runs another setfacl command targeting the mask entry itself.',
      reality: 'Per this subtopic\'s theory, POSIX ACL behavior automatically recalculates the mask on EVERY subsequent setfacl call by default (unless -n is used) — even a call that only adds or modifies a completely different, unrelated ACL entry can silently widen the mask for every other entry on the file.'
    },
    {
      thought: 'If getfacl shows a named user\'s entry as "rw-", that user genuinely has read-write access to the file.',
      reality: 'Per this subtopic\'s theory, an entry\'s own listed permission is not necessarily the user\'s ACTUAL effective permission — getfacl explicitly shows an "#effective:" annotation whenever the mask caps an entry below what it literally states, and the entry\'s own text never changes to reflect that capping.'
    }
  ];
}
