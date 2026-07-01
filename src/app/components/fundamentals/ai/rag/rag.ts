import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-ai-rag',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './rag.html',
  styleUrl: './rag.scss',
})
export class AiRag {
  quickRef: QuickRefItem[] = [
    { name: 'RAG',           type: 'keyword', desc: 'Retrieval-Augmented Generation — retrieve relevant docs at query time, inject into LLM context.' },
    { name: 'Embedding',     type: 'keyword', desc: 'Dense vector representation of text. Similar semantics → nearby vectors. dim=768–3072 typical.' },
    { name: 'Cosine similarity', type:'function',desc: 'cos(θ) = A·B / (|A||B|). Measures angle between vectors — 1=identical direction, 0=orthogonal.' },
    { name: 'Chunking',      type: 'keyword', desc: 'Split documents into pieces (256–512 tokens) before embedding. Chunk size affects retrieval quality.' },
    { name: 'Top-k retrieval',type:'keyword', desc: 'Return the k most similar chunks. k=3–10 are common. More context helps but increases latency/cost.' },
    { name: 'Reranking',     type: 'keyword', desc: 'Cross-encoder model re-scores initial retrieval results for better precision — e.g. Cohere Rerank.' },
    { name: 'Hybrid search', type: 'keyword', desc: 'BM25 (keyword) + vector search combined via RRF — better recall than either alone.' },
    { name: 'Hallucination', type: 'keyword', desc: 'LLM generates plausible but incorrect content. RAG grounds responses in retrieved facts.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'RAG Architecture',
      points: [
        'Problem: LLMs have static knowledge (training cutoff) and limited context. RAG connects them to live, domain-specific knowledge.',
        'Indexing pipeline: load documents → chunk into pieces (256–512 tokens) → embed each chunk → store (vector + text + metadata) in a vector database.',
        'Query pipeline: embed the user query → retrieve top-k similar chunks → inject chunks into the LLM prompt → generate grounded response.',
        'The LLM acts as a reasoning engine over retrieved evidence, not as a knowledge store — dramatically reduces hallucination.',
        'Modular: swap the embedding model, vector store, or LLM independently. Easy to update knowledge without retraining.',
      ],
    },
    {
      heading: 'Chunking Strategies',
      points: [
        'Fixed-size chunking: split every N tokens with M-token overlap. Simple, predictable. Risk: splits mid-sentence or mid-concept.',
        'Semantic chunking: split at sentence/paragraph boundaries. Better coherence but variable chunk sizes.',
        'Recursive character splitting (LangChain default): try splitting at \\n\\n, then \\n, then " ", then "". Pragmatic and widely used.',
        'Small-to-big / parent-document: embed small chunks for precise retrieval but fetch the surrounding large chunk for context.',
        'Overlap (e.g. 50 tokens): ensures a concept split across a boundary appears in at least one chunk fully.',
      ],
    },
    {
      heading: 'Embedding Models and Retrieval',
      points: [
        'Bi-encoder: embed query and chunks independently with the same model; compare via cosine similarity at retrieval time. Fast — precompute chunk embeddings.',
        'Popular models: text-embedding-3-large (OpenAI), embed-english-v3 (Cohere), e5-large-v2, bge-m3 (BAAI, open-source).',
        'ANN (Approximate Nearest Neighbour): FAISS (Meta), HNSWlib — find top-k similar vectors in milliseconds over millions of chunks.',
        'BM25 keyword search: sparse retrieval. Fast, no embeddings, great for exact terms. Misses synonyms and paraphrases.',
        'Hybrid search (RRF): combine BM25 and dense retrieval scores. Reciprocal Rank Fusion: score = Σ 1/(k + rank_i). Best of both worlds.',
      ],
    },
    {
      heading: 'Advanced RAG Patterns',
      points: [
        'Reranking: retrieve top-20, then use a cross-encoder (reads query + chunk together) to score and reorder to top-5. Much higher precision.',
        'Query rewriting/HyDE: rephrase the user query for better retrieval, or generate a hypothetical answer and embed that (HyDE).',
        'Multi-query retrieval: generate 3–5 paraphrases of the query, retrieve for each, union and deduplicate results.',
        'RAPTOR: recursively summarise clusters of chunks, embed summaries — enables retrieval at multiple granularities.',
        'Self-RAG: model generates special tokens to decide when to retrieve and to evaluate relevance of retrieved chunks.',
      ],
    },
    {
      heading: 'Chunking Strategy Determines Retrieval Quality',
      points: [
        'Chunk size directly trades off precision against context — very small chunks retrieve precisely relevant snippets but may lack surrounding context the model needs, while very large chunks provide context but dilute relevance and waste context window space on irrelevant content.',
        'Naive fixed-length chunking (splitting every N characters regardless of content boundaries) can split a sentence or logical unit mid-thought, degrading both embedding quality and the coherence of retrieved context — semantic or structure-aware chunking (splitting at paragraph/section boundaries) typically retrieves more coherent results.',
        'Overlapping chunks (each chunk sharing some content with its neighbor) reduces the risk that a relevant piece of information falls exactly at a chunk boundary and gets split across two chunks, neither of which alone contains the full relevant context.',
        'Chunking strategy should be tuned to the actual document type and query patterns — a strategy that works well for short FAQ entries may perform poorly on long technical documents with deeply nested structure, making this a genuinely dataset-specific design decision rather than a one-size-fits-all default.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Cosine Similarity',
      language: 'typescript',
      code: `// Core retrieval math: cosine similarity between query and chunk embeddings

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB + 1e-10);
}

// Simple in-memory vector store
interface Chunk {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

class SimpleVectorStore {
  private chunks: Chunk[] = [];

  add(chunk: Chunk): void {
    this.chunks.push(chunk);
  }

  search(queryEmbedding: number[], topK = 5): Array<{ chunk: Chunk; score: number }> {
    return this.chunks
      .map(chunk => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

// Reciprocal Rank Fusion for hybrid search
function rrfScore(ranks: number[], k = 60): number {
  return ranks.reduce((sum, rank) => sum + 1 / (k + rank + 1), 0);
}`,
    },
    {
      label: 'RAG Pipeline',
      language: 'typescript',
      code: `// Full RAG pipeline using LangChain.js (TypeScript)
// npm install langchain @langchain/openai @langchain/community

// import { OpenAIEmbeddings } from '@langchain/openai';
// import { MemoryVectorStore } from 'langchain/vectorstores/memory';
// import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
// import { ChatOpenAI } from '@langchain/openai';
// import { createRetrievalChain } from 'langchain/chains/retrieval';
// import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
// import { ChatPromptTemplate } from '@langchain/core/prompts';

async function buildRagPipeline(documents: string[]) {
  // 1. Chunk documents
  // const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 512, chunkOverlap: 50 });
  // const chunks = await splitter.createDocuments(documents);

  // 2. Embed and store
  // const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' });
  // const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
  // const retriever = vectorStore.asRetriever({ k: 5 });

  // 3. RAG prompt
  // const prompt = ChatPromptTemplate.fromTemplate(\`
  //   Answer based only on the following context:
  //   {context}
  //   Question: {input}
  //   If the context doesn't contain the answer, say "I don't know based on the provided documents."
  // \`);

  // 4. Chain
  // const llm = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });
  // const documentChain = await createStuffDocumentsChain({ llm, prompt });
  // const retrievalChain = await createRetrievalChain({ retriever, combineDocsChain: documentChain });

  // 5. Invoke
  // const result = await retrievalChain.invoke({ input: 'What is the return policy?' });
  // console.log(result.answer);
  // console.log(result.context);  // the retrieved chunks
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using chunk sizes that are too large',
      wrong: `// Chunking entire pages (2000+ tokens) as single chunks
// Problem: embeddings average over too much content → poor retrieval precision
splitter = RecursiveCharacterTextSplitter(chunk_size=2000)`,
      right: `// 256–512 tokens per chunk with 50-token overlap
// Focused chunks → better semantic match with the query
splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=50)`,
      explanation: 'Large chunks dilute the embedding — the vector represents many topics at once and won\'t match specific queries well. Small, focused chunks (256–512 tokens) give precise retrieval. Use overlap to avoid splitting mid-concept.',
    },
    {
      title: 'Not instructing the LLM to stay grounded in retrieved context',
      wrong: `prompt = "Answer this question: {question}"
# LLM ignores retrieved context and uses its training knowledge → hallucinations`,
      right: `prompt = """Answer ONLY using the context below. If the answer is not in the context, say "I don't know."
Context: {context}
Question: {question}"""`,
      explanation: 'Without explicit grounding instructions, the LLM blends retrieved context with its parametric knowledge. The grounding prompt forces it to cite the retrieved evidence and admit uncertainty when context is insufficient.',
    },
    {
      title: 'Embedding the raw query without any enhancement',
      wrong: `# Short queries embed poorly — sparse signal in high-dimensional space
query_embedding = embed("return policy")
# Miss: "refund", "exchange", "money back", "send back"`,
      right: `# Query expansion: add related terms or paraphrases
expanded = llm.complete(f"Generate 3 search queries for: {query}")
# Or use HyDE: embed a hypothetical answer instead of the query
hypothetical_answer = llm.complete(f"Write a brief answer to: {query}")
embedding = embed(hypothetical_answer)`,
      explanation: 'Short queries embed as sparse points in high-dimensional space, missing semantically similar content phrased differently. Query expansion or HyDE (Hypothetical Document Embeddings) dramatically improves recall.',
    },
    {
      title: 'Retrieving too few or too many chunks',
      wrong: `# k=1: misses relevant context, single chunk might not answer fully
# k=50: context window overflows; LLM "lost in the middle" effect
retriever = vectorstore.as_retriever(search_kwargs={"k": 50})`,
      right: `# k=3–10 for most use cases; use reranking to refine from k=20
# For long-context models (100K+): k=10–20 is fine
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
# Then rerank with a cross-encoder to get top 3`,
      explanation: 'Too few chunks miss context; too many dilute the prompt and trigger "lost in the middle" — LLMs attend poorly to content in the middle of long contexts. Retrieve ~20, rerank to 3–5 for best results.',
    },
  ];

