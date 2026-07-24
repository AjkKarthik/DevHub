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
  templateUrl: './execreload-kill-hup-mainpid-can-kill-not-reload-a-nodejs-service.html',
  styleUrl: './execreload-kill-hup-mainpid-can-kill-not-reload-a-nodejs-service.scss'
})
export class ExecreloadKillHupMainpidCanKillNotReloadANodejsServiceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents "reload sends SIGHUP" as a universal, always-graceful fact',
      points: [
        'The main page\'s own mistakes list states: "reload sends SIGHUP which causes nginx/apache to reload config and gracefully hand off connections." Its own unit-file example — a Node.js service, <code>ExecStart=/usr/bin/node /opt/myapp/server.js</code> — includes <code>ExecReload=/bin/kill -HUP $MAINPID</code>, presented as part of a complete, working service definition with no caveat about whether this actually reloads the Node.js process gracefully.',
      ]
    },
    {
      heading: 'SIGHUP is graceful ONLY because nginx/apache specifically choose to treat it that way',
      points: [
        '<code>systemctl reload</code> does not have any built-in, universal reload mechanism — it simply runs whatever command the unit file\'s own <code>ExecReload=</code> directive specifies. For nginx/apache, that command happens to send SIGHUP, and nginx/apache\'s OWN source code contains explicit logic that catches SIGHUP and responds by re-reading config and gracefully handing off connections — the gracefulness lives entirely in nginx/apache\'s own signal handling, not in SIGHUP itself.',
        'SIGHUP is not inherently a "reload" signal at the operating-system level — its DEFAULT disposition, for any process that does not explicitly register a handler for it, is to TERMINATE the process. A program only reloads gracefully on SIGHUP if its own code specifically opts into that behavior.',
      ]
    },
    {
      heading: 'Applying this to the main page\'s own example: Node.js kills on SIGHUP by default',
      points: [
        'Node.js\'s own documented behavior: on non-Windows platforms, if no listener has been registered for SIGHUP via <code>process.on(\'SIGHUP\', ...)</code>, the default action is to TERMINATE the Node.js process. Registering ANY listener removes that default termination behavior — but a plain <code>server.js</code> file with no such listener (exactly what the main page\'s own <code>server.js</code> example implies) does nothing special with SIGHUP at all.',
        'This means the main page\'s own <code>ExecReload=/bin/kill -HUP $MAINPID</code> line, applied to its own <code>node server.js</code> example, does not gracefully reload the service — it KILLS it. An operator running <code>systemctl reload myapp</code> expecting a zero-downtime config reload (exactly the behavior the main page describes for nginx) would instead cause a full, ungraceful process termination, with systemd then restarting it from scratch per <code>Restart=on-failure</code> — a very different, much more disruptive outcome than "reload" implies.',
        'The fix: either give the Node.js process its OWN SIGHUP handler that actually reloads configuration in application code (<code>process.on(\'SIGHUP\', () => { /* reload config */ })</code>), or, if no graceful in-process reload is implemented, be honest about it in the unit file by omitting <code>ExecReload=</code> entirely — <code>systemctl reload</code> then correctly fails with a clear error rather than silently killing the process while claiming to "reload" it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the kill-instead-of-reload behavior',
      language: 'bash',
      code: `# The main page's own unit file, unit file section relevant here:
# ExecStart=/usr/bin/node /opt/myapp/server.js
# ExecReload=/bin/kill -HUP $MAINPID

# A plain server.js with no SIGHUP handling at all -- exactly what
# the main page's own example implies:
# server.js:
#   const http = require('http');
#   http.createServer((req, res) => res.end('OK')).listen(3000);
#   (no process.on('SIGHUP', ...) anywhere in this file)

systemctl status myapp
# Active: active (running) since ...; Main PID: 4821 (node)

# Operator expects a graceful, zero-downtime config reload,
# following the exact same command shown for nginx on the main page:
sudo systemctl reload myapp

journalctl -u myapp -n 10
# myapp.service: Main process exited, code=killed, status=1/HUP
# myapp.service: Failed with result 'signal'.
# myapp.service: Scheduled restart job, restart counter is at 1.
# Started myapp.service.
#
# The process was KILLED (not reloaded) by the default SIGHUP
# disposition, then fully restarted from scratch by
# Restart=on-failure -- every in-flight request dropped, exactly
# the disruptive outcome "reload" was supposed to avoid.`,
    },
    {
      label: 'The fix: a real SIGHUP handler, or an honest missing ExecReload',
      language: 'bash',
      code: `# FIX #1 -- give the Node.js process its own graceful reload logic:
# server.js:
#   let config = loadConfig();
#   process.on('SIGHUP', () => {
#     console.log('Reloading config...');
#     config = loadConfig();        // re-read config, no downtime
#   });
#   // registering ANY SIGHUP listener removes Node's default
#   // termination behavior for this signal entirely

sudo systemctl reload myapp
journalctl -u myapp -n 5
# Reloading config...
# -- process stays running the whole time, exactly the zero-downtime
#    behavior "reload" is supposed to provide

# FIX #2 -- if there's no real in-process reload logic, don't claim
# there is one: omit ExecReload= from the unit file entirely
# [Service]
# ExecStart=/usr/bin/node /opt/myapp/server.js
# # (no ExecReload= line at all)

sudo systemctl reload myapp
# Failed to reload myapp.service: Job type reload is not
# applicable for unit myapp.service.
# -- an honest, clear failure instead of a silent, disruptive kill
#    disguised as a graceful reload`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own unit-file example (a Node.js service with `ExecReload=/bin/kill -HUP $MAINPID`), an operator runs `systemctl reload myapp` during business hours specifically to avoid the downtime a full restart would cause. Monitoring shows a brief spike in failed requests at that exact moment, and `journalctl -u myapp` shows the process was killed and systemd restarted it. The operator is confused — reload was supposed to be the zero-downtime option. What actually happened, and what would you check in the application\'s own source code to confirm the cause?',
    hint: 'Check whether SIGHUP is inherently a "graceful reload" signal at the operating-system level, or whether that gracefulness depends entirely on something the specific application\'s own code has to opt into.',
    solution: 'What actually happened is that `ExecReload=/bin/kill -HUP $MAINPID` sent a SIGHUP signal to the Node.js process, and SIGHUP\'s DEFAULT disposition for any process that hasn\'t explicitly registered a handler for it is to terminate the process — Node.js documents this exact behavior for non-Windows platforms. Since a plain server.js with no `process.on(\'SIGHUP\', ...)` listener does nothing special with that signal, the process was killed outright, and systemd\'s own `Restart=on-failure` then restarted it from scratch — a full process restart, not the graceful, zero-downtime reload the operator expected (and which nginx/apache genuinely provide, but only because THEIR OWN code specifically catches SIGHUP and reloads config instead of dying). To confirm the cause, check the application\'s own source code (server.js and anything it imports) for a `process.on(\'SIGHUP\', ...)` registration — if none exists, that confirms the process has no custom SIGHUP handling and falls back to Node\'s own default termination behavior. The fix is either adding real reload logic inside a SIGHUP handler in the application code, or removing `ExecReload=` from the unit file so `systemctl reload` fails honestly instead of silently causing a disruptive restart.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'systemctl reload always performs a graceful, zero-downtime config reload, the same way it does for nginx or apache.',
      reality: 'Per this subtopic\'s theory, systemctl reload simply runs whatever command a unit\'s own ExecReload= directive specifies — for nginx/apache that command happens to trigger genuinely graceful behavior because THEIR OWN code specifically implements it; a different application with the same ExecReload= line can behave completely differently.'
    },
    {
      thought: 'SIGHUP is inherently a "reload configuration" signal at the operating-system level.',
      reality: 'Per this subtopic\'s theory, SIGHUP\'s default disposition for any process that hasn\'t explicitly registered a handler for it is to TERMINATE the process — graceful reload-on-SIGHUP behavior only happens when an application\'s own code specifically opts into it.'
    },
    {
      thought: 'Copying the main page\'s own unit-file example (ExecReload=/bin/kill -HUP $MAINPID) into a Node.js service definition produces a working, graceful reload, since it\'s presented as a complete example.',
      reality: 'Per this subtopic\'s theory, this line only reloads gracefully if the Node.js application\'s own code registers a SIGHUP handler — a plain server.js with no such handler is instead KILLED by the default SIGHUP disposition, then fully restarted by Restart=on-failure, the opposite of a graceful reload.'
    }
  ];
}
