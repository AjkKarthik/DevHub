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
    heading: 'Four Types — But Which Four?',
    points: [
      'The main page\'s theory states "Four main proxy types: Virtual, Caching, Protection, and Remote" — but ' +
      'the GoF book\'s own original four types are Remote, Virtual, Protection, and SMART REFERENCE, not ' +
      'Caching. The quiz and QnA on this SAME page both separately discuss "Smart Reference Proxy" without ' +
      'ever reconciling it against the "four main types" framing stated earlier.',
      'This is not a mistake so much as an unreconciled MODERNIZATION: Caching Proxy is by far the most ' +
      'common real-world proxy variant developers actually reach for, so substituting it for GoF\'s original ' +
      'Smart Reference in the "main four" is a defensible, practical choice — the main page\'s own QnA now ' +
      'names this explicitly rather than leaving Smart Reference as an unexplained loose end.',
    ],
  },
  {
    heading: 'What Smart Reference Actually Does',
    points: [
      'A Smart Reference Proxy adds bookkeeping around access to the real object — most classically, ' +
      'REFERENCE COUNTING: track how many clients currently hold a reference, and release the real (often ' +
      'expensive or unmanaged) resource automatically once that count reaches zero.',
      'This is a genuinely different concern from every one of the page\'s own "main four": it is not about ' +
      'deferring creation (Virtual), remembering results (Caching), checking permissions (Protection), or ' +
      'reaching a remote process (Remote) — it is about managing the real object\'s LIFETIME based on how many ' +
      'clients are actively using it.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Genuine Smart Reference Proxy',
    language: 'csharp',
    code: `// Wraps an expensive, disposable resource (e.g. a native handle, a
// large in-memory buffer) and releases it automatically once every
// client holding a reference has released ITS reference.
public sealed class SmartReferenceProxy<T> : IDisposable where T : IDisposable
{
    private readonly Func<T> _factory;
    private T? _real;
    private int _refCount;
    private readonly object _lock = new();

    public SmartReferenceProxy(Func<T> factory) => _factory = factory;

    // Acquire() hands out a lease — the real object is created on the
    // FIRST acquire (Virtual-Proxy-style lazy init, folded into this
    // same wrapper) and torn down on the LAST release.
    public Lease Acquire()
    {
        lock (_lock)
        {
            _real ??= _factory(); // create on first use
            _refCount++;
            return new Lease(this, _real);
        }
    }

    private void Release()
    {
        lock (_lock)
        {
            _refCount--;
            if (_refCount == 0 && _real is not null)
            {
                _real.Dispose(); // last reference gone — release the real resource
                _real = default;
            }
        }
    }

    public void Dispose() => Release();

    public readonly struct Lease : IDisposable
    {
        private readonly SmartReferenceProxy<T> _owner;
        public T Value { get; }
        internal Lease(SmartReferenceProxy<T> owner, T value) { _owner = owner; Value = value; }
        public void Dispose() => _owner.Release(); // returning the lease decrements the count
    }
}

// Usage: two independent clients share ONE underlying expensive resource
var proxy = new SmartReferenceProxy<ExpensiveHandle>(() => new ExpensiveHandle());

using var leaseA = proxy.Acquire(); // creates the real handle, refCount = 1
using (var leaseB = proxy.Acquire()) // refCount = 2, reuses the SAME handle
{
    leaseB.Value.DoWork();
} // leaseB disposed — refCount = 1, handle still alive (leaseA still holds it)
// leaseA disposed at the end of scope — refCount = 0, handle actually released here`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'How does <code>SmartReferenceProxy&lt;T&gt;</code> above genuinely differ from the main page\'s own ' +
    '<code>LazyImageProxy</code> (Virtual Proxy), given that both defer creating the real object until first ' +
    'use? What can Smart Reference do that Virtual Proxy alone cannot?',
  hint:
    'Both create lazily — but only one of them has any concept of "how many clients are currently using this," ' +
    'and only one of them ever releases the real object again once created.',
  solution:
    'LazyImageProxy only handles the CREATION side — once <code>_realImage</code> is created on first ' +
    '<code>Display()</code>, it stays alive for the rest of the proxy\'s own lifetime, with no mechanism to ' +
    'ever release it again or to know how many callers are currently relying on it. SmartReferenceProxy adds ' +
    'the piece Virtual Proxy alone does not have: reference COUNTING across the resource\'s entire lifecycle, ' +
    'so it can correctly release the real object the moment the LAST client is done with it, even when ' +
    'multiple independent clients are using it concurrently. Virtual Proxy answers "when should this be ' +
    'created?"; Smart Reference additionally answers "when should this be destroyed, given that more than one ' +
    'caller might be using it at once?" — a genuinely separate question Virtual Proxy alone never addresses.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the main page lists exactly "four main types" and Smart Reference is not one of them, ' +
      'Smart Reference must not be a real/valid Proxy variant.',
    reality:
      'Smart Reference is GoF\'s own original fourth type, from the same source the "four main types" framing ' +
      'traces back to — the main page substituted the more commonly-used Caching Proxy in its place for ' +
      'practical, everyday relevance, not because Smart Reference is somehow less legitimate. Both are ' +
      'genuine, textbook Proxy variants; the page just picks four to feature prominently rather than five.',
  },
  {
    thought: 'C#\'s garbage collector makes reference-counting proxies unnecessary — that\'s a C++ concern ' +
      '(shared_ptr), not a .NET one.',
    reality:
      'The GC reclaims MANAGED memory automatically, but it has no idea when to release UNMANAGED or ' +
      'externally-scarce resources (native handles, file locks, expensive connections) that outlive a single ' +
      'object\'s own GC-tracked lifetime — which is exactly why .NET\'s own COM interop wrappers, mentioned in ' +
      'the main page\'s own QnA, use reference-counting Smart Reference proxies internally despite running on ' +
      'a garbage-collected runtime.',
  },
];

@Component({
  selector: 'app-proxy-smart-reference-gofs-actual-fourth-type',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './smart-reference-gofs-actual-fourth-type.html',
  styleUrl: './smart-reference-gofs-actual-fourth-type.scss',
})
export class SmartReferenceGofsActualFourthTypeSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
