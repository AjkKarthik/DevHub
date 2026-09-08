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
    heading: 'A QnA With No Matching codeTab, Anywhere on the Page',
    points: [
      'The main page\'s own QnA on <code>$vectorSearch</code> describes semantic search, recommendation engines, and hybrid search in real depth — sample query syntax included — but none of the page\'s FOUR codeTabs ever builds a working <code>$vectorSearch</code> query. Every codeTab on the page is <code>$search</code>-based (keyword/full-text), not vector similarity search.',
      'Verified against MongoDB\'s own <code>$vectorSearch</code> stage reference: the required fields are <code>index</code>, <code>path</code>, <code>queryVector</code>, and <code>limit</code>; <code>numCandidates</code> is required specifically for approximate nearest-neighbor (ANN) search (the default mode, <code>exact: false</code>). An optional <code>filter</code> field pre-filters candidates before the similarity search runs.',
      'The similarity score is exposed via <code>&#123; \$meta: "vectorSearchScore" &#125;</code> — a DIFFERENT meta key from the <code>"searchScore"</code> used by every other codeTab on this page for regular <code>\$search</code> queries. The two are not interchangeable.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Real $vectorSearch Query',
    language: 'typescript',
    code: `// Semantic search: find products whose description is similar in
// MEANING to a user's query, not just matching keywords.
import { MongoClient } from 'mongodb';

async function semanticProductSearch(queryVector: number[], limit = 10) {
  return db.collection('products').aggregate([
    {
      \$vectorSearch: {
        index: 'product_vector_index',   // configured with the field's vector dimensions + similarity metric
        path: 'descriptionEmbedding',      // the array-of-floats field storing the embedding
        queryVector,                       // the embedding for the user's search text, generated beforehand
        numCandidates: limit * 20,         // MongoDB's own guidance: at least 20x the limit for good recall
        limit,
        filter: { inStock: true },         // pre-filter BEFORE the similarity search runs
      }
    },
    {
      \$project: {
        name: 1,
        price: 1,
        score: { \$meta: 'vectorSearchScore' },  // NOT 'searchScore' -- a different meta key
      }
    },
  ]).toArray();
}

// Generating the query vector (via any embedding provider) happens
// BEFORE this call, not inside the aggregation pipeline itself:
async function searchByText(userQuery: string) {
  const embedding = await generateEmbedding(userQuery); // OpenAI, Cohere, etc.
  return semanticProductSearch(embedding);
}

// Pure-JS check of the numCandidates guidance the main page's own QnA
// example does NOT follow (it uses numCandidates: 100, limit: 10 -- a
// 10x ratio, half of MongoDB's own recommended floor):
function meetsRecallGuidance(numCandidates: number, limit: number): boolean {
  return numCandidates >= limit * 20;
}
console.log('Main page QnA example (100, 10):', meetsRecallGuidance(100, 10));   // -> false
console.log("This subtopic's own query (200, 10):", meetsRecallGuidance(200, 10)); // -> true`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A hybrid search combines this $vectorSearch query with the main page\'s own keyword-based $search queries (via $unionWith, per the main page\'s own QnA). Why can\'t the two result sets simply be sorted together by their raw score values (vectorSearchScore vs. searchScore)?',
  hint: 'Think about what each score actually measures, and whether the two scoring systems were designed to produce numbers on the same scale.',
  solution: `// vectorSearchScore and searchScore come from two ENTIRELY DIFFERENT
// scoring systems measuring different things -- vector similarity
// (typically based on cosine similarity or a similar distance metric,
// often normalized to a 0-1 range) versus Lucene's BM25 keyword-
// relevance scoring (an open-ended score influenced by term frequency
// and field length, with no fixed upper bound).
//
// A vectorSearchScore of 0.9 and a searchScore of 0.9 do not represent
// comparable "how good is this match" values -- sorting the combined
// list by raw score would be comparing two unrelated units. This is
// exactly why the main page's own QnA names reciprocal rank fusion
// (RANKING each list separately, then combining based on RANK POSITION
// rather than raw score) as the real technique for hybrid search,
// rather than a naive score-based merge.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '$vectorSearch and $search both use the { $meta: "searchScore" } projection to expose their relevance score, since they\'re both Atlas Search features under the hood.',
    reality: 'Verified against MongoDB\'s own $vectorSearch documentation: the correct meta key is "vectorSearchScore", a completely separate value from "searchScore". Projecting { $meta: "searchScore" } after a $vectorSearch stage does not return the similarity score at all.',
  },
  {
    thought: 'numCandidates only needs to be larger than limit — any ratio above 1x (e.g., numCandidates: 15 for limit: 10) is a reasonable, if conservative, choice.',
    reality: 'Verified against MongoDB\'s own documented guidance: numCandidates should be AT LEAST 20 times the limit for good recall (90-95% accuracy) in approximate nearest-neighbor search. A ratio like 1.5x (barely above the limit) risks meaningfully worse recall — this is a specific, documented floor, not a vague "bigger is better" suggestion.',
  },
];

@Component({
  selector: 'app-mongo-as-vectorsearch-query',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './building-a-real-vectorsearch-query.html',
  styleUrl: './building-a-real-vectorsearch-query.scss',
})
export class BuildingARealVectorsearchQuerySubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
