import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-go-gorm',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './gorm.html',
  styleUrl: './gorm.scss'
})
export class GoGorm {
  readingTime = 24;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'GORM v2+';
  route = 'go-gorm';
  nextRoute = '/go/generics';
  nextLabel = 'Generics';

  quickRef: QuickRefItem[] = [
    { name: 'gorm.Open(dialector, &config)', type: 'function', desc: 'Open database connection; returns *gorm.DB' },
    { name: 'db.AutoMigrate(&Model{})', type: 'method', desc: 'Create or update table schema from struct — dev/test only' },
    { name: 'db.Create(&record)', type: 'method', desc: 'INSERT; populates ID and other auto-filled fields after call' },
    { name: 'db.First(&record, id)', type: 'method', desc: 'SELECT first row by primary key; sets ErrRecordNotFound if missing' },
    { name: 'db.Where("condition", args).Find(&slice)', type: 'method', desc: 'Build WHERE clause and fetch all matching rows into slice' },
    { name: 'db.Save(&record)', type: 'method', desc: 'UPDATE all fields including zero values (full update)' },
    { name: 'db.Updates(map/struct)', type: 'method', desc: 'UPDATE only non-zero fields (struct) or explicit fields (map)' },
    { name: 'db.Delete(&record, id)', type: 'method', desc: 'DELETE by primary key; soft-delete if model has DeletedAt' },
    { name: 'errors.Is(result.Error, gorm.ErrRecordNotFound)', type: 'function', desc: 'Check not-found after First/Take' },
    { name: 'db.Transaction(func(tx *gorm.DB) error)', type: 'method', desc: 'Run function in a transaction; auto-commit or rollback' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'GORM overview',
      points: [
        'GORM is the most popular Go ORM: it maps structs to tables, handles CRUD, associations, hooks, and migrations.',
        'gorm.Model is a convenience embed: adds ID (uint, primary key), CreatedAt, UpdatedAt, and DeletedAt (soft-delete).',
        'GORM uses method chaining: db.Where(...).Order(...).Limit(...).Find(&result). Each method returns *gorm.DB.',
        'The final method (Find, First, Save, Create, Delete) executes the SQL. Intermediate methods build the query.',
        'GORM supports PostgreSQL, MySQL, SQLite, and SQL Server via dialector packages. Switch databases by changing the dialector.',
      ]
    },
    {
      heading: 'Model definition and conventions',
      points: [
        'Table name is the snake_case plural of the struct name: User → users, OrderItem → order_items.',
        'Column name is the snake_case of the field name: FirstName → first_name.',
        'Override with struct tags: `gorm:"column:custom_name"`, `gorm:"primaryKey"`, `gorm:"uniqueIndex"`.',
        'Associations: HasOne, HasMany, BelongsTo, Many2Many — GORM infers foreign keys from naming conventions.',
        'Use db.AutoMigrate(&User{}) in development to create/update tables. Never use it in production with schema-critical changes.',
      ]
    },
    {
      heading: 'CRUD operations',
      points: [
        'Create: db.Create(&user) — executes INSERT, populates user.ID, user.CreatedAt after the call.',
        'Read: db.First(&user, id) finds by primary key; returns gorm.ErrRecordNotFound if missing.',
        'db.Find(&users) fetches all; db.Where("age > ?", 18).Find(&users) adds a WHERE clause.',
        'Update: db.Save(&user) updates all fields. db.Updates(map[string]any{...}) updates only specified fields.',
        'Delete: db.Delete(&user) sets DeletedAt for soft-delete models; db.Unscoped().Delete(&user) hard-deletes.',
      ]
    },
    {
      heading: 'Transactions and raw SQL',
      points: [
        'db.Transaction(func(tx *gorm.DB) error) runs a closure in a transaction — auto-commits if nil, rolls back if error.',
        'For manual control: tx := db.Begin(); defer tx.Rollback(); ... tx.Commit().',
        'Raw SQL: db.Raw("SELECT ...", args).Scan(&result) or db.Exec("UPDATE ...", args).',
        'Avoid N+1: use Preload("Associations") to eager-load relations — db.Preload("Orders").Find(&users).',
        'Use db.Debug() in development to log all generated SQL; remove from production.',
      ]
    },
    {
      heading: 'Hooks and scopes',
      points: [
        'Hooks run before or after operations: BeforeCreate, AfterCreate, BeforeSave, AfterFind, BeforeDelete, etc.',
        'Define on the model: func (u *User) BeforeCreate(tx *gorm.DB) error { u.ID = newUUID(); return nil }.',
        'Scopes reuse query conditions: func Active(db *gorm.DB) *gorm.DB { return db.Where("active = ?", true) }. Use: db.Scopes(Active).Find(&users).',
        'Custom data types implement Scanner/Valuer interfaces — GORM passes through to database/sql.',
        'db.Session(&gorm.Session{FullSaveAssociations: true}) controls association save behaviour per-query.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup & Models',
      language: 'typescript',
      code: `package main

import (
    "log"
    "time"

    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

// Embed gorm.Model for ID, CreatedAt, UpdatedAt, DeletedAt (soft-delete)
type User struct {
    gorm.Model
    Name  string \`gorm:"not null"\`
    Email string \`gorm:"uniqueIndex;not null"\`
    Age   int
}

type Post struct {
    gorm.Model
    Title   string \`gorm:"not null"\`
    Content string
    UserID  uint   \`gorm:"not null;index"\` // foreign key by convention
    User    User   \`gorm:"constraint:OnDelete:CASCADE"\`
}

func main() {
    dsn := "host=localhost user=postgres password=secret dbname=mydb sslmode=disable"
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info), // log SQL in dev
    })
    if err != nil {
        log.Fatal("connect:", err)
    }

    // AutoMigrate — dev/test only; use proper migrations in production
    db.AutoMigrate(&User{}, &Post{})

    // Configure underlying connection pool
    sqlDB, _ := db.DB()
    sqlDB.SetMaxOpenConns(20)
    sqlDB.SetMaxIdleConns(5)
    sqlDB.SetConnMaxLifetime(30 * time.Minute)
}`
    },
    {
      label: 'CRUD',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "fmt"
    "log"

    "gorm.io/gorm"
)

type User struct {
    gorm.Model
    Name  string
    Email string \`gorm:"uniqueIndex"\`
    Age   int
}

func crudDemo(db *gorm.DB) {
    // CREATE
    user := User{Name: "Alice", Email: "alice@example.com", Age: 30}
    result := db.Create(&user)
    if result.Error != nil {
        log.Fatal("create:", result.Error)
    }
    fmt.Println("created ID:", user.ID) // populated by GORM after INSERT

    // READ — by primary key
    var found User
    result = db.First(&found, user.ID)
    if errors.Is(result.Error, gorm.ErrRecordNotFound) {
        fmt.Println("not found")
        return
    }
    fmt.Println("found:", found.Name)

    // READ — with WHERE
    var adults []User
    db.Where("age >= ?", 18).Order("name").Find(&adults)
    fmt.Println("adults:", len(adults))

    // UPDATE — only specified fields (struct ignores zero values)
    db.Model(&found).Updates(User{Name: "Alice Updated", Age: 31})

    // UPDATE — map for explicit zero value updates
    db.Model(&found).Updates(map[string]any{"age": 0, "name": "Alice Reset"})

    // SOFT DELETE — sets DeletedAt, keeps row in DB
    db.Delete(&found)

    // Hard delete
    db.Unscoped().Delete(&found)
}`
    },
    {
      label: 'Associations',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "gorm.io/gorm"
)

type User struct {
    gorm.Model
    Name  string
    Posts []Post // HasMany: foreign key PostID in posts table
}

type Post struct {
    gorm.Model
    Title  string
    UserID uint
    Tags   []Tag \`gorm:"many2many:post_tags"\`
}

type Tag struct {
    gorm.Model
    Name string
}

func assocDemo(db *gorm.DB) {
    // Create with associations
    user := User{
        Name: "Bob",
        Posts: []Post{
            {Title: "First Post", Tags: []Tag{{Name: "go"}, {Name: "orm"}}},
            {Title: "Second Post"},
        },
    }
    db.Create(&user)

    // Eager load associations with Preload
    var u User
    db.Preload("Posts.Tags").First(&u, user.ID)
    for _, p := range u.Posts {
        fmt.Printf("  post: %s, tags: %d\\n", p.Title, len(p.Tags))
    }

    // Append to association
    newPost := Post{Title: "Third Post"}
    db.Model(&u).Association("Posts").Append(&newPost)

    // Count association
    count := db.Model(&u).Association("Posts").Count()
    fmt.Println("post count:", count)
}`
    },
    {
      label: 'Transactions',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "fmt"
    "gorm.io/gorm"
)

type Account struct {
    gorm.Model
    Owner   string
    Balance float64
}

// db.Transaction auto-commits on nil return, rolls back on error
func transfer(db *gorm.DB, fromID, toID uint, amount float64) error {
    return db.Transaction(func(tx *gorm.DB) error {
        var from Account
        if err := tx.First(&from, fromID).Error; err != nil {
            return err
        }
        if from.Balance < amount {
            return errors.New("insufficient funds")
        }

        if err := tx.Model(&from).Update("balance", gorm.Expr("balance - ?", amount)).Error; err != nil {
            return err
        }

        if err := tx.Model(&Account{}).Where("id = ?", toID).
            Update("balance", gorm.Expr("balance + ?", amount)).Error; err != nil {
            return err
        }

        return nil // commit
    })
}

// Manual transaction for more control
func manualTx(db *gorm.DB) error {
    tx := db.Begin()
    defer func() {
        if r := recover(); r != nil {
            tx.Rollback()
        }
    }()
    defer tx.Rollback() // no-op if Commit called

    if err := tx.Create(&Account{Owner: "Alice", Balance: 100}).Error; err != nil {
        return fmt.Errorf("create: %w", err)
    }
    return tx.Commit().Error
}`
    },
    {
      label: 'Raw SQL & Scopes',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "gorm.io/gorm"
)

type UserStats struct {
    Email string
    Posts int
}

type User struct {
    gorm.Model
    Name   string
    Email  string
    Active bool
    Age    int
}

// Scope: reusable WHERE clause fragment
func ActiveUsers(db *gorm.DB) *gorm.DB {
    return db.Where("active = ?", true)
}

func AgeAbove(min int) func(*gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        return db.Where("age > ?", min)
    }
}

func demo(db *gorm.DB) {
    // Scopes compose
    var users []User
    db.Scopes(ActiveUsers, AgeAbove(18)).Find(&users)
    fmt.Println("active adults:", len(users))

    // Raw SQL with struct scan
    var stats []UserStats
    sql := "SELECT u.email, COUNT(p.id) as posts " +
        "FROM users u LEFT JOIN posts p ON p.user_id = u.id " +
        "WHERE u.deleted_at IS NULL " +
        "GROUP BY u.email ORDER BY posts DESC LIMIT ?"
    db.Raw(sql, 10).Scan(&stats)

    for _, s := range stats {
        fmt.Printf("  %s: %d posts\\n", s.Email, s.Posts)
    }

    // Exec for non-SELECT
    db.Exec("UPDATE users SET active = ? WHERE last_seen < NOW() - INTERVAL '90 days'", false)
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using db.Save instead of db.Updates for partial updates',
      wrong: `user.Name = "Alice Updated"
db.Save(&user)
// Save updates ALL fields — sets Age to 0 if it was 0 in the struct`,
      right: `db.Model(&user).Updates(map[string]any{"name": "Alice Updated"})
// or
db.Model(&user).Update("name", "Alice Updated")`,
      explanation: 'db.Save performs a full UPDATE of all fields, including zero values. If you load a partial struct (only Name), Save overwrites other columns with zero values — a silent data loss bug. Use db.Updates(map) to update only the specified fields, or db.Model(&u).Update("col", val) for a single column.'
    },
    {
      title: 'Not checking result.Error on every operation',
      wrong: `db.Create(&user)
fmt.Println(user.ID) // may be 0 if Create silently failed`,
      right: `result := db.Create(&user)
if result.Error != nil {
    return fmt.Errorf("create user: %w", result.Error)
}
fmt.Println(user.ID) // guaranteed to be populated`,
      explanation: 'GORM never panics on database errors — it stores the error in result.Error. If you do not check it, the operation may have silently failed and subsequent code operates on stale or zero-value data. Always check result.Error after every GORM call that touches the database.'
    },
    {
      title: 'Using AutoMigrate in production',
      wrong: `// In production startup:
db.AutoMigrate(&User{}, &Product{}, &Order{})
// Drops columns, changes constraints — irreversible data loss risk`,
      right: `// Use a migration tool: golang-migrate, goose, or Atlas
// Run migration files manually or in a controlled CI/CD step
// Only use AutoMigrate in development and test environments`,
      explanation: 'AutoMigrate adds columns and creates tables but does not drop removed columns or safely handle all constraint changes. Running it in production against a live database can cause data loss, lock production tables, or apply changes you did not intend. Use proper migration tooling with version-controlled SQL files.'
    },
    {
      title: 'N+1 query problem with associations',
      wrong: `var users []User
db.Find(&users) // 1 query
for _, u := range users {
    db.Find(&u.Posts, "user_id = ?", u.ID) // N queries — one per user!
}`,
      right: `var users []User
db.Preload("Posts").Find(&users) // 2 queries total: users + all posts in one IN clause`,
      explanation: 'Manually querying associations in a loop issues one SQL query per row — the N+1 problem. For 1000 users this is 1001 queries. db.Preload("Posts") fetches all associated posts in a single IN query. Always profile with db.Debug() to spot N+1 patterns.'
    },
    {
      title: 'Reusing *gorm.DB without Session isolation',
      wrong: `// base has a global Where condition
base := db.Where("active = true")
var admins []User
base.Where("role = ?", "admin").Find(&admins) // expected: active + admin

var managers []User
base.Where("role = ?", "manager").Find(&managers)
// BUG: base now has cumulative conditions from previous calls!`,
      right: `// Use Session to get a fresh query from a configured base
session := db.Session(&gorm.Session{NewDB: true})
var admins []User
session.Where("active = true").Where("role = ?", "admin").Find(&admins)`,
      explanation: 'GORM chains conditions by mutating the *gorm.DB instance. Reusing a db variable across queries accumulates conditions. Use db.Session(&gorm.Session{NewDB: true}) to get a truly fresh query, or start each query from the original db variable without sharing chained intermediate values.'
    },
    {
      title: 'Soft delete confusion: deleted records still appear',
      wrong: `// User embeds gorm.Model (has DeletedAt)
db.Delete(&user) // sets DeletedAt — soft delete

var users []User
db.Find(&users) // includes soft-deleted? No — GORM filters them
// But raw SQL or direct DB clients will see the row!`,
      right: `// GORM auto-filters soft-deleted rows with WHERE deleted_at IS NULL
db.Find(&users)     // excludes soft-deleted
db.Unscoped().Find(&users) // includes soft-deleted (for admin/audit)
db.Unscoped().Delete(&user) // HARD delete — permanent`,
      explanation: 'When a model has DeletedAt (from gorm.Model), db.Delete sets the timestamp instead of removing the row. GORM automatically adds WHERE deleted_at IS NULL to all queries. External tools (psql, Metabase, raw SQL) do NOT apply this filter and will see deleted rows. Use db.Unscoped() when you need to include or permanently delete soft-deleted records.'
    },
  ];

