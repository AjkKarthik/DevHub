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
  templateUrl: './the-ca-secret-is-named-cacerts-not-istio-ca-secret.html',
  styleUrl: './the-ca-secret-is-named-cacerts-not-istio-ca-secret.scss'
})
export class TheCaSecretIsNamedCacertsNotIstioCaSecretSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine, self-contradicting inaccuracy caught during this batch',
      points: [
        'The main page\'s own "Custom CA via cert-manager" code example correctly uses <code>secretName: cacerts</code>, with the comment "Istio reads this secret name." But a separate theory bullet, describing emergency CA rotation for the AUTO-GENERATED self-signed CA, said to delete a secret named <code>istio-ca-secret</code> instead — an inconsistency WITHIN the same page. Verified against Istio\'s own history and current behavior, <code>istio-ca-secret</code> is now outdated. The main page has been corrected to use <code>cacerts</code> consistently in both places.',
      ]
    },
    {
      heading: 'The reality: modern Istio unified two historically separate secret names into one',
      points: [
        'Historically, Istio used TWO different secret names depending on the CA source: <code>cacerts</code> for a user-plugged-in custom CA, and <code>istio-ca-secret</code> for Istiod\'s own auto-generated self-signed CA. This split was itself a common source of confusion.',
        'A completed consolidation effort merged these into a single, unified secret name: <strong>cacerts</strong> — used for BOTH the self-signed case and the custom-CA case. Per Istio\'s own tracked change: "the creation of a cacerts Secret rather than an istio-ca-secret Secret when there are no preexisting CA secrets in the cluster" is now the actual behavior when Istiod generates its own root CA.',
        'An <code>istio-generated</code> key inside the secret is what now distinguishes "Istiod made this one itself" from "a human/cert-manager plugged this one in" — the SECRET NAME itself is no longer the signal for that distinction, unlike in the older two-secret-name scheme.',
      ]
    },
    {
      heading: 'Why the old name still shows up in guides and muscle memory',
      points: [
        'Because <code>istio-ca-secret</code> was the correct name for a real, substantial period of Istio\'s history, it persists in older blog posts, Stack Overflow answers, and — as this batch found — even in content that otherwise correctly uses <code>cacerts</code> elsewhere on the very same page.',
        'Practical takeaway: when running an emergency CA rotation or debugging a "why isn\'t my custom CA being picked up" issue on a CURRENT Istio installation, always check for a secret literally named <code>cacerts</code> in the root namespace first — a runbook or internal wiki page referencing <code>istio-ca-secret</code> may be describing outdated behavior.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Outdated: the old two-name scheme (do not rely on this today)',
      language: 'bash',
      code: `# OUTDATED -- do not use on a current Istio installation
kubectl -n istio-system delete secret istio-ca-secret
# This secret name was used historically for Istiod's own
# auto-generated self-signed CA, SEPARATELY from "cacerts"
# (which was reserved for a user-plugged custom CA).`,
    },
    {
      label: 'Current: the unified cacerts secret, for BOTH CA sources',
      language: 'bash',
      code: `# CURRENT -- correct on modern Istio, for EITHER CA source
kubectl -n istio-system get secret cacerts -o yaml
# Whether Istiod generated this itself (self-signed) or a
# human/cert-manager plugged in a custom CA, the secret is
# named "cacerts" -- an internal "istio-generated" key
# distinguishes the two cases, not the secret's own name.

# Emergency rotation of the auto-generated self-signed CA:
kubectl -n istio-system delete secret cacerts
# Istiod detects the missing secret on next reconcile and
# generates a brand-new self-signed root -- all existing
# proxy certs become invalid until redistributed.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform engineer follows an old internal runbook that says "to force-rotate the Istio CA in an emergency, delete the istio-ca-secret Secret in istio-system." They run this command against a current Istio installation and see no error, but nothing seems to happen — Istiod continues signing certificates with the same CA as before. What\'s actually going on?',
    hint: 'Has the secret name Istio uses for its auto-generated CA changed since older runbooks and blog posts were written?',
    solution: 'The command silently succeeds at the kubectl level (deleting a secret that either doesn\'t exist, or is a leftover/unrelated secret with that old name, produces no meaningful side effect on the running CA), but it has no actual effect on Istiod\'s active CA. Modern Istio stores its CA certificate — whether self-signed or custom — in a secret named cacerts, not istio-ca-secret. The runbook is describing outdated behavior from before the consolidation. The correct emergency rotation command targets the cacerts secret instead: kubectl -n istio-system delete secret cacerts.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Istio uses two different secret names — cacerts for a custom CA, and istio-ca-secret for its own auto-generated self-signed CA — as a way to distinguish the two cases.',
      reality: 'Per this subtopic\'s theory (a genuine inaccuracy caught and corrected on the main page during this batch), that two-name scheme is now outdated — current Istio uses a single unified cacerts secret for BOTH cases, distinguished internally by an istio-generated key rather than by the secret\'s own name.'
    },
    {
      thought: 'Since istio-ca-secret was a real, documented secret name at some point, it\'s safe to assume it still works as an alternate or fallback name on current Istio installations.',
      reality: 'Per this subtopic\'s theory, deleting a secret by that old name has no effect on a current installation\'s actual CA — the running Istiod is watching for cacerts specifically, so a command targeting the old name silently does nothing useful.'
    },
    {
      thought: 'The main page\'s own "Custom CA via cert-manager" example (which correctly says cacerts) and its "Emergency cert rotation" bullet (which said istio-ca-secret) were describing two genuinely different, correct secret names for two different scenarios.',
      reality: 'Per this subtopic\'s theory, this was a real internal inconsistency on the main page, not two correct facts for different scenarios — both the self-signed and custom-CA cases now use the exact same cacerts secret name on current Istio.'
    }
  ];
}
