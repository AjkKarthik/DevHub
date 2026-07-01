import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-aspnet-ef-relationships',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './ef-relationships.html',
  styleUrl: './ef-relationships.scss',
})
export class AspnetEfRelationships {

  prerequisites: Prerequisite[] = [
    { label: 'EF Core Basics', route: '/aspnet/ef-core-basics' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'HasMany / WithOne',         type: 'method',  desc: 'Fluent API: one-to-many — one parent has many children' },
    { name: 'HasOne / WithMany',         type: 'method',  desc: 'Fluent API: many-to-one — many children belong to one parent' },
    { name: 'HasOne / WithOne',          type: 'method',  desc: 'Fluent API: one-to-one — one entity owns one other' },
    { name: 'HasMany / WithMany',        type: 'method',  desc: 'Fluent API: many-to-many — requires UsingEntity for join table control' },
    { name: 'HasForeignKey()',           type: 'method',  desc: 'Specify the FK property — explicit is safer than convention' },
    { name: 'Include() / ThenInclude()', type: 'method',  desc: 'Eager-load navigation properties via JOIN or split queries' },
    { name: 'AsSplitQuery()',            type: 'method',  desc: 'Split multi-collection Include into separate SELECTs to avoid cartesian explosion' },
    { name: 'OnDelete(DeleteBehavior)',  type: 'method',  desc: 'Cascade / Restrict / SetNull — controls children on parent delete' },
    { name: 'OwnsOne() / OwnsMany()',   type: 'method',  desc: 'Owned entity — value object stored in owner\'s table' },
    { name: 'UsingEntity()',             type: 'method',  desc: 'Configure the join table name/columns for many-to-many' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'One-to-Many (the most common)',
      points: [
        'Model: the "one" side has a collection navigation (<code>ICollection&lt;T&gt;</code> or <code>List&lt;T&gt;</code>), the "many" side has a reference navigation and an optional FK property.',
        'EF Core infers the relationship by convention if you follow naming rules: FK named <code>CategoryId</code> for a <code>Category</code> navigation. Use Fluent API in <code>OnModelCreating</code> for explicit configuration — it is more maintainable than Data Annotations for complex schemas.',
        'Always initialise collection navigations: <code>public List&lt;Product&gt; Products { get; set; } = []</code>. Uninitialised collections throw <code>NullReferenceException</code> when accessed before <code>Include()</code> loads them.',
        'Set <code>OnDelete(DeleteBehavior.Restrict)</code> explicitly for important data. The default for required FKs is <code>Cascade</code> — silently deleting children when a parent is removed can cause devastating data loss in production.',
        'The FK property (<code>CategoryId</code>) is optional but strongly recommended — it lets you update the relationship without loading the parent entity and prevents accidental extra SELECTs.',
        'Use <code>HasForeignKey()</code> in Fluent API even when EF Core could infer it — makes the schema intent explicit and prevents silent convention changes from breaking your model on upgrades.',
      ],
    },
    {
      heading: 'Eager Loading with Include',
      points: [
        '<code>Include(o =&gt; o.OrderItems)</code> adds a JOIN to the query and populates the navigation property. Use <code>ThenInclude()</code> to go deeper: <code>Include(o =&gt; o.OrderItems).ThenInclude(i =&gt; i.Product)</code>.',
        'EF Core uses a single JOIN query by default for all Include chains. With multiple one-to-many collections this causes a "cartesian explosion" — rows multiply per collection. Use <code>AsSplitQuery()</code> to split into separate SELECTs.',
        'Always pair <code>Include()</code> with <code>AsNoTracking()</code> on read-only endpoints — loading navigation graphs into the change tracker wastes memory.',
        'Avoid over-including. Only Include what the current use case needs — every Include is an extra JOIN or query. Lean projections (<code>Select()</code>) beat <code>Include()</code> for read-heavy APIs.',
        'Filtered Include (EF Core 5+): <code>Include(c =&gt; c.Products.Where(p =&gt; p.IsActive))</code> — applies a filter inside the Include, reducing the result set without loading everything then filtering in memory.',
        'Never call <code>Include()</code> in a loop or conditionally based on runtime state — include chains must be known at query-build time. For dynamic includes, build the query incrementally before materialising.',
      ],
    },
    {
      heading: 'Many-to-Many',
      points: [
        'EF Core 5+ supports <strong>skip navigations</strong> — no explicit join entity needed. Declare <code>public List&lt;Tag&gt; Tags { get; set; } = []</code> on both sides and EF Core creates the join table automatically.',
        'Use <code>UsingEntity(j =&gt; j.ToTable("ProductTags"))</code> to control the join table name. Without it, EF Core names it by alphabetical convention which may not match your schema.',
        'For richer join tables (with payload — e.g., a join date or status), define an explicit join entity (<code>ProductTag</code>) with its own properties and configure both sides with <code>HasMany/WithOne</code>.',
        'To add to a many-to-many: load the entity with <code>Include(p =&gt; p.Tags)</code>, then <code>product.Tags.Add(tag)</code>, then <code>SaveChangesAsync()</code>. EF Core handles the join table INSERT automatically.',
        'To query many-to-many efficiently without loading the whole graph, project: <code>db.Products.Select(p =&gt; new { p.Id, Tags = p.Tags.Select(t =&gt; t.Name) })</code>.',
        'Composite key on explicit join entity: <code>modelBuilder.Entity&lt;ProductTag&gt;().HasKey(pt =&gt; new { pt.ProductId, pt.TagId })</code> — always define it explicitly to avoid EF Core adding a surrogate PK.',
      ],
    },
    {
      heading: 'Owned Entities & Value Objects',
      points: [
        '<strong>Owned entities</strong> (<code>OwnsOne</code>, <code>OwnsMany</code>) represent value objects — they have no identity outside their owner and are stored in the same table by default. Perfect for <code>Address</code>, <code>Money</code>, <code>ContactInfo</code>.',
        '<code>OwnsMany</code> stores the collection in a separate table with a shadow FK to the owner — no need for a separate <code>DbSet&lt;T&gt;</code>. The owned entities are only reachable through the owner.',
        'Use <code>a.Property(x =&gt; x.Street).HasColumnName("ShipStreet")</code> inside <code>OwnsOne()</code> to rename columns and avoid generic <code>Address_Street</code> prefixes.',
        'Owned entities are loaded automatically when you query the owner — no <code>Include()</code> needed for <code>OwnsOne</code>. For <code>OwnsMany</code>, use <code>.OwnsMany()</code> to configure and they load with the owner.',
        'Do not give owned entities an Id property — they are value objects. If you find yourself needing to query them independently, they should be a regular (non-owned) entity with its own <code>DbSet&lt;T&gt;</code>.',
        'Table splitting (another pattern): map two entities to the same table, sharing a PK. Useful for splitting a wide table into two narrower entities loaded together or separately.',
      ],
    },
    {
      heading: 'Cascade Delete & Relationship Safety',
      points: [
        '<strong>Cascade delete</strong> is the default for required (non-nullable FK) relationships — deleting the parent deletes all children automatically. This is convenient but can be catastrophic if applied to the wrong relationship.',
        '<code>DeleteBehavior.Restrict</code>: EF Core throws if you try to delete a parent that has children. The database also enforces this via a RESTRICT constraint (depends on provider).',
        '<code>DeleteBehavior.SetNull</code>: child FK column is set to NULL when the parent is deleted — requires the FK to be nullable. Useful when children can exist without a parent.',
        '<code>DeleteBehavior.ClientSetNull</code> (default for optional FKs): EF Core sets the FK to null in memory for tracked entities but does NOT issue a SET NULL for rows deleted via raw SQL. Can cause FK violations.',
        'Always set cascade behavior explicitly in production schemas. Review the generated migration\'s <code>onDelete: ReferentialAction.Cascade</code> lines — a migration that adds unintended cascades can silently drop data.',
        'For soft delete patterns, avoid Cascade entirely — set FK to null or use a logical delete flag, so "deleted" parents do not cascade into children you still need.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'One-to-Many',
      language: 'csharp',
      code: `// Entities
public class Category
{
    public int           Id       { get; set; }
    public string        Name     { get; set; } = "";
    public List<Product> Products { get; set; } = [];   // collection navigation
}

public class Product
{
    public int      Id         { get; set; }
    public string   Name       { get; set; } = "";
    public decimal  Price      { get; set; }
    public int      CategoryId { get; set; }            // FK property
    public Category Category   { get; set; } = null!;  // reference navigation
}

// Fluent API (in OnModelCreating)
modelBuilder.Entity<Category>()
    .HasMany(c => c.Products)
    .WithOne(p => p.Category)
    .HasForeignKey(p => p.CategoryId)
    .OnDelete(DeleteBehavior.Restrict);   // don't cascade-delete products

// Eager loading
var categories = await db.Categories
    .Include(c => c.Products.Where(p => p.Price > 50))   // filtered include
    .AsNoTracking()
    .ToListAsync(ct);`,
    },
    {
      label: 'One-to-One',
      language: 'csharp',
      code: `public class Order
{
    public int             Id              { get; set; }
    public DateTime        PlacedAt        { get; set; }
    public ShippingAddress ShippingAddress { get; set; } = null!;
}

public class ShippingAddress
{
    public int    Id      { get; set; }
    public string Street  { get; set; } = "";
    public string City    { get; set; } = "";
    public int    OrderId { get; set; }     // FK on the "dependent" side
    public Order  Order   { get; set; } = null!;
}

// Fluent API — HasForeignKey must specify the dependent type
modelBuilder.Entity<Order>()
    .HasOne(o => o.ShippingAddress)
    .WithOne(a => a.Order)
    .HasForeignKey<ShippingAddress>(a => a.OrderId)
    .OnDelete(DeleteBehavior.Cascade);   // delete address when order deleted

// Query
var order = await db.Orders
    .Include(o => o.ShippingAddress)
    .AsNoTracking()
    .FirstOrDefaultAsync(o => o.Id == id, ct);`,
    },
    {
      label: 'Many-to-Many (skip nav)',
      language: 'csharp',
      code: `// EF Core 5+ skip navigation — no explicit join entity
public class Product
{
    public int       Id   { get; set; }
    public string    Name { get; set; } = "";
    public List<Tag> Tags { get; set; } = [];
}

public class Tag
{
    public int           Id       { get; set; }
    public string        Name     { get; set; } = "";
    public List<Product> Products { get; set; } = [];
}

// Control the join table name
modelBuilder.Entity<Product>()
    .HasMany(p => p.Tags)
    .WithMany(t => t.Products)
    .UsingEntity(j => j.ToTable("ProductTags"));

// Add a tag to a product
var product = await db.Products.Include(p => p.Tags)
                                .FirstAsync(p => p.Id == id, ct);
var tag = await db.Tags.FindAsync([tagId], ct);
product.Tags.Add(tag!);
await db.SaveChangesAsync(ct);

// Efficient projection — no full Include needed
var productTags = await db.Products
    .Select(p => new { p.Id, p.Name, Tags = p.Tags.Select(t => t.Name) })
    .AsNoTracking()
    .ToListAsync(ct);`,
    },
    {
      label: 'Many-to-Many (with payload)',
      language: 'csharp',
      code: `// Explicit join entity for extra properties
public class Enrollment
{
    public int      StudentId  { get; set; }
    public int      CourseId   { get; set; }
    public DateTime EnrolledAt { get; set; }
    public string?  Grade      { get; set; }
    public Student  Student    { get; set; } = null!;
    public Course   Course     { get; set; } = null!;
}

// Fluent API — composite PK on join entity
modelBuilder.Entity<Enrollment>()
    .HasKey(e => new { e.StudentId, e.CourseId });

modelBuilder.Entity<Student>()
    .HasMany(s => s.Enrollments).WithOne(e => e.Student)
    .HasForeignKey(e => e.StudentId)
    .OnDelete(DeleteBehavior.Cascade);

modelBuilder.Entity<Course>()
    .HasMany(c => c.Enrollments).WithOne(e => e.Course)
    .HasForeignKey(e => e.CourseId)
    .OnDelete(DeleteBehavior.Cascade);

// Query with split to avoid cartesian explosion
var students = await db.Students
    .Include(s => s.Enrollments).ThenInclude(e => e.Course)
    .AsSplitQuery()
    .AsNoTracking()
    .ToListAsync(ct);`,
    },
    {
      label: 'Owned Entities',
      language: 'csharp',
      code: `// Value object — no identity outside owner
public class Address
{
    public string Street  { get; set; } = "";
    public string City    { get; set; } = "";
    public string Country { get; set; } = "";
}

public class Order
{
    public int     Id      { get; set; }
    public Address Address { get; set; } = null!;  // owned type
}

// Stored as columns in Orders table
modelBuilder.Entity<Order>().OwnsOne(o => o.Address, a =>
{
    a.Property(x => x.Street).HasColumnName("ShipStreet").HasMaxLength(200);
    a.Property(x => x.City).HasColumnName("ShipCity").HasMaxLength(100);
    a.Property(x => x.Country).HasColumnName("ShipCountry").HasMaxLength(60);
});
// Columns: Orders.ShipStreet, Orders.ShipCity, Orders.ShipCountry

// OwnsMany — collection stored in a separate table
public class Product { public List<Image> Images { get; set; } = []; }
public class Image   { public string Url { get; set; } = ""; }

modelBuilder.Entity<Product>().OwnsMany(p => p.Images, img =>
    img.Property(x => x.Url).HasMaxLength(500));
// No DbSet<Image> needed — only accessible through Product`,
    },
  ];

  challenge: Challenge = {
    title: 'Blog with Posts and Tags',
    language: 'csharp',
    description: 'Model a blog with EF Core relationships. Requirements: (1) Blog (Id, Name) has many Posts. (2) Post (Id, Title, Content, BlogId) has many Tags via a skip navigation (many-to-many). (3) Tag (Id, Name). (4) Configure relationships in OnModelCreating. (5) Implement: GET /blogs/{id}/posts — returns all posts for a blog with their tags (Include + ThenInclude, AsNoTracking). (6) POST /posts/{postId}/tags/{tagId} — adds a tag to a post.',
    hints: [
      'Initialize collection navigations: public List<Post> Posts { get; set; } = []',
      'Include(p => p.Tags) loads the many-to-many skip navigation',
      'Load the post with Include(p => p.Tags) before calling post.Tags.Add(tag)',
      'EF Core creates the join table automatically for skip navigations',
    ],
    starterCode: `// TODO: Blog entity (Id, Name, Posts navigation)
// TODO: Post entity (Id, Title, Content, BlogId, Blog nav, Tags nav)
// TODO: Tag entity (Id, Name, Posts nav)

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // TODO: DbSets
    // TODO: OnModelCreating — configure relationships
}

// TODO: GET /blogs/{id}/posts — returns posts with tags
// TODO: POST /posts/{postId}/tags/{tagId} — adds tag to post`,
    solution: `public class Blog
{
    public int       Id    { get; set; }
    public string    Name  { get; set; } = "";
    public List<Post> Posts { get; set; } = [];
}

public class Post
{
    public int      Id      { get; set; }
    public string   Title   { get; set; } = "";
    public string   Content { get; set; } = "";
    public int      BlogId  { get; set; }
    public Blog     Blog    { get; set; } = null!;
    public List<Tag> Tags   { get; set; } = [];
}

public class Tag
{
    public int        Id    { get; set; }
    public string     Name  { get; set; } = "";
    public List<Post> Posts { get; set; } = [];
}

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Blog> Blogs { get; set; }
    public DbSet<Post> Posts { get; set; }
    public DbSet<Tag>  Tags  { get; set; }

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<Blog>()
         .HasMany(b => b.Posts).WithOne(p => p.Blog)
         .HasForeignKey(p => p.BlogId).OnDelete(DeleteBehavior.Cascade);

        m.Entity<Post>()
         .HasMany(p => p.Tags).WithMany(t => t.Posts)
         .UsingEntity(j => j.ToTable("PostTags"));
    }
}

// GET /blogs/{id}/posts
app.MapGet("/blogs/{id:int}/posts", async (int id, AppDbContext db, CancellationToken ct) =>
{
    var blog = await db.Blogs
        .Include(b => b.Posts).ThenInclude(p => p.Tags)
        .AsNoTracking()
        .FirstOrDefaultAsync(b => b.Id == id, ct);
    return blog is null ? Results.NotFound() : Results.Ok(blog.Posts);
});

// POST /posts/{postId}/tags/{tagId}
app.MapPost("/posts/{postId:int}/tags/{tagId:int}",
    async (int postId, int tagId, AppDbContext db, CancellationToken ct) =>
{
    var post = await db.Posts.Include(p => p.Tags)
                             .FirstOrDefaultAsync(p => p.Id == postId, ct);
    if (post is null) return Results.NotFound("Post not found");
    var tag = await db.Tags.FindAsync([tagId], ct);
    if (tag is null) return Results.NotFound("Tag not found");
    post.Tags.Add(tag);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
});`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the N+1 query problem in EF Core?',
      options: [
        'Loading N entities in a single query — too many rows',
        'Loading N entities then accessing a navigation property in a loop, causing N additional queries',
        'Running SaveChangesAsync N times instead of once',
        'Having N foreign keys on one entity',
      ],
      answer: 1,
      explanation: 'N+1: query 1 loads a list of N entities, then N queries fire because a navigation property is accessed per item without being included. Use Include() to collapse all of that into one JOIN.',
    },
    {
      q: 'What does ThenInclude() do?',
      options: [
        'Adds a second top-level Include',
        'Loads a navigation property of the already-included navigation property',
        'Splits the query into two separate SQL statements',
        'Sorts the included entities',
      ],
      answer: 1,
      explanation: 'ThenInclude() chains off a previous Include() to load deeper levels: Include(o => o.Items).ThenInclude(i => i.Product) loads Orders → OrderItems → Products in one round trip.',
    },
    {
      q: 'What does DeleteBehavior.Cascade mean?',
      options: [
        'When a child is deleted, the parent is also deleted',
        'When a parent is deleted, all child rows are automatically deleted',
        'When a parent is deleted, child FK columns are set to NULL',
        'EF Core blocks the delete if children exist',
      ],
      answer: 1,
      explanation: 'Cascade delete: deleting the parent causes all related children to be deleted. It is the default for required (non-nullable FK) relationships. Use DeleteBehavior.Restrict to block parent deletion when children exist.',
    },
    {
      q: 'Which is the simplest way to model a many-to-many without extra payload columns?',
      options: [
        'Create an explicit join entity with two FK properties',
        'Use skip navigations (EF Core 5+) — EF Core creates the join table automatically',
        'Serialize one side as JSON in a single column',
        'Many-to-many always requires an explicit join entity',
      ],
      answer: 1,
      explanation: 'EF Core 5+ skip navigations: declare List<Tag> Tags on Product and List<Product> Products on Tag. EF Core generates the join table automatically. Use an explicit join entity only when the join needs extra payload columns.',
    },
    {
      q: 'Where does an owned entity\'s data get stored by default with OwnsOne()?',
      options: [
        'In its own table with a FK back to the owner',
        'In the owner\'s table as additional columns',
        'In a JSON column',
        'In a separate owned-entity schema',
      ],
      answer: 1,
      explanation: 'OwnsOne() stores the owned type\'s properties as columns in the owner\'s table (table splitting). This models value objects with no separate identity. OwnsMany() uses a separate table with a shadow FK.',
    },
    {
      q: 'What is AsSplitQuery() used for?',
      options: [
        'Splits a single entity across two tables',
        'Splits a query with multiple collection Includes into separate SQL SELECTs to avoid cartesian explosion',
        'Runs two queries in parallel',
        'Limits the number of joined rows to prevent memory issues',
      ],
      answer: 1,
      explanation: 'When you have multiple one-to-many Includes, a single JOIN can multiply rows (cartesian explosion). AsSplitQuery() sends separate SELECT statements per collection, then EF Core stitches results in memory — fewer rows, but one extra round trip.',
    },
    {
      q: 'How do you add an entity to a many-to-many skip navigation?',
      options: [
        'Insert directly into the join table with raw SQL',
        'Load the entity with Include(), call Tags.Add(tag), then SaveChangesAsync()',
        'Use context.Add() on a new join entity',
        'Call context.Update() with both entities',
      ],
      answer: 1,
      explanation: 'For skip navigations, load the entity with Include(p => p.Tags) first to let EF Core track the current state, then add to the collection and call SaveChangesAsync(). EF Core generates the INSERT into the join table automatically.',
    },
    {
      q: 'What happens if you use DeleteBehavior.ClientSetNull (default for optional FKs) and delete a parent via raw SQL?',
      options: [
        'EF Core automatically issues SET NULL for all related children',
        'Child FK columns remain pointing to the deleted parent — potential FK violation',
        'The database raises an error and blocks the delete',
        'EF Core deletes children automatically regardless of the behavior setting',
      ],
      answer: 1,
      explanation: 'ClientSetNull means EF Core sets FKs to null only for entities it is currently tracking. Deleting the parent via raw SQL bypasses EF Core — children keep their FK value, which now points to a non-existent row, causing FK constraint violations.',
    },
    {
      q: 'What is the purpose of defining a composite key on an explicit join entity?',
      options: [
        'Allows multiple relationships between the same pair of entities',
        'Prevents duplicate entries in the join table and avoids a surrogate PK column',
        'Improves query performance on large join tables',
        'Required by EF Core to recognise the entity as a join table',
      ],
      answer: 1,
      explanation: 'A composite key (HasKey(e => new { e.ProductId, e.TagId })) on the join entity enforces uniqueness and prevents EF Core from adding an unwanted surrogate Id column. Without it, EF Core adds its own PK and allows duplicate join entries.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Include() and Select() for loading related data?',
      a: 'Include() generates a JOIN and populates the full navigation property — convenient but loads all columns of both entities. Select() projects a custom shape — you choose exactly which fields. For APIs, Select() is usually more efficient: smaller payloads, no over-fetching, and the compiler ensures you only read what you asked for.',
    },
    {
      q: 'Can I configure relationships with Data Annotations instead of Fluent API?',
      a: 'Yes, for simple cases. [ForeignKey("CategoryId")] on a navigation, [InverseProperty] to disambiguate multiple navigations to the same type. But Fluent API in OnModelCreating is more powerful and readable for complex configurations — cascade behavior, composite keys, owned types, and table splitting all require Fluent API.',
    },
    {
      q: 'A query uses AsSplitQuery() to load an Order with its Items and Tags collections via separate SELECTs. Between the first SELECT (loading Orders) and the second SELECT (loading Items) executing, another process deletes one of the orders. What consistency risk does this introduce that a single JOIN-based query would not have?',
      a: 'AsSplitQuery() trades the cartesian-explosion problem for a different one: since the separate SELECTs are NOT wrapped in a single atomic snapshot by default, a concurrent write between them can produce a result set that never actually existed as a consistent state — e.g. the Orders SELECT returns an order that the Items SELECT (running moments later) no longer finds any items for because it was deleted in between, or worse, a new order matching the same filter appears in the second query but not the first. A single JOIN-based query is atomic at the database level (one consistent snapshot for the whole result), so it cannot exhibit this specific split-read anomaly. Mitigating this for AsSplitQuery() requires wrapping the whole operation in an explicit transaction with an appropriate isolation level if consistency across the split queries genuinely matters for that use case.',
    },
    {
      q: 'How do I handle self-referencing relationships (e.g., Category with sub-categories)?',
      a: 'Model it exactly like any other one-to-many, but with the FK pointing to the same table: public int? ParentId { get; set; } and public Category? Parent + public List<Category> Children { get; set; } = []. Use nullable FK for top-level categories. Loading the full tree requires recursive Include (limited depth) or a raw recursive CTE query.',
    },
    {
      q: 'What happens if I forget to initialize a collection navigation property?',
      a: 'Accessing an uninitialised null collection before EF Core loads it via Include() throws NullReferenceException. Always initialise: public List<T> Items { get; set; } = []. This has no database impact — it just prevents null-reference bugs in code that touches the collection before it is loaded.',
    },
    {
      q: 'When should I use an owned entity vs a regular entity with its own DbSet?',
      a: 'Use OwnsOne/OwnsMany for value objects — types with no meaningful identity outside their owner (Address, Money, ContactInfo). Use a regular entity when: the type can exist without an owner, you need to query it independently, or multiple parents can reference the same instance.',
    },
    {
      q: 'What is filtered Include and when is it useful?',
      a: 'Filtered Include (EF Core 5+) applies a Where/OrderBy/Take/Skip inside Include(): Include(c => c.Products.Where(p => p.IsActive)). It reduces the number of related entities loaded — useful when you only need a subset (e.g., the 5 most recent orders, active products only) and you do not want to filter in memory after loading all of them.',
    },
    {
      q: 'How do I choose between DeleteBehavior.Cascade and DeleteBehavior.Restrict?',
      a: 'Use Cascade when children have no meaning without the parent (OrderItem → Order, Comment → Post). Use Restrict when children should survive the parent\'s deletion (User → Orders — deleting a user should not delete all their orders). Review every cascade in your migration before applying — accidental cascades delete data silently.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting to initialize collection navigation properties',
      wrong: `public class Category
{
    public int Id { get; set; }
    public List<Product> Products { get; set; }  // ❌ null until Include() runs
}

// Accessing without Include() → NullReferenceException
var count = category.Products.Count;`,
      right: `public class Category
{
    public int Id { get; set; }
    public List<Product> Products { get; set; } = [];  // ✓ always safe to access
}`,
      explanation: 'Collection navigations are null if not initialized. If you access the collection before EF Core loads it via Include(), you get a NullReferenceException. Initialize with = [] (or new List<T>()).',
    },
    {
      title: 'Using DeleteBehavior.Cascade on important data without thinking',
      wrong: `// Cascade is the default for required FKs
modelBuilder.Entity<User>()
    .HasMany(u => u.Orders)
    .WithOne(o => o.User)
    .HasForeignKey(o => o.UserId);
// ❌ Deleting a User silently deletes all their Orders`,
      right: `modelBuilder.Entity<User>()
    .HasMany(u => u.Orders)
    .WithOne(o => o.User)
    .HasForeignKey(o => o.UserId)
    .OnDelete(DeleteBehavior.Restrict);   // ✓ throws if user has orders`,
      explanation: 'The default for required FKs is Cascade — deleting a parent silently deletes all children. Always set cascade behavior explicitly and choose Restrict for entities that should survive the parent.',
    },
    {
      title: 'Loading an entity without Include() then accessing a navigation property',
      wrong: `// N+1: one query for orders + N queries for customer names
var orders = await db.Orders.ToListAsync(ct);
foreach (var order in orders)
{
    Console.WriteLine(order.Customer.Name);  // ❌ null (lazy loading is off)
}`,
      right: `// Single query with Join
var orders = await db.Orders
    .Include(o => o.Customer)   // ✓ JOIN — one query
    .AsNoTracking()
    .ToListAsync(ct);

// Or project if you only need the name:
var orders = await db.Orders
    .Select(o => new { o.Id, CustomerName = o.Customer.Name })
    .ToListAsync(ct);`,
      explanation: 'EF Core disables lazy loading by default. Navigation properties are null until explicitly loaded. Without Include(), a navigation property accessed in code is null — not an extra query.',
    },
    {
      title: 'Skipping AsSplitQuery() on queries with multiple collection Includes',
      wrong: `var orders = await db.Orders
    .Include(o => o.Items)
    .Include(o => o.Tags)   // ❌ cartesian: Items × Tags rows per order
    .ToListAsync(ct);`,
      right: `var orders = await db.Orders
    .Include(o => o.Items)
    .Include(o => o.Tags)
    .AsSplitQuery()          // ✓ two separate SELECTs, no row multiplication
    .AsNoTracking()
    .ToListAsync(ct);`,
      explanation: 'Including multiple collections in one JOIN query multiplies rows (Items × Tags). 10 items × 5 tags = 50 rows per order. AsSplitQuery() uses separate SELECTs and stitches in memory — far fewer rows.',
    },
    {
      title: 'Using skip navigation without calling Include() before modifying',
      wrong: `// Add a tag to a product WITHOUT loading tags first
var product = await db.Products.FindAsync([id], ct);
product!.Tags.Add(tag);   // ❌ NullReferenceException or duplicate join table entry`,
      right: `// Load the current tags before modifying
var product = await db.Products
    .Include(p => p.Tags)
    .FirstAsync(p => p.Id == id, ct);
product.Tags.Add(tag);    // ✓ EF Core knows the current state, inserts into join table
await db.SaveChangesAsync(ct);`,
      explanation: 'EF Core needs to know the current state of the skip navigation to insert the correct row into the join table. Without Include(), the Tags collection is null — modifying it either throws or creates a duplicate join table entry.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'EF Core relationships are configured via Fluent API (HasMany/WithOne, HasOne/WithOne, HasMany/WithMany) and loaded eagerly with Include()/ThenInclude(); owned entities model value objects; cascade delete must always be set explicitly.',
    mustKnow: [
      'Initialize collection navigations (= []) to prevent NullReferenceException before Include() runs',
      'Include() + ThenInclude() for eager loading; use AsSplitQuery() when including multiple collections',
      'Skip navigations (EF Core 5+) create the join table automatically; use UsingEntity() to control the table name',
      'OwnsOne() stores value objects as columns in the owner\'s table — no DbSet needed',
      'Always set OnDelete(DeleteBehavior) explicitly — the default Cascade for required FKs can silently delete data',
      'Load the entity with Include(p => p.Tags) before calling Tags.Add() on a skip navigation',
      'AsSplitQuery() avoids cartesian explosion when joining multiple one-to-many collections',
    ],
    interviewFocus: [
      'What is the N+1 problem and how does Include() solve it?',
      'What is the difference between a skip navigation and an explicit join entity?',
      'What is an owned entity and when would you use OwnsOne vs a regular entity?',
      'What is AsSplitQuery() and when should you use it?',
      'What are the differences between DeleteBehavior.Cascade, Restrict, SetNull, and ClientSetNull?',
    ],
  };
}
