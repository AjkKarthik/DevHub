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
  templateUrl: './systemctl-edit-drop-ins-need-an-empty-execstart-to-override-it.html',
  styleUrl: './systemctl-edit-drop-ins-need-an-empty-execstart-to-override-it.scss'
})
export class SystemctlEditDropInsNeedAnEmptyExecstartToOverrideItSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes drop-in overrides as a simple, uniform "merge"',
      points: [
        'The main page\'s own QnA states: "systemctl edit myapp.service... opens a drop-in file... Add only the settings you want to override — they are merged with the original." This phrasing implies a single, uniform merge behavior for every directive — set a value in the drop-in, and it simply replaces the original.',
      ]
    },
    {
      heading: 'Most directives DO simply override — but ExecStart= (and a few others) do not',
      points: [
        'For most settings (like <code>Restart=</code>, <code>User=</code>, <code>Environment=</code>), the main page\'s "merged with the original" description is accurate — the drop-in\'s value replaces the package\'s original value for that setting.',
        '<code>ExecStart=</code> behaves differently: systemd treats repeated <code>ExecStart=</code> lines across the original unit file and any drop-ins as a LIST that gets APPENDED to, not replaced. Writing a new <code>ExecStart=</code> line in a drop-in file does not remove the original one — it adds a second one alongside it.',
        'Since a service unit is only allowed exactly ONE actual start command, having two <code>ExecStart=</code> entries (the original plus the drop-in\'s) is invalid — <code>systemctl daemon-reload</code> or the next service start fails with an error like "Service has more than one ExecStart= setting, which is only allowed for Type=oneshot services."',
      ]
    },
    {
      heading: 'The fix: an empty ExecStart= line clears the list before setting the new value',
      points: [
        'The documented, correct pattern for overriding <code>ExecStart=</code> via a drop-in is two lines: an EMPTY <code>ExecStart=</code> (with nothing after the <code>=</code>) first, which explicitly clears every previously-set <code>ExecStart=</code> value (from the original unit AND any earlier drop-ins), followed immediately by the new <code>ExecStart=/path/to/new/command</code> line with the actual replacement command.',
        'This two-line pattern is specific to directives systemd treats as appendable LISTS — <code>ExecStart=</code>, <code>ExecStartPre=</code>, <code>ExecStartPost=</code>, <code>ExecStop=</code>, and <code>Environment=</code> (deliberately additive, for adding MORE env vars) all share this behavior to varying degrees, and are worth checking against systemd\'s own documentation for the exact directive being overridden, rather than assuming the main page\'s "just add what you want to override" description applies uniformly to every setting.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the "more than one ExecStart" error',
      language: 'bash',
      code: `# Original unit: /etc/systemd/system/myapp.service
# [Service]
# ExecStart=/usr/bin/node /opt/myapp/server.js

# Following the main page's own QnA guidance verbatim -- "add only
# the settings you want to override":
sudo systemctl edit myapp.service
# Opens: /etc/systemd/system/myapp.service.d/override.conf
# Typed in:
#   [Service]
#   ExecStart=/usr/bin/node --max-old-space-size=4096 /opt/myapp/server.js

sudo systemctl daemon-reload
sudo systemctl restart myapp
# Job for myapp.service failed because the service did not take
# the steps required by its unit configuration.
# See "systemctl status myapp.service" for details.

systemctl status myapp
# myapp.service: Service has more than one ExecStart= setting,
# which is only allowed for Type=oneshot services. Refusing.
# -- BOTH the original AND the drop-in's ExecStart= are present;
#    the drop-in APPENDED rather than replaced, exactly as
#    systemd's own documented behavior for this specific directive.`,
    },
    {
      label: 'The fix: clear with an empty ExecStart= first',
      language: 'bash',
      code: `sudo systemctl edit myapp.service
# In the drop-in file (/etc/systemd/system/myapp.service.d/override.conf):
#   [Service]
#   ExecStart=
#   ExecStart=/usr/bin/node --max-old-space-size=4096 /opt/myapp/server.js
#
# The FIRST, empty ExecStart= line clears every previously-set
# value (the original unit's own ExecStart=, plus any from earlier
# drop-ins) -- the SECOND line then sets the one new value.

sudo systemctl daemon-reload
sudo systemctl restart myapp
systemctl status myapp
# Active: active (running) ...    <-- starts correctly now

# Confirm exactly what systemd resolved the effective unit to,
# after merging the original + all drop-ins:
systemctl cat myapp
# (shows both the original file's content AND the drop-in's,
#  in the order systemd actually applies them -- useful for
#  confirming a drop-in did what was intended before restarting)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own advice to use `systemctl edit` for overrides "without replacing" the original unit, an engineer runs `systemctl edit myapp.service` and adds a single new `ExecStart=` line with an updated command-line flag. After `daemon-reload` and a restart attempt, the service fails with "Service has more than one ExecStart= setting." The engineer is confused, since they only added ONE line. What is actually happening, and what two-line pattern fixes it?',
    hint: 'Check whether systemd treats a repeated directive like ExecStart= the same way it treats most other settings (replace) — or whether some specific directives are instead treated as an appendable LIST across the original file and any drop-ins.',
    solution: 'ExecStart= is one of a small set of directives systemd treats as an appendable LIST rather than a simple overridable value — writing a new ExecStart= line in a drop-in file does not replace the original unit\'s own ExecStart= line, it ADDS a second one alongside it. Since a service unit can only have exactly one actual start command (outside of Type=oneshot), having both the original and the drop-in\'s ExecStart= present is invalid, which is exactly the "more than one ExecStart= setting" error. The engineer only wrote one NEW line, but the ORIGINAL unit\'s own ExecStart= line was never cleared, so there are effectively two in total once systemd merges the drop-in with the base unit. The fix is the two-line pattern documented for this specific directive: an EMPTY `ExecStart=` line first (which explicitly clears every previously-set value), immediately followed by the new `ExecStart=/path/to/command` line with the actual replacement — this correctly results in exactly one active ExecStart= value after the merge.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Every directive in a systemd drop-in file behaves the same way — write the new value, and it replaces the original.',
      reality: 'Per this subtopic\'s theory, most directives do behave this way, but ExecStart= (along with a few related Exec* directives) is treated as an appendable LIST — a new value in a drop-in adds to the original rather than replacing it.'
    },
    {
      thought: 'A "Service has more than one ExecStart= setting" error means the drop-in file was written incorrectly, with an accidental duplicate line.',
      reality: 'Per this subtopic\'s theory, this error is the EXPECTED result of writing just one new ExecStart= line in a drop-in, without an empty ExecStart= line first — the original unit\'s own ExecStart= is still present and counts as the first of the "more than one" the error refers to.'
    },
    {
      thought: 'systemctl edit\'s drop-in mechanism is a uniform "merge" for every setting, as the main page\'s own QnA phrasing suggests.',
      reality: 'Per this subtopic\'s theory, the merge behavior genuinely differs by directive — checking systemd\'s own documentation for the SPECIFIC setting being overridden (rather than assuming uniform replace behavior) avoids this exact class of error for ExecStart= and its related directives.'
    }
  ];
}
