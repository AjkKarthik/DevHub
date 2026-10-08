import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-hnsw-memory-measured',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './hnsw-memory-measured.html',
  styleUrl: './hnsw-memory-measured.scss'
})
export class HnswMemoryMeasuredSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Index sizes written to disk",
      "points": [
        "Each 1536-dim float32 vector is 6,144 bytes. IndexHNSWFlat used 6,288 bytes per vector at M=16, 6,416 at M=32 and 6,672 at M=64.",
        "The extra is about 2·M four-byte IDs: 272 bytes at M=32. Doubling M adds a few hundred bytes, not another copy of the vector.",
        "O(N·M·d) would be 196,608 bytes per vector at M=32, about 30 times the measured size.",
        "IVF+PQ with m=96 and 8 bits stored codes of exactly 96 bytes per vector, 64 times smaller than float32. The page's QnA had said 10 to 20 times."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Estimate memory",
      "language": "typescript",
      "code": "function hnswBytes(n: number, d: number, m: number): number {\n  return n * (d * 4 + 2 * m * 4);   // vectors + about 2*M neighbour IDs\n}\nfunction pqBytes(n: number, subquantisers: number, bits = 8): number {\n  return n * (subquantisers * bits / 8 + 8); // codes + 8-byte ID\n}\n\nhnswBytes(1e9, 1536, 32) / 1e12;   // about 6.4 TB\npqBytes(1e9, 96) / 1e9;            // about 104 GB"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "You have 50M vectors of 768 dims and 64 GB of RAM. Does an HNSW index with M=32 fit?",
    "hint": "Use about 4 bytes per dimension plus 2·M IDs.",
    "solution": "No. 768 × 4 = 3,072 bytes plus 256 bytes of links is about 3.3 KB per vector, so 50M vectors need about 166 GB. Use PQ or scalar quantisation, or shard across machines."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Higher M multiplies the memory of every vector.",
      "reality": "M only adds neighbour IDs; at M=64 the index was 9% larger than the raw vectors."
    },
    {
      "thought": "PQ saves 10 to 20 times memory.",
      "reality": "The codes were 64 times smaller than float32 here; IDs and the codebooks add a little on top."
    }
  ];
}
