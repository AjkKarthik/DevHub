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

@Component({
  selector: 'app-linux-log-analysis',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './log-analysis.html',
  styleUrl: './log-analysis.scss'
})
export class LinuxLogAnalysis {

  quickRef: QuickRefItem[] = [
    { name: 'tail -f /var/log/nginx/access.log', type: 'syntax', desc: 'Follow a log file in real time' },
    { name: 'grep -E "ERROR|WARN" app.log | tail -100', type: 'syntax', desc: 'Last 100 errors/warnings' },
    { name: 'journalctl -u nginx --since "1h ago"', type: 'syntax', desc: 'systemd logs from the last hour' },
    { name: "awk '{print $9}' access.log | sort | uniq -c | sort -rn", type: 'syntax', desc: 'HTTP status code frequency count' },
    { name: 'zcat app.log.gz | grep ERROR', type: 'syntax', desc: 'Search inside compressed log file' },
    { name: 'logrotate -f /etc/logrotate.d/nginx', type: 'syntax', desc: 'Force log rotation now' },
    { name: 'multitail -f log1 -f log2', type: 'syntax', desc: 'Follow multiple log files simultaneously' },
    { name: 'journalctl --disk-usage', type: 'syntax', desc: 'Show total journald log disk usage' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Log Locations',
      points: [
        '/var/log/ is the standard log directory. Key files: syslog/messages (general), auth.log (authentication), kern.log (kernel), mail.log.',
        'Application logs: /var/log/nginx/access.log + error.log, /var/log/apache2/, /var/log/mysql/.',
        'journald (systemd) captures all service logs. Access with journalctl. The binary journal is in /var/log/journal/ or /run/log/journal/ (volatile).',
        'Docker containers: docker logs containerid. Or direct access at /var/lib/docker/containers/<id>/<id>-json.log.',
      ],
    },
    {
      heading: 'Real-Time Log Analysis',
      points: [
        'tail -f follows a file. tail -F follows by name (handles log rotation). tail -n 100 -f = last 100 lines then follow.',
        'Pipe to grep for filtering: tail -f app.log | grep -v "health check" | grep ERROR.',
        'multitail shows multiple files side-by-side with coloured highlighting. watch -n 5 "tail -20 app.log" for periodic snapshots.',
        'journalctl -f -u nginx follows systemd-managed service logs in real time.',
      ],
    },
    {
      heading: 'Log Processing with Shell Tools',
      points: [
        'Count occurrences: sort log | uniq -c | sort -rn gives top N entries.',
        'nginx access log fields (space-delimited): $remote_addr, -, -, $time, "$request", $status, $bytes, "$referer", "$user_agent".',
        'awk extracts fields. cut -d\' \' -f7 extracts field 7 (URL path from nginx logs). grep -oE \'[0-9]{3}\' extracts 3-digit strings.',
        'goaccess is a real-time log analyser: goaccess access.log -c generates HTML/terminal report.',
      ],
    },
    {
      heading: 'Log Rotation',
      points: [
        'logrotate rotates logs based on size or time. Config in /etc/logrotate.conf and /etc/logrotate.d/.',
        'Directives: daily/weekly/monthly, rotate N (keep N old copies), compress (gzip), delaycompress (compress yesterday\'s log), missingok, notifempty.',
        'postrotate sends signals after rotation: postrotate / kill -USR1 $(cat /var/run/nginx.pid) / endscript tells nginx to open new log files.',
        'logrotate -f /etc/logrotate.d/nginx forces immediate rotation for testing.',
      ],
    },
    {
      heading: 'journalctl for systemd-Based Log Analysis',
      points: [
        'journalctl provides structured, indexed access to systemd\'s binary journal logs, supporting powerful filtering (journalctl -u servicename for a specific service, journalctl --since "1 hour ago" for a time range) without needing to grep through plain-text log files.',
        'journalctl -f follows logs in real-time (similar to tail -f on a traditional log file), essential for watching a service\'s behavior live while reproducing or investigating an issue as it happens.',
        'The systemd journal is stored in binary format by default (for performance and structured querying), which means traditional text tools like grep do not work directly on the raw journal files — journalctl itself, or its --output=json mode piped to jq, is the correct way to query and filter journal data.',
        'Combining journalctl filters (journalctl -u nginx -p err --since today) narrows results to exactly the relevant log entries for a specific investigation, avoiding the noise of scrolling through an entire day\'s combined system log.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Real-time & Search',
      language: 'bash',
      code: `# Follow logs
tail -f /var/log/nginx/error.log
tail -F /var/log/nginx/access.log         # -F follows by name (handles rotation)
tail -n 200 -f /var/log/syslog

# Filter while following
tail -f app.log | grep -E "ERROR|EXCEPTION"
tail -f app.log | grep -v "GET /health"   # exclude health checks

# Search in logs
grep "500" /var/log/nginx/access.log
grep -c "404" /var/log/nginx/access.log   # count 404s
grep -A3 "Exception" app.log              # 3 lines of context after match

# Search in compressed logs
zcat /var/log/nginx/access.log.1.gz | grep "error"
zgrep "ERROR" /var/log/app/*.log.gz       # grep inside gz directly

# journalctl
journalctl -u nginx -f                    # follow nginx logs
journalctl -p err -u myapp               # errors only
journalctl --since "2024-01-01" --until "2024-01-02" -u nginx`,
    },
    {
      label: 'Analysis One-liners',
      language: 'bash',
      code: `# Top 10 IPs hitting nginx
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# HTTP status code distribution
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# Requests per minute (last hour)
awk '{print $4}' /var/log/nginx/access.log \\
  | tr -d '[' | cut -d: -f1,2 | sort | uniq -c

# Slowest responses (if $request_time is logged)
sort -t'"' -k3 -rn /var/log/nginx/access.log | head -20

# 4xx error URLs
awk '$9 ~ /^4/ {print $7}' /var/log/nginx/access.log \\
  | sort | uniq -c | sort -rn | head -20

# Failed SSH logins
grep "Failed password" /var/log/auth.log | awk '{print $11}' \\
  | sort | uniq -c | sort -rn | head -20

# Errors per hour
grep "ERROR" app.log | awk '{print $1, substr($2,1,5)}' | uniq -c`,
    },
    {
      label: 'logrotate',
      language: 'bash',
      code: `# /etc/logrotate.d/myapp
/var/log/myapp/*.log {
    daily                         # rotate daily
    rotate 14                     # keep 14 old files
    compress                      # gzip compressed
    delaycompress                 # compress previous rotation, not current
    missingok                     # no error if log missing
    notifempty                    # don't rotate if empty
    create 0640 myapp myapp       # new file with these permissions/ownership
    sharedscripts
    postrotate
        # Tell app to reopen log files
        kill -USR1 $(cat /var/run/myapp.pid 2>/dev/null) 2>/dev/null || true
    endscript
}

# Test logrotate config
logrotate -d /etc/logrotate.d/myapp   # dry run
logrotate -f /etc/logrotate.d/myapp   # force rotation

# View logrotate status
cat /var/lib/logrotate/status

# Journald size limits (in /etc/systemd/journald.conf)
# SystemMaxUse=2G
# MaxRetentionSec=30day
# After editing: systemctl restart systemd-journald`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using tail -f instead of tail -F when logs rotate',
      wrong: 'tail -f /var/log/nginx/access.log (stops working after logrotate)',
      right: 'tail -F /var/log/nginx/access.log (follows the filename, reopens on rotation)',
      explanation: 'tail -f follows the file descriptor. When logrotate renames the file, -f keeps reading the old inode (the rotated file). -F follows the filename and reopens the new file after rotation.',
    },
    {
      title: 'Grepping from /var/log/ on a rotating compressed log',
      wrong: 'grep "error" /var/log/nginx/*.log (misses compressed .gz files)',
      right: 'zgrep "error" /var/log/nginx/*.log* (handles both plain and .gz)',
      explanation: 'logrotate compresses older logs. zgrep transparently handles both plain and gzip files. Alternatively: cat /var/log/nginx/access.log* | grep error (shell expands glob, cat pipes through).',
    },
    {
      title: 'Not configuring log rotation for custom application logs',
      wrong: 'Application logging to /var/log/myapp.log forever',
      right: 'Create /etc/logrotate.d/myapp with daily/rotate/compress directives',
      explanation: 'Without log rotation, logs grow unbounded and fill the disk. logrotate is installed by default — just create a config file in /etc/logrotate.d/ with your rotation policy.',
    },
    {
      title: 'Forgetting delaycompress when application keeps log file open',
      wrong: 'compress (without delaycompress) — application may fail to write compressed rotated log',
      right: 'compress + delaycompress — today\'s log is uncompressed; yesterday\'s is compressed',
      explanation: 'If the application still has the old log file open after rotation, trying to compress it while it\'s being written to can cause issues. delaycompress compresses the log one rotation later, after the app has fully switched to the new file.',
    },
  ];

  challenge: Challenge = {
    title: 'Log Frequency Analyser',
    language: 'typescript',
    description: 'Write a function that analyses log lines and returns a summary: total lines, error count, warn count, and the top 5 most frequent error messages (deduplicated).',
    hints: [
      'A line contains an error if it includes "ERROR" (case-insensitive)',
      'Count WARN lines similarly',
      'For top errors, extract the message after "ERROR:" and count with a Map',
      'Return top 5 sorted by frequency',
    ],
    starterCode: `interface LogSummary {
  total: number;
  errors: number;
  warnings: number;
  topErrors: Array<{ message: string; count: number }>;
}

function analyseLog(lines: string[]): LogSummary {
  // Analyse and summarise log lines
}

const log = [
  "2024-01-01 INFO Application started",
  "2024-01-01 ERROR: Database connection failed",
  "2024-01-01 WARN: High memory usage",
  "2024-01-01 ERROR: Database connection failed",
  "2024-01-01 ERROR: Timeout reaching cache",
];
console.log(analyseLog(log));`,
    solution: `interface LogSummary { total: number; errors: number; warnings: number; topErrors: Array<{ message: string; count: number }>; }

function analyseLog(lines: string[]): LogSummary {
  let errors = 0, warnings = 0;
  const errorMap = new Map<string, number>();

  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.includes('ERROR')) {
      errors++;
      const msg = line.replace(/.*ERROR:?\\s*/i, '').trim();
      errorMap.set(msg, (errorMap.get(msg) ?? 0) + 1);
    } else if (upper.includes('WARN')) {
      warnings++;
    }
  }

  const topErrors = [...errorMap.entries()]
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { total: lines.length, errors, warnings, topErrors };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between tail -f and tail -F?',
      options: [
        '-f is faster; -F is for large files',
        '-f follows the file descriptor; -F follows the filename and reopens after rotation',
        '-f shows all lines; -F shows last 10 only',
        '-f is for systemd logs; -F is for plain files',
      ],
      answer: 1,
      explanation: 'tail -f follows the inode (file descriptor). After log rotation renames the file, -f keeps reading the old, now-rotated file. tail -F follows the filename and detects when it is recreated.',
    },
    {
      q: 'Which command counts how many times each HTTP status code appears in nginx logs?',
      options: [
        "grep -c '200' access.log",
        "awk '{print $9}' access.log | sort | uniq -c | sort -rn",
        "cut -f9 access.log | sort | uniq",
        "sed -n '/HTTP/p' access.log | wc -l",
      ],
      answer: 1,
      explanation: 'awk extracts field 9 (status code in nginx combined log format), sort prepares for deduplication, uniq -c counts occurrences, sort -rn sorts by frequency descending.',
    },
    {
      q: 'Where does logrotate send the rotated log filename to be compressed?',
      options: [
        '/tmp/ by default',
        'Same directory as the original log',
        '/var/log/compressed/',
        '/etc/logrotate.d/',
      ],
      answer: 1,
      explanation: 'logrotate renames the current log (e.g. access.log → access.log.1) in the same directory, then creates a new empty access.log. Compressed versions become access.log.1.gz, access.log.2.gz, etc.',
    },
    {
      q: 'How do you search for errors inside gzip-compressed log files?',
      options: [
        'cat file.log.gz | grep ERROR',
        'zgrep ERROR file.log.gz',
        'gzip -d file.log.gz && grep ERROR file.log',
        'grep -z ERROR file.log.gz',
      ],
      answer: 1,
      explanation: 'zgrep is grep for gzip files — it decompresses on the fly and searches. zcat file.gz | grep ERROR also works. cat file.gz outputs binary (does not decompress).',
    },
    {
      q: 'Which flag follows new log entries in real time with journalctl?',
      options: [
        '-r',
        '-f',
        '-t',
        '-n',
      ],
      answer: 1,
      explanation: 'journalctl -f follows the journal in real time, similar to tail -f. Combine with -u servicename to follow a specific unit: journalctl -fu nginx.',
    },
    {
      q: 'What does grep -v pattern file do?',
      options: [
        'Prints lines matching the pattern verbosely',
        'Prints lines that do NOT match the pattern',
        'Searches for the pattern in verbose mode',
        'Inverts the file and searches it',
      ],
      answer: 1,
      explanation: '-v (--invert-match) inverts the match, printing lines that do not match. Useful for filtering out noise: grep -v DEBUG app.log shows everything except DEBUG lines.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I set up centralised log collection from multiple servers?',
      a: 'Common approaches: (1) Elasticsearch + Logstash/Filebeat + Kibana (ELK stack) — Filebeat ships logs from each server. (2) Grafana Loki + Promtail — lighter alternative. (3) Graylog — open source, simpler. (4) CloudWatch Logs (AWS), Azure Monitor. Filebeat/Promtail are agents that tail log files and ship to the central store.',
    },
    {
      q: 'How do I analyse logs when an application logs JSON?',
      a: 'Use jq: cat app.log | jq ".level, .message". Filter: cat app.log | jq "select(.level == \"error\") | .message". Or with grep: grep level\":\"error app.log | jq .message. For production, structured logging (JSON) + a log aggregation platform (ELK, Loki) enables rich filtering and dashboards.',
    },
    {
      q: 'How do I know if log rotation is working correctly?',
      a: 'Check /var/lib/logrotate/status for last rotation times. Test with logrotate -d /etc/logrotate.d/nginx (dry run). Verify compressed old logs exist: ls -la /var/log/nginx/. Run logrotate -f to force rotation and verify postrotate script works (nginx reopens log files). Monitor disk usage over time.',
    },
    {
      q: 'Where are traditional system logs stored and what key files should you know?',
      a: 'Key log files: <strong>/var/log/syslog</strong> or <strong>/var/log/messages</strong> (general system), <strong>/var/log/auth.log</strong> or <strong>/var/log/secure</strong> (authentication), <strong>/var/log/kern.log</strong> (kernel), <strong>/var/log/dmesg</strong> (boot messages). On systemd systems, <code>journalctl</code> is the primary log viewer — traditional files may or may not exist depending on whether rsyslog is installed.',
    },
    {
      q: 'How do you view logs for a specific systemd service?',
      a: '<code>journalctl -u servicename</code> shows all journal entries for that unit. Add <code>-f</code> to follow in real time, <code>-n 100</code> for last 100 lines, <code>--since today</code> or <code>--since "2024-01-01 10:00:00"</code> to filter by time. <code>journalctl -u nginx --no-pager | grep ERROR</code> pipes to grep for filtering.',
    },
    {
      q: 'How do you filter log entries by time range?',
      a: 'With journalctl: <code>journalctl --since "1 hour ago" --until "30 min ago"</code> or <code>--since 2024-01-01 --until 2024-01-02</code>. With traditional log files use: <code>awk</code> to filter by timestamp prefix or <code>grep</code> for date patterns. <code>tail -f /var/log/syslog</code> follows in real time. <code>logrotate</code> manages log rotation to prevent disk fill.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'tail -F for rotation-safe follow; awk+sort+uniq for frequency analysis; zgrep for compressed logs; logrotate for automatic rotation.',
    mustKnow: [
      'tail -F (uppercase) follows filename across rotations; tail -f follows inode',
      'journalctl -u service -f for systemd service logs; -p err for errors',
      'awk + sort | uniq -c | sort -rn = frequency counting pattern',
      'zgrep for .gz files; zcat file.gz | grep = streaming alternative',
      'logrotate: compress + delaycompress + postrotate (USR1 to nginx/apache)',
      '/var/log/auth.log for SSH brute-force; dmesg for kernel/OOM events',
    ],
    interviewFocus: [
      'How do you find the top 10 IPs making the most requests to nginx?',
      'How do you set up log rotation for a custom application?',
      'What does tail -F do differently from tail -f?',
      'How do you aggregate and search logs from 50 servers?',
    ],
  };
}
