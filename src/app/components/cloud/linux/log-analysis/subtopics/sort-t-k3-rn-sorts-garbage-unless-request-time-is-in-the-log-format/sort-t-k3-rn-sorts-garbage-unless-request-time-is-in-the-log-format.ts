import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './sort-t-k3-rn-sorts-garbage-unless-request-time-is-in-the-log-format.html',
  styleUrl: './sort-t-k3-rn-sorts-garbage-unless-request-time-is-in-the-log-format.scss'
})
export class SortTK3RnSortsGarbageUnlessRequestTimeIsInTheLogFormatSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "slowest responses" one-liner has a condition it never actually checks',
      points: [
        'The main page\'s own Analysis One-liners code tab shows: <code>sort -t\'"\' -k3 -rn /var/log/nginx/access.log | head -20</code> with the comment "if $request_time is logged" — the conditional wording is right there, but nothing on the page explains how to actually verify that condition, or what the DEFAULT is if you never checked.',
      ]
    },
    {
      heading: 'The default nginx access log format does not include $request_time at all',
      points: [
        'nginx\'s standard "combined" log format — the DEFAULT on virtually every stock nginx install, and the exact format the main page\'s own theory describes ("$remote_addr, -, -, $time, "$request", $status, $bytes, "$referer", "$user_agent"") — genuinely does not include <code>$request_time</code> anywhere. It has to be added explicitly via a custom <code>log_format</code> directive in nginx.conf.',
        'This means the main page\'s own one-liner, run against a stock/default nginx installation, does not error — it runs, produces OUTPUT, and looks like it worked. But the field it\'s actually sorting by (the 3rd double-quote-delimited field) is whatever happens to occupy that position in the DEFAULT combined format — the User-Agent string, not a response time at all. The command silently sorts by something unrelated to speed, with no error to indicate the mistake.',
      ]
    },
    {
      heading: 'How to actually verify and enable the timing this one-liner assumes',
      points: [
        'Verify first, rather than assuming: <code>nginx -T | grep log_format</code> shows every log_format defined on the system, and <code>nginx -T | grep access_log</code> shows which format each access log actually uses — if <code>$request_time</code> doesn\'t appear in the format string actually in use, the main page\'s own one-liner cannot possibly be measuring what it claims to.',
        'To actually enable it: define a custom log_format in the <code>http</code> block that explicitly includes <code>$request_time</code> (commonly appended to the end of the standard combined fields, e.g. <code>log_format timed \'$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent" $request_time\';</code>), reference it in the relevant <code>access_log</code> directive, then reload nginx — only then does a field-position-based sort against that specific added field actually measure request latency.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the silent misread on a stock nginx install',
      language: 'bash',
      code: `# Confirm what's ACTUALLY defined -- the main page's own example
# assumes $request_time is present without checking this first:
nginx -T | grep access_log
# access_log /var/log/nginx/access.log combined;
# -- "combined" is nginx's stock format, confirmed via nginx docs
#    to NOT include $request_time anywhere

# The main page's own one-liner still runs, produces output, and
# LOOKS like it worked:
sort -t'"' -k3 -rn /var/log/nginx/access.log | head -5
# 66.249.66.1 - - [24/Jul/2026:10:15:32] "GET /robots.txt HTTP/1.1"
#   200 178 "-" "Mozilla/5.0 (compatible; Googlebot/2.1...)"
# -- this is sorted by the 3rd "..."-delimited field, which in the
#    DEFAULT combined format is the USER-AGENT STRING, not a
#    response time -- "slowest responses" here actually means
#    "alphabetically last user-agent strings," a completely
#    different, meaningless result presented with total confidence`,
    },
    {
      label: 'The fix: add $request_time to the format, verify, then sort correctly',
      language: 'bash',
      code: `# 1. Define a custom log_format that actually includes it, in
#    the http block of nginx.conf:
#
# log_format timed '$remote_addr - $remote_user [$time_local] '
#                   '"$request" $status $body_bytes_sent '
#                   '"$http_referer" "$http_user_agent" $request_time';

# 2. Reference it in the relevant access_log directive:
# access_log /var/log/nginx/access.log timed;

sudo nginx -t && sudo systemctl reload nginx

# 3. Verify it's actually there before trusting any timing-based
#    sort against this log:
nginx -T | grep -A3 "log_format timed"
tail -1 /var/log/nginx/access.log
# 10.0.0.5 - - [24/Jul/2026:10:20:00] "GET /api/slow HTTP/1.1"
#   200 512 "-" "curl/8.1" 2.340
# -- 2.340 (seconds) is now genuinely present as the LAST field

# NOW sort meaningfully -- request_time is the last field here,
# so sort by the last whitespace-delimited field instead of the
# main page's own quote-delimited field-3 approach:
awk '{print $NF, $0}' /var/log/nginx/access.log | sort -rn | head -20
# -- correctly ranks by actual request_time, descending`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own one-liner exactly, `sort -t\'"\' -k3 -rn /var/log/nginx/access.log | head -20`, an engineer investigating a slow API concludes the "slowest" requests are all bot traffic with unusual User-Agent strings, and closes the investigation as "just crawler noise." The actual performance problem — a genuinely slow database-backed endpoint — goes unnoticed for another week. What went wrong with the analysis, and what would confirm it before trusting the sort\'s output at all?',
    hint: 'Check what field position 3, delimited by double-quotes, actually corresponds to in nginx\'s DEFAULT access log format — is it guaranteed to be a timing value, or does that depend on something specific being configured first?',
    solution: 'The analysis was measuring the wrong thing entirely: the main page\'s own one-liner only produces a meaningful "slowest responses" ranking if `$request_time` has been explicitly added to the nginx log format via a custom `log_format` directive — nginx\'s DEFAULT "combined" format does not include it at all. Without that custom format, the 3rd double-quote-delimited field in a standard combined-format log line is the User-Agent string, not a timing value — so the command was actually sorting requests alphabetically by user-agent string, which happened to surface bot/crawler traffic (whose user-agent strings sort differently from typical browser strings) at the top, creating a plausible-looking but completely wrong "it\'s just crawler noise" conclusion. The check that would have caught this before trusting the output: `nginx -T | grep access_log` to see which log_format is actually in use, and `nginx -T | grep log_format` to confirm whether `$request_time` appears anywhere in that format\'s definition — if it doesn\'t, the fix is adding a custom log_format that includes it, reloading nginx, and only then sorting by the correct field (the actual `$request_time` value) to get a genuine slowest-requests ranking.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'sort -t\'"\' -k3 -rn on an nginx access log reliably ranks requests by response time, since that\'s what the command is clearly intended to do.',
      reality: 'Per this subtopic\'s theory, this only works if $request_time has been explicitly added to the log format via a custom log_format directive — nginx\'s default "combined" format has no timing field at all, so this command silently sorts by whatever DOES occupy that field position (typically the User-Agent string) instead.'
    },
    {
      thought: 'If a log-analysis one-liner runs without an error and produces plausible-looking output, it must be measuring what its name/comment claims it measures.',
      reality: 'Per this subtopic\'s theory, this exact command produces confident-looking, sorted output on a stock nginx install while measuring something completely unrelated to response time — the absence of an error says nothing about whether the underlying data actually contains the field being sorted on.'
    },
    {
      thought: 'nginx logs response time information by default, the same way it logs status codes and request paths.',
      reality: 'Per this subtopic\'s theory, response timing ($request_time and related variables like $upstream_response_time) is NOT part of nginx\'s default combined log format — it requires deliberately defining and switching to a custom log_format that explicitly includes it.'
    }
  ];
}
