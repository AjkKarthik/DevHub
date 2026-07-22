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
  templateUrl: './auto-heal-conditions-and-actions.html',
  styleUrl: './auto-heal-conditions-and-actions.scss'
})
export class AutoHealConditionsAndActionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Diagnostic Logs theory covers observing problems — but never a feature that automatically reacts to them',
      points: [
        'The main page\'s own "Scaling, Configuration & Diagnostics" theory covers Health Check (removing bad instances) and Diagnostic Logs (streaming logs for manual investigation) — two DIFFERENT mechanisms, both reactive-to-symptom or purely observational. Neither one lets an app recover itself from a specific, recognized bad state without being removed from rotation entirely.',
        'This leaves a real gap: what if an app is technically still passing Health Check (still returning 2xx) but is internally stuck — a memory leak climbing toward the limit, or a specific endpoint hanging on every request? Health check alone would not catch this until the app stops responding entirely.',
      ]
    },
    {
      heading: 'Auto-Heal is a distinct, rule-based self-recovery feature — four conditions, three action types, and it exists specifically as a temporary mitigation while you find the real root cause',
      points: [
        'Per Microsoft\'s own documentation: "Auto-healing is a mitigation action that you can take when your app has unexpected behavior. You can set your own rules based on request count, slow request, memory limit, and HTTP status code to trigger mitigation actions. Use the tool to temporarily mitigate an unexpected behavior until you find the root cause." This is explicitly framed as a stopgap, not a permanent fix — the same underlying condition should still be investigated and resolved.',
        'The four supported trigger conditions, per Microsoft\'s own documentation, monitor specific, narrow symptoms: Request Duration (examines slow requests), Memory Limit (examines process memory in private bytes), Request Count (examines number of requests), and Status Codes (examines number of requests and their HTTP status code) — each can be configured with its own threshold and time window.',
        'The available mitigation actions go beyond a simple restart: Recycle Process (the most common action — restarts the worker process, resolving most transient issues without a full instance replacement), Log an Event (writes to the Windows Event Log for tracking how often Auto-Heal fires, with no disruptive action taken), and a Custom Action option that can run a specified executable or diagnostic collection.',
        'Auto-Heal is a genuinely separate mechanism from Health Check, not an alternate configuration of it — Health Check operates at the LOAD BALANCER level (removing/replacing whole instances based on external HTTP pings), while Auto-Heal operates at the WORKER PROCESS level (recycling the process in place, based on internally-observed conditions) — an app can trigger Auto-Heal rules while still passing Health Check the entire time, since a process recycle can resolve the underlying issue before it ever causes enough consecutive failed pings to trip Health Check\'s own removal threshold.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A Memory Limit Auto-Heal rule (conceptual configuration)',
      language: 'bash',
      code: `# Auto-Heal is configured via the Azure Portal (Diagnose and
# solve problems > Diagnostic Tools > Auto Healing) or via web.config
# for Windows apps -- the underlying rule triggers on private-bytes
# memory usage crossing a threshold:

# Condition: Memory Limit
#   Private Bytes > 1000 MB
# Action: Recycle Process
#   -- when the worker process's private memory exceeds 1000 MB,
#      Auto-Heal recycles (restarts) that specific worker process,
#      resetting memory usage, WITHOUT removing the instance from
#      the load balancer rotation the way Health Check would.

# This catches a slow memory leak long before it would ever cause
# Health Check's own 10-consecutive-failure threshold to trip --
# the app may still be responding successfully to every request
# while consuming steadily more memory in the background.`,
    },
    {
      label: 'A Request Duration rule with diagnostic collection',
      language: 'bash',
      code: `# Condition: Request Duration
#   Requests taking longer than 00:00:30 (30 seconds)
#   Count threshold: 5 requests
#   Time window: 00:02:00 (2 minutes)
# Action: Custom Action -- Run Diagnostics
#   -- collects a memory dump / diagnostic trace BEFORE recycling,
#      giving you data to investigate the root cause after the fact,
#      rather than just making the symptom disappear silently

# Compare to a simpler rule using Log an Event only -- useful for
# understanding HOW OFTEN a condition is being hit before committing
# to an automatic recycle action:
# Condition: Status Codes
#   HTTP 500 responses > 10 in 5 minutes
# Action: Log an Event
#   -- writes to the Windows Event Log, takes no disruptive action,
#      lets you gather frequency data first`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team notices their App Service app occasionally becomes extremely slow to respond (though it never actually returns an error status code) for a few minutes at a time, then recovers on its own after a restart triggered manually. They ask: "our Health Check is enabled and passing the whole time — why didn\'t it catch this and replace the bad instance automatically?" Using this subtopic\'s theory, explain why Health Check alone wouldn\'t catch this, and what feature would.',
    hint: 'Per Microsoft\'s own documentation, does Health Check monitor RESPONSE TIME or MEMORY USAGE, or only the HTTP status code of the response?',
    solution: 'Per this subtopic\'s theory, Health Check would not catch this because it only evaluates whether a ping to the configured path returns a status code between 200 and 299 within its timeout — it has no concept of "slow but technically successful." As long as the app eventually returns a 2xx response, Health Check considers the instance healthy, regardless of how long the response took or how much memory the process is using in the background. The feature built specifically for this gap is Auto-Heal, per Microsoft\'s own documentation: "You can set your own rules based on request count, slow request, memory limit, and HTTP status code to trigger mitigation actions." A Request Duration condition (e.g. "requests taking longer than 30 seconds") or a Memory Limit condition could be configured to automatically trigger a Recycle Process action — restarting the worker process in place the moment the slow-response or high-memory pattern is detected, rather than waiting for a manual restart or for the symptom to eventually cause enough consecutive Health Check failures to trip that separate mechanism.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Health Check and Auto-Heal are two names for the same App Service reliability feature, just configured differently.',
      reality: 'Per this subtopic\'s theory, these are genuinely separate mechanisms — Health Check operates at the load balancer level using external HTTP pings and status codes only, while Auto-Heal operates at the worker process level using internally-observed conditions (memory, request duration, request count, status codes) and can recycle a process without ever removing the instance from rotation.'
    },
    {
      thought: 'Auto-Heal is meant to be a permanent, set-and-forget fix for an app\'s reliability problems.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation frames it explicitly as temporary: "Use the tool to temporarily mitigate an unexpected behavior until you find the root cause" — the underlying issue still needs to be diagnosed and fixed, not just repeatedly auto-recycled around.'
    },
    {
      thought: 'The only action Auto-Heal can take is restarting the app.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation lists three distinct action types — Recycle Process (the restart action), Log an Event (a non-disruptive logging-only action for gathering frequency data), and Custom Action (which can run diagnostic collection or a specified executable before or instead of recycling).'
    }
  ];
}
