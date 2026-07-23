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
  templateUrl: './chmod-755-on-a-directory-does-not-clear-setgid.html',
  styleUrl: './chmod-755-on-a-directory-does-not-clear-setgid.scss'
})
export class Chmod755OnADirectoryDoesNotClearSetgidSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states octal chmod as an unconditional, absolute operation',
      points: [
        'The main page\'s own theory states plainly: "Octal: chmod 755 = rwxr-xr-x; chmod 644 = rw-r--r--; chmod 600 = rw------- (private key)." No qualification, no exception — a three-digit octal mode is presented as setting EXACTLY those bits and nothing else, full stop.',
        'The main page\'s own /shared example builds directly on this same absolute mental model: chmod 2775 /shared sets setgid plus rwxrwxr-x, so new files in /shared inherit the devteam group "regardless of creator." Nothing on the page ever revisits what a LATER, ordinary three-digit chmod on that same directory would do to the setgid bit it just set.',
      ]
    },
    {
      heading: 'The corrected finding: GNU chmod special-cases directories — a 3-digit mode does NOT clear an existing setgid bit there',
      points: [
        'A natural, plausible-sounding assumption is that a recursive chmod -R 755 /shared would silently strip the setgid bit set earlier, since 755 doesn\'t include it — matching the main page\'s own "octal sets exactly this" framing. Verifying this against GNU chmod\'s actual documented behavior shows the OPPOSITE is true for directories specifically: "on directories, GNU chmod preserves setgid unless you clear it explicitly."',
        'This is an asymmetric, special-cased rule, confirmed directly: "on regular files, a three-digit numeric mode such as 755 clears special bits" — so the SAME three-digit chmod 755 behaves differently depending on whether the target is a file (setuid/setgid IS cleared) or a directory (setgid is PRESERVED). There is no equivalent special case for setuid on directories, since setuid has no meaning on a directory in the first place — this special-casing is specifically about setgid on directories.',
        'The practical consequence for the main page\'s own /shared example: running chmod -R 755 /shared later — for an unrelated reason, like fixing an overly-permissive file that got created inside it — does NOT undo the setgid inheritance property the earlier chmod 2775 established, contrary to what "octal always sets exactly the specified bits" would predict.',
      ]
    },
    {
      heading: 'How to actually clear directory setgid on purpose, and why the special-casing exists',
      points: [
        'To deliberately clear a directory\'s setgid bit with an octal mode requires an EXPLICIT leading zero (the full 4-digit form): chmod 0755 /shared clears it, where the bare chmod 755 /shared (3 digits) does not. The symbolic form chmod g-s /shared also works and makes the intent to clear the bit explicit rather than implicit in a digit count.',
        'The practical reasoning behind GNU chmod\'s special-casing is that a 3-digit chmod is very commonly used purely as a routine, day-to-day tool for adjusting the standard rwx permission triplets (fixing an overly-open directory, applying a baseline recursively across a tree) — treating that ordinary operation as also silently discarding a deliberately-configured, often organizationally-important setgid inheritance setup would make routine permission maintenance unexpectedly destructive to shared-directory group ownership conventions.',
        'This means the reliable way to check whether a script or one-off command will affect an existing setgid bit is to know whether the TARGET is a file or a directory and whether the octal mode has 3 or 4 digits — not to assume "octal chmod always sets exactly what I typed" uniformly, which the main page\'s own framing (accurate for files, incomplete for directories) doesn\'t fully cover.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own /shared example, revisited months later',
      language: 'bash',
      code: `# Main page's own setgid example, unchanged:
mkdir /shared
chown root:devteam /shared
chmod 2775 /shared         # drwxrwsr-x
# new files in /shared will belong to devteam regardless of creator

ls -ld /shared
# drwxrwsr-x ... root devteam /shared
#      ^ setgid bit (s in the group execute position)

# Months later, an unrelated cleanup task tightens permissions
# across a wider directory tree that happens to include /shared,
# using an ordinary 3-digit octal mode -- the SAME pattern the main
# page's own "Octal: chmod 755 = rwxr-xr-x" theory describes as
# absolute:
chmod -R 755 /shared

# Check what actually happened to the setgid bit:
ls -ld /shared
# drwxrwsr-x ... root devteam /shared
#      ^ setgid bit is STILL THERE, unchanged

# Per GNU chmod's own documented behavior: "on directories, GNU
# chmod preserves setgid unless you clear it explicitly" -- the
# 3-digit chmod -R 755 changed the rwx bits (drwxrwsr-x's own rwx
# portions) but left the special setgid bit alone, contrary to what
# the main page's own "octal sets exactly this" framing would
# predict.`,
    },
    {
      label: 'The same 3-digit mode DOES clear setgid on a FILE — and how to clear it on a directory on purpose',
      language: 'bash',
      code: `# The asymmetry, made concrete: setgid on a FILE (not a directory)
# behaves exactly as the "octal is absolute" mental model predicts.

touch /shared/somefile
chmod 2644 /shared/somefile   # rw-rw-r-- + setgid on a FILE
ls -l /shared/somefile
# -rw-rwSr-- ... /shared/somefile
#       ^ setgid on a file (capital S = setgid set, execute not set)

chmod 644 /shared/somefile    # ordinary 3-digit mode
ls -l /shared/somefile
# -rw-r--r-- ... /shared/somefile
#       ^ setgid is GONE -- per documented behavior, "on regular
#         files, a three-digit numeric mode such as 755 clears
#         special bits" -- files do NOT get the directory's
#         preservation special-case.

# To deliberately clear setgid on the DIRECTORY (not rely on an
# ordinary 3-digit mode doing it implicitly, since it won't):

chmod 0755 /shared    # explicit LEADING ZERO -- 4-digit form
ls -ld /shared
# drwxr-xr-x ... /shared
#      ^ setgid is now gone -- the explicit 4-digit "0" told chmod
#        to set special bits to exactly 0, overriding preservation.

# Symbolic form works too, and makes the intent explicit either way:
chmod 2775 /shared     # restore setgid for this example
chmod g-s /shared       # clear it again, symbolically`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets up /projects/webapp as a shared directory with chmod 2775, so every file a developer creates there automatically inherits the webapp group. Six months later, a routine security-hardening script runs chmod -R 755 /projects/* across every project directory to standardize permissions, using an ordinary 3-digit octal mode, with no special handling for any particular directory. Afterward, new files created in /projects/webapp still correctly inherit the webapp group, exactly as before — but a teammate is confused, having assumed the hardening script\'s chmod -R 755 would have reset it back to the creating user\'s own default group, same as the main page\'s own "chmod 755 = rwxr-xr-x, full stop" framing would suggest. Was the teammate\'s assumption wrong, and why did the setgid inheritance survive?',
    hint: 'Check whether GNU chmod treats a 3-digit octal mode identically for files and directories when a setgid bit is already present, or whether directories get special handling.',
    solution: 'The teammate\'s assumption was a reasonable but incorrect application of the "octal sets exactly what you typed" mental model — that rule is accurate for FILES but not for directories. Per GNU chmod\'s own documented behavior, "on directories, GNU chmod preserves setgid unless you clear it explicitly," specifically as a special case distinct from how the same 3-digit mode behaves on a file ("on regular files, a three-digit numeric mode such as 755 clears special bits"). Because /projects/webapp is a directory, the hardening script\'s chmod -R 755 changed its rwx permission bits but left the pre-existing setgid bit untouched, which is exactly why the group-inheritance behavior survived the "hardening" pass unaffected. Had the same 3-digit mode been applied to a FILE that had setgid set, it WOULD have been cleared — the surviving behavior here is specific to /projects/webapp being a directory. If the hardening script had genuinely intended to reset every directory to a clean, non-setgid baseline, it would have needed an explicit 4-digit mode (chmod -R 0755) or the symbolic chmod -R g-s to actually clear the bit — a bare 3-digit chmod -R 755 on directories does not do this by design.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A three-digit octal chmod always sets exactly the specified permission bits and clears anything not included in those three digits — for files and directories alike.',
      reality: 'Per this subtopic\'s theory, GNU chmod special-cases this specifically for directories: a 3-digit mode clears special bits on a FILE, but preserves an existing setgid bit on a DIRECTORY unless cleared explicitly — the same digit count behaves differently depending on the target type.'
    },
    {
      thought: 'chmod -R 755 applied recursively across a directory tree containing setgid-enabled shared directories will reset all of them back to non-setgid, ordinary permissions.',
      reality: 'Per this subtopic\'s theory, GNU chmod\'s own documented preservation behavior means a bare 3-digit recursive chmod leaves each directory\'s existing setgid bit untouched — deliberately clearing it requires an explicit 4-digit mode (a leading 0) or the symbolic g-s form.'
    },
    {
      thought: 'The only way to know whether a chmod command affects a setgid bit is to check whether the specific octal digits used include the setgid value (the leading 2).',
      reality: 'Per this subtopic\'s theory, whether a target is a FILE or a DIRECTORY matters just as much as the digits used — the identical 3-digit mode (e.g. 755, with no leading digit at all) clears setgid on a file but preserves it on a directory, a distinction that has nothing to do with which digits were typed.'
    }
  ];
}
