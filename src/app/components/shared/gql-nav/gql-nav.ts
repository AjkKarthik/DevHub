import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProgressService } from '../../../services/progress.service';

@Component({
  selector: 'app-gql-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/graphql" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🏠 GraphQL Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/graphql/fundamentals" routerLinkActive="active"><span class="nl-text">GraphQL Fundamentals</span>@if(p.isDone('gql-fundamentals')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/schema-definition-language" routerLinkActive="active"><span class="nl-text">Schema Definition Language</span>@if(p.isDone('gql-schema-definition-language')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/type-system" routerLinkActive="active"><span class="nl-text">Type System Deep Dive</span>@if(p.isDone('gql-type-system')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Queries</p>
      <a routerLink="/graphql/queries" routerLinkActive="active"><span class="nl-text">Queries</span>@if(p.isDone('gql-queries')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/variables-arguments" routerLinkActive="active"><span class="nl-text">Variables &amp; Arguments</span>@if(p.isDone('gql-variables-arguments')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/directives" routerLinkActive="active"><span class="nl-text">Directives</span>@if(p.isDone('gql-directives')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Mutations &amp; Subscriptions</p>
      <a routerLink="/graphql/mutations" routerLinkActive="active"><span class="nl-text">Mutations</span>@if(p.isDone('gql-mutations')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/error-handling" routerLinkActive="active"><span class="nl-text">Mutation Error Handling</span>@if(p.isDone('gql-error-handling')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/subscriptions" routerLinkActive="active"><span class="nl-text">Subscriptions</span>@if(p.isDone('gql-subscriptions')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Resolvers &amp; Data</p>
      <a routerLink="/graphql/resolvers" routerLinkActive="active"><span class="nl-text">Resolvers</span>@if(p.isDone('gql-resolvers')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/dataloader" routerLinkActive="active"><span class="nl-text">DataLoader &amp; N+1</span>@if(p.isDone('gql-dataloader')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/auth" routerLinkActive="active"><span class="nl-text">Auth &amp; Authorization</span>@if(p.isDone('gql-auth')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Server</p>
      <a routerLink="/graphql/apollo-server" routerLinkActive="active"><span class="nl-text">Apollo Server</span>@if(p.isDone('gql-apollo-server')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/pagination" routerLinkActive="active"><span class="nl-text">Pagination Patterns</span>@if(p.isDone('gql-pagination')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Client</p>
      <a routerLink="/graphql/apollo-client" routerLinkActive="active"><span class="nl-text">Apollo Client</span>@if(p.isDone('gql-apollo-client')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/client-caching" routerLinkActive="active"><span class="nl-text">Client Caching</span>@if(p.isDone('gql-client-caching')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/code-generation" routerLinkActive="active"><span class="nl-text">Code Generation</span>@if(p.isDone('gql-code-generation')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Advanced</p>
      <a routerLink="/graphql/performance" routerLinkActive="active"><span class="nl-text">Performance &amp; Best Practices</span>@if(p.isDone('gql-performance')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/federation" routerLinkActive="active"><span class="nl-text">Schema Stitching &amp; Federation</span>@if(p.isDone('gql-federation')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/testing" routerLinkActive="active"><span class="nl-text">Testing GraphQL APIs</span>@if(p.isDone('gql-testing')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/graphql/cheatsheet" routerLinkActive="active"><span class="nl-text">Cheat Sheet</span></a>
      <a routerLink="/graphql/interview-prep" routerLinkActive="active"><span class="nl-text">Interview Prep</span></a>
    </div>
  `,
})
export class GqlNavComponent {
  p = inject(ProgressService);
}
