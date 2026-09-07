import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-list-max-listpack-size-is-a-byte-size-cap',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './list-max-listpack-size-is-a-byte-size-cap.html',
  styleUrl: './list-max-listpack-size-is-a-byte-size-cap.scss',
})
export class ListMaxListpackSizeIsAByteSizeCapSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page originally got wrong',
      points: [
        'The main page\'s own theory bullet and quiz explanation both framed <code>list-max-listpack-size</code> as an ENTRY-COUNT threshold — "small lists (≤ list-max-listpack-size elements)". That framing matches how hashes work (hash-max-listpack-entries IS a pure entry count), but lists work differently.',
        'Verified directly against Redis\'s own <code>config.c</code> source: <code>list-max-listpack-size</code> defaults to <code>-2</code>, and negative values mean a per-node BYTE-SIZE cap, not an entry count at all — -1=4KB, -2=8KB (the default), -3=16KB, -4=32KB, -5=64KB. Only a POSITIVE value switches the config to "max entries per node" instead.',
        'A short Redis list starts as a single, flat listpack with no linking at all — not "a doubly-linked list" in any sense yet. It only converts into a genuine quicklist (a doubly-linked list of listpack nodes) once it exceeds this size threshold.',
      ],
    },
    {
      heading: 'Why this distinction has a real, counterintuitive consequence',
      points: [
        'Under the entry-count mental model, a list with only 3 elements "should" obviously stay compact — 3 is far below any reasonable entry-count threshold. But under the REAL byte-size model, 3 sufficiently large elements can already exceed the default 8KB cap and trigger a conversion to quicklist.',
        'Conversely, a list with hundreds of TINY elements (single characters, short numeric strings) can comfortably stay under the 8KB byte cap and remain a single flat listpack, even though "hundreds" sounds like it should have long since converted under an entry-count mental model.',
        'The practical takeaway: for lists specifically, whether a given list is "small" (still a flat listpack) depends on the TOTAL SIZE of its contents, not how many elements it has — the opposite of how hash encoding thresholds work.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Byte-size cap, not entry count',
      language: 'typescript',
      code: `// Reproduces Redis's own documented negative-value meanings for
// list-max-listpack-size, verified directly against config.c.
function nodeCapacityBytes(configValue: number): number | null {
  const byteSizeMap: Record<string, number> = {
    '-1': 4096, '-2': 8192, '-3': 16384, '-4': 32768, '-5': 65536,
  };
  // null means the config value is a positive entry-count cap instead.
  return byteSizeMap[String(configValue)] ?? null;
}

function wouldConvertToQuicklist(elements: string[], configValue: number): boolean {
  const capBytes = nodeCapacityBytes(configValue);
  if (capBytes === null) {
    return elements.length > configValue; // positive value: entry-count cap
  }
  const totalBytes = elements.reduce((sum, e) => sum + Buffer.byteLength(e, 'utf8'), 0);
  return totalBytes > capBytes;
}

// Only 3 elements, but they're huge -- exceeds the default 8KB cap.
const threeHugeStrings = ['x'.repeat(3000), 'y'.repeat(3000), 'z'.repeat(3000)];
console.log(
  '3 elements, ~9000 bytes total:',
  wouldConvertToQuicklist(threeHugeStrings, -2) ? 'CONVERTS to quicklist' : 'stays listpack',
);

// Hundreds of TINY elements, well under 8KB total -- stays a flat listpack.
const manyTinyStrings = Array.from({ length: 500 }, (_, i) => String(i % 10));
console.log(
  '500 tiny elements, well under 8KB total:',
  wouldConvertToQuicklist(manyTinyStrings, -2) ? 'CONVERTS to quicklist' : 'stays listpack',
);
// 3 elements, ~9000 bytes total: CONVERTS to quicklist
// 500 tiny elements, well under 8KB total: stays listpack`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets <code>list-max-listpack-size 128</code> (a positive value) expecting it to behave like the hash-max-listpack-entries pattern they already know. Given the verified rule above, does this configuration mean "convert once the list has more than 128 total bytes" or something else?',
    hint: 'Re-read which branch of <code>nodeCapacityBytes()</code> a POSITIVE config value takes — does it even look at byte size at all?',
    solution: `A positive value switches the meaning of the config entirely, away from byte size: list-max-listpack-size 128 means "convert to quicklist once a node would hold more than 128 ENTRIES," regardless of how large or small those entries are. This is actually the entry-count model the original main-page text assumed applied by default -- it's real, it's just not what the DEFAULT (-2) configures.

So the team's assumption isn't wrong about what a positive value does -- it's wrong only if they assume the DEFAULT works the same way. With list-max-listpack-size 128 explicitly set, a list of 200 one-byte elements would now convert to quicklist (200 > 128 entries) even though its total size is a few hundred bytes -- the exact opposite of what the byte-size default would do with the same data.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"list-max-listpack-size must work the same way as hash-max-listpack-entries, since they both gate a listpack-vs-larger-structure conversion."',
      reality: 'They share the same underlying IDEA (a size threshold gating an encoding conversion) but use genuinely different UNITS by default. hash-max-listpack-entries is always a pure entry count. list-max-listpack-size defaults to a negative, byte-size-based value -- only becoming an entry count if explicitly set to a positive number.',
    },
    {
      thought: '"A Redis list with only a handful of elements is always stored as a compact listpack, regardless of what those elements actually contain."',
      reality: 'Demonstrated directly above: 3 elements alone can exceed the default 8KB node cap and convert to quicklist if those 3 elements are large enough. Element COUNT alone never tells you the encoding for a list -- total byte size does, under the default configuration.',
    },
  ];

  topicLabel = 'Lists';
  topicRoute = '/redis/lists';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'LMPOP: The Non-Blocking Sibling of BLPOP',
    route: '/redis/lists/lmpop-the-non-blocking-sibling-of-blpop',
  };
}
