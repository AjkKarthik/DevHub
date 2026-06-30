import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'Intent',      type: 'keyword', desc: 'Define an interface for creating an object, but let subclasses decide which class to instantiate.' },
  { name: 'Category',    type: 'keyword', desc: 'Creational — delegates instantiation to subclasses.' },
  { name: 'Creator',     type: 'class',   desc: 'Abstract class declaring the factory method that returns a Product.' },
  { name: 'Product',     type: 'class',   desc: 'Interface for objects created by the factory method.' },
  { name: 'Open/Closed', type: 'keyword', desc: 'Add new product types by adding new Creator subclasses — no change to existing code.' },
  { name: 'vs Constructor', type: 'method', desc: 'Factory Method names the operation (intent-revealing); constructors always use the class name.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Factory Method Pattern?',
    points: [
      'Factory Method defines an interface for creating objects, but lets subclasses decide which class to instantiate.',
      'The "factory method" is a virtual or abstract method in the Creator class.',
      'Concrete Creators override the factory method to return instances of specific Concrete Products.',
      'Callers use the Creator via its abstract interface and never know which concrete Product they received.',
    ],
  },
  {
    heading: 'Structure: Creator and Product',
    points: [
      'Product: the interface or abstract class that concrete objects implement (e.g., INotification).',
      'ConcreteProduct: the specific type created (EmailNotification, SmsNotification, PushNotification).',
      'Creator: abstract class with a factory method (CreateNotification()) and uses the Product.',
      'ConcreteCreator: overrides CreateNotification() to return a specific product.',
    ],
  },
  {
    heading: 'Factory Method vs Simple Factory vs Abstract Factory',
    points: [
      'Simple Factory: a static method on a class that switches on a type code — not a GoF pattern.',
      'Factory Method: uses inheritance — subclasses override a method to return different products.',
      'Abstract Factory: uses composition — an interface with multiple factory methods for product families.',
      'Choose Factory Method when you need one level of variation; Abstract Factory for product families.',
    ],
  },
  {
    heading: '.NET Examples',
    points: [
      'Stream is a Creator; FileStream, MemoryStream, NetworkStream are Concrete Products.',
      'DbConnection.CreateCommand() is a factory method returning DbCommand.',
      'ILoggerProvider.CreateLogger() is a factory method returning ILogger.',
      'HttpMessageHandlerFactory in HttpClient infrastructure follows the factory method shape.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Classic Pattern',
    language: 'csharp',
    code: `// Product interface
public interface INotification
{
    void Send(string recipient, string message);
}

// Concrete Products
public class EmailNotification : INotification
{
    public void Send(string recipient, string message) =>
        Console.WriteLine($"Email → {recipient}: {message}");
}

public class SmsNotification : INotification
{
    public void Send(string recipient, string message) =>
        Console.WriteLine($"SMS → {recipient}: {message}");
}

// Creator — declares the factory method
public abstract class NotificationService
{
    protected abstract INotification CreateNotification();

    public void Notify(string recipient, string message)
    {
        var notification = CreateNotification(); // factory method
        notification.Send(recipient, message);
    }
}

// Concrete Creators
public class EmailService : NotificationService
{
    protected override INotification CreateNotification() => new EmailNotification();
}

public class SmsService : NotificationService
{
    protected override INotification CreateNotification() => new SmsNotification();
}

// Usage
NotificationService service = new EmailService();
service.Notify("user@example.com", "Your order shipped!");`,
  },
  {
    label: 'DI Approach',
    language: 'csharp',
    code: `// Modern .NET: use a factory interface registered in DI
public interface INotificationFactory
{
    INotification Create(string channel);
}

public class NotificationFactory : INotificationFactory
{
    public INotification Create(string channel) => channel switch
    {
        "email" => new EmailNotification(),
        "sms"   => new SmsNotification(),
        "push"  => new PushNotification(),
        _       => throw new ArgumentException(\`Unknown channel: {channel}\`)
    };
}

// Register
builder.Services.AddSingleton<INotificationFactory, NotificationFactory>();

// Inject wherever needed — clean, testable
public class OrderService(INotificationFactory factory)
{
    public void ShipOrder(Order order)
    {
        var n = factory.Create(order.PreferredChannel);
        n.Send(order.CustomerEmail, "Your order shipped!");
    }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Switching on enum instead of using subclasses',
    wrong: `INotification Create(NotificationType type) => type switch {
    NotificationType.Email => new EmailNotification(),
    NotificationType.Sms   => new SmsNotification(),
    // Adding new types requires editing this switch
};`,
    right: `// Each ConcreteCreator adds a new product type
// without touching existing code — Open/Closed Principle`,
    explanation: 'A type-switching factory violates OCP — every new type forces an edit to the switch. Factory Method moves the variation into new subclasses.',
  },
  {
    title: 'Making the factory method public',
    wrong: `public abstract INotification CreateNotification();`,
    right: `protected abstract INotification CreateNotification();`,
    explanation: 'The factory method is an implementation detail of the Creator, not part of its public API. Callers use Notify() — they should never call CreateNotification() directly.',
  },
  {
    title: 'Confusing Factory Method with Abstract Factory',
    wrong: `// "I need a factory" → immediately reach for Abstract Factory`,
    right: `// One product type varying? → Factory Method
// Multiple related products that must match? → Abstract Factory`,
    explanation: 'Factory Method uses inheritance and one factory method. Abstract Factory uses composition with multiple factory methods for coordinated product families.',
  },
  {
    title: 'Not returning the Product interface',
    wrong: `protected EmailNotification CreateNotification() => new EmailNotification();`,
    right: `protected INotification CreateNotification() => new EmailNotification();`,
    explanation: 'Returning a concrete type instead of the interface defeats the pattern — the Creator becomes coupled to the concrete product, breaking polymorphism.',
  },
];

