import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';

@Component({
  selector: 'app-linux-cron',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    QuizBlockComponent, QnaBlockComponent],
  templateUrl: './cron.html',
  styleUrl: './cron.scss'
})
export class LinuxCron {

  quickRef: QuickRefItem[] = [
    { name: 'crontab -e', type: 'syntax', desc: 'Edit current user\'s crontab' },
    { name: 'crontab -l', type: 'syntax', desc: 'List current user\'s cron jobs' },
    { name: 'crontab -r', type: 'syntax', desc: 'Remove current user\'s crontab (all jobs)' },
    { name: '0 2 * * * /script.sh', type: 'syntax', desc: 'Run at 02:00 every day' },
    { name: '*/15 * * * * cmd', type: 'syntax', desc: 'Run every 15 minutes' },
    { name: '0 9-17 * * 1-5 cmd', type: 'syntax', desc: 'Every hour 9-17, Monday to Friday' },
    { name: '@reboot /script.sh', type: 'syntax', desc: 'Run once on system boot' },
    { name: 'systemctl list-timers', type: 'syntax', desc: 'List systemd timers (cron alternative)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Cron Format and Syntax',
      points: [
        'Cron format: MINUTE HOUR DAY-OF-MONTH MONTH DAY-OF-WEEK COMMAND. Five time fields + the command.',
        'Field ranges: minute 0-59, hour 0-23, day-of-month 1-31, month 1-12, day-of-week 0-7 (0 and 7 both = Sunday).',
        'Special values: * = any, */N = every N units, 1-5 = range, 1,3,5 = list, @reboot = at boot, @daily = 0 0 * * *, @hourly = 0 * * * *.',
        'Environment in cron is minimal: PATH is very limited. Always use full paths in cron commands: /usr/bin/python3 not python3.',
      ],
    },
    {
      heading: 'Crontab Files',
      points: [
        'User crontabs: crontab -e edits the current user\'s crontab. Stored in /var/spool/cron/crontabs/username.',
        'System crontab: /etc/crontab has an extra USERNAME field: "0 2 * * * root /usr/local/bin/backup.sh".',
        '/etc/cron.d/ accepts drop-in crontab-format files with the USERNAME field — good for package-installed jobs.',
        '/etc/cron.daily/, /etc/cron.weekly/, /etc/cron.hourly/ — drop a script here and run-parts executes it at that frequency.',
        'Access control: /etc/cron.allow and /etc/cron.deny control who can use crontab. If cron.allow exists, only listed users can use cron.',
      ],
    },
    {
      heading: 'Environment and Output',
      points: [
        'Set environment at top of crontab: SHELL=/bin/bash, PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin, MAILTO=admin@example.com.',
        'MAILTO= (empty) disables email. MAILTO=user sends cron output to that email. Default: any output is mailed to the crontab owner.',
        'Redirect output to log: 0 2 * * * /script.sh >> /var/log/myscript.log 2>&1. The 2>&1 captures stderr too.',
        'cron runs in a very restricted environment. Source your profile: 0 2 * * * . ~/.profile; /script.sh',
      ],
    },
    {
      heading: 'systemd Timers — Modern Alternative',
      points: [
        'systemd timers replace cron with better logging, dependency management, and missed-run handling.',
        'A timer unit pairs with a service unit. mybackup.timer triggers mybackup.service.',
        'OnCalendar= specifies the schedule: "daily", "weekly", "Mon *-*-* 02:00:00", "*:0/15" (every 15 min).',
        'Persistent=true re-fires if the system was off during the scheduled time (cron does not retry missed runs).',
        'systemctl list-timers shows all timers, next fire time, and last fire time.',
      ],
    },
    {
      heading: 'Cron Environment Differences from Interactive Shells',
      points: [
        'Cron jobs run with a minimal environment (a much smaller PATH, no interactive shell configuration sourced) compared to your interactive terminal session — a script that works perfectly when run manually can fail under cron due to missing environment variables or an incomplete PATH.',
        'Always use absolute paths for commands and files within cron jobs (/usr/bin/python3 rather than just python3) rather than relying on PATH resolution, since cron\'s PATH is often much more limited than an interactive shell\'s PATH.',
        'Redirecting cron job output explicitly (command >> /var/log/myjob.log 2>&1) is essential — by default, cron emails job output to the crontab owner, which is easy to miss and does not scale as a monitoring strategy for anything beyond occasional manual jobs.',
        'Testing a cron job by running the exact command line from the crontab entry directly in a minimal shell (env -i /bin/sh -c "the command") more accurately simulates the cron execution environment than simply running the command in your normal interactive shell.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Crontab Examples',
      language: 'bash',
      code: `# Edit your crontab
crontab -e

# Cron format:
# MIN  HOUR  DOM  MON  DOW  COMMAND
# 0-59 0-23  1-31 1-12 0-7

# Examples
0 2 * * *       /usr/local/bin/backup.sh          # 02:00 daily
*/15 * * * *    /usr/bin/check-health.sh          # every 15 min
0 9-17 * * 1-5  /usr/bin/send-report.sh           # 9-5, Mon-Fri
0 0 1 * *       /usr/local/bin/monthly-report.sh  # 1st of month
@reboot         /usr/local/bin/startup.sh          # on boot
@daily          /usr/bin/logrotate /etc/logrotate.conf

# With output logging
0 3 * * * /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1

# System crontab (/etc/crontab or /etc/cron.d/) — has USERNAME field
0 4 * * *  root  /usr/local/bin/system-check.sh

# View all running cron jobs (all users)
sudo crontab -l -u alice
sudo grep -r '' /var/spool/cron/crontabs/ 2>/dev/null`,
    },
    {
      label: 'Crontab Best Practices',
      language: 'bash',
      code: `# Example robust crontab

SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=""                          # disable email, log instead

# Run with lock to prevent overlapping (flock)
*/5 * * * * flock -n /tmp/myjob.lock /opt/app/process.sh >> /var/log/process.log 2>&1

# Run as a specific user (in /etc/cron.d/myjob)
# 0 2 * * * deploy /opt/app/deploy.sh >> /var/log/deploy.log 2>&1

# Load environment from file
0 3 * * * env $(cat /etc/myapp/env | xargs) /opt/myapp/cleanup.sh >> /var/log/cleanup.log 2>&1

# Testing — verify cron is running
cat /var/log/syslog | grep CRON
journalctl -u cron.service
journalctl | grep CRON

# Cron daemon
sudo systemctl status cron        # Ubuntu/Debian
sudo systemctl status crond       # RHEL/CentOS`,
    },
    {
      label: 'systemd Timers',
      language: 'bash',
      code: `# Create systemd timer as cron replacement

# /etc/systemd/system/mybackup.service
[Unit]
Description=My Backup Job
After=network.target

[Service]
Type=oneshot
User=backup
ExecStart=/usr/local/bin/backup.sh
StandardOutput=journal
StandardError=journal


# /etc/systemd/system/mybackup.timer
[Unit]
Description=Daily Backup Timer
Requires=mybackup.service

[Timer]
OnCalendar=*-*-* 02:00:00    # every day at 2 AM
Persistent=true                # catch up if system was off
RandomizedDelaySec=300         # add up to 5 min random delay

[Install]
WantedBy=timers.target


# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable --now mybackup.timer

# Monitor
systemctl list-timers
systemctl status mybackup.timer
journalctl -u mybackup.service -n 50`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'In a crontab entry "30 14 * * 1", when does the job run?',
      options: [
        '14:30 every Monday',
        '14:30 the first day of each month',
        '30 minutes after 14:00 on weekdays',
        'At 14:00 on January 30th',
      ],
      answer: 0,
      explanation: 'Fields: minute=30, hour=14, DOM=* (any), month=* (any), DOW=1 (Monday). So: 14:30 every Monday.',
    },
    {
      q: 'Why should you use full paths in cron commands?',
      options: [
        'Cron requires absolute paths',
        'PATH in cron is minimal and may not include standard directories',
        'Relative paths do not work in Linux',
        'Full paths are faster to execute',
      ],
      answer: 1,
      explanation: 'Cron runs with a very limited PATH (typically /usr/bin:/bin). Commands like python3, node, or custom scripts not in those dirs will fail with "command not found" unless the full path is used.',
    },
    {
      q: 'What does @reboot in a crontab entry mean?',
      options: [
        'Run every time the cron daemon restarts',
        'Run once when the system boots',
        'Restart the system after the command runs',
        'Run only during reboot window (3-5 AM)',
      ],
      answer: 1,
      explanation: '@reboot is a cron shorthand that runs the command once at system startup. It is equivalent to running the command at boot time, similar to rc.local or a systemd service with Type=oneshot.',
    },
    {
      q: 'What is the advantage of systemd timers over cron?',
      options: [
        'Timers use less CPU',
        'Timers support Persistent=true which catches up missed jobs after downtime',
        'Timers can send email notifications',
        'Timers are faster to configure',
      ],
      answer: 1,
      explanation: 'With Persistent=true, a systemd timer that was due while the system was off will fire as soon as the system comes back up. cron simply misses the scheduled run if the system was down.',
    },
    {
      q: 'What does the cron expression */5 * * * * mean?',
      options: [
        'At minute 5 of every hour',
        'Every 5 minutes',
        'Every 5 hours',
        'On the 5th of every month',
      ],
      answer: 1,
      explanation: '*/5 in the minute field means every 5 minutes (0, 5, 10, 15...). The */N syntax means every N units. The five fields are: minute, hour, day-of-month, month, day-of-week.',
    },
    {
      q: 'What does @reboot do in a crontab?',
      options: [
        'Reboots the system daily',
        'Runs the command once when the cron daemon starts (system boot)',
        'Runs the command every reboot cycle',
        'It is an invalid cron expression',
      ],
      answer: 1,
      explanation: '@reboot runs the command once after every system boot when crond starts. It is equivalent to @reboot and useful for starting services or initialising state after restart.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I prevent overlapping cron jobs when a job runs longer than its interval?',
      a: 'Use flock: */5 * * * * flock -n /tmp/myjob.lock /opt/myapp/process.sh. The -n flag means non-blocking — if the lock is held (previous job still running), this invocation exits immediately without running. The lockfile is /tmp/myjob.lock. flock releases the lock automatically when the job exits.',
    },
    {
      q: 'How do I debug a cron job that works in the terminal but not in cron?',
      a: 'Common causes: (1) PATH difference — use full paths, (2) missing environment variables — add PATH/HOME/env vars to crontab header, (3) different working directory — add cd /opt/app before command, (4) relative paths. Debug: add >> /tmp/cron.log 2>&1 to capture output. Check /var/log/syslog | grep CRON or journalctl | grep CRON for cron daemon errors.',
    },
    {
      q: 'What is the difference between /etc/cron.d/ and user crontabs?',
      a: '/etc/cron.d/ files have the same format as /etc/crontab with an extra USERNAME field. They are managed by system packages and admins — useful for package-installed jobs. User crontabs (crontab -e) are per-user and do not need the username field. /etc/cron.d/ entries run at the system level; if the username field is root, they run as root.',
    },
    {
      q: 'How do I run a cron job as a different user?',
      a: 'In /etc/crontab or /etc/cron.d/: "0 2 * * * www-data /opt/app/cleanup.sh". The username field specifies who runs the command. Alternatively: sudo crontab -u www-data -e edits www-data\'s crontab. User crontabs always run as that user.',
    },
    {
      q: 'Where are system-wide cron jobs stored and how do they differ from user crontabs?',
      a: 'System cron locations: <strong>/etc/crontab</strong> (system crontab with user field), <strong>/etc/cron.d/</strong> (package-managed jobs), <strong>/etc/cron.daily|weekly|monthly/</strong> (scripts run by run-parts). User crontabs (crontab -e) are stored in <strong>/var/spool/cron/crontabs/username</strong> — no user field required since the cron daemon runs them as that user.',
    },
    {
      q: 'How do you debug a cron job that is not running?',
      a: 'Steps: (1) Check <strong>/var/log/syslog</strong> or <strong>journalctl -u cron</strong> for cron execution logs. (2) Test the command manually as the correct user. (3) Ensure PATH is set in crontab (cron has minimal PATH). (4) Redirect output: <code>cmd >> /tmp/out.log 2>&1</code>. (5) Check permissions on the script (must be executable). (6) Verify no syntax errors with <code>crontab -l</code>.',
    },
  ];
}
