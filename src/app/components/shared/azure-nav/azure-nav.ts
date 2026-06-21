import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProgressService } from '../../../services/progress.service';
import { SEARCH_INDEX } from '../../../services/search.service';

const DIFF: Record<string, string> = Object.fromEntries(
  SEARCH_INDEX.map(e => [e.route, e.difficulty])
);

@Component({
  selector: 'app-azure-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/azure" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">☁ Azure Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/azure/fundamentals" routerLinkActive="active"><span class="nl-text">Azure Fundamentals</span>@if(p.isDone('azure-fundamentals')){<span class="nl-done">✓</span>}@if(d('azure-fundamentals');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/arm" routerLinkActive="active"><span class="nl-text">Azure Resource Manager</span>@if(p.isDone('azure-arm')){<span class="nl-done">✓</span>}@if(d('azure-arm');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/bicep" routerLinkActive="active"><span class="nl-text">Azure Bicep Deep-dive</span>@if(p.isDone('azure-bicep')){<span class="nl-done">✓</span>}@if(d('azure-bicep');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Compute</p>
      <a routerLink="/azure/virtual-machines" routerLinkActive="active"><span class="nl-text">Virtual Machines</span>@if(p.isDone('azure-virtual-machines')){<span class="nl-done">✓</span>}@if(d('azure-virtual-machines');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/app-service" routerLinkActive="active"><span class="nl-text">App Service</span>@if(p.isDone('azure-app-service')){<span class="nl-done">✓</span>}@if(d('azure-app-service');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/functions" routerLinkActive="active"><span class="nl-text">Azure Functions</span>@if(p.isDone('azure-functions')){<span class="nl-done">✓</span>}@if(d('azure-functions');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/aks" routerLinkActive="active"><span class="nl-text">AKS</span>@if(p.isDone('azure-aks')){<span class="nl-done">✓</span>}@if(d('azure-aks');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/container-apps" routerLinkActive="active"><span class="nl-text">Container Apps</span>@if(p.isDone('azure-container-apps')){<span class="nl-done">✓</span>}@if(d('azure-container-apps');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Networking</p>
      <a routerLink="/azure/virtual-network" routerLinkActive="active"><span class="nl-text">Virtual Network</span>@if(p.isDone('azure-virtual-network')){<span class="nl-done">✓</span>}@if(d('azure-virtual-network');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/load-balancer" routerLinkActive="active"><span class="nl-text">Load Balancer &amp; Front Door</span>@if(p.isDone('azure-load-balancer')){<span class="nl-done">✓</span>}@if(d('azure-load-balancer');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Storage</p>
      <a routerLink="/azure/storage" routerLinkActive="active"><span class="nl-text">Blob &amp; Storage</span>@if(p.isDone('azure-storage')){<span class="nl-done">✓</span>}@if(d('azure-storage');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Identity</p>
      <a routerLink="/azure/entra-id" routerLinkActive="active"><span class="nl-text">Entra ID (AAD)</span>@if(p.isDone('azure-entra-id')){<span class="nl-done">✓</span>}@if(d('azure-entra-id');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/rbac" routerLinkActive="active"><span class="nl-text">Azure RBAC</span>@if(p.isDone('azure-rbac')){<span class="nl-done">✓</span>}@if(d('azure-rbac');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/key-vault" routerLinkActive="active"><span class="nl-text">Key Vault</span>@if(p.isDone('azure-key-vault')){<span class="nl-done">✓</span>}@if(d('azure-key-vault');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Databases</p>
      <a routerLink="/azure/sql-cosmos" routerLinkActive="active"><span class="nl-text">SQL &amp; Cosmos DB</span>@if(p.isDone('azure-sql-cosmos')){<span class="nl-done">✓</span>}@if(d('azure-sql-cosmos');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/redis" routerLinkActive="active"><span class="nl-text">Cache for Redis</span>@if(p.isDone('azure-redis')){<span class="nl-done">✓</span>}@if(d('azure-redis');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">App Services</p>
      <a routerLink="/azure/monitor" routerLinkActive="active"><span class="nl-text">Monitor &amp; App Insights</span>@if(p.isDone('azure-monitor')){<span class="nl-done">✓</span>}@if(d('azure-monitor');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/devops-pipelines" routerLinkActive="active"><span class="nl-text">DevOps &amp; Pipelines</span>@if(p.isDone('azure-devops-pipelines')){<span class="nl-done">✓</span>}@if(d('azure-devops-pipelines');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/service-bus" routerLinkActive="active"><span class="nl-text">Service Bus</span>@if(p.isDone('azure-service-bus')){<span class="nl-done">✓</span>}@if(d('azure-service-bus');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/api-management" routerLinkActive="active"><span class="nl-text">API Management</span>@if(p.isDone('azure-api-management')){<span class="nl-done">✓</span>}@if(d('azure-api-management');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/azure/cost-management" routerLinkActive="active"><span class="nl-text">Cost Management</span>@if(p.isDone('azure-cost-management')){<span class="nl-done">✓</span>}@if(d('azure-cost-management');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/security-defender" routerLinkActive="active"><span class="nl-text">Security &amp; Defender</span>@if(p.isDone('azure-security-defender')){<span class="nl-done">✓</span>}@if(d('azure-security-defender');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/cheatsheet" routerLinkActive="active"><span class="nl-text">Azure Cheat Sheet</span></a>
    </div>
  `,
  styles: []
})
export class AzureNavComponent {
  p = inject(ProgressService);
  d(route: string): string | null { return DIFF[route] ?? null; }
}