  challenge: Challenge = {
    title: 'Blog Post Repository',
    language: 'typescript',
    description: `Implement a \`PostRepository\` for a blog using GORM.

**Models (given):**
\`\`\`go
type Author struct {
    gorm.Model
    Name  string
    Email string \`gorm:"uniqueIndex"\`
}
type Post struct {
    gorm.Model
    Title    string \`gorm:"not null"\`
    Content  string
    AuthorID uint
    Author   Author
    Tags     []Tag \`gorm:"many2many:post_tags"\`
}
type Tag struct {
    gorm.Model
    Name string \`gorm:"uniqueIndex"\`
}
\`\`\`

**Implement:**
\`\`\`go
// Create post with tags (find-or-create each tag by name)
func CreatePost(db *gorm.DB, title, content string, authorID uint, tagNames []string) (*Post, error)

// GetPost with Author and Tags preloaded
func GetPost(db *gorm.DB, id uint) (*Post, error) // nil,nil if not found

// ListByAuthor returns all posts for an author, most recent first
func ListByAuthor(db *gorm.DB, authorID uint) ([]Post, error)
\`\`\``,
    hints: [
      'Find-or-create tag: db.FirstOrCreate(&tag, Tag{Name: name})',
      'Preload: db.Preload("Author").Preload("Tags").First(&post, id)',
      'Check gorm.ErrRecordNotFound with errors.Is for GetPost',
      'Order: db.Where("author_id = ?", id).Order("created_at DESC").Find(&posts)',
    ],
    starterCode: `package main

import (
    "errors"
    "fmt"

    "gorm.io/gorm"
)

type Author struct {
    gorm.Model
    Name  string
    Email string \`gorm:"uniqueIndex"\`
}

type Post struct {
    gorm.Model
    Title    string \`gorm:"not null"\`
    Content  string
    AuthorID uint
    Author   Author
    Tags     []Tag \`gorm:"many2many:post_tags"\`
}

type Tag struct {
    gorm.Model
    Name string \`gorm:"uniqueIndex"\`
}

func CreatePost(db *gorm.DB, title, content string, authorID uint, tagNames []string) (*Post, error) {
    // TODO: build tags slice with FirstOrCreate, then create post
    return nil, fmt.Errorf("not implemented")
}

func GetPost(db *gorm.DB, id uint) (*Post, error) {
    // TODO: preload Author and Tags, return nil,nil if not found
    return nil, fmt.Errorf("not implemented")
}

func ListByAuthor(db *gorm.DB, authorID uint) ([]Post, error) {
    // TODO: return posts for authorID, ordered newest first
    return nil, fmt.Errorf("not implemented")
}

var _ = errors.Is // suppress unused import`,
    solution: `package main

import (
    "errors"
    "fmt"

    "gorm.io/gorm"
)

type Author struct {
    gorm.Model
    Name  string
    Email string \`gorm:"uniqueIndex"\`
}

type Post struct {
    gorm.Model
    Title    string \`gorm:"not null"\`
    Content  string
    AuthorID uint
    Author   Author
    Tags     []Tag \`gorm:"many2many:post_tags"\`
}

type Tag struct {
    gorm.Model
    Name string \`gorm:"uniqueIndex"\`
}

func CreatePost(db *gorm.DB, title, content string, authorID uint, tagNames []string) (*Post, error) {
    tags := make([]Tag, 0, len(tagNames))
    for _, name := range tagNames {
        var tag Tag
        if err := db.FirstOrCreate(&tag, Tag{Name: name}).Error; err != nil {
            return nil, fmt.Errorf("find/create tag %q: %w", name, err)
        }
        tags = append(tags, tag)
    }

    post := Post{Title: title, Content: content, AuthorID: authorID, Tags: tags}
    if err := db.Create(&post).Error; err != nil {
        return nil, fmt.Errorf("create post: %w", err)
    }
    return &post, nil
}

func GetPost(db *gorm.DB, id uint) (*Post, error) {
    var post Post
    err := db.Preload("Author").Preload("Tags").First(&post, id).Error
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, nil
    }
    if err != nil {
        return nil, fmt.Errorf("get post %d: %w", id, err)
    }
    return &post, nil
}

func ListByAuthor(db *gorm.DB, authorID uint) ([]Post, error) {
    var posts []Post
    err := db.Preload("Tags").
        Where("author_id = ?", authorID).
        Order("created_at DESC").
        Find(&posts).Error
    if err != nil {
        return nil, fmt.Errorf("list posts for author %d: %w", authorID, err)
    }
    return posts, nil
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between db.Save and db.Updates in GORM?',
      options: [
        'Save updates ALL fields including zero values; Updates only updates non-zero fields (struct) or explicitly specified fields (map)',
        'Save is faster; Updates uses reflection',
        'Updates requires a transaction; Save does not',
        'They are identical — Save is an alias for Updates',
      ],
      answer: 0,
      explanation: 'db.Save executes a full UPDATE that sets every column, including those with zero values (0, "", false). This can overwrite data accidentally if your struct is partially populated. db.Updates with a struct skips zero-value fields; db.Updates with a map updates only the specified keys, making it the safe choice for partial updates.'
    },
    {
      q: 'How does GORM handle soft deletes?',
      options: [
        'Models with a DeletedAt field get a timestamp on Delete; GORM automatically adds WHERE deleted_at IS NULL to all queries',
        'GORM renames the record with a "deleted_" prefix',
        'Soft delete moves the record to a separate _deleted table',
        'GORM sets a boolean "deleted" column to true',
      ],
      answer: 0,
      explanation: 'When a model embeds gorm.Model (which includes DeletedAt *time.Time), db.Delete sets the DeletedAt timestamp instead of issuing a real DELETE. GORM then appends WHERE deleted_at IS NULL to all SELECT queries, hiding soft-deleted rows. Use db.Unscoped() to bypass this filter or hard-delete.'
    },
    {
      q: 'What is the N+1 query problem and how does GORM\'s Preload solve it?',
      options: [
        'Without Preload, each row triggers a separate query for associations — Preload loads all associations in one IN query',
        'N+1 refers to GORM running one extra migration query per model',
        'Preload enables lazy loading; without it GORM uses eager loading',
        'Preload reduces N+1 by caching association results between requests',
      ],
      answer: 0,
      explanation: 'The N+1 problem: fetching N rows and then querying associated data per row = N+1 queries. For 1000 users, that is 1001 SELECT statements. db.Preload("Posts") fetches all users first, then fetches all matching posts in a single WHERE user_id IN (...) query — always 2 queries regardless of row count.'
    },
    {
      q: 'When should you NOT use db.AutoMigrate?',
      options: [
        'In production — it can silently drop columns or apply unintended schema changes',
        'In unit tests — AutoMigrate is only for integration tests',
        'When using PostgreSQL — AutoMigrate only supports MySQL',
        'When models have associations — AutoMigrate cannot handle foreign keys',
      ],
      answer: 0,
      explanation: 'AutoMigrate is safe for development and test environments. In production, it runs untested schema changes against live data — it can lock tables, fail to handle existing data correctly, or apply partial migrations that leave the schema in an inconsistent state. Use proper migration tools (golang-migrate, goose) with version-controlled SQL in production.'
    },
    {
      q: 'How do you check for "not found" in GORM after calling db.First?',
      options: [
        'errors.Is(result.Error, gorm.ErrRecordNotFound)',
        'result.RowsAffected == 0',
        'result.Error == nil && result.ID == 0',
        'gorm.IsRecordNotFoundError(result.Error)',
      ],
      answer: 0,
      explanation: 'db.First returns gorm.ErrRecordNotFound when no row matches. Always use errors.Is(result.Error, gorm.ErrRecordNotFound) — not equality (==), because errors may be wrapped. In GORM v1 there was gorm.IsRecordNotFoundError, but v2 removed it in favour of the standard errors.Is pattern.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use GORM or pgx for a new Go service?',
      a: 'It depends on the team and complexity. GORM reduces boilerplate for standard CRUD and associations — ideal for small teams or rapid development. pgx gives you more control, better performance, and explicit SQL — better for complex queries, high-throughput services, or teams that prefer seeing the SQL they run. A common approach: use GORM for simple repositories, drop to db.Raw or pgx for complex analytics queries. Profile both if performance is critical.'
    },
    {
      q: 'How do I configure the underlying connection pool with GORM?',
      a: 'GORM wraps database/sql, so you configure the pool via the sql.DB accessor: sqlDB, _ := db.DB(); sqlDB.SetMaxOpenConns(20); sqlDB.SetMaxIdleConns(5); sqlDB.SetConnMaxLifetime(30 * time.Minute). GORM\'s gorm.Config does not expose pool settings directly — always configure through sqlDB after opening the connection.'
    },
    {
      q: 'How do I run raw SQL in GORM?',
      a: 'db.Raw("SELECT ...", args).Scan(&result) for SELECT queries that scan into structs or maps. db.Exec("UPDATE ...", args) for non-SELECT statements. For named placeholders, use @name syntax with a map or struct: db.Raw("SELECT * FROM users WHERE name = @name", map[string]any{"name": "Alice"}). Always use parameterised queries — never fmt.Sprintf user input into the SQL string.'
    },
    {
      q: 'How do GORM hooks work?',
      a: 'Hooks are methods on your model struct that GORM calls at specific lifecycle points: BeforeCreate, AfterCreate, BeforeSave, AfterSave, BeforeUpdate, AfterUpdate, BeforeDelete, AfterDelete, AfterFind. Returning an error from a hook aborts the operation and rolls back any open transaction. Common uses: generating UUIDs, hashing passwords, updating computed fields, publishing domain events.'
    },
    {
      q: 'Can I use GORM with database migrations?',
      a: 'Yes — GORM itself only provides AutoMigrate (dev use). For production migrations, use golang-migrate or goose alongside GORM: write SQL migration files, run them at startup or in CI/CD, then use GORM for application queries. Atlas (ariga.io) can introspect GORM models and generate migration SQL automatically — a popular middle ground between manual SQL and AutoMigrate.'
    },
    {
      q: 'What does db.Session(&gorm.Session{NewDB: true}) do?',
      a: 'It creates a clean copy of the *gorm.DB without accumulated WHERE conditions, scopes, or other chain state from previous calls. GORM chains conditions by mutating the db pointer, so reusing a db variable across calls accumulates conditions silently — a common source of bugs. Use db.Session(&gorm.Session{NewDB: true}) or db.WithContext(ctx) (which also resets the chain) to get a fresh query builder for each operation.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'GORM maps Go structs to tables with CRUD, associations, and hooks — use db.Updates (not Save) for partial updates, Preload to avoid N+1, and never AutoMigrate in production.',
    mustKnow: [
      'gorm.Model adds ID, CreatedAt, UpdatedAt, DeletedAt (soft-delete) to any struct.',
      'db.Save updates ALL fields; db.Updates(map) updates only specified fields.',
      'Always check result.Error — GORM never panics, it stores errors silently.',
      'Preload("Association") avoids N+1 queries — 2 queries vs N+1.',
      'errors.Is(result.Error, gorm.ErrRecordNotFound) for First/Take not-found.',
      'db.Transaction(func(tx) error) auto-commits or rolls back — idiomatic pattern.',
      'Never use AutoMigrate in production — use proper migration tooling.',
    ],
    interviewFocus: [
      'What is the difference between db.Save and db.Updates?',
      'How does GORM handle soft deletes and how do you bypass them?',
      'What is the N+1 problem and how does Preload solve it?',
      'When is it appropriate to use raw SQL in GORM?',
      'How do you configure the connection pool when using GORM?',
    ],
  };
}
