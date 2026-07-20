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
  templateUrl: './continue-true-is-what-lets-a-second-route-also-fire.html',
  styleUrl: './continue-true-is-what-lets-a-second-route-also-fire.scss'
})
export class ContinueTrueIsWhatLetsASecondRouteAlsoFireSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own routing config has two routes matching the same label, with a one-word comment explaining the mechanism that makes both actually fire',
      points: [
        'The main page\'s own AlertManager routing config has two sibling routes both matching `severity: page`: the first sends to `pagerduty-critical` and includes `continue: true      # also send to Slack`; the second sends to `slack-critical`. The comment states the INTENT (also send to Slack) but never explains the MECHANISM that makes it necessary — without `continue: true`, would the second route even be reached at all?',
        'AlertManager\'s own documentation is direct about the default: "If continue is set to false, it stops after the first matching child. If continue is true on a matching node, the alert will continue matching against subsequent siblings." The default, unset behavior is `continue: false` — meaning routing evaluation STOPS the instant the first matching route is found.',
      ]
    },
    {
      heading: 'Without continue: true on the first route, the second route is silently unreachable for this alert',
      points: [
        'Applying AlertManager\'s own default behavior to the main page\'s own two routes: for a `severity: page` alert, AlertManager checks routes top-to-bottom and finds the FIRST one matches (`pagerduty-critical`). Per AlertManager\'s own docs, without `continue: true` on that first matching route, evaluation stops right there — the second route (`slack-critical`), even though it also matches `severity: page`, is never even evaluated. Only PagerDuty would receive the notification; Slack would not.',
        'The `continue: true` on the FIRST route is specifically what keeps evaluation going PAST that match, letting AlertManager also check (and match) the second `severity: page` route. This is why the comment sits on the first route specifically, not the second — the second route doesn\'t need its own `continue: true` unless there were a THIRD sibling route intended to also fire after it.',
        'This is easy to get backwards when adapting the pattern: a team adding a third route (say, for a webhook integration) after the two shown, also matching `severity: page`, would need to ALSO add `continue: true` to the SECOND route (`slack-critical`) — not just the first — since each route in the chain needs its own `continue: true` to pass evaluation along to the next sibling, and the chain breaks at whichever route in the sequence is missing it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without continue: true -- Slack never gets a chance to match',
      language: 'bash',
      code: `# Hypothetical: the main page's own two routes, WITHOUT continue:
# routes:
#   - match: { severity: page }
#     receiver: pagerduty-critical
#     # no continue: true here
#   - match: { severity: page }
#     receiver: slack-critical

# A P1 alert with severity: page fires.
#
# AlertManager checks routes top-to-bottom:
# 1. First route matches (severity: page) -> receiver: pagerduty-critical
# 2. Per AlertManager's own docs, "it stops after the first matching
#    child" (continue defaults to false) -- evaluation STOPS here.
# 3. The second route is never even CHECKED, let alone matched.
#
# Result: PagerDuty gets notified. Slack does NOT -- even though
# the second route's own match condition (severity: page) would
# have matched this exact alert, if AlertManager had ever reached
# it. The team's own stated goal ("also send to Slack") silently
# fails, with no error anywhere -- the config is valid YAML, it
# just doesn't do what the comment says it should.`,
    },
    {
      label: 'The main page\'s own actual config -- continue: true keeps evaluation going',
      language: 'bash',
      code: `# The main page's own exact routes:
# routes:
#   - match: { severity: page }
#     receiver: pagerduty-critical
#     continue: true      # also send to Slack
#   - match: { severity: page }
#     receiver: slack-critical

# Same P1 alert, severity: page.
#
# 1. First route matches -> receiver: pagerduty-critical
# 2. Per AlertManager's own docs, "If continue is true on a
#    matching node, the alert will continue matching against
#    subsequent siblings" -- evaluation CONTINUES past this match.
# 3. Second route is now checked -- it ALSO matches severity: page
#    -> receiver: slack-critical.
#
# Result: both PagerDuty AND Slack receive the notification, per
# the comment's stated intent -- but only because continue: true
# is present on the FIRST route specifically. Removing that one
# word silently breaks the Slack half of the notification, with
# the config remaining perfectly valid and the pipeline reporting
# no errors at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team, following the main page\'s own pattern, adds a THIRD route after the existing two — also matching `severity: page` — to send P1 alerts to a webhook integration as well. They copy the two existing routes exactly (keeping `continue: true` only on the first route, none on the second) and add the third route below. After deploying, PagerDuty and Slack both still work, but the webhook never receives anything. Using this subtopic\'s theory, explain why.',
    hint: 'Per this subtopic\'s theory, does continue: true on ONE route in a chain automatically propagate to every route after it, or does each route need its own?',
    solution: 'The webhook route never fires because, per this subtopic\'s theory, `continue: true` only affects whether evaluation proceeds PAST the specific route it\'s set on — it doesn\'t apply retroactively or propagate automatically to every subsequent sibling in the chain. The first route (`pagerduty-critical`) has `continue: true`, so evaluation correctly proceeds to check the second route. But the second route (`slack-critical`) has no `continue: true` of its own — per AlertManager\'s own docs, "it stops after the first matching child" whenever continue is unset (false), so once the second route matches and fires the Slack notification, evaluation stops there, exactly as it would with only two routes. The third, newly-added webhook route is never reached at all, for the same underlying reason the original two-route setup would have failed without any `continue: true` at all. The fix is adding `continue: true` to the SECOND route as well, so evaluation passes through both the first and second matches before finally reaching the third.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'continue: true is a general "keep processing this alert" flag — once set anywhere in a routing chain, it ensures every subsequent matching route also fires for that alert.',
      reality: 'Per this subtopic\'s theory, AlertManager\'s own docs describe continue as a PER-ROUTE setting that only controls whether evaluation proceeds past THAT SPECIFIC route\'s own match. Each route in a chain needs its own continue: true to pass evaluation to the next one — it does not propagate automatically.'
    },
    {
      thought: 'AlertManager checks every route that matches an alert\'s labels by default, sending notifications through all of them — continue: true is just an optional extra, not something load-bearing.',
      reality: 'This subtopic\'s first code example shows the opposite is the actual default — per AlertManager\'s own docs, "it stops after the first matching child" unless continue: true is explicitly set. Without it, the main page\'s own two-route Slack+PagerDuty setup would silently only ever notify PagerDuty.'
    },
    {
      thought: 'If a route\'s notification silently stops working after adding a new sibling route, the most likely cause is a YAML syntax error or a receiver misconfiguration.',
      reality: 'Per this subtopic\'s exercise, a perfectly valid, correctly-configured new route can still never fire if an EARLIER route in the same chain is missing its own continue: true — the config has no syntax error and every individual receiver is correctly defined, the routing chain itself is just broken at a specific link.'
    }
  ];
}
