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
  templateUrl: './dns-lookup-uses-threadpool-dns-resolve-never-does.html',
  styleUrl: './dns-lookup-uses-threadpool-dns-resolve-never-does.scss'
})
export class DnsLookupUsesThreadpoolDnsResolveNeverDoesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page already lists dns.lookup() as a thread-pool consumer — the reason it specifically (and not the rest of the dns module) needs the thread pool is worth naming precisely',
      points: [
        'dns.lookup() is implemented as a call to the operating system\'s own getaddrinfo() function — the same blocking, synchronous C function a regular non-Node program would call to resolve a hostname. Since getaddrinfo() is inherently blocking and Node cannot make an arbitrary OS library function asynchronous on its own, dns.lookup() runs this call on the libuv thread pool specifically to avoid blocking the main event loop thread while the OS resolver does its (potentially slow) work.',
        'This also means dns.lookup() inherits whatever hostname resolution behavior the OS itself uses — including reading /etc/hosts, NSS configuration, and any OS-level DNS caching — the same resolution path a shell command like ping or curl would go through on that machine.',
      ]
    },
    {
      heading: 'Why dns.resolve() and its variants are architecturally different, not just "also async"',
      points: [
        'dns.resolve(), dns.resolve4(), dns.resolve6(), and the other resolve*() functions do NOT call getaddrinfo() and do NOT use the thread pool at all. Instead, they use the c-ares library bundled with Node, which implements the DNS protocol directly — sending and receiving actual DNS query/response packets over the network itself, entirely independent of the OS\'s own resolver.',
        'Because this network communication is handled asynchronously by c-ares using the same non-blocking I/O mechanisms Node uses for everything else, resolve*() functions never compete for one of the (default 4) thread pool slots — meaning a burst of resolve4() calls has zero effect on other thread-pool-dependent work (fs reads, crypto hashing) happening at the same time, unlike a burst of dns.lookup() calls, which genuinely can.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'dns.lookup() competes with fs/crypto for thread pool slots',
      language: 'typescript',
      code: `import dns from 'dns';
import { readFile } from 'fs/promises';

// Both of these compete for the SAME 4 (default) thread pool
// slots — dns.lookup() delegates to the OS's blocking
// getaddrinfo(), which runs on the thread pool exactly like an
// fs.readFile() call does.
async function resolveAndRead() {
  const [address, fileData] = await Promise.all([
    new Promise((resolve, reject) =>
      dns.lookup('example.com', (err, addr) => err ? reject(err) : resolve(addr))
    ),
    readFile('config.json', 'utf8'),
  ]);
  return { address, fileData };
}

// A burst of many concurrent dns.lookup() calls genuinely competes
// with, and can delay, unrelated fs/crypto work — because both
// draw from the same fixed-size thread pool.`,
    },
    {
      label: 'dns.resolve4() never touches the thread pool at all',
      language: 'typescript',
      code: `import dns from 'dns';
import { readFile } from 'fs/promises';

async function resolveAndRead() {
  const [addresses, fileData] = await Promise.all([
    new Promise((resolve, reject) =>
      dns.resolve4('example.com', (err, addrs) => err ? reject(err) : resolve(addrs))
    ),
    readFile('config.json', 'utf8'),
  ]);
  return { addresses, fileData };
}

// dns.resolve4() uses c-ares to send/receive DNS packets directly
// over the network, using Node's ordinary async I/O — NOT the
// thread pool. Even a large burst of concurrent resolve4() calls
// has zero effect on how quickly the fs.readFile() call above
// completes, unlike the dns.lookup() version.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A Node.js service does two things concurrently under load: resolves many hostnames via dns.lookup(), and processes many uploaded files via fs.readFile(). The team notices file processing throughput drops noticeably whenever hostname resolution volume spikes, even though the two operations seem completely unrelated. They switch the hostname resolution code to dns.resolve4() instead, and the file-processing slowdown disappears entirely. Explain precisely why swapping DNS functions fixed an issue that seemingly had nothing to do with file reading.',
    hint: 'Does dns.lookup() use the same underlying resource (the thread pool) that fs.readFile() uses? Does dns.resolve4() use that same resource, or a completely different mechanism?',
    solution: 'The two operations were secretly competing for the same limited resource: the libuv thread pool (default size 4). dns.lookup() is implemented as a call to the OS\'s own blocking getaddrinfo() function, which Node runs on the thread pool to avoid blocking the main event loop — exactly the same thread pool that fs.readFile() calls also use. A spike in dns.lookup() volume genuinely occupies thread pool slots that fs.readFile() calls would otherwise be using, causing file processing to queue and slow down, even though the two operations have no logical relationship to each other. dns.resolve4(), in contrast, uses the c-ares library to send and receive DNS protocol packets directly over the network via Node\'s ordinary asynchronous I/O — it never touches the thread pool at all. Switching to dns.resolve4() removed the DNS resolution work from the shared thread pool entirely, freeing those slots for fs.readFile() to use without contention, which is exactly why the file-processing slowdown disappeared.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'All dns module functions are equally asynchronous and equally independent of other I/O operations — dns.lookup() and dns.resolve() should behave the same way under concurrent load.',
      reality: 'This subtopic\'s theory clarifies dns.lookup() specifically routes through the thread pool (via the OS\'s blocking getaddrinfo()), competing with fs/crypto work for the same limited slots — while dns.resolve()/resolve4()/etc. use a completely separate, non-thread-pool mechanism (c-ares) that never competes with anything.'
    },
    {
      thought: 'A slowdown in unrelated file-processing work whenever DNS resolution volume spikes must indicate a bug in the file-handling code itself, since the two operations have no logical connection.',
      reality: 'This subtopic\'s exercise shows this exact symptom can be entirely explained by shared thread-pool contention between dns.lookup() and fs.readFile() — the file-handling code can be completely correct, with the real cause being an unrelated-seeming DNS function competing for the same limited resource.'
    },
    {
      thought: 'dns.resolve() and dns.lookup() return the same kind of result and are interchangeable in any code, so switching between them is purely a stylistic choice with no functional difference.',
      reality: 'This subtopic\'s theory shows a real functional difference beyond just performance — dns.lookup() goes through the OS\'s own resolver (respecting /etc/hosts, NSS config, OS-level DNS caching), while dns.resolve() queries DNS servers directly over the network via c-ares, bypassing the OS resolver\'s behavior entirely.'
    }
  ];
}
