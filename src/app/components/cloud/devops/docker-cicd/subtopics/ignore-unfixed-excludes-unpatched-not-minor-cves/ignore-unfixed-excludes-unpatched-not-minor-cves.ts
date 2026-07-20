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
  templateUrl: './ignore-unfixed-excludes-unpatched-not-minor-cves.html',
  styleUrl: './ignore-unfixed-excludes-unpatched-not-minor-cves.scss'
})
export class IgnoreUnfixedExcludesUnpatchedNotMinorCvesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Trivy commands both include --ignore-unfixed without ever saying what it filters out',
      points: [
        'The main page\'s own "Image Scanning & Signing" code tab runs `trivy image --exit-code 1 --severity CRITICAL,HIGH --ignore-unfixed myapp:1.0.0` — and the GitHub Actions step right below it sets `ignore-unfixed: true` too. The flag name reads plausibly as "ignore vulnerabilities that aren\'t important" or "ignore ones that were already patched" — neither of which is what it actually does.',
        'Trivy\'s own documentation is precise: "The unfixed/unfixable vulnerabilities mean that the patch has not yet been provided on their distribution. To hide unfixed/unfixable vulnerabilities, you can use the --ignore-unfixed flag." The flag excludes CVEs that have NO available fix yet — the opposite of "already patched" — not ones that are somehow less severe.',
      ]
    },
    {
      heading: 'Why this matters for what "the pipeline passed" actually means',
      points: [
        'With `--ignore-unfixed` set, a CRITICAL-severity CVE with no vendor patch available yet is silently excluded from the scan\'s pass/fail decision — the main page\'s own `--exit-code 1 --severity CRITICAL,HIGH` combination only fails the build on CVEs that BOTH meet the severity threshold AND already have a fix Trivy could theoretically flag as "you should have applied this."',
        'This is usually the right call for a CI gate — failing every build over a vulnerability nobody can currently fix would permanently block shipping until an upstream vendor happens to release a patch, which is outside the team\'s control entirely. But it means "the Trivy scan passed" is a narrower claim than "this image has no known critical vulnerabilities" — it specifically means "no FIXABLE critical vulnerabilities were left unaddressed."',
        'The main page\'s own QnA on registry scanning already recommends periodic re-scans ("New CVEs are published constantly — an image that was clean at build time may be vulnerable a month later") — the same logic applies to unfixed CVEs found today: they should be tracked somewhere (a backlog, a scheduled re-scan without --ignore-unfixed) so that once a fix DOES become available, the team notices and rebuilds, rather than the CVE staying silently excluded forever just because it was unfixed at the moment of the original scan.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What --ignore-unfixed actually excludes -- not what the name suggests',
      language: 'bash',
      code: `# Without --ignore-unfixed:
trivy image --exit-code 1 --severity CRITICAL,HIGH myapp:1.0.0

# Sample findings, unfiltered:
# CVE-2024-1111  CRITICAL  openssl     fix available: 3.0.14  <- FIXABLE
# CVE-2024-2222  CRITICAL  glibc       no fix available yet   <- UNFIXED
# CVE-2024-3333  HIGH      curl        fix available: 8.7.1   <- FIXABLE

# Exit code: 1 (build fails) -- all three count toward the failure,
# including the one nobody can currently patch.

# With --ignore-unfixed, per Trivy's own docs ("the patch has not
# yet been provided on their distribution... hide unfixed/unfixable
# vulnerabilities"):
trivy image --exit-code 1 --severity CRITICAL,HIGH --ignore-unfixed myapp:1.0.0

# Same three findings, but CVE-2024-2222 (glibc, no fix available)
# is excluded from the report AND from the exit-code decision.
# Only CVE-2024-1111 and CVE-2024-3333 -- the two with an actual
# available fix -- can fail the build.`,
    },
    {
      label: 'Why this is deliberate, not a loophole -- and what it still leaves exposed',
      language: 'bash',
      code: `# A build gate WITHOUT --ignore-unfixed would permanently block
# shipping the moment ANY unfixed critical CVE is discovered in a
# base image or dependency -- even though the team has no way to
# actually resolve it until an upstream vendor releases a patch.
# This isn't a hypothetical: unfixed CVEs in widely-used base
# images (glibc, openssl) are common and can persist for weeks.

# --ignore-unfixed keeps the build gate meaningful and actionable:
# it only blocks on things the team CAN fix right now (update a
# dependency, switch a base image, apply a patch).

# What this trades away, per this subtopic's theory: the excluded
# CVE-2024-2222 doesn't just vanish from view -- it needs a
# SEPARATE tracking mechanism so the team notices once a fix does
# ship. The main page's own QnA on registry re-scanning already
# recommends periodic scans for exactly this class of problem --
# the same discipline applies here, just for a different reason
# (waiting on a vendor patch, not a newly-discovered CVE):

# Scheduled scan, WITHOUT --ignore-unfixed, run weekly against
# images already in the registry:
trivy image --severity CRITICAL,HIGH myapp:1.0.0
# (no --exit-code here -- this is a visibility/tracking scan, not
#  a build gate -- alert/ticket on new findings instead of failing)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security engineer notices the CI pipeline\'s Trivy scan (using the main page\'s own exact flags, including `--ignore-unfixed`) reports zero critical vulnerabilities on every recent build, and concludes the application\'s dependencies are completely free of critical CVEs. A week later, a critical CVE that was actually present the whole time (but had no fix available) gets a patch released — and only then does the team realize it had been silently present for a month. Using this subtopic\'s theory, explain the gap in the security engineer\'s conclusion.',
    hint: 'Per this subtopic\'s theory, does a Trivy scan with --ignore-unfixed report "zero critical CVEs found," or "zero critical CVEs found that ALSO have an available fix"?',
    solution: 'The security engineer\'s conclusion overstated what the scan actually verified — per this subtopic\'s theory, `--ignore-unfixed` doesn\'t mean "no critical vulnerabilities exist," it means "no critical vulnerabilities that ALSO have an available fix were left unaddressed," exactly matching Trivy\'s own documented behavior of hiding "unfixed/unfixable vulnerabilities" specifically. The critical CVE was present in the image the entire time the pipeline reported "zero critical findings" — it was excluded from every scan\'s report and pass/fail decision purely because no patch existed yet, not because Trivy failed to detect it. This is exactly the gap the main page\'s own QnA on periodic re-scanning is meant to address, extended to unfixed CVEs specifically: a build-time gate with `--ignore-unfixed` is the right tool for making CI actionable, but it needs to be paired with a separate, ungated tracking scan (or alerting) so the team learns the moment a fix becomes available for something that was silently excluded before.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '`--ignore-unfixed` filters out low-severity or unimportant vulnerabilities, similar to what the `--severity CRITICAL,HIGH` flag already does.',
      reality: 'Per this subtopic\'s theory, Trivy\'s own docs define it completely differently — it excludes vulnerabilities with NO available fix yet, regardless of severity. A CRITICAL CVE with no patch is excluded by `--ignore-unfixed` just as readily as a LOW one; severity and fix-availability are two independent filters.'
    },
    {
      thought: 'A Trivy scan using --ignore-unfixed that reports zero findings means the image genuinely has no known critical/high vulnerabilities at all.',
      reality: 'This subtopic\'s exercise shows that claim is too strong — "zero findings" under `--ignore-unfixed` specifically means "zero findings that ALSO have an available fix." Unfixed critical CVEs can be present in the image the whole time without ever appearing in the scan\'s report or affecting its exit code.'
    },
    {
      thought: 'Using --ignore-unfixed in a CI gate is a shortcut that trades security for convenience — a stricter pipeline would never use it.',
      reality: 'Per this subtopic\'s theory, omitting it creates a different, arguably worse problem: a build gate that fails on vulnerabilities nobody can currently fix would permanently block shipping until an upstream vendor happens to release a patch. The flag keeps the gate actionable; the tradeoff is properly addressed by pairing it with a separate, periodic tracking scan, not by dropping the flag.'
    }
  ];
}
