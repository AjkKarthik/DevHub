import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DecisionNode {
  id: string;
  question: string;
  yes?: string;
  no?: string;
  pattern?: string;
  patternRoute?: string;
  note?: string;
}

interface Comparison {
  title: string;
  patterns: string[];
  criteria: { label: string; values: string[] }[];
}

const COMPARISONS: Comparison[] = [
  {
    title: 'Creating objects',
    patterns: ['Factory Method', 'Abstract Factory', 'Builder', 'Prototype'],
    criteria: [
      { label: 'Scenario', values: ['Subclass picks product type', 'Family of related products', 'Many optional params / steps', 'Clone existing object'] },
      { label: 'Output', values: ['One product type', 'Multiple coordinated types', 'One complex object', 'Copy of source'] },
      { label: '.NET example', values: ['ILoggerProvider', 'UI theme factory', 'WebApplicationBuilder', 'MemberwiseClone'] },
    ],
  },
  {
    title: 'Adapter vs Decorator vs Proxy',
    patterns: ['Adapter', 'Decorator', 'Proxy'],
    criteria: [
      { label: 'Changes interface?', values: ['Yes — converts to target', 'No — same interface', 'No — same interface'] },
      { label: 'Adds behaviour?', values: ['No — only translates', 'Yes — wraps + enhances', 'Optionally'] },
      { label: 'Use case', values: ['3rd-party incompatible API', 'Logging, caching, metrics', 'Lazy load, auth, remote'] },
      { label: '.NET example', values: ['StripeAdapter : IPaymentGateway', 'CachedRepository', 'EF Core lazy proxy'] },
    ],
  },
  {
    title: 'Strategy vs Template Method vs Command',
    patterns: ['Strategy', 'Template Method', 'Command'],
    criteria: [
      { label: 'Variation point', values: ['Whole algorithm', 'Steps inside fixed algo', 'The action itself'] },
      { label: 'Mechanism', values: ['Composition (inject)', 'Inheritance (override)', 'Encapsulate as object'] },
      { label: 'Runtime swap?', values: ['Yes', 'No (compile-time)', 'Yes (queue, undo)'] },
      { label: '.NET example', values: ['IDiscountStrategy', 'DbMigration.Up()', 'MediatR IRequest'] },
    ],
  },
  {
    title: 'Observer vs Mediator vs Event Sourcing',
    patterns: ['Observer', 'Mediator', 'Event Sourcing'],
    criteria: [
      { label: 'Direction', values: ['1 subject → N observers', 'N ↔ N via hub', 'Append-only event log'] },
      { label: 'Coupling', values: ['Subject knows Observer list', 'All decouple via Mediator', 'Producer knows nothing'] },
      { label: 'Persistence', values: ['No', 'No', 'Yes — events are stored'] },
      { label: '.NET example', values: ['C# events, Rx.NET', 'MediatR, SignalR Hub', 'EventStoreDB, Marten'] },
    ],
  },
  {
    title: 'Repository vs CQRS vs Clean Architecture',
    patterns: ['Repository', 'CQRS', 'Clean Architecture'],
    criteria: [
      { label: 'Problem solved', values: ['Hide persistence tech', 'Separate read & write', 'Layer isolation'] },
      { label: 'Scope', values: ['Data access layer', 'Application layer', 'Whole architecture'] },
      { label: 'Complexity', values: ['Low', 'Medium', 'High'] },
      { label: 'Use when', values: ['Any non-trivial app', 'Read/write loads differ', 'Complex domain, long-lived'] },
    ],
  },
  {
    title: 'Saga vs Outbox vs Unit of Work',
    patterns: ['Unit of Work', 'Outbox', 'Saga'],
    criteria: [
      { label: 'Scope', values: ['Single DB, single process', 'Single DB → broker', 'Multiple services/DBs'] },
      { label: 'Atomicity', values: ['Full ACID transaction', 'DB + event reliable pub', 'Eventual consistency'] },
      { label: 'Failure handling', values: ['Rollback', 'Retry relay', 'Compensating transactions'] },
      { label: '.NET tool', values: ['EF Core DbContext', 'MassTransit EF Outbox', 'MassTransit StateMachine'] },
    ],
  },
];

const DECISION_CARDS = [
  { icon: '🏗️', title: 'Need to create objects', desc: 'Use Factory Method when a subclass picks the type; Abstract Factory for coordinated families; Builder for many optional params; Prototype to clone.' },
  { icon: '🔌', title: 'Need to adapt an interface', desc: 'Use Adapter to make incompatible interfaces compatible. Use Facade to simplify a complex subsystem. Use Proxy to control access.' },
  { icon: '🎭', title: 'Need behaviour variations', desc: 'Use Strategy to swap full algorithms at runtime. Use Template Method for a fixed skeleton with variable steps. Use Decorator to add behaviour by wrapping.' },
  { icon: '📡', title: 'Need object communication', desc: 'Use Observer for one-to-many event notification. Use Mediator to decouple many-to-many. Use Command to encapsulate and queue actions.' },
  { icon: '🗄️', title: 'Need to abstract data access', desc: 'Use Repository to hide persistence. Add Unit of Work for multi-aggregate transactions. Add Specification for composable query predicates.' },
  { icon: '🌐', title: 'Need distributed reliability', desc: 'Use Outbox to reliably publish events with DB changes. Use Saga for cross-service distributed transactions with compensations.' },
  { icon: '🏛️', title: 'Need architectural structure', desc: 'Use Clean Architecture for domain independence. Use CQRS to separate read/write models. Use Event Sourcing when full audit trail is needed.' },
  { icon: '🧭', title: 'Need design principles', desc: 'Apply SOLID for maintainable OOP. Use GRASP to assign responsibilities. DRY/KISS/YAGNI keep code lean. DIP makes everything testable.' },
];

@Component({
  selector: 'app-dp-pattern-decision',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pattern-decision.html',
  styleUrl: './pattern-decision.scss',
})
export class DpPatternDecision {
  comparisons = COMPARISONS;
  decisionCards = DECISION_CARDS;
  activeComparison = signal(0);

  setComparison(i: number) { this.activeComparison.set(i); }
  get current() { return this.comparisons[this.activeComparison()]; }
}
