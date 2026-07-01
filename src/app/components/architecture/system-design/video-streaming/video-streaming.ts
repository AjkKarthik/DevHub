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
  { name: 'Transcoding',    type: 'keyword', desc: 'Convert uploaded video to multiple resolutions (360p/720p/1080p/4K) and codecs (H.264/H.265/VP9/AV1).' },
  { name: 'HLS',            type: 'keyword', desc: 'HTTP Live Streaming — Apple standard. Splits video into 2-10s .ts segments + .m3u8 manifest.' },
  { name: 'DASH',           type: 'keyword', desc: 'Dynamic Adaptive Streaming over HTTP — ISO standard. Uses .mpd manifest + .mp4 segments.' },
  { name: 'ABR',            type: 'keyword', desc: 'Adaptive Bitrate Streaming — player switches quality based on measured bandwidth.' },
  { name: 'CDN',            type: 'keyword', desc: 'Serve video segments from edge PoPs near the viewer. 90% of traffic served from CDN cache.' },
  { name: 'Origin shield',  type: 'keyword', desc: 'Intermediate CDN layer that protects origin storage from cache-miss stampedes.' },
  { name: 'Thumbnail',      type: 'keyword', desc: 'Generated at multiple timestamps during transcoding. Stored on CDN alongside segments.' },
  { name: 'Pre-signed URL', type: 'keyword', desc: 'Time-limited S3 URL for secure upload/download without exposing bucket credentials.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Upload and transcoding pipeline',
    points: [
      'Client uploads raw video to S3 via pre-signed URL (direct — bypasses application servers).',
      'S3 triggers event → SQS/SNS → Transcoding Workers pick up job.',
      'Workers transcode to: 360p/H.264, 720p/H.264, 1080p/H.264, 4K/H.265. Each resolution = separate job.',
      'Output: HLS or DASH segments (2-6s each) + manifests uploaded to S3/CDN origin.',
    ],
  },
  {
    heading: 'HLS and adaptive bitrate streaming',
    points: [
      'Master manifest (.m3u8): lists all quality variants and their bandwidths.',
      'Media manifest: lists segment URLs for one quality level.',
      'Player measures download speed → switches quality to match available bandwidth.',
      'Buffer health: player pre-buffers 15-30s of video. ABR keeps buffer healthy at all bandwidths.',
    ],
  },
  {
    heading: 'CDN for video delivery',
    points: [
      'Video segments are immutable and cacheable forever (content-addressed filenames).',
      'CDN cache-hit ratio goal: > 90%. Popular videos: 99%+. Long tail: lower hit rate.',
      'Origin shield: intermediate CDN PoP in the same region as S3. Absorbs cache misses before they hit S3.',
      'Geo-distribution: place CDN PoPs in every major region. Video latency depends on distance to PoP.',
    ],
  },
  {
    heading: 'Live streaming vs VOD',
    points: [
      'VOD (Video on Demand): pre-transcoded, segments stored. Upload → transcode → serve. Consistent QoS.',
      'Live streaming: segments generated in real-time (< 2s latency with low-latency HLS). No seek buffer.',
      'Ingest: streamer pushes RTMP to ingest server → transcoded in real-time → segments pushed to CDN.',
      'Low-latency HLS (LLHLS): 1-3s latency vs standard HLS 10-30s.',
    ],
  },
  {
    heading: 'Adaptive Bitrate Streaming',
    points: [
      'Adaptive bitrate streaming (HLS, DASH) encodes the same video at multiple quality/bitrate levels and splits each into small segments (typically 2-10 seconds) — the client player continuously measures available bandwidth and switches between quality levels segment-by-segment for a smooth playback experience.',
      'This segment-based approach is what allows seamless quality switching without restarting playback — unlike a single fixed-bitrate stream that either buffers badly on a slow connection or wastes bandwidth on a fast one, adaptive streaming responds dynamically to changing network conditions mid-playback.',
      'Video encoding for streaming is computationally expensive and typically done asynchronously after upload — a transcoding pipeline (often using a distributed job queue) generates all required quality levels and segment formats before the video becomes available for playback, with the original upload not directly served to viewers.',
      'A CDN is essential for video delivery at any meaningful scale — video segments are cached at edge locations close to viewers, since re-fetching every segment from a central origin for every viewer would be both slow and prohibitively expensive in bandwidth costs.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Transcoding Pipeline',
    language: 'typescript',
    code: `// Video upload and transcoding pipeline

// Step 1: Generate pre-signed S3 URL for direct browser upload
async function getUploadUrl(userId: string, filename: string): Promise<UploadUrl> {
  const videoId = crypto.randomUUID();
  const key = \`uploads/\${userId}/\${videoId}/raw_\${filename}\`;

  const url = await s3.createPresignedPost({
    Bucket: 'my-video-uploads',
    Fields: { key, 'Content-Type': 'video/*' },
    Expires: 3600,  // 1 hour to complete upload
    Conditions: [['content-length-range', 0, 5_000_000_000]],  // max 5 GB
  });

  // Create video record in pending state
  await db.run(
    'INSERT INTO videos (id, user_id, status, s3_key) VALUES (?, ?, ?, ?)',
    [videoId, userId, 'pending', key]
  );

  return { videoId, uploadUrl: url };
}

// Step 2: S3 event → SQS → transcoding worker
async function handleUploadComplete(s3Event: S3Event): Promise<void> {
  const { key } = s3Event.s3.object;
  const videoId = extractVideoId(key);

  // Update status and queue transcoding jobs for each resolution
  await db.run('UPDATE videos SET status = ? WHERE id = ?', ['processing', videoId]);

  const resolutions = [
    { width: 640,  height: 360,  bitrate: '800k',  preset: 'fast' },
    { width: 1280, height: 720,  bitrate: '2500k', preset: 'fast' },
    { width: 1920, height: 1080, bitrate: '5000k', preset: 'slow' },
    { width: 3840, height: 2160, bitrate: '15000k', preset: 'slow' },
  ];

  await Promise.all(resolutions.map(res =>
    sqs.sendMessage({
      QueueUrl: TRANSCODE_QUEUE,
      MessageBody: JSON.stringify({ videoId, sourceKey: key, ...res }),
    })
  ));
}

// Step 3: Transcoding worker (runs FFmpeg)
async function transcodeVideo(job: TranscodeJob): Promise<void> {
  const { videoId, sourceKey, width, height, bitrate } = job;

  // Download source from S3
  await s3.downloadFile(sourceKey, '/tmp/source.mp4');

  // Transcode with FFmpeg to HLS segments
  const outputDir = \`/tmp/\${videoId}/\${height}p/\`;
  await ffmpeg(
    \`-i /tmp/source.mp4 -vf scale=\${width}:\${height} -b:v \${bitrate} \` +
    \`-codec:v libx264 -codec:a aac \` +
    \`-hls_time 6 -hls_playlist_type vod \` +  // 6-second segments
    \`-hls_segment_filename \${outputDir}seg_%03d.ts \` +
    \`\${outputDir}index.m3u8\`
  );

  // Upload segments + manifest to CDN origin (S3)
  await s3.uploadDirectory(outputDir, \`videos/\${videoId}/\${height}p/\`);

  // Track completion; generate master manifest when all resolutions done
  await markResolutionComplete(videoId, height);
}`,
  },
  {
    label: 'HLS Manifest',
    language: 'bash',
    code: `# HLS manifests — what the video player reads

# Master manifest (index.m3u8) — lists all quality levels:
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,CODECS="avc1.42c01e,mp4a.40.2"
https://cdn.example.com/videos/abc123/360p/index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.42c01f,mp4a.40.2"
https://cdn.example.com/videos/abc123/720p/index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
https://cdn.example.com/videos/abc123/1080p/index.m3u8

# Media manifest (720p/index.m3u8) — lists segments:
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:6
#EXT-X-PLAYLIST-TYPE:VOD

#EXTINF:6.006,
https://cdn.example.com/videos/abc123/720p/seg_000.ts
#EXTINF:6.006,
https://cdn.example.com/videos/abc123/720p/seg_001.ts
#EXTINF:5.994,
https://cdn.example.com/videos/abc123/720p/seg_002.ts
...
#EXT-X-ENDLIST

# Player flow:
# 1. Fetch master manifest → parse quality options
# 2. Measure bandwidth → pick best quality level
# 3. Fetch media manifest for chosen quality
# 4. Download segments sequentially, buffer 3 segments ahead
# 5. Switch quality by fetching different media manifest`,
  },
  {
    label: 'CDN Cache Strategy',
    language: 'typescript',
    code: `// Cache-Control headers for video assets

// Video segments — immutable, cache forever
// Filename includes content hash: seg_000_a1b2c3.ts
app.get('/videos/:id/:quality/seg_*.ts', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  // CDN caches for 1 year; no revalidation needed
  // Content-addressed: different content = different filename
  proxyToS3(req, res);
});

// VOD manifests — immutable once video is published
app.get('/videos/:id/:quality/index.m3u8', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  // 1 hour cache; rarely changes after publish
  proxyToS3(req, res);
});

// Live manifests — update every few seconds
app.get('/live/:stream/index.m3u8', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  // Never cache; player polls every 2s for new segments
  proxyToLiveOrigin(req, res);
});

// Scale calculation — Netflix-like:
// 100M concurrent viewers × 4 Mbps average = 400 Tbps
// Cloudflare/Akamai: 200+ Tbps capacity across all PoPs
// Without CDN: 400 Tbps from S3 = impossible + prohibitively expensive
// CDN cost: ~$0.01/GB vs S3 egress $0.09/GB → 9× cheaper at scale`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Uploading video through application servers',
    wrong: `// Client → POST /upload → App Server → S3
// 1GB video upload ties up app server thread for 10+ minutes
// 100 concurrent uploads = 100 blocked threads = API unresponsive`,
    right: `// Client → Pre-signed URL → S3 directly (bypasses app server)
const uploadUrl = await s3.createPresignedPost({ Bucket, Key });
// Client uploads to S3 directly — app server handles only metadata
// App server receives S3 event notification when upload completes`,
    explanation: 'Uploading large files through your application server wastes thread resources for minutes per upload. Pre-signed URLs let clients upload directly to S3 while your app server remains free for API requests.',
  },
  {
    title: 'Serving video from origin instead of CDN',
    wrong: `// All video requests → S3 directly
// 1M viewers × 4 Mbps = 4 Tbps from S3
// S3 egress cost: $0.09/GB × enormous traffic = bankruptcy
// S3 bandwidth limit: effectively unlimited but latency from one region`,
    right: `// All video → CDN PoPs (serve from cache > 90% of requests)
// Segment cache-hit ratio > 95% for popular videos
// CDN cost: ~$0.01/GB = 9× cheaper than S3 direct egress
// Latency: CDN PoP < 30ms away; S3 single region = 100-200ms to distant users`,
    explanation: 'Video segments are large, static, and globally consumed. Serving directly from S3 is expensive and slow for international users. A CDN caches segments at edge PoPs near viewers — 9× cheaper, 5× lower latency.',
  },
  {
    title: 'Single transcoding resolution',
    wrong: `// Only transcode to 1080p
// User on 2G mobile: tries to stream 5 Mbps video on 0.5 Mbps connection
// Player buffers constantly → user leaves after 10 seconds`,
    right: `// Transcode to 4 resolutions: 360p / 720p / 1080p / 4K
// HLS ABR: player starts at 360p, upgrades as bandwidth allows
// Mobile on good WiFi: plays 1080p seamlessly
// Train tunnel: drops to 360p, maintains smooth playback`,
    explanation: 'A single resolution fails users on poor connections. HLS Adaptive Bitrate Streaming automatically selects the best quality the user\'s bandwidth supports — but only if multiple quality levels exist.',
  },
  {
    title: 'No origin shield — cache miss stampede',
    wrong: `// New video goes viral — 100,000 viewers simultaneously
// CDN cache miss: all 100k requests hit S3 at once
// S3 request rate limit hit → 503 errors → video unplayable at launch`,
    right: `// CDN origin shield: intermediate PoP in same region as S3
// Cache miss → CDN edge → Origin Shield (cache hit 80%) → S3
// S3 sees 1 request per cache miss (not 100,000)
// Origin Shield absorbs the viral spike`,
    explanation: 'Without origin shield, a cache miss (new video, cold cache) sends all concurrent viewer requests to S3 simultaneously — a stampede. Origin shield coalesces these into a single origin request.',
  },
];

