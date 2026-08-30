import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'The QnA Names Every Piece — Fulcio, Rekor, OIDC — Never the Actual Commands',
    points: [
      'The main page’s own QnA describes Sigstore’s keyless signing flow in real mechanical detail — Cosign, Fulcio (ephemeral certificate authority), Rekor (transparency log), OIDC identity tokens — but no codeTab on the page shows the actual <code>cosign</code> commands a developer would run.',
      'Verified against Sigstore’s own official docs before writing: keyless signing is <code>cosign sign &lt;image-uri&gt;</code> — no key files, no <code>--key</code> flag. Cosign generates an ephemeral in-memory keypair, exchanges an OIDC identity token for a short-lived Fulcio certificate binding that key to the signer’s identity, signs with it, then DESTROYS the private key immediately after.',
      'Verification requires pinning the EXPECTED identity: <code>cosign verify --certificate-identity=&lt;identity&gt; --certificate-oidc-issuer=&lt;issuer&gt; &lt;image-uri&gt;</code> — without these flags, verification only proves SOME valid Sigstore signature exists, not that it came from the identity you actually trust.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Signing an Image — the Actual Commands',
    language: 'bash',
    code: `# ── Keyless signing: no key files, no --key flag at all ─────────────────────
# Verified against Sigstore's own official cosign documentation.

cosign sign gcr.io/myproject/api:v1.4.0

# What actually happens, in order:
# 1. Cosign generates a fresh public/private keypair -- IN MEMORY ONLY,
#    never written to disk.
# 2. It opens a browser (or prints a device-flow link in a CI context
#    with no attached terminal) for an OIDC login -- GitHub Actions'
#    own built-in OIDC token provider, Google, or any configured
#    OIDC issuer.
# 3. Fulcio verifies that identity token and issues a SHORT-LIVED
#    certificate binding the ephemeral public key to that identity
#    (e.g. "ci@github.com/myorg/myrepo").
# 4. Cosign signs the image digest with the ephemeral private key,
#    then immediately DESTROYS it -- there is no long-lived signing
#    key to leak, rotate, or steal.
# 5. The signature, certificate, and artifact hash are uploaded to
#    Rekor, an append-only transparency log -- a public, auditable
#    record of exactly when this signature was created.

# ── In GitHub Actions CI (no browser -- uses the workflow's own OIDC token) ──
# permissions:
#   id-token: write   # required -- grants the workflow an OIDC token
# steps:
#   - run: cosign sign \${{ steps.build.outputs.image }}@\${{ steps.build.outputs.digest }}`,
  },
  {
    label: 'Verifying — Pinning the Exact Identity You Trust',
    language: 'bash',
    code: `# ── Verification MUST pin the expected identity and issuer ──────────────────
# Without these two flags, verify only proves "a valid Sigstore
# signature from SOME identity exists" -- not that it's YOUR CI
# pipeline's identity specifically.

cosign verify \\
  --certificate-identity="https://github.com/myorg/myrepo/.github/workflows/build.yml@refs/heads/main" \\
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \\
  gcr.io/myproject/api:v1.4.0

# A successful verify confirms THREE things at once:
# - the signature is cryptographically valid for this exact artifact
# - the signing certificate was issued by Fulcio to the identity
#   named in --certificate-identity, via the issuer named in
#   --certificate-oidc-issuer
# - a matching entry exists in Rekor's transparency log, timestamped

# ── Enforcing this at deployment time with a Kubernetes admission policy ────
# apiVersion: policy.sigstore.dev/v1beta1
# kind: ClusterImagePolicy
# metadata: { name: require-signed-images }
# spec:
#   images: [{ glob: "gcr.io/myproject/**" }]
#   authorities:
#     - keyless:
#         identities:
#           - issuer: https://token.actions.githubusercontent.com
#             subject: https://github.com/myorg/myrepo/.github/workflows/build.yml@refs/heads/main
# # An unsigned image, or one signed by a DIFFERENT identity, is
# # rejected at admission -- never scheduled onto the cluster at all.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate runs <code>cosign verify gcr.io/myproject/api:v1.4.0</code> with NO <code>--certificate-identity</code> or <code>--certificate-oidc-issuer</code> flags, sees it succeed, and concludes "verified — this image is safe to deploy." What is actually being proven here, and what is NOT?',
  hint: 'Anyone with an OIDC identity (a personal GitHub account, a completely unrelated organization’s CI pipeline) can also run <code>cosign sign</code> against an image they control. What does a bare, flagless <code>verify</code> actually check?',
  solution: `// A flagless "cosign verify" only proves the image has SOME valid
// Sigstore signature -- cryptographically well-formed, backed by a
// real Fulcio certificate, logged in Rekor. It says NOTHING about
// WHO signed it.

// Sigstore's keyless signing is available to anyone with an OIDC
// identity -- there's no gatekeeping on WHO can sign SOME artifact
// with THEIR OWN identity. An attacker who can push to a registry
// (or who publishes a look-alike image under a similar name) can
// sign it with their own personal GitHub account and it will still
// pass a bare "cosign verify" with flying colors.

// The --certificate-identity and --certificate-oidc-issuer flags are
// what turn "a signature exists" into "a signature from the SPECIFIC
// pipeline/identity I actually trust exists." Without pinning those,
// verification provides essentially no security guarantee at all --
// it's the equivalent of checking that a package has A signature,
// without checking WHOSE signature it is.

// This is exactly why the ClusterImagePolicy example above pins both
// the issuer AND the subject (the specific workflow file and branch)
// -- admission control has to enforce the SAME identity-pinning
// discipline a manual "cosign verify" call needs to be told about
// explicitly.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Keyless signing means "no signing key is involved at all" — there’s nothing to protect.',
    reality: 'A real, cryptographic public/private keypair IS generated and used for every signature — it’s just EPHEMERAL: created fresh in memory for that one signing operation, and destroyed immediately afterward. "Keyless" describes the absence of a LONG-LIVED key the signer has to store, protect, and rotate — not the absence of cryptography.',
  },
  {
    thought: 'Rekor’s transparency log is what actually verifies the signature is legitimate.',
    reality: 'Rekor provides an auditable, public RECORD of when a signature was created — proving the signature existed at a specific point in time and hasn’t been silently created after the fact. The actual cryptographic verification (does this signature match this artifact, was this certificate really issued by Fulcio) is a separate check <code>cosign verify</code> performs directly against the signature and certificate themselves.',
  },
  {
    thought: 'Once you pin <code>--certificate-oidc-issuer</code>, you don’t also need <code>--certificate-identity</code> — the issuer alone is enough to trust the signer.',
    reality: 'The issuer only proves WHICH OIDC provider vouched for the identity (e.g. "this came from SOME GitHub Actions workflow somewhere") — it says nothing about WHICH repository or workflow. <code>--certificate-identity</code> is what narrows it down to your SPECIFIC pipeline; omitting it means any GitHub Actions workflow, in any repository, run by anyone, would pass verification.',
  },
];

@Component({
  selector: 'app-sec-supply-chain-cosign',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './cosign-keyless-signing-the-actual-cli-flow.html',
  styleUrl: './cosign-keyless-signing-the-actual-cli-flow.scss',
})
export class CosignKeylessSigningTheActualCliFlowSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
