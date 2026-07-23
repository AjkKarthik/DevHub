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
  templateUrl: './etc-skel-populates-new-homes-once-not-retroactively.html',
  styleUrl: './etc-skel-populates-new-homes-once-not-retroactively.scss'
})
export class EtcSkelPopulatesNewHomesOnceNotRetroactivelySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '/etc/skel appears in exactly one clause on the main page, never explained on its own',
      points: [
        'The main page\'s own QnA on useradd vs adduser mentions it in passing: "adduser... creates the home directory, copies /etc/skel, and sets up the user properly." That\'s the ONLY mention of /etc/skel anywhere on the page — never defined, never shown, never connected to the useradd -m examples used throughout the rest of the page\'s own theory and code.',
        'The main page\'s own "Managing Users" theory states "useradd -m creates the home directory" without ever explaining WHAT populates that new, empty directory with the default files most real systems actually show (a .bashrc, a .profile, sometimes a .bash_logout) — the reader is left assuming useradd -m produces a truly empty folder.',
      ]
    },
    {
      heading: 'Confirmed via useradd\'s own documentation: /etc/skel is copied once, at creation time only',
      points: [
        'Per useradd\'s own man page, describing the -m/--create-home option: "the files and directories contained in the skeleton directory (which can be defined with the -k option) will be copied to the home directory" — with the skeleton directory defaulting to /etc/skel unless -k overrides it. This is the actual mechanism behind every dotfile (.bashrc, .profile, etc.) that shows up in a freshly created user\'s home directory.',
        'The documented behavior describes a copying process that happens specifically "during initial home directory creation" — a one-time operation tied to the moment useradd -m runs, not an ongoing sync or template relationship between /etc/skel and any home directory it once populated.',
        'This means /etc/skel functions as a TEMPLATE for future accounts only — every existing user\'s home directory, once created, is completely disconnected from whatever /etc/skel contains from that point forward. Editing /etc/skel today has precisely zero effect on any account that already exists.',
      ]
    },
    {
      heading: 'The practical consequence: a common, easy-to-make deployment mistake',
      points: [
        'An organization that updates its standard shell configuration — adding a new alias, a security-relevant environment variable, an updated PATH — by editing the files under /etc/skel is making a change that ONLY affects users created AFTER that edit. Every existing employee\'s account keeps whatever dotfiles were copied into their home directory back when THEIR account was originally provisioned, however out of date that snapshot has become.',
        'This produces a familiar, confusing support pattern: "it works for new hires but not for anyone who joined before last month" — which looks like an inconsistent or broken configuration, but is actually /etc/skel behaving exactly as documented; the inconsistency is real, but it is inherent to how the mechanism works, not a bug in any individual account.',
        'The correct way to retroactively apply an /etc/skel change to EXISTING users is a deliberate, separate step — explicitly copying the updated file(s) into each existing home directory (or scripting that copy across all accounts) — since useradd\'s own one-time-copy design provides no built-in mechanism to propagate a later /etc/skel edit to accounts that already exist.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: '/etc/skel is what actually populates the "empty" home directory',
      language: 'bash',
      code: `# Main page's own theory: "useradd -m creates the home directory."
# Check what /etc/skel actually contains BEFORE creating a user:
ls -la /etc/skel/
# .bash_logout  .bashrc  .profile

# Create a user, following the main page's own exact pattern:
sudo useradd -m -s /bin/bash -c "Alice Smith" alice

# The "empty" new home directory isn't actually empty:
ls -la /home/alice/
# .bash_logout  .bashrc  .profile
# -- identical to /etc/skel's contents at the moment useradd ran.
# Per useradd's own documentation: "the files and directories
# contained in the skeleton directory... will be copied to the
# home directory" during -m's home-directory creation step.

# Confirm this is a genuine COPY, not a live link of any kind:
echo "# test line" | sudo tee -a /etc/skel/.bashrc
diff /etc/skel/.bashrc /home/alice/.bashrc
# < # test line          <-- only in /etc/skel now
# -- alice's already-created .bashrc did NOT pick up the change;
#    the copy happened once, in the past, and nothing keeps them
#    in sync afterward.`,
    },
    {
      label: 'The "works for new hires, not existing users" trap, and the actual fix',
      language: 'bash',
      code: `# An org updates its standard shell config -- adding a useful
# alias for everyone, via the seemingly obvious approach:
echo "alias ll='ls -alh'" | sudo tee -a /etc/skel/.bashrc

# A NEW hire onboarded afterward gets it automatically:
sudo useradd -m -s /bin/bash newhire
grep alias /home/newhire/.bashrc
# alias ll='ls -alh'   <-- present, exactly as expected

# An EXISTING employee (created weeks earlier, before this edit)
# does NOT have it, and never will just by waiting:
grep alias /home/alice/.bashrc
# (no output -- alice's .bashrc is a frozen snapshot from whenever
#  HER account was created, completely disconnected from /etc/skel
#  from that point forward)

# The correct way to retroactively apply the change to EXISTING
# users -- a deliberate, separate step /etc/skel itself never does
# automatically:
for user_home in /home/*/; do
  if [ -f "\${user_home}.bashrc" ]; then
    echo "alias ll='ls -alh'" >> "\${user_home}.bashrc"
  fi
done
# (a real deployment would want idempotency checks to avoid
#  duplicate lines on repeated runs -- shown simplified here)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team adds a new security-relevant environment variable (export HISTTIMEFORMAT="%F %T ") to /etc/skel/.bashrc, intending for every user on the system to have timestamped shell history going forward, as part of an audit compliance initiative. A month later, a compliance review finds that only 3 of the company\'s 40 Linux accounts actually have timestamped history — specifically, only the accounts created after the /etc/skel edit. Is this a sign the change was applied incorrectly, or expected behavior — and what should the team do to actually cover all 40 accounts?',
    hint: 'Check what useradd\'s own documentation says about WHEN the /etc/skel copy happens — is it a one-time event tied to account creation, or an ongoing relationship that keeps existing accounts in sync with /etc/skel\'s current contents?',
    solution: 'This is expected behavior for how /etc/skel works, not a misapplied change — the platform team\'s mistake was assuming editing /etc/skel would retroactively reach existing accounts, which it never does. Per useradd\'s own documentation, the skeleton directory\'s contents "will be copied to the home directory" specifically "during initial home directory creation" — a one-time event tied to when useradd -m runs for a given account, with no ongoing link back to /etc/skel afterward. The 3 accounts with timestamped history are exactly the ones created AFTER the edit; the other 37 pre-existing accounts each have their own frozen .bashrc snapshot from whenever THEIR account was originally provisioned, and will never pick up the /etc/skel change just by existing. To actually cover all 40 accounts, the team needs a deliberate, separate remediation step — explicitly appending the same HISTTIMEFORMAT line to every existing account\'s .bashrc (e.g. looping over every home directory, or using a configuration-management tool) — since /etc/skel itself provides no mechanism to propagate a later edit to accounts that already exist.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '/etc/skel acts as a live template that all user home directories stay synced with — editing a file there updates every user\'s copy of that file automatically.',
      reality: 'Per this subtopic\'s theory, useradd\'s own documentation confirms /etc/skel is copied to a new home directory only once, "during initial home directory creation" — there is no ongoing link, and existing users\' files never change in response to a later /etc/skel edit.'
    },
    {
      thought: 'useradd -m creates a genuinely empty home directory — the standard dotfiles (.bashrc, .profile) that appear afterward come from some other, separate mechanism.',
      reality: 'Per this subtopic\'s theory, those dotfiles come directly from /etc/skel — useradd\'s own -m option documentation states explicitly that the skeleton directory\'s contents "will be copied to the home directory" as part of that same creation step.'
    },
    {
      thought: 'If a change made to /etc/skel is meant to apply company-wide, updating that one directory is sufficient to reach every user account on the system.',
      reality: 'Per this subtopic\'s theory, an /etc/skel change only ever reaches accounts created AFTER the edit — retroactively applying it to existing accounts requires a separate, deliberate step (like looping over existing home directories), since the one-time-copy mechanism provides no automatic propagation to accounts that already exist.'
    }
  ];
}