const challenge: Challenge = {
  title: 'Design YouTube\'s video upload pipeline',
  language: 'typescript',
  description: `Design the video upload and processing pipeline for YouTube-scale.

Scale:
- 500 hours of video uploaded every minute
- Average video: 10 minutes, 1.5 GB raw
- Must serve 240p through 4K
- Global viewers expect < 200ms to first byte
- Videos must be searchable within 5 minutes of upload

Pipeline stages to design:
1. Raw video ingestion
2. Transcoding at scale
3. CDN distribution
4. Metadata indexing (searchable)
5. Thumbnail generation

Key constraints:
- Transcoding 1 hour of 4K video takes ~30 min on 1 CPU
- 500 hrs/min × 30 min/hr of 4K = enormous compute needed`,
  hints: [
    'Parallel transcoding: split video into chunks, transcode in parallel',
    'Prioritise: 360p done first (watchable quickly), then higher resolutions',
    'Transcode workers: spot/preemptible instances for cost (can be interrupted)',
    'Metadata: Elasticsearch indexed via Kafka event after processing complete',
  ],
  starterCode: `interface UploadPipeline {
  ingestStep: string;
  transcodingStrategy: string;
  cdnStrategy: string;
  searchIndexing: string;
  thumbnailGeneration: string;
  estimatedCost: string;
}`,
  solution: `const pipeline: UploadPipeline = {
  ingestStep: \`
    Client: chunked upload (5 MB chunks, resumable) → S3 multipart upload
    Bypass app servers: pre-signed S3 URLs for direct upload
    On completion: S3 event → SQS → processing orchestrator
    Upload time: 1.5 GB at 100 Mbps = 2 minutes
  \`,

  transcodingStrategy: \`
    Parallel chunk transcoding:
    1. Split 10-min video into 30-second chunks (20 chunks)
    2. Each chunk transcoded in parallel on spot EC2 instances
    3. Resolution ladder: 240p → 360p → 480p → 720p → 1080p → 4K
    4. Prioritise: 360p chunk 1 done first → video is watchable in < 60s
    5. AWS Elemental MediaConvert or custom FFmpeg fleet

    Compute: 500hrs/min × 4 resolutions × 30 min/hr = 60,000 vCPU-minutes/min
    Spot fleet: ~5,000 c5.2xlarge instances (autoscaling)
    Cost: spot at $0.10/hr × 5,000 = $500/hr but bursty — avg $200/hr
  \`,

  cdnStrategy: \`
    S3 (origin) → CloudFront origin shield → CloudFront PoPs (400+)
    Segment size: 6 seconds of video
    Cache-Control: immutable (content-addressed filenames)
    Popular videos: 99.9% CDN hit rate
    Long tail: origin shield absorbs misses
    Global: < 50ms to nearest PoP for 95% of world population
  \`,

  searchIndexing: \`
    On upload: create video document in Elasticsearch (pending status)
    On 360p complete: update doc (status=watchable, first thumbnail ready)
    On all resolutions complete: full document (title, description, auto-captions)
    Auto-captions: Whisper ASR transcription → searchable text
    Time to searchable: < 5 minutes (360p transcoded + ES indexed)
  \`,

  thumbnailGeneration: \`
    Extract frames at 0%, 25%, 50%, 75% of video during transcoding
    Resize to 120x90 (thumbnail), 320x180 (card), 1280x720 (hero)
    A/B test thumbnails: show different thumbnails to different users;
    pick winner by click-through rate within 1 hour
    Store on S3 + CDN alongside video segments
  \`,

  estimatedCost: \`
    Transcoding: ~$200/hr (spot fleet, elastic)
    Storage: 500 hrs/min × 1.5 GB × 60 = 45 TB/hr ingested
    CDN egress: 100M viewers × 2 hrs/day × 1.5 GB/hr = 300 PB/month
    At $0.01/GB: $3M/month CDN — matches YouTube's actual reported costs
  \`,
};`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is Adaptive Bitrate Streaming (ABR)?',
    options: [
      'Compressing video to reduce file size',
      'The video player dynamically switches quality based on available bandwidth',
      'Streaming video from multiple CDN nodes simultaneously',
      'Encrypting video segments for DRM protection',
    ],
    answer: 1,
    explanation: 'ABR (Adaptive Bitrate): the player continuously measures download speed and switches to the highest quality level that can be downloaded faster than playback speed. HLS and DASH both support ABR — multiple quality variants in the manifest.',
  },
  {
    q: 'Why are video segments content-addressed (hash in filename)?',
    options: [
      'To enable faster transcoding',
      'To allow CDN caching with max-age=immutable — same name always means same content',
      'To encrypt the video content',
      'To sort segments in playback order',
    ],
    answer: 1,
    explanation: 'Content-addressed filenames (e.g. seg_000_a1b2c3d4.ts where the hash is of the content) mean the same filename always has identical content. CDNs can cache with Cache-Control: immutable — no revalidation ever needed. If content changes, the filename changes.',
  },
  {
    q: 'An origin shield in a CDN architecture?',
    options: [
      'Encrypts video at rest in S3',
      'Acts as an intermediate cache layer between edge PoPs and origin to absorb cache miss stampedes',
      'Provides DDoS protection at the application layer',
      'Transcodes video on-demand at the edge',
    ],
    answer: 1,
    explanation: 'Origin shield is an intermediate CDN layer between edge PoPs and your origin (S3). When a video goes viral, hundreds of PoPs may simultaneously miss cache. Without origin shield, all request S3 at once. With it, they hit the shield (which coalesces to 1 origin request).',
  },
  { q: 'What is adaptive bitrate streaming (ABR) and how does it work?', options: ['A protocol that compresses video more when bandwidth is low', 'A technique that encodes video at multiple quality levels and switches between them dynamically based on available bandwidth', 'A CDN routing algorithm that selects the nearest edge node for each video request', 'A player feature that adjusts playback speed based on device CPU'], answer: 1, explanation: 'Adaptive bitrate streaming (HLS, DASH) pre-encodes each video at multiple quality levels (e.g., 240p, 480p, 720p, 1080p, 4K). A manifest file lists all available quality variants and their segment URLs. The player measures download speed and buffer level, then selects the appropriate quality variant dynamically: fast connection plays 4K, slow connection falls to 480p automatically without buffering. Each video is split into short segments (2-10 seconds) allowing quality switches at segment boundaries. This provides a smooth experience across diverse network conditions.' },
  { q: 'How does a video-on-demand platform handle storage and content delivery at scale?', options: ['Store one video file per title and serve it directly from a single server', 'Transcode uploaded videos into multiple formats and resolutions, store in object storage, and serve via CDN with edge caching close to viewers', 'Stream directly from the encoding server in real time to avoid storage costs', 'Store videos in a relational database as binary blobs for easy management'], answer: 1, explanation: 'Video storage pipeline: raw uploads go to object storage (S3, GCS). A transcoding pipeline converts the raw file into multiple quality levels and formats (HLS, DASH) using transcoding workers. Transcoded segments are stored in object storage. A CDN like CloudFront caches segments at edge locations globally. Viewers fetch video segments from the nearest CDN edge, not the origin. Manifest files (playlists) may also be cached at the CDN. This architecture separates the storage concern (object storage) from the delivery concern (CDN), scaling each independently.' },
  { q: 'What are the main components of a live streaming pipeline?', options: ['Live streaming uses the same pipeline as video-on-demand with no modifications', 'Live streaming requires a low-latency ingest server, a real-time transcoder, a CDN configured for live delivery, and HLS or DASH segments generated continuously as the stream progresses', 'Live streaming stores the entire stream before making it available to viewers, adding processing delay', 'The main difference between live and on-demand is only the content; the technical pipeline is identical'], answer: 1, explanation: 'Live streaming pipeline: broadcaster streams to an ingest server via RTMP or SRT protocol. The ingest server passes the stream to a live transcoder that generates HLS or DASH segments in near real-time (2-5 second segment duration). Segments are written to a live storage layer and a CDN edge fetches and caches them continuously. End-to-end latency is typically 5-30 seconds for standard HLS, or sub-second with low-latency HLS (LLHLS) or WebRTC for interactive streams. The CDN must support streaming delivery modes that update the playlist as new segments are added.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between HLS and DASH?',
    a: 'HLS (HTTP Live Streaming): Apple\'s standard. Segments in .ts format, manifest in .m3u8. Universally supported on iOS/macOS/Safari. DASH (Dynamic Adaptive Streaming over HTTP): ISO standard. Segments in .mp4 (fMP4), manifest in .mpd XML. Better compression, codec flexibility, but not natively supported in Safari without a JS player. In practice: most platforms serve both or use fMP4 segments compatible with both standards.',
  },
  {
    q: 'How do you handle seeks in a video player efficiently?',
    a: 'Video is split into 2-10 second segments. A seek jumps to the segment containing the target timestamp and fetches from that segment index. The player does not need to download content before the seek point. For fast seeks, generate keyframe-aligned segments (every segment starts with an I-frame). The manifest maps timestamps to segment numbers, enabling O(1) seek to any position.',
  },
  { q: 'How do you design a video upload pipeline that handles large files reliably?', a: 'Large video uploads (1-50 GB) require multipart upload rather than a single HTTP request that would fail on any network interruption. Flow: the client requests an upload session from the API, which generates a pre-signed S3 multipart upload ID. The client splits the file into parts (5-50 MB each) and uploads each part directly to S3 using the pre-signed URLs. The API does not proxy the video bytes. After all parts upload, the client calls the API to complete the multipart upload; S3 assembles the parts. A serverless function or queue worker triggered by the S3 completion event starts the transcoding pipeline. This architecture keeps large binary data off application servers entirely.' },
  { q: 'How does a transcoding pipeline work and how do you scale it?', a: 'Transcoding converts a raw uploaded video into multiple quality levels and formats. A transcoding job queue (SQS, Kafka) receives a job when a new raw video lands in storage. Worker services pull jobs from the queue and run FFmpeg or a managed transcoding service (AWS MediaConvert, Google Transcoder API) to produce output segments. Workers are stateless and horizontally scalable: auto-scale the worker pool based on queue depth. For a video that needs 5 quality levels, split it into multiple parallel jobs (one per quality level) to reduce time-to-availability. Store transcoding status in a database so the API can return processing progress to the uploader. Send a notification when all variants complete.' },
  { q: 'How do you implement video seek and chapter navigation efficiently?', a: 'Seeking in HLS or DASH is efficient because each segment is independent. When the user seeks to a timestamp, the player calculates which segment covers that time from the manifest playlist, discards the current segment, and fetches the segment at the target timestamp directly. No scanning from the beginning is required. For fast chapter navigation: store chapter metadata (title, timestamp) in the API, not embedded in the video. Display chapters in the player UI; clicking a chapter calls player.currentTime = timestamp, triggering normal segment seeking. For HLS, set appropriate segment duration: shorter segments (2-4 seconds) give more seek precision but increase manifest size and the number of HTTP requests. Longer segments (6-10 seconds) reduce requests but increase seek latency by up to one segment duration.' },
  { q: 'How do you handle video content delivery to viewers in regions without CDN coverage?', a: 'For regions with limited CDN coverage: use a multi-CDN strategy with automatic failover between providers to maximize edge coverage. Some providers (Cloudflare, Fastly, Akamai) have more PoPs in specific regions than others. For very low CDN coverage regions: consider a peer-to-peer CDN component like WebRTC-based P2P delivery where popular content is partially served by other viewers in the same region, reducing origin and CDN load. For extremely bandwidth-constrained regions: offer lower default quality tiers and allow users to download for offline playback. Monitor CDN miss rate and buffer ratio by country to identify regions where coverage is poor and evaluate switching CDN providers for those regions.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Upload via pre-signed URL → transcode to HLS segments → CDN with immutable cache → ABR player switches quality; origin shield absorbs misses.',
  mustKnow: [
    'Pre-signed URL: client uploads directly to S3, bypassing app servers',
    'Transcode to multiple resolutions (360p→4K) for ABR switching',
    'HLS: 6s .ts segments + .m3u8 manifests; DASH: .mp4 + .mpd',
    'ABR: player measures bandwidth → switches quality automatically',
    'Video segments are immutable → Cache-Control: immutable → CDN caches forever',
    'Origin shield: coalesces cache misses before hitting S3',
  ],
  interviewFocus: [
    'Walk through upload pipeline: pre-signed URL → S3 event → transcoding workers',
    'HLS manifest structure: master → per-quality manifests → segments',
    'Why ABR needs multiple transcoded resolutions',
    'CDN economics: segments cached at edge = 9× cheaper than S3 direct egress',
  ],
};

@Component({
  selector: 'app-sysdesign-video-streaming',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './video-streaming.html',
  styleUrl: './video-streaming.scss',
})
export class SysdesignVideoStreaming {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
