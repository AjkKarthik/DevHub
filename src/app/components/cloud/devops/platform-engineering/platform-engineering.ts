import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-devops-platform-engineering',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './platform-engineering.html',
  styleUrl: './platform-engineering.scss'
})
export class DevopsPlatformEngineering {

  quickRef: QuickRefItem[] = [
    { name: 'IDP',              type: 'keyword', desc: 'Internal Developer Platform — curated self-service layer abstracting infra complexity from product teams' },
    { name: 'Golden Path',      type: 'keyword', desc: 'Opinionated, supported template for building and deploying services — the recommended way with guardrails' },
    { name: 'Backstage',        type: 'keyword', desc: 'Open-source developer portal by Spotify — software catalogue, templates, TechDocs, and plugin ecosystem' },
    { name: 'Cognitive Load',   type: 'keyword', desc: 'Mental effort required to understand and work with a system — platform engineering aims to reduce it for developers' },
    { name: 'Platform Team',    type: 'keyword', desc: 'Team Topologies stream-aligned enabler — builds the platform as a product that other teams self-serve' },
    { name: 'Paved Road',       type: 'keyword', desc: 'Alternative name for golden path — the well-maintained route that most teams should follow' },
    { name: 'Self-Service',     type: 'keyword', desc: 'Developers can provision environments, databases, and pipelines without raising ops tickets' },
    { name: 'Software Catalogue', type: 'keyword', desc: 'Registry of all services, APIs, libraries, and teams — provides discoverability and ownership metadata' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Platform Engineering?',
      points: [
        'Platform engineering builds and maintains an Internal Developer Platform (IDP) — a self-service layer that abstracts infrastructure complexity from product engineering teams.',
        'The goal: reduce cognitive load and toil so product teams spend more time building features and less time managing infrastructure, pipelines, and tooling.',
        'Platform engineering treats the platform as a product — with users (developers), a product roadmap, SLAs, and active feedback loops.',
        'It is the evolution of DevOps tooling at scale: when an organisation has many teams, each re-solving the same infra problems, a shared platform provides leverage.',
      ]
    },
    {
      heading: 'Internal Developer Platform (IDP)',
      points: [
        'An IDP is not a single tool — it is a curated, integrated set of tools and workflows that developers access through a single interface.',
        'Core capabilities: self-service environment provisioning, CI/CD pipeline templates, secrets management, observability stack, cost visibility.',
        'The interface is often a developer portal (Backstage) that provides a software catalogue, scaffolding templates, runbooks, and API docs.',
        'Key principle: the platform should be opinionated enough to provide guardrails but flexible enough that teams can escape the defaults when genuinely needed.',
        'Adoption must be voluntary and value-driven. A platform that developers hate is abandoned for ad-hoc scripts and shadow IT.',
      ]
    },
    {
      heading: 'Golden Paths',
      points: [
        'A golden path is an opinionated, well-maintained template for a common task: "how to create a new microservice", "how to add a database", "how to set up monitoring".',
        'The golden path is the "right way" with sensible defaults, guardrails (security policies, naming conventions), and integrated tooling.',
        'Developers can deviate from the golden path — but they give up the guardrails and support. This makes the tradeoffs explicit.',
        'Examples: Backstage software templates, GitHub repository templates, Helm chart libraries, reusable GitHub Actions workflows.',
        'A good golden path eliminates 80% of the decision fatigue for common scenarios without requiring platform team involvement.',
      ]
    },
    {
      heading: 'Team Topologies — Platform Team',
      points: [
        'In Team Topologies (Skelton & Pais), a Platform Team is a stream-enabling team that provides capabilities to stream-aligned (product) teams.',
        'Interaction mode: X-as-a-Service — the platform exposes APIs, portals, and documentation that product teams consume without needing to talk to the platform team.',
        'Platform teams must avoid becoming a bottleneck. If product teams must raise tickets for every infra change, the platform has failed.',
        'Cognitive load reduction is the primary metric: can a developer build, deploy, and operate their service without needing platform team help for day-to-day tasks?',
      ]
    },
    {
      heading: 'Backstage Developer Portal',
      points: [
        'Backstage (open-sourced by Spotify in 2020) is the most widely adopted developer portal framework.',
        'Software Catalogue: every service, API, library, and team registered with ownership metadata, tech docs, and dependency links.',
        'Software Templates (Scaffolder): fill a form → Backstage creates a repo, wires CI/CD, provisions a database, and creates a Datadog dashboard automatically.',
        'TechDocs: Markdown docs stored alongside the code, rendered in Backstage — documentation as code.',
        'Plugin ecosystem: 200+ community plugins for Kubernetes cluster view, cost analytics, security scanning, incident management.',
      ]
    },
    {
      heading: 'Platform as a Product',
      points: [
        'A platform team that ships features nobody wants, with no feedback loop, is building for itself — not its users.',
        '"Platform as a product" means: user research with developers, a public roadmap, NPS/DSAT surveys, office hours, and defined SLAs.',
        'Metrics: platform adoption rate, time to first deploy for a new team, number of support tickets (toil indicator), developer satisfaction (SPACE framework).',
        'Versioning and deprecation: platform APIs should be versioned. Breaking changes announced with migration guides and migration windows.',
        'Start small: a single golden path for the most common service type delivers more value than a half-built full platform.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Backstage Entity Descriptor',
      language: 'bash',
      code: `# catalog-info.yaml — every service registered in the software catalogue

apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: payment-service
  description: Handles payment processing and refunds
  annotations:
    github.com/project-slug: acme/payment-service
    backstage.io/techdocs-ref: dir:.
    pagerduty.com/service-id: P12345
    datadoghq.com/service-name: payment-service
  tags:
    - payments
    - pci-dss
    - nodejs
  links:
    - url: https://grafana.internal/d/payment-svc
      title: Dashboard
      icon: dashboard
    - url: https://runbooks.internal/payment-service
      title: Runbooks
      icon: book
spec:
  type: service
  lifecycle: production
  owner: team-payments
  system: checkout
  dependsOn:
    - component:order-service
    - resource:payments-postgres-db
  providesApis:
    - payment-api-v2

# This file lives in the repo — when teams move ownership, they update this file.
# Backstage discovers it via GitHub integration and keeps the catalogue in sync.`,
    },
    {
      label: 'Backstage Software Template',
      language: 'bash',
      code: `# template.yaml — golden path for creating a new Node.js microservice
# Developers fill a form in Backstage; this template runs automatically.

apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: nodejs-microservice
  title: Node.js Microservice
  description: Creates a production-ready Node.js service with CI/CD, observability, and database
spec:
  owner: platform-team
  type: service

  parameters:
    - title: Service Details
      required: [name, owner, description]
      properties:
        name:
          title: Service Name
          type: string
          pattern: '^[a-z][a-z0-9-]+$'
        owner:
          title: Owning Team
          type: string
          ui:field: OwnerPicker
        description:
          title: Short description
          type: string
        includeDatabase:
          title: Include PostgreSQL database?
          type: boolean
          default: false

  steps:
    - id: fetch-template
      name: Fetch base template
      action: fetch:template
      input:
        url: ./skeleton
        values:
          name: \${{ parameters.name }}
          owner: \${{ parameters.owner }}

    - id: publish
      name: Create GitHub repository
      action: publish:github
      input:
        repoUrl: github.com?repo=\${{ parameters.name }}&owner=acme

    - id: provision-infra
      name: Provision infra via Terraform
      action: terraform:apply
      input:
        workspaceName: \${{ parameters.name }}-dev
        module: modules/nodejs-service

    - id: register
      name: Register in catalogue
      action: catalog:register
      input:
        repoContentsUrl: \${{ steps.publish.output.repoContentsUrl }}
        catalogInfoPath: /catalog-info.yaml`,
    },
    {
      label: 'Self-Service Environment CLI',
      language: 'typescript',
      code: `// platform-cli/src/commands/env.ts
// Internal CLI tool that wraps Terraform + kubectl
// "platform env create" provisions a dev environment without a ticket

import { execSync } from 'child_process';

interface EnvOptions {
  name: string;
  team: string;
  tier: 'dev' | 'staging';
  ttlHours?: number;
}

function createEnvironment(opts: EnvOptions): void {
  const { name, team, tier, ttlHours = 24 } = opts;
  const workspaceName = \`\${team}-\${name}-\${tier}\`;

  console.log(\`Creating environment: \${workspaceName}\`);

  // 1. Validate naming convention
  if (!/^[a-z][a-z0-9-]+$/.test(name)) {
    throw new Error('Environment name must be lowercase alphanumeric with hyphens');
  }

  // 2. Provision infra via Terraform
  execSync(\`terraform workspace new \${workspaceName}\`, { stdio: 'inherit' });
  execSync(\`terraform apply -auto-approve \\
    -var="env_name=\${workspaceName}" \\
    -var="team=\${team}" \\
    -var="tier=\${tier}"\`, { stdio: 'inherit' });

  // 3. Tag with TTL for auto-cleanup (read by a nightly cleanup job)
  execSync(\`kubectl label namespace \${workspaceName} \\
    ttl-hours=\${ttlHours} \\
    created-by=\${team} \\
    created-at=\$(date -u +%s)\`, { stdio: 'inherit' });

  console.log(\`✅ Environment ready: https://\${workspaceName}.dev.internal\`);
  console.log(\`⏰ Auto-destroy in \${ttlHours} hours\`);
}

// Usage: platform env create --name feature-x --team payments --tier dev
createEnvironment({ name: 'feature-x', team: 'payments', tier: 'dev', ttlHours: 8 });`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Platform team as a gatekeeper',
      wrong: `// Product team: "I need a new database"
// Ops ticket opened → 3 day SLA → platform team reviews
// → manual provisioning → another ticket for credentials
// Product team blocked for a week`,
      right: `// Product team: runs "platform db create --name orders-db --team payments"
// Terraform runs automatically, credentials injected to vault
// Database ready in 5 minutes, no ticket needed`,
      explanation: 'A platform team that becomes a gatekeeper recreates the ops bottleneck that DevOps was meant to eliminate. Self-service is the goal — the platform team builds the tooling, not the infrastructure itself.',
    },
    {
      title: 'Building a platform nobody asked for',
      wrong: `// Platform team spends 6 months building a custom
// Kubernetes operator for database provisioning
// Product teams: "We were just using RDS Console..."
// Adoption: 0%`,
      right: `// Start with user research: interview 5 product teams
// Find the most painful, repeated task (e.g. creating a new service)
// Build a golden path for that one thing first
// Measure adoption before expanding`,
      explanation: '"Platform as a product" means the platform team must understand its users. Building without validated demand produces unused tooling. Start with the highest-pain, most repeated problem.',
    },
    {
      title: 'Golden paths with no escape hatch',
      wrong: `// Golden path is mandatory — CI/CD pipeline cannot be modified
// Service must use the company Kubernetes operator — no exceptions
// Security team rejects all deviations from the template`,
      right: `// Golden path is strongly recommended, with documented deviations
// Teams can opt out but must own the consequences (no platform support)
// Deviation register: tracks which teams diverged and why`,
      explanation: 'Mandatory platforms create resentment and drive shadow IT. Teams with genuinely different needs (compliance, performance) need escape hatches. Voluntary adoption with clear tradeoffs beats mandated compliance.',
    },
    {
      title: 'No software catalogue = no discoverability',
      wrong: `// 50 microservices across 8 teams
// "Who owns the auth service?"
// "What does the payments API accept?"
// Slack detective work every time`,
      right: `// Every service has catalog-info.yaml
// Backstage catalogue shows: owner, description, APIs, dependencies
// New engineer onboards in hours, not days`,
      explanation: 'Without a software catalogue, discoverability scales as O(n²) — each new service makes it harder to understand the whole system. A catalogue is the foundation of platform engineering at scale.',
    },
    {
      title: 'Platform with no SLA or feedback loop',
      wrong: `// CI/CD pipeline is flaky — fails 30% of the time
// Platform team: "We don't have capacity to fix it"
// Product teams workaround it with retry scripts
// Developer satisfaction drops, blame grows`,
      right: `// Platform publishes SLA: CI pipeline success rate >99%
// Monthly developer satisfaction survey (NPS)
// Office hours: Fridays 2-3pm for platform questions
// Public roadmap with quarterly priorities`,
      explanation: 'A platform without an SLA has no accountability. Treating it as a product means publishing reliability commitments, collecting developer feedback, and prioritising improvements based on user pain.',
    },
    {
      title: 'Cognitive load shifted, not removed',
      wrong: `// "We abstracted Kubernetes!" — developers now must learn:
// 8 custom CRDs, platform-specific YAML schema,
// internal CLI with 40 flags, 3 separate dashboards
// Cognitive load is higher than before`,
      right: `// Measure cognitive load: how many concepts must a developer
// hold in mind to deploy a service?
// Target: < 5 decisions for the common case
// Complexity hidden behind platform defaults`,
      explanation: 'A platform that replaces Kubernetes complexity with equal platform complexity has not helped. Measure cognitive load by counting the concepts a developer must understand to accomplish common tasks. Reduce that number.',
    },
  ];

  challenge: Challenge = {
    title: 'Software Catalogue Health Checker',
    language: 'typescript',
    description: `Build a function that audits a software catalogue and reports health issues. Each service entry should have:

- A name, owner, description, and lifecycle
- At least one tag
- A runbook link

The function should:
1. Identify services missing required fields
2. Flag services in "production" lifecycle with no runbook
3. Return a summary with healthy count, issues per service, and overall health score (0–100)`,
    hints: [
      'Collect all issues per service — don\'t stop at the first missing field',
      'Health score = (healthy services / total services) × 100',
      'Production lifecycle without a runbook is a higher severity issue',
      'Use a separate issues array per service in the output',
    ],
    starterCode: `interface ServiceEntry {
  name: string;
  owner?: string;
  description?: string;
  lifecycle: 'experimental' | 'production' | 'deprecated';
  tags?: string[];
  links?: { title: string; url: string }[];
}

interface ServiceAudit {
  name: string;
  issues: string[];
  healthy: boolean;
}

interface CatalogueAuditResult {
  healthScore: number;        // 0–100
  healthyCount: number;
  totalCount: number;
  services: ServiceAudit[];
}

function auditCatalogue(services: ServiceEntry[]): CatalogueAuditResult {
  // TODO: implement
  return { healthScore: 0, healthyCount: 0, totalCount: 0, services: [] };
}`,
    solution: `function auditCatalogue(services: ServiceEntry[]): CatalogueAuditResult {
  const audits: ServiceAudit[] = services.map(svc => {
    const issues: string[] = [];

    if (!svc.owner)       issues.push('Missing owner');
    if (!svc.description) issues.push('Missing description');
    if (!svc.tags || svc.tags.length === 0) issues.push('No tags — add at least one for discoverability');

    const hasRunbook = svc.links?.some(l =>
      l.title.toLowerCase().includes('runbook') ||
      l.url.includes('runbook')
    );
    if (svc.lifecycle === 'production' && !hasRunbook) {
      issues.push('Production service has no runbook link — critical for incident response');
    }

    return { name: svc.name, issues, healthy: issues.length === 0 };
  });

  const healthyCount = audits.filter(a => a.healthy).length;
  const healthScore  = services.length === 0 ? 100
    : Math.round((healthyCount / services.length) * 100);

  return {
    healthScore,
    healthyCount,
    totalCount: services.length,
    services: audits,
  };
}

// Test:
const result = auditCatalogue([
  { name: 'auth-service', owner: 'team-auth', description: 'Handles auth', lifecycle: 'production', tags: ['auth'], links: [{ title: 'Runbook', url: 'https://runbooks.internal/auth' }] },
  { name: 'legacy-api',   lifecycle: 'production', tags: [] },
]);
// healthScore: 50, healthyCount: 1, totalCount: 2
// legacy-api issues: ['Missing owner', 'Missing description', 'No tags', 'Production service has no runbook']`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is an Internal Developer Platform (IDP)?',
      options: [
        'A project management tool for tracking sprint velocity',
        'A self-service layer of tools and workflows that abstracts infrastructure complexity from product teams',
        'An internal API gateway that routes microservice traffic',
        'A private npm registry for internal packages',
      ],
      answer: 1,
      explanation: 'An IDP is a curated, integrated set of tools and workflows exposed through a self-service interface. It abstracts infrastructure complexity so product teams can provision environments, databases, and pipelines without raising ops tickets.',
    },
    {
      q: 'What is a "golden path" in the context of platform engineering?',
      options: [
        'The fastest deployment pipeline configuration',
        'An opinionated, supported template for common tasks that provides defaults, guardrails, and integrated tooling',
        'The main production deployment pipeline',
        'A monitoring dashboard showing the most critical metrics',
      ],
      answer: 1,
      explanation: 'A golden path is the recommended, well-maintained way to accomplish a common task (e.g. "how to create a new microservice"). It comes with sensible defaults and guardrails. Teams can deviate but give up platform support.',
    },
    {
      q: 'In Team Topologies, how should a Platform team interact with stream-aligned (product) teams?',
      options: [
        'Collaboration mode — work together daily on product features',
        'Facilitating mode — embedded in product teams to teach platform tools',
        'X-as-a-Service mode — expose APIs, portals, and documentation that product teams self-serve',
        'Complicated subsystem mode — own all infra decisions without developer input',
      ],
      answer: 2,
      explanation: 'Platform teams operate in X-as-a-Service mode — the platform is consumed like a service via APIs, CLI tools, and documentation. Product teams self-serve without needing to engage the platform team for day-to-day tasks. Collaboration mode is temporary and used during platform capability development.',
    },
    {
      q: 'What is Backstage and what problem does it solve?',
      options: [
        'A CI/CD tool that automates container builds',
        'An open-source developer portal providing a software catalogue, service templates, and TechDocs',
        'A Kubernetes dashboard for viewing cluster resource usage',
        'A secrets management tool for injecting credentials into pipelines',
      ],
      answer: 1,
      explanation: 'Backstage (open-sourced by Spotify) is a developer portal framework. It provides a software catalogue (all services with ownership metadata), software templates (golden paths), TechDocs (documentation as code), and a plugin ecosystem. It solves discoverability and self-service provisioning.',
    },
    {
      q: 'What is the primary metric that indicates whether a platform is reducing cognitive load?',
      options: [
        'The number of Kubernetes clusters managed by the platform',
        'How many product teams can build, deploy, and operate their service for common tasks without platform team assistance',
        'The lines of code in the platform\'s internal tooling',
        'The number of golden path templates available',
      ],
      answer: 1,
      explanation: 'Cognitive load reduction is measured by whether developers can accomplish common tasks (deploy a service, add a database, view logs) without needing platform team help. If developers still raise tickets for everyday tasks, cognitive load has not been reduced.',
    },
    {
      q: 'What is an Internal Developer Portal (IDP) and what problem does it solve?',
      options: [
        'An internal version of npm for private packages',
        'A self-service web UI that gives developers visibility into services, infrastructure, documentation, and tools — reducing cognitive overhead and dependency on platform team tickets',
        'A portal for employees to request cloud resources via IT tickets',
        'A dashboard showing CI/CD pipeline status across all repositories'],
      answer: 1,
      explanation: 'An IDP (Backstage, Port, Cortex) provides developers with a single pane of glass: service catalog (who owns what), documentation, CI/CD status, cloud cost, security posture, and self-service actions (create a new service, provision a database, onboard to monitoring). Without an IDP, developers waste hours in Slack asking "where do I find X?" or opening tickets. IDPs encode platform knowledge into a UI, scaling platform teams\' impact without linear headcount growth.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between platform engineering and DevOps?',
      a: 'DevOps is a culture and philosophy — shared ownership, fast feedback, continuous delivery. Platform engineering is one organisational pattern for implementing DevOps at scale: a dedicated team builds tooling and golden paths so that every product team does not have to solve the same infra problems independently. Platform engineering scales DevOps across many teams.',
    },
    {
      q: 'Should the golden path be mandatory?',
      a: 'No — mandatory golden paths create resentment and drive shadow IT. The golden path should be the "path of least resistance": easy to follow, well-supported, with clear benefits. Teams should be free to deviate but must own the consequences (no platform support, manual maintenance). A deviation register tracks who diverged and why, informing future platform improvements.',
    },
    {
      q: 'How do you measure the success of a platform team?',
      a: 'Key metrics: (1) Time to first deploy for a new team — how long from "new team formed" to "first service in production"; (2) Developer satisfaction (NPS or DSAT surveys); (3) Platform adoption rate — % of teams using the golden path; (4) Reduction in ops support tickets (toil); (5) DORA metrics improvement across teams using the platform vs those not using it.',
    },
    {
      q: 'What is the "platform as a product" principle?',
      a: 'Treating the platform like a product means: conducting user research with developers, maintaining a public roadmap, publishing an SLA, running office hours, collecting NPS feedback, and versioning APIs with deprecation notices. The platform team acts like a product team with internal developers as customers — building what users need, not what the platform team finds interesting.',
    },
    {
      q: 'How does a software catalogue help with incident response?',
      a: 'During an incident, responders need to quickly answer: who owns this service? What does it depend on? Where is the runbook? What monitoring dashboard shows its health? A software catalogue with ownership metadata, dependency links, runbook URLs, and dashboard links reduces the time to find this information from minutes (Slack detective work) to seconds (one search in Backstage).',
    },
    {
      q: 'What is a "golden path" in platform engineering and why does it matter?',
      a: 'A golden path (popularised by Spotify) is the opinionated, well-supported path for accomplishing a common task — e.g., "how to create a new service" or "how to add a new API endpoint". It is not mandatory but it is so easy and well-supported (scaffolding templates, documentation, integrated monitoring out-of-the-box) that most engineers choose it voluntarily. Why it matters: (1) Consistency — services created via the golden path all have logging, metrics, and CI/CD pre-configured. (2) Productivity — engineers start productive immediately without spending days on boilerplate. (3) Standards enforcement — security, compliance, and reliability practices are baked in, not bolted on. (4) Platform adoption — engineers adopt the platform because it makes their life easier, not because they are forced to.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Platform engineering builds an internal developer platform (IDP) that lets product teams self-serve infrastructure — reducing cognitive load through golden paths, software catalogues, and automated provisioning.',
    mustKnow: [
      'IDP = curated self-service layer abstracting infra complexity from product teams',
      'Golden path = opinionated, supported template for common tasks — voluntary, not mandatory',
      'Backstage = open-source developer portal: catalogue, templates, TechDocs, plugins',
      'Platform team = Team Topologies X-as-a-Service mode — not a gatekeeper',
      '"Platform as a product" — user research, roadmap, SLAs, NPS feedback',
      'Cognitive load metric: can a developer deploy without asking the platform team?',
      'Software catalogue = discoverability layer for all services, owners, APIs, and runbooks',
    ],
    interviewFocus: [
      'What is the difference between a platform team and a DevOps team?',
      'Why should golden paths be voluntary and what happens when they are mandatory?',
      'How do you measure the success of a platform team? (give specific metrics)',
      'How does Backstage help during an incident? Walk through a real scenario',
    ],
  };
}
