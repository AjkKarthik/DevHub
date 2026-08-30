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
  templateUrl: './no-scale-rule-means-an-implicit-http-rule-applies.html',
  styleUrl: './no-scale-rule-means-an-implicit-http-rule-applies.scss'
})
export class NoScaleRuleMeansAnImplicitHttpRuleAppliesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine main-page inaccuracy this subtopic corrects: the "300 replicas by default" claim',
      points: [
        'Before this correction, the main page\'s own "Scaling limits" bullet read: "set --min-replicas and --max-replicas. The Consumption plan scales to 300 replicas by default." That combines two separate, and separately wrong, ideas: that 300 is a plan-level default, and that it applies specifically to the Consumption plan.',
        'Per Microsoft\'s own scaling reference, the real default for --max-replicas (used whenever a scale rule is created without explicitly setting it) is 10, with a documented configurable ceiling of "Maximum replicas configurable are 1,000" — the same ceiling for both Consumption-only and Workload Profile environments. 300 has no special status in the official docs at all; it traces to a historical Azure portal UI slider cap, not a platform default or hard limit.',
      ]
    },
    {
      heading: 'The deeper, unstated gap: what happens with NO scale rule at all',
      points: [
        'The main page\'s own theory covers HTTP scaling, queue-based KEDA rules, and combined triggers — but never addresses the case of a container app deployed with zero scale rules defined, which is a common default path for a first-time az containerapp create.',
        'Per Microsoft\'s own documentation: "If you don\'t create a scale rule, the default scale rule is applied to your container app" — an implicit HTTP rule with Min replicas 0 and Max replicas 10. This isn\'t a fallback that only kicks in on error; it is silently and automatically attached to every app that never explicitly defines a scale rule.',
        'Microsoft\'s own docs pair this with an operational trap worth calling out on its own: "Make sure you create a scale rule or set minReplicas to 1 or more if you don\'t enable ingress. If ingress is disabled and you don\'t define a minReplicas or a custom scale rule, your container app scales to zero and has no way of starting back up." A non-HTTP background worker with ingress disabled and no explicit scale rule inherits the implicit HTTP-based default rule, which has nothing to trigger it (no ingress traffic exists) — the app scales to zero via that default and then can never scale back up on its own.',
      ]
    },
    {
      heading: 'Why "just raise max-replicas" isn\'t the whole fix',
      points: [
        'Explicitly setting --max-replicas above 10 (or above the old 300 figure) solves the replica-ceiling half of the problem, but does nothing for the ingress-disabled trap above — that requires either enabling ingress, or explicitly setting --min-replicas to 1 or higher, or defining a real (non-HTTP) scale rule with its own trigger.',
        'Per Microsoft\'s own "Considerations" notes on this page: in multiple-revision mode, adding a new scale trigger creates a brand-new revision, while the previous revision (with its own separate, and possibly still-default, scale rule) remains active and continues serving whatever traffic weight it was assigned — meaning a fix applied to a new revision does not retroactively change the scaling behavior of an older revision still receiving live traffic.',
        'The practical takeaway is to always explicitly declare min-replicas, max-replicas, and (for non-HTTP workloads) a real trigger-based scale rule at creation time, rather than relying on the implicit HTTP default — especially for background workers, where the implicit rule\'s HTTP trigger has no meaningful signal to scale on at all.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The implicit default rule, made explicit',
      language: 'bash',
      code: `# Deploying WITHOUT any --scale-rule-* flags at all:
az containerapp create \\
  --name my-api \\
  --resource-group my-rg \\
  --environment my-env \\
  --image myregistry.azurecr.io/my-api:latest \\
  --target-port 8080 \\
  --ingress external
  # No --min-replicas, --max-replicas, or --scale-rule-* flags set.

# Per Microsoft's own "Default scale rule" table, this app silently
# gets the exact equivalent of:
az containerapp update \\
  --name my-api \\
  --resource-group my-rg \\
  --scale-rule-name azure-http-rule \\
  --scale-rule-type http \\
  --scale-rule-http-concurrency 10 \\
  --min-replicas 0 --max-replicas 10

# Not 300, and not unlimited -- a hard ceiling of 10 replicas that
# was never explicitly chosen by whoever ran the first command.`,
    },
    {
      label: 'The ingress-disabled trap the implicit default rule creates',
      language: 'bash',
      code: `# A background worker, deployed with ingress disabled and NO
# explicit scale rule or min-replicas:
az containerapp create \\
  --name my-worker \\
  --resource-group my-rg \\
  --environment my-env \\
  --image myregistry.azurecr.io/my-worker:latest \\
  --ingress disabled
  # No --scale-rule-*, no --min-replicas.

# Per Microsoft's own explicit warning: "If ingress is disabled and
# you don't define a minReplicas or a custom scale rule, your
# container app scales to zero and has no way of starting back up."
#
# What happens: the implicit default HTTP rule (min 0, max 10) still
# attaches -- but with ingress disabled, there is no HTTP traffic to
# ever trigger a scale-out. The app scales to its minimum (0) and
# then has no signal left that could ever scale it back up.

# The fix: define a REAL trigger for a non-HTTP worker, e.g.:
az containerapp update \\
  --name my-worker \\
  --resource-group my-rg \\
  --scale-rule-name sb-rule \\
  --scale-rule-type azure-servicebus \\
  --scale-rule-auth "connection=servicebus-connection" \\
  --scale-rule-metadata "queueName=orders" "messageCount=5" \\
  --min-replicas 0 --max-replicas 20
# ...or simply set --min-replicas 1 to keep it always running.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate deploys a new background worker container app with ingress disabled, planning to add a Service Bus scale rule "later." They never explicitly set --min-replicas or any --scale-rule-* flags. A week later the app has scaled to zero and no amount of sending Service Bus messages brings it back up. What went wrong?',
    hint: 'Check what scale rule is silently attached to a container app that never had one explicitly defined, and what kind of trigger that implicit rule actually watches for.',
    solution: 'The app never had a Service Bus (or any custom) scale rule attached at all — it still had the implicit default scale rule Container Apps applies to every app with none explicitly defined: an HTTP rule with min-replicas 0 and max-replicas 10. With ingress disabled, there is no HTTP traffic to ever satisfy that rule\'s trigger condition, so the app scaled down to its minimum (0) and then had no live signal capable of scaling it back up — sending messages to a Service Bus queue does nothing, because no scale rule is actually watching that queue. Per Microsoft\'s own documentation, this exact scenario is called out directly: "If ingress is disabled and you don\'t define a minReplicas or a custom scale rule, your container app scales to zero and has no way of starting back up." The fix is to explicitly define the intended Service Bus scale rule (or set min-replicas to 1) at deploy time rather than deferring it, since the implicit default silently fills the gap with a rule that can never fire for this workload.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If you deploy a container app without setting --max-replicas, Container Apps scales it as high as it needs to under load, up to the platform\'s true ceiling.',
      reality: 'Per this subtopic\'s theory, an app with no explicit scale rule receives the implicit default HTTP rule, which caps max-replicas at just 10 — far below the platform\'s actual configurable ceiling of 1,000 documented for --max-replicas.'
    },
    {
      thought: 'The Consumption plan has a special "300 replicas by default" scaling behavior baked into the platform.',
      reality: 'Per this subtopic\'s theory (and the correction now on the main page), Microsoft\'s own scaling reference documents the true default max-replicas as 10, with a 1,000-replica configurable ceiling shared by both Consumption and Workload Profile environments — 300 is not a documented plan-level default anywhere in the official scaling docs.'
    },
    {
      thought: 'A container app with no scale rule at all simply never scales, staying at whatever replica count it started with.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own docs are explicit that a default scale rule is always applied when none is defined — a min-0/max-10 HTTP rule — meaning the app IS actively scaling, just according to a rule the developer never consciously chose, which can silently strand a non-HTTP worker at zero replicas.'
    }
  ];
}
