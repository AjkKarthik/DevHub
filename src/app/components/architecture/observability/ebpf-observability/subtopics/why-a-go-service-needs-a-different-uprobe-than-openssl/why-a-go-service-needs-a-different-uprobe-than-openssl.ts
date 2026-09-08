import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'An OpenSSL Uprobe Sees Nothing for a Go Service',
    points: [
      'The main page’s own QnA on TLS visibility names the exact mechanism eBPF tools use: "uprobes on OpenSSL SSL_read/SSL_write to capture plaintext data AFTER decryption." That description, and the theory bullet built on it, originally implied this works for any service doing application-level TLS.',
      'Verified via research: a uprobe on SSL_read/SSL_write only ever fires for a process that has libssl.so (OpenSSL) actually loaded and calling into it. Go’s standard library TLS implementation, crypto/tls, is written entirely in Go — it re-implements the TLS protocol from scratch and never links or calls OpenSSL at all. An OpenSSL uprobe attached to a Go service’s process observes nothing, because the function it’s watching for is never called.',
      'Confirmed against Pixie’s own published eBPF research (which names the exact alternate targets, crypto/tls.(*Conn).Read and crypto/tls.(*Conn).writeRecordLocked) and Brendan Gregg’s own early exploratory work on Go function tracing with bcc/BPF, which independently documents the SAME underlying obstacle from a completely different angle — Go’s runtime.',
    ],
  },
  {
    heading: 'Why Even the Right Symbol Isn’t Enough — Go’s Stack Gets in the Way',
    points: [
      'A normal uprobe (function ENTRY) works the same way for a Go binary as for a C one — the plaintext argument is available before the function body runs. The genuinely different obstacle is the RETURN side: a plain uretprobe (return probe), the standard technique for reading a function’s return value, works by hijacking the return address on the stack.',
      'Go’s goroutines use small, GROWABLE stacks that the Go runtime can move in memory as a goroutine’s call depth changes — confirmed independently by both the eCapture project’s own documentation and Brendan Gregg’s own early findings, which separately observed uretprobes causing Go programs to crash or misbehave. A hijacked return address that assumes a fixed, non-moving stack (the assumption C programs safely meet) can point at the wrong place entirely once Go moves the stack underneath it.',
      'The documented workaround: rather than using a uretprobe at all, DISASSEMBLE the target Go function ahead of time to find the exact byte offsets of its own <code>RET</code> instructions, then attach ordinary (non-return) uprobes directly at those offsets. Tools like <code>go-bpf-gen</code> automate exactly this — generating the disassembly-derived offsets so the resulting probe behaves like a return probe without ever using the mechanism that crashes Go.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Two Different Targets for the Same Underlying Goal',
    language: 'bash',
    code: `# ── OpenSSL-linked service (works with a plain uprobe/uretprobe pair) ──
# The standard technique the main page's own QnA names:
bpftrace -e '
  uprobe:/usr/lib/x86_64-linux-gnu/libssl.so.3:SSL_read {
    printf("SSL_read called by PID %d\\n", pid);
  }
  uretprobe:/usr/lib/x86_64-linux-gnu/libssl.so.3:SSL_read {
    printf("SSL_read returned for PID %d\\n", pid);
  }
'
# -> Fires for ANY process that has libssl.so loaded and calls into it --
#    Python, Ruby, Node.js (which uses OpenSSL bindings), curl, nginx...

# ── Go service using crypto/tls (needs a completely different target) ──
# A plain entry uprobe on the Go symbol works the same way as C:
bpftrace -e '
  uprobe:/path/to/go-binary:"crypto/tls.(*Conn).Read" {
    printf("Go crypto/tls Read called by PID %d\\n", pid);
  }
'
# -> But a uretprobe on the SAME symbol risks crashing the Go process,
#    because Go's growable, moving goroutine stacks can invalidate the
#    hijacked return address a uretprobe depends on.
#
# The documented workaround: disassemble the function to find its own
# RET instruction offsets, and place plain (non-return) uprobes there
# instead -- exactly what tools like go-bpf-gen automate.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A team runs a Node.js payment service and a Go inventory service in the same cluster, and deploys a single eBPF tool configured only with the standard OpenSSL SSL_read/SSL_write uprobe. Which of the two services’ TLS traffic will actually be visible, and why does Node.js end up on the "visible" side despite not being a C program either?',
  hint: 'Node.js\'s own <code>https</code> module is built on top of a specific, well-known cryptography library — check which one, and whether it\'s the same library the OpenSSL uprobe is watching for.',
  solution: `// The payment service (Node.js) IS visible; the inventory service
// (Go) is NOT -- even though neither is written in C.
//
// Node.js's TLS implementation is built on top of OpenSSL (bundled
// directly into the Node.js binary since Node links against it for its
// crypto module) -- so a Node.js process genuinely does call into
// SSL_read/SSL_write under the hood when it does TLS I/O, exactly the
// function the uprobe is watching. The uprobe doesn't care what
// LANGUAGE called the function, only that libssl's own SSL_read symbol
// was actually invoked somewhere in that process.
//
// Go's crypto/tls, by contrast, is a pure-Go reimplementation with
// zero calls into OpenSSL at all -- there's no SSL_read call for the
// uprobe to ever observe, regardless of how much TLS traffic the Go
// service actually handles. The deciding factor isn't "is this
// service written in a compiled language" or "does it use TLS" -- it's
// specifically whether the process calls into libssl at all.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since Go doesn’t call OpenSSL, Go services are simply invisible to eBPF-based TLS observability altogether — there’s no way to see their traffic without OpenSSL.',
    reality: 'Go services are only invisible to the GENERIC OpenSSL-targeted uprobe specifically — they’re fully observable to a tool that targets the correct Go-specific symbols (<code>crypto/tls.(*Conn).Read</code> and <code>writeRecordLocked</code>) with the disassembly-based workaround for the return side. Purpose-built tools like eCapture ship exactly this Go-specific support; the main page’s own QnA names the mechanism precisely, it just needed to be scoped to the library it actually targets rather than described as universal.',
  },
  {
    thought: 'The Go-specific difficulty is really just about finding the right function NAME to target — once you know the symbol is <code>crypto/tls.(*Conn).Read</code>, the rest works exactly like an OpenSSL uprobe.',
    reality: 'The symbol name is only half the problem, and arguably the easier half. The harder, genuinely Go-specific obstacle is the RETURN side: a normal uretprobe risks corrupting or crashing the target process because Go’s runtime can move a goroutine’s stack in memory in ways a C program’s stack never does — this is a structural difference in how the two languages manage their call stacks, not something that goes away just by knowing the right symbol to watch.',
  },
];

@Component({
  selector: 'app-obs-ebpf-go-uprobe',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './why-a-go-service-needs-a-different-uprobe-than-openssl.html',
  styleUrl: './why-a-go-service-needs-a-different-uprobe-than-openssl.scss',
})
export class WhyAGoServiceNeedsADifferentUprobeThanOpensslSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
