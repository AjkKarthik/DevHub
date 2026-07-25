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
  templateUrl: './the-state-serial-number-is-what-detects-a-stale-state-push.html',
  styleUrl: './the-state-serial-number-is-what-detects-a-stale-state-push.scss'
})
export class TheStateSerialNumberIsWhatDetectsAStaleStatePushSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s "use with caution" for state push never explains the actual safety mechanism',
      points: [
        'The main page\'s quick reference lists <code>terraform state push</code> with just "Upload local state to remote backend (use with caution)" — true, but it never explains WHAT makes it risky beyond the general "state push overwrites the backend" intuition, or what (if anything) protects against the obvious danger of pushing an outdated snapshot.',
      ]
    },
    {
      heading: 'Every state file carries a serial number that increments on every state-changing operation',
      points: [
        'Terraform state includes a <code>serial</code> field that increments by one every time the state changes — this is a monotonically increasing counter tracking how many times that state has been modified, independent of locking (which only prevents SIMULTANEOUS writes, not a stale, out-of-date write happening at a completely different time).',
        'When <code>terraform state push</code> is run, Terraform compares the <code>serial</code> in the state being pushed against the <code>serial</code> already present in the destination backend — if the destination\'s serial is HIGHER than the one being pushed, Terraform refuses the push, since a higher remote serial means changes have already happened there that the local snapshot being pushed knows nothing about.',
      ]
    },
    {
      heading: 'A separate check: the lineage — and why -force bypasses both checks entirely',
      points: [
        'A second, independent check compares the state\'s <code>lineage</code> — a value that identifies which "family" of state history a given file belongs to. If the lineage values differ entirely (not just an older serial within the same lineage, but a genuinely different state history), Terraform refuses the push outright, since this indicates the two state files are not even related snapshots of the same infrastructure.',
        'The <code>-force</code> flag on <code>state push</code> bypasses BOTH the serial check and the lineage check — this is precisely why the main page\'s own "use with caution" applies most sharply to <code>-force</code>: without it, the serial/lineage checks already catch the most common accidental-stale-push mistakes; WITH it, those safety checks are deliberately disabled, and pushing the wrong or genuinely stale snapshot can silently overwrite the backend\'s real, current state — the single source of truth Terraform uses to map configuration to real infrastructure.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The check that runs by default',
      language: 'bash',
      code: `# Pull a local copy to inspect/edit, unaware that a teammate's
# CI run has since applied changes to the remote state:
terraform state pull > local-copy.json
# local-copy.json has, say, "serial": 42

# Meanwhile, a teammate's CI run applies successfully, bumping
# the REMOTE state's serial to 43.

# Attempting to push the now-outdated local copy back:
terraform state push local-copy.json
# Error: serial 42 for the given state is not greater than
#   the current serial 43. Cowardly refusing to push a state
#   which may be older than the current state.
# This is the "safety net" the main page's "use with caution"
# note never actually names -- the serial comparison is what
# just prevented this stale overwrite from happening silently.`,
    },
    {
      label: '-force bypasses both the serial AND lineage checks',
      language: 'bash',
      code: `# -force overrides BOTH safety checks at once -- not just a
# way to push "a little more assertively":
terraform state push -force local-copy.json
# Now succeeds even though local-copy.json's serial (42) is
# LOWER than the backend's current serial (43) -- the pushed
# state OVERWRITES the backend, silently discarding whatever
# changes the teammate's CI run had already applied and
# recorded there.

# A DIFFERENT lineage (genuinely unrelated state history --
# e.g. local-copy.json is actually from a completely different
# project) is refused even harder by default:
# Error: lineage does not match; expected <backend-lineage>
# -force bypasses this check too -- pushing a state from a
# totally different infrastructure history onto this backend.

# Safer standard workflow: let Terraform's own commands
# (state mv, state rm, apply) modify the REMOTE state directly
# -- avoid a manual pull -> edit -> push round trip entirely
# unless there is no other option.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer runs `terraform state pull > local.json` to inspect state locally, intending to push it back after a manual review. Before they get around to pushing it, a teammate\'s CI pipeline successfully applies a change, updating the remote state. The developer then runs `terraform state push local.json` — expecting it to simply succeed since it is a valid, previously-pulled state file. What actually happens by default, and what specific field in the state file is the reason?',
    hint: 'What field increments every time a state file changes, and what does state push compare that field against before allowing an upload?',
    solution: 'By default, the push is REFUSED. Every state file carries a serial field that increments by one on every state-changing operation — the teammate\'s successful CI apply bumped the remote state\'s serial higher than the serial in the developer\'s locally-pulled copy. terraform state push compares these serial values before allowing an upload, and refuses the push when the destination\'s serial is higher than the one being pushed, since that means changes have already happened remotely that the local snapshot knows nothing about. This safety check only bypasses if the developer explicitly adds the -force flag, which disables both the serial check and a separate lineage check — deliberately overwriting the backend\'s current, up-to-date state with the older local copy.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'terraform state push simply uploads whatever local state file is given, with no safety check against accidentally overwriting newer remote changes.',
      reality: 'Per this subtopic\'s theory, state push compares the pushed state\'s serial number against the destination backend\'s current serial by default, and refuses the push if the destination is newer — this default safety check is what the main page\'s own "use with caution" note never actually names.'
    },
    {
      thought: 'State locking (preventing simultaneous concurrent applies) is the same protection mechanism that prevents pushing an outdated state snapshot.',
      reality: 'Per this subtopic\'s theory, these are two separate mechanisms — locking prevents SIMULTANEOUS writes at the same moment, while the serial number comparison specifically catches a stale push happening at a completely different, later time, after the destination has already moved on.'
    },
    {
      thought: 'The -force flag on state push is a minor convenience flag for skipping an unnecessary confirmation prompt.',
      reality: 'Per this subtopic\'s theory, -force disables BOTH the serial check and the lineage check entirely — it is not a confirmation-skip, it is the specific mechanism that allows a genuinely stale or even completely unrelated state file to silently overwrite the backend\'s real current state.'
    }
  ];
}
