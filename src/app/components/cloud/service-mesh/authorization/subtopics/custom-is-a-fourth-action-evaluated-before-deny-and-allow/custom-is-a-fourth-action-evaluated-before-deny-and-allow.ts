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
  templateUrl: './custom-is-a-fourth-action-evaluated-before-deny-and-allow.html',
  styleUrl: './custom-is-a-fourth-action-evaluated-before-deny-and-allow.scss'
})
export class CustomIsAFourthActionEvaluatedBeforeDenyAndAllowSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s quickRef and evaluation-order description only cover three actions',
      points: [
        'The main page\'s quickRef lists exactly three <code>action</code> values: ALLOW, DENY, AUDIT. Its theory states "DENY policies are evaluated first... Then ALLOW policies are evaluated" — with AUDIT running in parallel. There is a FOURTH documented action value the main page never mentions at all: <strong>CUSTOM</strong>.',
      ]
    },
    {
      heading: 'What CUSTOM is for: delegating the decision to an external system',
      points: [
        'CUSTOM lets an AuthorizationPolicy "integrate and delegate access control to an external authorization system" — configured via a named extension provider defined in <code>MeshConfig</code>, rather than evaluating <code>from</code>/<code>to</code>/<code>when</code> conditions internally the way ALLOW/DENY/AUDIT do.',
        'A real-world use case: routing the authorization DECISION itself to an external policy engine (e.g. OPA, a custom auth microservice) that can apply business logic Istio\'s own declarative rule syntax can\'t express — the extension provider makes the ALLOW/DENY call, and Envoy enforces whatever it returns.',
      ]
    },
    {
      heading: 'CUSTOM\'s place in the evaluation order: it runs FIRST, even before DENY',
      points: [
        'Per Istio\'s own documented precedence: matching <strong>CUSTOM</strong> policies are evaluated first — if a CUSTOM policy\'s external evaluation result is "deny," the request is rejected immediately. Only THEN are DENY policies evaluated, then ALLOW.',
        'A critical safety property Istio explicitly documents: a CUSTOM extension provider "cannot bypass the authorization decision made by ALLOW and DENY action" — meaning even if the external system approves a request, it still has to clear the mesh\'s own DENY and ALLOW rules afterward. CUSTOM can add an EXTRA layer of rejection, but it can never override a DENY that would otherwise apply, and it can\'t substitute for having a matching ALLOW rule either.',
        'The complete, corrected precedence order is: <strong>CUSTOM → DENY → ALLOW</strong> (with AUDIT logging in parallel throughout) — one more evaluation stage than the main page\'s three-action description implies.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Defining an extension provider (MeshConfig, one-time setup)',
      language: 'bash',
      code: `# In the Istio installation's MeshConfig (istio-system ConfigMap
# or IstioOperator spec), define a named extension provider:
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  meshConfig:
    extensionProviders:
    - name: "my-external-authz"
      envoyExtAuthzGrpc:
        service: "ext-authz.security-system.svc.cluster.local"
        port: "9000"`,
    },
    {
      label: 'Using CUSTOM to delegate a decision for one workload',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: delegate-to-external-authz
  namespace: production
spec:
  selector:
    matchLabels:
      app: sensitive-api
  action: CUSTOM
  provider:
    name: "my-external-authz"   # matches the MeshConfig entry
  rules:
  - to:
    - operation:
        paths: ["/admin/*"]
EOF
# For requests to /admin/*, Envoy calls out to the external
# authz service FIRST. Its "deny" result rejects the request
# immediately -- but even an "allow" result from the external
# system still has to pass any separate DENY/ALLOW
# AuthorizationPolicy for this workload afterward.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team configures a CUSTOM AuthorizationPolicy that delegates authorization for /admin/* to an external policy engine, and separately has a DENY policy blocking all traffic from outside the "ops" namespace. A request from outside "ops" reaches the external policy engine, which (due to a bug in its own logic) returns "allow." Does the request actually reach the application?',
    hint: 'Per Istio\'s own documentation, can a CUSTOM extension provider\'s decision override or bypass a separately-configured DENY policy?',
    solution: 'No — the request is still rejected. Istio explicitly documents that a CUSTOM extension provider "cannot bypass the authorization decision made by ALLOW and DENY action." Even though the external policy engine returned "allow" for the CUSTOM check, the request must STILL pass the mesh\'s own DENY and ALLOW policies afterward in the CUSTOM → DENY → ALLOW evaluation order. Since the separately-configured DENY policy matches (the request originates outside the "ops" namespace), it rejects the request regardless of what the external system decided. This is a deliberate safety property: a bug or compromise in an external authorization system cannot, by itself, override Istio\'s own declarative DENY rules.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'AuthorizationPolicy only supports three action values: ALLOW, DENY, and AUDIT.',
      reality: 'Per this subtopic\'s theory, there is a fourth documented action, CUSTOM, which delegates the authorization decision to an external system via a named extension provider — a capability the main page\'s quickRef never mentions.'
    },
    {
      thought: 'Since DENY policies are described as being "evaluated first" and "always winning," DENY is the earliest-evaluated stage in AuthorizationPolicy\'s decision process.',
      reality: 'Per this subtopic\'s theory, CUSTOM policies are evaluated even BEFORE DENY — the complete precedence order is CUSTOM → DENY → ALLOW, not just DENY → ALLOW as the main page\'s three-action description implies.'
    },
    {
      thought: 'If a CUSTOM extension provider approves a request (returns "allow"), that decision is final and the request proceeds to the application.',
      reality: 'Per this subtopic\'s theory, Istio explicitly documents that CUSTOM cannot bypass ALLOW/DENY decisions — an external "allow" from a CUSTOM provider still has to clear any separately-configured DENY and ALLOW AuthorizationPolicy rules afterward before the request actually reaches the application.'
    }
  ];
}
