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
  templateUrl: './update-then-status-update-risks-a-stale-resourceversion-conflict.html',
  styleUrl: './update-then-status-update-risks-a-stale-resourceversion-conflict.scss'
})
export class UpdateThenStatusUpdateRisksAStaleResourceversionConflictSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Reconcile pseudocode calls r.Update() twice on the same in-memory object, without re-fetching between calls',
      points: [
        'The main page\'s own separate mistake entry, "Updating spec and status in the same Update call," correctly warns that spec and status must be updated via SEPARATE calls — `r.Update()` for spec, `r.Status().Update()` for status — since Kubernetes splits them into different subresources.',
        'But the main page\'s own "Reconcile loop (Go)" code tab does something the mistake entry never addresses: at step 3, it calls `controllerutil.AddFinalizer(db, finalizerName); r.Update(ctx, db)` — then, still within the SAME function call, proceeds through step 4 and calls `r.Status().Update(ctx, db)` at step 5, reusing the exact same `db` variable that was already passed to `r.Update()` earlier.',
        'Correctly splitting spec and status into two calls (as the mistake entry advises) is necessary but not sufficient — the SECOND call still needs a version of the object Kubernetes considers current, and the main page\'s own pseudocode never re-fetches `db` between the two Update calls.',
      ]
    },
    {
      heading: 'Why this risks a real 409 Conflict, and what a correct reconcile does instead',
      points: [
        'Every Kubernetes object carries a `resourceVersion` field, and every Update call is optimistic-concurrency-checked against it — the API server rejects an update whose resourceVersion doesn\'t match the CURRENT resourceVersion stored in etcd, specifically to prevent silently overwriting a change that happened in between reads.',
        'The main page\'s own step-3 `r.Update(ctx, db)` call, if it succeeds, changes `db`\'s resourceVersion on the SERVER — but the in-memory `db` variable, still being used in step 5, still holds the OLD resourceVersion from before that update (client-go\'s own Update() does refresh the local object on success in many client versions, which is why this doesn\'t fail every single time — but relying on that refresh happening is fragile, and any code path that copies, recreates, or independently re-reads `db` between the two calls reintroduces the staleness even when the client library would otherwise have kept it current).',
        'The robust pattern, confirmed by client-go\'s own documented approach to this exact problem, is `retry.RetryOnConflict()` — which re-fetches the object and retries the update automatically if a conflict occurs — or, more simply, re-fetching (`r.Get(ctx, req.NamespacedName, db)`) immediately before any Update call that follows an earlier one in the same reconcile pass, rather than trusting that the in-memory object from several steps earlier is still current.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tracing the main page\'s own Reconcile function\'s two Update calls',
      language: 'bash',
      code: `// The main page's own Reconcile function, annotated:

func (r *DatabaseReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    db := &myappv1.Database{}
    r.Get(ctx, req.NamespacedName, db)          // db.ResourceVersion = "100"

    // ... deletion handling omitted ...

    // Step 3: add finalizer
    if !controllerutil.ContainsFinalizer(db, finalizerName) {
        controllerutil.AddFinalizer(db, finalizerName)
        r.Update(ctx, db)
        // SERVER'S resourceVersion is now "101" after this succeeds.
        // Whether the LOCAL "db" variable's own ResourceVersion field
        // reflects "101" depends on client-go's own Update()
        // implementation refreshing it in place -- not something
        // this reconcile function verifies or relies on explicitly.
    }

    // Step 4: reconcile desired state (unchanged from main page)
    r.reconcileStatefulSet(ctx, db)

    // Step 5: update status, STILL using the same "db" variable
    db.Status.Phase = "Running"
    r.Status().Update(ctx, db)
    // If "db"'s own ResourceVersion field is anything OTHER than
    // the server's actual current value at this point, this call
    // fails with a 409 Conflict -- "the object has been modified;
    // please apply your changes to the latest version."

    return ctrl.Result{}, nil
}`,
    },
    {
      label: 'The robust fix -- re-fetch or use RetryOnConflict',
      language: 'bash',
      code: `// Option 1: explicit re-fetch before the second Update call

if !controllerutil.ContainsFinalizer(db, finalizerName) {
    controllerutil.AddFinalizer(db, finalizerName)
    if err := r.Update(ctx, db); err != nil {
        return ctrl.Result{}, err
    }
}

r.reconcileStatefulSet(ctx, db)

// Re-fetch immediately before the status update, so "db" is
// guaranteed current regardless of what client-go's Update() did
// or didn't refresh locally:
if err := r.Get(ctx, req.NamespacedName, db); err != nil {
    return ctrl.Result{}, err
}
db.Status.Phase = "Running"
return ctrl.Result{}, r.Status().Update(ctx, db)

// Option 2: client-go's own documented retry helper --
// automatically re-fetches and retries on a genuine conflict:

import "k8s.io/client-go/util/retry"

err := retry.RetryOnConflict(retry.DefaultBackoff, func() error {
    if err := r.Get(ctx, req.NamespacedName, db); err != nil {
        return err
    }
    db.Status.Phase = "Running"
    return r.Status().Update(ctx, db)
})`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team copies the main page\'s own Reconcile pseudocode into a real controller. It works correctly in testing, where each reconcile runs against a freshly-created CR with no concurrent modifications. In production, they start intermittently seeing "the object has been modified; please apply your changes to the latest version" errors in their controller logs, specifically on CRs that also have another process (a webhook, or a second controller) occasionally patching a label on the same object. Using this subtopic\'s theory, explain why this error only shows up in production, and what specifically about the second modifier makes it worse.',
    hint: 'Per this subtopic\'s theory, does the conflict risk depend on the resourceVersion changing BETWEEN the reconcile function\'s own two Update calls — and would that ever happen in a single-writer test environment versus a multi-writer production one?',
    solution: 'Per this subtopic\'s theory, the conflict only becomes visible once something else can change the object\'s resourceVersion in the narrow window between the reconcile function\'s own finalizer Update() and its later Status().Update() call. In testing, with only this one controller ever touching the CR and no concurrent writers, the in-memory db object\'s resourceVersion (whether refreshed by client-go\'s own Update() or not) almost always still matches the server by the time the status update runs — nothing else had a chance to change it in between. In production, a second process (the webhook or the other controller) patching a label on the SAME object at almost any point during this reconcile\'s own execution advances the resourceVersion on the server independently of this controller\'s own two Update calls — meaning by the time this reconcile reaches its own Status().Update(), the resourceVersion it\'s holding (even if correctly refreshed after its OWN first Update) is now stale relative to what the OTHER process just wrote. The fix, per this subtopic\'s theory, is the same either way: re-fetch immediately before the status update (or wrap it in retry.RetryOnConflict), so the reconcile is never relying on an in-memory object staying current for longer than genuinely guaranteed — a guarantee that only silently held in the single-writer test environment.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Splitting spec and status updates into two separate calls (r.Update() then r.Status().Update()), exactly as the main page\'s own mistake entry recommends, is sufficient to avoid conflict errors in a reconcile loop.',
      reality: 'Per this subtopic\'s theory, splitting the calls avoids the SPECIFIC problem that mistake entry describes (spec/status updates colliding in one call) — but the second call still needs a current resourceVersion, and nothing about splitting the calls guarantees the in-memory object used for the second call is still up to date, especially if anything else modifies the object in between.'
    },
    {
      thought: 'Reusing the same in-memory object variable across multiple Update calls within a single reconcile function call is always safe, since it\'s the same reconcile execution and no time has meaningfully passed.',
      reality: 'Per this subtopic\'s exercise, the risk isn\'t about elapsed time within the function — it\'s about whether ANYTHING ELSE (another controller, a webhook, even the reconcile\'s own earlier Update call depending on client library behavior) has changed the object\'s resourceVersion on the server since the in-memory copy was last confirmed current.'
    },
    {
      thought: 'A 409 Conflict error in a Kubernetes controller always indicates a real bug or genuine concurrent-modification race that needs custom handling logic to diagnose case by case.',
      reality: 'Per this subtopic\'s theory, this is an EXPECTED, well-understood category of error in controller-runtime code with a standard, documented solution — re-fetching before retrying, or wrapping the operation in retry.RetryOnConflict — not something requiring bespoke investigation each time it appears.'
    }
  ];
}
