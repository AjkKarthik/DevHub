import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-pinned-object-fragments-heap-blocks-gc-compaction-neighbors-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './pinned-object-fragments-heap-blocks-gc-compaction-neighbors.html',
  styleUrl: './pinned-object-fragments-heap-blocks-gc-compaction-neighbors.scss',
})
export class PinnedObjectFragmentsHeapBlocksGcCompactionNeighborsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page says "keep fixed blocks as short as possible" — this explains exactly WHY, at the mechanism level',
      points: [
        'The main Unsafe Code &amp; Pointers page states: "Pinning has a performance cost: it creates a \'pinning root\' that the GC must work around during collection. Keep fixed blocks as short as possible." That is correct advice, but stated as a rule to follow rather than a mechanism to understand — this subtopic covers WHAT the GC actually has to "work around" and why it costs more than just "the pinned object itself doesn\'t move."',
      ],
    },
    {
      heading: '.NET\'s Gen0/Gen1 GC is a COMPACTING collector — it moves surviving objects to eliminate gaps left by collected garbage, keeping the heap contiguous',
      points: [
        'After a Gen0/Gen1 collection identifies which objects survive, the GC does not just leave survivors where they are — it SLIDES them together, compacting the heap so that all free space ends up as one contiguous block at the end. This is what makes allocation in .NET so cheap (a simple pointer bump) — there is never a scattered free list to search.',
        'A PINNED object cannot be moved during this compaction — by definition, its address must stay fixed for as long as any code might hold a raw pointer or reference to it via a native call. This means the GC cannot slide it, which means it CANNOT slide anything located AHEAD of it in memory PAST it either, without changing the pinned object\'s own address as a side effect.',
      ],
    },
    {
      heading: 'The practical consequence: a pinned object creates a "hole" that survives compaction, fragmenting the generation around it — even if the pinned object itself is tiny',
      points: [
        'Picture Gen0 as one contiguous block of surviving objects after garbage is identified. A SINGLE pinned object anywhere in that block forces the GC to compact everything BEFORE it into one region and everything AFTER it into another region, leaving the pinned object sitting in its own untouched gap in between — the free space is no longer ONE contiguous block, it is now TWO (or more, with multiple pins), each smaller than before.',
        'A single short-lived pin has a small, usually negligible effect. The REAL cost shows up with MANY pins accumulating (e.g., a loop that pins a small buffer on every iteration for a P/Invoke call) or a LONG-LIVED pin (holding a fixed block open across a lengthy operation, or using <code>GCHandle.Alloc(obj, GCHandleType.Pinned)</code> and forgetting to <code>Free()</code> it promptly) — each pin fragments the generation a little more, and over many collections this measurably increases both GC pause times and overall heap size, since the "gaps" cannot be reclaimed until the pin is released.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A short-lived fixed block — negligible fragmentation, exactly the main page\'s recommended pattern',
      language: 'csharp',
      code: `// GOOD: the pin exists for the shortest possible window
byte[] buffer = new byte[64];
unsafe
{
    fixed (byte* p = buffer)
    {
        NativeCall(p, buffer.Length);   // pin held only for this one call
    }
    // Pin released here — the GC is free to move "buffer" again on the
    // VERY NEXT collection, so any fragmentation this pin caused is
    // transient and gone as soon as the next Gen0 collection runs.
}

[DllImport("somelib")]
static extern void NativeCall(byte* data, int length);`,
    },
    {
      label: 'The accumulating cost — pinning inside a tight, high-frequency loop',
      language: 'csharp',
      code: `// RISKIER: a new small array is allocated AND pinned on EVERY iteration
// of a hot loop calling into native code:
for (int i = 0; i < 1_000_000; i++)
{
    byte[] chunk = ReadNextChunk();  // fresh Gen0 allocation each time
    unsafe
    {
        fixed (byte* p = chunk)
        {
            ProcessChunkNative(p, chunk.Length);
        }
    }
    // Each iteration's pin is individually short-lived, BUT: if a Gen0
    // collection happens to run WHILE one of these fixed blocks is
    // still open (which is entirely possible under GC's own schedule,
    // independent of your loop), that ONE collection has to fragment
    // around whichever chunk happens to be pinned at that exact moment.
    // Across a million iterations under real allocation pressure, some
    // fraction of collections WILL land mid-pin, and the CUMULATIVE
    // fragmentation and pause-time cost becomes measurable — this is
    // exactly the scenario BenchmarkDotNet's [MemoryDiagnoser] and Gen0
    // collection-count metrics are meant to surface.
}

// BETTER: allocate ONE reusable buffer outside the loop, pin it once
// (or use NativeMemory/stackalloc, which the GC never needs to pin
// or move at all, since they aren't on the GC heap in the first place):
byte[] reusableBuffer = new byte[4096];
unsafe
{
    fixed (byte* p = reusableBuffer)
    {
        for (int i = 0; i < 1_000_000; i++)
            ProcessChunkNative(p, ReadNextChunkInto(reusableBuffer));
    }
}`,
    },
    {
      label: 'The long-lived pin — GCHandle.Alloc(Pinned) held across an entire operation',
      language: 'csharp',
      code: `// RISKY: pinning a buffer for an EXTENDED, indefinite duration —
// e.g., handing its address to a native callback that fires repeatedly
// over the lifetime of a long-running operation:
byte[] callbackBuffer = new byte[1024];
GCHandle handle = GCHandle.Alloc(callbackBuffer, GCHandleType.Pinned);
try
{
    IntPtr address = handle.AddrOfPinnedObject();
    RegisterNativeCallback(address, callbackBuffer.Length);

    await RunLongOperationAsync();  // handle stays pinned for the
                                     // ENTIRE duration of this await —
                                     // potentially many GC collections
                                     // all fragmenting around this one
                                     // buffer's fixed address the whole time
}
finally
{
    handle.Free();  // MUST always release — forgetting this pins
                     // callbackBuffer for the rest of the process's
                     // lifetime, a PERMANENT fragmentation source
}

// If the buffer must stay valid for the callback's whole lifetime,
// consider allocating it as NativeMemory instead — it was never on
// the GC heap to begin with, so there is nothing for the GC to work
// around at all:
unsafe
{
    void* nativeBuf = NativeMemory.Alloc(1024);
    RegisterNativeCallback((IntPtr)nativeBuf, 1024);
    // ... use for the operation's full duration, no GC interaction ...
    NativeMemory.Free(nativeBuf);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A service processes incoming network packets in a loop, calling <code>fixed (byte* p = packetBuffer) { NativeParse(p, packetBuffer.Length); }</code> for each packet, at a rate of 50,000 packets/second. Profiling shows Gen0 collection pause times have crept up over a week of continuous operation. Explain the likely connection to pinning, and propose a concrete fix.',
    hint: 'Consider what fraction of 50,000-per-second short pins are statistically likely to overlap with a Gen0 collection\'s timing over the course of a week, and what changes if the buffer being pinned is reused rather than freshly allocated per packet.',
    solution: `// The likely current code — a fresh array per packet, pinned briefly
// each time:
void ProcessPacket(byte[] packetBuffer)
{
    unsafe
    {
        fixed (byte* p = packetBuffer)
        {
            NativeParse(p, packetBuffer.Length);
        }
    }
}

// WHY PAUSE TIMES CREEP UP: at 50,000 packets/second, EVERY SINGLE
// SECOND there are 50,000 individually-short pin windows. Gen0
// collections in a busy server can run many times per second under
// allocation pressure (a NEW packetBuffer array is itself a Gen0
// allocation on every call, in addition to being pinned). Purely by
// statistical overlap, a meaningful fraction of those collections WILL
// land while some packet's fixed block is open — each such collection
// has to fragment Gen0 around whichever buffer happens to be pinned at
// that instant. Over a WEEK of continuous operation, these many small
// fragmentation events accumulate: Gen0 (and eventually Gen1, as some
// fragmented regions get promoted) ends up with more scattered "holes"
// than a healthy compacted heap, and the GC has progressively more
// bookkeeping to do to work around them on every subsequent collection
// — which is exactly the "pause times creeping up over time" symptom.

// THE FIX — eliminate the per-packet ALLOCATION and PIN entirely,
// reusing one buffer that is pinned ONCE (or never needs pinning at
// all, if moved off the GC heap):
public class PacketProcessor
{
    private readonly byte[] _reusableBuffer = new byte[65536];
    private readonly GCHandle _pinnedHandle;
    private readonly IntPtr _pinnedAddress;

    public PacketProcessor()
    {
        _pinnedHandle  = GCHandle.Alloc(_reusableBuffer, GCHandleType.Pinned);
        _pinnedAddress = _pinnedHandle.AddrOfPinnedObject();
        // Pinned EXACTLY ONCE, for the lifetime of this processor —
        // one permanent, small fragmentation cost instead of tens of
        // thousands of transient ones per second.
    }

    public unsafe void ProcessPacket(ReadOnlySpan<byte> incoming)
    {
        incoming.CopyTo(_reusableBuffer);
        NativeParse((byte*)_pinnedAddress, incoming.Length);
    }

    ~PacketProcessor() => _pinnedHandle.Free();
}

// Even better, if native ownership permits it: allocate _reusableBuffer
// via NativeMemory instead of a managed array + GCHandle — it is never
// on the GC heap, so there is nothing to pin or fragment around, ever.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a pinned object only prevents THAT specific object from being moved — everything else in the heap compacts normally, unaffected.',
      reality: 'a pinned object blocks the GC from sliding OTHER objects past its fixed address too, splitting what would have been one contiguous compacted region into multiple fragmented regions around the pin.',
    },
    {
      thought: 'a short fixed block that only exists for a single native call has effectively zero GC cost.',
      reality: 'if a Gen0 collection happens to run while that fixed block is open (which is entirely possible, independent of your code\'s timing), that ONE collection still has to fragment around it — under high call frequency, enough of these transient overlaps accumulate into a measurable cumulative cost.',
    },
    {
      thought: 'NativeMemory and stackalloc need the same pinning consideration as a managed array passed through fixed.',
      reality: 'NativeMemory and stackalloc are never on the GC heap in the first place — the GC has no knowledge of them at all, so there is nothing to pin and no compaction fragmentation risk from using them.',
    },
  ];
}
