import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-linux-users-groups',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './users-groups.html',
  styleUrl: './users-groups.scss'
})
export class LinuxUsersGroups {

  quickRef: QuickRefItem[] = [
    { name: 'useradd -m -s /bin/bash alice', type: 'syntax', desc: 'Create user with home dir and bash shell' },
    { name: 'passwd alice', type: 'syntax', desc: 'Set or change a user\'s password' },
    { name: 'usermod -aG sudo alice', type: 'syntax', desc: 'Add alice to the sudo group (-a = append, -G = supplementary groups)' },
    { name: 'id alice', type: 'syntax', desc: 'Show UID, GID, and all groups for alice' },
    { name: 'groups alice', type: 'syntax', desc: 'List all groups alice belongs to' },
    { name: 'su - alice', type: 'syntax', desc: 'Switch to alice\'s account (- loads full login environment)' },
    { name: 'visudo', type: 'syntax', desc: 'Safely edit /etc/sudoers with syntax checking' },
    { name: 'w', type: 'syntax', desc: 'Show logged-in users and what they\'re running' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: '/etc/passwd and /etc/shadow',
      points: [
        '/etc/passwd: one record per user. Format: username:x:UID:GID:GECOS:home:shell. The x means password hash is in /etc/shadow.',
        'UID 0 = root (superuser). UIDs 1–999 = system accounts (daemons). UIDs 1000+ = human users (convention).',
        '/etc/shadow: hashed passwords only readable by root. Format: username:hash:lastchange:min:max:warn:inactive:expire.',
        'Password hashes use format $id$salt$hash: $1$ = MD5 (obsolete), $6$ = SHA-512 (current), $y$ = yescrypt (Ubuntu 22+).',
      ],
    },
    {
      heading: 'Managing Users',
      points: [
        'useradd -m creates the home directory. Without -m, no home dir is created. -s sets the login shell.',
        'usermod modifies existing users: -l = rename, -d = change home, -G = set groups (replaces), -aG = append to groups.',
        'userdel -r removes the user AND their home directory. Without -r, files remain orphaned (owned by deleted UID).',
        'chage manages password expiry: chage -l alice = show expiry info, chage -M 90 alice = force password change every 90 days.',
      ],
    },
    {
      heading: 'Groups and /etc/group',
      points: [
        '/etc/group format: groupname:x:GID:member1,member2. A user\'s primary group is in /etc/passwd; supplementary groups in /etc/group.',
        'groupadd creates groups. groupmod -n newname oldname renames. groupdel removes (users lose membership automatically).',
        'newgrp groupname switches to a new primary group in the current session without logging out.',
        'Members added with usermod -aG must log out and back in (or run newgrp) for group membership to take effect.',
      ],
    },
    {
      heading: 'sudo Configuration',
      points: [
        '/etc/sudoers controls who can run what as whom. NEVER edit it directly — use visudo which syntax-checks before saving.',
        'Rule format: USER HOSTS=(RUNAS) COMMANDS. Example: alice ALL=(ALL) ALL = alice can run any command on any host as any user.',
        'NOPASSWD: alice ALL=(ALL) NOPASSWD: /usr/bin/apt — alice runs apt without password prompt.',
        '/etc/sudoers.d/ accepts drop-in files (visudo -f /etc/sudoers.d/myapp). Package installs use this to avoid touching /etc/sudoers.',
        'sudo -i = root login shell; sudo -u alice cmd = run cmd as alice; sudo !! = re-run last command with sudo.',
      ],
    },
    {
      heading: 'The Principle of Least Privilege in User/Group Design',
      points: [
        'Running application services under a dedicated, unprivileged service account (rather than root) limits the damage a compromised service can do — a web server running as root that gets exploited gives an attacker full system control, while the same exploit against a service running as a restricted user is far more contained.',
        'Group membership is the standard mechanism for sharing access among multiple users without granting each individual user separate, redundant permissions — adding a user to a "developers" group that has write access to a shared project directory is more maintainable than setting individual permissions per user per file.',
        'sudo (rather than logging in directly as root, or using su to become root) provides an audit trail (logged in /var/log/auth.log or via journalctl) of exactly which command was run by which user with elevated privileges — essential for security accountability in any multi-administrator environment.',
        'The /etc/passwd and /etc/shadow file separation exists specifically for security — /etc/passwd (world-readable) contains user account metadata, while /etc/shadow (readable only by root) contains the actual password hashes, preventing unprivileged users from even attempting to crack password hashes offline.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'User Management',
      language: 'bash',
      code: `# Create a user
sudo useradd -m -s /bin/bash -c "Alice Smith" alice
sudo passwd alice                      # set password interactively

# Modify user
sudo usermod -aG docker,sudo alice     # add to docker and sudo groups
sudo usermod -s /bin/zsh alice         # change shell
sudo usermod -d /home/newdir -m alice  # move home directory

# Lock / unlock
sudo passwd -l alice    # lock account
sudo passwd -u alice    # unlock account

# Delete user
sudo userdel -r alice   # remove user + home directory
sudo find / -uid 1001 -exec ls -la {} \\; 2>/dev/null  # find orphaned files

# Password info
sudo chage -l alice           # show password aging
sudo chage -M 90 -W 7 alice  # max 90 days, warn 7 days before`,
    },
    {
      label: 'Groups & su/sudo',
      language: 'bash',
      code: `# Group management
sudo groupadd developers
sudo groupmod -n devteam developers   # rename
sudo usermod -aG devteam alice
groups alice                          # verify membership

# Switch users
su - alice                            # full login as alice
su -c "ls /root" root                 # run single command as root
sudo su -                             # become root (preserves sudo audit trail)

# sudo examples
sudo apt update
sudo -u www-data php artisan queue:work   # run as www-data
sudo -i                               # interactive root shell
sudo -l                               # list what you can sudo

# /etc/sudoers entries (visudo)
# alice ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx
# %devteam ALL=(www-data) NOPASSWD: /usr/bin/composer`,
    },
    {
      label: 'Inspection',
      language: 'bash',
      code: `# Who is logged in
who                    # logged-in users
w                      # users + what they're doing
last                   # login history (from /var/log/wtmp)
lastb                  # failed logins (from /var/log/btmp)

# User info
id                     # current user: uid, gid, groups
id alice               # info for alice
finger alice           # verbose user info (if installed)

# /etc/passwd inspection
grep "^alice" /etc/passwd
awk -F: '$3 >= 1000 {print $1, $3}' /etc/passwd  # human users

# Locked accounts (! in shadow)
sudo grep "^.*:!" /etc/shadow | cut -d: -f1

# Who can sudo
grep -v "^#" /etc/sudoers | grep -v "^$"
ls /etc/sudoers.d/`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using usermod -G without -a',
      wrong: 'usermod -G docker alice',
      right: 'usermod -aG docker alice',
      explanation: '-G alone REPLACES all supplementary groups. Without -a, alice loses all her other group memberships. Always use -aG to append.',
    },
    {
      title: 'Editing /etc/sudoers directly with vi',
      wrong: 'vi /etc/sudoers',
      right: 'visudo',
      explanation: 'If you save a syntax error to /etc/sudoers, sudo stops working entirely — potentially locking you out. visudo locks the file and checks syntax before saving.',
    },
    {
      title: 'Using su without the dash',
      wrong: 'su alice',
      right: 'su - alice',
      explanation: 'su alice switches user but keeps the current environment (PATH, HOME, etc). su - alice starts a full login shell loading alice\'s environment. Always use the dash for predictable behaviour.',
    },
    {
      title: 'Forgetting that group changes require re-login',
      wrong: 'Adding a user to docker group and expecting it to work immediately',
      right: 'After usermod -aG docker alice, alice must log out and back in (or run newgrp docker)',
      explanation: 'Group membership is loaded at login time. The running session still has the old token. newgrp or a new login is required to pick up group changes.',
    },
  ];

  challenge: Challenge = {
    title: '/etc/passwd Parser',
    language: 'typescript',
    description: 'Write a function that parses /etc/passwd content and returns human users (UID >= 1000) as objects with username, uid, gid, and home fields.',
    hints: [
      'Split on newlines, then on colons',
      'UID is field index 2 (0-based)',
      'Filter out comment lines (starting with #) and system users (UID < 1000)',
    ],
    starterCode: `interface UserEntry { username: string; uid: number; gid: number; home: string; }

function parsePasswd(content: string): UserEntry[] {
  // Return human users (UID >= 1000) from /etc/passwd format
}

const sample = \`root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
alice:x:1000:1000:Alice:/home/alice:/bin/bash
bob:x:1001:1001:Bob:/home/bob:/bin/zsh\`;

console.log(parsePasswd(sample));
// [{ username: 'alice', uid: 1000, gid: 1000, home: '/home/alice' }, ...]`,
    solution: `interface UserEntry { username: string; uid: number; gid: number; home: string; }

function parsePasswd(content: string): UserEntry[] {
  return content.split('\\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split(':'))
    .filter(f => parseInt(f[2], 10) >= 1000)
    .map(f => ({ username: f[0], uid: parseInt(f[2], 10), gid: parseInt(f[3], 10), home: f[5] }));
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does usermod -aG sudo alice do?',
      options: ['Set alice\'s primary group to sudo', 'Add alice to the sudo group while keeping existing groups', 'Remove alice from sudo', 'Replace all alice\'s groups with sudo'],
      answer: 1,
      explanation: '-aG appends alice to the sudo supplementary group. Without -a, -G alone would replace all existing supplementary groups.',
    },
    {
      q: 'Where are password hashes stored on a modern Linux system?',
      options: ['/etc/passwd', '/etc/shadow', '/etc/security', '/etc/pam.d/'],
      answer: 1,
      explanation: '/etc/shadow contains hashed passwords and is readable only by root. /etc/passwd has x in the password field as a placeholder.',
    },
    {
      q: 'What range of UIDs is typically assigned to human users on Debian/Ubuntu?',
      options: ['0–99', '100–499', '500–999', '1000+'],
      answer: 3,
      explanation: 'UIDs 1000 and above are conventional for human (interactive) users. UIDs 0 is root, 1–999 are system/daemon accounts.',
    },
    {
      q: 'Which command safely edits /etc/sudoers?',
      options: ['sudo vi /etc/sudoers', 'sudo nano /etc/sudoers', 'visudo', 'sudo chmod 777 /etc/sudoers && vi it'],
      answer: 2,
      explanation: 'visudo opens a temp copy of /etc/sudoers, checks syntax before saving, and prevents concurrent edits. Direct editing with vi/nano risks a syntax error that breaks sudo.',
    },
    {
      q: 'What information does /etc/shadow store?',
      options: [
        'User home directories and shell preferences',
        'Hashed passwords and password aging policy per user, readable only by root',
        'Group membership and GID mappings',
        'User login history and timestamps',
      ],
      answer: 1,
      explanation: '/etc/shadow stores hashed passwords (using SHA-512 or similar) and aging fields (last change, min/max days, warning period, expiry). It is readable only by root unlike /etc/passwd which is world-readable.',
    },
    {
      q: 'Which command adds an existing user to a supplementary group without removing current groups?',
      options: [
        'groupadd username groupname',
        'usermod -aG groupname username',
        'addgroup username groupname',
        'chgrp groupname username',
      ],
      answer: 1,
      explanation: 'usermod -aG groupname username: -a means append (do not replace existing groups), -G sets supplementary groups. Without -a, -G replaces all supplementary groups. User must log out and back in for the change to take effect.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between primary and supplementary groups?',
      a: 'A user\'s primary group (GID in /etc/passwd) is applied to new files they create. Supplementary groups (listed in /etc/group) grant additional permissions without changing file ownership. For example, adding a user to the docker group gives them Docker socket access without making docker their default group for new files.',
    },
    {
      q: 'How do service accounts differ from human user accounts?',
      a: 'Service accounts (daemon, www-data, nobody) have UIDs below 1000, no home directory, and /usr/sbin/nologin or /bin/false as their shell — they cannot be interactively logged into. They run system services as a non-root identity for security isolation.',
    },
    {
      q: 'How do I run a cron job as a different user?',
      a: 'Edit the system crontab (/etc/crontab or /etc/cron.d/) which has a username field: "0 2 * * * www-data /usr/bin/cleanup.sh". Alternatively use sudo crontab -u www-data -e. User crontabs (crontab -e) always run as that user.',
    },
    {
      q: 'What is the difference between useradd and adduser?',
      a: '<strong>useradd</strong> is the low-level utility that creates a user entry with minimal setup (no home dir, no password by default without flags). <strong>adduser</strong> (on Debian/Ubuntu) is a higher-level wrapper that interactively prompts for password, creates the home directory, copies /etc/skel, and sets up the user properly. For scripts use useradd -m -s /bin/bash username; for interactive use adduser.',
    },
    {
      q: 'How does sudo differ from su?',
      a: '<strong>sudo cmd</strong> runs a single command as another user (usually root) after authenticating as yourself — actions are logged. <strong>su - user</strong> switches to another user account for a full session (requires the target user\'s password, or root can su to anyone without password). <code>sudo -i</code> gives an interactive root shell via sudo. Prefer sudo: it provides granular control and audit trails.',
    },
    {
      q: 'What is the wheel/sudo group and how do you manage it?',
      a: 'The <strong>sudo</strong> group (Ubuntu) or <strong>wheel</strong> group (RHEL/CentOS) grants members the ability to run commands with sudo. Add a user: <code>usermod -aG sudo username</code> (Ubuntu) or <code>usermod -aG wheel username</code> (RHEL). The sudoers file (/etc/sudoers) contains the rule: <code>%sudo ALL=(ALL:ALL) ALL</code>. Users must log out and back in for group changes to take effect.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'useradd -m creates users; usermod -aG appends groups; visudo for sudoers; su - for login shell; /etc/shadow has hashes.',
    mustKnow: [
      'useradd -m -s /bin/bash creates user with home + shell',
      'usermod -aG (with -a!) appends to groups; without -a it replaces',
      '/etc/passwd has no real passwords (x placeholder); /etc/shadow has hashes (root-readable only)',
      'visudo is the only safe way to edit /etc/sudoers',
      'su - user loads full login environment; su user without dash does not',
      'Group membership changes require re-login (or newgrp) to take effect',
    ],
    interviewFocus: [
      'How do you create a user that cannot log in interactively (service account)?',
      'What is the difference between su and sudo?',
      'How would you audit which users have sudo access?',
      'How do you force a user to change their password on next login?',
    ],
  };
}
