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
  selector: 'app-linux-firewall',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './firewall.html',
  styleUrl: './firewall.scss'
})
export class LinuxFirewall {

  quickRef: QuickRefItem[] = [
    { name: 'ufw status verbose', type: 'syntax', desc: 'Show UFW rules and status' },
    { name: 'ufw allow 22/tcp', type: 'syntax', desc: 'Allow SSH inbound' },
    { name: 'ufw deny 3306/tcp', type: 'syntax', desc: 'Block MySQL port inbound' },
    { name: 'ufw allow from 10.0.0.0/8', type: 'syntax', desc: 'Allow all traffic from subnet' },
    { name: 'iptables -L -n -v', type: 'syntax', desc: 'List all iptables rules (verbose, numeric)' },
    { name: 'iptables -A INPUT -p tcp --dport 80 -j ACCEPT', type: 'syntax', desc: 'Accept inbound TCP on port 80' },
    { name: 'firewall-cmd --list-all', type: 'syntax', desc: 'Show all firewalld zones and rules (RHEL/CentOS)' },
    { name: 'nft list ruleset', type: 'syntax', desc: 'Show nftables ruleset (modern replacement for iptables)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Linux Firewall Stack',
      points: [
        'Netfilter is the kernel framework. iptables, nftables, and ipfw are userspace tools that write rules into Netfilter.',
        'nftables is the modern replacement for iptables (since Linux 3.13). It has a cleaner syntax and better performance. iptables still works via compatibility layer.',
        'UFW (Uncomplicated Firewall) wraps iptables with a simpler interface — default on Ubuntu/Debian.',
        'firewalld wraps nftables (or iptables) with zone-based rules — default on RHEL/CentOS/Fedora.',
        'All tools ultimately configure Netfilter. They can conflict if used together — pick one per system.',
      ],
    },
    {
      heading: 'UFW — Uncomplicated Firewall',
      points: [
        'UFW is disabled by default on Ubuntu. Enable with: sudo ufw enable. Default policy: deny incoming, allow outgoing.',
        'Rules are numbered: ufw status numbered shows numbers. ufw delete N deletes rule N.',
        'Allow by port: ufw allow 80/tcp. Allow by service name: ufw allow "Nginx Full" (uses /etc/ufw/applications.d/).',
        'Allow from specific IP: ufw allow from 203.0.113.5 to any port 22. Limit: ufw limit 22/tcp (rate-limits SSH).',
        'UFW persists across reboots automatically once enabled.',
      ],
    },
    {
      heading: 'iptables — Deep Control',
      points: [
        'Tables: filter (default), nat (source/destination NAT), mangle (packet modification), raw.',
        'Chains: INPUT (inbound to this host), OUTPUT (outbound from this host), FORWARD (routed through this host).',
        'Policy: the default action when no rule matches. -P INPUT DROP sets default drop.',
        'Rules are evaluated top-to-bottom. First match wins. -A appends, -I inserts at position 1 (top), -D deletes.',
        'iptables rules do not persist by default. Save with iptables-save > /etc/iptables/rules.v4; restore with iptables-restore.',
      ],
    },
    {
      heading: 'Connection Tracking and NAT',
      points: [
        'Netfilter tracks connection state: NEW (first packet), ESTABLISHED, RELATED (ICMP error, FTP data). -m state allows stateful rules.',
        'MASQUERADE: dynamic SNAT for internet sharing. DNAT: port forwarding (redirect inbound port to internal server).',
        'iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE — share internet from eth0 with internal network.',
        'echo 1 > /proc/sys/net/ipv4/ip_forward required to enable packet forwarding (router mode).',
      ],
    },
    {
      heading: 'iptables vs nftables vs firewalld',
      points: [
        'iptables is the traditional, widely-documented Linux firewall tool, directly manipulating netfilter rules with a rule-based, chain-oriented syntax — still common in production, extensively documented, but being gradually superseded by newer tooling.',
        'nftables is the modern replacement for iptables, offering a cleaner syntax, better performance for large rule sets, and unified handling of IPv4/IPv6 rules in one framework rather than requiring separate ip6tables commands for IPv6.',
        'firewalld provides a higher-level, zone-based abstraction on top of the underlying netfilter/nftables machinery, common on RHEL/Fedora-family distributions — designed for easier dynamic rule management without requiring a full reload of the entire ruleset for each change.',
        'Regardless of which tool is used, the underlying security principle remains the same: default-deny (block everything not explicitly allowed) is significantly safer than default-allow (block only known-bad traffic), since default-deny fails safe when a new, unanticipated port or service appears.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'UFW',
      language: 'bash',
      code: `# Enable UFW
sudo ufw enable
sudo ufw status verbose

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow/deny by port
sudo ufw allow 22/tcp           # SSH
sudo ufw allow 80/tcp           # HTTP
sudo ufw allow 443/tcp          # HTTPS
sudo ufw deny 3306/tcp          # Block MySQL

# Allow by IP
sudo ufw allow from 203.0.113.5             # any port from this IP
sudo ufw allow from 10.0.0.0/8 to any port 22   # subnet can SSH
sudo ufw allow from 10.0.0.0/8 to any port 5432  # subnet to Postgres

# Rate limiting SSH
sudo ufw limit 22/tcp           # block IPs with >6 connections in 30s

# Delete rules
sudo ufw status numbered        # show with numbers
sudo ufw delete 3              # delete rule #3
sudo ufw delete allow 80/tcp   # delete by rule content

sudo ufw reload`,
    },
    {
      label: 'iptables',
      language: 'bash',
      code: `# View rules
sudo iptables -L -n -v                 # filter table
sudo iptables -t nat -L -n -v          # NAT table

# Flush all (WARNING: removes all rules)
sudo iptables -F

# Basic INPUT rules
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT    # SSH
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT    # HTTP
sudo iptables -A INPUT -i lo -j ACCEPT                # loopback
sudo iptables -P INPUT DROP                            # default drop

# Block specific IP
sudo iptables -A INPUT -s 1.2.3.4 -j DROP
sudo iptables -A INPUT -s 192.168.0.0/24 -j ACCEPT

# Port forwarding (8080 -> 80)
sudo iptables -t nat -A PREROUTING -p tcp --dport 8080 -j REDIRECT --to-port 80

# Persist rules
sudo iptables-save | sudo tee /etc/iptables/rules.v4
# Or install: apt install iptables-persistent`,
    },
    {
      label: 'nftables',
      language: 'bash',
      code: `# View ruleset
sudo nft list ruleset

# Create a basic firewall (nft flush + add)
sudo nft flush ruleset

sudo nft add table inet filter
sudo nft add chain inet filter input '{ type filter hook input priority 0; policy drop; }'
sudo nft add chain inet filter output '{ type filter hook output priority 0; policy accept; }'

# Add rules
sudo nft add rule inet filter input ct state established,related accept
sudo nft add rule inet filter input iif lo accept
sudo nft add rule inet filter input tcp dport 22 accept
sudo nft add rule inet filter input tcp dport { 80, 443 } accept

# View rules
sudo nft list chain inet filter input

# Save ruleset
sudo nft list ruleset | sudo tee /etc/nftables.conf
# Enable nftables service
sudo systemctl enable nftables`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Blocking SSH before allowing it, then enabling UFW',
      wrong: 'sudo ufw enable (without allowing port 22 first — locks yourself out)',
      right: 'sudo ufw allow 22/tcp && sudo ufw enable',
      explanation: 'UFW default deny incoming blocks SSH if it was not explicitly allowed first. Always allow SSH before enabling UFW. UFW may warn about this, but do not skip the allow rule.',
    },
    {
      title: 'Setting iptables default DROP without allowing ESTABLISHED connections',
      wrong: 'iptables -P INPUT DROP (without -m state --state ESTABLISHED,RELATED first)',
      right: 'Add ESTABLISHED/RELATED rule before setting default DROP policy',
      explanation: 'Without allowing established connections, existing TCP sessions (SSH, HTTP) break immediately. Always add -m state --state ESTABLISHED,RELATED -j ACCEPT as the first rule.',
    },
    {
      title: 'Mixing UFW and iptables on the same system',
      wrong: 'Running both ufw enable and manual iptables -A INPUT rules',
      right: 'Choose one: use UFW (which manages iptables) or manage iptables directly',
      explanation: 'UFW generates its own iptables rules. Manual iptables rules may be overwritten or interact unexpectedly. If using UFW, add all rules through ufw commands.',
    },
    {
      title: 'Forgetting to persist iptables rules across reboots',
      wrong: 'Manually running iptables commands expecting them to survive reboot',
      right: 'iptables-save > /etc/iptables/rules.v4 + install iptables-persistent, or use UFW/firewalld which persist automatically',
      explanation: 'iptables rules are in-memory only. On reboot, all rules are cleared unless saved. UFW and firewalld handle persistence automatically.',
    },
  ];

  challenge: Challenge = {
    title: 'Firewall Rule Validator',
    language: 'typescript',
    description: 'Write a function that validates a simple firewall rule set. Given a list of rules (action, protocol, port) and an incoming connection (protocol, port), return whether the connection is ALLOWED or DENIED. Rules are evaluated top-to-bottom; default is DENY.',
    hints: [
      'Rules have action ("ALLOW"|"DENY"), protocol ("tcp"|"udp"|"any"), and port (number|"any")',
      'Evaluate rules in order, return on first match',
      'If no rule matches, return "DENIED" (default deny)',
    ],
    starterCode: `interface Rule { action: 'ALLOW' | 'DENY'; protocol: 'tcp' | 'udp' | 'any'; port: number | 'any'; }
interface Connection { protocol: 'tcp' | 'udp'; port: number; }

function evaluate(rules: Rule[], conn: Connection): 'ALLOWED' | 'DENIED' {
  // Match rules top-to-bottom; default deny
}

const rules: Rule[] = [
  { action: 'ALLOW', protocol: 'tcp', port: 22 },
  { action: 'ALLOW', protocol: 'tcp', port: 443 },
  { action: 'DENY', protocol: 'any', port: 'any' },
];

console.log(evaluate(rules, { protocol: 'tcp', port: 22 }));   // ALLOWED
console.log(evaluate(rules, { protocol: 'tcp', port: 3306 })); // DENIED`,
    solution: `interface Rule { action: 'ALLOW' | 'DENY'; protocol: 'tcp' | 'udp' | 'any'; port: number | 'any'; }
interface Connection { protocol: 'tcp' | 'udp'; port: number; }

function evaluate(rules: Rule[], conn: Connection): 'ALLOWED' | 'DENIED' {
  for (const rule of rules) {
    const protoMatch = rule.protocol === 'any' || rule.protocol === conn.protocol;
    const portMatch = rule.port === 'any' || rule.port === conn.port;
    if (protoMatch && portMatch) return rule.action === 'ALLOW' ? 'ALLOWED' : 'DENIED';
  }
  return 'DENIED';
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the correct order of UFW setup to avoid locking yourself out via SSH?',
      options: [
        'ufw enable → ufw allow 22',
        'ufw allow 22 → ufw enable',
        'ufw default deny → ufw enable → ufw allow 22',
        'ufw reset → ufw enable',
      ],
      answer: 1,
      explanation: 'Always allow SSH before enabling UFW. "ufw allow 22/tcp" then "ufw enable" ensures SSH access is not blocked by the default deny incoming policy.',
    },
    {
      q: 'Which iptables chain processes packets destined for the local machine?',
      options: ['FORWARD', 'OUTPUT', 'INPUT', 'PREROUTING'],
      answer: 2,
      explanation: 'INPUT processes packets whose destination is the local machine. FORWARD is for packets being routed through the machine. OUTPUT is for packets generated by the local machine.',
    },
    {
      q: 'What does "ufw limit 22/tcp" do?',
      options: ['Limit SSH to 22 connections total', 'Rate-limit SSH — block IPs making too many connections', 'Throttle SSH bandwidth to 22 Kbps', 'Allow only 22 simultaneous SSH connections'],
      answer: 1,
      explanation: '"ufw limit" enables rate limiting — it blocks IPs that attempt more than 6 connections in 30 seconds. Useful to slow brute-force SSH attacks.',
    },
    {
      q: 'What is the modern replacement for iptables on the Linux kernel?',
      options: ['ipchains', 'ipfw', 'nftables', 'pf'],
      answer: 2,
      explanation: 'nftables replaced iptables as the preferred userspace tool for Netfilter since Linux 3.13. It has a unified syntax for IPv4/IPv6/ARP rules and better performance.',
    },
    {
      q: 'What are the three default chains in the iptables filter table?',
      options: [
        'ACCEPT, DROP, REJECT',
        'INPUT, OUTPUT, FORWARD',
        'PREROUTING, POSTROUTING, MANGLE',
        'ALLOW, DENY, LOG',
      ],
      answer: 1,
      explanation: 'The filter table has INPUT (packets destined for the local host), OUTPUT (packets from the local host), and FORWARD (packets routed through). Default policies of DROP or ACCEPT apply when no rule matches.',
    },
    {
      q: 'What does ufw default deny incoming achieve?',
      options: [
        'Drops outgoing traffic by default',
        'Sets the default INPUT policy to DROP so no incoming connections are allowed unless explicitly permitted',
        'Disables UFW entirely',
        'Only applies to IPv6 traffic',
      ],
      answer: 1,
      explanation: 'ufw default deny incoming sets the default policy for incoming connections to deny. You then allow specific ports/services with ufw allow 22/tcp, etc. Combined with ufw default allow outgoing for a typical server setup.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I allow access from only specific IPs using UFW?',
      a: 'Use: ufw allow from <IP> to any port <PORT>. Example: ufw allow from 203.0.113.5 to any port 22 (only this IP can SSH). For subnet access: ufw allow from 10.0.0.0/8 to any port 5432. Delete the general allow rule if you want to restrict further.',
    },
    {
      q: 'What is the difference between UFW and firewalld?',
      a: 'Both are frontends for the kernel\'s Netfilter. UFW (Uncomplicated Firewall) is default on Ubuntu/Debian and uses simple allow/deny syntax. firewalld is default on RHEL/CentOS/Fedora and uses zone-based rules (trusted, public, drop zones) with runtime and permanent configuration. Choose based on your distro convention.',
    },
    {
      q: 'How do I check if a firewall is blocking traffic?',
      a: 'Use tcpdump on the server to see if packets arrive (sudo tcpdump -i eth0 port 8080). If packets arrive but get no response, check iptables/ufw rules. Use ufw status verbose or iptables -L -n -v. If packets do not arrive at all, the firewall may be upstream (cloud security group, hardware firewall). Also check ss -tulpn to verify the service is listening.',
    },
    {
      q: 'What is the difference between iptables and nftables?',
      a: '<strong>iptables</strong> is the legacy Linux firewall (separate IPv4/IPv6 tools, complex syntax). <strong>nftables</strong> is the modern replacement: unified IPv4/IPv6, cleaner syntax, better performance via nft command. Most distributions (Debian 10+, RHEL 8+) default to nftables. UFW and firewalld are frontends that may use either backend. New deployments should prefer nftables or a frontend like UFW.',
    },
    {
      q: 'How do you list and flush current iptables rules?',
      a: '<code>iptables -L -n -v</code> lists all rules with packet/byte counters (no DNS lookup). <code>iptables -L -n -v --line-numbers</code> shows rule numbers for deletion. <code>iptables -D CHAIN rule-num</code> deletes a specific rule. <code>iptables -F</code> flushes all rules (removes ALL rules — dangerous on remote servers!). Save rules: <code>iptables-save > /etc/iptables/rules.v4</code>.',
    },
    {
      q: 'What is a stateful firewall and why does it matter?',
      a: 'A stateful firewall tracks connection state (NEW, ESTABLISHED, RELATED, INVALID) and allows return traffic automatically. Rule: <code>-A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT</code> allows responses to outbound connections without writing separate inbound rules. This is far more secure than stateless (per-packet) filtering where you must explicitly allow return traffic.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'UFW wraps iptables (Ubuntu); firewalld wraps nftables (RHEL); always allow SSH before enabling; ESTABLISHED rule needed before default DROP.',
    mustKnow: [
      'ufw allow 22/tcp before ufw enable — never lock yourself out',
      'ufw limit 22/tcp rate-limits SSH brute-force attempts',
      'iptables: INPUT=inbound, OUTPUT=outbound, FORWARD=routed',
      'iptables rules are volatile — persist with iptables-save or use UFW/firewalld',
      'ESTABLISHED,RELATED rule needed first when setting default INPUT DROP',
      'nftables is the modern kernel interface; iptables works via compatibility shim',
    ],
    interviewFocus: [
      'What is the correct sequence to set up UFW without losing SSH access?',
      'What is the difference between INPUT, OUTPUT, and FORWARD chains?',
      'How do you rate-limit SSH connection attempts at the firewall level?',
      'How do you persist iptables rules across reboots?',
    ],
  };
}
