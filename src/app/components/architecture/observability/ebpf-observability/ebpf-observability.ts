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

const quickRef: QuickRefItem[] = [
  { name: 'eBPF',         type: 'keyword', desc: 'Extended Berkeley Packet Filter — a Linux kernel subsystem that runs sandboxed programs in kernel space. Zero-overhead observability without modifying application code.' },
  { name: 'kprobe',       type: 'keyword', desc: 'eBPF hook point: attaches to any kernel function call. Used to observe system calls, TCP events, scheduler decisions.' },
  { name: 'uprobe',       type: 'keyword', desc: 'User-space probe: attaches to a specific function in a user-space binary. Can observe functions in Node.js, Go, or any native binary without modifying it.' },
  { name: 'Cilium',       type: 'keyword', desc: 'eBPF-based Kubernetes network + observability. Uses eBPF for policy enforcement and automatic golden-signal metric collection without sidecars.' },
  { name: 'Pixie',        type: 'keyword', desc: 'eBPF-based Kubernetes observability platform. Auto-instruments service communication, SQL queries, and HTTP calls without any code changes.' },
  { name: 'BCC / bpftrace', type: 'keyword', desc: 'Kernel developer toolkits for writing eBPF programs. `bpftrace` is a high-level scripting language for one-liners. `BCC` provides Python/Lua bindings for more complex programs.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is eBPF?',
    points: [
      'eBPF (Extended Berkeley Packet Filter) allows sandboxed programs to run in the Linux kernel without modifying kernel source code or loading kernel modules. It is the foundation of a new generation of observability, networking, and security tools.',
      'Traditional observability requires: modifying application code to emit metrics/traces, language-specific agents (APM agents), or kernel module insertion (dangerous, requires recompilation). eBPF needs none of these.',
      'eBPF programs are verified before loading — the kernel verifier ensures the program terminates, cannot crash the kernel, and cannot access arbitrary memory. This makes eBPF safer than kernel modules.',
      'eBPF programs can be attached to: system calls (kprobes), network stack events, scheduler events, user-space function calls (uprobes), and hardware performance counters. Each attachment point provides a different observability lens.',
    ],
  },
  {
    heading: 'eBPF for Zero-Code-Change Observability',
    points: [
      'The key value proposition: observe any running service — regardless of programming language, without modifying code, without redeploying, without agents in the data path.',
      'Automatic HTTP/gRPC tracing: eBPF intercepts kernel-level socket reads/writes, parses the HTTP protocol from the wire, and generates traces including method, path, status code, and latency — without any application code instrumentation.',
      'Database query observation: eBPF intercepts the PostgreSQL or MySQL wire protocol, extracting SQL statements and their execution times. You can see slow queries without any query logging configuration or ORM hooks.',
      'Service mesh without sidecars: tools like Cilium implement L7 service mesh features (mutual TLS, traffic policies, golden-signal metrics) using eBPF in the host kernel — no sidecar proxy required, lower latency, lower resource overhead.',
    ],
  },
  {
    heading: 'Tools: Pixie, Cilium, Tetragon',
    points: [
      'Pixie: open-source Kubernetes observability platform that uses eBPF to automatically capture traces, metrics, and profiling data for all services in a cluster. No SDKs, no code changes. Query with PxL (Python-like language) or use built-in dashboards.',
      'Cilium: eBPF-based Kubernetes CNI that provides network observability (Hubble UI — flow visualisation between services), network policy, and L7 visibility into HTTP/gRPC/DNS without modifying pods.',
      'Tetragon (Cilium project): eBPF-based security observability — traces process execution, file access, network connections at the kernel level. Used for security auditing and threat detection.',
      'bpftrace: one-liner observability scripts. `bpftrace -e \'kprobe:sys_read { @reads[comm] = count(); }\'` counts read() syscalls per process name. Useful for ad-hoc kernel-level investigation.',
    ],
  },
  {
    heading: 'eBPF Limitations',
    points: [
      'Kernel version requirement: modern eBPF features require Linux kernel 4.9+ (basic) to 5.8+ (advanced features like ring buffers). Most production Kubernetes clusters meet this requirement, but check before deploying.',
      'Privilege requirement: loading eBPF programs requires `CAP_BPF` (kernel 5.8+) or `CAP_SYS_ADMIN` (older). In Kubernetes, this means privileged DaemonSet pods — a security consideration.',
      'TLS visibility: eBPF can see application-level TLS plaintext via uprobes on the SSL library’s read/write functions — but the default technique targets OpenSSL specifically. A service that doesn’t link OpenSSL for TLS (notably Go\'s standard `crypto/tls`, a pure-Go implementation with no OpenSSL dependency at all) is invisible to a generic OpenSSL-uprobe tool and needs a separate, language-specific hook. Network-layer interception (packet capture) never sees plaintext either way.',
      'Debugging eBPF programs is complex: errors appear in `/sys/kernel/debug/tracing/trace_pipe` and are often cryptic. Use high-level tools (Pixie, Cilium) rather than writing raw eBPF for production observability.',
    ],
  },
  {
    heading: 'How eBPF Enables Zero-Instrumentation Observability',
    points: [
      'eBPF (extended Berkeley Packet Filter) lets sandboxed programs run directly in the Linux kernel, safely observing system calls, network packets, and function calls without modifying application code or requiring the application to link any observability library at all.',
      'This "zero-instrumentation" property is eBPF\'s core advantage over traditional application-level instrumentation (like OpenTelemetry SDKs) — observability can be added or changed for an already-running production system without any code deployment, redeployment, or even application restart.',
      'eBPF programs are verified by the kernel before being allowed to run, guaranteeing they cannot crash the kernel or run indefinitely — this safety verification is what makes it acceptable to run eBPF-based observability tooling in production kernel space, unlike arbitrary unverified kernel modules.',
      'Tools like Cilium, Pixie, and Parca use eBPF to provide network-level observability, automatic service maps, and continuous profiling respectively — representing a growing category of observability tooling that requires no changes to the applications being observed.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'bpftrace one-liners',
    language: 'bash',
    code: `# bpftrace — kernel-level observability one-liners
# (run as root on Linux; requires bpftrace installed)

# ── Count syscalls per process ────────────────────────────────────
bpftrace -e 'tracepoint:syscalls:sys_enter_* { @[comm, probe] = count(); }
             interval:s:5 { print(@); clear(@); exit(); }'
# Shows which processes are making the most system calls
# Useful for diagnosing unexpected CPU usage

# ── Measure file read latency per process ─────────────────────────
bpftrace -e '
  kprobe:vfs_read { @start[tid] = nsecs; }
  kretprobe:vfs_read /@start[tid]/ {
    @latency[comm] = hist(nsecs - @start[tid]);
    delete(@start[tid]);
  }
  interval:s:10 { print(@latency); exit(); }
'
# Shows read latency histogram per process — identifies slow filesystem reads

# ── Count TCP connections by destination port ─────────────────────
bpftrace -e '
  kprobe:tcp_connect {
    $sk = (struct sock *)arg0;
    @connections[ntop(AF_INET, $sk->__sk_common.skc_daddr),
                 $sk->__sk_common.skc_dport] = count();
  }
  interval:s:10 { print(@connections); exit(); }
'
# Shows which services this process is connecting to (IP:port) and how often

# ── Profile CPU usage by stack (5s sample) ────────────────────────
bpftrace -e 'profile:hz:99 /comm == "node"/ { @[ustack] = count(); }
             interval:s:5 { print(@); exit(); }'
# Samples Node.js call stack at 99 Hz for 5 seconds
# Output: flamegraph-ready stack traces showing hot code paths`,
  },
  {
    label: 'Cilium / Hubble',
    language: 'bash',
    code: `# Cilium Hubble — eBPF service flow observability

# Install Cilium with Hubble enabled
helm install cilium cilium/cilium \\
  --namespace kube-system \\
  --set hubble.enabled=true \\
  --set hubble.relay.enabled=true \\
  --set hubble.ui.enabled=true

# ── Observe service flows in real time ───────────────────────────
hubble observe --follow --namespace production

# Sample output:
# Feb  7 14:23:45.123 [payment-service → postgresql:5432] to-endpoint FORWARDED (TCP Flags: SYN)
# Feb  7 14:23:45.124 [postgresql:5432 → payment-service] to-endpoint FORWARDED (TCP Flags: SYN, ACK)
# Feb  7 14:23:45.231 [payment-service → stripe-api:443]  to-endpoint FORWARDED (TCP Flags: SYN)
# Feb  7 14:23:46.891 [stripe-api:443 → payment-service]  to-endpoint FORWARDED (TCP Flags: ACK)

# ── Filter for dropped connections (policy violations) ────────────
hubble observe --verdict DROPPED --namespace production
# Shows connections blocked by CiliumNetworkPolicy
# Useful for debugging "why can't service A talk to service B?"

# ── HTTP L7 visibility ────────────────────────────────────────────
hubble observe --protocol http --namespace production
# Feb  7 14:23:45 [payment-service → catalogue:80] http-request FORWARDED
#   GET /api/products/123 (502.3μs)
# Feb  7 14:23:46 [catalogue:80 → payment-service] http-response FORWARDED
#   200 OK (length: 1842 bytes)

# ── Hubble UI: service map ─────────────────────────────────────────
# kubectl port-forward -n kube-system svc/hubble-ui 12000:80
# Browser: http://localhost:12000
# Visual service connectivity map with real-time flow data
# Shows: connections, error rates, latency between services
# ALL without any code changes or sidecar proxies`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Assuming eBPF has zero overhead',
    wrong: `# "eBPF is zero-overhead — we can instrument everything!"
# Team enables every possible eBPF probe on every service
# - All system calls traced with stack captures
# - All network packets inspected with L7 parsing
# - CPU profiling at 999 Hz for all processes
# Result: 15% CPU overhead on every node
# eBPF overhead is low, not zero — it depends on probe frequency and data captured`,
    right: `# eBPF overhead is proportional to event frequency × work per event
# Low overhead: count syscalls per process (aggregate, no stack capture)
# Medium overhead: capture HTTP request headers (parse per-request data)
# High overhead: capture full packet bodies at high RPS
# Design: capture aggregates for always-on, full data for incident investigation`,
    explanation: 'eBPF has very low overhead compared to traditional instrumentation, but "low" is not "zero." Each eBPF program executes in kernel context for every event it attaches to. At high event rates (millions of system calls per second), even a simple counting program adds CPU cycles. For always-on production use, prefer aggregate operations (histograms, counts) over per-event data capture. Reserve full data capture (stacks, payloads) for targeted investigation windows.',
  },
  {
    title: 'Writing raw eBPF programs instead of using high-level tools',
    wrong: `// Team decides to write custom eBPF programs in C for production observability
// Writes 500-line BPF C program to trace HTTP requests
// Debugging: errors in /sys/kernel/debug/tracing/ are cryptic
// Kernel version differences break the program between nodes
// Security review: raw BPF programs require careful audit
// Maintenance: only the original author can modify it`,
    right: `// Use high-level eBPF platforms designed for production:
// - Pixie: auto-instruments K8s services, PxL query language, dashboards
// - Cilium/Hubble: network observability, no custom code needed
// - Parca/Pyroscope: continuous CPU profiling with eBPF backend
// - Tetragon: security observability (process, file, network events)
// Only write raw bpftrace one-liners for ad-hoc investigation`,
    explanation: 'Writing raw eBPF programs in C is complex, error-prone, and requires expertise in kernel data structures and BPF verifier constraints. For production observability, use high-level platforms (Pixie, Cilium, Pyroscope) that are maintained, security-audited, and handle kernel version compatibility. Raw bpftrace is appropriate for ad-hoc investigation (one-liners for a specific investigation). For anything that runs continuously in production, use a maintained platform.',
  },
  {
    title: 'Deploying eBPF tools without understanding privilege implications',
    wrong: `# Deploy Pixie DaemonSet without security review
# Pixie requires: privileged: true, hostPID: true, hostNetwork: true
# These permissions give the DaemonSet full access to:
# - All processes on the node (hostPID)
# - All network interfaces (hostNetwork)
# - Full kernel access (privileged)
# Security team finds this during audit — emergency removal of Pixie`,
    right: `# Before deploying eBPF tools, security review:
# 1. What privileges does the DaemonSet require?
# 2. Is the tool from a trusted source (CNCF graduated/incubating)?
# 3. What data does it collect — does it capture sensitive payloads?
# 4. Is eBPF loading sandboxed (verifier-checked)?
# 5. Network policy to restrict DaemonSet egress
# Consider: CAP_BPF (kernel 5.8+) vs CAP_SYS_ADMIN for minimal privilege`,
    explanation: 'eBPF observability tools typically run as privileged DaemonSets to access the kernel. This gives them significant access: all processes on the node, all network traffic, kernel function calls. This is appropriate for their purpose but must be reviewed by your security team before deployment. Use CNCF-backed, well-audited tools (Cilium, Pixie, Pyroscope). Understand what data is collected and ensure sensitive payloads (PII in HTTP bodies) are filtered before collection.',
  },
  {
    title: 'Using eBPF for all observability instead of complementing existing telemetry',
    wrong: `// "eBPF replaces all other observability — remove Prometheus, OTel, logs!"
// Team removes all application instrumentation, relying purely on eBPF
// Problems:
// - eBPF sees network-level requests, not business logic (user IDs, order IDs)
// - Cannot add custom spans for internal function calls
// - Cannot add business metrics (revenue, conversion rate)
// - No structured logging context for application-specific debugging`,
    right: `// eBPF complements existing observability — does not replace it
// eBPF adds: zero-code-change baseline (all services), network-level view
// App instrumentation adds: business context, custom spans, structured logs
// Combination:
// - Cilium for service mesh visibility (no sidecar overhead)
// - Pixie for ad-hoc investigation without code changes
// - OTel SDK for custom business spans and attributes
// - Prometheus for application-level business metrics`,
    explanation: 'eBPF provides powerful automatic observability at the kernel and network level, but it cannot see inside application logic — business events, user IDs, custom spans, or business metrics. These require intentional instrumentation. The right architecture combines eBPF tools (for automatic, zero-code-change baseline observability and ad-hoc investigation) with application-level telemetry (OTel, Prometheus client) for business context. eBPF reduces the instrumentation burden but does not eliminate it.',
  },
];

const challenge: Challenge = {
  title: 'eBPF event aggregator',
  language: 'typescript',
  description: `Implement aggregateEvents(events: BpfEvent[]): Map<string, number>
where BpfEvent has: process (string), syscall (string)
Return a Map<processName, count> counting total syscall events per process.
Multiple processes with different syscalls should be counted together per process name.`,
  hints: ['Iterate events, use process as key', 'Increment count with (map.get(key) ?? 0) + 1'],
  starterCode: `interface BpfEvent {
  process: string;
  syscall: string;
}

function aggregateEvents(events: BpfEvent[]): Map<string, number> {
  return new Map();
}

const events: BpfEvent[] = [
  { process: 'node', syscall: 'read' },
  { process: 'node', syscall: 'write' },
  { process: 'nginx', syscall: 'accept' },
  { process: 'node', syscall: 'read' },
  { process: 'nginx', syscall: 'read' },
];
const result = aggregateEvents(events);
console.log(result.get('node'));  // 3
console.log(result.get('nginx')); // 2`,
  solution: `interface BpfEvent {
  process: string;
  syscall: string;
}

function aggregateEvents(events: BpfEvent[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const event of events) {
    counts.set(event.process, (counts.get(event.process) ?? 0) + 1);
  }
  return counts;
}

const events: BpfEvent[] = [
  { process: 'node', syscall: 'read' },
  { process: 'node', syscall: 'write' },
  { process: 'nginx', syscall: 'accept' },
  { process: 'node', syscall: 'read' },
  { process: 'nginx', syscall: 'read' },
];
const result = aggregateEvents(events);
console.log(result.get('node'));
console.log(result.get('nginx'));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the key advantage of eBPF-based observability over traditional APM agents?',
    options: [
      'eBPF collects more data than traditional agents — every byte of every network packet versus sampled traces',
      'eBPF instruments services automatically at the kernel level without modifying application code, redeploying services, or language-specific agents',
      'eBPF-based tools are free and open-source, while traditional APM vendors charge per agent',
      'eBPF tools run in user space and are therefore more stable than kernel module-based agents',
    ],
    answer: 1,
    explanation: 'The key eBPF advantage is zero-code-change instrumentation: any running service — regardless of programming language, without a deployment, without modifying source code — can be observed at the kernel level. Traditional APM requires: adding an SDK or agent to each service, deploying with the agent enabled, language-specific support (Node.js agent, Java agent). eBPF works across all languages equally because it observes at the kernel/network level, below the application layer.',
  },
  {
    q: 'What does Cilium Hubble provide that traditional Prometheus metrics cannot?',
    options: [
      'Higher cardinality metrics — Hubble can track millions of unique label combinations per metric',
      'Persistent metrics storage — Hubble stores 5 years of metrics vs Prometheus\'s 2-week default',
      'Service flow visibility — real-time view of which service calls which, at the network level, including dropped connections and L7 HTTP request/response details without sidecars',
      'Application-level business metrics — Hubble automatically infers revenue impact from service performance',
    ],
    answer: 2,
    explanation: 'Cilium Hubble provides service flow observability — which service is talking to which, what protocols they use, whether connections are allowed or denied by network policy, and L7 HTTP/gRPC request-response details. This is fundamentally different from Prometheus metrics: Prometheus shows aggregated numbers (request rate, error rate) but not the individual connections. Hubble shows the actual network topology and individual flows, powered by eBPF in the kernel without sidecar proxies.',
  },
  { q: 'What is eBPF and why is it revolutionary for system observability?', options: ['eBPF is a Linux kernel module framework for writing custom device drivers', 'eBPF (extended Berkeley Packet Filter) allows safe sandboxed programs to run inside the Linux kernel without modifying kernel source code, enabling zero-instrumentation observability of any system call or network event', 'eBPF is a packet capture format used by Wireshark and similar network analysis tools', 'eBPF is a virtualization layer that abstracts hardware resources for container workloads'], answer: 1, explanation: 'eBPF: programs verified by the kernel verifier and executed in a sandboxed VM inside the kernel. Can observe any system call, kernel function, network packet, or hardware event. Zero-instrumentation: attach eBPF programs to running processes without modifying or restarting them. No need to recompile or instrument application code. Performance: eBPF programs run in kernel space with minimal overhead (much less than ptrace-based debuggers). Use cases in observability: network performance monitoring (every packet visible), system call tracing (what any process is doing), CPU profiling (continuous profiling with zero overhead), security (detect unauthorized system calls). Tools: Cilium (networking), Falco (security), Pixie (full-stack observability), Parca (continuous profiling).' },
  { q: 'How does eBPF enable zero-instrumentation distributed tracing?', options: ['eBPF injects trace context into application code at compile time', 'eBPF intercepts system calls and network events at the kernel level to automatically capture request boundaries, propagate trace context, and emit spans without any changes to application code', 'eBPF requires modifications to the Linux kernel headers but not the application source code', 'Zero-instrumentation tracing via eBPF only works for Go and Rust applications'], answer: 1, explanation: 'eBPF-based auto-instrumentation: attach eBPF probes to kernel network syscalls (send, recv, accept). When an HTTP request arrives, the eBPF probe captures the headers including W3C traceparent. When the application makes an outgoing call, inject the trace context into the headers. The application never sees the tracing logic. No SDK dependency, no code changes, no performance overhead from the application side. Pixie and Cilium Hubble use this approach. Limitations: eBPF tracing cannot capture application-specific span names or custom business attributes (only what is visible at the network layer). Combining eBPF auto-instrumentation with selective application-level instrumentation provides both coverage and detail.' },
  { q: 'What is continuous profiling and how does it differ from on-demand profiling?', options: ['Continuous profiling runs only in CI environments; on-demand profiling runs in production', 'Continuous profiling captures CPU and memory profiles at low overhead continuously in production; on-demand profiling is triggered manually for a fixed duration to investigate a known issue', 'On-demand profiling is more accurate than continuous profiling for production analysis', 'Both terms describe the same technique; the distinction is marketing terminology'], answer: 1, explanation: 'On-demand profiling: triggered when an engineer suspects a problem. Runs for a fixed duration (30-60 seconds). High overhead makes continuous use impractical (traditional profilers sample at 999Hz with ptrace, adding 5-10% overhead). Continuous profiling: always-on, low overhead (1% or less). eBPF-based profilers sample at a low rate continuously. Data accumulates over days and weeks. Value: you can query CPU usage by function for any time range, including before an incident was detected. Compare profiles between last week and today. Find regressions in a CI pipeline. Tools: Parca (open source, Grafana Pyroscope integration), Google Cloud Profiler, Datadog Continuous Profiler, Polar Signals Cloud.' },
  { q: 'What is the eBPF kernel verifier and what safety guarantees does it provide?', options: ['The verifier is a runtime interpreter that re-runs eBPF programs in a safe sandbox before kernel execution', 'The kernel verifier statically analyzes every eBPF program before loading it, rejecting programs that could crash the kernel, execute infinite loops, or access invalid memory', 'The verifier provides runtime isolation between eBPF programs from different processes', 'The verifier is optional and can be bypassed with kernel.bpf_unpriv_disabled=0 for performance'], answer: 1, explanation: 'eBPF kernel verifier: a static analysis engine that checks every eBPF program before it is loaded into the kernel. Safety guarantees: no unbounded loops (must terminate). No invalid memory access (all pointer accesses are bounds-checked). No uninitialized memory reads. Type-safe access to kernel data structures (BTF — BPF Type Format). Cannot call arbitrary kernel functions (only approved BPF helpers). If any check fails, the program is rejected with a detailed error. Result: eBPF programs are as safe as kernel modules but far easier to deploy and debug. The verifier enables untrusted code (from user space applications and vendors like Cilium, Datadog) to run safely in the kernel without risking system stability.' },
];

const qna: QnaItem[] = [
  {
    q: 'How does eBPF compare to service mesh (Istio with Envoy sidecars) for observability?',
    a: '<strong>Istio with Envoy sidecars</strong>: <ul><li>Injects an Envoy proxy sidecar into every pod</li><li>All traffic passes through the proxy — adds ~2ms latency per hop</li><li>Each sidecar uses ~100MB RAM and ~0.1 CPU cores</li><li>Provides: mTLS, traffic management, L7 metrics, distributed tracing</li><li>Requires: sidecar injection annotations, Istio control plane</li></ul><strong>Cilium (eBPF-based)</strong>: <ul><li>No sidecar — eBPF programs run in the host kernel</li><li>Lower latency overhead (microseconds vs milliseconds)</li><li>Lower resource overhead (no per-pod sidecar memory/CPU)</li><li>Provides: mTLS (with WireGuard), network policy, L7 visibility via Hubble</li><li>Requires: Cilium as the CNI (replaces kube-proxy and flannel/calico)</li></ul><strong>When to choose Istio</strong>: existing Istio investment, need advanced traffic management (canary, fault injection), heterogeneous environment with non-Kubernetes workloads.<br><strong>When to choose Cilium</strong>: new clusters, want to minimize resource overhead, eBPF-first approach, simpler operational model.',
  },
  {
    q: 'Can eBPF observe encrypted (TLS) traffic?',
    a: 'It depends on where eBPF is attached, and critically, on which TLS library the target actually uses: <ul><li><strong>After TLS decryption via OpenSSL (yes, for OpenSSL-linked services)</strong>: Pixie and similar tools use uprobes on OpenSSL `SSL_read`/`SSL_write` to capture plaintext data AFTER decryption, before it enters the application. This only works for services that actually link OpenSSL for TLS.</li><li><strong>Go\'s standard `crypto/tls` (no — needs a separate hook)</strong>: Go\'s built-in TLS implementation is written entirely in Go and never calls OpenSSL, so a generic OpenSSL uprobe sees nothing for a Go service. Observing Go TLS traffic needs a language-specific technique — hooking `crypto/tls.(*Conn).Read`/`Write` directly (tools like eCapture implement this, with extra complexity since Go\'s ABI makes return-probing harder than for C-based libraries).</li><li><strong>Network packet level (no)</strong>: tools capturing raw network packets (tcpdump, packet-level eBPF) see only encrypted bytes at the network layer — cannot read the plaintext.</li><li><strong>Kernel TLS (KTLS) (yes)</strong>: if the service uses Kernel TLS (offloads TLS to the kernel), eBPF can intercept at the kernel TLS receive/send path and see plaintext.</li></ul>Practical implication: a Kubernetes cluster mixing Go microservices (common, and notably the language Cilium and Pixie\'s own control planes are written in) with OpenSSL-linked services needs to confirm which TLS-visibility technique actually applies per service, not assume one OpenSSL-based tool covers everything. Either way, tools collecting TLS-decrypted traffic must handle PII carefully — filter or mask sensitive fields before storing captured payload data.',
  },
  { q: 'What are the main use cases for eBPF in production observability?', a: 'Network observability: Cilium Hubble captures all network flows between pods with zero application changes. Latency between services, packet drops, DNS errors. No tcpdump overhead for always-on visibility. Application performance monitoring: Pixie auto-instruments HTTP, gRPC, MySQL, PostgreSQL, Redis, and Kafka calls using eBPF uprobes. Captures full request/response including SQL queries without ORM instrumentation. Security monitoring: Falco uses eBPF to detect unexpected system calls, file accesses, network connections, and privilege escalations in real time. CPU profiling: Parca and Polar Signals Cloud use eBPF for low-overhead continuous profiling. Visualize flame graphs showing which functions consume CPU. File system and I/O: BCC tools (biolatency, ext4slower, opensnoop) analyze disk I/O patterns and slow file system operations. System call tracing: bpftrace and BCC tools trace any syscall across all processes without instrumenting the processes.' },
  { q: 'What is BTF (BPF Type Format) and why is it important for eBPF portability?', a: 'BTF: a debugging information format embedded in the Linux kernel that describes the types of all kernel data structures, functions, and their arguments. Historically: eBPF programs were compiled against specific kernel headers. If the kernel version changed, the eBPF program needed recompilation. With BTF and CO-RE (Compile Once, Run Everywhere): eBPF programs are compiled once with references to kernel data structure offsets. At load time, the BPF loader reads BTF to adjust field offsets for the actual running kernel version. Result: one compiled eBPF binary can run on many different kernel versions without modification. Critical for: distributing eBPF-based tools as pre-compiled binaries. Cloud and enterprise environments with heterogeneous kernel versions. Cilium, Falco, and other tools use CO-RE to distribute universal binaries.' },
  { q: 'What specific L7 visibility capability might an eBPF-based approach like Cilium struggle with compared to a full sidecar proxy like Envoy, despite its lower overhead?', a: 'Full-featured sidecar proxies like Envoy implement complete, mature L7 protocol parsers and can perform deep application-layer transformations (request rewriting, complex retry/circuit-breaking logic, sophisticated traffic-splitting rules) because they fully terminate and re-originate each connection in user space with a mature, extensively-tested codebase. eBPF-based approaches processing packets at the kernel level face more constraints on program complexity and are comparatively newer in their L7 protocol parsing maturity for less common or highly custom protocols — meaning eBPF often provides excellent visibility and enforcement for common patterns (HTTP, gRPC) with lower overhead, but a sidecar proxy may still be the safer choice when you need very sophisticated, custom L7 traffic manipulation rather than just observability and basic policy enforcement.' },
  { q: 'How do you get started with eBPF observability in a Kubernetes cluster?', a: 'Getting started options: Cilium + Hubble (recommended for Kubernetes networking): replace the existing CNI with Cilium. Hubble provides instant network flow visibility through the Hubble UI and CLI. Requires kernel 4.9+ (5.10+ for full feature set). Pixie (application-level auto-instrumentation): deploy via Helm or kubectl apply. Automatically instruments HTTP, gRPC, SQL, Redis without code changes. Provides a web UI and CLI for querying live data. Works on kernel 4.14+. Falco (security): deploy as a DaemonSet. Detects runtime security violations. Integrates with PagerDuty, Slack, and SIEM systems. BCC and bpftrace (ad-hoc debugging): install on individual nodes for interactive debugging. Rich library of pre-built tools for I/O analysis, network analysis, CPU profiling. Prerequisites: kernel 4.9+ for basic eBPF. Kernel 5.10+ recommended. Most EKS, GKE, AKS managed node pools meet the requirements.' },
];

const revision: RevisionSummary = {
  oneLiner: 'eBPF runs sandboxed programs in the Linux kernel — zero-code-change observability across all services. Cilium for network, Pixie for K8s services, bpftrace for ad-hoc investigation.',
  mustKnow: [
    'eBPF: sandboxed kernel programs, verified before loading — safe, no kernel module recompilation needed.',
    'Zero-code instrumentation: intercepts HTTP, SQL, and syscalls at kernel/socket level, across all languages.',
    'Tools: Pixie (K8s auto-instrumentation), Cilium/Hubble (network flows + policy), Tetragon (security), bpftrace (one-liners).',
    'eBPF complements, not replaces application telemetry — cannot observe business logic, user IDs, or custom spans.',
    'Privilege requirements: DaemonSet with CAP_BPF or CAP_SYS_ADMIN — security review required before production.',
    'TLS visibility: hooks on OpenSSL SSL_read/write capture plaintext after decryption — handle PII carefully.',
  ],
  interviewFocus: [
    'What is eBPF and what makes it valuable for observability?',
    'How does Cilium differ from Istio for service mesh observability?',
    'Can eBPF observe TLS-encrypted traffic? How?',
  ],
};

@Component({
  selector: 'app-obs-ebpf',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './ebpf-observability.html',
  styleUrl: './ebpf-observability.scss',
})
export class ObsEbpfObservability {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
