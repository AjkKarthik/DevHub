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
  templateUrl: './kubernetes-secrets-are-base64-not-encrypted-by-default.html',
  styleUrl: './kubernetes-secrets-are-base64-not-encrypted-by-default.scss'
})
export class KubernetesSecretsAreBase64NotEncryptedByDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page lists "Kubernetes Secrets (with encryption at rest)" as if encryption were a given — it is explicitly opt-in',
      points: [
        'The main page\'s own Secrets Management theory lists tools in one breath: "HashiCorp Vault, Azure Key Vault, AWS Secrets Manager, GCP Secret Manager, Kubernetes Secrets (with encryption at rest)." The parenthetical reads as a description of what Kubernetes Secrets already are — encrypted at rest — grouped alongside genuinely encrypted-by-default services like Vault and the cloud secret managers.',
        'Kubernetes\' own official documentation states the opposite as the default: "Kubernetes Secrets are, by default, stored unencrypted in the API server\'s underlying data store (etcd). Anyone with API access can retrieve or modify a Secret, and so can anyone with access to etcd." The word "default" is doing real work here — this is the out-of-the-box behavior, not a worst-case misconfiguration.',
        'What Secrets DO get by default is base64 ENCODING, not encryption — a Secret\'s data field is base64 text, and base64 is a reversible, non-secret text transformation (anyone can decode it with zero effort, no key required) that exists purely to let arbitrary binary data fit into a text-based YAML/JSON field, not to protect the value from being read.',
      ]
    },
    {
      heading: 'What "encryption at rest" actually requires, and why the gap matters',
      points: [
        'Kubernetes\' own documentation is direct about the fix being a required, explicit step, not an automatic property: "In order to safely use Secrets, take at least the following steps: 1. Enable Encryption at Rest for Secrets." This is phrased as a mandatory first step for SAFE use, not an optional hardening measure — implying Secrets are not safe to use as-is without it.',
        'Enabling it requires cluster-admin-level configuration — an EncryptionConfiguration resource applied to the API server specifying which encryption provider to use (aescbc, kms, secretbox, etc.) — something application developers deploying to a cluster they do not administer often have no visibility into or control over. A team following the main page\'s own Secrets Management guidance could reasonably deploy Secrets to a cluster where this step was never actually performed.',
        'This directly affects the main page\'s own broader secrets-management principle ("Never store secrets in source control") — moving a secret OUT of source control and INTO a Kubernetes Secret is a real improvement (it is no longer in git history forever), but it does not automatically achieve "encrypted at rest" the way storing the same value in Vault or a cloud secrets manager does by default. Anyone with read access to the cluster\'s etcd backups, or sufficient API/RBAC permissions, can retrieve the plaintext value either way unless encryption at rest was separately configured.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What a Kubernetes Secret actually contains by default',
      language: 'bash',
      code: `# Create a Secret the way most teams do -- kubectl or a manifest.
kubectl create secret generic db-credentials \\
  --from-literal=password='Sup3rS3cr3t!'

# Read it back:
kubectl get secret db-credentials -o jsonpath='{.data.password}'
# U3VwM3JTM2NyM3QhCg==

# This LOOKS protected -- it's not human-readable text. But base64
# is not a cipher; it needs no key to reverse:
echo 'U3VwM3JTM2NyM3QhCg==' | base64 -d
# Sup3rS3cr3t!

# Per Kubernetes' own documentation: "Kubernetes Secrets are, by
# default, stored unencrypted in the API server's underlying data
# store (etcd). Anyone with API access can retrieve or modify a
# Secret, and so can anyone with access to etcd."
#
# Anyone with:
#   - "kubectl get secret" RBAC permission, OR
#   - direct read access to etcd (including etcd backup files!)
# can recover this password with zero additional effort -- no
# decryption key, no brute-forcing, just base64 -d.`,
    },
    {
      label: 'What actually enabling encryption at rest requires',
      language: 'bash',
      code: `# Per Kubernetes' own documentation, safe use of Secrets requires
# explicitly enabling this -- it is step 1 of "at least the
# following steps" the docs list, not automatic.

# An EncryptionConfiguration resource, applied to the API server
# (this is CLUSTER-ADMIN level configuration, not something a
# typical application team deploying INTO a cluster controls):

# /etc/kubernetes/enc/enc.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
      - secrets
    providers:
      - aescbc:
          keys:
            - name: key1
              secret: <base64-encoded-32-byte-key>
      - identity: {}   # fallback -- unencrypted (must NOT be first)

# The API server is then started with:
# --encryption-provider-config=/etc/kubernetes/enc/enc.yaml

# Only AFTER this is configured cluster-wide does new Secret data
# actually get encrypted before being written to etcd -- and even
# then, per Kubernetes' own guidance, EXISTING Secrets written
# before encryption was enabled remain unencrypted in etcd until
# they are individually re-written (e.g. via "kubectl get secrets
# --all-namespaces -o json | kubectl replace -f -").

# Managed Kubernetes services (EKS, GKE, AKS) increasingly enable
# this by default or offer it as a one-click option -- but "by
# default" varies by PROVIDER and CLUSTER VERSION, not by
# Kubernetes itself. Never assume it without checking the specific
# cluster's own configuration.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team migrates database passwords out of a config file in source control and into Kubernetes Secrets, following the main page\'s own Secrets Management guidance. In a security review, they confidently state "our secrets are encrypted at rest now, since we use Kubernetes Secrets." The reviewer asks one specific follow-up question that reveals this claim may not be true. Using this subtopic\'s theory, identify what that question is, and explain what evidence the team would need to actually support their claim.',
    hint: 'Per this subtopic\'s theory, is "encryption at rest for Secrets" an automatic property of using Kubernetes Secrets, or a separately configured, cluster-admin-level feature? What specific cluster configuration would the reviewer need to see evidence of?',
    solution: 'The reviewer\'s question should be some version of "has encryption at rest for Secrets actually been enabled on this specific cluster, and can you show the EncryptionConfiguration?" — because per this subtopic\'s theory, Kubernetes\' own documentation states Secrets "are, by default, stored unencrypted in the API server\'s underlying data store (etcd)," and enabling encryption is an explicit, cluster-admin-level configuration step (an EncryptionConfiguration resource applied to the API server), not an automatic consequence of using the Secret object type. Moving the password out of source control and into a Kubernetes Secret is a real improvement over the original config-file approach — it is no longer permanently embedded in git history — but "our secrets are encrypted at rest" is a claim about etcd storage that requires independent verification. The team would need to show either (1) direct evidence of an active EncryptionConfiguration on the API server specifying a real provider (not identity, which is the unencrypted fallback), confirmed for the specific cluster in question, or (2) documentation from their managed Kubernetes provider (EKS/GKE/AKS) confirming encryption at rest is enabled for that specific cluster by default — since, per this subtopic\'s theory, this varies by provider and cluster configuration rather than being guaranteed by Kubernetes itself.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Kubernetes Secrets are encrypted at rest by default — that is what distinguishes the Secret object type from a ConfigMap, and is why the main page groups it alongside Vault and cloud secrets managers.',
      reality: 'This subtopic\'s theory quotes Kubernetes\' own documentation directly: Secrets "are, by default, stored unencrypted in the API server\'s underlying data store (etcd)." What actually distinguishes a Secret from a ConfigMap by default is mainly conventional handling (kubectl masks values in some output, RBAC can be scoped separately) — not automatic encryption.'
    },
    {
      thought: 'A Secret\'s data being base64-encoded in kubectl output means the value is protected — reading it back out requires some form of decryption.',
      reality: 'This subtopic\'s first code example shows base64 is a reversible ENCODING, not encryption — no key is needed, and a single `base64 -d` command recovers the original plaintext instantly. It exists so binary data fits into a text field, not to protect the value from anyone with read access.'
    },
    {
      thought: 'Once encryption at rest is enabled on a cluster, every Secret already stored in etcd — including ones created before encryption was turned on — is automatically protected going forward.',
      reality: 'This subtopic\'s second code example notes existing Secrets written before encryption was enabled remain unencrypted in etcd until they are individually re-written — enabling the feature only affects NEW writes, not retroactively re-encrypting already-stored data, unless those Secrets are explicitly rewritten after the fact.'
    }
  ];
}
