import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-sql-constraints',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './constraints.html',
  styleUrls: ['./constraints.scss']
})
export class SqlConstraints {

  quickRef: QuickRefItem[] = [
    { name: 'PRIMARY KEY',   type: 'keyword', desc: 'Unique, NOT NULL identifier for a row' },
    { name: 'FOREIGN KEY',   type: 'keyword', desc: 'Enforces referential integrity between tables' },
    { name: 'UNIQUE',        type: 'keyword', desc: 'Prevents duplicate values in a column or set of columns' },
    { name: 'NOT NULL',      type: 'keyword', desc: 'Column must always have a value' },
    { name: 'CHECK',         type: 'keyword', desc: 'Row-level predicate that must evaluate TRUE' },
    { name: 'DEFAULT',       type: 'keyword', desc: 'Fallback value when INSERT omits the column' },
    { name: 'ON DELETE CASCADE', type: 'syntax', desc: 'Delete child rows automatically when parent is deleted' },
    { name: 'DEFERRABLE',    type: 'keyword', desc: 'PostgreSQL: delay constraint check to end of transaction' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Types of constraints',
      points: [
        'Column constraints are declared inline with the column definition; table constraints follow the column list and can span multiple columns.',
        'PRIMARY KEY = UNIQUE + NOT NULL; every table should have one.',
        'FOREIGN KEY references a PRIMARY KEY (or UNIQUE key) in another table and rejects values that do not exist there.',
        'CHECK lets you express arbitrary predicates: age > 0, status IN (\'A\',\'I\'), end_date >= start_date.',
      ]
    },
    {
      heading: 'Naming constraints',
      points: [
        'Always name constraints explicitly with CONSTRAINT <name> so error messages and ALTER TABLE statements are readable.',
        'Convention: pk_<table>, fk_<table>_<ref>, uq_<table>_<col>, ck_<table>_<rule>.',
        'Unnamed constraints get database-generated names that are unreadable (e.g., CK__orders__12345).',
      ]
    },
    {
      heading: 'Referential actions',
      points: [
        'ON DELETE / ON UPDATE control what happens to child rows when the parent changes.',
        'CASCADE: delete/update cascades to children. SET NULL: child FK becomes NULL. SET DEFAULT: child FK reverts to its default. RESTRICT/NO ACTION: reject the operation (default).',
        'RESTRICT checks immediately; NO ACTION checks at the end of the statement — distinction matters in self-referencing tables.',
      ]
    },
    {
      heading: 'Disabling and deferring constraints',
      points: [
        'MSSQL: ALTER TABLE … NOCHECK CONSTRAINT <name> — temporarily disables for bulk loads; re-enable with CHECK CONSTRAINT.',
        'PostgreSQL: DEFERRABLE INITIALLY DEFERRED — constraint checked at COMMIT rather than per-statement; useful for circular FKs or reordering parent/child inserts.',
        'Disabling constraints is a last resort — always re-enable and validate after bulk operations.',
      ]
    },
    {
      heading: 'Adding and dropping constraints',
      points: [
        'ALTER TABLE orders ADD CONSTRAINT ck_orders_amount CHECK (amount > 0);',
        'ALTER TABLE orders DROP CONSTRAINT ck_orders_amount;',
        'Adding a constraint to an existing table triggers a full table scan to validate current data — can be slow on large tables.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CREATE TABLE with constraints',
      language: 'sql',
      code: `CREATE TABLE orders (
    order_id    INT           CONSTRAINT pk_orders PRIMARY KEY,
    customer_id INT           NOT NULL
                              CONSTRAINT fk_orders_customer
                                REFERENCES customers(customer_id)
                                ON DELETE RESTRICT
                                ON UPDATE CASCADE,
    status      VARCHAR(20)   NOT NULL DEFAULT 'Pending'
                              CONSTRAINT ck_orders_status
                                CHECK (status IN ('Pending','Processing','Shipped','Cancelled')),
    amount      DECIMAL(10,2) NOT NULL
                              CONSTRAINT ck_orders_amount CHECK (amount > 0),
    order_date  DATE          NOT NULL DEFAULT CURRENT_DATE
);

-- Multi-column UNIQUE constraint (table-level)
ALTER TABLE orders
    ADD CONSTRAINT uq_orders_customer_date UNIQUE (customer_id, order_date);`
    },
    {
      label: 'FOREIGN KEY actions',
      language: 'sql',
      code: `-- ON DELETE CASCADE: remove order_items when order is deleted
CREATE TABLE order_items (
    item_id   INT PRIMARY KEY,
    order_id  INT NOT NULL
              CONSTRAINT fk_items_order
                REFERENCES orders(order_id)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
    product_id INT NOT NULL,
    qty        INT NOT NULL CHECK (qty > 0)
);

-- ON DELETE SET NULL: keep log rows but clear the user reference
CREATE TABLE audit_log (
    log_id    INT PRIMARY KEY,
    user_id   INT CONSTRAINT fk_log_user
                    REFERENCES users(user_id)
                    ON DELETE SET NULL,
    action    VARCHAR(100) NOT NULL,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`
    },
    {
      label: 'Alter & manage constraints',
      language: 'sql',
      code: `-- Add a constraint to an existing table
ALTER TABLE products
    ADD CONSTRAINT ck_products_price CHECK (price >= 0);

-- Drop a named constraint
ALTER TABLE products
    DROP CONSTRAINT ck_products_price;

-- MSSQL: disable for bulk load, re-enable and validate
ALTER TABLE order_items NOCHECK CONSTRAINT fk_items_order;
-- ... bulk insert ...
ALTER TABLE order_items WITH CHECK CHECK CONSTRAINT fk_items_order;

-- PostgreSQL: defer FK check to commit (useful for circular inserts)
CREATE TABLE categories (
    id        INT PRIMARY KEY,
    parent_id INT CONSTRAINT fk_cat_parent
                    REFERENCES categories(id)
                    DEFERRABLE INITIALLY DEFERRED
);`
    },
    {
      label: 'CHECK across columns',
      language: 'sql',
      code: `-- Table-level CHECK can reference multiple columns
CREATE TABLE bookings (
    booking_id INT PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date   DATE NOT NULL,
    adults     INT  NOT NULL CHECK (adults >= 1),
    children   INT  NOT NULL DEFAULT 0 CHECK (children >= 0),
    -- Table-level multi-column check
    CONSTRAINT ck_bookings_dates  CHECK (end_date > start_date),
    CONSTRAINT ck_bookings_guests CHECK (adults + children <= 10)
);

-- Verify which constraints exist (PostgreSQL)
SELECT conname, contype, pg_get_constraintdef(oid)
FROM   pg_constraint
WHERE  conrelid = 'bookings'::regclass;

-- MSSQL equivalent
SELECT name, type_desc, definition
FROM   sys.check_constraints
WHERE  parent_object_id = OBJECT_ID('bookings');`
    },
  ];

  challenge: Challenge = {
    title: 'Design a products table with full constraints',
    language: 'sql',
    description: 'Create a products table with: a surrogate primary key, a NOT NULL name (max 200 chars), a price that must be >= 0, a category_id foreign key to a categories table with ON DELETE SET NULL, a status CHECK limited to Active/Discontinued, and a UNIQUE constraint on (name, category_id).',
    hints: [
      'Use CONSTRAINT <name> for every constraint to make errors readable.',
      'Foreign key ON DELETE SET NULL requires the category_id column to be nullable.',
      'The UNIQUE constraint on two columns must be a table-level constraint.',
    ],
    starterCode: `-- Assume categories(id INT PRIMARY KEY, name VARCHAR(100)) already exists
CREATE TABLE products (
    -- your columns and constraints here
);`,
    solution: `CREATE TABLE products (
    product_id  INT            CONSTRAINT pk_products PRIMARY KEY,
    name        VARCHAR(200)   NOT NULL,
    price       DECIMAL(10,2)  NOT NULL
                               CONSTRAINT ck_products_price CHECK (price >= 0),
    category_id INT            CONSTRAINT fk_products_category
                                   REFERENCES categories(id)
                                   ON DELETE SET NULL,
    status      VARCHAR(20)    NOT NULL DEFAULT 'Active'
                               CONSTRAINT ck_products_status
                                   CHECK (status IN ('Active', 'Discontinued')),
    CONSTRAINT uq_products_name_cat UNIQUE (name, category_id)
);`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which constraint is equivalent to UNIQUE + NOT NULL?',
      options: ['FOREIGN KEY', 'CHECK', 'PRIMARY KEY', 'DEFAULT'],
      answer: 2,
      explanation: 'A PRIMARY KEY implicitly combines UNIQUE and NOT NULL. A table can have many UNIQUE constraints but only one PRIMARY KEY.'
    },
    {
      q: 'What does ON DELETE SET NULL do?',
      options: [
        'Deletes child rows when parent is deleted',
        'Sets the foreign key column to NULL when the referenced parent is deleted',
        'Prevents deleting the parent if children exist',
        'Sets the child FK to its column DEFAULT'
      ],
      answer: 1,
      explanation: 'ON DELETE SET NULL nullifies the FK column in child rows when the referenced parent row is deleted. The FK column must allow NULLs for this to work.'
    },
    {
      q: 'What is the benefit of naming constraints explicitly?',
      options: [
        'Named constraints are enforced faster',
        'Unnamed constraints are dropped automatically after a transaction',
        'Error messages and ALTER TABLE statements reference the name, making management easier',
        'Named constraints bypass full-table validation on ALTER TABLE'
      ],
      answer: 2,
      explanation: 'Database-generated constraint names are cryptic (CK__table__12AB). Explicit names like ck_orders_amount make error messages readable and ALTER/DROP statements maintainable.'
    },
    {
      q: 'In PostgreSQL, when is a DEFERRABLE INITIALLY DEFERRED constraint checked?',
      options: ['At each INSERT/UPDATE statement', 'At COMMIT', 'Only on explicit VALIDATE CONSTRAINT', 'At session start'],
      answer: 1,
      explanation: 'DEFERRABLE INITIALLY DEFERRED postpones constraint validation until the transaction COMMITs, allowing circular or out-of-order inserts within a single transaction.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can a CHECK constraint reference another table?',
      a: 'No — CHECK constraints can only reference columns within the same row. To enforce cross-table rules, use a FOREIGN KEY, a trigger, or an application-level check. Some databases (PostgreSQL) technically allow sub-selects in CHECK but it is non-standard and the check is not enforced on UPDATE of the referenced table.',
    },
    {
      q: 'What is the difference between RESTRICT and NO ACTION for foreign keys?',
      a: 'Both reject a delete/update that would orphan child rows, but timing differs. RESTRICT checks immediately at the row level; NO ACTION (the SQL standard default) defers the check to the end of the statement, which matters for self-referencing tables where multiple rows are updated in a single statement.',
    },
    {
      q: 'Does adding a UNIQUE constraint automatically create an index?',
      a: 'Yes in both MSSQL and PostgreSQL. A UNIQUE constraint is backed by a unique index. This means the constraint also speeds up equality lookups on those columns.',
    },
  ];
}
