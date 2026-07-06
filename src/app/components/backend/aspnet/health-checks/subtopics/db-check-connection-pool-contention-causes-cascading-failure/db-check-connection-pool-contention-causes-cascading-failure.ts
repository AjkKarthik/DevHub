import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-db-check-pool-contention-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './db-check-connection-pool-contention-causes-cascading-failure.html',
  styleUrl: './db-check-connection-pool-contention-causes-cascading-failure.scss',
})
export class DbCheckConnectionPoolContentionCausesCascadingFailureSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page correctly warns that a DATABASE check on the LIVENESS probe causes a crash-loop — but never examines the analogous, subtler risk on the READINESS probe: AddDbContextCheck<T>() shares the SAME connection pool as real application traffic, and under load, health-check traffic competing for that pool can turn a slow database into a self-reinforcing outage rather than a simple, isolated signal',
      points: [
        '<code>AddDbContextCheck&lt;T&gt;()</code> calls <code>CanConnectAsync()</code>, which — like any other EF Core operation — must acquire a connection from the SAME ADO.NET connection pool that every real request handler also draws from. There is no separate, reserved "health check connection" — the health check is, from the pool\'s perspective, just another consumer competing for the same limited set of connections.',
        'Under a genuine database slowdown (long-running queries, lock contention, a failing replica), the connection pool fills up with requests waiting for a connection to free up. The health check\'s own <code>CanConnectAsync()</code> call joins that SAME queue — meaning the health check is MOST likely to time out and report Unhealthy at PRECISELY the moment the pool is under the most real pressure, which is also the moment removing a pod from the load balancer does the most damage: fewer healthy pods now handle the SAME total traffic, each absorbing a larger share of the connection-pool pressure, making THEIR OWN health checks more likely to also fail next.',
      ],
    },
    {
      heading: 'This produces a cascading failure shape distinct from the liveness crash-loop the main page describes — instead of pods restarting, pods get progressively REMOVED from the load balancer one after another as the SAME finite connection pool pressure concentrates onto a shrinking pool of survivors, potentially ending with ALL pods marked Unhealthy despite the database itself never fully going down',
      points: [
        'The mitigation is not "don\'t check the database on readiness" (a real DB outage genuinely SHOULD remove a pod from rotation) — it is ensuring the health check\'s own connection acquisition does not compound the exact pressure it is trying to detect. Using a SEPARATE, small, dedicated connection pool (or a raw lightweight connection rather than going through the same <code>DbContext</code> pool the application uses) for health checks specifically isolates the check from the contention it is meant to observe.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The shared-pool problem, made concrete',
      language: 'csharp',
      code: `// This looks correct and matches the main page's own recommended
// pattern exactly — but it shares the SAME connection pool as every
// real request handler in the app:
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlServer(connectionString, sql =>
        sql.CommandTimeout(30)));   // pool size defaults to 100 (ADO.NET)

builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database", tags: ["ready"]);

// Under normal load: plenty of spare connections in the pool, the
// health check acquires one instantly, reports Healthy in milliseconds.

// Under a real DB slowdown (e.g. a blocking transaction, a runaway
// query, replica lag): the pool's 100 connections are ALL checked out
// by real request handlers, each waiting on the slow database.
// CanConnectAsync() for the health check joins the SAME wait queue —
// there is no priority lane for it. If it can't acquire a connection
// within the check's own timeout, it reports Unhealthy — CORRECTLY
// reflecting real distress, but ALSO removing THIS pod from rotation,
// which redirects its share of traffic onto the remaining pods,
// intensifying pool pressure on THEM next.`,
    },
    {
      label: 'The fix — a dedicated, small connection pool isolated from application traffic',
      language: 'csharp',
      code: `// Give the health check its OWN connection string with a small,
// separate pool — Max Pool Size isolates it from the application's
// connection pressure entirely:
var healthCheckConnStr = new SqlConnectionStringBuilder(connectionString)
{
    ApplicationName = "MyApi-HealthCheck",
    MaxPoolSize     = 2,          // tiny, dedicated pool — never competes
                                   // with the app's 100-connection pool
    ConnectTimeout  = 3,          // fail fast rather than queueing
}.ConnectionString;

builder.Services.AddHealthChecks()
    // AddSqlServer opens its OWN raw connection using this string —
    // NOT going through AppDbContext or its shared pool at all:
    .AddSqlServer(
        connectionString: healthCheckConnStr,
        name: "database",
        tags: ["ready"],
        timeout: TimeSpan.FromSeconds(3));

// Now: even if the APPLICATION's 100-connection pool is fully
// saturated and every real request is queueing, the health check's
// dedicated 2-connection pool is UNAFFECTED — it reports the TRUE
// state of "can the database accept a NEW connection at all" without
// itself contributing to, or being starved by, the application's own
// connection pressure.

// A custom IHealthCheck achieves the same isolation explicitly:
public class DbConnectivityCheck(string healthCheckConnectionString) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken ct = default)
    {
        await using var conn = new SqlConnection(healthCheckConnectionString);
        try
        {
            await conn.OpenAsync(ct);   // dedicated pool, isolated
            return HealthCheckResult.Healthy();
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Cannot open dedicated health-check connection.", ex);
        }
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team implements the dedicated-connection-pool fix, but a colleague argues it defeats the purpose of the health check: "if the database itself is genuinely down, a health check using a completely separate, tiny connection pool with a fast timeout would still correctly report Unhealthy — so what exactly does sharing the pool with real traffic add, if the isolated version catches the SAME real outage?" Answer the colleague\'s question precisely — what does the SHARED-pool version detect that the isolated version does not, and is that detection worth the cascading-failure risk?',
    hint: 'Consider a scenario where the DATABASE SERVER itself is perfectly healthy and instantly accepting new connections, but the APPLICATION\'s specific 100-connection pool is exhausted for an application-side reason (a connection leak, a burst of slow queries from one bad code path, insufficient pool sizing for current traffic). Would the isolated health check (its own separate 2-connection pool) detect THIS specific problem? Would the shared-pool version?',
    solution: `The colleague is right that a genuine DATABASE-SIDE outage (the SQL
Server process itself down, unreachable, or actively refusing new
connections) is detected identically by both versions — a dedicated
health-check pool trying to open ITS OWN connection would also fail
immediately in that scenario, with no loss of detection capability.

What the SHARED-pool version detects that the isolated version
CANNOT is an APPLICATION-SIDE connection pool exhaustion problem where
the database server itself is perfectly healthy — a connection leak in
the app's own code, an under-provisioned pool size for current
traffic, or a burst of unusually slow queries monopolizing the app's
100 connections. In this scenario, a dedicated 2-connection pool
opens its own fresh connection just fine (the DATABASE SERVER has
plenty of capacity to accept it) and reports Healthy — even though the
APPLICATION itself is currently unable to serve real requests because
ITS pool is exhausted. The isolated check would be blind to exactly
the failure mode that actually matters most operationally: "can THIS
INSTANCE of the application currently do database work," not "is the
database server reachable in the abstract."

So the honest trade-off is: the shared-pool version detects a real,
important failure mode (app-level pool exhaustion) that the isolated
version misses entirely — at the cost of the cascading-failure risk
this subtopic describes. The best practical answer usually isn't
"always isolate" — it's registering BOTH checks with different tags
and different weight: a dedicated-pool check tagged for basic
database-server-reachability (safe from cascading, catches server-down
scenarios), AND a SEPARATE, explicitly bounded check against the
application's OWN pool (e.g., checking DbContext's pool exhaustion
metrics directly rather than opening a fresh connection, or accepting
the shared-pool risk but with a very short timeout and careful
monitoring of the cascading pattern) — giving operators visibility
into both failure classes without either one alone being a complete
solution.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'AddDbContextCheck<T>() is a lightweight, isolated check that has no meaningful interaction with the application\'s own database traffic.',
      reality: 'AddDbContextCheck<T>() acquires a connection from the exact SAME ADO.NET connection pool that every real request handler draws from — under a genuine database slowdown, the health check competes for the same limited connections, making it most likely to fail precisely when removing a pod from rotation does the most damage.',
    },
    {
      thought: 'a readiness probe checking database connectivity is purely a passive OBSERVER of database health, with no risk of making an outage worse.',
      reality: 'because the check shares the application\'s connection pool, its own failure directly removes capacity from the load balancer, concentrating the SAME finite connection-pool pressure onto fewer remaining pods — a cascading, self-reinforcing failure shape distinct from (but analogous to) the liveness crash-loop the main page describes for restarts.',
    },
    {
      thought: 'giving a health check its own dedicated, isolated connection pool is strictly better than sharing the application\'s pool, with no detection trade-off.',
      reality: 'an isolated health-check pool cannot detect application-side connection pool exhaustion (a leak, undersized pool, or a burst of slow queries) where the database SERVER itself is perfectly healthy — that failure mode is only visible to a check that shares, or otherwise observes, the application\'s own pool.',
    },
  ];
}
