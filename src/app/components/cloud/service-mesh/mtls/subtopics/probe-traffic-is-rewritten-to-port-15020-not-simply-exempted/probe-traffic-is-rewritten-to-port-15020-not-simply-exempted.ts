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
  templateUrl: './probe-traffic-is-rewritten-to-port-15020-not-simply-exempted.html',
  styleUrl: './probe-traffic-is-rewritten-to-port-15020-not-simply-exempted.scss'
})
export class ProbeTrafficIsRewrittenToPort15020NotSimplyExemptedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s original phrasing made probe exemption sound automatic and passive',
      points: [
        'The main page originally said health probes "bypass Istio\'s mTLS because they come from the kubelet (not through Envoy)" and are "automatically exempted." This is now tightened on the main page, but it\'s worth understanding WHY — kubelet probes target the pod\'s IP directly, and Istio\'s iptables rules intercept ALL inbound traffic to the pod\'s ports regardless of who sent it. Without something ELSE happening, kubelet probe traffic would be redirected to Envoy\'s inbound listener exactly like real application traffic.',
      ]
    },
    {
      heading: 'The reality: the sidecar injector actively REWRITES the probe definition itself',
      points: [
        'When Istio injects a sidecar, it rewrites each HTTP/gRPC probe in the pod spec so the kubelet sends the request to a DIFFERENT destination: <strong>port 15020</strong> on the istio-agent, with a modified path (e.g. an original probe to <code>/healthz</code> on port 8080 becomes a request to <code>/app-health/&lt;container&gt;-liveness-http/livez</code> on port 15020).',
        'The original probe configuration (real path, port, scheme) is preserved in an environment variable — <code>ISTIO_KUBE_APP_PROBERS</code> — stored as JSON, so istio-agent can reconstruct and forward the ACTUAL check to the application afterward.',
        'Port 15020 is exposed directly by istio-agent and is deliberately excluded from Envoy\'s iptables interception rules — so probe traffic sent there never reaches Envoy\'s inbound listener at all, and never needs to satisfy STRICT mTLS. istio-agent receives the probe, forwards it to the app over localhost, and returns only the resulting status code to the kubelet.',
      ]
    },
    {
      heading: 'Why this distinction matters in practice',
      points: [
        'This rewriting is a POD-SPEC-LEVEL change, not a runtime traffic-routing decision — it happens once, at injection time (or via `kubectl patch`/redeploy for existing pods), by modifying the actual <code>livenessProbe</code>/<code>readinessProbe</code> YAML that Kubernetes stores and acts on.',
        'It can be turned OFF: the annotation <code>sidecar.istio.io/rewriteAppHTTPProbers: "false"</code> disables this rewriting for a specific pod. If it\'s disabled AND STRICT mTLS is enforced, probes genuinely DO fail — confirming the rewriting, not some magic "kubelet traffic is special" rule, is what makes probes work under STRICT.',
        'TCP probes get separate handling: istio-agent performs the port-availability check itself while deliberately avoiding the usual traffic redirection, so the kubelet\'s TCP check still succeeds without ever touching Envoy.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the pod spec looks like BEFORE injection',
      language: 'bash',
      code: `# Original pod spec (before Istio sidecar injection)
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  periodSeconds: 10`,
    },
    {
      label: 'What Istio actually rewrites it to AFTER injection',
      language: 'bash',
      code: `# What the sidecar injector rewrites this to
livenessProbe:
  httpGet:
    path: /app-health/api-liveness-http/livez
    port: 15020    # istio-agent's own status port -- NOT
                     # intercepted by Envoy's iptables rules
  periodSeconds: 10

# The ORIGINAL path/port/scheme is preserved for istio-agent
# to reconstruct the real check, via an env var on the container:
env:
- name: ISTIO_KUBE_APP_PROBERS
  value: '{"/app-health/api-liveness-http/livez":
           {"httpGet":{"path":"/healthz","port":8080}, ...}}'

# istio-agent receives the kubelet's request on 15020,
# forwards it to localhost:8080 directly (never through
# Envoy's inbound mTLS listener), and returns the status
# code to satisfy the kubelet's check.`,
    },
    {
      label: 'Disabling the rewrite (probes then genuinely fail under STRICT)',
      language: 'bash',
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  template:
    metadata:
      annotations:
        sidecar.istio.io/rewriteAppHTTPProbers: "false"
    spec:
      containers:
      - name: api
        # ... livenessProbe now hits port 8080 DIRECTLY --
        # iptables redirects it to Envoy's inbound listener
        # like any other traffic. Under STRICT mTLS, the
        # kubelet cannot present a client cert -- the
        # handshake fails -- the probe fails -- the pod
        # gets marked unhealthy and restarted repeatedly.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team disables sidecar.istio.io/rewriteAppHTTPProbers on a specific Deployment (for unrelated debugging reasons) and forgets to re-enable it. The namespace later moves to STRICT mTLS. The pods immediately start crash-looping from failed liveness probes, even though the application itself is healthy and responding fine to real mesh traffic. What\'s happening, and why does this ONLY affect this one Deployment?',
    hint: 'Without probe rewriting, where does the kubelet\'s probe request actually go, and what does Envoy require of any inbound connection under STRICT mode?',
    solution: 'With rewriteAppHTTPProbers disabled, this Deployment\'s probes were never rewritten to target istio-agent\'s port 15020 — they still target the app\'s real port directly. Once the namespace enforces STRICT mTLS, Envoy\'s inbound listener (which intercepts ALL traffic to the pod\'s real ports via iptables, regardless of source) requires a valid client certificate on every connection. The kubelet has no such certificate, so its probe connections fail the mTLS handshake — the probes fail, and Kubernetes restarts the pod repeatedly. This only affects THIS Deployment because every other pod in the namespace still has the default rewriting enabled, routing their probes to port 15020 (outside Envoy\'s interception) instead. The fix is removing the annotation (or setting it back to unset/true) so probe rewriting resumes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Kubernetes health probes work fine under STRICT mTLS simply because Istio has a special rule that recognizes kubelet-originated traffic and lets it through.',
      reality: 'Per this subtopic\'s theory, there is no traffic-origin-based exemption at all — the sidecar injector actively REWRITES the probe definition in the pod spec itself to target a different port (15020) that Envoy\'s iptables rules never intercept in the first place.'
    },
    {
      thought: 'Disabling sidecar.istio.io/rewriteAppHTTPProbers is a purely cosmetic setting with no real functional consequence under STRICT mTLS.',
      reality: 'Per this subtopic\'s theory, disabling it removes the ONLY mechanism keeping probe traffic out of Envoy\'s mTLS-enforcing inbound listener — under STRICT mode, probes on a pod with this annotation disabled genuinely fail their TLS handshake and the pod crash-loops.'
    },
    {
      thought: 'Probe rewriting is a runtime decision Envoy makes dynamically for each incoming connection based on whether it looks like a health check.',
      reality: 'Per this subtopic\'s theory, the rewriting happens once, at pod-spec level, at injection time — Kubernetes itself stores and acts on the REWRITTEN probe definition; there is no dynamic, per-request classification happening inside Envoy at all.'
    }
  ];
}
