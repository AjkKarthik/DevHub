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
  templateUrl: './uninstall-purge-does-not-reliably-remove-every-webhook.html',
  styleUrl: './uninstall-purge-does-not-reliably-remove-every-webhook.scss'
})
export class UninstallPurgeDoesNotReliablyRemoveEveryWebhookSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s uninstall steps treat --purge as a complete cleanup, without flagging a known gap',
      points: [
        'The main page\'s QnA "How do you safely uninstall Istio from a cluster?" lists five steps, ending with: "Run <code>istioctl uninstall --purge</code> to remove all Istio control plane resources and CRDs." The wording "remove all" implies a complete, reliable cleanup — worth naming what specifically is known to sometimes survive this step.',
      ]
    },
    {
      heading: 'The known gap: some webhook configurations are not reliably removed by --purge',
      points: [
        'A specifically documented case is the <code>istiod-default-validator</code> ValidatingWebhookConfiguration — <code>istioctl uninstall --purge</code> has been reported to leave it behind rather than removing it along with the rest of the control plane. More broadly, CRDs, certain webhooks, and cluster-scoped RBAC resources are known to sometimes require manual cleanup beyond what <code>--purge</code> reliably handles.',
      ]
    },
    {
      heading: 'Why a leftover webhook is a genuinely serious, cluster-wide risk — not a cosmetic leftover',
      points: [
        'A MutatingWebhookConfiguration or ValidatingWebhookConfiguration is a CLUSTER-SCOPED resource — depending on its configured <code>namespaceSelector</code>/<code>objectSelector</code> scope, a leftover webhook can intercept pod creation (or other resource operations) FAR beyond just the namespaces that used to run Istio workloads. If the webhook still points at a now-deleted Istiod service, requests to it time out or fail.',
        'Whether this actually blocks unrelated pod creation depends on the webhook\'s configured <code>failurePolicy</code> — <code>Fail</code> means a request that cannot reach the (now-deleted) backend is REJECTED, which can silently break pod scheduling cluster-wide, well outside any namespace anyone would think to associate with "the Istio uninstall that happened last week."',
        'The practical discipline: after any <code>istioctl uninstall --purge</code>, explicitly verify no Istio-related webhook configurations remain, rather than trusting <code>--purge</code>\'s name to mean "everything is definitely gone" — <code>kubectl get mutatingwebhookconfigurations,validatingwebhookconfigurations | grep istio</code> should return nothing.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Following the main page\'s uninstall steps, then checking for residue',
      language: 'bash',
      code: `# Main page's documented steps 1-5:
kubectl label ns production istio-injection-
kubectl rollout restart deployment -n production
kubectl delete virtualservices,destinationrules,gateways -A
istioctl uninstall --purge -y
kubectl delete namespace istio-system

# Step 6 (missing from the main page): VERIFY no webhooks remain
kubectl get mutatingwebhookconfigurations,validatingwebhookconfigurations \\
  | grep -i istio

# A known real-world case: this can still show something like
# istiod-default-validator   <some-age>
# -- NOT removed by --purge, despite the control plane and
# istio-system namespace both being fully gone.`,
    },
    {
      label: 'The cluster-wide blast radius of a leftover webhook',
      language: 'bash',
      code: `# Inspect what the leftover webhook actually targets
kubectl get validatingwebhookconfiguration istiod-default-validator -o yaml

# Key fields to check:
#   webhooks[].clientConfig.service  -- points at a DELETED istiod
#     service in a DELETED istio-system namespace
#   webhooks[].failurePolicy         -- if "Fail", every matching
#     request that can't reach the (nonexistent) service is REJECTED
#   webhooks[].namespaceSelector     -- if broad/unset, this can
#     match namespaces that never ran a single Istio workload

# Symptom in an UNRELATED namespace weeks later:
kubectl apply -f some-totally-unrelated-deployment.yaml
# Error from server (InternalError): error when creating
# "deployment.yaml": Internal error occurred: failed calling
# webhook "validation.istio.io": failed to call webhook: ...
# no endpoints available for service "istiod" in "istio-system"

# Fix: explicitly delete the orphaned webhook config
kubectl delete validatingwebhookconfiguration istiod-default-validator`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team fully uninstalls Istio from a cluster following the main page\'s documented steps, including istioctl uninstall --purge, and deletes the istio-system namespace. Three weeks later, a completely unrelated team\'s deployment in a different namespace — one that never ran Istio — starts failing with a webhook error referencing "istiod" and "no endpoints available." Istio has been gone for weeks and this namespace never used it. What\'s the most likely explanation?',
    hint: 'Is a Kubernetes admission webhook configuration a namespace-scoped resource, or a cluster-scoped one that can affect operations far beyond where it was originally relevant?',
    solution: 'The most likely explanation is a leftover Istio ValidatingWebhookConfiguration or MutatingWebhookConfiguration (a known gap, e.g. istiod-default-validator) that istioctl uninstall --purge did not reliably remove. Since webhook configurations are cluster-scoped resources, a surviving one can intercept operations across namespaces it was never meaningfully "used" by, depending on its namespaceSelector/objectSelector scope — and since it still points at the now-deleted istiod service, any matching request fails outright if the webhook\'s failurePolicy is Fail. The fix is explicitly checking for and deleting any remaining Istio-related webhook configurations after uninstall (kubectl get mutatingwebhookconfigurations,validatingwebhookconfigurations | grep istio) rather than trusting --purge to have removed everything just because its name suggests a complete cleanup.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Running istioctl uninstall --purge, as the main page\'s own uninstall steps recommend, guarantees every Istio-related resource — including all webhook configurations — is completely removed from the cluster.',
      reality: 'Per this subtopic\'s theory, specific webhook configurations (e.g. istiod-default-validator) are a known gap that --purge does not reliably remove — despite the command\'s name suggesting a complete cleanup, manual verification is still needed.'
    },
    {
      thought: 'A leftover Istio webhook configuration after uninstall can only affect namespaces that previously ran Istio workloads, since that\'s the context it was originally configured for.',
      reality: 'Per this subtopic\'s theory, webhook configurations are cluster-scoped resources — depending on their namespaceSelector/objectSelector configuration, a leftover one can intercept operations in namespaces that never ran Istio at all, breaking unrelated teams\' deployments weeks after the "unrelated" Istio uninstall.'
    },
    {
      thought: 'If a leftover webhook pointed at a deleted service, Kubernetes would simply skip that webhook and let the operation proceed normally, since the backend obviously no longer exists.',
      reality: 'Per this subtopic\'s theory, whether the operation proceeds or is rejected depends entirely on the webhook\'s failurePolicy setting — a Fail policy means any request the webhook cannot reach is actively REJECTED, not silently skipped, which is precisely what breaks unrelated deployments.'
    }
  ];
}
