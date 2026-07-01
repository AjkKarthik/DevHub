import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-linux-systemd',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './systemd.html',
  styleUrl: './systemd.scss'
})
export class LinuxSystemd {

  quickRef: QuickRefItem[] = [
    { name: 'systemctl status nginx', type: 'syntax', desc: 'Show service status, PID, recent logs' },
    { name: 'systemctl start/stop/restart nginx', type: 'syntax', desc: 'Start, stop, or restart a service' },
    { name: 'systemctl enable/disable nginx', type: 'syntax', desc: 'Enable (start on boot) / disable a service' },
    { name: 'systemctl reload nginx', type: 'syntax', desc: 'Reload config without restarting (sends SIGHUP)' },
    { name: 'journalctl -u nginx -f', type: 'syntax', desc: 'Follow logs for nginx service' },
    { name: 'journalctl --since "1 hour ago"', type: 'syntax', desc: 'Logs from the last hour' },
    { name: 'systemctl list-units --type=service', type: 'syntax', desc: 'List all loaded service units' },
    { name: 'systemd-analyze blame', type: 'syntax', desc: 'Show services sorted by startup time' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'systemd Architecture',
      points: [
        'systemd is PID 1 on modern Linux. It manages services (unit type=service), timers (cron replacement), sockets, mounts, and devices.',
        'Units are configuration files describing what to start and how. Stored in /lib/systemd/system/ (package-provided) and /etc/systemd/system/ (admin overrides).',
        'systemctl enable creates a symlink in /etc/systemd/system/multi-user.target.wants/ — tells systemd to start the unit in the target runlevel.',
        'Targets are groups of units: multi-user.target (like runlevel 3), graphical.target (runlevel 5), rescue.target (single-user).',
      ],
    },
    {
      heading: 'Service Unit Files',
      points: [
        'Unit files have [Unit], [Service], and [Install] sections.',
        '[Unit]: Description, After= (start after), Requires= (hard dep), Wants= (soft dep).',
        '[Service]: Type (simple/forking/oneshot/notify/exec), ExecStart, ExecStop, ExecReload, Restart, RestartSec, User, WorkingDirectory, Environment.',
        '[Install]: WantedBy=multi-user.target — which target should include this unit when enabled.',
        'After editing a unit file: systemctl daemon-reload to re-read configs, then restart the service.',
      ],
    },
    {
      heading: 'journald — Structured Logging',
      points: [
        'journald collects all system logs (kernel, systemd, syslog) into a binary database. journalctl is the query tool.',
        'journalctl -u SERVICE follows a specific service. -f = follow (like tail -f). -n 100 = last 100 lines. -p err = priority err and above.',
        'journalctl --since "2024-01-01" --until "2024-01-02" filters by time range. -k = kernel messages only.',
        'journalctl --disk-usage shows total log size. journalctl --vacuum-size=500M prunes old logs.',
      ],
    },
    {
      heading: 'Writing Custom Service Units',
      points: [
        'Place unit file in /etc/systemd/system/myapp.service. After changes: systemctl daemon-reload.',
        'Type=simple: ExecStart is the main process. Type=forking: service daemonizes (PID file needed). Type=notify: service notifies systemd when ready.',
        'Restart=on-failure with RestartSec=5s auto-restarts the service after failures — production standard.',
        'User=www-data WorkingDirectory=/opt/app Environment=NODE_ENV=production — security and config settings.',
        'StandardOutput=journal StandardError=journal sends all output to journald.',
      ],
    },
    {
      heading: 'Writing and Managing Custom systemd Service Units',
      points: [
        'A systemd unit file (placed in /etc/systemd/system/myapp.service) defines how a service should be started, its dependencies (After=, Requires=), and its restart behavior (Restart=on-failure) — this declarative configuration replaces hand-written init scripts with a consistent, structured format.',
        'The Type= directive (simple, forking, oneshot, notify) tells systemd how to determine when a service has actually finished starting — getting this wrong (like using Type=simple for a process that forks and daemonizes) causes systemd to misjudge the service as started before it actually is, or vice versa.',
        'Restart=on-failure combined with RestartSec= provides automatic recovery from crashes without manual intervention — a critical resilience feature for production services, though it should be paired with reasonable limits (StartLimitBurst) to avoid an infinite crash-restart loop consuming resources.',
        'After modifying a unit file, systemctl daemon-reload is required to make systemd re-read the updated configuration before systemctl restart myapp actually picks up the changes — a commonly forgotten step that leads to confusion when a unit file edit appears to have no effect.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'systemctl',
      language: 'bash',
      code: `# Service control
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx          # reload config (no downtime)
sudo systemctl status nginx          # status + recent logs

# Enable/disable on boot
sudo systemctl enable nginx          # start on boot
sudo systemctl disable nginx         # don't start on boot
sudo systemctl enable --now nginx    # enable + start immediately

# Inspect
systemctl list-units --type=service  # all service units
systemctl list-units --state=failed  # failed units only
systemctl is-active nginx            # returns "active" or "inactive"
systemctl is-enabled nginx           # returns "enabled" or "disabled"
systemctl cat nginx                  # show unit file content

# Boot analysis
systemd-analyze                      # total boot time
systemd-analyze blame                # services by startup time
systemd-analyze critical-chain       # critical boot path

# After editing unit files
sudo systemctl daemon-reload         # MUST run after editing unit files`,
    },
    {
      label: 'Unit File',
      language: 'bash',
      code: `# /etc/systemd/system/myapp.service
[Unit]
Description=My Application Server
Documentation=https://myapp.example.com/docs
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=myapp
Group=myapp
WorkingDirectory=/opt/myapp
ExecStart=/usr/bin/node /opt/myapp/server.js
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5s
StartLimitIntervalSec=60
StartLimitBurst=3

# Environment
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/etc/myapp/env

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/lib/myapp /var/log/myapp

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=myapp

[Install]
WantedBy=multi-user.target`,
    },
    {
      label: 'journalctl',
      language: 'bash',
      code: `# Follow logs for a service
journalctl -u nginx -f
journalctl -u nginx -n 100              # last 100 lines

# Time filtering
journalctl --since "1 hour ago"
journalctl --since "2024-01-01 10:00:00" --until "2024-01-01 11:00:00"
journalctl -u myapp --since today

# Priority filtering
journalctl -p err                       # errors and above
journalctl -p warning -u nginx          # warnings+ for nginx

# Kernel messages
journalctl -k                           # kernel only (like dmesg)
journalctl -k --since "-1h"            # kernel last hour

# Output formats
journalctl -u nginx -o json            # JSON output
journalctl -u nginx -o json-pretty     # pretty JSON
journalctl -o short-iso                # ISO timestamps

# Disk management
journalctl --disk-usage
journalctl --vacuum-size=1G            # keep only 1 GB of logs
journalctl --vacuum-time=7d            # keep only last 7 days`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting systemctl daemon-reload after editing a unit file',
      wrong: 'Edit /etc/systemd/system/myapp.service then systemctl restart myapp',
      right: 'systemctl daemon-reload && systemctl restart myapp',
      explanation: 'systemd caches unit file content. After editing, daemon-reload tells systemd to re-read all unit files. Without it, your changes are ignored and the old config is used.',
    },
    {
      title: 'Using systemctl restart instead of reload for nginx/apache',
      wrong: 'systemctl restart nginx (drops active connections)',
      right: 'systemctl reload nginx (sends SIGHUP, zero-downtime config reload)',
      explanation: 'restart stops and starts the process — all active connections are dropped. reload sends SIGHUP which causes nginx/apache to reload config and gracefully hand off connections.',
    },
    {
      title: 'Not setting Restart=on-failure for production services',
      wrong: '[Service] Type=simple ExecStart=/opt/app/server (no Restart)',
      right: '[Service] Restart=on-failure RestartSec=5s',
      explanation: 'Without Restart=, if the process crashes, it stays down. Restart=on-failure causes systemd to automatically restart the service after crashes, not after intentional stops.',
    },
    {
      title: 'Enabling a service without also starting it',
      wrong: 'systemctl enable nginx (expects it to start now)',
      right: 'systemctl enable --now nginx (enable + start in one command)',
      explanation: 'enable only configures the service to start on next boot. Use --now or follow with systemctl start to also start it immediately.',
    },
  ];

  challenge: Challenge = {
    title: 'Service Health Checker',
    language: 'typescript',
    description: 'Write a function that parses systemctl status output and determines if a service is healthy. Extract: active state, main PID, and uptime. Return a ServiceHealth object with these fields and an isHealthy boolean.',
    hints: [
      'Look for "Active: active (running)" to determine health',
      'Main PID is on the line starting with "Main PID:"',
      'Active line also contains uptime in parentheses like "since 2024-01-01 10:00:00; 2h 30min ago"',
    ],
    starterCode: `interface ServiceHealth {
  activeState: string;
  isHealthy: boolean;
  pid?: number;
  uptime?: string;
}

function parseServiceStatus(output: string): ServiceHealth {
  // Parse systemctl status output
}

const sampleOutput = \`● nginx.service - A high performance web server
   Loaded: loaded (/lib/systemd/system/nginx.service; enabled)
   Active: active (running) since Mon 2024-01-01 10:00:00 UTC; 2h 30min ago
  Main PID: 1234 (nginx)
\`;
console.log(parseServiceStatus(sampleOutput));`,
    solution: `interface ServiceHealth { activeState: string; isHealthy: boolean; pid?: number; uptime?: string; }

function parseServiceStatus(output: string): ServiceHealth {
  const activeMatch = output.match(/Active: (\\S+ \\(\\w+\\))/);
  const pidMatch = output.match(/Main PID: (\\d+)/);
  const uptimeMatch = output.match(/; (.+? ago)/);

  const activeState = activeMatch?.[1] ?? 'unknown';
  return {
    activeState,
    isHealthy: activeState.includes('active (running)'),
    pid: pidMatch ? parseInt(pidMatch[1], 10) : undefined,
    uptime: uptimeMatch?.[1],
  };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What command must you run after editing a systemd unit file?',
      options: ['systemctl reload', 'systemctl daemon-reload', 'systemctl restart', 'systemctl refresh'],
      answer: 1,
      explanation: 'systemctl daemon-reload tells systemd to re-read all unit files from disk. Without it, edits to .service files are ignored. Run it before restarting the service.',
    },
    {
      q: 'What is the difference between systemctl enable and systemctl start?',
      options: [
        'enable is for root; start is for any user',
        'enable configures boot-time start; start starts immediately',
        'enable starts the service once; start starts it permanently',
        'They are the same but with different output',
      ],
      answer: 1,
      explanation: 'enable creates symlinks so the unit starts at boot (next reboot). start immediately launches the service. Use "systemctl enable --now" to do both at once.',
    },
    {
      q: 'Which journalctl option follows logs in real time?',
      options: ['-n', '-f', '-t', '-r'],
      answer: 1,
      explanation: '-f follows the journal in real time (like tail -f). -n N shows the last N lines. -r reverses output (newest first). -t SYSLOG_ID filters by syslog identifier.',
    },
    {
      q: 'What does Restart=on-failure in a unit file do?',
      options: [
        'Restart the service when any exit code occurs',
        'Restart only when the process exits with non-zero or is killed by a signal',
        'Restart the system if the service fails 3 times',
        'Email the admin on failure',
      ],
      answer: 1,
      explanation: 'Restart=on-failure restarts the service if the main process exits with non-zero status or is killed by a signal (not SIGTERM). Intentional stops via systemctl stop are not restarted.',
    },
    {
      q: 'What is the difference between systemctl start and systemctl enable?',
      options: [
        'start makes the service boot on startup; enable starts it immediately',
        'start runs the service now (single session); enable configures it to start automatically at boot',
        'start applies to socket units; enable applies to service units',
        'They are aliases for the same action',
      ],
      answer: 1,
      explanation: 'systemctl start runs the service immediately in the current session. systemctl enable creates symlinks so it starts at boot. Use both together: systemctl enable --now servicename. disable removes the boot symlinks.',
    },
    {
      q: 'When must you run systemctl daemon-reload?',
      options: [
        'After every systemctl restart command',
        'After modifying unit files, to reload systemd manager configuration without restarting services',
        'Only after installing new packages',
        'Before every systemctl start to refresh state',
      ],
      answer: 1,
      explanation: 'daemon-reload re-reads all unit files without restarting running services. Run it after creating or editing a unit file in /etc/systemd/system/. Forgetting it means systemd uses the old unit definition.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I create a systemd timer as a cron replacement?',
      a: 'Create two unit files: myapp.timer and myapp.service. In the timer: [Timer] OnCalendar=daily (or "Mon *-*-* 02:00:00"), Persistent=true. In the service: the command to run. Enable and start the timer: systemctl enable --now myapp.timer. systemctl list-timers shows all timers and next fire times.',
    },
    {
      q: 'How do I override a systemd unit file without replacing it?',
      a: 'Use systemctl edit myapp.service which opens a drop-in file at /etc/systemd/system/myapp.service.d/override.conf. Add only the settings you want to override — they are merged with the original. This survives package upgrades. Or use systemctl edit --full to replace the entire unit file.',
    },
    {
      q: 'How do I see why a systemd service failed to start?',
      a: 'systemctl status myapp shows the last few log lines and exit code. For full logs: journalctl -u myapp -n 100 or journalctl -u myapp --since "5 minutes ago". Check for permission errors, missing files, or config syntax errors. journalctl -p err shows only error-level messages.',
    },
    {
      q: 'What are the sections of a systemd unit file?',
      a: 'A service unit (.service) has three sections: <strong>[Unit]</strong> — metadata (Description, After, Requires, Wants, documentation); <strong>[Service]</strong> — how to run (Type, ExecStart, ExecStop, Restart, User, Environment, WorkingDirectory); <strong>[Install]</strong> — when to enable (WantedBy=multi-user.target). Place custom units in <strong>/etc/systemd/system/</strong>; override package units with drop-in files in <strong>/etc/systemd/system/service.d/override.conf</strong>.',
    },
    {
      q: 'What are systemd targets and how do they replace SysV runlevels?',
      a: 'Targets are synchronisation points grouping units. Key targets: <strong>multi-user.target</strong> (runlevel 3 — text multi-user), <strong>graphical.target</strong> (runlevel 5 — GUI), <strong>rescue.target</strong> (runlevel 1 — single user), <strong>emergency.target</strong> (minimal). Change default: <code>systemctl set-default multi-user.target</code>. Switch target: <code>systemctl isolate rescue.target</code>.',
    },
    {
      q: 'How do you create a custom systemd service?',
      a: 'Create <code>/etc/systemd/system/myapp.service</code> with [Unit], [Service], [Install] sections. Set <code>ExecStart=/usr/local/bin/myapp</code>, <code>User=myapp</code>, <code>Restart=on-failure</code>, <code>WantedBy=multi-user.target</code>. Then: <code>systemctl daemon-reload && systemctl enable --now myapp</code>. Check: <code>systemctl status myapp</code> and <code>journalctl -u myapp -f</code>.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'systemctl controls services; daemon-reload after unit file edits; journalctl -u service -f follows logs; Restart=on-failure for production.',
    mustKnow: [
      'systemctl daemon-reload — MUST after any unit file change',
      'systemctl enable --now service — enable at boot AND start now',
      'Restart=on-failure + RestartSec=5s — production standard',
      'systemctl reload vs restart: reload = SIGHUP (no downtime); restart = kill + start',
      'journalctl -u service -f — follow service logs; --since for time filtering',
      'Unit files: /etc/systemd/system/ overrides /lib/systemd/system/',
    ],
    interviewFocus: [
      'How do you create a custom systemd service that auto-restarts on failure?',
      'What is the difference between systemctl reload and systemctl restart?',
      'How do you view logs for a specific systemd service?',
      'How do you override a unit file provided by a package without replacing it?',
    ],
  };
}
