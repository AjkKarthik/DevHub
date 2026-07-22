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
  templateUrl: './rds-proxy-connection-pinning-defeats-pooling-silently.html',
  styleUrl: './rds-proxy-connection-pinning-defeats-pooling-silently.scss'
})
export class RdsProxyConnectionPinningDefeatsPoolingSilentlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "why use RDS Proxy" mistake entry never mentions a limit to the pooling benefit',
      points: [
        'The main page\'s own "Connecting to RDS from Lambda without RDS Proxy" mistake entry describes the fix in absolute terms: "Proxy pools and reuses connections... Proxy → RDS (small pool of ~10 real connections)." Nothing in the main page suggests this pooling could ever stop working for a specific client connection while everything else continues to look correctly configured.',
        'This matters because the exact scenario the main page presents as solved — thousands of Lambda invocations sharing a small RDS connection pool — can silently regress back toward the original one-connection-per-client problem for a subset of connections, without any error or obvious signal.',
      ]
    },
    {
      heading: 'RDS Proxy "pins" a client connection to one underlying DB connection whenever it detects session state that can\'t safely be shared',
      points: [
        'Per AWS\'s own documentation: "Your connections to the proxy can enter a state known as pinning. When a connection is pinned, each later transaction uses the same underlying database connection until the session ends. Other client connections also can\'t reuse that database connection until the session ends." Once pinned, that connection stops contributing to the pooling benefit at all — for the rest of that session, it behaves exactly like a direct, unpooled connection.',
        'AWS\'s own documentation lists a substantial set of triggers for this — and the list differs by engine. For MySQL/MariaDB, pinning-inducing operations include creating a temporary table, using LOCK TABLES or GET_LOCK, using prepared statements (either SQL-text or binary-protocol), and setting most session variables. For PostgreSQL, pinning triggers include any SET command, PREPARE/DEALLOCATE/EXECUTE for prepared statements, declaring cursors, creating temporary sequences/tables/views, and — notably — using DISCARD ALL as a connection-pooling library\'s own reset query, which AWS\'s own docs flag as actively counterproductive: "RDS Proxy pins your client connection on release... might lead to unexpected results."',
        'AWS\'s own documentation states one universal trigger that applies across every engine, independent of any engine-specific list: "Any statement with a text size greater than 16 KB causes the proxy to pin the session" — a large dynamically-generated query (a bulk INSERT with many rows, for example) can pin a connection purely due to its size, with no session-state change involved at all.',
        'AWS provides a specific CloudWatch metric to detect this in production — DatabaseConnectionsCurrentlySessionPinned — and a per-proxy "session pinning filter" configuration option (for MySQL-family engines) to explicitly exempt certain session-variable-setting operations from triggering pinning, when an application team has verified doing so is safe for their workload.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing pinning on the main page\'s own Lambda + RDS Proxy setup',
      language: 'bash',
      code: `# The main page's own recommended fix -- Lambda connects through
# RDS Proxy instead of directly to RDS:
# const host = process.env.DB_PROXY_HOST;

# A perfectly normal-looking Lambda function using a PostgreSQL
# client through the proxy -- BUT it creates a temporary table as
# part of a batch-processing step:
# await client.query('CREATE TEMP TABLE staging (id int, val text)');
# ... bulk inserts into staging ...
# await client.query('INSERT INTO final SELECT * FROM staging');

# Check pinning status via CloudWatch immediately after this
# function runs under load:
aws cloudwatch get-metric-statistics \\
  --namespace AWS/RDS \\
  --metric-name DatabaseConnectionsCurrentlySessionPinned \\
  --dimensions Name=ProxyName,Value=prod-proxy \\
  --start-time 2026-07-21T10:00:00Z \\
  --end-time 2026-07-21T10:05:00Z \\
  --period 60 \\
  --statistics Maximum
# {
#   "Datapoints": [{ "Maximum": 47.0 }]
# }
# -- 47 connections are pinned -- per AWS's own documentation,
# creating a temporary table is a pinning trigger for BOTH MySQL and
# PostgreSQL -- these 47 client connections are each now locked to
# their own dedicated underlying DB connection for the rest of their
# session, defeating the exact pooling benefit the main page's own
# mistake entry describes as the whole point of adding RDS Proxy.`,
    },
    {
      label: 'A second, easy-to-miss trigger: large statement text alone',
      language: 'bash',
      code: `# No session-state change at all here -- just a large, dynamically
# generated bulk INSERT (common in ORMs batching many rows into one
# statement):
# const values = rows.map(r => \`(\${r.id}, '\${r.name}')\`).join(',');
# await client.query(\`INSERT INTO events (id, name) VALUES \${values}\`);
# -- if "values" expands past 16 KB of statement text (easily
# reached with a few hundred rows), per AWS's own documented
# universal rule this pins the connection too -- regardless of
# engine, and regardless of whether the statement itself sets any
# session state whatsoever.

# Diagnosing which specific operations are causing pinning in a
# real workload -- enable the proxy's own debug logging temporarily:
aws rds modify-db-proxy \\
  --db-proxy-name prod-proxy \\
  --debug-logging

# Then check CloudWatch Logs for the proxy's own log group for
# entries explaining WHY a given connection was pinned -- this is
# the practical way to find pinning causes that aren't obvious from
# reading application code alone (e.g. an ORM silently issuing SET
# statements you didn't write yourself).

# Mitigation for legitimate, unavoidable session-variable setup that
# should NOT prevent multiplexing (MySQL-family engines only):
aws rds modify-db-proxy \\
  --db-proxy-name prod-proxy \\
  --auth '[{"AuthScheme":"SECRETS","SecretArn":"'$SECRET_ARN'","IAMAuth":"REQUIRED"}]'
# (session pinning filters are configured via the console or the
# full DBProxy update API -- exempting known-safe SET operations
# from triggering pinning, once verified safe for the workload)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team follows the main page\'s own advice exactly: they put RDS Proxy between their Lambda functions and RDS to solve a "too many connections" problem under load. It works — for most invocations. But during a specific nightly batch job that creates temporary staging tables for bulk data processing, the team starts seeing "too many connections" errors again, even with the proxy in place, and even though the batch job itself is a small, fixed number of concurrent Lambda invocations. Using this subtopic\'s theory, explain what\'s happening.',
    hint: 'Does the batch job\'s use of temporary tables interact with RDS Proxy\'s connection-pooling mechanism any differently than the ordinary, non-batch Lambda invocations the main page\'s own fix was originally designed around?',
    solution: 'Per this subtopic\'s theory, the batch job\'s use of temporary staging tables is very likely triggering connection pinning — AWS\'s own documentation lists "creating a temporary table" as a pinning trigger for both MySQL and PostgreSQL. Each of the batch job\'s Lambda invocations that creates a temp table gets its client connection pinned to its own dedicated underlying database connection for the remainder of that session — meaning, for exactly this batch workload, RDS Proxy is no longer actually pooling connections the way it does for the main page\'s own ordinary, non-temp-table Lambda invocations. If the batch job runs with even a modest number of concurrent Lambda invocations, each one claiming its own pinned, unshared database connection, the underlying RDS instance\'s own max_connections limit can be exhausted just as it would be without a proxy at all — reproducing the exact "too many connections" symptom RDS Proxy was originally introduced to solve, but only for this specific, temp-table-using workload. The fix, per this subtopic\'s theory, is either to redesign the batch job to avoid session-pinning operations (for example, using a permanent, truncate-before-use staging table instead of a session-scoped temporary one, if the workload allows it), or to explicitly provision enough proxy connection capacity to accommodate the batch job\'s pinned connections as a deliberate, sized exception — rather than assuming RDS Proxy\'s pooling benefit applies uniformly to every kind of query the application might run.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once RDS Proxy is correctly configured between an application and RDS, matching the main page\'s own recommended fix, every client connection benefits from pooling identically, for the life of that connection.',
      reality: 'Per this subtopic\'s theory, a client connection can enter a "pinned" state at any point during its session — triggered by specific operations like creating a temp table, setting a session variable, or even just a large enough statement — after which it stops benefiting from pooling entirely for the rest of that session.'
    },
    {
      thought: 'If "too many connections" errors reappear after RDS Proxy is already in place, the proxy itself must be misconfigured or undersized.',
      reality: 'Per this subtopic\'s exercise, the actual cause is frequently connection pinning triggered by specific query patterns (temp tables, prepared statements, large statements) — a correctly-configured, appropriately-sized proxy can still see this symptom for a workload that happens to pin heavily.'
    },
    {
      thought: 'Pinning only happens when an application explicitly and intentionally changes session state, so a team can simply avoid it by not writing SET statements in their own code.',
      reality: 'Per this subtopic\'s theory, pinning can also be triggered by operations with no explicit session-state change at all — a single statement over 16 KB of text pins the connection universally across every engine, and some pinning triggers (like an ORM\'s own generated SET calls) may not be obviously visible in application code without enabling the proxy\'s own debug logging.'
    }
  ];
}
