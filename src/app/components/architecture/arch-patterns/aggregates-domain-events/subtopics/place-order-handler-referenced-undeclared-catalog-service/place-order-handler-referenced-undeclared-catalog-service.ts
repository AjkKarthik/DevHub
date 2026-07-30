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
  templateUrl: './place-order-handler-referenced-undeclared-catalog-service.html',
  styleUrl: './place-order-handler-referenced-undeclared-catalog-service.scss'
})
export class PlaceOrderHandlerReferencedUndeclaredCatalogServiceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A constructor that only declares two of the three dependencies it actually uses',
      points: [
        'The "Saving & Publishing Events" codeTab\'s <code>PlaceOrderHandler</code> declares exactly two constructor parameters: <code>orders: IOrderRepository</code> and <code>events: IDomainEventPublisher</code>.',
        'But its own <code>handle()</code> method calls <code>this.catalogService.getPrice(line.productId)</code> — a field that was never declared as a constructor parameter, a class property, or anything else on the class.',
        'In real TypeScript under strict mode, this is a compile error: <code>Property \'catalogService\' does not exist on type \'PlaceOrderHandler\'.</code> The code as originally written could not actually compile, let alone run.',
      ]
    },
    {
      heading: 'Why this specific kind of gap is easy to introduce and easy to miss',
      points: [
        'It happens when a handler is drafted top-down: first the "shape" of the method body (loop over lines, look up a price, add each line), then the constructor is filled in afterward from memory rather than by re-reading the body — and one dependency the body actually needs gets forgotten.',
        'It reads as correct on a skim, because <code>this.catalogService</code> LOOKS like a normal, expected field on an application-service class that talks to several collaborators (a repository, an event publisher, and — very plausibly — a pricing service) — nothing about the syntax itself signals anything is wrong.',
        'The fix is mechanical once caught: add the missing dependency to the constructor parameter list, exactly the way <code>orders</code> and <code>events</code> are already declared, so the field the method body already expects actually exists on the class.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Before and after — the constructor catching up to the method body',
      language: 'typescript',
      code: `// BEFORE -- compiles to an error: catalogService does not exist
class PlaceOrderHandler {
  constructor(
    private orders: IOrderRepository,
    private events: IDomainEventPublisher,
  ) {}

  async handle(cmd: PlaceOrderCommand): Promise<string> {
    const order = new Order(generateId(), cmd.customerId);
    for (const line of cmd.lines) {
      // TS2339: Property 'catalogService' does not exist on type 'PlaceOrderHandler'.
      const price = await this.catalogService.getPrice(line.productId);
      order.addLine(line.productId, line.qty, price);
    }
    order.place();
    await this.orders.save(order);
    await this.events.publishAll(order.domainEvents);
    order.clearDomainEvents();
    return order.id;
  }
}

// AFTER -- the constructor now declares every dependency the body uses
class PlaceOrderHandler {
  constructor(
    private orders: IOrderRepository,
    private events: IDomainEventPublisher,
    private catalogService: ICatalogService,   // <-- the missing piece
  ) {}

  async handle(cmd: PlaceOrderCommand): Promise<string> {
    const order = new Order(generateId(), cmd.customerId);
    for (const line of cmd.lines) {
      const price = await this.catalogService.getPrice(line.productId); // now valid
      order.addLine(line.productId, line.qty, price);
    }
    order.place();
    await this.orders.save(order);
    await this.events.publishAll(order.domainEvents);
    order.clearDomainEvents();
    return order.id;
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate reviewing a pull request says: "This will run fine — <code>catalogService</code> is clearly meant to be a pricing service, and JavaScript classes let you access any property on <code>this</code>." Are they right?',
    hint: 'Is this TypeScript being COMPILED, or is it being loosely interpreted as JavaScript at runtime?',
    solution: 'They are wrong about the compile step, though half-right about intent. TypeScript in strict mode (the default for a project with proper compiler settings) will reject this at COMPILE time with a TS2339 error — "Property \'catalogService\' does not exist on type \'PlaceOrderHandler\'" — long before it ever gets a chance to run. It is true that plain JavaScript would let you read <code>this.catalogService</code> at runtime and simply get <code>undefined</code> (then throw a separate error, <code>Cannot read properties of undefined</code>, the moment <code>.getPrice()</code> is called on it) — but that is exactly the class of bug TypeScript\'s static type checking exists to catch before the code ever ships. The reviewer\'s intuition about what the field is FOR is reasonable; their claim that it "will run fine" is not.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a method body references <code>this.someField</code> and it reads naturally in context, the class must already declare that field somewhere.',
      reality: 'Per this subtopic\'s theory, that is exactly the gap that slipped through here — the field read naturally (a pricing service on an order-placement handler) but was never actually declared on the class, and TypeScript strict mode is what catches the mismatch.'
    },
    {
      thought: 'A constructor with dependency-injected parameters is just a formality — the important part is what the method body actually does.',
      reality: 'Per this subtopic\'s theory, the constructor parameter list IS the authoritative list of what the class has to work with — a method body cannot use a dependency that was never declared there, no matter how reasonable that dependency would be.'
    },
    {
      thought: 'This kind of missing-field bug only happens in loosely-typed JavaScript, not in TypeScript.',
      reality: 'Per this subtopic\'s theory, TypeScript strict mode is specifically what turns this into a compile-time error instead of a runtime crash — the bug can still be INTRODUCED while drafting code, but it gets caught before shipping rather than silently reaching production.'
    }
  ];
}
