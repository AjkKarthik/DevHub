import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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

const quickRef: QuickRefItem[] = [
  { name: '1M req/day',    type: 'keyword', desc: '≈ 12 QPS. Useful anchor: 100M req/day ≈ 1,157 QPS.' },
  { name: '86,400',        type: 'keyword', desc: 'Seconds in a day. Memorise this for QPS conversions.' },
  { name: 'Storage scale', type: 'keyword', desc: 'KB → MB → GB → TB → PB. Each step is 1,024×.' },
  { name: 'Read:Write',    type: 'syntax',  desc: 'Always establish the ratio first. Drives cache sizing, replica count, shard strategy.' },
  { name: '80/20 rule',    type: 'keyword', desc: '20% of content serves 80% of traffic. Use for cache sizing.' },
  { name: 'Bandwidth',     type: 'syntax',  desc: 'QPS × avg response size. Tells you if CDN / compression is needed.' },
  { name: 'Memory (cache)',type: 'keyword', desc: '20% hot data × daily storage footprint. Redis can hold ~10 GB per instance.' },
  { name: 'Peak factor',   type: 'keyword', desc: 'Multiply daily QPS by 3-5× for peak traffic (sales, viral events).' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Why estimation matters',
    points: [
      'Estimation drives component choice: 100 QPS → single server; 100k QPS → distributed cluster.',
      'Wrong estimates lead to wrong designs — over-engineering or under-provisioning.',
      'In interviews, writing estimates on the board shows engineering rigour and anchor-point thinking.',
    ],
  },
  {
    heading: 'Key numbers to memorise',
    points: [
      '1 day = 86,400 seconds ≈ 100k seconds (convenient approximation).',
      'Latency: L1 cache ~1ns, RAM ~100ns, SSD ~100µs, HDD ~10ms, network (same DC) ~500µs, cross-region ~150ms.',
      'Throughput: SSD ~500 MB/s sequential read, network ~1 Gbps = 125 MB/s, NVMe ~3 GB/s.',
      '1 million = 10^6; 1 billion = 10^9. Keep units consistent.',
    ],
  },
  {
    heading: 'QPS estimation',
    points: [
      'Formula: (DAU × requests_per_user_per_day) / 86,400 = avg QPS.',
      'Then multiply by read:write ratio to get read QPS and write QPS separately.',
      'Add peak multiplier (typically 3-5×) for burst capacity planning.',
    ],
  },
  {
    heading: 'Storage estimation',
    points: [
      'Formula: (writes_per_day × avg_object_size × retention_days).',
      'Add 3× for replication factor (most distributed systems replicate 3 copies).',
      'Add 20-30% overhead for indexes, metadata, and write-ahead logs.',
    ],
  },
  {
    heading: 'Cache sizing',
    points: [
      'Apply the 80/20 rule: cache the hottest 20% of objects.',
      'Formula: daily_storage_created × 0.2 = cache needed.',
      'Or: read_QPS × avg_object_size × cache_TTL = working set size.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'QPS Calculation',
    language: 'bash',
    code: `# --- Twitter-scale Feed example ---
# DAU = 300M
# Each user views feed 5×/day → 1.5B read requests/day
# Each user tweets 0.1×/day → 30M writes/day

# Read QPS  = 1.5B / 86,400 ≈ 17,360 QPS
# Write QPS = 30M  / 86,400 ≈    347 QPS
# Read:Write ratio ≈ 50:1

# Peak (assume 3× daily average)
# Peak read QPS  ≈ 52,000
# Peak write QPS ≈  1,040

echo "Reads:  17k avg,  52k peak"
echo "Writes:  347 avg, 1040 peak"`,
  },
  {
    label: 'Storage Calculation',
    language: 'bash',
    code: `# --- URL Shortener storage over 5 years ---
# 100M new URLs/day
# Avg record size: 500 bytes (url, alias, userId, createdAt, expiry, clicks)

# Daily storage  = 100M × 500B = 50 GB/day
# 5-year storage = 50 GB × 365 × 5 = 91.25 TB
# With 3× replication = 273 TB ≈ ~280 TB

# Index overhead (~30%): 273 TB × 1.3 = 355 TB total

echo "Raw storage:    91 TB"
echo "With replicas: 273 TB"
echo "With indexes:  355 TB"`,
  },
  {
    label: 'Latency Numbers',
    language: 'bash',
    code: `# --- Latency reference table (approximate) ---
# L1 cache reference          1 ns
# L2 cache reference          4 ns
# L3 cache reference         10 ns
# Main memory (RAM)          100 ns   (0.1 µs)
# SSD random read          100 µs   (0.1 ms)
# HDD seek                  10 ms
# Memcached get (same DC)    1 ms
# Redis get (same DC)        1 ms
# Network same data center   0.5 ms
# Network cross region      30-150 ms

# Rules of thumb:
# RAM is 100,000× faster than disk
# Network is 10× slower than RAM
# SSD is 1,000× faster than spinning disk`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using exact numbers instead of approximations',
    wrong: `QPS = 1,157.407 per second`,
    right: `QPS ≈ 1,200 per second (round up for safety margin)`,
    explanation: 'Estimation is about order-of-magnitude reasoning. Always round to 1-2 significant figures to communicate clearly and allow for headroom.',
  },
  {
    title: 'Forgetting replication factor in storage',
    wrong: `Storage = 100M records × 500B = 50 GB`,
    right: `Storage = 100M × 500B × 3 replicas = 150 GB (+ 30% index = 195 GB)`,
    explanation: 'Distributed systems store at least 3 copies for durability. Not accounting for replicas underestimates storage by 3×.',
  },
  {
    title: 'Not establishing read:write ratio',
    wrong: `// "We have 10k QPS total"`,
    right: `// "10k QPS: 9k reads (90%) + 1k writes (10%), ratio 9:1
// This drives: read replicas, caching strategy, CDN use"`,
    explanation: 'Read:write ratio determines your entire architecture — cache hit rate, shard strategy, consistency requirements. Always ask.',
  },
  {
    title: 'Ignoring peak traffic',
    wrong: `Servers needed = avg QPS / server_capacity`,
    right: `Servers needed = peak QPS / server_capacity
// Peak = avg × 3-5× for typical apps
// Viral apps can be 10-50× burst`,
    explanation: 'Sizing for average traffic means your system falls over during peak events. Always add a peak multiplier.',
  },
];

const challenge: Challenge = {
  title: 'Estimate capacity for Instagram-scale photo sharing',
  language: 'typescript',
  description: `Perform a back-of-envelope estimation for a photo-sharing app.

Given:
- 500M DAU
- Average user uploads 1 photo/day, views 30 photos/day
- Average photo size: 3 MB (after compression)
- Retain photos forever
- Cache the top 20% of photos

Calculate:
1. Write QPS and read QPS
2. Storage needed after 10 years
3. Bandwidth (upload and download)
4. Cache memory needed`,
  hints: [
    'Write QPS: 500M × 1 upload/day / 86,400',
    'Storage: write_QPS × 86,400 × 365 × 10 years × 3MB per photo',
    'Read bandwidth: read_QPS × avg_photo_size',
    'Cache: daily writes × 0.2 × 3MB',
  ],
  starterCode: `// CAPACITY ESTIMATION — Photo Sharing App

const DAU = 500_000_000;
const uploadsPerDay = 1;
const viewsPerDay = 30;
const avgPhotoSizeMB = 3;
const yearsRetention = 10;

// 1. QPS
const writeQPS = /* ? */ 0;
const readQPS  = /* ? */ 0;

// 2. Storage
const dailyStorageGB = /* ? */ 0;
const totalStorageTB = /* ? */ 0; // with 3× replication

// 3. Bandwidth
const uploadBandwidthGBps = /* ? */ 0;
const downloadBandwidthGBps = /* ? */ 0;

// 4. Cache
const cacheSizeGB = /* ? */ 0;

console.log({ writeQPS, readQPS, totalStorageTB, cacheSizeGB });`,
  solution: `// CAPACITY ESTIMATION — Photo Sharing App

const DAU = 500_000_000;
const secondsPerDay = 86_400;

// 1. QPS
const writeQPS = Math.round((DAU * 1) / secondsPerDay);  // 5,787 ≈ ~6k/s
const readQPS  = Math.round((DAU * 30) / secondsPerDay); // 173,611 ≈ ~174k/s

// 2. Storage (10 years, 3× replication)
const dailyWritesMB = writeQPS * secondsPerDay * 3; // MB per day
const tenYearMB = dailyWritesMB * 365 * 10;
const totalStorageTB = (tenYearMB * 3) / (1024 ** 2); // with replication → ~2,850 TB ≈ 2.9 PB

// 3. Bandwidth
const uploadBandwidthGBps  = (writeQPS * 3) / 1024; // ~17 GB/s
const downloadBandwidthGBps = (readQPS * 0.1) / 1024; // compressed thumbnails ~17 GB/s

// 4. Cache (top 20% hot photos — daily uploads × 0.2)
const dailyNewPhotosMB = writeQPS * secondsPerDay * 3;
const cacheSizeGB = (dailyNewPhotosMB * 0.2) / 1024; // ~300 GB/day → need distributed cache

console.log({ writeQPS, readQPS, totalStorageTB: Math.round(totalStorageTB), cacheSizeGB: Math.round(cacheSizeGB) });`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Approximately how many seconds are in a day?',
    options: ['10,000', '86,400', '100,000', '3,600'],
    answer: 1,
    explanation: '86,400 seconds/day (24h × 60m × 60s). For quick estimates, round to 100k.',
  },
  {
    q: '300M requests/day equals approximately how many QPS?',
    options: ['3,000', '30,000', '3,500', '300,000'],
    answer: 2,
    explanation: '300M / 86,400 ≈ 3,472 QPS. Quick formula: N million req/day ÷ 100k ≈ 10N QPS.',
  },
  {
    q: 'Why multiply storage by 3 in most estimates?',
    options: ['For backups only', 'Distributed systems replicate data 3 times for durability', 'To account for metadata overhead', 'For future growth'],
    answer: 1,
    explanation: 'Standard replication factor in distributed systems (e.g. HDFS, Kafka, DynamoDB) is 3 copies for fault tolerance — losing 2 nodes still retains one copy.',
  },
  {
    q: 'For cache sizing using the 80/20 rule, what fraction of data should you cache?',
    options: ['80%', '50%', '20%', '5%'],
    answer: 2,
    explanation: '20% of content serves 80% of traffic (Pareto principle). Caching the top 20% is cost-effective for most read-heavy systems.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Should my estimates be exact?',
    a: 'No — estimates are about order-of-magnitude reasoning. Round liberally (57,870 → ~60k). The goal is to set design parameters, not audit accounting. Interviewers value clear thinking over precise arithmetic.',
  },
  {
    q: 'What if I make a math mistake in the interview?',
    a: 'State your formula aloud so the interviewer can follow. If you make an arithmetic error they will usually correct it. What matters is the method and the conclusions you draw — not the exact number.',
  },
  {
    q: 'How do I know when the QPS is "too high" for a single server?',
    a: 'A commodity server can handle ~1k-10k QPS for typical CRUD operations. At 100k+ QPS you need horizontal scaling. At 1M+ QPS you need specialised infrastructure (Cloudflare, Fastly, DynamoDB global tables).',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Back-of-envelope: QPS = (DAU × req/user) / 86,400; Storage = writes/day × size × days × 3 replicas.',
  mustKnow: [
    '1 day ≈ 86,400 seconds; 100M req/day ≈ 1,157 QPS',
    'Latency: RAM 100ns, SSD 100µs, network 1ms, cross-region 150ms',
    'Always multiply storage by 3× for replication',
    'Cache = 20% of hot data (80/20 rule)',
    'Peak traffic = avg × 3-5× (viral: ×10-50)',
    'Bandwidth = QPS × avg response size',
  ],
  interviewFocus: [
    'Establish read:write ratio before doing any other math',
    'Write estimates visibly on the board — shows systematic thinking',
    'Round to 1-2 significant figures; precision is not the point',
    'Draw the conclusion: "50k read QPS → we need a cache layer"',
  ],
};

@Component({
  selector: 'app-sysdesign-capacity-estimation',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './capacity-estimation.html',
  styleUrl: './capacity-estimation.scss',
})
export class SysdesignCapacityEstimation {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
