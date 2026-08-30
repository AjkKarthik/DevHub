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
  templateUrl: './what-a-ddd-repository-actually-looks-like.html',
  styleUrl: './what-a-ddd-repository-actually-looks-like.scss'
})
export class WhatADddRepositoryActuallyLooksLikeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA describes what makes a DDD repository different, but never shows the difference in code',
      points: [
        'The page\'s own QnA is precise in words: "Methods are domain-oriented: FindOrderByCustomerId, FindActiveOrders not FindAll or QueryByCondition... DDD repositories are higher-level: they work with fully formed aggregates, not individual database rows." But the "Domain Service" codeTab\'s <code>IAccountRepository</code> is only ever referenced by its interface name — its actual method signatures are never shown, so the domain-oriented-vs-generic distinction stays entirely abstract.',
        'The core contrast: a generic DAO exposes the SHAPE of the underlying storage (rows, columns, generic queries) to calling code. A DDD repository exposes the SHAPE of the DOMAIN — methods named after what a domain expert would actually ask for, returning fully-reconstituted aggregates (not raw rows), with all the aggregate\'s own invariants already intact.',
        'This matters because a generic, query-shaped repository interface leaks persistence concerns into the domain layer — code calling <code>orderRepo.query({ status: \'confirmed\', customerId })</code> has to know the underlying schema/query shape, while code calling <code>orderRepo.findConfirmedOrdersForCustomer(customerId)</code> only needs to know the DOMAIN concept, not how it\'s stored.',
      ]
    },
    {
      heading: 'Why a repository interface belongs in the domain layer, even though its implementation doesn\'t',
      points: [
        'The INTERFACE (<code>IAccountRepository</code>, as the page already names it) is defined in domain terms and lives conceptually alongside the aggregate it serves — the domain layer depends on this interface, but never on any specific database technology.',
        'The IMPLEMENTATION (the actual SQL, the actual ORM calls) lives in the infrastructure layer, implementing that domain-defined interface — this is the same Dependency Inversion the hub\'s own Hexagonal Architecture and Layered Architecture topics cover: the domain defines what it needs; infrastructure provides it, not the other way around.',
        'A repository\'s "collection-like" framing (the QnA\'s own phrase) means the domain layer can reason about persistence AS IF aggregates were simply sitting in an in-memory collection — <code>findById</code>, <code>save</code> — completely unaware of whether the real implementation is PostgreSQL, an event-sourced store, or an in-memory test double.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Generic DAO vs. domain-oriented repository, same underlying data',
      language: 'typescript',
      code: `// GENERIC DAO -- exposes the STORAGE shape to callers
interface AccountDao {
  findById(id: string): Promise<AccountRow | null>;
  query(criteria: { status?: string; minBalance?: number }): Promise<AccountRow[]>;
  update(id: string, fields: Partial<AccountRow>): Promise<void>;
}
// Calling code needs to know the row shape AND construct query criteria --
// persistence details leak into whatever calls this.

// DDD REPOSITORY -- exposes the DOMAIN shape, defined in the domain layer
interface IAccountRepository {
  findById(id: string): Promise<BankAccount | null>;
  findDormantAccounts(inactiveSinceDays: number): Promise<BankAccount[]>;
  save(account: BankAccount): Promise<void>;
}
// Calling code only needs to know domain concepts ("a dormant account")
// -- it never sees a row, a column name, or a query shape.

// INFRASTRUCTURE LAYER implements the domain-defined interface --
// dependency inversion: domain defines the contract, infrastructure
// satisfies it, never the other way around.
class PostgresAccountRepository implements IAccountRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<BankAccount | null> {
    const row = await this.db.query('SELECT * FROM accounts WHERE id = $1', [id]);
    if (!row) return null;
    // Reconstitute a FULLY VALID aggregate from raw row data --
    // callers of findById never see the row shape at all.
    return BankAccount.reconstitute(row.id, new Money(row.balance, row.currency));
  }

  async findDormantAccounts(inactiveSinceDays: number): Promise<BankAccount[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - inactiveSinceDays);
    const rows = await this.db.query(
      'SELECT * FROM accounts WHERE last_activity_at < $1', [cutoff.toISOString()]
    );
    return rows.map((r: any) => BankAccount.reconstitute(r.id, new Money(r.balance, r.currency)));
  }

  async save(account: BankAccount): Promise<void> {
    await this.db.query(
      'UPDATE accounts SET balance = $1 WHERE id = $2',
      [account.balance.amount, account.id]
    );
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate adds a new method to IAccountRepository: <code>findByCustomFilter(sqlWhereClause: string): Promise&lt;BankAccount[]&gt;</code>, letting callers pass in raw SQL fragments for maximum query flexibility. Does this fit the DDD repository pattern this subtopic describes?',
    hint: 'Does a method taking a raw SQL fragment expose a DOMAIN concept, or does it expose the underlying STORAGE technology to the caller?',
    solution: 'No -- this breaks the core distinction the pattern is built on. A raw SQL WHERE clause parameter exposes the storage technology (SQL, specifically) directly to domain-layer callers, exactly the leak DDD repositories exist to prevent. It also silently couples the domain layer to whichever database is in use -- switching to a different persistence technology (or even a different SQL dialect) would break every caller using this method. The DDD-idiomatic fix is naming specific, domain-meaningful query methods as they\'re actually needed (findDormantAccounts, findAccountsOverBalance) -- each one still hides its own implementation, whatever that happens to be, behind a domain-oriented name.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A DDD repository interface and a generic data access object (DAO) are basically the same concept with a different name.',
      reality: 'Per this subtopic\'s theory, they expose fundamentally different things — a generic DAO exposes the storage shape (rows, generic query criteria) to callers, while a DDD repository exposes domain-meaningful operations that hide storage details entirely.'
    },
    {
      thought: 'The repository INTERFACE and its database-specific IMPLEMENTATION both belong in the same layer, since they\'re tightly related.',
      reality: 'Per this subtopic\'s theory, they deliberately live in different layers — the interface belongs in the domain layer (defined in domain terms, no database knowledge), while the implementation belongs in infrastructure, satisfying that domain-defined contract via dependency inversion.'
    },
    {
      thought: 'Adding a flexible, generic query method (like accepting a raw filter string) to a repository interface is a reasonable convenience that doesn\'t compromise the pattern.',
      reality: 'Per this subtopic\'s theory, a generic, storage-shaped escape hatch defeats the entire purpose — it reintroduces exactly the persistence-technology leakage into the domain layer that naming specific, domain-meaningful methods is meant to prevent.'
    }
  ];
}
