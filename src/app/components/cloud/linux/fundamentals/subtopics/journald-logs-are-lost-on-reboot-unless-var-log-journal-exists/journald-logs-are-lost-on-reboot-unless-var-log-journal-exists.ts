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
  templateUrl: './journald-logs-are-lost-on-reboot-unless-var-log-journal-exists.html',
  styleUrl: './journald-logs-are-lost-on-reboot-unless-var-log-journal-exists.scss'
})
export class JournaldLogsAreLostOnRebootUnlessVarLogJournalExistsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents journald as simply "the" central log store, with no persistence caveat',
      points: [
        'The main page\'s own Init Systems theory states: "journald centralises all log collection; use journalctl to query logs rather than /var/log/messages directly." Nothing in that sentence, or anywhere else on the page, distinguishes WHERE journald actually stores that centralised data, or whether it survives the very reboot the same theory section spends its next heading describing in detail.',
        'This is a real gap given how much the page invests in the boot process immediately afterward — its own "Kernel panics and boot failures" bullet recommends journalctl -b for diagnosing a PREVIOUS boot\'s failure, an approach that silently assumes the previous boot\'s logs are still there to query at all.',
      ]
    },
    {
      heading: 'Confirmed via journald\'s own man page: storage mode depends on whether a directory exists',
      points: [
        'Per the journald.conf man page, the Storage= directive accepts "volatile", "persistent", "auto", or "none": "If \'volatile\', journal log data will be stored only in memory, i.e. below the /run/log/journal hierarchy... If \'persistent\', data will be stored preferably on disk, i.e. below the /var/log/journal hierarchy... \'auto\' behaves like \'persistent\' if the /var/log/journal directory exists, and \'volatile\' otherwise (the existence of the directory controls the storage mode)."',
        '/run is a tmpfs — RAM-backed, cleared on every reboot by design. Under "auto" mode (the setting most distro packaging effectively behaves as, whether via an explicit Storage=auto or simply because /var/log/journal was never created on a minimal install/container image), a fresh system with no /var/log/journal directory logs ONLY to /run/log/journal — meaning every boot\'s logs vanish the moment that boot ends, with no error or warning that this is happening.',
        'This directly undercuts the main page\'s own journalctl -b advice for a PREVIOUS boot: journalctl -b -1 (or any earlier negative offset) can only show a prior boot\'s logs if that boot\'s data survived past its own reboot in the first place — on a volatile-storage system, there is no previous boot to query at all, and the command simply comes back empty.',
      ]
    },
    {
      heading: 'The fix, and why it isn\'t automatic',
      points: [
        'The documented fix is exactly what the "auto" logic checks for: create the directory. sudo mkdir -p /var/log/journal followed by systemd-tmpfiles --create --prefix /var/log/journal sets the correct ownership/permissions and switches an "auto"-configured journald over to persistent storage from that point forward — no reboot or service restart is strictly required for the directory\'s existence to take effect, since journald checks it before choosing where to write.',
        'This is NOT automatic on a fresh install specifically because verbose disk-backed logging isn\'t free — it consumes disk space indefinitely unless bounded (journald has its own separate SystemMaxUse=/RuntimeMaxUse= size-limiting settings for this), and many minimal or container-oriented images intentionally avoid pre-creating /var/log/journal to keep the base footprint small and avoid unbounded disk log growth by default.',
        'The practical discipline this implies for anything the main page\'s own "boot failures" advice depends on: before relying on journalctl -b -1 (or deeper offsets) to diagnose a past boot, confirm persistent storage is actually active — journalctl --list-boots showing more than the current boot\'s entry is direct evidence that persistence is working; a list with only the current boot on an already-rebooted system is the tell that logs are being silently discarded every reboot.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking whether journald is actually persisting logs',
      language: 'bash',
      code: `# The main page's own advice: "journalctl -b for the current or
# previous boot" -- but this only works if PAST boots' logs survived.

# Check how many boots journald actually has data for:
journalctl --list-boots
# On a system with volatile-only storage that's been rebooted at
# least once, this shows ONLY the current boot (index 0) -- every
# earlier boot's logs are already gone, even though the system has
# clearly rebooted multiple times.

# Directly check which storage mode is configured:
grep -i storage /etc/systemd/journald.conf
# Storage=auto     <- the common effective default in practice

# The deciding factor for "auto" mode:
ls -ld /var/log/journal
# ls: cannot access '/var/log/journal': No such file or directory
# -> per journald.conf's own documented "auto" behavior, this
#    absence alone is what forces volatile-only storage, with no
#    separate confirmation or warning anywhere in normal operation.

# Confirm current storage location is the RAM-backed one:
ls -ld /run/log/journal
# drwxr-sr-x+ ... /run/log/journal   <- logs are landing HERE,
#                                        wiped at every reboot`,
    },
    {
      label: 'Enabling persistent storage — the documented fix',
      language: 'bash',
      code: `# Per journald.conf's own documentation, "auto" behaves like
# "persistent" as soon as /var/log/journal exists -- creating the
# directory is the entire fix, no service restart required:

sudo mkdir -p /var/log/journal
sudo systemd-tmpfiles --create --prefix /var/log/journal
# The second command sets the correct ownership/permissions per the
# systemd-tmpfiles rules already shipped for this exact path --
# skipping it can leave the directory with wrong permissions even
# though it technically exists.

# Confirm the switch took effect:
journalctl --list-boots
# After the NEXT reboot, this will show 2 entries (the boot before
# the directory was created, plus the new one) -- the boot BEFORE
# the fix is still gone forever, since the fix only changes where
# FUTURE log data goes.

# Optional: cap how much disk persistent logs are allowed to use,
# since persistent storage (unlike volatile) is no longer
# automatically bounded by reboots:
sudo sed -i 's/^#SystemMaxUse=.*/SystemMaxUse=500M/' /etc/systemd/journald.conf
sudo systemctl restart systemd-journald`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A server crashed overnight and rebooted itself. The next morning, an engineer runs journalctl -b -1 to inspect the PREVIOUS boot\'s logs for the crash cause, exactly as the main page\'s own theory recommends — and gets no output at all, not even an error. The current boot\'s own logs (journalctl -b, no offset) work fine. What\'s the most likely explanation, and how would you confirm it?',
    hint: 'Check what determines whether journald\'s storage survives a reboot at all, and what command lists exactly how many boots\' worth of data journald currently has.',
    solution: 'The most likely explanation is that journald is running in volatile-only storage mode, so the previous boot\'s logs never survived the reboot in the first place — journalctl -b -1 returning nothing isn\'t a query error, it\'s querying data that was already discarded when /run (a RAM-backed tmpfs) was cleared at boot. Confirm it by running journalctl --list-boots: on a volatile-storage system that has rebooted, this shows ONLY the current boot (index 0), with no earlier entries to select from at all. The root cause is almost always that /var/log/journal doesn\'t exist — per journald.conf\'s own documented "auto" behavior, that absence alone is what forces volatile-only storage, silently and without any warning. The fix for FUTURE incidents is creating that directory (mkdir -p /var/log/journal, then systemd-tmpfiles --create --prefix /var/log/journal) — but it does nothing to recover last night\'s already-lost crash logs, since the fix only changes where logs go from that point forward.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Because journald "centralises all log collection" as the main page states, its logs are automatically persistent and available for as long as the system has existed, across every reboot.',
      reality: 'Per this subtopic\'s theory, journald\'s own documentation makes persistence conditional — under "auto" mode (the common effective default), logs are stored only in RAM-backed /run/log/journal and lost every reboot UNLESS the /var/log/journal directory specifically exists on disk.'
    },
    {
      thought: 'journalctl -b -1 (or any negative boot offset) always works to inspect a previous boot\'s logs, since that\'s the documented way to diagnose a past failure.',
      reality: 'Per this subtopic\'s theory, that command can only return data if the previous boot\'s logs actually survived past their own reboot — on a system without persistent storage configured, there is no previous boot\'s data to query, and the command returns nothing with no error.'
    },
    {
      thought: 'Enabling persistent journal storage requires editing a config file and restarting the systemd-journald service.',
      reality: 'Per this subtopic\'s theory, under the common "auto" storage mode, the fix is simply creating the /var/log/journal directory (plus running systemd-tmpfiles --create to set correct permissions) — journald checks for the directory\'s existence directly and switches to persistent storage without needing a config edit or service restart.'
    }
  ];
}
