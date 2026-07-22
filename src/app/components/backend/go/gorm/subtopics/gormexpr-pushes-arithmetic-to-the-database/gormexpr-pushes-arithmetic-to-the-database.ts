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
  templateUrl: './gormexpr-pushes-arithmetic-to-the-database.html',
  styleUrl: './gormexpr-pushes-arithmetic-to-the-database.scss'
})
export class GormexprPushesArithmeticToTheDatabaseSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own transfer function uses gorm.Expr twice — without ever explaining why',
      points: [
        'The main page\'s own Transactions code tab writes tx.Model(&from).Update("balance", gorm.Expr("balance - ?", amount)) and the equivalent addition for the recipient, but its theory section never mentions gorm.Expr at all. This subtopic covers exactly what that call buys the main page\'s own transfer function, and why the alternative most developers reach for instead is subtly broken.',
        'GORM\'s own documentation describes the mechanism directly: "GORM allows updating a column with a SQL expression" — gorm.Expr("balance - ?", amount) does not compute anything in Go at all. It is passed through as a literal SQL fragment, producing an UPDATE statement shaped like UPDATE accounts SET balance = balance - $1 WHERE id = $2 — the SUBTRACTION happens inside PostgreSQL itself, as part of executing that one UPDATE statement.',
        'The natural-looking alternative — read the current balance into a Go variable, subtract in Go, then write the new value back with a plain field update — looks equivalent for a single, isolated call, but is not equivalent under concurrency, which is exactly the situation the main page\'s own transfer function exists to handle correctly.',
      ]
    },
    {
      heading: 'Why the naive Go-side version has a real lost-update race, and gorm.Expr does not',
      points: [
        'Consider two concurrent transfers both deducting from the SAME account, each using the naive pattern: read balance (say, 100), compute balance - amount in Go, then UPDATE ... SET balance = <computed value>. If both transactions read the SAME starting balance of 100 before either has written its result back, both compute their own "100 minus my amount" independently — and whichever UPDATE runs LAST simply overwrites the other\'s result, silently losing one of the two deductions entirely. Neither UPDATE statement itself is wrong in isolation; the bug is that both read a now-stale value.',
        'gorm.Expr\'s SQL-expression form sidesteps this specific failure mode structurally: because balance - ? is evaluated BY THE DATABASE as part of executing the UPDATE statement itself, using whatever the column\'s CURRENT value is AT THAT EXACT MOMENT (not a value read into the application earlier), there is no window where a stale, previously-read Go-side value can be written back. Each UPDATE ... SET balance = balance - $1 genuinely reads-and-writes the column value atomically, as one indivisible database operation.',
        'This is a distinct, complementary protection from the FOR UPDATE row locking this hub\'s own prior pgx subtopic covers — FOR UPDATE prevents a SECOND transaction from even reading the row until the first transaction finishes, while gorm.Expr prevents the lost-update race specifically for a single UPDATE statement\'s own read-then-write, even WITHOUT an explicit row lock, by never round-tripping the current value through the application at all.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The naive, race-prone alternative',
      language: 'typescript',
      code: `package main

import "gorm.io/gorm"

type Account struct {
    gorm.Model
    Balance float64
}

// deductNaive reads the balance into Go, subtracts in Go, then
// writes the computed value back -- this LOOKS correct for a single
// isolated call, but has a genuine lost-update race under
// concurrency.
func deductNaive(db *gorm.DB, accountID uint, amount float64) error {
    var acc Account
    if err := db.First(&acc, accountID).Error; err != nil {
        return err
    }
    newBalance := acc.Balance - amount // computed in GO, from a
                                          // value that may already
                                          // be stale by the time
                                          // this UPDATE executes.
    return db.Model(&acc).Update("balance", newBalance).Error
}

// Two concurrent calls to deductNaive(db, 1, 30) and
// deductNaive(db, 1, 20) on the SAME account, both reading the
// starting balance of 100 before either writes back, can each
// independently compute 70 and 80 -- whichever UPDATE runs last
// simply overwrites the other, silently losing one deduction.`,
    },
    {
      label: 'The main page\'s own pattern: gorm.Expr, computed atomically by the database',
      language: 'typescript',
      code: `package main

import "gorm.io/gorm"

type Account struct {
    gorm.Model
    Balance float64
}

// deductSafe mirrors the main page's own transfer function -- the
// subtraction happens INSIDE the UPDATE statement itself, evaluated
// against whatever the database's CURRENT balance value is at
// execution time, never a value that passed through Go first.
func deductSafe(db *gorm.DB, accountID uint, amount float64) error {
    return db.Model(&Account{}).Where("id = ?", accountID).
        Update("balance", gorm.Expr("balance - ?", amount)).Error
}

// The generated SQL is shaped like:
//   UPDATE accounts SET balance = balance - $1 WHERE id = $2
// Two concurrent deductSafe(db, 1, 30) and deductSafe(db, 1, 20)
// calls on the same account are each a single, atomic
// read-and-write at the database level -- whichever runs first
// leaves the ACTUAL new balance (say, 70) for the second to read
// and subtract from correctly (70 - 20 = 50), with no lost update,
// even with no explicit row lock involved.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer implements a "like" counter for posts using the naive pattern: db.First(&post, id) to load the current LikeCount, increment it by 1 in Go, then db.Model(&post).Update("like_count", newCount). Under normal traffic this works fine, but during a viral moment with many concurrent likes on the same post, the final LikeCount is noticeably LOWER than the actual number of like requests that were processed. Using this subtopic\'s theory, explain the cause, and describe the fix using gorm.Expr.',
    hint: 'Per this subtopic\'s theory, what specific problem occurs when many concurrent operations each read the SAME starting value before any of them writes back? Does db.First followed by a separate Update, computed in Go, protect against two nearly-simultaneous calls reading the identical starting LikeCount?',
    solution: 'The undercounting is caused by exactly the lost-update race this subtopic\'s theory and first code example describe: under high concurrency, many "like" requests arriving in a short window each call db.First(&post, id) and read the SAME current LikeCount (say, 100) before ANY of them has written an updated value back. Each request then independently computes "100 + 1 = 101" in Go and writes 101 back — so if ten concurrent requests all happen to read the same starting value of 100, all ten compute and write 101 (or very close to it, depending on exact timing), and the counter effectively only advances by one instead of ten, even though ten separate like actions genuinely occurred. This is the identical failure mode this subtopic\'s theory describes for the naive balance-deduction pattern, just manifesting as undercounting instead of an incorrect balance. The fix, following this subtopic\'s second code example directly, is to replace the read-in-Go-then-write pattern with db.Model(&Post{}).Where("id = ?", id).Update("like_count", gorm.Expr("like_count + 1")).Error — pushing the increment itself into the UPDATE statement so the database computes "current value + 1" atomically at execution time for each individual request, with no window where two concurrent requests can both read and increment from the same stale starting value. Every one of the ten concurrent requests now correctly adds exactly 1 to whatever the true current count is at the moment each of its own UPDATE statements actually executes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'db.First(&record, id) followed by a separate db.Model(&record).Update(...) call with a Go-computed value is functionally equivalent to using gorm.Expr — both approaches update the column\'s value correctly, so the choice between them is mostly a matter of code style or readability preference.',
      reality: 'This subtopic\'s theory and both code examples show these are NOT functionally equivalent under concurrency: the Go-computed version has a genuine lost-update race, since the value read into Go can become stale between the read and the write if another concurrent operation writes to the same row in between. gorm.Expr avoids this entirely by having the database compute the new value from its own current state as part of one atomic UPDATE statement, never round-tripping the value through application memory at all.'
    },
    {
      thought: 'The lost-update race this subtopic describes only matters for financial applications like the main page\'s own account-transfer example — for lower-stakes use cases like a view counter or a like counter, an occasional undercounted value from concurrent Go-side reads is a negligible, acceptable inaccuracy.',
      reality: 'This subtopic\'s exercise shows the exact same race condition applies to ANY concurrently-updated counter, not just financial balances — and the resulting inaccuracy can be far from negligible under real concurrent load (a viral post\'s like count could undercount substantially during a traffic spike), precisely because the race gets WORSE, not better, the more concurrent requests are competing to read-and-write the same row in a short window.'
    },
    {
      thought: 'gorm.Expr and explicit row-level locking (like FOR UPDATE, covered in this hub\'s own pgx subtopic) solve the same underlying concurrency problem, so using one makes the other unnecessary for the same piece of code.',
      reality: 'This subtopic\'s theory distinguishes these as complementary, not interchangeable protections: gorm.Expr specifically prevents a lost update WITHIN one UPDATE statement\'s own read-then-write, even without any lock, by never exposing the intermediate value to application code at all — but it does not, on its own, prevent OTHER kinds of races that genuinely need an explicit lock, such as a multi-statement transaction that needs to read a value, make a decision based on it (like the main page\'s own "insufficient funds" check), AND then update it, all as one consistent unit — that broader case still needs FOR UPDATE or an equivalent lock, exactly as this hub\'s own pgx subtopic covers.'
    }
  ];
}
