import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';

@Component({
  selector: 'app-linux-security-hardening',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    QuizBlockComponent, QnaBlockComponent],
  templateUrl: './security-hardening.html',
  styleUrl: './security-hardening.scss'
})
export class LinuxSecurityHardening {

  quickRef: QuickRefItem[] = [
    { name: 'lynis audit system', type: 'syntax', desc: 'Full system security audit (CIS benchmarks)' },
    { name: 'fail2ban-client status', type: 'syntax', desc: 'Show fail2ban jails and banned IPs' },
    { name: 'auditd + ausearch', type: 'syntax', desc: 'Kernel audit daemon + search audit log' },
    { name: 'chkrootkit / rkhunter', type: 'syntax', desc: 'Rootkit detection tools' },
    { name: 'nmap -sV --script=vuln host', type: 'syntax', desc: 'Vulnerability scan with Nmap scripts' },
    { name: 'openssl s_client -connect host:443', type: 'syntax', desc: 'Test TLS certificate and ciphers' },
    { name: 'aide --check', type: 'syntax', desc: 'File integrity check (AIDE)' },
    { name: 'aa-status', type: 'syntax', desc: 'Show AppArmor profile status' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'CIS Benchmarks and Hardening Principles',
      points: [
        'CIS (Center for Internet Security) benchmarks provide step-by-step hardening guides for Linux distributions. lynis audit system runs an automated assessment.',
        'Principle of least privilege: each service runs with minimum permissions needed. Run web servers as www-data, not root.',
        'Attack surface reduction: disable unused services (systemctl disable bluetooth), remove unused packages, close unused ports.',
        'Defense in depth: multiple layers — firewall, fail2ban, SELinux/AppArmor, file integrity monitoring, audit logging.',
      ],
    },
    {
      heading: 'User and Authentication Hardening',
      points: [
        'Disable root SSH login: PermitRootLogin no in sshd_config. Password auth off: PasswordAuthentication no (keys only).',
        'Strong password policy: install libpam-pwquality and configure /etc/security/pwquality.conf (minlen, dcredit, ucredit, ocredit).',
        'Account lockout: pam_tally2 or pam_faillock locks accounts after N failed attempts.',
        'MFA with PAM: libpam-google-authenticator adds TOTP for SSH and sudo. /etc/pam.d/sshd for SSH MFA.',
        'sudo audit: every sudo command is logged to /var/log/auth.log. Set NOPASSWD sparingly; use command whitelists.',
      ],
    },
    {
      heading: 'fail2ban — Brute Force Protection',
      points: [
        'fail2ban monitors log files and bans IPs that make too many failed attempts. Uses iptables/nftables/ufw to block.',
        'Jails are defined in /etc/fail2ban/jail.local. Each jail has: filter (log pattern), bantime, findtime, maxretry.',
        'Default jails: [sshd] enabled=true. fail2ban-client status shows all jails. fail2ban-client status sshd shows banned IPs.',
        'Custom jail: create /etc/fail2ban/filter.d/myapp.conf with failregex matching your log format.',
        'fail2ban-client set sshd unbanip 1.2.3.4 manually unbans an IP.',
      ],
    },
    {
      heading: 'SELinux and AppArmor',
      points: [
        'SELinux (RHEL/CentOS) and AppArmor (Ubuntu/Debian) are Mandatory Access Control (MAC) systems — enforce policies beyond standard Unix permissions.',
        'SELinux modes: enforcing (blocks and logs violations), permissive (logs only), disabled. getenforce / setenforce.',
        'SELinux contexts: every file and process has a context. ls -Z shows file context. chcon -t httpd_exec_t file changes it.',
        'AppArmor profiles: aa-status shows loaded profiles. aa-complain profile puts a profile in learning mode. aa-enforce enables enforcement.',
        'Both systems add a layer that even root cannot bypass — a compromised web server process cannot read /etc/shadow even as www-data.',
      ],
    },
    {
      heading: 'Audit and Integrity Monitoring',
      points: [
        'auditd logs kernel events: file accesses, permission changes, process executions. Rules in /etc/audit/rules.d/.',
        'ausearch -k keyword searches audit log by key. aureport --summary gives audit summary.',
        'AIDE (Advanced Intrusion Detection Environment) takes a baseline of file hashes and detects changes: aide --init (baseline), aide --check (compare).',
        'Tripwire is a commercial alternative. ossec/wazuh are open-source host-based intrusion detection systems (HIDS).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'System Hardening',
      language: 'bash',
      code: `# Run a security audit
sudo apt install lynis -y
sudo lynis audit system

# SSH hardening (sshd_config)
sudo sed -i 's/#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
echo "MaxAuthTries 3
LoginGraceTime 20
AllowUsers alice bob
Port 2222" | sudo tee -a /etc/ssh/sshd_config

sudo sshd -t && sudo systemctl reload sshd

# Disable unused services
sudo systemctl disable --now avahi-daemon
sudo systemctl disable --now cups
sudo systemctl disable --now rpcbind

# Remove unused packages
sudo apt purge telnet rsh-server ftp -y
sudo apt autoremove -y

# Kernel hardening
sudo tee /etc/sysctl.d/99-hardening.conf << 'EOF'
# Disable IP forwarding (unless router)
net.ipv4.ip_forward = 0
# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
# Log suspicious packets
net.ipv4.conf.all.log_martians = 1
# Disable SYN cookies (enable SYN flood protection)
net.ipv4.tcp_syncookies = 1
# ASLR
kernel.randomize_va_space = 2
EOF
sudo sysctl --system`,
    },
    {
      label: 'fail2ban',
      language: 'bash',
      code: `# Install fail2ban
sudo apt install fail2ban -y

# /etc/fail2ban/jail.local
sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
ignoreip = 127.0.0.1/8 ::1 10.0.0.0/8

[sshd]
enabled = true
port    = 2222
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled  = true
filter   = nginx-limit-req
logpath  = /var/log/nginx/error.log
maxretry = 10
EOF

sudo systemctl enable --now fail2ban

# Status and management
sudo fail2ban-client status              # list jails
sudo fail2ban-client status sshd        # banned IPs in sshd jail
sudo fail2ban-client set sshd unbanip 1.2.3.4
sudo fail2ban-client get sshd bantime`,
    },
    {
      label: 'AppArmor & Audit',
      language: 'bash',
      code: `# AppArmor (Ubuntu)
sudo aa-status                          # show profile status
sudo aa-enforce /etc/apparmor.d/usr.sbin.nginx   # enforce nginx profile
sudo aa-complain /etc/apparmor.d/usr.sbin.nginx  # learning mode

# Create a custom AppArmor profile
sudo aa-genprof /opt/myapp/myapp        # guided profile generation

# SELinux (RHEL)
getenforce                              # Enforcing / Permissive / Disabled
sudo setenforce 1                       # enforcing (temporary)
sudo setsebool -P httpd_can_network_connect on   # allow nginx to connect

# auditd
sudo apt install auditd audispd-plugins
sudo systemctl enable --now auditd

# Audit rules (/etc/audit/rules.d/hardening.rules)
# -w /etc/passwd -p wa -k user-modify
# -w /etc/sudoers -p wa -k sudoers-modify
# -a always,exit -F arch=b64 -S execve -k exec-log

sudo augenrules --load               # load rules
ausearch -k user-modify              # search by key
aureport --summary                   # summary report

# AIDE file integrity
sudo apt install aide
sudo aide --init                     # create baseline database
sudo aide --check                    # compare current to baseline`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What does fail2ban do when it detects too many failed SSH logins?',
      options: [
        'Locks the user account',
        'Blocks the source IP via iptables/nftables',
        'Kills the SSH process',
        'Sends an email alert',
      ],
      answer: 1,
      explanation: 'fail2ban adds an iptables DROP rule for the offending IP. The ban is temporary (bantime). The IP cannot reach the server\'s SSH port until the ban expires or is manually removed.',
    },
    {
      q: 'What is the difference between SELinux enforcing and permissive modes?',
      options: [
        'Enforcing = disabled; permissive = active',
        'Enforcing = blocks violations; permissive = logs violations without blocking',
        'Enforcing = root access only; permissive = all users',
        'They are the same but for different kernel versions',
      ],
      answer: 1,
      explanation: 'Enforcing mode blocks policy violations and logs them. Permissive mode logs violations without blocking — used for debugging and developing policies. Disabled turns SELinux off entirely.',
    },
    {
      q: 'Which tool provides CIS benchmark compliance scanning on Linux?',
      options: ['tripwire', 'lynis', 'auditd', 'chkrootkit'],
      answer: 1,
      explanation: 'lynis is an open-source security auditing tool that checks system hardening against CIS benchmarks and provides a scored report with recommendations.',
    },
    {
      q: 'What does AIDE do?',
      options: [
        'Blocks intrusion attempts in real time',
        'Creates a baseline of file hashes and detects unauthorized changes',
        'Audits sudo usage',
        'Manages AppArmor profiles',
      ],
      answer: 1,
      explanation: 'AIDE (Advanced Intrusion Detection Environment) is a file integrity checker. It creates a baseline database of file hashes, permissions, and attributes. Running aide --check compares the current state to the baseline and reports changes.',
    },
    {
      q: 'What does setting PasswordAuthentication no in sshd_config achieve?',
      options: [
        'Disables SSH entirely',
        'Requires key-based authentication only, disabling password login via SSH',
        'Sets a minimum password length requirement',
        'Disables root login only',
      ],
      answer: 1,
      explanation: 'PasswordAuthentication no forces key-based authentication, preventing brute-force password attacks. Ensure your public key is in ~/.ssh/authorized_keys before applying, then restart sshd. Combine with PermitRootLogin no.',
    },
    {
      q: 'A botnet attacks a server using a different source IP for every single login attempt (distributed brute force, one attempt per IP). Does fail2ban\'s default per-IP ban strategy stop this attack?',
      options: [
        'Yes, fail2ban automatically detects and bans the entire subnet range once it sees a pattern',
        'No — since fail2ban bans are keyed by source IP and each attempt comes from a different IP, no single IP ever accumulates enough failures to trigger a ban, making per-IP banning ineffective against distributed brute force',
        'fail2ban switches to banning by username instead of IP automatically',
        'The attack is blocked because fail2ban has a global rate limit across all IPs by default',
      ],
      answer: 1,
      explanation: 'fail2ban\'s core mechanism counts failures PER SOURCE IP within a time window — it is specifically designed to catch one attacker hammering from one (or a small pool of) address, and does nothing to stop an attack deliberately distributed across many different IPs where each individual IP only ever makes one or two attempts, staying well under any reasonable ban threshold. Defending against genuinely distributed brute force requires different controls layered on top: rate-limiting at a CDN/WAF level with broader heuristics, requiring key-based (not password) SSH auth so brute force is computationally infeasible regardless of attempt count, or moving SSH off the public internet entirely behind a VPN or bastion with its own access controls.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What are the most important steps to harden a new Linux server?',
      a: '1. Update all packages immediately. 2. Configure UFW/firewalld: deny all, allow only needed ports. 3. SSH: disable root login, disable password auth (keys only), rate-limit. 4. Install fail2ban. 5. Create non-root user with sudo. 6. Disable unused services. 7. Configure unattended-upgrades for security patches. 8. Run lynis for a compliance audit. 9. Set up log monitoring and alerting.',
    },
    {
      q: 'How do I check if a server has been compromised?',
      a: 'Check: (1) last and lastb for suspicious logins, (2) dmesg / journalctl for OOM kills or driver errors, (3) ps aux / ss -tulpn for unexpected processes/ports, (4) find / -mtime -1 -type f for recently modified files, (5) aide --check for file integrity violations, (6) /var/log/auth.log for failed/successful auth. Run rkhunter or chkrootkit for rootkit signatures.',
    },
    {
      q: 'How do fail2ban and ufw interact?',
      a: 'fail2ban uses iptables (or nftables) to add DROP rules for banned IPs. When using ufw, configure fail2ban to use ufw as the action: action = %(action_mwl)s in jail.local. Or use banaction = ufw. This ensures bans work through ufw\'s rules. fail2ban-client status shows which IPs are banned regardless of backend.',
    },
    {
      q: 'What is the principle of least privilege in Linux?',
      a: 'Users and processes should have only the minimum permissions necessary to perform their task. Implementation: run services as dedicated non-root users, use sudo for specific commands instead of root shell, set restrictive file permissions (640/750), restrict setuid binaries, use capabilities (setcap) instead of full root for network services, and use namespaces/containers for isolation.',
    },
    {
      q: 'What is visudo and why must you use it to edit sudoers?',
      a: '<strong>visudo</strong> edits /etc/sudoers in a locked, syntax-checked session. It prevents saving a broken sudoers file that could lock you out of sudo. Never edit /etc/sudoers directly. Add custom rules in <strong>/etc/sudoers.d/</strong> files — they survive package upgrades and are easier to manage.',
    },
    {
      q: 'How does AppArmor differ from SELinux?',
      a: 'Both are Mandatory Access Control (MAC) frameworks. <strong>AppArmor</strong> (Ubuntu/SUSE) uses file paths in profiles — simpler to configure with complain/enforce modes. <strong>SELinux</strong> (RHEL/Fedora) uses security labels on every file and process — more granular but harder to configure. Check: <code>aa-status</code> (AppArmor) or <code>getenforce</code> (SELinux).',
    },
  ];
}
