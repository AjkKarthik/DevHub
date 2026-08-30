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
    heading: 'Four Named Patterns, Zero Manifests',
    points: [
      'The QnA names four distinct container secret-injection patterns — environment injection, volume mount, init container, and sidecar — each described precisely in one or two sentences, none shown as an actual Kubernetes manifest.',
      'The sidecar pattern (Vault Agent Injector) is the one worth building concretely: it\'s implemented entirely through POD ANNOTATIONS, not application code — a Kubernetes mutating webhook reads them and automatically adds the Vault Agent sidecar container to the pod spec at deploy time.',
      'The application container never talks to Vault at all in this pattern — it just reads a plain file from a shared, in-memory volume that the injected sidecar keeps populated and continuously refreshed.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Deployment: Annotations Only, No App Code Changes',
    language: 'bash',
    code: `# deployment.yaml -- these THREE annotations are what the Vault Agent
# Injector's mutating webhook actually reads to decide whether and
# how to inject the sidecar.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    metadata:
      annotations:
        # Turns injection on for this pod at all.
        vault.hashicorp.com/agent-inject: "true"

        # Which Kubernetes auth role the sidecar authenticates as.
        vault.hashicorp.com/role: "myapp-role"

        # "config" is an arbitrary name -- it becomes the filename the
        # secret gets written to, and pairs with the matching
        # -template- annotation below.
        vault.hashicorp.com/agent-inject-secret-config: "secret/data/myapp/config"

        # The actual Vault template syntax controlling what gets
        # written into that file.
        vault.hashicorp.com/agent-inject-template-config: |
          {{ with secret "secret/data/myapp/config" }}
          {{ .Data.data | toJSON }}
          {{ end }}
    spec:
      containers:
        - name: myapp
          image: myapp:latest
          # No Vault client library, no VAULT_ADDR/VAULT_TOKEN env
          # vars, no code that talks to Vault at all -- this
          # container just reads a plain file.`,
  },
  {
    label: 'What the App Container Actually Sees',
    language: 'typescript',
    code: `import fs from 'fs';

// The injected sidecar writes to a well-known, fixed path -- a
// shared volume the injector mounts into EVERY container in the pod,
// application container included.
const SECRETS_PATH = '/vault/secrets/config';

function loadConfig(): Record<string, string> {
  // This file exists because the SIDECAR container (injected by the
  // webhook, running continuously alongside this one) authenticated
  // to Vault, fetched the secret, and wrote it here -- none of that
  // logic lives in this application's own code at all.
  const raw = fs.readFileSync(SECRETS_PATH, 'utf8');
  return JSON.parse(raw);
}

const config = loadConfig();
const pool = new Pool({
  host: config['DB_HOST'],
  password: config['DB_PASSWORD'],
});

// If the Vault Agent sidecar renews/refreshes the secret later (a
// short-lived credential nearing its own lease expiry, matching the
// dynamic-secrets pattern from the main page's own theory), the FILE
// gets rewritten in place -- the application needs its own logic to
// re-read it periodically if it wants to pick up a rotated value
// without a full restart.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A teammate asks: "Since the sidecar handles everything, does the application container need the <code>vault.hashicorp.com/role</code> annotation\'s Kubernetes service account to have ANY Vault permissions of its own?"',
  hint: 'Which container in the pod actually authenticates to Vault — the sidecar, or the application container itself?',
  solution: `// No -- the APPLICATION container's own service account needs no
// Vault permissions at all. The SIDECAR is what authenticates to
// Vault (using the Kubernetes auth method, presenting the pod's
// service account token as proof of identity), and it's the sidecar
// -- not the app container -- whose identity Vault's own policies
// need to authorize for "role: myapp-role."

// The application container's only interaction with the whole system
// is reading a plain file from a shared volume -- it has no Vault
// token, no network path to Vault, and no code path that could even
// ATTEMPT to authenticate to Vault directly, even if it wanted to.
// This is exactly the separation of concerns the sidecar pattern is
// designed around: the application team owns application code; the
// platform/security team owns the Vault authentication and policy
// configuration entirely through the pod's own annotations.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The Vault Agent Injector requires changing the application\'s own source code to add Vault client library calls.',
    reality: 'The application container needs ZERO Vault-specific code — it only ever reads a plain file from a shared volume. Every piece of Vault-specific logic (authentication, fetching, template rendering, refresh) lives entirely inside the injected sidecar container, configured purely through pod annotations.',
  },
  {
    thought: 'The <code>vault.hashicorp.com/agent-inject-secret-config</code> annotation directly determines the shape of the JSON written to the secrets file.',
    reality: 'That annotation only specifies WHICH Vault path to read. The PAIRED <code>agent-inject-template-config</code> annotation controls the actual OUTPUT FORMAT via Vault\'s own templating syntax — the codeTab\'s example renders the full secret data as JSON, but the template could just as easily produce a plain <code>.env</code>-style file, an INI file, or any other text format instead.',
  },
  {
    thought: 'Once a secret file is written by the sidecar, it stays static for the pod\'s entire lifetime.',
    reality: 'The sidecar keeps running alongside the application container for the pod\'s whole life specifically so it CAN refresh the file when a lease needs renewal or a secret changes — the application choosing whether and how often to re-read that file is a separate concern from whether the file itself gets updated.',
  },
];

@Component({
  selector: 'app-sec-secrets-vault-injector',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './vault-agent-injector-sidecar-pattern.html',
  styleUrl: './vault-agent-injector-sidecar-pattern.scss',
})
export class VaultAgentInjectorSidecarPatternSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
