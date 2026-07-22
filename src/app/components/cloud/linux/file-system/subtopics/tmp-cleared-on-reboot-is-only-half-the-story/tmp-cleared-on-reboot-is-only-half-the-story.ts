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
  templateUrl: './tmp-cleared-on-reboot-is-only-half-the-story.html',
  styleUrl: './tmp-cleared-on-reboot-is-only-half-the-story.scss'
})
export class TmpClearedOnRebootIsOnlyHalfTheStorySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page ties /tmp cleanup to reboot, and only reboot',
      points: [
        'The main page\'s own quick reference states: "/tmp: Temporary files; cleared on reboot (often tmpfs in RAM)." Its Common Mistakes section repeats the same framing: "/tmp is cleared on reboot on most systems (often a tmpfs in RAM). Never put data you need to survive a reboot in /tmp."',
        'Both statements are true as far as they go, but "cleared on reboot" implies the ONLY time /tmp loses data is at a reboot — leaving out an entirely separate, independent cleanup mechanism that can delete files from /tmp while the system has been running continuously for weeks, no reboot involved at all.',
      ]
    },
    {
      heading: 'Confirmed: systemd-tmpfiles periodically deletes AGED files from /tmp, independent of reboot',
      points: [
        'Per systemd\'s own documentation and the standard tmpfiles.d configuration shipped with most distros, "by default files in /tmp/ are cleaned up after 10 days, and those in /var/tmp after 30 days" — systemd-tmpfiles applies "ageing" to files in these directories, meaning files that have neither been changed NOR read within that window are automatically removed.',
        'This cleanup runs on its own schedule, entirely independent of reboots: the systemd-tmpfiles-clean.timer unit "is scheduled to trigger at 15 minutes after boot, and once a day while the system is running." A long-uptime server that never reboots for months still has its old /tmp files silently swept away on this recurring daily timer.',
        'The tmpfs-in-RAM mechanism the main page describes and the age-based systemd-tmpfiles cleanup are two SEPARATE reasons /tmp data can disappear — a file can survive every reboot (because it keeps getting touched/read) and still eventually get deleted by the age-based timer once it stops being accessed for 10 days, or conversely be wiped instantly by the very next reboot regardless of how recently it was touched, if /tmp itself is tmpfs.',
      ]
    },
    {
      heading: 'Why this distinction matters in practice',
      points: [
        'A long-running batch job or cache that writes to /tmp and is periodically re-read (keeping its "last accessed" timestamp fresh) can survive indefinitely across an UNCHANGING uptime — right up until either a reboot happens (if /tmp is tmpfs) or the job stops touching the file for 10 straight days (the age-based cleanup), whichever comes first. Neither the main page\'s "cleared on reboot" framing nor a naive "it\'ll persist as long as the system stays up" assumption is complete on its own.',
        'This also means a short-lived server that reboots frequently (containers, cloud instances with frequent redeploys) will mostly experience the tmpfs-wipe-on-reboot behavior the main page describes, while a long-uptime, rarely-rebooted server (a traditional on-prem box) is far more likely to experience files vanishing from the AGE-BASED timer instead — the SAME "/tmp isn\'t for persistent data" advice applies to both, but for different underlying reasons depending on the deployment pattern.',
        'The age-based cleanup is configurable per-directory via tmpfiles.d drop-in files (overriding the default 10-day age for /tmp specifically), which is the correct mechanism to adjust if an application genuinely needs its /tmp-stored files to survive longer than 10 days of inactivity without touching the deeper tmpfs-mount question at all.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two independent ways /tmp data disappears',
      language: 'bash',
      code: `# Main page's own framing: "/tmp is cleared on reboot... often
# tmpfs in RAM." True, but only ONE of two independent mechanisms:

# Mechanism 1 -- tmpfs wipe at reboot (what the main page describes)
mount | grep " /tmp "
# tmpfs on /tmp type tmpfs (rw,nosuid,nodev,size=...)
# -- everything under /tmp lives in RAM; a reboot clears RAM, so
#    /tmp is empty again on the next boot, regardless of file age.

# Mechanism 2 -- systemd-tmpfiles age-based cleanup (runs WHILE the
# system stays up, completely independent of any reboot):
systemctl list-timers | grep tmpfiles
# systemd-tmpfiles-clean.timer   <- fires 15 min after boot, then
#                                    once a day thereafter, for the
#                                    ENTIRE life of the uptime

# Check the default ageing rule that governs it:
cat /usr/lib/tmpfiles.d/tmp.conf
# q /tmp 1777 root root 10d
#                        ^^^ files in /tmp untouched for 10 days
#                            get deleted by the DAILY timer, with
#                            no reboot required at all`,
    },
    {
      label: 'A file that survives many reboots but still gets swept away',
      language: 'bash',
      code: `# A cache file written once, then never read or modified again:
echo "cached result" > /tmp/build-cache-42.json
stat -c '%X %Y' /tmp/build-cache-42.json   # access time, modify time

# On a tmpfs /tmp: this file is gone the instant the NEXT reboot
# happens, however soon that is.

# On a long-uptime server that goes weeks without a reboot: the
# SAME file survives every one of systemd-tmpfiles-clean.timer's
# daily runs for the first 9 days (it hasn't been unused long
# enough yet) -- then on day 10, with no reboot having occurred at
# all, the next daily timer run deletes it anyway:
sudo systemd-tmpfiles --clean
# (this is exactly what the daily timer invokes automatically --
#  running it manually shows what it would remove right now)

# Overriding the default 10-day age for an application that
# genuinely needs its /tmp files to live longer, without touching
# the tmpfs-mount question at all:
echo 'q /tmp 1777 root root 30d' | sudo tee /etc/tmpfiles.d/tmp-extended.conf
# This local override takes precedence over the shipped default
# in /usr/lib/tmpfiles.d/tmp.conf for the SAME path.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A monitoring script writes a heartbeat file to /tmp/health-check.json every hour and reads it back for a dashboard. The server has an uptime of 47 days with no reboots. One morning, the dashboard reports the file is missing, even though the write/read cycle has run correctly every hour without interruption up until 11 days ago, when the monitoring script itself was accidentally disabled by an unrelated config change. Why did the file specifically disappear around day 10 of being unused, rather than persisting indefinitely since there was no reboot?',
    hint: 'Check whether tmpfs-wipe-on-reboot is the only mechanism that can remove files from /tmp, or whether a second, independent, age-based cleanup runs regardless of uptime.',
    solution: 'This is systemd-tmpfiles\' age-based cleanup, not a reboot-related loss — the server\'s 47-day uptime with no reboot is exactly why the tmpfs-wipe mechanism the main page describes doesn\'t apply here at all. Per systemd\'s own documentation, "by default files in /tmp/ are cleaned up after 10 days" if they have "neither been changed nor read" in that window, via a systemd-tmpfiles-clean.timer that fires once a day regardless of reboots. Once the monitoring script was disabled 11 days ago, the heartbeat file stopped being read or rewritten — its access and modification timestamps froze — and once it crossed the 10-day-unused threshold, the very next daily timer run deleted it automatically, entirely independent of the system never having rebooted. The fix, if the file genuinely needs to persist longer than 10 days of inactivity, is either restoring the hourly write/read cycle (which keeps resetting the "unused" clock) or adding a local tmpfiles.d override extending the age threshold for that specific path.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '/tmp only ever loses data at a reboot — as long as a server\'s uptime keeps climbing without a restart, anything written to /tmp stays there indefinitely.',
      reality: 'Per this subtopic\'s theory, systemd\'s own tmpfiles.d default configuration deletes files in /tmp that go 10 days without being read or modified, via a daily timer that runs regardless of uptime — a long-running server can lose /tmp files with no reboot involved at all.'
    },
    {
      thought: 'The 10-day /tmp cleanup and the tmpfs-wipe-on-reboot behavior are the same mechanism described two different ways.',
      reality: 'Per this subtopic\'s theory, these are two genuinely independent mechanisms — tmpfs wipes /tmp\'s contents (if mounted that way) purely because reboot clears RAM, while systemd-tmpfiles-clean.timer separately deletes individual files based on how long they\'ve gone unused, on its own daily schedule that has nothing to do with reboots.'
    },
    {
      thought: 'A file in /tmp that\'s frequently rewritten or read is permanently safe from the age-based cleanup, no matter how the system is configured.',
      reality: 'Per this subtopic\'s theory, frequent access does reset the age-based "unused" clock and protects a file from THAT specific cleanup mechanism — but the same file remains fully exposed to the separate tmpfs-wipe-on-reboot mechanism, so neither factor alone guarantees persistence.'
    }
  ];
}
