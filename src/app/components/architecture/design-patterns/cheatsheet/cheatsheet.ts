import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PatternEntry {
  name: string;
  category: 'Creational' | 'Structural' | 'Behavioral' | 'Enterprise' | 'Principles';
  intent: string;
  useWhen: string;
  keyClass: string;
  example: string;
  tags: string[];
}

const PATTERNS: PatternEntry[] = [
  // Creational
  { name: 'Singleton', category: 'Creational', intent: 'Ensure one instance', useWhen: 'Shared config, logger, thread pool', keyClass: 'private constructor + static Instance', example: 'NullLogger.Instance, HttpClientFactory', tags: ['singleton', 'instance', 'creational'] },
  { name: 'Factory Method', category: 'Creational', intent: 'Subclass decides which object to create', useWhen: 'Object type varies by context/subclass', keyClass: 'abstract Creator with abstract FactoryMethod()', example: 'ILoggerProvider.CreateLogger()', tags: ['factory', 'creational', 'virtual'] },
  { name: 'Abstract Factory', category: 'Creational', intent: 'Create families of related objects', useWhen: 'Multiple product families must be consistent', keyClass: 'IAbstractFactory with Create methods', example: 'UI theme factories (Dark/Light)', tags: ['abstract factory', 'family', 'creational'] },
  { name: 'Builder', category: 'Creational', intent: 'Build complex objects step by step', useWhen: 'Many optional parameters; fluent API', keyClass: 'Builder with fluent methods + Build()', example: 'WebApplicationBuilder, StringBuilder', tags: ['builder', 'fluent', 'creational'] },
  { name: 'Prototype', category: 'Creational', intent: 'Clone existing objects', useWhen: 'Object creation is expensive; need copies', keyClass: 'ICloneable / DeepCopy()', example: 'MemberwiseClone, deep copy of config', tags: ['prototype', 'clone', 'creational'] },
  { name: 'Object Pool', category: 'Creational', intent: 'Reuse expensive objects from a pool', useWhen: 'DB connections, threads, parsers', keyClass: 'Pool.Rent() / Pool.Return()', example: 'ArrayPool<T>, ObjectPool<T>', tags: ['pool', 'reuse', 'performance', 'creational'] },
  // Structural
  { name: 'Adapter', category: 'Structural', intent: 'Convert incompatible interface', useWhen: 'Third-party code has wrong interface', keyClass: 'Adapter wraps Adaptee, implements Target', example: 'StripeAdapter : IPaymentGateway', tags: ['adapter', 'wrapper', 'structural'] },
  { name: 'Bridge', category: 'Structural', intent: 'Decouple abstraction from implementation', useWhen: 'Both abstraction and implementation vary', keyClass: 'Abstraction holds IImplementor', example: 'IRenderer (Raster/Vector) + Shape hierarchy', tags: ['bridge', 'structural', 'decouple'] },
  { name: 'Composite', category: 'Structural', intent: 'Treat individual and groups uniformly', useWhen: 'Tree structures: menus, org charts, file systems', keyClass: 'IComponent: Leaf + Composite(children)', example: 'Directory/File, UI widget trees', tags: ['composite', 'tree', 'structural'] },
  { name: 'Decorator', category: 'Structural', intent: 'Add behaviour by wrapping', useWhen: 'Flexible feature combinations at runtime', keyClass: 'Decorator wraps IComponent, delegates + adds', example: 'Logging middleware, CachedRepository', tags: ['decorator', 'wrapper', 'structural'] },
  { name: 'Facade', category: 'Structural', intent: 'Simplify a complex subsystem', useWhen: 'Hide complex internals behind a simple API', keyClass: 'Facade with simple methods delegating to subsystem', example: 'OrderFacade, EmailFacade', tags: ['facade', 'simplify', 'structural'] },
  { name: 'Flyweight', category: 'Structural', intent: 'Share intrinsic state across many objects', useWhen: 'Millions of similar objects; memory pressure', keyClass: 'FlyweightFactory cache + extrinsic state as parameter', example: 'string interning, glyph rendering', tags: ['flyweight', 'memory', 'structural'] },
  { name: 'Proxy', category: 'Structural', intent: 'Control access to an object', useWhen: 'Lazy load, logging, auth, caching, remote', keyClass: 'Proxy implements same interface as Subject', example: 'EF Core lazy loading, YARP reverse proxy', tags: ['proxy', 'structural', 'lazy'] },
  // Behavioral
  { name: 'Chain of Responsibility', category: 'Behavioral', intent: 'Pass request along handler chain', useWhen: 'Multiple handlers; sender unaware of which', keyClass: 'Handler.SetNext(next); Handle(request)', example: 'ASP.NET Core middleware pipeline', tags: ['chain', 'pipeline', 'behavioral'] },
  { name: 'Command', category: 'Behavioral', intent: 'Encapsulate request as object', useWhen: 'Undo/redo, queuing, logging actions', keyClass: 'ICommand.Execute() / Undo()', example: 'MediatR IRequest, text editor undo', tags: ['command', 'undo', 'behavioral'] },
  { name: 'Iterator', category: 'Behavioral', intent: 'Sequential access without exposing internals', useWhen: 'Custom collections; lazy/infinite sequences', keyClass: 'IEnumerable<T> + yield return', example: 'foreach, IAsyncEnumerable<T>', tags: ['iterator', 'enumerable', 'behavioral'] },
  { name: 'Mediator', category: 'Behavioral', intent: 'Central hub for object communication', useWhen: 'Many-to-many communication; loose coupling', keyClass: 'IMediator.Send() / Publish()', example: 'MediatR, SignalR Hub', tags: ['mediator', 'behavioral', 'hub'] },
  { name: 'Memento', category: 'Behavioral', intent: 'Capture and restore object state', useWhen: 'Undo/snapshot/checkpoint; without breaking encapsulation', keyClass: 'Originator, Memento, Caretaker', example: 'Text editor undo, game save', tags: ['memento', 'undo', 'snapshot', 'behavioral'] },
  { name: 'Observer', category: 'Behavioral', intent: 'Notify dependents of state changes', useWhen: 'Event-driven; one-to-many notifications', keyClass: 'IObservable<T> / IObserver<T> / event', example: 'C# events, INotifyPropertyChanged, Rx.NET', tags: ['observer', 'event', 'behavioral'] },
  { name: 'State', category: 'Behavioral', intent: 'Change behaviour when internal state changes', useWhen: 'State machines; behaviour varies per state', keyClass: 'Context delegates to IState; transitions change state', example: 'Order state machine, MassTransit StateMachine', tags: ['state', 'behavioral', 'machine'] },
  { name: 'Strategy', category: 'Behavioral', intent: 'Swap algorithms at runtime', useWhen: 'Multiple algorithms for same task; runtime selection', keyClass: 'Context(IStrategy); Strategy.Execute()', example: 'Sort algorithms, payment providers, discount rules', tags: ['strategy', 'algorithm', 'behavioral'] },
  { name: 'Template Method', category: 'Behavioral', intent: 'Fixed algorithm skeleton; steps overridden', useWhen: 'Fixed overall flow; variable steps', keyClass: 'sealed TemplateMethod() calls abstract/virtual steps', example: 'DbMigration.Up()/Down(), ASP.NET controller filters', tags: ['template method', 'behavioral', 'inheritance'] },
  { name: 'Visitor', category: 'Behavioral', intent: 'Add operations to hierarchy without modifying', useWhen: 'New operations on stable element types', keyClass: 'element.Accept(visitor); visitor.Visit(element)', example: 'ExpressionVisitor, Roslyn SyntaxWalker', tags: ['visitor', 'behavioral', 'double dispatch'] },
  { name: 'Null Object', category: 'Behavioral', intent: 'Do-nothing default object — eliminate null checks', useWhen: 'Optional dependencies; no-op default', keyClass: 'NullX : IInterface with empty method bodies', example: 'NullLogger<T>, Stream.Null', tags: ['null object', 'behavioral', 'no-op'] },
  // Enterprise
  { name: 'Repository', category: 'Enterprise', intent: 'Abstract data access behind collection interface', useWhen: 'Decouple domain from persistence; testability', keyClass: 'IRepository<T>: GetById, Add, Find', example: 'OrderRepository, Ardalis.Specification', tags: ['repository', 'enterprise', 'data'] },
  { name: 'Unit of Work', category: 'Enterprise', intent: 'Track changes; commit atomically', useWhen: 'Multiple repository operations in one transaction', keyClass: 'IUnitOfWork.SaveChangesAsync()', example: 'DbContext (EF Core built-in UoW)', tags: ['unit of work', 'enterprise', 'transaction'] },
  { name: 'CQRS', category: 'Enterprise', intent: 'Separate read and write models', useWhen: 'Read/write loads differ; complex write side', keyClass: 'IRequest<T> + IRequestHandler<T> (MediatR)', example: 'PlaceOrderCommand + GetOrderQuery', tags: ['cqrs', 'enterprise', 'mediatr'] },
  { name: 'Event Sourcing', category: 'Enterprise', intent: 'Store state as event sequence', useWhen: 'Full audit trail; temporal queries; event replay', keyClass: 'Append-only EventStore; replay to reconstruct state', example: 'Bank account, OrderPlaced event stream', tags: ['event sourcing', 'enterprise', 'events'] },
  { name: 'Saga', category: 'Enterprise', intent: 'Distributed transaction via compensations', useWhen: 'Cross-service operations needing eventual consistency', keyClass: 'Choreography (events) or Orchestration (state machine)', example: 'MassTransit StateMachine, order placement flow', tags: ['saga', 'enterprise', 'distributed'] },
  { name: 'Outbox', category: 'Enterprise', intent: 'Reliable event publish with domain changes', useWhen: 'Avoid dual-write: DB commit + broker publish', keyClass: 'OutboxMessage in same transaction; relay publishes later', example: 'MassTransit EF Core Outbox', tags: ['outbox', 'enterprise', 'messaging'] },
  { name: 'Specification', category: 'Enterprise', intent: 'Encapsulate query predicates as objects', useWhen: 'Reusable business rules for query + validation', keyClass: 'IsSatisfiedBy(entity) + ToExpression() for SQL', example: 'Ardalis.Specification, EligibleForDiscountSpec', tags: ['specification', 'enterprise', 'query'] },
  { name: 'Clean Architecture', category: 'Enterprise', intent: 'Concentric layers; dependencies inward', useWhen: 'Complex domain; need infrastructure independence', keyClass: 'Domain → Application → Infrastructure → Presentation', example: 'Jason Taylor template, eShopOnWeb', tags: ['clean architecture', 'enterprise', 'layers'] },
  // Principles
  { name: 'SOLID', category: 'Principles', intent: 'SRP, OCP, LSP, ISP, DIP', useWhen: 'Every OOP codebase — foundation of maintainable design', keyClass: 'Interfaces, abstract classes, DI', example: 'IDiscountStrategy (OCP), IOrderRepository (DIP)', tags: ['solid', 'srp', 'ocp', 'lsp', 'isp', 'dip', 'principles'] },
  { name: 'GRASP', category: 'Principles', intent: 'Who should own a responsibility?', useWhen: 'Responsibility assignment during design', keyClass: 'Information Expert, Creator, Low Coupling', example: 'Order.Total (Expert), OrderRepository (Pure Fabrication)', tags: ['grasp', 'principles', 'responsibility'] },
  { name: 'DRY / KISS / YAGNI', category: 'Principles', intent: 'No duplication, keep simple, build what is needed', useWhen: 'Every session; every code review', keyClass: 'Rule of Three, DAMP in tests', example: 'TaxPolicy.Apply() (DRY), Guid.NewGuid() over factory (KISS)', tags: ['dry', 'kiss', 'yagni', 'principles'] },
  { name: 'Dependency Inversion', category: 'Principles', intent: 'Depend on abstractions, not concretions', useWhen: 'Every class with dependencies', keyClass: 'Interface + constructor injection + IoC container', example: 'IOrderRepository, IEmailService, Composition Root', tags: ['dip', 'dependency injection', 'ioc', 'principles'] },
];

const CATEGORIES = ['All', 'Creational', 'Structural', 'Behavioral', 'Enterprise', 'Principles'] as const;
type Category = typeof CATEGORIES[number];

@Component({
  selector: 'app-dp-cheatsheet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class DpCheatsheet {
  search    = signal('');
  activeTab = signal<Category>('All');

  readonly categories = CATEGORIES;

  filtered = computed(() => {
    const q   = this.search().toLowerCase();
    const cat = this.activeTab();
    return PATTERNS.filter(p => {
      const matchesCat = cat === 'All' || p.category === cat;
      if (!q) return matchesCat;
      return matchesCat && (
        p.name.toLowerCase().includes(q) ||
        p.intent.toLowerCase().includes(q) ||
        p.useWhen.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q))
      );
    });
  });

  setTab(cat: Category) { this.activeTab.set(cat); }
}
