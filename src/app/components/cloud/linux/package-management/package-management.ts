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
  selector: 'app-linux-package-management',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './package-management.html',
  styleUrl: './package-management.scss'
})
export class LinuxPackageManagement {

  quickRef: QuickRefItem[] = [
    { name: 'apt update && apt upgrade -y', type: 'syntax', desc: 'Refresh index + upgrade all packages (Debian/Ubuntu)' },
    { name: 'apt install -y nginx', type: 'syntax', desc: 'Install nginx without prompting' },
    { name: 'apt remove / apt purge', type: 'syntax', desc: 'Remove package; purge removes config files too' },
    { name: 'dpkg -l | grep nginx', type: 'syntax', desc: 'List installed packages matching nginx' },
    { name: 'dpkg -L nginx', type: 'syntax', desc: 'List files installed by the nginx package' },
    { name: 'apt-cache show nginx', type: 'syntax', desc: 'Show package info and dependencies' },
    { name: 'dnf install / yum install', type: 'syntax', desc: 'Install package on RHEL/CentOS/Fedora' },
    { name: 'rpm -qa | grep nginx', type: 'syntax', desc: 'List installed RPM packages matching nginx' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'APT — Debian/Ubuntu',
      points: [
        'apt is the high-level front-end. apt-get is the lower-level tool (used in scripts for stability). apt-cache queries the local package database.',
        'apt update refreshes the package list from repositories — does not install anything. apt upgrade installs newer versions. apt full-upgrade handles package removals needed for upgrades.',
        'Repositories are listed in /etc/apt/sources.list and /etc/apt/sources.list.d/*.list. PPA sources add third-party repos.',
        'DEBIAN_FRONTEND=noninteractive apt install -y pkg prevents prompts in scripts and containers.',
      ],
    },
    {
      heading: 'dpkg — Low-Level Package Tool',
      points: [
        'dpkg is the base packaging tool. apt builds on it. dpkg -i package.deb installs a local .deb file.',
        'dpkg -l lists all installed packages with status. dpkg -L pkgname lists files installed by the package. dpkg -S /usr/bin/nginx tells you which package owns a file.',
        'dpkg --configure -a fixes packages left in a half-configured state after interrupted installs.',
        'apt-get -f install or dpkg --fix-broken-install resolves dependency problems.',
      ],
    },
    {
      heading: 'DNF / YUM — RHEL/CentOS/Fedora',
      points: [
        'dnf is the modern package manager on RHEL 8+/Fedora. yum is the older version (RHEL 7 and earlier).',
        'dnf install, dnf remove, dnf update (all packages), dnf update pkg (specific), dnf info pkg, dnf search term.',
        'dnf history shows transaction history. dnf history undo N rolls back a specific transaction.',
        'rpm -qa lists installed RPM packages. rpm -qi pkgname shows info. rpm -ql pkgname lists files. rpm -qf /path finds which package owns a file.',
      ],
    },
    {
      heading: 'Security and Pinning',
      points: [
        'Unattended upgrades: apt-get install unattended-upgrades + dpkg-reconfigure -plow unattended-upgrades — auto-installs security updates.',
        'Version pinning: apt-mark hold nginx prevents a package from being upgraded.',
        'apt install nginx=1.18.0-0ubuntu1 installs a specific version. apt-cache policy nginx shows available versions.',
        'GPG key verification: repositories sign packages; apt verifies them automatically. curl -fsSL URL | apt-key add - adds a key.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'APT (Debian/Ubuntu)',
      language: 'bash',
      code: `# Update and upgrade
sudo apt update                          # refresh package index
sudo apt upgrade -y                      # upgrade all packages
sudo apt full-upgrade -y                 # upgrade + remove obsolete
sudo apt dist-upgrade                    # same as full-upgrade (older term)

# Install / remove
sudo apt install -y nginx curl git
sudo apt remove nginx                    # remove (keep config)
sudo apt purge nginx                     # remove + delete config files
sudo apt autoremove                      # remove unused dependencies

# Search and info
apt search "web server"
apt-cache show nginx                     # detailed info + deps
apt-cache policy nginx                   # installed vs available versions

# Non-interactive (for scripts/Docker)
DEBIAN_FRONTEND=noninteractive apt install -y tzdata nginx

# Version pinning
sudo apt-mark hold nginx                 # prevent upgrade
sudo apt-mark unhold nginx
apt-mark showhold                        # list held packages

# Specific version
apt install nginx=1.18.0-0ubuntu1`,
    },
    {
      label: 'dpkg',
      language: 'bash',
      code: `# List installed packages
dpkg -l                                  # all packages
dpkg -l | grep nginx                     # filter
dpkg -l | grep "^ii"                     # only fully installed (ii)

# Package info
dpkg -L nginx                            # files installed by nginx
dpkg -S /usr/sbin/nginx                  # which package owns this file
dpkg -p nginx                            # show package info

# Install local .deb
sudo dpkg -i mypackage.deb
sudo apt-get install -f                  # fix broken deps after dpkg -i

# Fix interrupted installs
sudo dpkg --configure -a
sudo apt-get install -f

# Extract .deb without installing
dpkg-deb -x package.deb /tmp/extracted/
dpkg-deb -I package.deb                 # show package metadata`,
    },
    {
      label: 'DNF / RPM (RHEL/CentOS)',
      language: 'bash',
      code: `# DNF (RHEL 8+, Fedora)
sudo dnf update -y                       # update all
sudo dnf install -y nginx
sudo dnf remove nginx
sudo dnf search web server
sudo dnf info nginx
sudo dnf list installed | grep nginx

# Transaction history
dnf history                              # list transactions
sudo dnf history undo 5                  # undo transaction #5

# Groups
sudo dnf group install "Development Tools"
dnf group list

# RPM (low-level, like dpkg)
rpm -qa                                  # all installed packages
rpm -qa | grep nginx
rpm -qi nginx                            # package info
rpm -ql nginx                            # files in package
rpm -qf /usr/sbin/nginx                  # which package owns file

# Install local .rpm
sudo rpm -ivh package.rpm
sudo dnf localinstall package.rpm        # resolves deps`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Running apt install without apt update first',
      wrong: 'sudo apt install python3-venv (may install old version)',
      right: 'sudo apt update && sudo apt install python3-venv',
      explanation: 'apt update refreshes the local package index from repositories. Without it, you may install outdated packages or get "Package not found" errors on fresh systems.',
    },
    {
      title: 'Using apt remove when you want purge',
      wrong: 'sudo apt remove nginx (leaves config files behind)',
      right: 'sudo apt purge nginx && sudo apt autoremove (removes package + config + unused deps)',
      explanation: 'apt remove removes the package binaries but leaves config files in /etc/. apt purge also removes configuration files. Useful when reinstalling clean or switching servers.',
    },
    {
      title: 'Installing from dpkg without resolving dependencies',
      wrong: 'sudo dpkg -i package.deb (leaves broken deps)',
      right: 'sudo dpkg -i package.deb && sudo apt-get install -f (fix deps after)',
      explanation: 'dpkg -i does not resolve dependencies. If deps are missing, the package is marked broken. sudo apt-get install -f or sudo apt --fix-broken install resolves them.',
    },
    {
      title: 'Not using DEBIAN_FRONTEND=noninteractive in scripts and Dockerfiles',
      wrong: 'RUN apt install -y tzdata (hangs waiting for timezone prompt)',
      right: 'RUN DEBIAN_FRONTEND=noninteractive apt install -y tzdata',
      explanation: 'Some packages prompt for interactive configuration during install. In Dockerfiles and non-interactive scripts, these prompts hang forever. The env var suppresses them.',
    },
  ];

  challenge: Challenge = {
    title: 'Package Version Comparator',
    language: 'typescript',
    description: 'Write a function that compares two Debian-style version strings (e.g. "1.18.0-0ubuntu1" vs "1.20.2-1"). Return -1 if a < b, 0 if equal, 1 if a > b. Handle epoch prefixes (e.g. "2:1.18.0").',
    hints: [
      'Split on ":" to extract epoch (default 0)',
      'Split on "-" to separate upstream and debian revision',
      'Compare numeric components with parseInt, non-numeric with localeCompare',
    ],
    starterCode: `function compareVersions(a: string, b: string): -1 | 0 | 1 {
  // Handle "epoch:version-revision" format
  // Return -1, 0, or 1
}

console.log(compareVersions("1.18.0", "1.20.2"));     // -1
console.log(compareVersions("2:1.0.0", "1:9.9.9"));   // 1  (epoch 2 > epoch 1)
console.log(compareVersions("1.18.0-1", "1.18.0-2")); // -1`,
    solution: `function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const parse = (v: string) => {
    const [e, rest] = v.includes(':') ? v.split(':') : ['0', v];
    const [ver, rev = '0'] = rest.split('-');
    return { epoch: parseInt(e, 10), ver, rev };
  };
  const cmpNum = (x: string, y: string) => {
    const xp = x.split('.').map(Number);
    const yp = y.split('.').map(Number);
    for (let i = 0; i < Math.max(xp.length, yp.length); i++) {
      const diff = (xp[i] ?? 0) - (yp[i] ?? 0);
      if (diff < 0) return -1 as const;
      if (diff > 0) return 1 as const;
    }
    return 0 as const;
  };
  const pa = parse(a), pb = parse(b);
  if (pa.epoch !== pb.epoch) return pa.epoch < pb.epoch ? -1 : 1;
  const vc = cmpNum(pa.ver, pb.ver);
  if (vc !== 0) return vc;
  return cmpNum(pa.rev, pb.rev);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between apt update and apt upgrade?',
      options: [
        'They do the same thing',
        'update downloads packages; upgrade installs them',
        'update refreshes the package index; upgrade installs newer versions',
        'update applies security patches only; upgrade updates everything',
      ],
      answer: 2,
      explanation: 'apt update refreshes the local metadata/index from repositories (no packages installed). apt upgrade then installs available newer versions based on that refreshed index.',
    },
    {
      q: 'Which command shows which installed package owns /usr/bin/nginx?',
      options: ['apt show nginx', 'dpkg -L nginx', 'dpkg -S /usr/bin/nginx', 'apt-cache policy nginx'],
      answer: 2,
      explanation: 'dpkg -S /path finds which package installed a given file. dpkg -L package lists all files installed by a package. These are inverses of each other.',
    },
    {
      q: 'How do you prevent a package from being upgraded while keeping it installed?',
      options: [
        'apt remove --keep nginx',
        'apt-mark hold nginx',
        'apt lock nginx',
        'dpkg --pin nginx',
      ],
      answer: 1,
      explanation: 'apt-mark hold nginx pins the package at its current version — future apt upgrade commands skip it. apt-mark unhold removes the pin. apt-mark showhold lists all held packages.',
    },
    {
      q: 'What does apt purge do differently than apt remove?',
      options: [
        'Removes binaries and dependencies',
        'Removes binaries AND configuration files',
        'Removes all user data created by the package',
        'Force-removes even if other packages depend on it',
      ],
      answer: 1,
      explanation: 'apt remove removes the package binaries but keeps /etc configuration files. apt purge additionally removes those configuration files. Logs in /var/log are not removed by either.',
    },
    {
      q: 'Which command shows package details including dependencies on Debian/Ubuntu?',
      options: [
        'dpkg --info <package>',
        'apt-cache show <package>',
        'apt list <package>',
        'dpkg -s <package>',
      ],
      answer: 1,
      explanation: 'apt-cache show <package> displays detailed package information from the repository cache: description, dependencies, maintainer, version, size. dpkg -s <package> shows info about an installed package.',
    },
    {
      q: 'What does apt-get autoremove do?',
      options: [
        'Removes all cached package files',
        'Removes packages that were installed as dependencies but are no longer needed',
        'Removes packages not in the official repositories',
        'Removes duplicate package versions',
      ],
      answer: 1,
      explanation: 'autoremove removes packages automatically installed as dependencies that are no longer required (because the dependent package was removed). Run after removing packages to clean up orphaned dependencies.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I add a third-party repository (PPA) on Ubuntu?',
      a: 'Use add-apt-repository ppa:user/repo (installs the signing key + source entry). For custom repos: first add the GPG key (curl -fsSL URL/key.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/repo.gpg), then add to /etc/apt/sources.list.d/: "deb [signed-by=/etc/apt/keyrings/repo.gpg] https://repo.url focal main". Then sudo apt update.',
    },
    {
      q: 'How do I find which package provides a missing command?',
      a: 'Use apt-file search command or apt search command-name. apt-file requires installation (apt install apt-file && apt-file update). Also: command-not-found handler on Ubuntu suggests packages when you type a missing command. For known tools, dpkg -S $(which cmd) shows the source package.',
    },
    {
      q: 'How do I set up automatic security updates on Ubuntu?',
      a: 'Install: apt install unattended-upgrades. Configure: dpkg-reconfigure -plow unattended-upgrades. The config in /etc/apt/apt.conf.d/50unattended-upgrades controls which repos are auto-updated (default: security only). Check logs at /var/log/unattended-upgrades/. For RHEL use dnf-automatic.',
    },
    {
      q: 'What is the difference between apt and apt-get?',
      a: '<strong>apt</strong> is a higher-level, user-friendly CLI (coloured output, progress bars, sensible defaults). <strong>apt-get</strong> is the lower-level tool intended for scripts (stable output format, more options). For scripting/automation use apt-get; for interactive use apt is friendlier. Both use the same dpkg backend. apt install = apt-get install; apt update = apt-get update.',
    },
    {
      q: 'How do you hold a package at a specific version to prevent upgrades?',
      a: '<code>apt-mark hold packagename</code> prevents a package from being upgraded automatically. <code>apt-mark unhold packagename</code> releases it. To install a specific version: <code>apt install package=version</code>. Check held packages with <code>apt-mark showhold</code>. Alternatively use <code>dpkg --set-selections</code> or pin via /etc/apt/preferences.d/.',
    },
    {
      q: 'What is a PPA and how do you add one on Ubuntu?',
      a: 'A <strong>PPA</strong> (Personal Package Archive) on Launchpad hosts third-party packages for Ubuntu. Add with: <code>add-apt-repository ppa:user/ppa-name && apt update</code>. The command adds the GPG key and a source entry to /etc/apt/sources.list.d/. Be cautious: PPAs are not officially vetted. Prefer official repos or Snap/Flatpak for security-critical software.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'apt update refreshes index; apt upgrade installs; apt purge removes + config; dpkg -S finds package owning a file; apt-mark hold pins a version.',
    mustKnow: [
      'Always run apt update before apt install',
      'apt remove keeps config; apt purge removes config files too',
      'dpkg -L pkg = files in package; dpkg -S /path = which package owns file',
      'apt-mark hold pkg prevents upgrades of that package',
      'DEBIAN_FRONTEND=noninteractive needed in scripts and Dockerfiles',
      'dpkg -i pkg.deb then apt --fix-broken install resolves deps',
    ],
    interviewFocus: [
      'What is the difference between apt update and apt upgrade?',
      'How do you install a specific version of a package?',
      'How do you find which package provides a given binary?',
      'How do you set up automatic security updates?',
    ],
  };
}
