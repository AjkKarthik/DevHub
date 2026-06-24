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
  { name: 'Intent',           type: 'keyword', desc: 'Provide an interface for creating families of related objects without specifying concrete classes.' },
  { name: 'Abstract Factory', type: 'interface', desc: 'The interface declaring creation methods for each product type in a family.' },
  { name: 'Concrete Factory', type: 'class',   desc: 'Implements creation methods for a specific product family (SQL Server, PostgreSQL).' },
  { name: 'Product Family',   type: 'keyword', desc: 'A set of related objects that must be used together (Connection + Command + Reader).' },
  { name: 'vs Factory Method', type: 'keyword', desc: 'Factory Method handles ONE product via inheritance; Abstract Factory handles MULTIPLE products via composition.' },
  { name: 'Client',           type: 'keyword', desc: 'Uses only the abstract interfaces — completely decoupled from concrete product families.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Abstract Factory Pattern?',
    points: [
      'Abstract Factory provides an interface for creating families of related objects without specifying their concrete classes.',
      'The key constraint: all products created by a factory belong to the same family and must be compatible with each other.',
      'Clients program to the abstract factory and abstract product interfaces — they never reference concrete classes.',
      'Switching the entire product family means swapping one factory for another — no client code changes.',
    ],
  },
  {
    heading: 'Structure: Roles',
    points: [
      'AbstractFactory: interface with a Create method per product type in the family.',
      'ConcreteFactory: implements AbstractFactory for one specific family (SqlServerFactory, PostgresFactory).',
      'AbstractProduct: interface for each type of product (IDbConnection, IDbCommand).',
      'ConcreteProduct: specific product created by a ConcreteFactory (SqlServerConnection, PostgresConnection).',
      'Client: receives the factory via DI and calls factory methods — never uses `new` on concrete types.',
    ],
  },
  {
    heading: 'Factory Method vs Abstract Factory',
    points: [
      'Factory Method: one factory method, variation via subclassing the Creator.',
      'Abstract Factory: multiple factory methods in an interface, variation via swapping the whole factory object.',
      'Abstract Factory is "a collection of Factory Methods" coordinated so products are always compatible.',
      'Choose Abstract Factory when products must be used together and switching one breaks the others.',
    ],
  },
  {
    heading: 'Real-World .NET Examples',
    points: [
      'ADO.NET DbProviderFactory: CreateConnection(), CreateCommand(), CreateDataAdapter() — one factory per database.',
      'EF Core uses provider-specific factory internals to produce SQL-specific components.',
      'UI theming: one factory producing Button, TextBox, Dialog styled for Material or Fluent.',
      'Cross-platform: one factory per platform producing platform-native UI controls.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Classic Pattern',
    language: 'csharp',
    code: `// Abstract Products
public interface IButton { void Render(); }
public interface ICheckbox { void Render(); }

// Concrete Products — Windows family
public class WinButton : IButton { public void Render() => Console.WriteLine("Windows Button"); }
public class WinCheckbox : ICheckbox { public void Render() => Console.WriteLine("Windows Checkbox"); }

// Concrete Products — Mac family
public class MacButton : IButton { public void Render() => Console.WriteLine("Mac Button"); }
public class MacCheckbox : ICheckbox { public void Render() => Console.WriteLine("Mac Checkbox"); }

// Abstract Factory
public interface IUiFactory
{
    IButton CreateButton();
    ICheckbox CreateCheckbox();
}

// Concrete Factories
public class WindowsUiFactory : IUiFactory
{
    public IButton CreateButton() => new WinButton();
    public ICheckbox CreateCheckbox() => new WinCheckbox();
}

public class MacUiFactory : IUiFactory
{
    public IButton CreateButton() => new MacButton();
    public ICheckbox CreateCheckbox() => new MacCheckbox();
}

// Client — only knows abstract interfaces
public class Application(IUiFactory factory)
{
    public void BuildUi()
    {
        var button = factory.CreateButton();
        var check  = factory.CreateCheckbox();
        button.Render();
        check.Render();
    }
}

// Composition root: inject the right factory
var app = new Application(new WindowsUiFactory());
app.BuildUi();`,
  },
  {
    label: 'ADO.NET Example',
    language: 'csharp',
    code: `// .NET's built-in Abstract Factory: DbProviderFactory
// Concrete factories: SqlClientFactory, NpgsqlFactory, MySqlClientFactory

public class DataAccess(DbProviderFactory factory, string connectionString)
{
    public IEnumerable<string> GetUserNames()
    {
        using var conn = factory.CreateConnection()!;
        conn.ConnectionString = connectionString;
        conn.Open();

        using var cmd = factory.CreateCommand()!;
        cmd.Connection = conn;
        cmd.CommandText = "SELECT Name FROM Users";

        using var reader = cmd.ExecuteReader();
        while (reader.Read())
            yield return reader.GetString(0);
    }
}

// Swap the ENTIRE database with one line:
// var da = new DataAccess(SqlClientFactory.Instance, connStr);
// var da = new DataAccess(NpgsqlFactory.Instance, connStr);
// Client code stays identical`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Adding a new product type to an existing factory',
    wrong: `// Adding IDialog to IUiFactory breaks ALL concrete factories
public interface IUiFactory {
    IButton CreateButton();
    ICheckbox CreateCheckbox();
    IDialog CreateDialog(); // breaks WindowsUiFactory, MacUiFactory
}`,
    right: `// This IS a valid downside of Abstract Factory.
// Mitigate: version the factory interface or use extension methods.
// If new product types are frequent, consider a different approach.`,
    explanation: 'Abstract Factory is rigid about product types. Adding a new product forces ALL concrete factories to implement it — this is a known trade-off, not a mistake to hide.',
  },
  {
    title: 'Mixing products from different families',
    wrong: `var button   = new WindowsUiFactory().CreateButton();
var checkbox = new MacUiFactory().CreateCheckbox(); // incompatible!`,
    right: `IUiFactory factory = new WindowsUiFactory();
var button   = factory.CreateButton();   // same family
var checkbox = factory.CreateCheckbox(); // guaranteed compatible`,
    explanation: 'Abstract Factory exists precisely to prevent this. The client must receive ONE factory and use only that factory for all products in a session.',
  },
  {
    title: 'Using Abstract Factory when Factory Method is enough',
    wrong: `// Only one product type varies → Abstract Factory is overkill`,
    right: `// One product type: use Factory Method
// Multiple related products that MUST match: use Abstract Factory`,
    explanation: 'Abstract Factory introduces more types and complexity. If only one product varies, Factory Method is simpler and sufficient.',
  },
  {
    title: 'Making concrete products depend on concrete factories',
    wrong: `public class WinButton : IButton {
    public WinButton(WindowsUiFactory factory) { } // wrong direction
}`,
    right: `public class WinButton : IButton {
    public WinButton() { } // products don't know their factory
}`,
    explanation: 'Products must not reference their factory — that reverses the dependency direction and creates a circular coupling.',
  },
];

