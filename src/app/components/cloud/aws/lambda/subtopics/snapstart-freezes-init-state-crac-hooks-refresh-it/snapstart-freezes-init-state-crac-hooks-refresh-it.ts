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
  templateUrl: './snapstart-freezes-init-state-crac-hooks-refresh-it.html',
  styleUrl: './snapstart-freezes-init-state-crac-hooks-refresh-it.scss'
})
export class SnapstartFreezesInitStateCracHooksRefreshItSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes SnapStart\'s speed win — never the tradeoff a shared snapshot introduces',
      points: [
        'The main page\'s own theory bullet and quickRef entry both describe SnapStart purely in terms of latency: "restore takes ~10 ms regardless of package size," "sub-second latency." Neither mentions what happens to any state a function initialized BEFORE the snapshot was taken.',
        'This subtopic also corrects a separate main-page inaccuracy just fixed alongside it: the main page previously described SnapStart as "Java 11/21 only" — AWS has since extended it to Python 3.12+ and .NET 8+ too. The tradeoff this subtopic covers applies identically across every supported runtime, not just Java.',
      ]
    },
    {
      heading: 'A SnapStart snapshot is reused verbatim across every restored execution environment — anything "unique" generated before it stops being unique',
      points: [
        'Per AWS\'s own documentation: "With SnapStart, Lambda uses a single snapshot as the initial state for multiple execution environments. If your function uses any of the following during the initialization phase, then you might need to make some changes before using SnapStart." The first category is Uniqueness: "If your initialization code generates unique content that is included in the snapshot, then the content might not be unique when it is reused across execution environments. This includes unique IDs, unique secrets, and entropy that\'s used to generate pseudorandomness."',
        'Two more categories AWS documents: Network connections ("The state of connections that your function establishes during the initialization phase isn\'t guaranteed when Lambda resumes your function from a snapshot") and Temporary data ("Some functions download or initialize ephemeral data, such as temporary credentials or cached timestamps, during the initialization phase. Refresh ephemeral data in the function handler before using it").',
        'This directly interacts with the main page\'s own "Opening database connections per invocation" mistake entry, which teaches moving connection setup to module scope specifically so it runs once and is reused. Under SnapStart, that same module-scope code runs ONCE — at snapshot-creation time — and every restored environment shares whatever state it produced, including a UUID, a random seed, or a raw idempotency key generated exactly once at that module scope.',
        'AWS\'s documented fix is runtime hooks, built on the open-source CRaC (Coordinated Restore at Checkpoint) project for Java: a class implements Resource\'s beforeCheckpoint() and afterRestore() methods and registers itself with Core.getGlobalContext(). Lambda calls beforeCheckpoint() right before taking the snapshot and afterRestore() right after every restore — letting a function regenerate a fresh UUID, re-seed randomness, or re-fetch temporary credentials AFTER each restore, rather than reusing whatever the snapshot froze.',
        'A documented gotcha inside the hook mechanism itself: Context only keeps a WeakReference to a registered Resource — AWS explicitly warns against `Core.getGlobalContext().register(new MyResource())` (no strong reference kept anywhere) or an anonymous Resource class, since either can be silently garbage-collected before the hook ever runs. AWS also documents a hard timing constraint: afterRestore() hooks must finish within a fixed 10-second limit or the invocation fails with a SnapStartTimeoutException — a separate ceiling from the function\'s own configured timeout.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the bug: the main page\'s own module-scope pattern, now under SnapStart',
      language: 'bash',
      code: `# The main page's own "Opening database connections per invocation"
# fix teaches moving setup to module scope so it runs once, reused
# on every warm invocation:
# const pool = new Pool({ host: process.env.DB_HOST });  // module scope

# Now add a module-scope idempotency key, generated the same way,
# under the same "runs once, reused" assumption:
# import java.util.UUID;
# public class OrderHandler implements RequestHandler<Order, String> {
#   private static final String INSTANCE_ID = UUID.randomUUID().toString();
#   // ... used later as part of an idempotency key sent to a payments API
# }

# WITHOUT SnapStart: a genuine cold start reruns this static
# initializer independently for each new execution environment --
# every environment gets its OWN distinct INSTANCE_ID.

# WITH SnapStart enabled: this static initializer runs exactly ONCE,
# at snapshot-creation time (when the version is published) --
# EVERY execution environment resumed from that snapshot shares the
# exact same INSTANCE_ID, because it was frozen into the shared
# snapshot rather than re-executed per environment.
aws lambda publish-version --function-name order-handler
# -- INSTANCE_ID is generated here, once, and baked into the
# snapshot every subsequent restored environment shares.

# Confirming this in production -- multiple concurrent invocations
# on different (restored) execution environments logging the SAME
# INSTANCE_ID is the signature symptom of frozen-at-snapshot state,
# as opposed to a real per-environment cold start.`,
    },
    {
      label: 'The documented fix — CRaC beforeCheckpoint()/afterRestore() hooks',
      language: 'bash',
      code: `# AWS's own documented pattern (org.crac package) -- regenerate the
# unique value AFTER each restore, not just once at snapshot time:

# import org.crac.Resource;
# import org.crac.Core;
#
# public class OrderHandler implements RequestHandler<Order, String>, Resource {
#   private String instanceId;
#
#   public OrderHandler() {
#     // Keep a STRONG reference by registering 'this' directly --
#     // AWS explicitly warns that an anonymous Resource, or one with
#     // no field holding a reference, can be silently garbage
#     // collected before the hook ever fires.
#     Core.getGlobalContext().register(this);
#     this.instanceId = java.util.UUID.randomUUID().toString();  // frozen at snapshot time
#   }
#
#   @Override
#   public void beforeCheckpoint(org.crac.Context<? extends Resource> context) {
#     // runs once, right before the snapshot is taken
#   }
#
#   @Override
#   public void afterRestore(org.crac.Context<? extends Resource> context) {
#     // runs on EVERY restore -- regenerate what shouldn't be shared:
#     this.instanceId = java.util.UUID.randomUUID().toString();
#     // must complete within AWS's documented 10-second afterRestore
#     // timeout, or the invocation fails with SnapStartTimeoutException
#   }
# }
# -- after this fix, every restored environment gets its OWN
# instanceId again, generated in afterRestore() instead of being
# permanently baked into the shared snapshot.

# Build config addition AWS documents for the org.crac dependency
# (Gradle example):
# dependencies {
#   implementation group: 'org.crac', name: 'crac', version: '1.4.0'
# }`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team enables SnapStart on a Java payments function to cut cold-start latency, matching the main page\'s own recommendation. The function generates a UUID once at module/class-initializer scope, following the exact "set it up once, reuse it" pattern the main page\'s own connection-pooling mistake entry teaches, and uses that UUID as part of an idempotency key sent to a downstream payments API. A week after enabling SnapStart, the team starts seeing duplicate-idempotency-key rejections from that API across invocations that were never actually duplicates before. Using this subtopic\'s theory, diagnose the cause and describe the fix.',
    hint: 'Under a normal cold start, module-scope code reruns independently per execution environment. Does that still hold once SnapStart is enabled?',
    solution: 'Per this subtopic\'s theory, this is exactly the SnapStart uniqueness tradeoff AWS documents: the UUID is generated once, in the class initializer, at the moment the function version is published and snapshotted — not independently per execution environment the way it would under a genuine cold start. Every execution environment SnapStart later resumes from that snapshot shares the exact same frozen UUID, so multiple DIFFERENT invocations across DIFFERENT restored environments all send the SAME idempotency key to the payments API, which correctly (from its own point of view) rejects the later ones as duplicates. This matches AWS\'s own documented warning almost exactly: "If your initialization code generates unique content that is included in the snapshot, then the content might not be unique when it is reused across execution environments." The fix is to implement CRaC\'s Resource interface and register with Core.getGlobalContext(), regenerating the UUID inside afterRestore() (which runs on every restore) rather than relying on the class initializer\'s one-time value — while keeping a strong reference to the registered Resource, since AWS separately warns that a Resource without one can be silently garbage-collected before the hook ever fires.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SnapStart just makes the exact same cold-start initialization happen faster — every restored execution environment still independently reruns the function\'s init code, the same as an ordinary cold start would.',
      reality: 'Per this subtopic\'s theory, the opposite is true: SnapStart initializes ONCE, at snapshot-creation time, and every subsequently restored environment reuses that single frozen snapshot rather than re-running init code independently.'
    },
    {
      thought: 'Any state a function sets up during init-phase or module-scope code is automatically safe to use under SnapStart, as long as the initialization code itself doesn\'t throw an error.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation specifically calls out unique IDs, secrets, pseudorandom entropy, network connections, and temporary credentials/timestamps as categories that need explicit handling — successful initialization doesn\'t mean the resulting state is safe to reuse across every restored environment.'
    },
    {
      thought: 'Registering a CRaC Resource with an anonymous class (Core.getGlobalContext().register(new Resource() { ... })) is a normal, safe pattern, the same as using an anonymous class for most other Java callback APIs.',
      reality: 'Per this subtopic\'s theory, AWS explicitly warns against this exact pattern — Context only keeps a WeakReference to the registered object, so an anonymous Resource (or any Resource with no field holding a strong reference) can be silently garbage-collected before Lambda ever calls its hooks.'
    }
  ];
}
