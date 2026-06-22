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
  selector: 'app-linux-file-permissions',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './file-permissions.html',
  styleUrl: './file-permissions.scss'
})
export class LinuxFilePermissions {

  quickRef: QuickRefItem[] = [
    { name: 'chmod 755 file', type: 'syntax', desc: 'rwxr-xr-x — owner rwx, group r-x, others r-x' },
    { name: 'chmod 644 file', type: 'syntax', desc: 'rw-r--r-- — typical file: owner rw, group/others r' },
    { name: 'chmod +x script.sh', type: 'syntax', desc: 'Add execute permission for all (symbolic mode)' },
    { name: 'chown user:group file', type: 'syntax', desc: 'Change owner and group of a file' },
    { name: 'chown -R alice:dev dir/', type: 'syntax', desc: 'Recursively change ownership' },
    { name: 'umask 022', type: 'syntax', desc: 'Default mask: new files get 644, dirs get 755' },
    { name: 'chmod u+s /usr/bin/cmd', type: 'syntax', desc: 'Set setuid bit — runs as file owner' },
    { name: 'getfacl file', type: 'syntax', desc: 'Show POSIX ACL for fine-grained access control' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Permission Bits — rwx',
      points: [
        'Each file has three permission triplets: owner (u), group (g), others (o). Each triplet has read (r=4), write (w=2), execute (x=1).',
        'For files: r = read content, w = modify content, x = execute as program.',
        'For directories: r = list contents (ls), w = create/delete entries, x = enter directory (cd). Without x on a dir you cannot access anything inside it.',
        'Octal: chmod 755 = rwxr-xr-x; chmod 644 = rw-r--r--; chmod 600 = rw------- (private key).',
      ],
    },
    {
      heading: 'umask — Default Permissions',
      points: [
        'umask subtracts permissions from the maximum: files start at 666, dirs at 777. umask 022 gives files 644, dirs 755.',
        'umask 027 gives files 640 (owner rw, group r, others none), dirs 750 — stricter default for servers.',
        'Set in ~/.bashrc or /etc/profile. Check current value with umask.',
        'Only applies to newly created files; does not retroactively change existing files.',
      ],
    },
    {
      heading: 'Special Permission Bits',
      points: [
        'setuid (chmod u+s or 4xxx): when set on an executable, it runs as the file\'s owner, not the caller. /usr/bin/passwd uses setuid to write /etc/shadow.',
        'setgid (chmod g+s or 2xxx): on a file, runs as the file\'s group. On a directory, new files inherit the directory\'s group — useful for shared project dirs.',
        'Sticky bit (chmod +t or 1xxx): on a directory, only the owner of a file can delete/rename it. Used on /tmp to prevent users deleting each other\'s files.',
        'chmod 4755 = setuid + rwxr-xr-x; chmod 1777 = sticky + rwxrwxrwx (the /tmp mode).',
      ],
    },
    {
      heading: 'POSIX ACLs — Fine-grained Control',
      points: [
        'Standard Unix permissions only support one owner, one group, and others. ACLs allow per-user and per-group rules on any file.',
        'getfacl file shows the ACL. setfacl -m u:alice:rw file adds Alice with read-write. setfacl -m m:r- sets the effective mask.',
        'setfacl -x u:alice file removes a specific entry. setfacl -b file removes all ACLs.',
        'setfacl -d -m u:bob:rwx dir/ sets default ACL — new files in dir inherit this rule.',
        'Filesystem must be mounted with acl option; most modern distros enable this by default for ext4/xfs.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'chmod & chown',
      language: 'bash',
      code: `# Octal chmod
chmod 755 script.sh       # rwxr-xr-x
chmod 644 config.yml      # rw-r--r--
chmod 600 ~/.ssh/id_rsa   # rw------- (required by SSH)
chmod 700 ~/.ssh/          # drwx------

# Symbolic chmod
chmod u+x,g-w,o= file     # add exec for owner, remove write from group, clear others
chmod a+r file             # add read for all (a = u+g+o)
chmod -R 755 /var/www/     # recursive

# chown
chown alice file
chown alice:developers file
chown -R www-data:www-data /var/www/html/
chown --reference=reffile targetfile   # copy ownership from reffile

# View permissions
ls -l file
stat file                              # detailed: inode, mode, links, timestamps`,
    },
    {
      label: 'Special Bits',
      language: 'bash',
      code: `# setuid — run as file owner (not caller)
ls -l /usr/bin/passwd     # -rwsr-xr-x (s = setuid set)
chmod u+s mybinary        # set setuid
chmod 4755 mybinary       # same in octal

# setgid — files in dir inherit group
mkdir /shared
chown root:devteam /shared
chmod 2775 /shared         # drwxrwsr-x
# new files in /shared will belong to devteam regardless of creator

# sticky bit — only owner can delete
ls -ld /tmp               # drwxrwxrwt (t = sticky)
chmod +t /shared-dir      # set sticky bit
chmod 1777 /tmp-custom    # sticky + full rwx for all

# Find setuid files (security audit)
find / -perm -4000 -type f 2>/dev/null`,
    },
    {
      label: 'ACLs',
      language: 'bash',
      code: `# View ACL
getfacl /var/www/html/
# output: user::rwx, group::r-x, other::r-x, ...

# Add user ACL
setfacl -m u:alice:rw myfile         # alice gets rw
setfacl -m g:devteam:rx /var/app/    # devteam gets rx

# Default ACL (inherited by new files)
setfacl -d -m u:deploy:rwx /deploy/ # deploy user always gets rwx on new files

# Remove ACL entries
setfacl -x u:alice myfile            # remove alice's entry
setfacl -b myfile                    # remove all ACL entries

# Copy ACL from one file to another
getfacl file1 | setfacl --set-file=- file2`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Making SSH private keys world-readable',
      wrong: 'chmod 644 ~/.ssh/id_rsa',
      right: 'chmod 600 ~/.ssh/id_rsa',
      explanation: 'SSH refuses to use private keys with permissions too open (error: "Permissions 0644 are too open"). Private keys must be 600 (owner read/write only).',
    },
    {
      title: 'Using chmod 777 "to fix permissions"',
      wrong: 'chmod -R 777 /var/www/',
      right: 'chmod -R 755 /var/www/ && chmod -R 644 /var/www/**/*.{html,php}',
      explanation: '777 gives everyone full access including write. An attacker exploiting a web process can then write malware. Find the real user/group mismatch and fix it properly.',
    },
    {
      title: 'Confusing file execute and directory execute',
      wrong: 'chmod +x mydir/ to let users cd into it',
      right: 'chmod +x is execute for both, but for dirs it means "traverse" — you need execute, not just read',
      explanation: 'Without execute (x) on a directory you cannot cd into it or access its contents, even if you have read permission. r lets you list; x lets you traverse.',
    },
    {
      title: 'Forgetting umask when writing automation scripts',
      wrong: 'Creating temp files in scripts without setting umask first',
      right: 'umask 077 at the top of the script to make all created files private by default',
      explanation: 'Scripts inherit the calling user\'s umask. If the caller has umask 022, temp files are world-readable. Set umask 077 in security-sensitive scripts.',
    },
  ];

  challenge: Challenge = {
    title: 'Permission Octal Parser',
    language: 'typescript',
    description: 'Write a function that converts an octal permission string (e.g. "755") to a human-readable permission string like "rwxr-xr-x". Handle optional setuid/setgid/sticky prefixes.',
    hints: [
      'Each octal digit maps to a 3-bit rwx triplet: 7=111, 6=110, 5=101, 4=100...',
      'Map each bit to r, w, or x (or - if not set)',
      'Handle the leading 4th digit for setuid/setgid/sticky',
    ],
    starterCode: `function octalToPermString(octal: string): string {
  // "755" -> "rwxr-xr-x"
  // "4755" -> "rwsr-xr-x" (setuid)
  // "1777" -> "rwxrwxrwt" (sticky)
}

console.log(octalToPermString("755"));  // rwxr-xr-x
console.log(octalToPermString("644"));  // rw-r--r--
console.log(octalToPermString("1777")); // rwxrwxrwt`,
    solution: `function octalToPermString(octal: string): string {
  const rwx = (n: number) =>
    [(n>>2)&1?'r':'-', (n>>1)&1?'w':'-', n&1?'x':'-'].join('');

  const padded = octal.padStart(4, '0');
  const [special, u, g, o] = padded.split('').map(Number);

  let res = rwx(u) + rwx(g) + rwx(o);
  if (special & 4) res = res.slice(0,2) + (res[2]==='x'?'s':'S') + res.slice(3);
  if (special & 2) res = res.slice(0,5) + (res[5]==='x'?'s':'S') + res.slice(6);
  if (special & 1) res = res.slice(0,8) + (res[8]==='x'?'t':'T');
  return res;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does chmod 644 set on a file?',
      options: ['rwxr-xr-x', 'rw-rw-rw-', 'rw-r--r--', 'rwx------'],
      answer: 2,
      explanation: '6=rw-, 4=r--, 4=r--. So 644 = rw-r--r--: owner can read/write, group and others can only read.',
    },
    {
      q: 'Which special bit allows any user to delete files they own in a shared directory?',
      options: ['setuid', 'setgid', 'sticky bit', 'execute bit'],
      answer: 2,
      explanation: 'The sticky bit (chmod +t) on a directory means only the file owner (and root) can delete or rename files in that directory, even if the directory is world-writable. Used on /tmp.',
    },
    {
      q: 'What umask value produces 640 permissions for new files?',
      options: ['022', '027', '026', '077'],
      answer: 1,
      explanation: 'Files start at 666. 666 - 027 = 640 (rw-r-----). umask 027 is common on servers to prevent "others" from reading files.',
    },
    {
      q: 'What does x permission mean on a directory?',
      options: ['Can list directory contents', 'Can execute files inside the directory', 'Can traverse (cd into) the directory', 'Can delete the directory'],
      answer: 2,
      explanation: 'Execute on a directory means "traverse" — you can cd into it and access known filenames inside. Read (r) lets you list contents with ls. Both are often needed together.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use ACLs vs standard Unix permissions?',
      a: 'Use standard permissions when one owner and one group are sufficient. Use ACLs when you need per-user or per-additional-group access without changing the primary owner/group. Example: a web directory owned by www-data where you also want the deploy user to have write access — add an ACL for the deploy user rather than adding deploy to www-data group.',
    },
    {
      q: 'What is the risk of setuid executables?',
      a: 'A setuid binary runs with the file owner\'s privileges (often root), regardless of who calls it. If the binary has a vulnerability (buffer overflow, shell injection), an attacker can exploit it to gain owner-level access. This is why the number of setuid root binaries on a system should be minimised.',
    },
    {
      q: 'Why does SSH say "bad permissions" for my key?',
      a: 'SSH enforces that private keys (~/.ssh/id_rsa, id_ed25519) have mode 600 (only owner can read) and that ~/.ssh/ has mode 700. If group or others can read the key, SSH refuses to use it as a security measure. Fix: chmod 600 ~/.ssh/id_rsa && chmod 700 ~/.ssh/',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Linux permissions: rwx triplets for owner/group/others; chmod with octal or symbolic; umask sets defaults; setuid/sticky for special cases.',
    mustKnow: [
      '755 = rwxr-xr-x (dir), 644 = rw-r--r-- (file), 600 = rw------- (private key)',
      'For directories: r = list, w = create/delete, x = traverse (cd)',
      'umask subtracts from 666 (files) / 777 (dirs)',
      'setuid (4xxx) runs as file owner; setgid (2xxx) on dir inherits group; sticky (1xxx) on dir protects files',
      'ACLs (setfacl/getfacl) provide per-user/group access beyond the 3-triplet model',
    ],
    interviewFocus: [
      'What is the difference between r, w, x on a file vs a directory?',
      'How does the setuid bit work and why is it a security risk?',
      'A web server cannot write to /var/www — how do you diagnose and fix the permissions?',
      'What umask would you set for a shared development directory?',
    ],
  };
}
