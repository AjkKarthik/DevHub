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
  templateUrl: './continueasnew-resets-history-and-discards-incomplete-tasks.html',
  styleUrl: './continueasnew-resets-history-and-discards-incomplete-tasks.scss'
})
export class ContinueasnewResetsHistoryAndDiscardsIncompleteTasksSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA explains HOW replay survives a host restart, but never what happens when an orchestrator needs to run forever',
      points: [
        'The main page\'s own QnA states: "Durable Functions uses \'event sourcing\': rather than keeping the orchestrator\'s progress in memory, every awaited step... is persisted as an event to Azure Storage... If the host restarts mid-orchestration, the orchestrator function is REPLAYED from the beginning against the persisted event history." This correctly explains how a FINITE orchestration recovers — but says nothing about what happens to that same replay mechanism if an orchestrator is designed to loop indefinitely.',
        'The main page\'s own theory only lists FINITE Durable Functions patterns — chaining, fan-out/fan-in, async HTTP, monitor, human approval — with no mention of an eternal/infinite-loop pattern at all.',
      ]
    },
    {
      heading: 'An orchestrator that loops forever needs continue-as-new specifically because the same replay mechanism that enables recovery also means history grows without bound — and calling it has real, easy-to-miss side effects',
      points: [
        'Per Microsoft\'s own documentation: "Without continue-as-new, an orchestrator that loops forever would accumulate orchestration history with every scheduled task, eventually causing performance problems and excessive memory use. The eternal orchestration pattern solves this by resetting the history on each iteration." This is the direct consequence of the main page\'s own replay mechanism: every additional loop iteration adds MORE events that must be replayed on every future recovery, so an orchestrator that never resets its history gets progressively slower to replay, forever.',
        'continue-as-new is not a "resume where you left off" call — it is a genuine reset: "When you call continue-as-new, the orchestration instance restarts itself with the new input value. The same instance ID is kept, but the orchestrator function\'s history resets." The instance ID survives (so callers polling its status URL don\'t need to change anything), but internally it is functionally a brand-new orchestration execution.',
        'A real, easy-to-miss gotcha: "The results of any incomplete tasks are discarded when an orchestration calls continue-as-new. For example, if a timer is scheduled and then continue-as-new is called before the timer fires, the timer event is discarded." Calling continue-as-new while an activity call or timer is still pending silently throws away that pending work — it does not carry forward or wait for it first.',
        'External event handling differs meaningfully by language, per Microsoft\'s own documentation: "In C#, ContinueAsNew preserves unprocessed events by default... In Python, continue_as_new doesn\'t preserve events unless save_events=True. In JavaScript, continueAsNew requires a saveEvents parameter (true or false)." A team porting orchestrator code between languages, or copying a pattern from a blog post in a different language, can silently lose queued external events if they don\'t check this default explicitly for their own runtime.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The eternal orchestration pattern (periodic cleanup, no overlap)',
      language: 'csharp',
      code: `[Function(nameof(PeriodicCleanupLoop))]
public static async Task RunAsync(
    [OrchestrationTrigger] TaskOrchestrationContext context)
{
    await context.CallActivityAsync("DoCleanup");

    // Sleep for one hour between cleanups
    DateTime nextCleanup = context.CurrentUtcDateTime.AddHours(1);
    await context.CreateTimer(nextCleanup, CancellationToken.None);

    // Reset history and restart with the same instance ID -- this
    // is what prevents the orchestrator's history from growing
    // unboundedly across thousands of future iterations
    context.ContinueAsNew(null);
}

// Per Microsoft's own docs, this beats a plain CRON TimerTrigger for
// this use case: "A CRON-based timer trigger runs at fixed times
// regardless of whether the previous run finished... An eternal
// orchestration waits for the work to complete before scheduling
// the next iteration, so runs never overlap." A CRON trigger firing
// every hour while a 90-minute cleanup job is still running would
// overlap; this pattern never does.`,
    },
    {
      label: 'The discarded-pending-task gotcha',
      language: 'csharp',
      code: `// WRONG -- calling ContinueAsNew while a timer is still pending
[Function(nameof(BuggyLoop))]
public static async Task RunAsync(
    [OrchestrationTrigger] TaskOrchestrationContext context)
{
    var cleanupTask = context.CallActivityAsync("DoCleanup");
    var reminderTimer = context.CreateTimer(
        context.CurrentUtcDateTime.AddMinutes(30), CancellationToken.None);

    // BUG: only awaiting the cleanup, not the timer, before resetting
    await cleanupTask;
    context.ContinueAsNew(null);
    // Per Microsoft's own docs: "The results of any incomplete tasks
    // are discarded when an orchestration calls continue-as-new...
    // if a timer is scheduled and then continue-as-new is called
    // before the timer fires, the timer event is discarded." The
    // 30-minute reminder silently never fires -- no error, no log,
    // it simply vanishes along with the reset history.
}

// CORRECT -- await every pending task/timer before resetting
[Function(nameof(FixedLoop))]
public static async Task RunAsync(
    [OrchestrationTrigger] TaskOrchestrationContext context)
{
    await context.CallActivityAsync("DoCleanup");
    await context.CreateTimer(
        context.CurrentUtcDateTime.AddMinutes(30), CancellationToken.None);
    context.ContinueAsNew(null);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own explanation of replay-based recovery, a developer designs an orchestrator meant to run forever, polling a status endpoint every few minutes and never calling ContinueAsNew — reasoning "the main page\'s own QnA says the orchestrator replays its history to recover, so a long history is exactly what gives us reliable recovery; resetting it seems like it would make recovery LESS reliable." Using this subtopic\'s theory, evaluate this reasoning.',
    hint: 'Per Microsoft\'s own documentation, is there a cost to a growing orchestration history that has nothing to do with the RELIABILITY of recovery — something about the mechanics of replay itself?',
    solution: 'Per this subtopic\'s theory, the developer\'s reasoning conflates two different things: reliability of recovery (which the main page\'s own QnA correctly describes as coming from the persisted event history) and the PERFORMANCE cost of that same mechanism as history grows. Microsoft\'s own documentation is explicit about the cost: "an orchestrator that loops forever would accumulate orchestration history with every scheduled task, eventually causing performance problems and excessive memory use." The recovery mechanism does not become MORE reliable with a longer history — every recovery still has to replay the ENTIRE history from the start, so a longer history means every future replay (whether triggered by a host restart, a scale-out event, or normal orchestration progress) takes longer and uses more memory, for no added reliability benefit. The correct design, per Microsoft\'s own eternal-orchestration pattern, is to call ContinueAsNew periodically — this keeps the same instance ID (so external callers and status polling are unaffected) while resetting the history that must be replayed, keeping replay fast indefinitely rather than growing unboundedly slower over the orchestration\'s lifetime.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An orchestrator function designed to run forever should simply loop internally without ever calling continue-as-new — replay-based recovery handles everything automatically regardless of history size.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states directly that an unbounded orchestrator "would accumulate orchestration history with every scheduled task, eventually causing performance problems and excessive memory use" — the eternal-orchestration pattern with continue-as-new exists specifically to prevent this.'
    },
    {
      thought: 'Calling continue-as-new pauses the orchestrator, lets any in-flight activities or timers finish, and then restarts with a clean history.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states the opposite: "The results of any incomplete tasks are discarded when an orchestration calls continue-as-new" — any pending timer or activity that hasn\'t completed yet is simply dropped, not waited for.'
    },
    {
      thought: 'continue-as-new behaves identically across every Durable Functions language runtime, including how it handles queued external events.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms real differences — C# preserves unprocessed external events by default, while Python requires an explicit save_events=True flag and JavaScript requires an explicit saveEvents parameter to get the same behavior.'
    }
  ];
}
