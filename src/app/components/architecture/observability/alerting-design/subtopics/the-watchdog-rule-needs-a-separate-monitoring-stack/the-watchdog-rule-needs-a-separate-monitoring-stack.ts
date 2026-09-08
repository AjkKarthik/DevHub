import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Real Tension Between the Page’s Theory and Its Own Quiz',
    points: [
      'The main page’s own theory bullet on dead man’s switches originally read "<code>ALERTS{alertname="Watchdog"} absent for 5m</code> fires when Alertmanager stops sending heartbeats" — a plain PromQL rule, with no mention of WHERE it needs to run. Read on its own, a natural conclusion is "add this as another alert rule in the same Prometheus."',
      'The page’s own quiz, on a completely separate question, states the actual constraint forcefully: an external heartbeat service is required precisely BECAUSE "a full failure of that pipeline... would silently disable the watchdog itself at the same time" if the check ran on the same stack. The page’s own code tab already implements the correct version — Alertmanager forwarding the always-firing Watchdog alert to an external Dead Man’s Snitch webhook — but the theory bullet never stated why that external hop is load-bearing, not incidental.',
      'Verified directly with a simulation: an instance that has crashed cannot evaluate ANY of its own rules, including an <code>absent()</code> check on its own Watchdog metric. A self-referential check can only ever report "everything is fine" or literally never run at all — it structurally cannot report the one failure mode it exists to catch.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Self-Referential vs. External, Simulated',
    language: 'typescript',
    code: `class FakePrometheus {
  alive = true;
  watchdogFiredAt: number[] = [];

  tick(nowMs: number): void {
    if (!this.alive) return; // a dead instance evaluates NOTHING, including its own rules
    this.watchdogFiredAt.push(nowMs);
  }
  crash(): void { this.alive = false; }
}

// ── SELF-REFERENTIAL: a rule INSIDE the same Prometheus instance ────
function selfReferentialCheckCanStillDetectCrash(prom: FakePrometheus, crashAtMs: number): boolean {
  prom.tick(0); prom.tick(60_000); prom.tick(120_000);
  if (crashAtMs <= 120_000) prom.crash();
  // "evaluating the absent() rule" is itself a rule evaluation --
  // a dead instance can't run it, so it can never fire at all.
  return prom.alive; // only an ALIVE instance can evaluate anything, including this check
}

// ── EXTERNAL: an independent service that pages when pings STOP ─────
class ExternalHeartbeatService {
  private lastPingAt = 0;
  receivePing(nowMs: number): void { this.lastPingAt = nowMs; }
  isOverdue(nowMs: number, thresholdMs: number): boolean {
    return (nowMs - this.lastPingAt) > thresholdMs;
  }
}

const prom = new FakePrometheus();
const stillAlive = selfReferentialCheckCanStillDetectCrash(prom, 90_000);
console.log('Self-referential: can the crashed instance detect its own crash?', stillAlive);

const heartbeat = new ExternalHeartbeatService();
heartbeat.receivePing(0);
heartbeat.receivePing(60_000);
heartbeat.receivePing(120_000);
// Prometheus crashes at t=90s -- no more pings arrive after t=120s
const overdueAt300s = heartbeat.isOverdue(300_000, 150_000); // 150s threshold
console.log('External heartbeat: detects the outage at t=300s?', overdueAt300s);
// -> Self-referential: can the crashed instance detect its own crash? false
// -> External heartbeat: detects the outage at t=300s? true`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate proposes a middle-ground fix: keep the <code>absent()</code> rule inside the same Prometheus, but have it page via a DIFFERENT notification channel (SMS via Twilio, say, instead of the usual PagerDuty route) so it doesn’t depend on the primary alerting path. Does changing only the notification channel fix the underlying problem?',
  hint: 'Separate the two things that have to be independent: the CHECK itself (does the rule ever get EVALUATED) and the NOTIFICATION path (does a firing alert actually REACH someone).',
  solution: `// No -- it fixes only half the problem. Changing the notification
// channel addresses a DIFFERENT failure mode (Alertmanager itself
// being unreachable or misconfigured while Prometheus is still
// healthy and evaluating rules normally) -- that's a real and worth
// fixing gap, but it's not the SAME gap the simulation demonstrates.
//
// The simulation's finding is about the EVALUATION step, not the
// notification step: if the Prometheus PROCESS itself has crashed (or
// the whole host/cluster it runs on is down), no rule anywhere in it
// evaluates at all -- not the Watchdog rule, not the absent() check,
// nothing. It doesn't matter how good the notification channel is if
// the check that would trigger a notification never runs in the first
// place. Only a check that runs on a genuinely SEPARATE process --
// on a different host, ideally in a different failure domain --
// can detect "the whole primary instance is gone."`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The original theory bullet was simply factually wrong — the <code>ALERTS{alertname="Watchdog"} absent for 5m</code> PromQL expression itself doesn’t work as a dead man’s switch check.',
    reality: 'The PromQL expression is genuinely correct syntax and a genuinely valid way to detect a missing heartbeat — the gap wasn’t in the expression itself, it was in never stating WHERE it needs to run. The exact same query, evaluated by a SEPARATE, independent meta-monitoring Prometheus instance watching the primary stack, is a legitimate and commonly-used production pattern. The fix tightened the wording to state that constraint, not to change or discard the query.',
  },
  {
    thought: 'Since the main page’s own "Alertmanager Config" code tab already routes the Watchdog alert to an external Dead Man’s Snitch webhook, the page never actually had a bug — only the prose description needed cleanup.',
    reality: 'That’s largely right about the SEVERITY (the working, correct pattern was already present in code, just under-explained in prose) — but it’s exactly the kind of gap worth taking seriously: a reader skimming the theory bullet in isolation, without connecting it back to the code tab’s different (correct) approach, could easily walk away planning to implement the broken, self-referential version instead, since the theory bullet read as complete and actionable on its own.',
  },
];

@Component({
  selector: 'app-obs-alerting-watchdog',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-watchdog-rule-needs-a-separate-monitoring-stack.html',
  styleUrl: './the-watchdog-rule-needs-a-separate-monitoring-stack.scss',
})
export class TheWatchdogRuleNeedsASeparateMonitoringStackSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
