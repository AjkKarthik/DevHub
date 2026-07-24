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
  templateUrl: './logrotates-copytruncate-has-a-real-data-loss-race-window.html',
  styleUrl: './logrotates-copytruncate-has-a-real-data-loss-race-window.scss'
})
export class LogrotatesCopytruncateHasARealDataLossRaceWindowSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page only shows the signal-based (postrotate) approach, never mentioning the alternative or its tradeoff',
      points: [
        'The main page\'s own logrotate example uses the standard rename-based rotation with a <code>postrotate</code> block sending <code>kill -USR1</code> to tell the application to reopen its log file — a completely safe, no-data-loss approach, but one that REQUIRES the application to actually support reopening log files on a signal. Nothing on the page mentions <code>copytruncate</code>, logrotate\'s OTHER rotation mode, built specifically for applications that don\'t support this.',
      ]
    },
    {
      heading: 'What copytruncate does differently, and the real race condition it introduces',
      points: [
        '<code>copytruncate</code> exists for exactly the case the main page\'s own <code>postrotate</code> example assumes away: an application with no signal-handling hook to reopen its log file. Instead of renaming the log and creating a new empty file (which would orphan the application\'s existing open file handle, pointing at the now-renamed file), copytruncate COPIES the current log\'s contents to the rotated filename, then truncates the ORIGINAL file in place — the application keeps writing to the exact same, still-open file descriptor throughout, with no reopen needed at all.',
        'This convenience comes with a real, officially documented cost: there is a small but genuine window of time between the COPY step and the TRUNCATE step during which the application can keep writing new log lines to the original file — those lines get copied into neither the rotated file (the copy already happened) nor survive the truncate (which wipes them along with everything else in the original). This is not a hypothetical edge case; the logrotate man page itself explicitly documents it: "some logging data may be lost."',
      ]
    },
    {
      heading: 'When this tradeoff actually matters, and the alternatives',
      points: [
        'The practical severity scales directly with write volume — a lightly-written log has a vanishingly small chance of losing a line in that brief window, while a high-throughput log (one real-world test cited in logrotate\'s own community discussions lost 4 million lines during a single rotation under sustained heavy write load) can lose a genuinely significant amount of data on every single rotation.',
        'Because of this, <code>copytruncate</code> should be treated as a fallback for applications that truly cannot reopen their log file on a signal — not a default choice. Whenever the application DOES support reopening (the main page\'s own <code>postrotate</code> + <code>kill -USR1</code> pattern, or an equivalent SIGHUP-based reopen), that approach has no comparable data-loss window at all, since the rename-based rotation never requires copying live data out from under an actively-writing process.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'copytruncate config, and why an app might need it',
      language: 'bash',
      code: `# /etc/logrotate.d/legacy-app -- for an application with NO
# signal-based log-reopen support at all (unlike the main page's
# own postrotate + kill -USR1 example, which assumes one exists)
/var/log/legacy-app/*.log {
    daily
    rotate 14
    compress
    copytruncate          # <-- the app keeps writing to the SAME
                           #     file descriptor the whole time,
                           #     no reopen signal needed
    missingok
    notifempty
}

# Confirm which mode a given logrotate config is actually using --
# copytruncate and the rename+postrotate approach are mutually
# exclusive strategies, easy to miss when reviewing an unfamiliar
# config:
grep -A1 "copytruncate\\|postrotate" /etc/logrotate.d/*`,
    },
    {
      label: 'Demonstrating the race window, and when to avoid copytruncate',
      language: 'bash',
      code: `# A synthetic reproduction of the documented race: a process
# writing continuously, rotated mid-write with copytruncate
while true; do echo "$(date +%s.%N) line" >> /var/log/test/app.log; done &
WRITER_PID=$!

sleep 2
logrotate -f /etc/logrotate.d/test-copytruncate
sleep 2
kill $WRITER_PID

# Compare: total lines actually written (tracked separately) vs.
# total lines present across BOTH the rotated file and the
# post-rotation original -- under sustained write load, the sum
# is measurably LESS than what was actually written -- exactly
# the officially-documented "small time slice... logging data
# might be lost" behavior, not a configuration mistake.

# The safe alternative, whenever the application supports it --
# no copy step, no truncate, no window where data can vanish:
# /etc/logrotate.d/myapp (the main page's own pattern):
# postrotate
#     kill -USR1 $(cat /var/run/myapp.pid 2>/dev/null) 2>/dev/null || true
# endscript
# -- the app reopens a BRAND NEW file; nothing is ever copied
#    out from under an actively-writing process at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team migrates a legacy application (no support for reopening log files on a signal) to use `copytruncate` in its logrotate config, following advice that it "just works" for apps like this. Months later, an incident investigation finds a roughly 30-second gap in the application\'s logs immediately surrounding the exact time of a scheduled log rotation — right when the incident actually started. The team assumes the application itself failed to log anything during that window. What is the more likely explanation, and what would confirm it?',
    hint: 'Check what copytruncate actually does at the moment of rotation — does it stop the application from writing at all during that window, or does it just risk losing whatever gets written during a specific narrow slice of time?',
    solution: 'The more likely explanation is copytruncate\'s own documented race condition, not an application logging failure — copytruncate copies the current log file\'s contents to the rotated filename, then truncates the original in place, and any lines the application writes in the small window BETWEEN those two steps are lost: not present in the copied (rotated) file, and wiped out by the truncate along with everything else. Under normal light load this window is usually too brief to notice, but a 30-second gap lining up exactly with a scheduled rotation is a strong signal this is exactly what happened, especially if the application was under heavier-than-usual write volume at that moment (which incidents often cause). This would be confirmed by checking whether the gap\'s start/end times align precisely with the configured rotation schedule (cron or logrotate\'s own timer), and by checking `/var/lib/logrotate/status` for the exact rotation timestamp — if it falls squarely inside the missing window, the fix is either accepting the tradeoff (copytruncate remains the only option if the application genuinely cannot reopen log files) or investigating whether the application could be updated to support a signal-based reopen instead, switching to the rename + postrotate approach that has no equivalent data-loss window at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'copytruncate is just a simpler, equally safe alternative to the postrotate/signal-based rotation approach, useful whenever an app\'s reopen behavior is uncertain.',
      reality: 'Per this subtopic\'s theory, copytruncate has a real, officially documented data-loss window between its copy and truncate steps — it is a fallback specifically for applications that cannot reopen log files on a signal, not a generally safer or equally reliable default.'
    },
    {
      thought: 'A brief gap in application logs immediately around a scheduled log rotation indicates the application itself stopped logging or crashed during that window.',
      reality: 'Per this subtopic\'s theory, this exact symptom is the classic signature of copytruncate\'s race condition — log lines written in the narrow window between the copy and truncate steps are genuinely lost, with no indication in the application\'s own behavior that anything went wrong.'
    },
    {
      thought: 'The severity of copytruncate\'s data-loss window is negligible in practice and not worth factoring into a rotation-strategy decision.',
      reality: 'Per this subtopic\'s theory, the severity scales directly with write volume — documented real-world testing under sustained heavy write load lost millions of lines during a single rotation, making this a genuine, sizeable risk for high-throughput logs specifically, not just a theoretical edge case.'
    }
  ];
}
