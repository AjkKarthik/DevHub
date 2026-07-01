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
  selector: 'app-linux-networking',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './networking.html',
  styleUrl: './networking.scss'
})
export class LinuxNetworking {

  quickRef: QuickRefItem[] = [
    { name: 'ip addr show', type: 'syntax', desc: 'Show all network interfaces and IP addresses' },
    { name: 'ip route show', type: 'syntax', desc: 'Show kernel routing table' },
    { name: 'ss -tulpn', type: 'syntax', desc: 'TCP/UDP listening ports with process names' },
    { name: 'curl -I https://example.com', type: 'syntax', desc: 'Fetch HTTP headers only (HEAD request)' },
    { name: 'dig +short google.com', type: 'syntax', desc: 'DNS lookup, short output' },
    { name: 'traceroute / tracepath', type: 'syntax', desc: 'Trace network path to a host' },
    { name: 'netstat -rn', type: 'syntax', desc: 'Show routing table (legacy; prefer ip route)' },
    { name: 'tcpdump -i eth0 port 80', type: 'syntax', desc: 'Capture HTTP traffic on eth0' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Network Interface Management',
      points: [
        'ip replaces ifconfig (deprecated). ip addr show (addresses), ip link show (interface state), ip route show (routes).',
        'Interface names: eth0/ens3 (Ethernet), wlan0 (WiFi), lo (loopback 127.0.0.1), docker0 (Docker bridge).',
        'ip addr add 192.168.1.10/24 dev eth0 adds an IP temporarily. For permanent config, edit /etc/netplan/*.yaml (Ubuntu) or /etc/network/interfaces (Debian).',
        'ip link set eth0 up/down brings an interface up or down. ip link set eth0 mtu 9000 sets jumbo frames.',
      ],
    },
    {
      heading: 'DNS Lookup',
      points: [
        'dig is the preferred DNS tool. dig google.com returns full answer. dig +short gives just the IPs. dig -x 8.8.8.8 does reverse DNS.',
        '/etc/resolv.conf contains DNS server addresses. /etc/hosts is checked first for hostname resolution.',
        'dig @8.8.8.8 google.com queries Google\'s DNS directly, bypassing the local resolver.',
        'nslookup (interactive DNS client) and host (simpler than dig) are alternatives available on most systems.',
      ],
    },
    {
      heading: 'Port and Connection Inspection',
      points: [
        'ss -tulpn: -t=TCP, -u=UDP, -l=listening, -p=process, -n=numeric (no DNS lookup). Replaces netstat.',
        'ss -s shows socket summary: total, TCP established, UDP sockets.',
        'ss state established shows active connections. ss dst 8.8.8.8 filters by destination.',
        'lsof -i :8080 shows which process is bound to port 8080. lsof -i tcp shows all TCP connections.',
      ],
    },
    {
      heading: 'Packet Capture and Analysis',
      points: [
        'tcpdump captures packets. -i eth0 specifies interface. -w file.pcap saves to file for Wireshark. -n skips DNS resolution.',
        'tcpdump host 10.0.0.1 captures traffic to/from that IP. port 443 filters by port. and/or/not combine filters.',
        'curl -v shows verbose request/response including headers. curl -o /dev/null -w "%{time_total}" measures response time.',
        'wget --spider URL checks if a URL is reachable without downloading the body.',
      ],
    },
    {
      heading: 'Network Troubleshooting Command Toolkit',
      points: [
        'ping verifies basic IP-level reachability to a host, while traceroute reveals the network path (and which specific hop, if any, is failing) — combining both quickly distinguishes between "the destination is unreachable" and "some intermediate network hop is dropping traffic."',
        'ss (the modern replacement for netstat) shows active network connections and listening ports — ss -tulpn specifically lists TCP/UDP listening sockets with the process name, essential for diagnosing "why is this port already in use" or "is this service actually listening."',
        'dig and nslookup query DNS directly, letting you verify whether a hostname resolution problem is actually a DNS issue (wrong or missing DNS record) versus a network connectivity issue further down the stack — a critical first troubleshooting step for "cannot reach this hostname" reports.',
        'curl -v (verbose mode) reveals the full HTTP request/response cycle including headers and TLS handshake details, useful for diagnosing HTTP-level issues (redirect loops, certificate problems, unexpected response headers) beyond what basic connectivity tools like ping can reveal.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Interface & Route',
      language: 'bash',
      code: `# Interface info
ip addr show             # all interfaces
ip addr show eth0        # specific interface
ip link show             # interface status (UP/DOWN, MAC)
ip -s link               # stats: TX/RX bytes, errors

# Routing
ip route show            # routing table
ip route get 8.8.8.8    # which interface/gateway for this IP
ip route add default via 192.168.1.1   # add default route
ip route del default                    # remove default route

# Temporary IP (lost on reboot)
sudo ip addr add 192.168.1.100/24 dev eth0
sudo ip addr del 192.168.1.100/24 dev eth0

# Permanent (Ubuntu Netplan)
# /etc/netplan/00-installer-config.yaml:
# ethernets:
#   eth0:
#     addresses: [192.168.1.100/24]
#     routes: [{to: default, via: 192.168.1.1}]
#     nameservers: {addresses: [8.8.8.8]}
# sudo netplan apply`,
    },
    {
      label: 'DNS & Ports',
      language: 'bash',
      code: `# DNS
dig google.com                    # full query result
dig +short google.com             # just IPs
dig AAAA google.com               # IPv6 record
dig MX gmail.com                  # mail exchange records
dig -x 8.8.8.8                   # reverse DNS
dig @1.1.1.1 +short google.com   # query Cloudflare DNS directly
host google.com                   # simpler DNS lookup

# Listening ports
ss -tulpn                         # all listening sockets
ss -tulpn | grep :80              # who is on port 80
lsof -i :3000                     # process on port 3000
fuser 80/tcp                      # PID using TCP port 80

# Active connections
ss -tp                            # TCP connections + process
ss state established              # only established TCP
ss -o state time-wait             # TIME_WAIT connections (indicates fast open/close)`,
    },
    {
      label: 'HTTP & Capture',
      language: 'bash',
      code: `# curl
curl -I https://example.com                        # headers only
curl -v https://example.com 2>&1 | head -30        # verbose
curl -o /dev/null -w "%{http_code} %{time_total}s" https://example.com
curl -L https://short.url/path                     # follow redirects
curl -u user:pass https://api.example.com          # basic auth
curl -H "Authorization: Bearer TOKEN" https://api/ # Bearer token
curl -X POST -d '{"key":"val"}' -H "Content-Type: application/json" https://api/data

# tcpdump
sudo tcpdump -i eth0 -n                            # all traffic, no DNS
sudo tcpdump -i eth0 port 80 -A                    # HTTP traffic, ASCII
sudo tcpdump -i any -w /tmp/capture.pcap           # save for Wireshark
sudo tcpdump host 10.0.0.1 and port 443            # filtered

# ping / traceroute
ping -c 4 google.com             # 4 pings
traceroute google.com            # hop-by-hop
mtr --report google.com          # combined ping+trace (real-time)`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using ifconfig instead of ip',
      wrong: 'ifconfig eth0',
      right: 'ip addr show eth0',
      explanation: 'ifconfig is deprecated and not installed by default on modern Linux. ip (from iproute2) is more capable and consistent. ifconfig may be unavailable on minimal cloud images.',
    },
    {
      title: 'Using netstat instead of ss',
      wrong: 'netstat -tulpn',
      right: 'ss -tulpn',
      explanation: 'netstat is part of net-tools which is deprecated. ss is faster, more detailed, and available on all modern distros. It reads directly from kernel socket tables.',
    },
    {
      title: 'Not specifying -n with ss/tcpdump for speed',
      wrong: 'tcpdump -i eth0 port 80',
      right: 'tcpdump -i eth0 -n port 80',
      explanation: 'Without -n, tcpdump/ss performs DNS reverse lookups for every IP — this is slow and can cause output delays. Always use -n for monitoring and log analysis.',
    },
    {
      title: 'Assuming ip addr change survives reboot',
      wrong: 'sudo ip addr add 10.0.0.5/24 dev eth0 (expects to persist)',
      right: 'Edit /etc/netplan/*.yaml and run sudo netplan apply for persistent config',
      explanation: 'ip commands modify the running kernel state only. After reboot, the network is reconfigured from Netplan/ifcfg files. Use ip for testing; edit the config files for persistence.',
    },
  ];

  challenge: Challenge = {
    title: 'CIDR Subnet Calculator',
    language: 'typescript',
    description: 'Write a function that takes a CIDR notation (e.g. "192.168.1.0/24") and returns the network address, broadcast address, and number of usable host addresses.',
    hints: [
      'Extract prefix length from the /n part',
      'Calculate the subnet mask: 32 - prefix bits are host bits',
      'Network address = IP AND mask; Broadcast = IP OR (NOT mask)',
      'Usable hosts = 2^(32-prefix) - 2 (subtract network and broadcast)',
    ],
    starterCode: `interface SubnetInfo {
  network: string;
  broadcast: string;
  usableHosts: number;
}

function calcSubnet(cidr: string): SubnetInfo {
  // e.g. "192.168.1.0/24" -> { network: "192.168.1.0", broadcast: "192.168.1.255", usableHosts: 254 }
}

console.log(calcSubnet("192.168.1.0/24"));
console.log(calcSubnet("10.0.0.0/8"));`,
    solution: `interface SubnetInfo { network: string; broadcast: string; usableHosts: number; }

function calcSubnet(cidr: string): SubnetInfo {
  const [ipStr, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr, 10);
  const ipNum = ipStr.split('.').reduce((acc, o) => (acc << 8) | parseInt(o, 10), 0) >>> 0;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = ipNum & mask;
  const broadcast = (network | ~mask) >>> 0;
  const toIp = (n: number) => [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.');
  return { network: toIp(network), broadcast: toIp(broadcast), usableHosts: Math.pow(2, 32 - prefix) - 2 };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which command shows all TCP listening ports with process names?',
      options: ['netstat -an', 'ss -tulpn', 'ip route show', 'lsof -n'],
      answer: 1,
      explanation: 'ss -tulpn: -t=TCP, -u=UDP, -l=listening sockets only, -p=process name/PID, -n=no DNS lookup. It shows what services are listening and which process owns each socket.',
    },
    {
      q: 'What does dig +short google.com return?',
      options: ['Full DNS query with TTL and record type', 'Only the resolved IP address(es)', 'The DNS server used', 'Time taken for lookup'],
      answer: 1,
      explanation: '+short suppresses the full dig output and returns only the answer values — just the IP address(es). Useful in scripts: IP=$(dig +short example.com | head -1)',
    },
    {
      q: 'Which command shows the routing table and which gateway is used for 8.8.8.8?',
      options: ['ip addr show', 'ip route get 8.8.8.8', 'ss -r', 'route -show'],
      answer: 1,
      explanation: 'ip route get <IP> shows the exact route the kernel would use for that destination, including the outgoing interface and gateway. More useful than reading the full table.',
    },
    {
      q: 'Where does Linux check for hostname resolution before querying DNS?',
      options: ['/etc/resolv.conf', '/etc/hostname', '/etc/hosts', '/etc/nsswitch.conf'],
      answer: 2,
      explanation: '/etc/hosts is checked first (by default, per /etc/nsswitch.conf "hosts: files dns"). Entries here override DNS. 127.0.0.1 localhost and ::1 localhost are always present.',
    },
    {
      q: 'What is the modern replacement for ifconfig?',
      options: [
        'netstat',
        'ip addr (ip a)',
        'ipconfig',
        'route',
      ],
      answer: 1,
      explanation: 'ip (iproute2) replaces the legacy net-tools (ifconfig, route, netstat). ip addr shows interfaces, ip route shows routing table, ip link manages interfaces. netstat is replaced by ss.',
    },
    {
      q: 'What does ss -tulpn display?',
      options: [
        'SSL certificate information',
        'TCP and UDP listening sockets with process names and port numbers',
        'Network route statistics',
        'System socket buffer sizes',
      ],
      answer: 1,
      explanation: 'ss -tulpn: t=TCP, u=UDP, l=listening, p=process info, n=numeric (no DNS). Shows which ports are open and which process owns them. Replaces netstat -tulpn.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I find what is using a TCP port on Linux?',
      a: 'Use ss -tulpn | grep :PORT or lsof -i :PORT. Both show the PID and process name. If the process is running as a different user, you may need sudo to see the process name. fuser PORT/tcp also shows PIDs and can kill them with fuser -k PORT/tcp.',
    },
    {
      q: 'How do I test connectivity to a specific port without curl?',
      a: 'Use nc (netcat): nc -zv host port. -z = scan only (no data), -v = verbose. Returns exit 0 if the port is open. Also: timeout 3 bash -c "cat < /dev/tcp/host/port" (pure bash, no tools needed). telnet host port is the classic approach.',
    },
    {
      q: 'What is the difference between ss and netstat?',
      a: 'Both show socket information, but ss reads directly from kernel socket tables (faster, no parsing /proc/net/ like netstat). ss supports more filter syntax, is pre-installed on modern systems, and is actively maintained. netstat comes from net-tools which is unmaintained. Prefer ss for new scripts.',
    },
    {
      q: 'How do you diagnose a DNS resolution failure?',
      a: 'Steps: (1) <code>cat /etc/resolv.conf</code> — check nameserver is set. (2) <code>dig google.com @8.8.8.8</code> — test with a known-good DNS server. (3) <code>ping 8.8.8.8</code> — check basic connectivity (if this works but DNS fails, it is a DNS issue). (4) <code>systemctl status systemd-resolved</code> — check resolver service. (5) <code>/etc/nsswitch.conf</code> — check name resolution order.',
    },
    {
      q: 'What is the difference between a subnet and a VLAN?',
      a: 'A <strong>subnet</strong> is a logical IP address range (e.g., 192.168.1.0/24) partitioning an IP network for routing. A <strong>VLAN</strong> (Virtual LAN) is a Layer 2 (data link) technology that segments a physical network into isolated broadcast domains using 802.1Q tagging. VLANs separate traffic before routing; subnets determine routing. A single VLAN often maps to a single subnet but they are different concepts.',
    },
    {
      q: 'How do you trace the route packets take to a destination?',
      a: '<strong>traceroute hostname</strong> (UDP by default on Linux) or <strong>mtr hostname</strong> (real-time). traceroute sends packets with incrementing TTL and records each router that sends an ICMP Time Exceeded back. Options: <code>-T</code> for TCP (useful through firewalls), <code>-I</code> for ICMP. <code>mtr</code> combines ping and traceroute, showing packet loss per hop in real time.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ip replaces ifconfig; ss -tulpn shows listening ports; dig for DNS; curl for HTTP; tcpdump for packet capture.',
    mustKnow: [
      'ip addr show (interfaces), ip route show (routes), ip route get HOST (best route)',
      'ss -tulpn: TCP/UDP listening sockets with process names',
      'dig +short domain for DNS; dig @server to query specific resolver',
      '/etc/hosts is checked before DNS; /etc/resolv.conf has nameserver IPs',
      'tcpdump -i eth0 -n port 80 captures HTTP traffic',
      'ip changes are temporary; persist with Netplan/ifcfg files',
    ],
    interviewFocus: [
      'How do you find which process is listening on a given port?',
      'What is the difference between ip and ifconfig?',
      'How do you test if port 443 is reachable on a remote host?',
      'How do you trace the path packets take to reach a host?',
    ],
  };
}
