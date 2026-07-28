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
  templateUrl: './external-issuer-alone-leaves-the-self-generated-trust-anchor-in-place.html',
  styleUrl: './external-issuer-alone-leaves-the-self-generated-trust-anchor-in-place.scss'
})
export class ExternalIssuerAloneLeavesTheSelfGeneratedTrustAnchorInPlaceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s cert-manager fix shows only one flag, without distinguishing two separate certificates',
      points: [
        'The main page\'s mistake block, correcting the "no rotation policy" problem, shows: "1. Create trust anchor with cert-manager Certificate CRD, 2. <code>linkerd install --identity-external-issuer</code>." Read as a single fix, this can suggest one flag externalizes everything Linkerd would otherwise self-manage — it doesn\'t make explicit that Linkerd\'s mTLS identity actually involves TWO distinct certificates with different roles.',
      ]
    },
    {
      heading: 'The two certificates: a long-lived trust anchor (root CA), and a shorter-lived issuer cert it signs',
      points: [
        'The TRUST ANCHOR (root CA) is the top of Linkerd\'s certificate chain — by default, Linkerd self-generates this with a very long TTL (on the order of 10 years) if nothing else is provided.',
        'The ISSUER certificate is signed BY the trust anchor, and is what Linkerd\'s identity service actually uses day-to-day to issue short-lived proxy certificates (the ~24-hour SVIDs each meshed pod gets). This is the certificate <code>--identity-external-issuer</code> externalizes.',
      ]
    },
    {
      heading: 'What --identity-external-issuer alone does NOT do: replace the self-generated trust anchor',
      points: [
        'Setting <code>--identity-external-issuer=true</code> on its own tells Linkerd not to auto-generate an issuer cert internally — but it does NOT, by itself, provide or externalize the trust anchor. A SEPARATE flag, <code>--identity-trust-anchors-file</code>, is what supplies an externally-managed root CA instead of letting Linkerd generate its own.',
        'The practical consequence: following the main page\'s fix literally — running <code>linkerd install --identity-external-issuer</code> without ALSO passing <code>--identity-trust-anchors-file</code> — genuinely improves the issuer cert\'s rotation story (cert-manager now handles that), but Linkerd\'s own self-generated, long-lived, non-rotated root CA is STILL what everything ultimately traces back to. The original mistake (a long-lived, unmanaged root of trust) is only partially fixed, not eliminated.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Partial fix: issuer externalized, trust anchor still self-generated',
      language: 'bash',
      code: `# Following the main page's fix literally -- ONE flag only:
linkerd install --identity-external-issuer=true \\
  | kubectl apply -f -

# What this actually achieves:
#   - The ISSUER cert now comes from cert-manager (or whatever
#     external CA controller is wired up) -- genuinely rotated,
#     genuinely improved from the original problem

# What it does NOT achieve:
#   - The TRUST ANCHOR (root CA) is still Linkerd's own
#     self-generated one, with its original long TTL and no
#     external rotation policy -- exactly the original risk,
#     just one level further up the chain

# Verify what's actually in place:
kubectl get secret linkerd-identity-trust-roots \\
  -n linkerd -o jsonpath='{.data.ca-bundle\\.crt}' | \\
  base64 -d | openssl x509 -noout -issuer -enddate
# If this shows a Linkerd-self-signed issuer and a ~10-year
# expiry, the trust anchor is STILL self-generated.`,
    },
    {
      label: 'Complete fix: externalize BOTH the trust anchor and the issuer',
      language: 'bash',
      code: `# Step 1: generate (or obtain from your PKI) an external
# root CA, save it locally
step certificate create root.linkerd.cluster.local ca.crt ca.key \\
  --profile root-ca --no-password --insecure

# Step 2: pass BOTH flags -- trust anchor AND issuer, together
linkerd install \\
  --identity-trust-anchors-file ca.crt \\
  --identity-external-issuer=true \\
  | kubectl apply -f -

# NOW both certificates in the chain are externally managed:
#   - Trust anchor: the externally-provided ca.crt, under your
#     own PKI's rotation/management policy
#   - Issuer: still handled by cert-manager (or your chosen
#     external CA controller), signed by the external trust anchor

# Verify the trust anchor is genuinely the external one, not
# Linkerd's own self-generated default:
kubectl get secret linkerd-identity-trust-roots -n linkerd \\
  -o jsonpath='{.data.ca-bundle\\.crt}' | base64 -d | \\
  diff - ca.crt && echo "Trust anchor matches the external root"`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team, following the main page\'s guidance to fix Linkerd\'s certificate rotation problem, runs linkerd install --identity-external-issuer=true with cert-manager configured to manage the issuer cert. Six months later, a security audit flags that the cluster\'s root of trust still has no rotation policy and a ~10-year expiry. The team is confused, since they explicitly configured "external" certificate management. What\'s the gap?',
    hint: 'Does --identity-external-issuer on its own externalize BOTH certificates in Linkerd\'s identity chain, or just one of them?',
    solution: 'The gap is that --identity-external-issuer only externalizes the ISSUER certificate (the one Linkerd\'s identity service uses day-to-day to sign short-lived proxy certificates) — it does not, by itself, replace the TRUST ANCHOR (root CA) at the top of the chain, which Linkerd still self-generates with its original long TTL and no external rotation policy unless a SEPARATE flag, --identity-trust-anchors-file, is also provided pointing at an externally-managed root CA. The team\'s fix genuinely improved the issuer cert\'s rotation story, but left the trust anchor exactly as it was before — the audit finding is accurate. The complete fix requires passing both flags together at install time (or performing a trust-anchor rotation afterward, a more involved operation) so both certificates in the chain are externally managed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Running linkerd install --identity-external-issuer externalizes Linkerd\'s entire certificate chain, since it\'s described as switching to "external" certificate management.',
      reality: 'Per this subtopic\'s theory, --identity-external-issuer only externalizes the issuer certificate — the trust anchor (root CA) remains Linkerd\'s own self-generated one unless a separate flag, --identity-trust-anchors-file, is also provided.'
    },
    {
      thought: 'Linkerd\'s mTLS identity relies on a single certificate that either Linkerd self-generates or an external system provides — there is no meaningful distinction between different certificates in the chain.',
      reality: 'Per this subtopic\'s theory, Linkerd\'s identity chain has two distinct certificates with different roles and lifetimes — a long-lived trust anchor (root CA) and a shorter-lived issuer cert it signs — and each can be independently self-generated or externally managed.'
    },
    {
      thought: 'If a team has configured any form of "external" certificate management for Linkerd, their root of trust is necessarily being rotated by that external system.',
      reality: 'Per this subtopic\'s theory, a partial externalization (issuer only, via --identity-external-issuer alone) leaves the actual root of trust — the trust anchor — completely unmanaged by any external system, still self-generated by Linkerd with its original long TTL.'
    }
  ];
}
