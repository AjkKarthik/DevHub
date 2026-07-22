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
  templateUrl: './force-with-lease-isnt-foolproof-without-a-fresh-fetch.html',
  styleUrl: './force-with-lease-isnt-foolproof-without-a-fresh-fetch.scss'
})
export class ForceWithLeaseIsntFoolproofWithoutAFreshFetchSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents --force-with-lease as a safety NET — Git\'s own docs describe a specific condition where that net has a hole in it',
      points: [
        'The main page\'s own theory and quiz both describe --force-with-lease in absolute terms: "Use --force-with-lease instead of --force as a safety net," and the quiz answer states it "fails, preventing you from accidentally overwriting their work" if someone else pushed in the meantime. Nothing on the page qualifies WHEN this protection actually holds.',
        'Git\'s own documentation is explicit about what the check actually compares against: "--force-with-lease alone, without specifying the details, will protect all remote refs that are going to be updated by requiring their current value to be the same as the remote-tracking branch we have for them." The comparison is against YOUR OWN local remote-tracking ref (e.g. origin/main) — not a live, real-time check against the actual remote.',
        'Git\'s own docs state the resulting gap directly: "The protection it offers over --force is ensuring that subsequent changes your work wasn\'t based on aren\'t clobbered, but this is trivially defeated if some background process is updating refs in the background" — including something as mundane as "git fetch origin on your repository in a cronjob," which silently updates your local remote-tracking ref to match whatever is currently on the remote, defeating the entire safety check.',
      ]
    },
    {
      heading: 'What this means for the main page\'s own recommendation to "always use --force-with-lease"',
      points: [
        'If a background process (an IDE\'s auto-fetch, a cron job, a CI runner sharing the same working copy) silently updates your local origin/main between when a colleague pushed and when you run --force-with-lease, your local remote-tracking ref now ALREADY reflects their push — the safety check compares against a ref that has already "seen" the change it was supposed to protect against, and lets the force-push through anyway.',
        'This is not a hypothetical edge case for teams using common tooling defaults: many popular Git GUI clients and IDE integrations (VS Code\'s Git integration, for instance) periodically auto-fetch in the background specifically to keep branch status indicators current — exactly the kind of "background process... updating refs in the background" Git\'s own docs warn about.',
        'The precise, stronger alternative Git\'s own documentation points toward is specifying an explicit expected value: --force-with-lease=<branchname>:<expected-sha>, which compares against a SHA you name explicitly (typically captured right before the force-push) rather than whatever your local remote-tracking ref happens to currently hold — this closes the gap a bare --force-with-lease leaves open.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The gap -- a background fetch defeats the bare --force-with-lease check',
      language: 'bash',
      code: `# Scenario: you rebased locally and are about to force-push your
# feature branch. A colleague pushed a small fix to the SAME branch
# 5 minutes ago -- you haven't seen it yet.

# Your IDE (or a background cron job) silently runs:
git fetch origin
# This updates your LOCAL origin/feature-branch ref to match the
# colleague's new push -- you never explicitly ran this yourself,
# and may not even notice it happened.

# You now run the main page's own recommended safety command:
git push --force-with-lease origin feature-branch

# Per Git's own documentation: "--force-with-lease alone... will
# protect all remote refs... by requiring their current value to be
# the same as the remote-tracking branch we have for them."
#
# Your LOCAL origin/feature-branch (just silently updated by the
# background fetch) NOW MATCHES the actual remote -- because the
# fetch already pulled in the colleague's change. The lease check
# passes. The force-push SUCCEEDS -- and your colleague's commit,
# which you never actually looked at or merged with, is overwritten
# exactly as if you had used plain --force.
#
# Per Git's own docs: "this is trivially defeated if some background
# process is updating refs in the background."`,
    },
    {
      label: 'The stronger form Git\'s own docs point toward',
      language: 'bash',
      code: `# Capture the EXACT SHA you believe is currently on the remote,
# right before force-pushing -- not whatever your local
# remote-tracking ref happens to hold at push time:

EXPECTED_SHA=$(git rev-parse origin/feature-branch)
# (run this immediately before the push, in the same breath --
# minimizing the window for a background fetch to slip in between)

git push --force-with-lease=feature-branch:$EXPECTED_SHA origin feature-branch

# Per Git's own documentation, this form compares against the
# EXPLICIT SHA you named, not your local remote-tracking ref's
# current (possibly silently-updated) value. If the actual remote
# has moved past $EXPECTED_SHA for ANY reason -- including a
# background fetch updating your local ref right before this
# command ran -- the push is rejected, exactly the protection the
# bare --force-with-lease form can silently fail to provide.

# The main page's own "use --force-with-lease instead of --force"
# guidance is still directionally correct -- it's a real
# improvement over plain --force in most cases -- this subtopic
# adds the one scenario (background fetches) where the bare form's
# protection can silently fail.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer uses VS Code, which by default periodically auto-fetches from the remote in the background to keep branch status indicators (ahead/behind counts) up to date. The developer rebases their feature branch locally, then runs git push --force-with-lease origin feature-branch, following the main page\'s own recommended safety practice exactly. Unbeknownst to them, a colleague pushed a commit to the same branch 10 minutes earlier, and VS Code\'s background auto-fetch already picked it up. Using this subtopic\'s theory, predict whether the force-push succeeds or is rejected, and explain why the developer\'s use of --force-with-lease did not actually protect the colleague\'s commit in this specific case.',
    hint: 'Per this subtopic\'s theory, does --force-with-lease (without an explicit expected value) check against the ACTUAL current state of the remote, or against the developer\'s own local remote-tracking ref? Has VS Code\'s background auto-fetch already updated that local ref to include the colleague\'s commit by the time the push runs?',
    solution: 'The force-push succeeds, and the colleague\'s commit is overwritten — despite the developer correctly following the main page\'s own recommended practice. Per this subtopic\'s theory, a bare --force-with-lease "will protect all remote refs... by requiring their current value to be the same as the remote-tracking branch we have for them" — it checks against the developer\'s OWN local origin/feature-branch ref, not a live query of the actual remote. VS Code\'s background auto-fetch already updated that local ref to match the colleague\'s new push before the developer ran the force-push command, so by the time the lease check runs, the developer\'s local remote-tracking ref ALREADY reflects the colleague\'s commit — the check passes because the ref genuinely matches the remote, even though the developer themselves never looked at or incorporated that commit. This is precisely the scenario Git\'s own documentation warns about: "this is trivially defeated if some background process is updating refs in the background," naming exactly this kind of automatic, silent fetch as the failure mode. The fix, per this subtopic\'s theory, would have been capturing an explicit expected SHA immediately before pushing (git push --force-with-lease=feature-branch:$(git rev-parse origin/feature-branch)) — though even that narrows, rather than eliminates, the race window, since VS Code could still fetch between the SHA capture and the push itself.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '--force-with-lease is an absolute, foolproof safety mechanism — as long as you use it instead of plain --force, you cannot accidentally overwrite a colleague\'s work.',
      reality: 'This subtopic\'s theory quotes Git\'s own documentation directly: the protection "is trivially defeated if some background process is updating refs in the background," including something as ordinary as a periodic auto-fetch from an IDE or a cron job — a bare --force-with-lease is a real improvement over --force, but not an absolute guarantee.'
    },
    {
      thought: '--force-with-lease works by making a live network check against the actual current state of the remote at the moment you push.',
      reality: 'This subtopic\'s theory shows the bare form compares against your OWN local remote-tracking ref (e.g. origin/main), not a live query of the remote itself — if that local ref has been updated by any means (including a background fetch you didn\'t initiate), the comparison can pass even when your actual local work doesn\'t reflect what a colleague pushed.'
    },
    {
      thought: 'Since --force-with-lease can silently fail to protect against a colleague\'s work in some cases, it offers no real advantage over plain --force and teams should rely entirely on branch protection rules instead.',
      reality: 'This subtopic\'s theory and second code example show --force-with-lease still meaningfully improves on plain --force in the common case (no background fetch interference) — and the explicit-SHA form (--force-with-lease=<branch>:<sha>) closes the specific gap this subtopic describes. The main page\'s own "use --force-with-lease instead of --force" guidance remains sound; this subtopic adds precision about one specific scenario where the bare form alone isn\'t enough.'
    }
  ];
}
