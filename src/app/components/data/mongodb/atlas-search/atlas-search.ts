import { Component } from '@angular/core';
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
  selector: 'app-mongo-atlas-search',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './atlas-search.html',
  styleUrl: './atlas-search.scss',
})
export class MongoAtlasSearch {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: '$search',           desc: 'Aggregation stage for Atlas Search queries. Must be the first stage in the pipeline.' },
    { type: 'keyword', name: '$searchMeta',       desc: 'Returns only metadata (facets, count) from Atlas Search — no documents.' },
    { type: 'operator', name: 'text',             desc: 'Full-text search operator. Supports fuzzy matching, synonyms, multi-field search.' },
    { type: 'operator', name: 'phrase',           desc: 'Match an exact sequence of words in order.' },
    { type: 'operator', name: 'autocomplete',     desc: 'Prefix/infix matching for search-as-you-type. Requires edge-gram/nGram mapping on the index.' },
    { type: 'operator', name: 'range',            desc: 'Filter by numeric or date range within a $search query.' },
    { type: 'operator', name: 'near',             desc: 'Boost scores for documents where a numeric/date field is close to a target value.' },
    { type: 'operator', name: 'compound',         desc: 'Combine multiple operators with must / mustNot / should / filter clauses.' },
    { type: 'keyword', name: 'facets',            desc: 'Count results by category (string facet) or range (number/date facet) for search UI filters.' },
    { type: 'keyword', name: 'highlight',         desc: 'Return snippets showing where query terms matched in the document.' },
    { type: 'keyword', name: 'searchScore',       desc: '{ $meta: "searchScore" } — project the relevance score of each result.' },
    { type: 'keyword', name: 'Atlas Search Index', desc: 'Lucene index created in Atlas UI or API. Separate from MongoDB\'s B-tree indexes.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Atlas Search?',
      points: [
        '<strong>Atlas Search</strong> is a full-text search engine built into MongoDB Atlas, powered by <strong>Apache Lucene</strong>. It enables relevance-based text search, autocomplete, faceted search, highlighting, and fuzzy matching — without maintaining a separate Elasticsearch cluster.',
        'Atlas Search uses <strong>aggregation pipeline stages</strong>: <code>$search</code> (run a search query, returns documents) and <code>$searchMeta</code> (returns only metadata like facet counts). These stages must be the <strong>first stage</strong> in the pipeline; other stages ($match, $project, $sort, etc.) follow after.',
        'Atlas Search maintains its own <strong>Lucene indexes</strong> alongside MongoDB\'s B-tree indexes. You create Search indexes in the Atlas UI (Data Services → Search → Create Index) or via the Atlas Admin API. The index maps fields to Lucene analyzers (tokenizers + filters).',
        'Atlas Search is <strong>Atlas-only</strong> — it requires MongoDB Atlas (not self-hosted). For self-hosted full-text search, use MongoDB\'s built-in <code>$text</code> operator (limited) or integrate with Elasticsearch/OpenSearch.',
        'Atlas Search updates <strong>near-real-time</strong> — typically within 1–5 seconds of a write, not immediately. For latency-sensitive applications, use MongoDB <code>$text</code> instead (synchronous with writes).',
      ],
    },
    {
      heading: 'Index Configuration',
      points: [
        'Create a Search Index in Atlas UI → Collection → Search Indexes → Create Search Index. The <strong>Dynamic mapping</strong> option auto-indexes all string fields (good for prototyping). <strong>Static mapping</strong> lets you configure which fields and which analyzers to use (preferred for production).',
        'Analyzers determine how text is tokenized and transformed before indexing. Common analyzers: <code>lucene.standard</code> (default — lowercases, removes stop words, stems words); <code>lucene.english</code> (English-specific stemming: "running" → "run"); <code>lucene.keyword</code> (no tokenization — exact match only).',
        'For <strong>autocomplete</strong>, you must configure the field with a special mapping: <code>{ "type": "autocomplete", "tokenization": "edgeGram", "minGrams": 1, "maxGrams": 10 }</code>. EdgeGram tokenization creates prefixes of each word ("Mon", "Mong", "Mongo", "Mongod"...).',
        'The <strong>searchScore</strong> field (<code>{ $meta: "searchScore" }</code>) gives a relevance score for each result. By default, results are ordered by score descending. You can combine Atlas Search score with MongoDB sort fields using <code>sort</code> within the $search operator.',
        'Synonym mappings allow queries for "mobile phone" to also match "cell phone" or "smartphone". Create a synonym source collection and reference it in the Search index configuration.',
      ],
    },
    {
      heading: 'Compound Operator & Facets',
      points: [
        'The <strong>compound</strong> operator combines multiple search operators: <code>must</code> (required — like AND), <code>mustNot</code> (excluded — like NOT), <code>should</code> (optional — boosts score if matched), <code>filter</code> (required but does not affect score). Use compound to build complex search UIs with text + filters.',
        '<strong>Faceted search</strong> lets you show "Results by category" counts alongside search results. Add a <code>facet</code> collector to $searchMeta or a facet operator to $search. String facets count by distinct values; number and date facets count by ranges. Results and facet counts can be retrieved in a single query using <code>$facet</code>.',
        '<strong>Highlighting</strong> returns a snippet of the document with matched terms annotated — useful for showing users why a result matched. Add <code>highlight: { path: ["title", "body"] }</code> to the $search stage; access highlights via <code>{ $meta: "searchHighlights" }</code> in $project.',
        'The <code>near</code> operator boosts documents where a numeric/date field is close to a target value — useful for "sort by proximity to a date" (e.g., events happening soonest), or "boost newer documents".',
        'Use <code>count: { type: "total" }</code> or <code>{ type: "lowerBound" }</code> in the $search stage to get the total result count alongside documents (avoids a second round-trip).',
      ],
    },
    {
      heading: 'Atlas Search Index Configuration',
      points: [
        'Atlas Search indexes are defined separately from regular MongoDB indexes, using a dedicated JSON mapping that specifies how each field should be analyzed for full-text search — this mapping determines tokenization, language-specific stemming, and which fields are searchable at all.',
        'Dynamic mapping automatically indexes all fields with default analyzers, which is convenient for getting started but less precise than static mapping, where each field\'s analyzer and indexing behavior is explicitly configured for the specific search requirements of that field.',
        'Atlas Search runs on a separate Lucene-based search index maintained alongside the primary MongoDB data — this architecture means search index updates are near-real-time but asynchronous, so there is a brief propagation delay between a document write and that change being reflected in search results.',
        'Compound queries in Atlas Search combine multiple search clauses (must, should, mustNot, filter) similar to Elasticsearch\'s bool query — letting you build sophisticated relevance-scored search experiences directly within MongoDB rather than maintaining a separate search infrastructure like Elasticsearch alongside it.',
      ],
    },
    {
      heading: 'Relevance Scoring and Faceted Search',
      points: [
        'Atlas Search assigns a relevance score to each result based on term frequency, field weighting, and query type — results are automatically sorted by this score by default, though you can combine it with additional sort criteria or boost specific fields to tune ranking for your use case.',
        'Autocomplete search type provides prefix and fuzzy matching optimized for search-as-you-type interfaces, using a specialized index structure distinct from standard text search — appropriate specifically for search box suggestions rather than general full-text queries.',
        'Faceted search ($searchMeta with facet operators) computes aggregated counts across categories (price ranges, brands, ratings) alongside the main search results in a single query — powering the filter sidebars common in e-commerce search UIs without a separate aggregation query.',
        'Fuzzy matching tolerates minor typos and spelling variations in search queries by allowing a configurable edit distance — valuable for user-facing search where exact-match-only queries would frustrate users making common typing mistakes.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Text Search',
      language: 'typescript',
      code: `// Basic full-text search with $search
const results = await db.collection('products').aggregate([
  {
    $search: {
      index: 'default',    // name of your Atlas Search index
      text: {
        query: 'wireless bluetooth headphones',
        path: ['name', 'description'],  // search across multiple fields
        fuzzy: {
          maxEdits: 1,        // allow 1 character difference (typo tolerance)
          prefixLength: 3,    // first 3 characters must match exactly
        },
      }
    }
  },
  {
    $project: {
      name: 1,
      description: 1,
      price: 1,
      score: { $meta: 'searchScore' },  // include relevance score
    }
  },
  { $sort: { score: -1 } },   // sort by relevance (default behaviour — explicit here)
  { $limit: 20 },
]).toArray();`,
    },
    {
      label: 'Compound Search with Filters',
      language: 'typescript',
      code: `// Compound operator: text search + category filter + price range
const results = await db.collection('products').aggregate([
  {
    $search: {
      index: 'default',
      compound: {
        must: [{
          // Full text search — required, affects score
          text: {
            query: req.query.q as string,
            path: ['name', 'description', 'tags'],
          }
        }],
        filter: [{
          // Category filter — required, does NOT affect score
          text: {
            query: req.query.category as string,
            path: 'category',
          }
        }, {
          // Price range filter
          range: {
            path: 'price',
            gte: Number(req.query.minPrice ?? 0),
            lte: Number(req.query.maxPrice ?? 10000),
          }
        }],
        should: [{
          // Boost in-stock products (not required, but score higher)
          text: { query: 'in stock', path: 'stockStatus' }
        }],
        mustNot: [{
          // Exclude discontinued products
          text: { query: 'discontinued', path: 'status' }
        }]
      },
      count: { type: 'total' },  // include total result count
    }
  },
  {
    $project: {
      name: 1, price: 1, category: 1,
      score: { $meta: 'searchScore' },
    }
  },
  { $limit: 20 },
]).toArray();`,
    },
    {
      label: 'Autocomplete & Facets',
      language: 'typescript',
      code: `// Autocomplete — prefix search for search-as-you-type
// Requires autocomplete mapping on the 'name' field in the index config
const suggestions = await db.collection('products').aggregate([
  {
    $search: {
      index: 'autocomplete_index',
      autocomplete: {
        query: 'headph',      // partial input from user
        path: 'name',
        tokenOrder: 'sequential',
        fuzzy: { maxEdits: 1 },
      }
    }
  },
  { $limit: 8 },
  { $project: { name: 1, _id: 0 } }
]).toArray();

// Faceted search — get results + counts by category in one query
const [searchResults, facetResults] = await Promise.all([
  // 1. Main results
  db.collection('products').aggregate([
    { $search: { index: 'default', text: { query: searchQuery, path: 'name' } } },
    { $limit: 20 },
    { $project: { name: 1, price: 1, category: 1, score: { $meta: 'searchScore' } } }
  ]).toArray(),

  // 2. Facets (counts by category)
  db.collection('products').aggregate([
    {
      $searchMeta: {
        index: 'default',
        facet: {
          operator: { text: { query: searchQuery, path: 'name' } },
          facets: {
            categoryFacet: { type: 'string', path: 'category', numBuckets: 10 },
            priceFacet: { type: 'number', path: 'price', boundaries: [0, 25, 50, 100, 250, 500] },
          }
        }
      }
    }
  ]).toArray(),
]);

// facetResults[0].facet.categoryFacet.buckets → [{_id: "Electronics", count: 42}, ...]`,
    },
    {
      label: 'Highlight & Phrase Search',
      language: 'typescript',
      code: `// Phrase search — exact word order match
const phraseResults = await db.collection('articles').aggregate([
  {
    $search: {
      phrase: {
        query: 'machine learning models',  // words must appear in this order
        path: 'content',
        slop: 1,  // allow 1 word between matched terms (near-phrase)
      }
    }
  },
  { $limit: 10 },
]).toArray();

// Highlighting — return matched text snippets
const highlightResults = await db.collection('articles').aggregate([
  {
    $search: {
      index: 'default',
      text: { query: 'deep learning', path: ['title', 'content'] },
      highlight: {
        path: ['title', 'content'],  // fields to highlight
        maxCharsToExamine: 500,      // limit how much text is scanned
        maxNumPassages: 3,           // max highlight snippets per field
      }
    }
  },
  {
    $project: {
      title: 1,
      highlights: { $meta: 'searchHighlights' },  // array of highlighted snippets
      score: { $meta: 'searchScore' },
    }
  },
  { $limit: 10 },
]).toArray();

// Each highlight entry: { path: 'content', texts: [{value: '...', type: 'hit'|'text'}, ...] }
// type 'hit' = matched text (bold in UI), type 'text' = surrounding context`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using $search before creating a Search Index',
      wrong: `// Running $search without a Search Index in Atlas
await db.collection('products').aggregate([
  { $search: { text: { query: 'laptop', path: 'name' } } }
]).toArray();
// Error: "$search index not found for collection: products"`,
      right: `// Must create an Atlas Search Index first in Atlas UI:
// Data Services → Your Collection → Search Indexes → Create Index
// - Choose "Visual Editor" or "JSON Editor"
// - Select fields to index (or use dynamic mapping)
// - Wait for index to build (may take seconds to minutes)
// THEN run $search queries with the index name
await db.collection('products').aggregate([
  { $search: { index: 'default', text: { query: 'laptop', path: 'name' } } }
]).toArray();`,
      explanation: '$search requires an Atlas Search Index (Lucene index) on the collection. This is separate from MongoDB\'s B-tree indexes. Create it in the Atlas UI (Data Services tab → Search) before running $search queries. Always specify the index name explicitly rather than relying on "default".',
    },
    {
      title: 'Putting $match before $search to filter results',
      wrong: `// WRONG — $match before $search is not pushed into the Search index
await db.collection('products').aggregate([
  { $match: { category: 'Electronics' } },  // runs BEFORE $search — filtered by MongoDB
  { $search: { text: { query: 'laptop', path: 'name' } } },  // $search not first!
  // Error: $search must be the first stage`,
      right: `// CORRECT — use compound filter inside $search, then $match after for non-search filters
await db.collection('products').aggregate([
  {
    $search: {
      compound: {
        must:   [{ text: { query: 'laptop', path: 'name' } }],
        filter: [{ text: { query: 'Electronics', path: 'category' } }],
      }
    }
  },
  { $limit: 20 },
  // Post-search $match for MongoDB-native filters (e.g., numeric comparisons)
  { $match: { price: { $lt: 1500 } } },
]).toArray();`,
      explanation: '$search must always be the FIRST stage in the aggregation pipeline. You cannot put $match (or any other stage) before $search. To filter within Atlas Search, use the compound operator\'s filter clause. For filters not supported in Atlas Search, add $match stages AFTER $search.',
    },
    {
      title: 'Using $search on self-hosted MongoDB (not Atlas)',
      wrong: `// $search only works on MongoDB Atlas
// This will fail on self-hosted mongod / MongoDB Community / Enterprise
const client = new MongoClient('mongodb://localhost:27017');
await db.collection('products').aggregate([
  { $search: { text: { query: 'laptop', path: 'name' } } }
]).toArray();
// Error: Unrecognized pipeline stage name: '$search'`,
      right: `// For self-hosted MongoDB: use $text (basic full-text search)
// First create a text index:
db.collection('products').createIndex({ name: 'text', description: 'text' });

// Then use $text:
await db.collection('products').find({
  $text: { $search: 'laptop wireless', $caseSensitive: false }
}, {
  score: { $meta: 'textScore' }
}).sort({ score: { $meta: 'textScore' } }).toArray();
// Or use Atlas / Elasticsearch for full Atlas Search capabilities`,
      explanation: '$search and Atlas Search are Atlas-only features — they require MongoDB Atlas. Self-hosted MongoDB (Community, Enterprise, or Docker) does not support $search. Use MongoDB\'s built-in $text operator (more limited — no fuzzy, no facets, no autocomplete) or add a separate search engine like Elasticsearch.',
    },
    {
      title: 'Not specifying the search index name',
      wrong: `// Relies on "default" index existing — breaks if it doesn't or if you have multiple indexes
await db.collection('products').aggregate([
  { $search: { text: { query: 'laptop', path: 'name' } } }
  // Missing: index: 'your-index-name'
]).toArray();`,
      right: `// Always specify the index name explicitly
await db.collection('products').aggregate([
  { $search: {
    index: 'products_search',  // explicit — won't silently use wrong index
    text: { query: 'laptop', path: 'name' }
  }}
]).toArray();`,
      explanation: 'If you don\'t specify the index name, Atlas Search uses the index named "default". If you have multiple search indexes on a collection (e.g., one for autocomplete, one for full-text), the wrong index may be used silently. Always name your indexes clearly and reference them explicitly.',
    },
  ];

  challenge: Challenge = {
    title: 'E-commerce Search with Facets',
    language: 'typescript',
    description: 'Build a search function for an e-commerce site. It receives: query (string), category (optional), minPrice/maxPrice (optional numbers), page (number). It must return: (1) Matching products sorted by relevance, (2) Category facet counts, (3) Total result count. Use a compound operator to combine text search with filters, and $searchMeta for facets.',
    hints: [
      'Use Promise.all to run the results query and facet query in parallel.',
      'compound.must for text search, compound.filter for category and price range.',
      'range operator for price filter, text operator for category filter.',
      '$searchMeta with facet.facets for counting by category.',
    ],
    starterCode: `interface SearchParams {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page: number;
  pageSize: number;
}

interface SearchResult {
  products: any[];
  categoryFacets: Array<{ name: string; count: number }>;
  total: number;
}

async function searchProducts(params: SearchParams): Promise<SearchResult> {
  // TODO: compound search + facets in parallel
}`,
    solution: `interface SearchParams {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page: number;
  pageSize: number;
}

interface SearchResult {
  products: any[];
  categoryFacets: Array<{ name: string; count: number }>;
  total: number;
}

async function searchProducts(params: SearchParams): Promise<SearchResult> {
  const { query, category, minPrice, maxPrice, page, pageSize } = params;

  // Build compound search
  const mustClauses: any[] = [{ text: { query, path: ['name', 'description'] } }];
  const filterClauses: any[] = [];

  if (category) {
    filterClauses.push({ text: { query: category, path: 'category' } });
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const rangeClause: any = { range: { path: 'price' } };
    if (minPrice !== undefined) rangeClause.range.gte = minPrice;
    if (maxPrice !== undefined) rangeClause.range.lte = maxPrice;
    filterClauses.push(rangeClause);
  }

  const searchStage = {
    $search: {
      index: 'products_search',
      compound: { must: mustClauses, ...(filterClauses.length ? { filter: filterClauses } : {}) },
      count: { type: 'total' },
    }
  };

  const [products, facetData] = await Promise.all([
    // 1. Products -- \$\$SEARCH_META is the system variable carrying the
    // count metadata requested by count: { type: 'total' } above; it is
    // NOT a plain field name embedded directly on each document.
    db.collection('products').aggregate([
      searchStage,
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
      { $project: { name: 1, price: 1, category: 1, score: { $meta: 'searchScore' }, meta: '\$\$SEARCH_META' } },
    ]).toArray(),

    // 2. Facets
    db.collection('products').aggregate([
      {
        $searchMeta: {
          index: 'products_search',
          facet: {
            operator: { compound: { must: mustClauses, ...(filterClauses.length ? { filter: filterClauses } : {}) } },
            facets: { categoryFacet: { type: 'string', path: 'category', numBuckets: 10 } },
          }
        }
      }
    ]).toArray(),
  ]);

  const buckets = facetData[0]?.facet?.categoryFacet?.buckets ?? [];
  return {
    products,
    categoryFacets: buckets.map((b: any) => ({ name: b._id, count: b.count })),
    total: products[0]?.meta?.count?.total ?? 0,
  };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the requirement for the $search stage in an aggregation pipeline?',
      options: [
        '$search can appear anywhere in the pipeline',
        '$search must be the first stage in the pipeline',
        '$search must come after $match stages',
        '$search must be the last stage before $project',
      ],
      answer: 1,
      explanation: '$search must always be the FIRST stage in an aggregation pipeline. You cannot put $match, $sort, $limit, or any other stage before $search. Filters within Atlas Search are done using compound operator\'s filter clause, not $match before $search.',
    },
    {
      q: 'What is the difference between $search and $searchMeta?',
      options: [
        '$search is faster; $searchMeta is more accurate',
        '$search returns documents; $searchMeta returns only metadata (facet counts, total)',
        '$searchMeta is the new API; $search is deprecated',
        '$search works on all MongoDB deployments; $searchMeta requires Atlas',
      ],
      answer: 1,
      explanation: '$search returns matching documents with relevance scores. $searchMeta returns only metadata — facet counts, total result count, etc. — without returning any documents. Use $searchMeta when you only need counts for a search UI filter sidebar, saving the cost of fetching document data.',
    },
    {
      q: 'Which Atlas Search feature is required to implement search-as-you-type?',
      options: [
        'phrase operator',
        'text operator with fuzzy matching',
        'autocomplete operator with edge-gram index mapping',
        'near operator with date field',
      ],
      answer: 2,
      explanation: 'The autocomplete operator requires a special index mapping with tokenization: "edgeGram" (or "nGram") on the field. Edge-gram creates prefix tokens for each word. Without this specific index mapping, autocomplete won\'t work — you cannot use the regular text index for prefix/autocomplete queries.',
    },
    {
      q: 'Which compound operator clause boosts document scores without making the match required?',
      options: ['must', 'mustNot', 'should', 'filter'],
      answer: 2,
      explanation: 'The should clause in compound operator is optional — documents can match without it. But if a document matches a should clause, its relevance score is boosted. This is used for "soft preferences": return results even without this condition, but rank them higher if they have it (e.g., boost in-stock products without excluding out-of-stock).',
    },
    {
      q: 'Atlas Search works on which MongoDB deployment types?',
      options: [
        'All MongoDB deployments including self-hosted',
        'MongoDB Atlas clusters only',
        'MongoDB Enterprise with advanced settings',
        'Any replica set regardless of where it\'s hosted',
      ],
      answer: 1,
      explanation: 'Atlas Search is an Atlas-exclusive feature — it requires MongoDB Atlas. It uses a separate Lucene-based search process that runs alongside MongoDB in the Atlas infrastructure. Self-hosted MongoDB (Community, Enterprise, Docker) does not support $search or Atlas Search. Use $text (built-in, limited) or a separate Elasticsearch cluster for self-hosted full-text search.',
    },
    { q: 'What is the difference between MongoDB text indexes and Atlas Search?', options: ['Text indexes and Atlas Search are equivalent; Atlas Search is a cloud-managed version of text indexes', 'Text indexes are built into MongoDB for basic full-text search with limited features; Atlas Search uses a fully managed Apache Lucene engine providing advanced relevance scoring, facets, autocomplete, synonyms, and custom analyzers', 'Atlas Search replaces text indexes in MongoDB 7.0 and text indexes are being deprecated', 'Text indexes support multi-language search; Atlas Search is English-only'], answer: 1, explanation: 'Text indexes: built into all MongoDB editions. $text operator for basic keyword search. Limited to exact word matching with simple stemming. No facets, autocomplete, or fuzzy matching. Single $text query per query (cannot combine multiple text searches). Relevance score via { score: { $meta: "textScore" } }. Atlas Search: powered by Apache Lucene (same engine as Elasticsearch). Available only on MongoDB Atlas. Supports: fuzzy matching (typo tolerance), phrase matching, wildcard and regex, autocomplete with edge n-grams, synonyms, custom analyzers (language-specific tokenization, stop words, stemming), faceted search, cross-field boosting, explain plans for relevance debugging. Uses $search pipeline stage. For anything beyond basic keyword search, Atlas Search is significantly more capable.' },
    { q: 'What is the $search pipeline stage and how does it integrate with aggregation?', options: ['$search replaces the $match stage for text filtering and cannot be combined with other aggregation stages', '$search is the first stage of an Atlas Search query that executes full-text search and returns documents with relevance scores; subsequent pipeline stages can filter, sort, project, and aggregate the results', '$search is a special collection type in Atlas that stores pre-indexed search results separately from the main collection', '$search only works with string fields; numeric and date fields require separate $searchMeta queries'], answer: 1, explanation: '$search must be the first stage in an aggregation pipeline (with some exceptions). It sends a Lucene query to the Atlas Search service and returns matching documents with a search score. Example: db.products.aggregate([ { $search: { index: "default", text: { query: "laptop bag", path: "name" } } }, { $project: { name: 1, price: 1, score: { $meta: "searchScore" } } }, { $limit: 10 } ]). $searchMeta: like $search but returns only metadata (facet counts, total count) without the documents. Use $facet within $search for combined results and facet counts in one query. $search uses Atlas Search indexes (configured separately from regular MongoDB indexes) and requires an Atlas cluster.' },
    { q: 'What is the compound operator in Atlas Search and why is it important?', options: ['The compound operator joins multiple Atlas Search index definitions into a single combined index for performance', 'The compound operator combines multiple Atlas Search sub-queries using must, should, mustNot, and filter clauses to build complex relevance-ranked queries with fine-grained scoring control', 'The compound operator is used to run a text search across multiple collections simultaneously in Atlas Search', 'The compound operator configures how Atlas Search synchronizes with the primary MongoDB collection during indexing'], answer: 1, explanation: 'Compound operator: { $search: { compound: { must: [...], should: [...], mustNot: [...], filter: [...] } } }. must: all sub-queries must match (AND). Documents not matching any must clause are excluded. Sub-queries in must contribute to relevance score. should: sub-queries should match. Documents not matching should clauses are still included (unless minimumShouldMatch is set). Matching should clauses boost relevance score. mustNot: sub-queries must NOT match. Excludes matching documents. Does not affect relevance score. filter: sub-queries must match but DO NOT affect relevance score. Use filter for date ranges, status filters, and other constraints that should not change ranking. Why it matters: compound controls both filtering and relevance scoring in a single query. A must text match combined with a should boost for recent documents and a filter for in-stock items produces a ranked, filtered result set in one round trip.' },
    { q: 'What is the Atlas Search autocomplete operator and how is it configured?', options: ['Autocomplete in Atlas Search is a server-side feature that requires no special index configuration beyond the standard text index', 'Autocomplete uses edge n-gram tokenization configured in the Atlas Search index definition to enable prefix-based matching for search-as-you-type UIs, querying with the autocomplete operator in $search', 'Autocomplete is only available via the Atlas Data API, not the MongoDB driver aggregation pipeline', 'Autocomplete stores a separate suggestion collection and the $search autocomplete operator queries that collection'], answer: 1, explanation: 'Atlas Search autocomplete: two components: index configuration and query. Index configuration: in the Atlas Search index definition, configure the field with tokenization: edgeGram, minGrams: 2, maxGrams: 15. This generates n-grams from the beginning of each word (edge n-grams). Typing "lap" matches "laptop", "lapse", etc. Query: { $search: { autocomplete: { query: "lap", path: "name", fuzzy: { maxEdits: 1 } } } }. fuzzy allows one typo (for tolerance of misspellings). tokenOrder: sequential (default) or any — controls whether multi-word queries must appear in sequence. Boost relevance: combine in compound.must for required match and compound.should for scoring. Performance: autocomplete queries are fast because edge n-grams are pre-computed at index time. Keep the field list indexed for autocomplete to only the fields that need it — n-grams increase index size.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does Atlas Search differ from MongoDB\'s built-in $text operator?',
      a: '<code>$text</code> is MongoDB\'s native full-text search: synchronous (indexes updates immediately), works on self-hosted, but limited — no fuzzy matching, no relevance tuning, no autocomplete, no facets, no highlighting. <strong>Atlas Search</strong> is powered by Lucene: near-real-time (1-5s delay), Atlas-only, but supports fuzzy matching, autocomplete, faceted search, highlighting, synonyms, custom analyzers, and relevance tuning. For production search UIs, Atlas Search is far more capable.',
    },
    {
      q: 'How do I combine Atlas Search relevance with MongoDB sorting (e.g., sort by "most relevant" and "newest")?',
      a: 'Use the <code>sort</code> option inside the $search stage: <code>sort: { score: { $meta: "searchScore" }, createdAt: -1 }</code>. This blends relevance with date. Alternatively, use the <code>near</code> operator to boost scores for recent documents: <code>near: { path: "createdAt", origin: new Date(), pivot: 7776000000 }</code> (pivot in ms — 90 days). The near boost decays with distance from the origin date, naturally blending freshness into the relevance score.',
    },
    {
      q: 'How do I handle Atlas Search\'s near-real-time indexing delay?',
      a: 'Atlas Search indexes updates asynchronously — typically within 1–5 seconds. For user-generated content where the user expects to immediately see their own new document in search results, use a "read-your-own-writes" pattern: after a successful insert, immediately display the inserted document in the UI (from the returned insertedId) rather than re-querying Atlas Search. For searches that don\'t need to surface the very latest documents, the 1-5s delay is usually imperceptible to users.',
    },
    {
      q: 'How do synonym mappings work in Atlas Search?',
      a: 'Create a "synonym source collection" in your database containing synonym mappings: <code>{ mappingType: "equivalent", synonyms: ["mobile", "cell", "phone", "smartphone"] }</code> or <code>{ mappingType: "explicit", input: ["iphone"], synonyms: ["apple phone"] }</code>. Reference this collection in your Search Index JSON configuration under <code>synonyms</code>. After the index rebuilds, queries for "mobile" automatically also find "smartphone" documents. Synonym updates require the index to resync.',
    },
    {
      q: 'Can I use Atlas Search with Mongoose?',
      a: 'Yes — since Atlas Search uses the aggregation pipeline ($search stage), it works with any MongoDB driver, including Mongoose. Use <code>Model.aggregate([{ $search: { ... } }, ...])</code>. Note that Mongoose\'s <code>.find()</code> and <code>.where()</code> methods use MongoDB\'s B-tree index queries, not Atlas Search — you must go through <code>.aggregate()</code> to use $search. Also, Mongoose\'s populate() doesn\'t work directly on aggregate results — use $lookup inside the pipeline instead.',
    },
    { q: 'How do you implement faceted search with Atlas Search?', a: 'Faceted search returns search results AND aggregated counts (facets) for filtering dimensions (categories, price ranges, brands) in one request. Two approaches: $searchMeta stage: returns only facet counts, not documents. Useful when you need just counts for a sidebar. $search with $facet operator: combines document results and facet counts in the same pipeline using $facet to fork. Atlas Search $facet collector (inside $searchMeta): { $searchMeta: { facet: { operator: { text: { query: "laptop", path: "name" } }, facets: { categoryFacet: { type: "string", path: "category", numBuckets: 10 }, priceFacet: { type: "number", path: "price", boundaries: [0, 50, 100, 500] } } } } }. Returns: { count: { lowerBound: N }, facet: { categoryFacet: { buckets: [...] }, priceFacet: { buckets: [...] } } }. The Atlas Search index must have the facet field mapped as: { type: "stringFacet" } or { type: "numberFacet" } — different from regular field mappings. Combine: use $facet in the aggregation pipeline (not the $search facet operator) to run $search (document results) and $searchMeta (facet counts) in parallel.' },
    { q: 'What analyzers does Atlas Search support and when do you customize them?', a: 'Built-in analyzers: standard (default) — tokenizes on whitespace and punctuation, lowercases, removes stop words. lucene.english — English-specific stemming (running -> run, runs -> run). lucene.french, lucene.german, etc. — language-specific. keyword — treats the entire field as one token (for exact matching, IDs, tags). whitespace — splits on whitespace only, no lowercasing. When to customize: multi-language content (configure different analyzers per field). Domain-specific terms not handled by standard stemming (medical, legal). Custom stop words (add domain-specific words to ignore). Edge n-gram for autocomplete. Custom tokenization (split on hyphens, preserve special characters). Custom analyzer structure: { name: "myAnalyzer", charFilters: [...], tokenizer: { type: "whitespace" }, tokenFilters: [{ type: "lowercase" }, { type: "englishPossessive" }] }. Set the analyzer and searchAnalyzer (query-time analyzer — often less aggressive than index-time) separately. Asymmetric analyzers: index with n-grams for recall; search without n-grams to avoid over-matching.' },
    { q: 'How does Atlas Search handle relevance scoring and how do you customize it?', a: 'Default relevance scoring: Apache Lucene BM25 scoring (industry standard). Factors: term frequency (TF) — how often the query term appears in the field. Inverse document frequency (IDF) — how rare the term is across all documents. Field length — shorter fields score higher for the same term frequency. Score access: add { $meta: "searchScore" } to the $project stage to expose the relevance score. Customizing scores: boost: multiply the score of a specific field match. { text: { query: "shirt", path: "name", score: { boost: { value: 3 } } } } — boost name matches 3x. constant: replace the computed score with a fixed value (useful for must/should clause combinations). function: compute a custom score based on document fields using an expression (blend text relevance with a business metric like sales rank or freshness). compound.should with multiple boosts: weight different fields differently (name match boosted more than description). Near operator: boost documents where a numeric or date field is closer to a target value.' },
    { q: 'What is the Atlas Search $vectorSearch stage and what is it used for?', a: '$vectorSearch is an Atlas-exclusive pipeline stage for performing approximate nearest neighbor (ANN) vector similarity search. Use cases: semantic search (find documents similar in meaning, not just keyword match). Recommendation engines (find items similar to a user view). Image similarity (find images similar to a query image using embedding vectors). How it works: generate vector embeddings for your documents at write time using an embedding model (OpenAI, Cohere, Google VertexAI, custom). Store embeddings as a vector field (array of floating-point numbers). Create a vector search index specifying the field, vector dimensions, and similarity metric (cosine, euclidean, dotProduct). Query: { $vectorSearch: { index: "vectorIndex", path: "embedding", queryVector: [0.1, 0.2, ...], numCandidates: 100, limit: 10 } }. numCandidates: the number of candidate vectors to examine before selecting the top limit results. Hybrid search: combine $vectorSearch with $search (keyword) using $unionWith and reciprocal rank fusion to get both semantic and keyword relevance.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Atlas Search adds Lucene-powered full-text search to MongoDB Atlas via $search aggregation stage — supporting fuzzy matching, autocomplete, facets, and highlighting.',
    mustKnow: [
      '$search must be the FIRST stage in the aggregation pipeline',
      'Requires a Search Index created in Atlas UI (separate from B-tree indexes)',
      'Atlas Search is Atlas-only — $text for self-hosted',
      'compound operator: must (required) / should (boost) / filter (no score impact) / mustNot',
      'autocomplete needs edge-gram index mapping — not the default text mapping',
      '$searchMeta for facet counts only; $search for documents',
      'Near-real-time indexing — 1-5s delay after writes',
    ],
    interviewFocus: [
      '$search vs $text — when to use each',
      'compound operator clauses and their score impact',
      'Autocomplete — index configuration requirement',
      'Faceted search — $searchMeta with facet operator',
      'Atlas Search limitations (Atlas-only, near-real-time)',
    ],
  };
}
