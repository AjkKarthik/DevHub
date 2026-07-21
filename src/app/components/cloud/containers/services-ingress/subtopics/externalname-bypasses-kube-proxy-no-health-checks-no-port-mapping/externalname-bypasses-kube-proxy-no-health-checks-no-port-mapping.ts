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
  templateUrl: './externalname-bypasses-kube-proxy-no-health-checks-no-port-mapping.html',
  styleUrl: './externalname-bypasses-kube-proxy-no-health-checks-no-port-mapping.scss'
})
export class ExternalnameBypassesKubeProxyNoHealthChecksNoPortMappingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own quickRef compresses "no proxying" into four words with no unpacking',
      points: [
        'The main page\'s own quickRef entry for ExternalName reads, in full: "CNAME alias to an external DNS name — no proxying." Every other Service type\'s quickRef entry (ClusterIP, NodePort, LoadBalancer) gets a fuller behavioral description, but ExternalName\'s single defining trait — having none of the machinery every other type has — is left as a four-word aside.',
        'The main page\'s own QnA section explains port, targetPort, and nodePort in detail, but never states that an ExternalName Service has NONE of these fields at all — there is no port mapping, because there is no proxying step for a port mapping to apply to.',
      ]
    },
    {
      heading: 'What "no proxying" actually removes: selector, Endpoints, health checks, and port mapping — all of it',
      points: [
        'Per Kubernetes\' own documentation, an ExternalName Service has no selector and creates no Endpoints object at all — kube-proxy is never involved, because there is no ClusterIP to program routing rules for. CoreDNS simply answers queries for the Service\'s DNS name with a CNAME record pointing at whatever `spec.externalName` is currently set to.',
        'Because kube-proxy is never involved, none of the health-checking that every other Service type relies on applies here either — a NodePort/LoadBalancer/ClusterIP Service only sends traffic to Pods whose readinessProbe is passing (removed from Endpoints otherwise); an ExternalName Service has no concept of "is the external target healthy" at all. If the external target goes down, Kubernetes has no mechanism to detect or route around it — the DNS answer stays the same regardless.',
        'Because it is pure DNS resolution rather than a proxied connection, ExternalName inherits every general DNS-client caching risk: many client runtimes and libraries cache a successful DNS lookup for longer than its record\'s own TTL suggests, or for the lifetime of a long-running process\'s connection pool. Re-pointing `spec.externalName` to a new target changes what CoreDNS answers immediately, but any client that already resolved and cached (or already holds an open connection based on) the OLD answer keeps using it until that cache/connection naturally expires or the client process restarts.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What an ExternalName Service does NOT have, compared to ClusterIP',
      language: 'bash',
      code: `# ClusterIP -- the main page's own selector-based Service:
kubectl get endpoints api
# NAME   ENDPOINTS                         AGE
# api    10.244.1.5:3000,10.244.2.9:3000   4h
# ^ kube-proxy programs rules for these -- readinessProbe removes
#   an unhealthy one automatically.

# ExternalName -- no selector, no Endpoints object exists AT ALL:
# apiVersion: v1
# kind: Service
# metadata:
#   name: legacy-billing-db
# spec:
#   type: ExternalName
#   externalName: billing.example-vendor.com
#   # no selector -- no ports -- no targetPort -- none of it applies

kubectl get endpoints legacy-billing-db
# Error from server (NotFound): endpoints "legacy-billing-db" not found
# -- there was never anything for kube-proxy to program, because
#    there is no proxying step here to program rules for.

kubectl get svc legacy-billing-db
# NAME               TYPE           CLUSTER-IP   EXTERNAL-IP
# legacy-billing-db  ExternalName   <none>       billing.example-vendor.com
# ^ no ClusterIP was ever assigned -- it's a pure DNS CNAME record`,
    },
    {
      label: 'Re-pointing externalName does not reach already-cached clients',
      language: 'bash',
      code: `# Migrating legacy-billing-db from the external vendor to an
# in-cluster Postgres, by editing ONLY the externalName field:

kubectl patch svc legacy-billing-db -p \\
  '{"spec":{"externalName":"postgres.production.svc.cluster.local"}}'

# CoreDNS answers the NEW CNAME immediately for any FRESH lookup:
nslookup legacy-billing-db.production.svc.cluster.local
# ... CNAME postgres.production.svc.cluster.local

# But a worker Pod that resolved legacy-billing-db HOURS ago and
# has been holding a long-lived database connection pool since
# then never re-resolves DNS for that already-open connection --
# it keeps writing to the OLD external vendor database, completely
# unaware the Service's own externalName field changed underneath
# it. This has nothing to do with kube-proxy or Endpoints at all
# (there were never any) -- it's purely ordinary DNS-client and
# connection-pool caching behavior, applying to a Service the same
# way it would to any other DNS-based indirection.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team migrates from an external vendor-hosted Postgres database to an in-cluster one by updating an <code>ExternalName</code> Service\'s <code>externalName</code> field to point at the new in-cluster DNS name. Freshly-started app Pods immediately connect to the new database, but several long-running background worker Pods keep writing to the OLD external database for hours afterward, even though nothing about the worker Pods\' own deployment changed. Using this subtopic\'s theory, why?',
    hint: 'An ExternalName Service update changes what CoreDNS ANSWERS for a fresh query. What determines whether an already-running Pod actually asks CoreDNS again, versus reusing something it resolved earlier?',
    solution: 'Per this subtopic\'s theory, this happens because of ordinary DNS-client and connection-pool caching behavior, not anything Kubernetes-specific to Endpoints or kube-proxy (an ExternalName Service never has either). The freshly-started app Pods perform a brand-new DNS lookup for the Service name on startup, and CoreDNS correctly answers with the NEW CNAME target immediately after the patch. The long-running worker Pods, however, likely resolved the OLD CNAME once, long before the migration, and have been holding open, long-lived database connections (or an internally cached resolution) ever since — updating spec.externalName changes what CoreDNS WOULD answer for a fresh query, but does nothing to force an already-open connection or an already-cached resolution to re-resolve. The fix is not a Kubernetes-side change at all — it requires either restarting the long-running worker Pods (forcing a fresh DNS lookup and a fresh connection) or configuring their own database client/connection pool with a bounded connection lifetime or DNS TTL respect, so it periodically re-resolves on its own.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An ExternalName Service still has Endpoints and a port/targetPort mapping like other Service types — the main page\'s own quickRef just didn\'t list them explicitly for brevity.',
      reality: 'Per this subtopic\'s theory, ExternalName genuinely has none of these — no selector, no Endpoints object (kubectl get endpoints returns NotFound), and no port/targetPort mapping, because there is no proxying step for any of that machinery to apply to. It is pure DNS resolution, structurally different from every other Service type, not just a terser variant of the same mechanism.'
    },
    {
      thought: 'Kubernetes health-checks the external target an ExternalName Service points to, the same way it checks readinessProbe for Pods behind a normal Service.',
      reality: 'Per this subtopic\'s theory, there is no health-checking mechanism at all for an ExternalName Service\'s external target — since kube-proxy and Endpoints are never involved, Kubernetes has no way to detect or route around an unhealthy external target; the DNS answer stays exactly the same regardless of whether the target is actually reachable.'
    },
    {
      thought: 'Updating an ExternalName Service\'s externalName field takes effect for every consumer immediately, the same way updating a ClusterIP Service\'s selector reprograms kube-proxy\'s rules right away.',
      reality: 'Per this subtopic\'s exercise, a ClusterIP update is applied by kube-proxy reprogramming rules that active connections still route through, but an ExternalName update only changes what CoreDNS answers for a FRESH lookup — any client with an already-cached resolution or an already-open long-lived connection keeps using the OLD target until its own cache expires or the client restarts.'
    }
  ];
}
