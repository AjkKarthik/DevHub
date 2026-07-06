import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-masstransit-retry-multiply-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './usemessageretry-and-usedelayedredelivery-multiply-not-add.html',
  styleUrl: './usemessageretry-and-usedelayedredelivery-multiply-not-add.scss',
})
export class UsemessageretryAndUsedelayedredeliveryMultiplyNotAddSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Redelivery Restarts the FULL Immediate-Retry Cycle, It Doesn\'t Continue It',
      points: [
        'The main page\'s own "Retry Policy" tab stacks both e.UseMessageRetry(r => r.Intervals(1s, 5s, 15s)) AND e.UseDelayedRedelivery(r => r.Intervals(5m, 30m, 1h)) on the SAME receive endpoint, describing them as "immediate retries" and "exponential backoff redelivery" as if they were simply two independent numbers. In practice they compose: once the 3 immediate retries in UseMessageRetry are exhausted, UseDelayedRedelivery schedules the message to be REDELIVERED as a brand-new delivery attempt — and that redelivered attempt runs through the ENTIRE immediate-retry cycle again from the start, not a continuation of it.',
        'This means the main page\'s own example doesn\'t produce "3 plus 3" attempts — it produces up to 1 (original) + 3 (immediate retries) = 4 attempts, THEN a redelivery which itself gets its own 4 attempts (1 + 3 retries), repeated for each of the 3 redelivery intervals configured. Total: 4 delivery rounds (the original + 3 redeliveries) × 4 attempts each = up to 16 total attempts before the message finally lands in the error queue — far more than either number alone suggests.',
      ],
    },
    {
      heading: 'Why This Matters for Choosing Interval Values',
      points: [
        'A team tuning "3 immediate retries" and "3 redelivery rounds" independently, each against its own worst-case scenario, can accidentally end up with a MUCH longer total time-to-error-queue than intended — in the main page\'s own numbers, the LAST redelivery round alone waits 1 hour before even STARTING its own 3 immediate retries (1s + 5s + 15s more), meaning a message that is genuinely unprocessable could sit for well over 2 hours across all rounds combined before reaching the error queue for manual investigation.',
        'When setting these values, calculate the WORST-CASE total time and total attempt count as the PRODUCT of the two configured cycles, not their sum — and consider whether letting a permanently-broken message occupy that much processing time before alerting a human is actually the intended behavior.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own stacked configuration',
      language: 'csharp',
      code: `cfg.ReceiveEndpoint("order-placed", e =>
{
    // 1 original attempt + 3 immediate retries = 4 attempts per delivery round
    e.UseMessageRetry(r => r.Intervals(
        TimeSpan.FromSeconds(1),
        TimeSpan.FromSeconds(5),
        TimeSpan.FromSeconds(15)));

    // Each of these 3 redelivery rounds RESTARTS the full 4-attempt
    // cycle above — it does not continue counting from attempt 4.
    e.UseDelayedRedelivery(r => r.Intervals(
        TimeSpan.FromMinutes(5),
        TimeSpan.FromMinutes(30),
        TimeSpan.FromHours(1)));

    e.ConfigureConsumer<OrderPlacedConsumer>(ctx);
});
// Total delivery rounds: 1 original + 3 redeliveries = 4 rounds.
// Total attempts across all rounds: 4 rounds x 4 attempts = up to 16.`,
    },
    {
      label: 'Test proving the consumer is invoked far more than 3 or 6 times',
      language: 'csharp',
      code: `[Fact]
public async Task Failing_Consumer_Is_Retried_Far_More_Than_Either_Policy_Number_Suggests()
{
    var attemptCount = 0;

    await using var provider = new ServiceCollection()
        .AddMassTransitTestHarness(x =>
        {
            x.AddConsumer<AlwaysFailingConsumer>();
            x.UsingInMemory((ctx, cfg) =>
            {
                cfg.ReceiveEndpoint("test-queue", e =>
                {
                    e.UseMessageRetry(r => r.Immediate(3));       // 1 + 3 = 4 per round
                    e.UseDelayedRedelivery(r => r.Intervals(
                        TimeSpan.FromMilliseconds(50),
                        TimeSpan.FromMilliseconds(50)));            // 2 redelivery rounds
                    e.ConfigureConsumer<AlwaysFailingConsumer>(ctx);
                });
            });
        })
        .AddSingleton(new Action(() => Interlocked.Increment(ref attemptCount)))
        .BuildServiceProvider(true);

    var harness = provider.GetRequiredService<ITestHarness>();
    await harness.Start();

    await provider.GetRequiredService<IPublishEndpoint>().Publish(new AlwaysFails());

    await Task.Delay(TimeSpan.FromSeconds(2));   // allow redelivery rounds to complete

    // 3 delivery rounds (1 original + 2 redeliveries) x 4 attempts each
    // = up to 12 — not 3, not 5 (3+2), and not 6.
    Assert.True(attemptCount > 6);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Using the "4 rounds x 4 attempts" model above, a team wants a HARD ceiling of no more than 8 total attempts before a message reaches the error queue. Given they want to keep the 3-interval UseMessageRetry policy unchanged, how many UseDelayedRedelivery intervals can they configure, and why?',
    hint: 'Each delivery round (original + each redelivery) contributes exactly 4 attempts (1 + 3 immediate retries), since UseMessageRetry is unchanged. Total attempts = number of rounds × 4.',
    solution: `With UseMessageRetry unchanged at 3 intervals, every delivery round
(the original attempt plus each redelivery) contributes exactly 4
attempts (1 original + 3 immediate retries). To stay at or under 8
total attempts, the total number of ROUNDS must be at most 2 — meaning
only 1 redelivery round is allowed (1 original round + 1 redelivery
round = 2 rounds x 4 attempts = 8 total).

That means UseDelayedRedelivery can only configure a SINGLE interval,
not the main page's own three (5m, 30m, 1h) — e.g.
e.UseDelayedRedelivery(r => r.Intervals(TimeSpan.FromMinutes(5))).
Configuring even a second redelivery interval would push the total to
3 rounds x 4 attempts = 12, already exceeding the 8-attempt ceiling.
This is exactly the calculation the main page's own stacked example
never walks through — the two policies must be sized TOGETHER as a
product, not independently against separate worst-case assumptions.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'stacking UseMessageRetry(3 intervals) and UseDelayedRedelivery(3 intervals) on the same endpoint produces 3 + 3 = 6 total attempts before a message reaches the error queue.',
      reality: 'each redelivery round restarts the FULL immediate-retry cycle from the beginning — the two numbers multiply, not add. 3 immediate retries per round, across 1 original round plus 3 redelivery rounds, produces up to 4 x 4 = 16 total attempts.',
    },
    {
      thought: 'UseDelayedRedelivery continues counting retry attempts from where UseMessageRetry left off — e.g. attempt 4, 5, 6 after the first 3 immediate retries.',
      reality: 'each redelivery is treated as a brand-new delivery — it restarts UseMessageRetry\'s ENTIRE interval sequence from the first interval again, not a continuation of the attempt count.',
    },
    {
      thought: 'the total time before a permanently-broken message reaches the error queue is roughly the sum of all configured intervals across both policies.',
      reality: 'because redelivery restarts the full retry cycle each time, the total worst-case time is the redelivery intervals PLUS the full immediate-retry cycle repeated after each one — often dramatically longer than adding the interval values alone would suggest.',
    },
  ];
}