const challenge: Challenge = {
  title: 'Log Exporter Factory',
  language: 'typescript',
  description: `Implement a Factory Method pattern for log exporters.
Create an abstract LogExporter with a factory method createFormatter().
Concrete exporters for JSON and CSV should create different formatters.
Each formatter has a format(entries: string[]): string method.`,
  hints: [
    'LogExporter is the Creator with abstract createFormatter()',
    'JsonExporter and CsvExporter are the ConcreteCreators',
    'IFormatter is the Product interface',
  ],
  starterCode: `interface IFormatter {
  format(entries: string[]): string;
}

abstract class LogExporter {
  protected abstract createFormatter(): IFormatter;

  export(entries: string[]): void {
    const formatter = this.createFormatter();
    console.log(formatter.format(entries));
  }
}

// TODO: implement JsonExporter and CsvExporter`,
  solution: `interface IFormatter {
  format(entries: string[]): string;
}

class JsonFormatter implements IFormatter {
  format(entries: string[]): string {
    return JSON.stringify(entries.map((e, i) => ({ id: i, log: e })), null, 2);
  }
}

class CsvFormatter implements IFormatter {
  format(entries: string[]): string {
    return ['id,log', ...entries.map((e, i) => \`\${i},"\${e}"\`)].join('\\n');
  }
}

abstract class LogExporter {
  protected abstract createFormatter(): IFormatter;
  export(entries: string[]): void {
    console.log(this.createFormatter().format(entries));
  }
}

class JsonExporter extends LogExporter {
  protected createFormatter(): IFormatter { return new JsonFormatter(); }
}

class CsvExporter extends LogExporter {
  protected createFormatter(): IFormatter { return new CsvFormatter(); }
}

const logs = ['User login', 'Order placed', 'Payment processed'];
new JsonExporter().export(logs);
new CsvExporter().export(logs);`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What makes Factory Method different from a Simple Factory (static factory)?',
    options: [
      'Factory Method uses static methods; Simple Factory uses virtual methods',
      'Factory Method uses inheritance and subclasses override it; Simple Factory is just a static switch',
      'Factory Method creates product families; Simple Factory creates one product type',
      'There is no difference — they are the same pattern',
    ],
    answer: 1,
    explanation: 'Factory Method is a GoF pattern using inheritance where subclasses decide the concrete type. A Simple Factory is just a static switch — convenient but not extensible via OCP.',
  },
  {
    q: 'What is the visibility of the factory method in the classic GoF pattern?',
    options: ['public', 'private', 'protected', 'internal'],
    answer: 2,
    explanation: 'The factory method is typically protected — it is called by the Creator itself (in the template method), not by external callers. Making it public exposes an implementation detail.',
  },
  {
    q: 'DbConnection.CreateCommand() is a classic example of Factory Method in .NET. What are the Creator and Product?',
    options: [
      'Creator = SqlCommand, Product = DbConnection',
      'Creator = DbConnection, Product = DbCommand',
      'Creator = IDbFactory, Product = IDbCommand',
      'Creator = DbContext, Product = DbSet',
    ],
    answer: 1,
    explanation: 'DbConnection is the Creator with its CreateCommand() factory method. DbCommand (the returned abstract type) is the Product. SqlConnection returns SqlCommand, OracleConnection returns OracleCommand.',
  },
  { q: 'What is the Factory Method pattern and how does it work?', options: ['A method that uses new to create objects, centralizing instantiation', 'A creational pattern that defines an interface for creating an object but lets subclasses decide which class to instantiate', 'A static utility method that constructs objects without using constructors', 'A method that creates product instances from a configuration file'], answer: 1, explanation: 'Factory Method defines an abstract creator class with a factory method (createProduct()), which subclasses override to produce specific products. The base class contains business logic that calls the factory method to create products; it does not know the concrete product type. Concrete creator subclasses implement the factory method and return instances of specific product classes. This lets the creator class depend only on the product interface, not concrete classes. Example: Dialog class with createButton(); WindowsDialog overrides it to return WindowsButton; MacDialog returns MacButton.' },
  { q: 'What is the difference between Factory Method and a static factory method?', options: ['They are identical; both are called factory methods', 'Factory Method (pattern) uses inheritance to defer instantiation to subclasses; a static factory method is a static utility method on a class for naming and flexibility over constructors', 'Static factory methods are faster; Factory Method pattern adds no overhead', 'Factory Method pattern is for interfaces; static factory methods are for abstract classes'], answer: 1, explanation: 'Factory Method (GoF design pattern): abstract creator class with an overridable factory method. Subclasses override it to produce specific product types. Uses inheritance. Common in framework design. Static factory method (Effective Java Item 1): a static method on a class like LocalDate.of() or Optional.of() that creates instances. Not a GoF pattern; it is an alternative to constructors with meaningful names and the ability to return cached instances or subclasses. Both are informally called factory methods but they are different things. Joshua Bloch popularized static factory methods in Java; they do not require subclassing.' },
  { q: 'When should you use Factory Method and when should you use direct instantiation?', options: ['Always use Factory Method; direct instantiation with new is a code smell', 'Use Factory Method when the class that needs to create objects should not be coupled to specific concrete product classes, especially when products should be extensible by subclassing', 'Use Factory Method only in frameworks; in application code always use new directly', 'Use Factory Method when creation is complex; use new when it is a single-argument constructor'], answer: 1, explanation: 'Use Factory Method when: the base class should work with any product type that subclasses provide, without knowing the concrete type. The product type varies based on subclass type (Windows vs. Mac dialog). You are designing a framework where users subclass your creators to provide their products. Avoid Factory Method when: there is only one concrete product type and no plans to extend. The creation logic is trivial. A simple static factory method or constructor suffices. Factory Method adds inheritance complexity; use it when that complexity is justified by the extensibility requirement.' },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use Factory Method over just newing up objects?',
    a: 'When the exact type to create varies by context, configuration, or subclass, and you want callers to be decoupled from concrete types. If you always create the same concrete type, just new it directly — the pattern adds complexity without benefit.',
  },
  {
    q: 'Can Factory Method work without inheritance (abstract class)?',
    a: 'Yes — you can use an interface with a factory method, or a delegate/Func<IProduct> for lightweight factory injection. Modern .NET often prefers a registered factory interface over abstract base classes to avoid deep hierarchies.',
  },
  { q: 'How does Factory Method support the Open/Closed Principle?', a: 'Factory Method allows adding new product types by creating new concrete creator subclasses without modifying the base creator class. Adding a LinuxDialog product: create a LinuxButton class implementing IButton, create a LinuxDialog class extending Dialog and overriding createButton() to return a LinuxButton. The Dialog base class and existing WindowsDialog and MacDialog are unchanged. The application that uses Dialog types can work with LinuxDialog without any modification if it refers to the abstract Dialog type. This is the Open/Closed Principle: the system is open for extension (new dialog/button pairs) but closed for modification (no changes to existing classes).' },
  { q: 'What is the Product and Creator in the Factory Method pattern?', a: 'Product: the interface or abstract class that defines the type of objects the factory method creates. Button, Transport, Logger are products. ConcreteProduct: a specific implementation of the Product interface. WindowsButton, Truck, FileLogger are concrete products. Creator: the abstract class that declares the factory method (createProduct()) returning the Product type. It may provide a default implementation or make the method abstract. The Creator also contains business logic that uses products created by the factory method. ConcreteCreator: a subclass of Creator that implements the factory method to produce a specific ConcreteProduct. WindowsDialog creates WindowsButton.' },
  { q: 'How is Factory Method used in frameworks and libraries?', a: 'Frameworks use Factory Method to let application code extend behavior by subclassing. Examples: Java DocumentBuilder defines createDocument() factory method. Subclasses (DOMDocumentBuilder, SAXDocumentBuilder) return different document types. Spring FactoryBean interface has getObject() as a factory method; implementations create and configure Spring beans. JUnit test runners use factory methods to create test instances. ASP.NET Core ILoggerProvider has CreateLogger() factory method. Framework base classes call the factory method for object creation; application subclasses override it to produce application-specific types. This hook mechanism is the Template Method pattern combined with Factory Method.' },
  { q: 'What are the alternatives to Factory Method for object creation?', a: 'Alternatives: Abstract Factory creates families of related objects (more complex than Factory Method). Builder constructs complex objects step by step with a fluent API. Dependency Injection: inject an interface and let the DI container resolve the implementation; avoids inheritance entirely. Strategy with a factory function: pass a Func<IProduct> or factory interface to the creator instead of subclassing. Object Pool: for expensive-to-create objects, pool and reuse instead of creating each time. Prototype: clone an existing product instead of creating from scratch. For most cases in modern code with DI containers, injecting factory interfaces (Func<T> or IFactory<T>) is preferred over the inheritance-based Factory Method pattern because it avoids deep inheritance hierarchies.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Factory Method uses a virtual/abstract method in a Creator so subclasses decide which Product to instantiate — enabling Open/Closed extensibility.',
  mustKnow: [
    'Creator declares abstract/virtual CreateX() method; ConcreteCreators override it',
    'Product is always returned as the interface, never the concrete type',
    'Open/Closed: add new products by adding new subclasses — no editing existing code',
    'Distinguished from Simple Factory (static switch) and Abstract Factory (product families)',
    '.NET examples: Stream, DbConnection.CreateCommand(), ILoggerProvider.CreateLogger()',
  ],
  interviewFocus: [
    'How does Factory Method follow the Open/Closed Principle?',
    'Factory Method vs Abstract Factory — when would you choose each?',
    'Why is the factory method usually protected, not public?',
  ],
};

@Component({
  selector: 'app-dp-factory-method',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './factory-method.html',
  styleUrl: './factory-method.scss',
})
export class DpFactoryMethod {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
