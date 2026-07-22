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
  templateUrl: './health-check-10-failures-never-all-removed.html',
  styleUrl: './health-check-10-failures-never-all-removed.scss'
})
export class HealthCheck10FailuresNeverAllRemovedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names the health check mechanism but never gives the actual threshold number, or says what happens if every instance fails at once',
      points: [
        'The main page\'s own theory states only: "Health Check: Configure a health check path (/health). App Service monitors it every minute — instances that fail N consecutive checks are removed from the load balancer rotation and replaced." The "N" is left completely unspecified.',
        'The main page\'s own QnA #6 already establishes an important, closely related fact — that some slot-level settings swap with content while others (autoscale, custom domains) stay bound to the slot position — but never mentions where the health check CONFIGURATION itself falls on that spectrum.',
      ]
    },
    {
      heading: 'The default is exactly 10 failed pings, App Service will never remove more than half the fleet at once, and it will never remove every instance',
      points: [
        'Per Microsoft\'s own documentation, the exact default is documented precisely: "WEBSITE_HEALTHCHECK_MAXPINGFAILURES | 2 - 10 | The number of failed requests required for an instance to be deemed unhealthy and removed from the load balancer... The default value is 10." An instance only gets pulled from rotation after 10 straight one-minute pings fail — nearly 10 minutes of continuous unhealthy responses, not a hair-trigger response to one bad request.',
        'A second, separate safety valve caps how much of the fleet can be pulled at once: "WEBSITE_HEALTHCHECK_MAXUNHEALTHYWORKERPERCENT... By default, to avoid overwhelming the remaining healthy instances, no more than half of the instances will be excluded from the load balancer at a time... In a scenario where all instances are unhealthy, none are excluded." Even a fleet-wide bad deployment cannot get 100% of instances pulled from rotation by this mechanism — the worst case with a partially-unhealthy fleet is 50% excluded, and a fully-unhealthy fleet gets 0% excluded.',
        'Microsoft\'s own FAQ confirms this is a deliberate design choice, not an edge case left unhandled: "What if all my instances are unhealthy? If all instances of your application are unhealthy, App Service doesn\'t remove instances from the load balancer. In this scenario, taking all unhealthy app instances out of the load balancer rotation would effectively cause an outage for your application." Health check optimizes for "some traffic reaching a possibly-broken app" over "guaranteed zero traffic reaching anything" — it will never single-handedly take a fleet fully offline.',
        'The genuinely surprising connection to the main page\'s own slot-swap theory: per Microsoft\'s own documentation, "Health check configuration isn\'t slot-specific, so after a swap, the Health check configuration of the swapped slot is applied to the destination slot, and vice-versa." This is the OPPOSITE of app settings unless marked slot-sticky — health check\'s path and threshold follow the SLOT POSITION (production vs. staging), the same way autoscale and custom domains do, not the app content being swapped in.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Configuring the default threshold explicitly',
      language: 'bash',
      code: `# Default behavior: 10 consecutive failed pings before removal --
# make this explicit, or lower it for faster reaction
az webapp config appsettings set \\
  --name my-webapp-unique \\
  --resource-group my-rg \\
  --settings WEBSITE_HEALTHCHECK_MAXPINGFAILURES=3

# Override the default 50% max-removal safety valve -- e.g. allow
# up to 80% of instances to be pulled if unhealthy (use cautiously)
az webapp config appsettings set \\
  --name my-webapp-unique \\
  --resource-group my-rg \\
  --settings WEBSITE_HEALTHCHECK_MAXUNHEALTHYWORKERPERCENT=80

# Per Microsoft's own docs, even with this override, a scenario
# where ALL instances are simultaneously unhealthy still results in
# NONE being excluded -- this specific protection cannot be
# disabled via app setting.`,
    },
    {
      label: 'Health check config follows the slot, not the app content',
      language: 'bash',
      code: `# Staging slot has health check enabled at /health-staging
az webapp deployment slot create --name my-webapp-unique \\
  --resource-group my-rg --slot staging
# (health check path configured via portal/ARM for the staging slot)

# Production slot has health check enabled at /health (different
# path, matching its own, different app content)

# After a swap:
az webapp deployment slot swap \\
  --name my-webapp-unique --resource-group my-rg \\
  --slot staging --target-slot production

# Per Microsoft's own docs: "Health check configuration isn't
# slot-specific, so after a swap, the Health check configuration of
# the swapped slot is applied to the destination slot, and
# vice-versa." Production now pings /health-staging (the OLD staging
# slot's path) against the NEW production content -- if that path
# doesn't exist in the new content, every instance starts failing
# health checks immediately after the swap.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team enables Health check on their staging slot at /staging-health while production uses /health. After a routine slot swap, they notice production instances are being flagged unhealthy and eventually replaced, even though the newly-promoted code is working fine when tested manually. Using this subtopic\'s theory and the main page\'s own slot-swap theory, explain what happened.',
    hint: 'Per Microsoft\'s own documentation, is the Health check PATH configuration considered app content that swaps with the deployment, or configuration that stays bound to the slot position — the same way autoscale rules and custom domains do?',
    solution: 'Per this subtopic\'s theory, the Health check path is bound to the SLOT POSITION, not the app content — Microsoft\'s own documentation states directly: "Health check configuration isn\'t slot-specific, so after a swap, the Health check configuration of the swapped slot is applied to the destination slot, and vice-versa." Before the swap, production was pinging /health (which existed in the OLD production content). After the swap, the PRODUCTION SLOT still pings whatever path was configured for it — but the team configured DIFFERENT paths per slot (/staging-health for staging, /health for production), and per the documented swap behavior, the health check configuration itself also gets exchanged along with which slot is "production." If the newly-promoted code (originally staging content) doesn\'t actually implement a /health endpoint (only /staging-health, which is what ITS slot was pinging before the swap), pings to /health now fail — 10 consecutive failures per the documented default trigger the instance-unhealthy/replacement cycle. This connects directly to the main page\'s own QnA about swap behavior: the fix is exactly what Microsoft recommends — using the SAME health check path and threshold configuration on both slots, so a swap never changes what path is actually being pinged.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'App Service removes an instance from the load balancer after just one or two failed health check pings.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states the default WEBSITE_HEALTHCHECK_MAXPINGFAILURES is 10 — an instance needs roughly 10 consecutive one-minute-interval failures (about 10 minutes of sustained unhealthy responses) before removal, though this is configurable down to a minimum of 2.'
    },
    {
      thought: 'If every instance in an App Service Plan is failing its health check simultaneously, App Service will remove all of them from the load balancer, causing a full outage.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states directly that App Service deliberately avoids this: "If all instances of your application are unhealthy, App Service doesn\'t remove instances from the load balancer" — because doing so "would effectively cause an outage." At most 50% of instances are excluded by default even in a partial-unhealthy scenario.'
    },
    {
      thought: 'Health check configuration (path, threshold) is app-specific and always follows the code during a deployment slot swap, the same as regular app settings would if not marked sticky.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states health check configuration "isn\'t slot-specific" and stays bound to the slot POSITION across a swap — the opposite of how ordinary, non-sticky app settings behave, and the same pattern autoscale rules and custom domains follow.'
    }
  ];
}