  challenge: Challenge = {
    title: 'Cosine Similarity Top-K',
    language: 'typescript',
    description: 'Given a query embedding and a list of chunk embeddings (with text), return the top-k chunks sorted by cosine similarity.',
    hints: [
      'Cosine similarity = dot(a, b) / (|a| * |b|)',
      'Sort descending by score, take first k',
    ],
    starterCode: `interface Chunk { text: string; embedding: number[]; }

function topKChunks(
  queryEmb: number[],
  chunks: Chunk[],
  k: number
): Array<{ text: string; score: number }> {
  // Return top-k chunks by cosine similarity
}`,
    solution: `interface Chunk { text: string; embedding: number[]; }

function topKChunks(
  queryEmb: number[],
  chunks: Chunk[],
  k: number
): Array<{ text: string; score: number }> {
  function cosine(a: number[], b: number[]): number {
    const dot = a.reduce((s, v, i) => s + v * b[i], 0);
    const na = Math.sqrt(a.reduce((s, v) => s + v*v, 0));
    const nb = Math.sqrt(b.reduce((s, v) => s + v*v, 0));
    return dot / (na * nb + 1e-10);
  }
  return chunks
    .map(c => ({ text: c.text, score: cosine(queryEmb, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main problem RAG solves compared to a base LLM?',
      options: [
        'RAG reduces inference latency',
        'RAG grounds responses in retrieved facts, reducing hallucination and enabling up-to-date knowledge',
        'RAG improves the model\'s reasoning ability',
        'RAG reduces the need for tokenisation',
      ],
      answer: 1,
      explanation: 'LLMs have a training cutoff and a finite context of learned facts. RAG retrieves relevant documents at query time and injects them into the context — grounding the response in verifiable sources and enabling knowledge beyond the training cutoff.',
    },
    {
      q: 'Why use hybrid search (BM25 + vector) instead of vector search alone?',
      options: [
        'BM25 is faster than vector search',
        'Vector search doesn\'t work with long documents',
        'BM25 catches exact keyword matches that semantic search misses; combining both improves recall',
        'Hybrid search uses less memory',
      ],
      answer: 2,
      explanation: 'Vector search finds semantically similar content but can miss exact terms (product codes, proper nouns). BM25 catches these but misses paraphrases. Hybrid search via RRF gets the best of both, consistently outperforming either alone.',
    },
    {
      q: 'What does a reranker do in a RAG pipeline?',
      options: [
        'Re-embeds chunks with a larger model',
        'Uses a cross-encoder to re-score and reorder the initial top-k retrieval results for higher precision',
        'Removes duplicate chunks',
        'Compresses chunks to fit in the context window',
      ],
      answer: 1,
      explanation: 'Bi-encoder retrieval is fast but imprecise (query and chunk embedded independently). A reranker (cross-encoder) reads query + chunk together, capturing fine-grained relevance signals. Retrieve top-20, rerank to top-5 is the standard pattern.',
    },
  { q: 'What is the retrieval step in RAG and how is it implemented?', options: ['Keyword search on document titles', 'Semantic search using vector embeddings — query is embedded, nearest document chunks retrieved by cosine similarity', 'Full document scan for every query', 'Fine-tuning the LLM on documents'], answer: 1, explanation: 'RAG retrieval: embed the query with an embedding model, search a vector database (Pinecone, Weaviate, pgvector) for the k nearest chunks by cosine/dot-product similarity. The retrieved chunks provide the context injected into the LLM prompt.' },
  { q: 'What is chunking strategy in RAG and why does it matter?', options: ['It does not matter — use full documents', 'How documents are split into passages affects retrieval quality — too small loses context; too large dilutes relevance', 'Always split by exactly 100 words', 'Chunking is only needed for PDFs'], answer: 1, explanation: 'Chunking affects both what gets embedded and what context the LLM receives. Fixed-size with overlap: 500-1000 tokens, 10-20% overlap (prevents splitting mid-sentence). Semantic chunking: split at natural boundaries (paragraphs, sections). Small-to-big: index small chunks, retrieve parent for context.' },
  { q: 'What is the difference between sparse and dense retrieval?', options: ['Sparse is for images; dense for text', 'Sparse (BM25): keyword matching using TF-IDF; dense: semantic vector search using embeddings', 'Dense retrieval is always better', 'Sparse retrieval requires more compute'], answer: 1, explanation: 'BM25 (sparse): ranks documents by keyword frequency — exact match, fast, no meaning. Dense: semantic embeddings — finds relevant docs without exact keywords, handles synonyms. Hybrid: combine sparse + dense scores (RRF, weighted sum). Best RAG systems use hybrid retrieval.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I evaluate RAG pipeline quality?',
      a: 'Evaluate two components separately: (1) Retrieval quality — recall@k (are the relevant chunks in the top-k?), MRR (mean reciprocal rank), nDCG. (2) Generation quality — faithfulness (does the answer use the retrieved context?), answer relevance (does it answer the question?), context precision (are the retrieved chunks actually used?). Tools: RAGAS (automated RAG evaluation), DeepEval, TruLens. Build a golden dataset of (question, answer, ground-truth chunks) for offline evaluation.',
    },
    {
      q: 'What is the difference between naive RAG and agentic RAG?',
      a: 'Naive RAG: single retrieval step → inject context → generate. Simple but rigid — one retrieval shot, no iteration. Agentic RAG: the LLM decides when and what to retrieve, can issue multiple queries, evaluate retrieved content, rephrase and retry, or combine results from different sources. Examples: Self-RAG (model generates retrieval tokens), ReAct (reason+act loop), and LLM-as-judge filtering. Agentic RAG handles complex multi-hop questions that naive RAG can\'t.',
    },
  { q: 'How do you evaluate a RAG pipeline?', a: 'Evaluation components: (1) Retrieval metrics: context precision (retrieved chunks are relevant), context recall (all relevant chunks retrieved); (2) Generation metrics: faithfulness (answer is grounded in context), answer relevance (answer addresses the question). Tools: RAGAS library computes these automatically using LLM-as-judge. Build an evaluation dataset of (question, ground truth context, expected answer) triples from your document corpus.' },
  { q: 'What is HyDE (Hypothetical Document Embeddings) in RAG?', a: 'HyDE: instead of embedding the raw user query (which may not resemble document text), prompt an LLM to generate a hypothetical document that would answer the question. Embed the generated document and use it to retrieve real documents. The generated text is closer in distribution to indexed documents, improving retrieval quality for questions that are phrased very differently from document text.' },
  { q: 'How do you handle multi-hop questions in RAG?', a: 'Multi-hop: questions requiring information from multiple documents (Who is the CEO of the company that acquired X?). Approaches: (1) Iterative retrieval: retrieve once, extract partial answer, retrieve again with expanded query; (2) Query decomposition: LLM breaks question into subquestions, retrieves for each, synthesizes; (3) Knowledge graph + RAG: pre-compute entity relationships. Basic single-hop RAG fails on these — multi-hop is an active research area. ReAct-style agents handle it naturally.' },
  { q: 'What is reranking in RAG and when should you add it?', a: 'Reranking: after initial retrieval (k=20 candidates), use a cross-encoder model (Cohere Rerank, BGE Reranker, GPT-4 as judge) to score each candidate and select the top k (e.g., 3-5) to pass to the LLM. Cross-encoders see both query and document simultaneously (more accurate than bi-encoder retrieval but slower). Add reranking when: retrieval quality is insufficient, context window is limited (must select the best chunks), or initial retrieval is noisy.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'RAG = chunk documents → embed → store in vector DB → retrieve top-k similar chunks at query time → inject into LLM context for grounded answers.',
    mustKnow: [
      'Indexing: load → chunk (256–512 tokens, 50 overlap) → embed → vector store',
      'Retrieval: embed query → cosine similarity top-k → optional rerank',
      'Hybrid: BM25 + vector via RRF — better recall than either alone',
      'Grounding prompt: "Answer ONLY from context; say I don\'t know if absent"',
      'Reranking: retrieve 20, rerank with cross-encoder to top 5',
      'RAG for knowledge; fine-tuning for behaviour/style',
    ],
    interviewFocus: [
      'Describe the full RAG indexing and query pipeline',
      'Why use hybrid search over pure vector search?',
      'How would you evaluate a RAG system?',
    ],
  };
}