const challenge: Challenge = {
  title: 'Database Provider Factory',
  language: 'typescript',
  description: `Implement an Abstract Factory for database providers.
Create an IDbFactory interface with createConnection() and createCommand() methods.
Implement SqliteFactory and InMemoryFactory as concrete factories.
The client DatabaseClient should only use IDbFactory.`,
  hints: [
    'IDbFactory is the AbstractFactory with two creation methods',
    'IDbConnection and IDbCommand are the AbstractProducts',
    'SqliteFactory and InMemoryFactory are ConcreteFactories',
  ],
  starterCode: `interface IDbConnection { open(): void; close(): void; }
interface IDbCommand { execute(sql: string): string; }

interface IDbFactory {
  createConnection(): IDbConnection;
  createCommand(): IDbCommand;
}

// TODO: implement SqliteFactory and InMemoryFactory
// TODO: implement DatabaseClient that only uses IDbFactory`,
  solution: `interface IDbConnection { open(): void; close(): void; }
interface IDbCommand { execute(sql: string): string; }

interface IDbFactory {
  createConnection(): IDbConnection;
  createCommand(): IDbCommand;
}

class SqliteConnection implements IDbConnection {
  open() { console.log('SQLite: opened'); }
  close() { console.log('SQLite: closed'); }
}
class SqliteCommand implements IDbCommand {
  execute(sql: string): string { return \`SQLite result for: \${sql}\`; }
}
class SqliteFactory implements IDbFactory {
  createConnection(): IDbConnection { return new SqliteConnection(); }
  createCommand(): IDbCommand { return new SqliteCommand(); }
}

class InMemoryConnection implements IDbConnection {
  open() { console.log('InMemory: opened'); }
  close() { console.log('InMemory: closed'); }
}
class InMemoryCommand implements IDbCommand {
  execute(sql: string): string { return \`InMemory result for: \${sql}\`; }
}
class InMemoryFactory implements IDbFactory {
  createConnection(): IDbConnection { return new InMemoryConnection(); }
  createCommand(): IDbCommand { return new InMemoryCommand(); }
}

class DatabaseClient {
  constructor(private factory: IDbFactory) {}
  query(sql: string): string {
    const conn = this.factory.createConnection();
    const cmd  = this.factory.createCommand();
    conn.open();
    const result = cmd.execute(sql);
    conn.close();
    return result;
  }
}

const client = new DatabaseClient(new SqliteFactory());
console.log(client.query('SELECT * FROM users'));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the core constraint that distinguishes Abstract Factory from other creational patterns?',
    options: [
      'It can only create one type of object',
      'All products created by a factory must belong to the same compatible family',
      'It requires the client to know all concrete product types',
      'It uses static methods to create objects',
    ],
    answer: 1,
    explanation: 'The defining constraint of Abstract Factory is that products form compatible families. A factory produces all products in its family; mixing products from different factories is precisely what the pattern prevents.',
  },
  {
    q: 'In .NET, DbProviderFactory with CreateConnection(), CreateCommand(), CreateDataAdapter() is an example of:',
    options: ['Singleton', 'Factory Method', 'Abstract Factory', 'Builder'],
    answer: 2,
    explanation: 'DbProviderFactory is a textbook Abstract Factory — one factory per database provider, with multiple creation methods for related product types that form a compatible family (connection + command + adapter).',
  },
  {
    q: 'What is the primary trade-off of Abstract Factory?',
    options: [
      'It makes it harder to swap product families',
      'Adding a new product type to the factory interface breaks all concrete factories',
      'It tightly couples clients to concrete products',
      'It cannot be used with dependency injection',
    ],
    answer: 1,
    explanation: 'Adding a new product type to the AbstractFactory interface forces every ConcreteFactory to implement it — this is the classic extensibility trade-off. New families (new concrete factories) are easy; new product types are hard.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Can an Abstract Factory be used with a DI container?',
    a: 'Yes — register the concrete factory as the implementation of IAbstractFactory in your DI container. The client receives it via constructor injection and never references the concrete factory directly. This is the most common .NET usage.',
  },
  {
    q: 'How many product types should an Abstract Factory have?',
    a: 'Only the product types that MUST vary together as a family. If a product is always the same regardless of family, it should not be created by the factory. Keep the factory lean; large factories with many product types become rigid.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Abstract Factory provides an interface for creating families of compatible products — clients swap entire families by swapping one factory, with no code changes.',
  mustKnow: [
    'Abstract Factory interface has one Create method per product type in the family',
    'ConcreteFactory produces all products for ONE specific family',
    'Client uses only abstract interfaces — zero concrete-type references',
    'Adding new families (ConcreteFactories) is easy; adding new product types to the interface is hard',
    '.NET DbProviderFactory is the canonical real-world example',
  ],
  interviewFocus: [
    'Abstract Factory vs Factory Method — structure and when to use each',
    'What problem does "product family compatibility" solve?',
    'What is the trade-off when adding a new product type to an Abstract Factory?',
  ],
};

@Component({
  selector: 'app-dp-abstract-factory',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './abstract-factory.html',
  styleUrl: './abstract-factory.scss',
})
export class DpAbstractFactory {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
