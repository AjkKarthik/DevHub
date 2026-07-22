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
  templateUrl: './circuit-breaker-disabled-by-default-needs-explicit-rollback-flag.html',
  styleUrl: './circuit-breaker-disabled-by-default-needs-explicit-rollback-flag.scss'
})
export class CircuitBreakerDisabledByDefaultNeedsExplicitRollbackFlagSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own rolling-update bullets describe pace, never failure detection',
      points: [
        'The main page\'s own "ECS Networking & ALB Integration" theory bullet explains minimumHealthyPercent and maximumPercent as controlling "how many old vs new tasks run during a deploy" — this is entirely about PACE: how fast tasks are replaced. It says nothing about what happens if the NEW tasks themselves are actually broken and never become healthy.',
        'The main page does cover Blue/Green (via CodeDeploy) as a way to get instant rollback by shifting ALB traffic back — but that requires adopting CodeDeploy as a second deployment mechanism entirely. For a team using the default ECS rolling-update deployment type, minimumHealthyPercent/maximumPercent alone provide no automatic failure detection or rollback at all.',
      ]
    },
    {
      heading: 'The ECS deployment circuit breaker exists for exactly this — but it is NOT enabled by default',
      points: [
        'Per AWS\'s own documentation, the deployment circuit breaker is a separate mechanism, available on the standard ECS rolling-update deployment type (no CodeDeploy required), that detects when a deployment\'s tasks fail to reach a healthy, running state and can automatically roll the service back to its last known-good ("COMPLETED") deployment.',
        'Crucially, this is opt-in: it must be explicitly enabled via deploymentConfiguration.deploymentCircuitBreaker with both enable and rollback set to true. A service created without this configuration — including every example in the main page\'s own "ECS Task & Service" code tab — has no circuit breaker protection whatsoever; a deployment where every new task crashes on startup will simply sit there, unhealthy, with minimumHealthyPercent/maximumPercent governing pace but nothing detecting or reversing the failure.',
        'Detection works in two stages: first, the circuit breaker counts tasks that fail to reach the RUNNING state; once running, it then checks configured health checks (ELB, Cloud Map, or container health checks). By default, the failure count resets to zero every time a healthy task starts (resetOnHealthyTask: true) — only CONSECUTIVE failures count toward the threshold — and the default threshold (BOUNDED_PERCENT type, value 50) is clamped between a minimum of 3 and a maximum of 200 failures, calculated from the service\'s own desired task count.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A service with no circuit breaker — the main page\'s own gap',
      language: 'bash',
      code: `# The main page's own create-service example configures
# minimumHealthyPercent/maximumPercent (pace) but never touches
# deploymentCircuitBreaker at all -- reproducing that exact config:
aws ecs create-service \\
  --cluster production \\
  --service-name web-svc \\
  --task-definition web-app:2 \\
  --desired-count 4 \\
  --launch-type FARGATE \\
  --deployment-configuration 'minimumHealthyPercent=100,maximumPercent=200'

# Now push a BROKEN task definition revision (crashes on startup):
aws ecs update-service \\
  --cluster production \\
  --service web-svc \\
  --task-definition web-app:3 \\
  --force-new-deployment

aws ecs describe-services --cluster production --services web-svc \\
  --query 'services[0].deployments[].{status:status,running:runningCount,desired:desiredCount,rolloutState:rolloutState}'
# [
#   { "status": "PRIMARY", "running": 0, "desired": 4, "rolloutState": "IN_PROGRESS" },
#   { "status": "ACTIVE",  "running": 4, "desired": 4, "rolloutState": "COMPLETED" }
# ]
# -- the broken deployment just sits at rolloutState IN_PROGRESS,
# running: 0, indefinitely -- old tasks keep serving traffic (good),
# but NOTHING automatically detects the failure or rolls it back --
# an engineer has to notice and intervene manually.`,
    },
    {
      label: 'Enabling the circuit breaker — automatic detection and rollback',
      language: 'bash',
      code: `# Same service, but with the circuit breaker explicitly enabled --
# this is opt-in, not a default:
aws ecs create-service \\
  --cluster production \\
  --service-name web-svc-protected \\
  --task-definition web-app:2 \\
  --desired-count 4 \\
  --launch-type FARGATE \\
  --deployment-configuration 'minimumHealthyPercent=100,maximumPercent=200,deploymentCircuitBreaker={enable=true,rollback=true}'

# Push the same broken revision to THIS service:
aws ecs update-service \\
  --cluster production \\
  --service web-svc-protected \\
  --task-definition web-app:3 \\
  --force-new-deployment

# Poll deployment state -- tasks fail to reach RUNNING, the circuit
# breaker's own failure count climbs toward its threshold:
aws ecs describe-services --cluster production --services web-svc-protected \\
  --query 'services[0].deployments[].{status:status,rolloutState:rolloutState,reason:rolloutStateReason}'
# [
#   { "status": "PRIMARY", "rolloutState": "FAILED",
#     "reason": "ECS deployment circuit breaker: threshold reached." },
#   { "status": "ACTIVE",  "rolloutState": "IN_PROGRESS",
#     "reason": "ECS deployment circuit breaker: rolling back to deployment ..." }
# ]
# -- the broken deployment is marked FAILED automatically, and a
# rollback to the last COMPLETED deployment (web-app:2) starts on
# its own -- no manual intervention needed, and this happens on the
# STANDARD rolling-update deployment type, no CodeDeploy required.

# Custom threshold: 5 consecutive failures (COUNT type) instead of
# the default BOUNDED_PERCENT calculation:
aws ecs update-service --cluster production --service web-svc-protected \\
  --deployment-configuration 'deploymentCircuitBreaker={enable=true,rollback=true},thresholdConfiguration={type=COUNT,value=5}'`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team deploys a broken container image to an ECS service that uses standard rolling updates with minimumHealthyPercent=100 and maximumPercent=200 — matching the main page\'s own recommended configuration exactly. The new tasks crash-loop and never become healthy. The team expects the deployment to fail visibly and roll back on its own, but instead the service just sits with 0 running tasks in the new deployment while the old tasks keep serving traffic. Using this subtopic\'s theory, why didn\'t an automatic rollback happen, and what specifically would need to be added to the service\'s deployment configuration to get one?',
    hint: 'Do minimumHealthyPercent and maximumPercent, by themselves, include any failure-detection or rollback behavior — or do they only control the pace of a rolling update?',
    solution: 'No automatic rollback happened because minimumHealthyPercent and maximumPercent, by themselves, only control the PACE of a rolling deployment — how many old versus new tasks can run simultaneously — and include no failure-detection or rollback logic whatsoever. Per this subtopic\'s theory, that capability is a separate, opt-in mechanism: the ECS deployment circuit breaker, configured via deploymentConfiguration.deploymentCircuitBreaker with both enable and rollback set to true. Since the team\'s service configuration only set minimumHealthyPercent and maximumPercent (matching exactly what the main page\'s own create-service example shows), the circuit breaker was never enabled, so ECS had no mechanism to detect that the new tasks were failing to reach a healthy RUNNING state, and the broken deployment simply stayed stuck in progress indefinitely — old tasks were unaffected only because minimumHealthyPercent prevented them from being torn down before replacements were healthy, not because of any active failure detection. To get the automatic detection and rollback the team expected, they need to add deploymentCircuitBreaker={enable=true,rollback=true} to the service\'s own deployment configuration — at which point a future broken deployment would be marked FAILED once the circuit breaker\'s failure threshold is reached, and ECS would automatically start rolling the service back to its last COMPLETED deployment with no manual intervention required.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'minimumHealthyPercent and maximumPercent, correctly configured (as the main page\'s own examples show), are enough to guarantee a broken deployment gets automatically rolled back.',
      reality: 'Per this subtopic\'s theory, those two settings only control the PACE of a rolling deployment — how many old and new tasks can coexist — with no built-in failure detection or rollback behavior at all; that requires separately opting into the deployment circuit breaker.'
    },
    {
      thought: 'Automatic deployment rollback on ECS is only available through Blue/Green deployments via CodeDeploy, as the main page\'s own bullet describes.',
      reality: 'Per this subtopic\'s theory, the deployment circuit breaker provides automatic failure detection and rollback on the STANDARD ECS rolling-update deployment type — no CodeDeploy or Blue/Green setup required — it is simply a separate opt-in configuration on the same rolling-update service.'
    },
    {
      thought: 'The deployment circuit breaker is enabled by default on every new ECS service, since it\'s such a fundamental safety feature.',
      reality: 'Per this subtopic\'s theory, the circuit breaker is explicitly opt-in — a service created without deploymentCircuitBreaker={enable=true,rollback=true} in its deployment configuration has no automatic failure detection at all, exactly matching the main page\'s own create-service example, which never sets it.'
    }
  ];
}
