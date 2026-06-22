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
  selector: 'app-linux-ssh',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './ssh.html',
  styleUrl: './ssh.scss'
})
export class LinuxSsh {

  quickRef: QuickRefItem[] = [
    { name: 'ssh user@host', type: 'syntax', desc: 'Connect to host as user' },
    { name: 'ssh -i ~/.ssh/mykey.pem user@host', type: 'syntax', desc: 'Connect with specific private key' },
    { name: 'ssh-keygen -t ed25519 -C "email@example.com"', type: 'syntax', desc: 'Generate Ed25519 keypair (modern, recommended)' },
    { name: 'ssh-copy-id user@host', type: 'syntax', desc: 'Install public key on remote host' },
    { name: 'ssh -L 8080:localhost:80 user@host', type: 'syntax', desc: 'Local tunnel: localhost:8080 → remote:80' },
    { name: 'scp file.txt user@host:/tmp/', type: 'syntax', desc: 'Copy file to remote host' },
    { name: 'rsync -avz src/ user@host:dest/', type: 'syntax', desc: 'Sync directory over SSH (efficient)' },
    { name: 'ssh -N -D 1080 user@host', type: 'syntax', desc: 'SOCKS proxy via SSH tunnel' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'SSH Key Authentication',
      points: [
        'SSH uses asymmetric cryptography. The private key stays on your machine; the public key goes on the server in ~/.ssh/authorized_keys.',
        'Key types: ed25519 (preferred, smaller and faster), rsa 4096 (compatible with older systems), ecdsa. Never use rsa 1024 (broken) or dsa (deprecated).',
        'ssh-keygen -t ed25519 -C "email" generates the pair. The -C comment identifies the key. -f specifies the output file path.',
        'chmod 700 ~/.ssh && chmod 600 ~/.ssh/id_ed25519 && chmod 644 ~/.ssh/id_ed25519.pub — SSH enforces these permissions.',
        'ssh-add ~/.ssh/mykey adds the key to the SSH agent so you do not re-enter the passphrase for each connection.',
      ],
    },
    {
      heading: 'sshd Configuration',
      points: [
        '/etc/ssh/sshd_config controls the SSH daemon. Key settings: Port, PermitRootLogin, PasswordAuthentication, PubkeyAuthentication, AllowUsers.',
        'Best practices: set PermitRootLogin no, PasswordAuthentication no (keys only), Port 2222 (obscurity), AllowUsers alice bob.',
        'After changing sshd_config, validate with: sshd -t (test config) then systemctl reload ssh (not restart — avoids breaking existing sessions).',
        'MaxAuthTries 3 limits login attempts. LoginGraceTime 20 reduces the authentication window.',
      ],
    },
    {
      heading: 'SSH Tunneling',
      points: [
        'Local forwarding: ssh -L local_port:remote_host:remote_port user@jump. Traffic to local_port goes through SSH to remote_host:remote_port.',
        'Remote forwarding: ssh -R remote_port:localhost:local_port user@server. Exposes local service on the remote server.',
        'Dynamic forwarding: ssh -N -D 1080 user@server creates a SOCKS5 proxy. Configure browser to use localhost:1080.',
        '-N = no command (just tunnel), -f = run in background, -M / ControlMaster = multiplex connections on one TCP socket.',
      ],
    },
    {
      heading: 'SSH Config File',
      points: [
        '~/.ssh/config allows per-host aliases, keys, and options — avoids typing long commands.',
        'Host * block sets global defaults. Host bastion sets per-host overrides.',
        'ProxyJump (or ProxyCommand with nc) enables jump host / bastion host access.',
        'ControlMaster auto + ControlPath /tmp/ssh-%r@%h:%p multiplexes connections — subsequent ssh to the same host reuses the socket (very fast).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Keys & Auth',
      language: 'bash',
      code: `# Generate key pair
ssh-keygen -t ed25519 -C "alice@company.com"
# or RSA for older compatibility
ssh-keygen -t rsa -b 4096 -C "alice@company.com"

# Copy public key to server
ssh-copy-id alice@10.0.0.5
# Manual alternative:
cat ~/.ssh/id_ed25519.pub | ssh alice@10.0.0.5 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# Fix permissions (SSH refuses wrong perms)
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
chmod 600 ~/.ssh/authorized_keys

# SSH agent (avoid passphrase re-entry)
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
ssh-add -l                        # list loaded keys`,
    },
    {
      label: 'Config File',
      language: 'bash',
      code: `# ~/.ssh/config — per-host settings

Host bastion
    HostName 203.0.113.10
    User ec2-user
    IdentityFile ~/.ssh/prod.pem
    Port 22

Host prod-db
    HostName 10.0.1.20
    User alice
    ProxyJump bastion             # jump through bastion
    IdentityFile ~/.ssh/prod.pem

Host *
    ServerAliveInterval 30        # keep-alive every 30s
    ServerAliveCountMax 3
    AddKeysToAgent yes
    IdentityFile ~/.ssh/id_ed25519

# Connection multiplexing (reuse TCP connection)
Host *
    ControlMaster auto
    ControlPath /tmp/ssh-%r@%h:%p
    ControlPersist 10m

# Usage:
# ssh bastion         — connects to 203.0.113.10
# ssh prod-db         — connects via bastion automatically`,
    },
    {
      label: 'Tunnels & SCP',
      language: 'bash',
      code: `# Local tunnel: forward localhost:8080 to server's port 80
ssh -L 8080:localhost:80 alice@server.example.com
# Now: curl http://localhost:8080 hits server:80

# Access a DB behind a bastion
ssh -L 5432:prod-db.internal:5432 alice@bastion.example.com
# Then: psql -h localhost -p 5432 -U dbuser mydb

# Remote tunnel: expose local port 3000 on server as port 3000
ssh -R 3000:localhost:3000 alice@server.example.com

# SOCKS proxy (browse through server)
ssh -N -f -D 1080 alice@server.example.com
# Configure browser SOCKS5: localhost:1080

# File transfer
scp file.txt alice@server:/tmp/
scp -r dir/ alice@server:/home/alice/
scp -i ~/.ssh/mykey.pem file.txt ubuntu@1.2.3.4:/tmp/

# rsync (faster than scp for large dirs)
rsync -avz --progress src/ alice@server:/var/app/
rsync -avz --delete src/ alice@server:/var/app/   # mirror (delete extra)

# Secure sshd_config
# Port 2222
# PermitRootLogin no
# PasswordAuthentication no
# AllowUsers alice bob
# MaxAuthTries 3`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Adding new SSH rules without keeping a live session open',
      wrong: 'Logging out and applying PermitRootLogin no without verifying key auth works',
      right: 'Keep a live SSH session open while testing new sshd_config changes in a second terminal',
      explanation: 'If you lock yourself out by misconfiguring sshd, you need console/VNC access to fix it. Always test new config (sshd -t) and keep a live session open before systemctl reload ssh.',
    },
    {
      title: 'Using RSA 2048 when Ed25519 is available',
      wrong: 'ssh-keygen -t rsa -b 2048',
      right: 'ssh-keygen -t ed25519 -C "email"',
      explanation: 'Ed25519 keys are smaller, faster, and more secure than RSA 2048. They are supported by all modern SSH versions (OpenSSH 6.5+, 2013). Only use RSA for compatibility with very old systems.',
    },
    {
      title: 'Storing private keys without a passphrase',
      wrong: 'ssh-keygen with empty passphrase for "convenience"',
      right: 'Set a strong passphrase + use ssh-agent to cache it',
      explanation: 'Without a passphrase, a stolen private key file gives full access to all servers. With a passphrase + ssh-agent, you type the passphrase once per session and ssh-agent handles subsequent connections.',
    },
    {
      title: 'Using scp for large or incremental transfers',
      wrong: 'scp -r large-dir/ user@host:/dst/',
      right: 'rsync -avz --progress large-dir/ user@host:/dst/',
      explanation: 'scp copies every file every time. rsync detects changed files (via checksum or modification time) and only transfers deltas — much faster for incremental updates and large directories.',
    },
  ];

  challenge: Challenge = {
    title: 'SSH Config Parser',
    language: 'typescript',
    description: 'Write a function that parses a simplified ~/.ssh/config file and returns a map of host aliases to their configuration objects (HostName, User, Port, IdentityFile).',
    hints: [
      'Each "Host" keyword starts a new block',
      'Settings belong to the most recently seen Host',
      'A wildcard "Host *" provides defaults',
    ],
    starterCode: `interface HostConfig { HostName?: string; User?: string; Port?: number; IdentityFile?: string; }

function parseSshConfig(content: string): Map<string, HostConfig> {
  // Returns a Map of alias -> config object
}

const sample = \`Host bastion
    HostName 10.0.0.5
    User ec2-user
    Port 2222

Host *
    User ubuntu
    Port 22\`;

const configs = parseSshConfig(sample);
console.log(configs.get('bastion')); // { HostName: '10.0.0.5', User: 'ec2-user', Port: 2222 }`,
    solution: `interface HostConfig { HostName?: string; User?: string; Port?: number; IdentityFile?: string; }

function parseSshConfig(content: string): Map<string, HostConfig> {
  const result = new Map<string, HostConfig>();
  let current: string | null = null;

  for (const line of content.split('\\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split(/\\s+/);
    const val = rest.join(' ');
    if (key === 'Host') {
      current = val;
      result.set(current, {});
    } else if (current) {
      const cfg = result.get(current)!;
      if (key === 'HostName') cfg.HostName = val;
      else if (key === 'User') cfg.User = val;
      else if (key === 'Port') cfg.Port = parseInt(val, 10);
      else if (key === 'IdentityFile') cfg.IdentityFile = val;
    }
  }
  return result;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which SSH key type is recommended for new key generation?',
      options: ['rsa-1024', 'rsa-2048', 'ed25519', 'dsa-1024'],
      answer: 2,
      explanation: 'Ed25519 is the recommended modern choice: small keys (256-bit), fast operations, and no known weaknesses. RSA 4096 is acceptable for legacy compatibility. DSA and RSA 1024 are broken.',
    },
    {
      q: 'What does ssh -L 3306:db.internal:3306 user@bastion do?',
      options: [
        'Opens port 3306 on the remote bastion server',
        'Forwards localhost:3306 through bastion to db.internal:3306',
        'Scans bastion for open ports',
        'Copies files from db.internal to localhost',
      ],
      answer: 1,
      explanation: 'Local port forwarding -L local:remote_host:remote_port creates a tunnel: connections to localhost:3306 are forwarded through bastion to db.internal:3306.',
    },
    {
      q: 'Where should you put a server\'s authorized SSH public keys?',
      options: ['/etc/ssh/authorized_keys', '~/.ssh/known_hosts', '~/.ssh/authorized_keys', '~/.ssh/id_rsa.pub'],
      answer: 2,
      explanation: '~/.ssh/authorized_keys in the target user\'s home directory (mode 600, ~/.ssh mode 700). The SSH daemon checks this file to authorize key-based logins.',
    },
    {
      q: 'What does sshd -t do?',
      options: ['Start SSH in test mode', 'Test/validate sshd_config syntax without applying', 'Show connection test results', 'Enable trace logging'],
      answer: 1,
      explanation: 'sshd -t (test) parses /etc/ssh/sshd_config and reports any syntax errors without starting or restarting the daemon. Always run this after editing sshd_config before reloading.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I set up a jump host (bastion) in my SSH config?',
      a: 'Add ProxyJump to your ~/.ssh/config: Host internal-server / HostName 10.0.0.50 / ProxyJump bastion-user@bastion.example.com. Then ssh internal-server connects automatically through the bastion. -J flag works from command line: ssh -J user@bastion user@internal.',
    },
    {
      q: 'How do I add a passphrase-protected key to ssh-agent?',
      a: 'Start the agent: eval "$(ssh-agent -s)". Add the key: ssh-add ~/.ssh/id_ed25519 (prompts for passphrase once). Verify: ssh-add -l. The agent holds the decrypted key in memory for the session. On macOS, ssh-add --apple-use-keychain stores the passphrase in Keychain. AddKeysToAgent yes in ~/.ssh/config automates this.',
    },
    {
      q: 'How do I harden an SSH server for production?',
      a: 'In /etc/ssh/sshd_config: PermitRootLogin no, PasswordAuthentication no (keys only), PubkeyAuthentication yes, AllowUsers alice bob, MaxAuthTries 3, LoginGraceTime 20. Also: change Port from 22 (reduces noise), install fail2ban to block brute-force IPs, use ufw limit 22/tcp for rate limiting. Validate with sshd -t before reloading.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Ed25519 keys; ssh-copy-id to deploy; ~/.ssh/config for aliases and jump hosts; -L for local tunnels; sshd_config hardens the server.',
    mustKnow: [
      'ssh-keygen -t ed25519 (prefer over RSA); passphrase + ssh-agent for security + convenience',
      'chmod 700 ~/.ssh && chmod 600 private_key — SSH enforces these',
      '~/.ssh/config: Host aliases, ProxyJump for bastions, ControlMaster for multiplexing',
      'ssh -L local_port:host:remote_port for local port forwarding',
      'sshd_config: PermitRootLogin no, PasswordAuthentication no (keys only)',
      'sshd -t validates config before applying; systemctl reload ssh (not restart)',
    ],
    interviewFocus: [
      'How does SSH public-key authentication work?',
      'What is an SSH jump host and how do you configure one?',
      'How do you harden an SSH server to reduce attack surface?',
      'What is the difference between local and remote SSH port forwarding?',
    ],
  };
}
