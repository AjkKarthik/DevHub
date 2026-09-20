import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { ProgressService } from '../../../services/progress.service';
import { SUBTOPICS } from '../../../data/subtopics';

@Component({
  selector: 'app-messaging-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/messaging" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🏠 Messaging Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/messaging/messaging-fundamentals" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Messaging Fundamentals</span>
        @if(p.isDone('kafka-messaging-fundamentals')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('messaging-fundamentals')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('messaging-fundamentals')"
                  (click)="toggleSubtopics('messaging-fundamentals', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('messaging-fundamentals'); as fundamentalsSubs) {
        @if (isSubtopicsExpanded('messaging-fundamentals')) {
          <div class="nav-subtopics">
            @for (s of fundamentalsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/messaging/message-queues-vs-streams" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Queues vs Event Streams</span>
        @if(p.isDone('kafka-message-queues-vs-streams')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('message-queues-vs-streams')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('message-queues-vs-streams')"
                  (click)="toggleSubtopics('message-queues-vs-streams', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('message-queues-vs-streams'); as mqsSubs) {
        @if (isSubtopicsExpanded('message-queues-vs-streams')) {
          <div class="nav-subtopics">
            @for (s of mqsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">RabbitMQ</p>
      <a routerLink="/messaging/rabbitmq-core" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">RabbitMQ Core Concepts</span>
        @if(p.isDone('kafka-rabbitmq-core')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('rabbitmq-core')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('rabbitmq-core')"
                  (click)="toggleSubtopics('rabbitmq-core', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('rabbitmq-core'); as rmqCoreSubs) {
        @if (isSubtopicsExpanded('rabbitmq-core')) {
          <div class="nav-subtopics">
            @for (s of rmqCoreSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/messaging/rabbitmq-exchanges" routerLinkActive="active"><span class="nl-text">RabbitMQ Exchanges</span>@if(p.isDone('kafka-rabbitmq-exchanges')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/messaging/rabbitmq-patterns" routerLinkActive="active"><span class="nl-text">RabbitMQ Patterns</span>@if(p.isDone('kafka-rabbitmq-patterns')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Apache Kafka</p>
      <a routerLink="/messaging/kafka-architecture" routerLinkActive="active"><span class="nl-text">Kafka Architecture</span>@if(p.isDone('kafka-kafka-architecture')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/messaging/kafka-producers-consumers" routerLinkActive="active"><span class="nl-text">Producers &amp; Consumers</span>@if(p.isDone('kafka-kafka-producers-consumers')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/messaging/kafka-streams" routerLinkActive="active"><span class="nl-text">Kafka Streams &amp; KSQL</span>@if(p.isDone('kafka-kafka-streams')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/messaging/kafka-connect" routerLinkActive="active"><span class="nl-text">Kafka Connect</span>@if(p.isDone('kafka-kafka-connect')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/messaging/schema-registry" routerLinkActive="active"><span class="nl-text">Schema Registry</span>@if(p.isDone('kafka-schema-registry')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Patterns</p>
      <a routerLink="/messaging/messaging-patterns" routerLinkActive="active"><span class="nl-text">Enterprise Messaging Patterns</span>@if(p.isDone('kafka-messaging-patterns')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/messaging/saga-pattern" routerLinkActive="active"><span class="nl-text">Saga Pattern</span>@if(p.isDone('kafka-saga-pattern')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/messaging/outbox-pattern" routerLinkActive="active"><span class="nl-text">Outbox Pattern</span>@if(p.isDone('kafka-outbox-pattern')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Azure Service Bus</p>
      <a routerLink="/messaging/azure-service-bus" routerLinkActive="active"><span class="nl-text">Azure Service Bus</span>@if(p.isDone('kafka-azure-service-bus')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/messaging/azure-event-grid" routerLinkActive="active"><span class="nl-text">Event Grid &amp; Event Hubs</span>@if(p.isDone('kafka-azure-event-grid')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">AWS SQS/SNS</p>
      <a routerLink="/messaging/aws-sqs" routerLinkActive="active"><span class="nl-text">AWS SQS</span>@if(p.isDone('kafka-aws-sqs')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/messaging/aws-sns-eventbridge" routerLinkActive="active"><span class="nl-text">AWS SNS &amp; EventBridge</span>@if(p.isDone('kafka-aws-sns-eventbridge')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reliability</p>
      <a routerLink="/messaging/idempotency" routerLinkActive="active"><span class="nl-text">Idempotency &amp; Exactly-Once</span>@if(p.isDone('kafka-idempotency')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/messaging/message-ordering" routerLinkActive="active"><span class="nl-text">Message Ordering</span>@if(p.isDone('kafka-message-ordering')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/messaging/backpressure" routerLinkActive="active"><span class="nl-text">Backpressure &amp; Flow Control</span>@if(p.isDone('kafka-backpressure')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/messaging/monitoring" routerLinkActive="active"><span class="nl-text">Monitoring Messaging Systems</span></a>
      <a routerLink="/messaging/messaging-security" routerLinkActive="active"><span class="nl-text">Messaging Security</span></a>
    </div>
  `,
})
export class MessagingNavComponent {
  p = inject(ProgressService);
  private router = inject(Router);

  subtopicsOf(routeSlug: string) {
    return SUBTOPICS[routeSlug] ?? null;
  }

  private expandedTopics = signal<Set<string>>(new Set());

  isSubtopicsExpanded(routeSlug: string): boolean {
    return this.expandedTopics().has(routeSlug);
  }

  toggleSubtopics(routeSlug: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const next = new Set(this.expandedTopics());
    next.has(routeSlug) ? next.delete(routeSlug) : next.add(routeSlug);
    this.expandedTopics.set(next);
  }

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.autoExpandForCurrentUrl());
    this.autoExpandForCurrentUrl();
  }

  private autoExpandForCurrentUrl(): void {
    const url = this.router.url.split('?')[0];
    for (const [topicSlug, subs] of Object.entries(SUBTOPICS)) {
      if (subs.some(s => s.route === url)) {
        this.expandedTopics.update(set => new Set(set).add(topicSlug));
        break;
      }
    }
  }
}
