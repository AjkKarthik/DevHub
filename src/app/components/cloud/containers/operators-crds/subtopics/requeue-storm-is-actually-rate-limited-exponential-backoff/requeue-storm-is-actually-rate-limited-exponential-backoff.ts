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
  templateUrl: './requeue-storm-is-actually-rate-limited-exponential-backoff.html',
  styleUrl: './requeue-storm-is-actually-rate-limited-exponential-backoff.scss'
})
export class RequeueStormIsActuallyRateLimitedExponentialBackoffSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry uses the phrase "requeue storm" with no further explanation',
      points: [
        'The main page\'s own "Returning an error on NotFound for owned resources" mistake entry says: returning NotFound as a real error "causes an immediate requeue loop that hammers the API server" and, in its title/summary framing, calls this a "requeue storm." That phrase suggests sustained, uncontrolled hammering — the kind of runaway loop that would need a circuit breaker or manual intervention to stop.',
        'What the main page never mentions is that controller-runtime — the library underlying the exact `Reconcile(ctx, req)` pattern the main page\'s own code tab uses — has a DEFAULT rate limiter specifically designed to prevent exactly this kind of sustained hammering, active on every reconcile that returns a non-nil error.',
        'This doesn\'t mean the main page\'s underlying advice is wrong — returning NotFound as an error is still a real mistake worth avoiding — but "storm" implies an unbounded, unmanaged flood that the actual default behavior was specifically built to prevent from ever fully materializing.',
      ]
    },
    {
      heading: 'What actually happens: a self-limiting exponential backoff, not an unbounded flood',
      points: [
        'Per controller-runtime\'s own documented default, reconciles that return a non-nil error (or `Requeue: true`) are rate-limited by a per-item exponential backoff: `baseDelay * 2^<num-failures>`, starting around 5ms and doubling on every consecutive failure of that SAME object, up to a documented maximum delay around 1000 seconds (roughly 16-17 minutes) — after which it stops growing and simply retries at that ceiling indefinitely.',
        'This means there genuinely IS a brief burst right at the start — the first few retries really do happen fast (5ms, 10ms, 20ms, 40ms...) — so "storm" is not entirely inaccurate for that opening moment. But within a small number of consecutive failures, the delay has already grown into seconds, then tens of seconds, self-limiting the situation long before it becomes a sustained flood against the API server.',
        'Critically, this rate limiting is PER OBJECT (per reconcile-request key), not global — per controller-runtime\'s own documentation, "if you continuously fail reconciling one object... you will not start off with a huge delay the first time you fail to reconcile a DIFFERENT object." A single misbehaving CR backing off to a 1000-second retry interval does not throttle or delay reconciliation of every other, healthy CR the same controller manages.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the retry timeline for ONE failing object actually looks like',
      language: 'bash',
      code: `# The main page's own mistake: returning NotFound as a real error
# on every reconcile of a Database CR whose StatefulSet doesn't
# exist yet (a completely normal, expected first-reconcile state):

# func (r *DatabaseReconciler) Reconcile(...) (ctrl.Result, error) {
#     sts := &appsv1.StatefulSet{}
#     if err := r.Get(ctx, key, sts); err != nil {
#         return ctrl.Result{}, err   // <- the main page's own "wrong" example
#     }
#     ...
# }

# The resulting retry timeline for THIS specific Database object,
# under controller-runtime's default rate limiter (base 5ms, max 1000s):
#
#   Failure 1:  requeued after   ~5ms
#   Failure 2:  requeued after  ~10ms
#   Failure 3:  requeued after  ~20ms
#   Failure 4:  requeued after  ~40ms
#   Failure 5:  requeued after  ~80ms
#   ...
#   Failure 10: requeued after  ~2.5s
#   Failure 15: requeued after  ~80s
#   Failure ~18+: capped at    ~1000s (~16.7 min), stays there
#
# The first handful of failures genuinely ARE fast -- a real, if
# brief, burst -- but by the time this has failed even 15-20 times
# (well under a minute of wall-clock time), it has already backed
# off to retrying roughly once every 16-17 minutes, not hammering
# the API server indefinitely the way "storm" alone implies.`,
    },
    {
      label: 'Why this is per-object, not a global controller-wide slowdown',
      language: 'bash',
      code: `# 100 Database CRs exist. One of them (misconfigured-db) hits the
# NotFound-as-error bug on every reconcile and has backed off to
# the ~1000s ceiling. The other 99 are healthy.

# Per controller-runtime's own per-item rate limiter design, this
# does NOT mean the other 99 objects are also throttled to a
# 1000-second reconcile interval -- each object's own failure
# count and backoff state is tracked independently:

kubectl get databases
# NAME                 PHASE     AGE
# misconfigured-db     Failed    2h    <- reconciling ~every 16-17 min
# prod-db-1            Running   2h    <- reconciling normally, its
# prod-db-2            Running   2h       own backoff state was
# ... (97 more, all Running) ...           never triggered at all

# The ONE genuinely correct fix, per the main page's own separate
# "right" example, is still the real fix -- catching NotFound
# explicitly and treating it as "create this resource," not an
# error at all -- since even a self-limiting backoff is still 15-20
# unnecessary failed reconciles and log entries for something that
# was never actually wrong, just a normal first-reconcile state.
# The backoff mechanism limits the BLAST RADIUS of the mistake; it
# doesn't make the mistake itself correct or free of cost.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team observes their controller\'s log volume spike briefly whenever a new Database CR is first created, then quiet down within a couple of minutes even though the underlying NotFound-as-error bug (from the main page\'s own mistake entry) is still present in their code and never got fixed. They conclude the bug must not actually be causing a problem, since the noise stops on its own. Using this subtopic\'s theory, is that conclusion accurate?',
    hint: 'Per this subtopic\'s theory, does the exponential backoff mechanism make the underlying NotFound-as-error mistake stop happening, or does it just make the RATE of repeated failures decrease over time for that specific object?',
    solution: 'Per this subtopic\'s theory, the conclusion is not accurate — the backoff mechanism is exactly why the noise quiets down, but it does not mean the bug stopped occurring or was ever actually fixed. Every new Database CR still hits the same NotFound-as-error mistake on its first reconcile (since its StatefulSet genuinely doesn\'t exist yet), still fails, and still gets requeued — the exponential backoff just means those failures happen close together at first (creating the observed brief noise spike) and then increasingly far apart, eventually settling around the ~1000-second ceiling per object, which naturally looks quiet in a log stream even though the underlying error condition is still being hit repeatedly, just infrequently. The team\'s controller is still doing meaningfully wasted work (15-20+ failed reconciles per new object that could have been zero), still logging error-level noise that could obscure genuinely unexpected failures, and the StatefulSet still isn\'t getting created any faster than it would have anyway — the backoff mechanism limits the SEVERITY of the mistake\'s symptoms, it does not correct the mistake itself, which is exactly why the main page\'s own separate "right" example (explicitly checking errors.IsNotFound and treating it as a create-if-missing case) remains the actual fix regardless of how self-limiting the retry behavior looks from the outside.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own "requeue storm" description means returning an error on NotFound causes sustained, unbounded hammering of the API server that will continue indefinitely until manually stopped.',
      reality: 'Per this subtopic\'s theory, controller-runtime\'s default per-item exponential backoff rate limiter self-limits this within a small number of consecutive failures — the retry interval grows from milliseconds to a capped maximum around 1000 seconds, meaning the "storm" is real but brief, not an unbounded ongoing flood.'
    },
    {
      thought: 'If one Custom Resource repeatedly fails to reconcile and backs off to the maximum retry delay, every other object managed by the same controller also slows down, since they share the same controller and workqueue.',
      reality: 'Per this subtopic\'s exercise, controller-runtime\'s rate limiter is PER OBJECT (per reconcile-request key) — one misbehaving object backing off to its own maximum delay has no effect on the independent backoff state or reconcile frequency of any other, healthy object the same controller manages.'
    },
    {
      thought: 'Since the exponential backoff naturally quiets down repeated failure noise over time, an underlying reconcile bug causing those failures doesn\'t need to be fixed if the log volume it produces isn\'t a practical problem.',
      reality: 'Per this subtopic\'s theory, the backoff mechanism limits how OFTEN a bug\'s symptoms recur, but never corrects the underlying mistake — every occurrence of the triggering condition still produces the same wasted reconciles and error-level noise, just spaced further apart as the backoff grows, which is why the main page\'s own explicit-NotFound-check fix remains necessary regardless of how quiet the retry pattern eventually looks.'
    }
  ];
}
