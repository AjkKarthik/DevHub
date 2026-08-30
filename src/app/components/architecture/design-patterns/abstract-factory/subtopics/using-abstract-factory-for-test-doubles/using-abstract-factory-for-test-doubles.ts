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
  templateUrl: './using-abstract-factory-for-test-doubles.html',
  styleUrl: './using-abstract-factory-for-test-doubles.scss'
})
export class UsingAbstractFactoryForTestDoublesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A real-world example named in a list, never demonstrated',
      points: [
        'The page\'s own QnA on real-world examples lists five, and the last one is easy to skim past: "Test doubles in testing frameworks: a TestFactory creates mock or stub implementations of all external dependencies, swapped in for the real factory during tests." No codeTab on the page shows this.',
        'The page\'s own Challenge already builds the perfect subject for this: a <code>DatabaseClient</code> that depends only on <code>IDbFactory</code>, with two real concrete factories (<code>SqliteFactory</code>, <code>InMemoryFactory</code>). This subtopic adds a THIRD factory — a fake one, built specifically for tests — and uses it to test <code>DatabaseClient</code> without touching a real database at all.',
      ]
    },
    {
      heading: 'Why this only works because DatabaseClient depends on the interface, not a concrete factory',
      points: [
        'The entire reason a fake factory can stand in for a real one is the same reason Abstract Factory exists in the first place: <code>DatabaseClient</code>\'s constructor takes an <code>IDbFactory</code>, and NEVER references <code>SqliteFactory</code> or <code>InMemoryFactory</code> by name anywhere in its own code.',
        'A test-only <code>FakeDbFactory</code> implementing that same <code>IDbFactory</code> interface is, from <code>DatabaseClient</code>\'s perspective, indistinguishable from a real one — it just gets constructed and used through the exact same three-method contract every other factory already satisfies.',
        'This is the concrete payoff of the "Client uses only abstract interfaces" principle this page\'s own theory and revision both state — it is not just about swapping production families (Windows vs. Mac, SQLite vs. in-memory), it is what makes a class testable in complete isolation from anything real at all.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A fake factory built specifically for tests',
      language: 'typescript',
      code: `interface IDbConnection { open(): void; close(): void; }
interface IDbCommand { execute(sql: string): string; }
interface IDbFactory {
  createConnection(): IDbConnection;
  createCommand(): IDbCommand;
}

// A THIRD factory, alongside the page's own SqliteFactory and
// InMemoryFactory -- this one exists purely to make DatabaseClient
// testable without touching a real database, or even the simulated
// in-memory one.
class FakeConnection implements IDbConnection {
  openCalled = false;
  closeCalled = false;
  open() { this.openCalled = true; }
  close() { this.closeCalled = true; }
}

class FakeCommand implements IDbCommand {
  lastSql: string | null = null;
  constructor(private canned: string) {}
  execute(sql: string): string {
    this.lastSql = sql; // records what DatabaseClient actually asked for
    return this.canned; // returns a fixed, test-controlled result
  }
}

class FakeDbFactory implements IDbFactory {
  connection = new FakeConnection();
  command: FakeCommand;

  constructor(cannedResult: string) {
    this.command = new FakeCommand(cannedResult);
  }

  createConnection(): IDbConnection { return this.connection; }
  createCommand(): IDbCommand { return this.command; }
}

// DatabaseClient itself is COMPLETELY UNCHANGED from the main page --
// it only ever depends on IDbFactory
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

// A test using the fake factory -- no real or simulated database at all
const fakeFactory = new FakeDbFactory('fake row data');
const client = new DatabaseClient(fakeFactory);

const result = client.query('SELECT * FROM users');
console.log(result === 'fake row data');           // true -- canned result returned
console.log(fakeFactory.command.lastSql);           // 'SELECT * FROM users' -- proves the real SQL reached the command
console.log(fakeFactory.connection.openCalled);     // true -- proves connection lifecycle was respected
console.log(fakeFactory.connection.closeCalled);    // true`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate suggests testing DatabaseClient by constructing it with the page\'s own real InMemoryFactory instead of writing a separate FakeDbFactory, since InMemoryFactory already avoids touching an actual database. Is this equivalent to using a purpose-built fake?',
    hint: 'Can InMemoryFactory\'s own IDbCommand tell you exactly what SQL string DatabaseClient actually passed to execute(), the way FakeCommand\'s lastSql field can?',
    solution: 'They are similar in spirit (both avoid a real database) but not equivalent for testing specifically. InMemoryFactory is a legitimate PRODUCTION alternative -- a real, working implementation meant to actually behave like a database, just an in-memory one. A purpose-built FakeDbFactory is different: it exists ONLY to make assertions about HOW DatabaseClient used the factory -- recording the exact SQL string passed to execute() (lastSql), confirming open() and close() were actually called in the right order (openCalled/closeCalled), returning a fixed, test-chosen result regardless of the input. InMemoryFactory would give you a WORKING system to test against, but not necessarily a way to verify DatabaseClient\'s own INTERNAL BEHAVIOR (call order, exact arguments) without also building real query-parsing logic into your test double. Both are valid uses of Abstract Factory\'s swappability -- they just serve different testing goals.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The page\'s own InMemoryFactory already serves as a test double, so building a separate FakeDbFactory would be redundant.',
      reality: 'Per this subtopic\'s theory, InMemoryFactory is a legitimate lightweight PRODUCTION alternative, while a purpose-built fake exists specifically to record and assert on how a client used the factory — a different, complementary purpose from simply avoiding a real database.'
    },
    {
      thought: 'Swapping in a fake factory for testing requires DatabaseClient itself to have some kind of test-mode flag or special constructor.',
      reality: 'Per this subtopic\'s theory, DatabaseClient needs zero special testing support — it already only depends on the IDbFactory interface, which is the entire reason a fake implementing that same interface can be substituted with no changes to DatabaseClient at all.'
    },
    {
      thought: 'Using Abstract Factory for test doubles is a fundamentally different application of the pattern from swapping production families like Windows vs. Mac.',
      reality: 'Per this subtopic\'s theory, it is the exact same mechanism — a client depending only on the abstract interface, with zero references to any concrete factory — just applied to a fake, test-only implementation instead of another real, production one.'
    }
  ];
}
