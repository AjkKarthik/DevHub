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
  templateUrl: './uv-threadpool-size-must-be-set-before-first-threadpool-call.html',
  styleUrl: './uv-threadpool-size-must-be-set-before-first-threadpool-call.scss'
})
export class UvThreadpoolSizeMustBeSetBeforeFirstThreadpoolCallSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows UV_THREADPOOL_SIZE set as a shell env var "before Node starts" — the precise trigger is more specific than process startup itself',
      points: [
        'libuv, the C library underlying Node\'s thread pool, does NOT allocate its worker threads the instant the Node.js process boots. Its own documentation states the pool is created lazily: when a function that actually needs the thread pool is first invoked (a call like uv_queue_work, which underlies Node\'s fs operations, some crypto functions, and dns.lookup), libuv preallocates and initializes the maximum number of threads allowed by UV_THREADPOOL_SIZE at that point — not earlier.',
        'In ordinary Node.js apps this distinction rarely matters in practice, since the very first thread-pool-requiring call usually happens early (often within the first few lines of a typical server\'s startup code) — but the precise mechanism is "before the first call that touches the thread pool," not literally "before the process starts."',
      ]
    },
    {
      heading: 'Why setting it from inside a running script has no effect, regardless of exactly when the pool was actually created',
      points: [
        'Whether the pool initializes at process boot or on the first thread-pool call, both happen BEFORE any application-level JavaScript in your own script has a chance to run process.env.UV_THREADPOOL_SIZE = "16" — by the time your own code executes, either the pool doesn\'t exist yet (fine, but your assignment happens too late relative to whatever triggers the very first pool-requiring call in practice) or it has already been created at its default/previous size (too late, unconditionally). There is no code path where setting the env var from within the running process reliably resizes an existing or not-yet-existing pool correctly.',
        'The only reliable way to change UV_THREADPOOL_SIZE is setting it in the process environment BEFORE the node executable is invoked at all — via the shell (UV_THREADPOOL_SIZE=16 node server.js), a .env file loaded by a process manager before spawning node, or a container/deployment configuration — never via process.env assignment inside the script libuv is about to run under.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — setting it from inside the running script',
      language: 'typescript',
      code: `// server.ts — top of the entry file, before any other code
process.env.UV_THREADPOOL_SIZE = '16';

// BUG: this assignment happens as regular JavaScript, AFTER
// Node's own startup and AFTER libuv has already read whatever
// UV_THREADPOOL_SIZE was in the environment at that point (the
// default of 4, if nothing was set externally). By the time this
// line runs, it is too late — this has zero effect on the thread
// pool's actual size, regardless of exactly when libuv created it.

import fs from 'fs/promises';
import crypto from 'crypto';
// Any fs/crypto/dns.lookup calls below still use the default
// (or externally-set) pool size — this assignment did nothing.`,
    },
    {
      label: 'The fix — set it in the environment before node even starts',
      language: 'typescript',
      code: `// package.json script — the ONLY reliable way to change this
{
  "scripts": {
    "start": "UV_THREADPOOL_SIZE=16 node server.js"
  }
}

// Or in a Dockerfile / deployment config:
// ENV UV_THREADPOOL_SIZE=16

// Or directly in the shell before invoking node:
// UV_THREADPOOL_SIZE=16 node server.js

// server.js itself needs NO code changes — libuv reads this from
// the process environment it was launched into, before any of
// your own JavaScript runs at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer notices their app performs many concurrent fs.readFile() calls and wants to increase the thread pool size. They add process.env.UV_THREADPOOL_SIZE = "16" as the very first line of their main server file, believing that since it runs before any of their own fs calls, it should take effect. After testing, concurrent file reads still appear to queue in batches of 4. Explain why this specific placement doesn\'t work, regardless of it technically running "first" in their own code.',
    hint: 'Does libuv read UV_THREADPOOL_SIZE from the process environment that existed when node was originally launched, or does it check process.env again every time a thread-pool call is made? Does a script\'s own process.env assignment change the environment libuv already read from, or the one the shell originally passed in?',
    solution: 'The placement doesn\'t work because "runs before my own fs calls" is a different, later point in time than "before libuv creates or reads the pool size." libuv either allocates its fixed-size thread pool at process startup or lazily on the first thread-pool-requiring call — but either way, this happens as part of Node\'s own runtime initialization, which completes before your application-level JavaScript (including this process.env assignment) ever gets a chance to execute. A script mutating process.env at runtime does not retroactively change whatever value libuv already used to size its pool — it\'s simply too late, no matter how early in your own code that assignment appears to be. The only way to reliably change this is setting UV_THREADPOOL_SIZE in the process environment BEFORE the node executable is invoked at all — via the shell command, a process manager\'s environment configuration, or a container\'s ENV directive — never via a process.env assignment inside the script that libuv is already running under.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since JavaScript executes top-to-bottom, setting process.env.UV_THREADPOOL_SIZE as the very first line of a script guarantees it runs before any code that would need the thread pool, so it should correctly configure the pool size.',
      reality: 'This subtopic\'s theory clarifies libuv\'s pool sizing happens as part of the runtime\'s own initialization, entirely before any application-level JavaScript executes — "first line of my script" is still too late, regardless of how early it appears relative to the rest of the developer\'s own code.'
    },
    {
      thought: 'UV_THREADPOOL_SIZE must be set before Node.js the process literally boots — there is no other reliable trigger point.',
      reality: 'This subtopic\'s theory shows the precise mechanism is more specific: libuv creates the pool lazily, on the FIRST call that actually needs it (fs, some crypto, dns.lookup) — not necessarily at the very instant the process starts, though in practice this rarely changes the practical guidance (set it in the shell environment beforehand either way).'
    },
    {
      thought: 'If setting UV_THREADPOOL_SIZE from inside a script doesn\'t work, the correct fix is finding a different point earlier in Node\'s own module-loading sequence to set it.',
      reality: 'This subtopic\'s exercise shows there is no earlier point WITHIN your own script that would work — the pool sizing happens in Node/libuv\'s own runtime initialization, entirely outside your script\'s execution; the only fix is setting it in the process environment BEFORE the node executable is invoked at all.'
    }
  ];
}
