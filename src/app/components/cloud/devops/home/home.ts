import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic { title: string; route: string; badge: string; description: string; keyPoints: string[]; available: boolean; }

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'CI/CD': 'cicd', 'Source Control': 'git',
  'Containers': 'containers', 'IaC': 'iac', 'Monitoring': 'monitoring',
  'Security': 'security', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'CI/CD', 'Source Control', 'Containers', 'IaC', 'Monitoring', 'Security', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'DevOps Culture & Principles', route: '/devops', badge: 'Foundations', description: 'CALMS framework, three ways, feedback loops, and why DevOps is a mindset before it is a toolchain.', keyPoints: ['CALMS: Culture, Automation, Lean, Measurement, Sharing', 'Three ways of DevOps', 'Reducing mean time to recover', 'Shifting left on testing', 'Dev + Ops collaboration'], available: false },
  { title: 'SDLC & Agile', route: '/devops', badge: 'Foundations', description: 'Software delivery life cycle, Scrum and Kanban, sprints, retrospectives, and velocity tracking.', keyPoints: ['Waterfall vs Agile', 'Scrum sprints and ceremonies', 'Kanban board and WIP limits', 'Definition of Done', 'Backlog refinement'], available: false },
  { title: 'Git Workflows', route: '/devops', badge: 'Source Control', description: 'Gitflow, trunk-based development, feature flags, branching strategies, and PR review workflows.', keyPoints: ['Gitflow vs trunk-based', 'Feature branch vs feature flag', 'Branch protection rules', 'PR review best practices', 'Conventional commits'], available: false },
  { title: 'GitHub Actions', route: '/devops', badge: 'CI/CD', description: 'Workflows, jobs, steps, runners, secrets, environments, and reusable actions in GitHub Actions.', keyPoints: ['Workflow YAML syntax', 'on: push, pull_request triggers', 'Job matrix strategy', 'Reusable workflows (workflow_call)', 'Environment protection rules'], available: false },
  { title: 'Azure DevOps Pipelines', route: '/devops', badge: 'CI/CD', description: 'YAML pipelines, stages, jobs, tasks, artifact publishing, and deployment environments in Azure DevOps.', keyPoints: ['Stages, jobs, steps hierarchy', 'Templates for reuse', 'Service connections', 'Artifact publishing', 'Deployment gates'], available: false },
  { title: 'Jenkins', route: '/devops', badge: 'CI/CD', description: 'Declarative and scripted Jenkinsfiles, shared libraries, agents, and plugin ecosystem.', keyPoints: ['Declarative vs scripted pipeline', 'Jenkinsfile stages', 'Shared library pattern', 'Agent labels and Docker agents', 'Blue Ocean UI'], available: false },
  { title: 'Continuous Integration', route: '/devops', badge: 'CI/CD', description: 'Fast feedback loops — automated builds, unit tests, code coverage, static analysis, and artefact creation.', keyPoints: ['Build on every commit', 'Fail fast on test failure', 'Code coverage gates', 'Static analysis (SonarQube)', 'Artefact versioning'], available: false },
  { title: 'Continuous Delivery & Deployment', route: '/devops', badge: 'CI/CD', description: 'Deploy pipelines, blue/green, canary, rolling updates, and rollback strategies.', keyPoints: ['CD vs CD distinction', 'Blue/green deployment', 'Canary releases', 'Rolling update strategy', 'Automated rollback triggers'], available: false },
  { title: 'Docker in CI/CD', route: '/devops', badge: 'Containers', description: 'Build and push images in pipelines, multi-stage builds, layer caching, and container image scanning.', keyPoints: ['docker build in pipeline', 'Multi-stage build for lean images', 'Layer cache optimisation', 'Image scanning (Trivy)', 'Registry push and tagging'], available: false },
  { title: 'Kubernetes Deployments', route: '/devops', badge: 'Containers', description: 'Deploy to Kubernetes from CI/CD — kubectl, Helm charts, Kustomize, and GitOps with ArgoCD/Flux.', keyPoints: ['kubectl apply from pipeline', 'Helm chart release', 'Kustomize overlays', 'ArgoCD GitOps model', 'Rolling and canary Helm releases'], available: false },
  { title: 'Infrastructure as Code', route: '/devops', badge: 'IaC', description: 'Terraform, Bicep, and Pulumi basics — declarative vs imperative IaC and why it matters.', keyPoints: ['Declarative IaC benefits', 'Terraform vs Bicep vs Pulumi', 'State management', 'Idempotent applies', 'Drift detection'], available: false },
  { title: 'Monitoring & Alerting', route: '/devops', badge: 'Monitoring', description: 'Prometheus, Grafana, Datadog, and Azure Monitor — metrics, dashboards, and on-call alerting.', keyPoints: ['Prometheus scrape model', 'Grafana dashboards', 'Alert rules and thresholds', 'PagerDuty / OpsGenie integration', 'SLO-based alerting'], available: false },
  { title: 'Logging Pipelines', route: '/devops', badge: 'Monitoring', description: 'Centralised logging with ELK stack, Loki, Fluentd, and structured log formats.', keyPoints: ['Structured JSON logs', 'Fluentd / Logstash shipping', 'Elasticsearch indexing', 'Kibana dashboards', 'Log retention and cost'], available: false },
  { title: 'DevSecOps', route: '/devops', badge: 'Security', description: 'Shift security left — SAST, DAST, dependency scanning, secrets detection, and compliance as code.', keyPoints: ['SAST (static analysis)', 'DAST (dynamic analysis)', 'Dependency scanning (Snyk)', 'Secrets scanning (gitleaks)', 'Policy as code (OPA)'], available: false },
  { title: 'Release Management', route: '/devops', badge: 'Reference', description: 'Release versioning, changelogs, feature flags, dark launches, and progressive rollouts.', keyPoints: ['SemVer and CalVer', 'Conventional changelog generation', 'Feature flags (LaunchDarkly)', 'Progressive rollout %', 'Hotfix release process'], available: false },
  { title: 'SRE Practices', route: '/devops', badge: 'Reference', description: 'SLIs, SLOs, error budgets, toil reduction, and the SRE book principles applied to modern platforms.', keyPoints: ['SLI: measurable indicator', 'SLO: target for SLI', 'Error budget = 1 - SLO', 'Toil identification and elimination', 'Blameless post-mortems'], available: false },
  { title: 'GitOps with ArgoCD & Flux', route: '/devops', badge: 'CI/CD', description: 'GitOps model — Git as single source of truth, ArgoCD and Flux for automatic cluster reconciliation.', keyPoints: ['Git PR as the deployment mechanism', 'ArgoCD Application CRD + sync policies', 'Flux HelmRelease and Kustomization', 'Health checks and sync status', 'Rollback via git revert'], available: false },
  { title: 'Artifact Management', route: '/devops', badge: 'CI/CD', description: 'Versioning and storing build artefacts — Docker images, NuGet, npm, and binary artefacts in registries.', keyPoints: ['Semantic versioning for artefacts', 'GHCR / ACR / ECR image registries', 'Azure Artifacts / JFrog Artifactory', 'Immutable artefacts — never overwrite a tag', 'Artefact promotion: dev → staging → prod'], available: false },
  { title: 'Platform Engineering', route: '/devops', badge: 'Foundations', description: 'Internal developer platforms (IDP), golden paths, self-service infrastructure, and reducing cognitive load.', keyPoints: ['IDP as product: developer portal + self-service', 'Backstage: open-source developer portal', 'Golden paths: opinionated templates reduce choices', 'Reduce toil for developers — abstract infra', 'Team Topologies: platform team as stream enabler'], available: false },
  { title: 'On-call & Incident Response', route: '/devops', badge: 'Monitoring', description: 'Runbooks, escalation paths, incident severity levels, post-mortems, and reducing MTTD/MTTR.', keyPoints: ['Severity: P1 (critical) → P4 (informational)', 'PagerDuty on-call rotation schedules', 'Runbooks: step-by-step resolution guides', 'Incident commander role in large incidents', 'Blameless post-mortem within 48h'], available: false },
  { title: 'Environment Strategy', route: '/devops', badge: 'Foundations', description: 'Dev/staging/prod environment design, environment parity, feature branches, and ephemeral environments.', keyPoints: ['Environment parity: dev ≈ prod to catch bugs early', 'Ephemeral PR environments: deploy on PR, destroy on merge', 'Infrastructure per environment via workspace/overlay', 'Secrets per environment via Vault / Key Vault', 'Promotion gates: tests pass before staging promote'], available: false },
  { title: 'DevOps Cheat Sheet', route: '/devops', badge: 'Reference', description: 'CI/CD pipeline patterns, key metrics (DORA), Git commands, and Docker/K8s quick reference.', keyPoints: ['DORA metrics: deployment frequency, lead time, MTTR, change failure rate', 'Pipeline stages: source → build → test → scan → deploy', 'Key tools at a glance: GitHub Actions, ArgoCD, Helm, Prometheus'], available: false },
];

@Component({ selector: 'app-devops-home', standalone: true, imports: [RouterLink], templateUrl: './home.html', styleUrl: './home.scss' })
export class DevopsHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
