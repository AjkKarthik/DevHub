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
  templateUrl: './request-based-and-time-based-error-budgets-arent-the-same-thing.html',
  styleUrl: './request-based-and-time-based-error-budgets-arent-the-same-thing.scss'
})
export class RequestBasedAndTimeBasedErrorBudgetsArentTheSameThingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A QnA that presented two different measurements as if they were one number stated two ways',
      points: [
        'The main page\'s error budget QnA originally said: "If the SLO is 99.9% availability, the error budget is 0.1% of requests allowed to fail, OR about 8.7 hours of downtime per year" — phrased as though these are simply two equivalent ways of expressing the same budget. Checking this against Google\'s own SRE book reveals they are genuinely different measurement METHODOLOGIES, not just different units for the same fact. The page has been corrected.',
        'This distinction matters because the two methodologies can disagree substantially on the SAME real incident pattern, not just round differently.',
      ]
    },
    {
      heading: 'What each methodology actually measures',
      points: [
        'A TIME-based availability measure asks: for what fraction of calendar time was the service considered "up" (however that\'s defined)? A 99.9% time-based SLO permits about 8.7 hours of continuous or accumulated "down" time per year.',
        'A REQUEST-based availability measure asks a different question: what fraction of INDIVIDUAL REQUESTS succeeded? Google\'s own SRE book explicitly identifies this as its preferred approach — for a 99.9% SLO, that\'s a budget of failing up to 0.1% of all requests received, however those failures are distributed across the year.',
        'The two only produce the SAME number under a specific simplifying assumption: that "down" means literally ZERO successful requests during that window, and that outside "down" windows, literally 100% of requests succeed. Real systems rarely behave this cleanly.',
      ]
    },
    {
      heading: 'A concrete scenario where the two measures diverge sharply',
      points: [
        'Consider a service that never has a full outage (uptime, by a time-based measure, is 100% all year) but has a persistent 0.5% background error rate from flaky downstream calls, retries, and edge-case bugs, spread evenly across every day. A time-based SLO would call this service perfectly available all year — it was never "down." A request-based SLO at 99.9% (0.1% budget) would show this service blowing through its ENTIRE annual error budget in the first ~2.4 months, then continuing to violate it for the rest of the year.',
        'The reverse can also happen: a service that has one clean, complete 4-hour outage (fails 100% of requests for those 4 hours, succeeds 100% otherwise) uses up roughly half its annual TIME-based budget for a 99.9% SLO (8.7 hrs/yr) in that single incident, but a request-based measure over the SAME incident, averaged across the full year\'s request volume, might show a smaller percentage-of-requests-failed figure than 4 hours of 100% time-based downtime would suggest, depending on how much of the year\'s total traffic happened to fall inside that 4-hour window.',
        'Google\'s SRE book explicitly favors the request-based approach specifically because it reflects actual USER impact more directly than a binary up/down clock — it captures partial degradation (the first scenario) that a time-based measure completely misses.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Same SLO, two different budget calculations',
      language: 'typescript',
      code: `interface ErrorBudgetMethod {
  method: 'time-based' | 'request-based';
  whatItMeasures: string;
  exampleForA999Slo: string;
}

const methods: ErrorBudgetMethod[] = [
  {
    method: 'time-based',
    whatItMeasures:
      'Fraction of calendar time the service is considered "up."',
    exampleForA999Slo: '~8.7 hours of downtime allowed per year.',
  },
  {
    method: 'request-based',
    whatItMeasures:
      'Fraction of individual requests that succeed, regardless ' +
      'of how failures are distributed across time.',
    exampleForA999Slo: '0.1% of all requests allowed to fail per year.',
  },
];

// Scenario: a service with a persistent 0.5% background error
// rate, never fully "down."
const timeBasedVerdict = '100% available all year -- never down.';
const requestBasedVerdict =
  'Blows the entire annual 0.1% budget in ~2.4 months, then keeps ' +
  'violating it -- the SAME incident pattern, two different verdicts.';

// This is exactly why Google's SRE book favors request-based
// measurement: it is sensitive to partial degradation that a
// binary up/down time-based clock completely misses.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A service has a 99.9% availability SLO. Over the past year, it has never had a full outage (every hour of the year shows at least SOME successful requests), but a chronic 0.3% error rate has persisted the entire time due to an unfixed edge-case bug. Using a TIME-based measure, is this service within its error budget? Using a REQUEST-based measure, is it?',
    hint: 'Does a time-based measure care about a 0.3% error rate that never adds up to a full "outage," and does a request-based measure care about the same thing?',
    solution: 'By a TIME-based measure, this service is comfortably within its error budget — since it was never fully "down" for any window of time, its time-based downtime is effectively 0 out of the allowed 8.7 hours/year. By a REQUEST-based measure, this service has been VIOLATING its 99.9% SLO the entire time — a persistent 0.3% error rate is 3x the 0.1% budget a 99.9% SLO allows, meaning it has been burning through its budget every single day. This is exactly the divergence the two methodologies produce: a chronic, low-level problem that a time-based clock cannot see at all is fully visible (and clearly over-budget) to a request-based measure — which is why Google\'s SRE book treats request-based measurement as the more informative default.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"0.1% of requests allowed to fail" and "8.7 hours of downtime per year" are just two different units for expressing the exact same 99.9% error budget.',
      reality: 'Per this subtopic\'s theory, these are two genuinely different measurement methodologies (request-based vs. time-based) that only produce the same number under the simplifying assumption that "down" means zero successful requests and "up" means 100% successful requests — real systems with partial degradation break this assumption.'
    },
    {
      thought: 'A service that has never had a full outage is automatically within its error budget, regardless of how the budget is measured.',
      reality: 'Per this subtopic\'s theory, a chronic low-level error rate can fully exhaust a REQUEST-based error budget while showing zero downtime on a TIME-based measure — "never fully down" and "within budget" are not the same claim once request-based measurement is in play.'
    },
    {
      thought: 'Google\'s SRE book treats time-based and request-based availability as equally good, interchangeable measurement choices.',
      reality: 'Per this subtopic\'s theory, Google\'s SRE book explicitly favors the request-based approach as its preferred methodology, specifically because it captures partial-degradation scenarios that a binary time-based up/down measure misses entirely.'
    }
  ];
}
