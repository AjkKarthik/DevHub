import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-aspnet-ef-relationships',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './ef-relationships.html',
  styleUrl: './ef-relationships.scss',
})
export class AspnetEfRelationships {

  quickRef: QuickRefItem[] = [
    { name: 'HasMany / WithOne',      type: 'method',    desc: 'Fluent API: configure one-to-many — one Category has many Products' },
    { name: 'HasOne / WithMany',      type: 'method',    desc: 'Fluent API: configure many-to-one — one Product belongs to one Category' },
    { name: 'HasOne / WithOne',       type: 'method',    desc: 'Fluent API: configure one-to-one — one Order has one ShippingAddress' },
    { name: 'HasMany / WithMany',     type: 'method',    desc: 'Fluent API: configure many-to-many — Products ↔ Tags' },
    { name: 'HasForeignKey()',        type: 'method',    desc: 'Specify the FK property; EF Core can infer it but explicit is safer' },
    { name: 'Include() / ThenInclude()', type: 'method', desc: 'Eager-load navigation properties in a single JOIN query' },
    { name: 'OnDelete(DeleteBehavior)', type: 'method',  desc: 'Cascade / Restrict / SetNull — controls what happens to children on parent delete' },
    { name: 'OwnsOne() / OwnsMany()', type: 'method',   desc: 'Owned entity — belongs to one parent, stored in same table (value object)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'One-to-Many (the most common)',
      points: [
        'Model: the "one" side has a collection navigation property (<code>ICollection&lt;T&gt;</code>), the "many" side has a reference navigation and an optional FK property.',
        'EF Core infers the relationship by convention if you follow naming rules: FK named <code>CategoryId</code> for a <code>Category</code> navigation. Use the Fluent API in <code>OnModelCreating</code> for explicit configuration — it is more maintainable than Data Annotations for complex schemas.',
        'Always initialise collection navigations: <code>public List&lt;Product&gt; Products { get; set; } = []</code>. Uninitialized collections throw <code>NullReferenceException</code> when access is attempted before Include() loads them.',
      ],
    },
    {
      heading: 'Eager Loading with Include',
      points: [
        '<code>Include(o =&gt; o.OrderItems)</code> adds a JOIN to the query and populates the navigation property. Use <code>ThenInclude()</code> to go deeper: <code>Include(o =&gt; o.OrderItems).ThenInclude(i =&gt; i.Product)</code>.',
        'EF Core 5+ splits multi-collection includes into separate queries by default or on demand with <code>AsSplitQuery()</code> — avoids the "cartesian explosion" that inflates row counts when joining multiple one-to-many collections.',
        'Avoid over-including. Only Include what the current use case needs — every Include is an extra JOIN or query. Lean projections (<code>Select</code>) beat Include for read-heavy APIs.',
      ],
    },
    {
      heading: 'Many-to-Many',
      points: [
        'EF Core 5+ supports skip navigation — no explicit join entity needed. Declare <code>public List&lt;Tag&gt; Tags { get; set; } = []</code> on both sides and EF Core creates the join table automatically.',
        'For richer join tables (with payload — e.g., a join date), define an explicit join entity (<code>ProductTag</code>) with its own properties and configure both <code>HasMany</code>/<code>WithMany</code> sides through it.',
        'Use <code>product.Tags.Add(tag)</code> and <code>SaveChangesAsync()</code> to add to a many-to-many relationship. EF Core manages the join table INSERT automatically.',
      ],
    },
    {
      heading: 'Owned Entities & Cascade Delete',
      points: [
        '<strong>Owned entities</strong> (<code>OwnsOne</code>, <code>OwnsMany</code>) represent value objects — they have no identity outside their owner and are stored in the same table by default. Use them for <code>Address</code>, <code>Money</code>, <code>ContactInfo</code>.',
        '<strong>Cascade delete</strong> is the default for required (non-nullable FK) relationships — when a parent is deleted, children are deleted too. For optional FKs, the default is <code>ClientSetNull</code> — EF Core sets FK to null in memory but relies on the DB default for rows deleted via raw SQL.',
        'Always set cascade behavior explicitly in <code>OnDelete(DeleteBehavior.Restrict)</code> for important data — the defaults can surprise you and accidentally delete rows in production.',
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
    public int    Id       { get; set; }
    public string Name     { get; set; } = "";
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
    .Include(c => c.Products)
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
    public int    OrderId { get; set; }     // FK
    public Order  Order   { get; set; } = null!;
}

// Fluent API
modelBuilder.Entity<Order>()
    .HasOne(o => o.ShippingAddress)
    .WithOne(a => a.Order)
    .HasForeignKey<ShippingAddress>(a => a.OrderId)
    .OnDelete(DeleteBehavior.Cascade);

// Query with Include
var order = await db.Orders
    .Include(o => o.ShippingAddress)
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
    public int          Id       { get; set; }
    public string       Name     { get; set; } = "";
    public List<Product> Products { get; set; } = [];
}

// EF Core infers the join table "ProductTag" by convention
// Override if needed:
modelBuilder.Entity<Product>()
    .HasMany(p => p.Tags)
    .WithMany(t => t.Products)
    .UsingEntity(j => j.ToTable("ProductTags"));

// Add a tag to a product
var product = await db.Products.Include(p => p.Tags).FirstAsync(p => p.Id == id, ct);
var tag     = await db.Tags.FindAsync([tagId], ct);
product.Tags.Add(tag!);
await db.SaveChangesAsync(ct);`,
    },
    {
      label: 'Many-to-Many (with payload)',
      language: 'csharp',
      code: `// Explicit join entity for extra properties
public class Student
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<Enrollment> Enrollments { get; set; } = [];
}

public class Course
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public List<Enrollment> Enrollments { get; set; } = [];
}

public class Enrollment          // join entity with payload
{
    public int      StudentId  { get; set; }
    public int      CourseId   { get; set; }
    public DateTime EnrolledAt { get; set; }
    public string?  Grade      { get; set; }
    public Student  Student    { get; set; } = null!;
    public Course   Course     { get; set; } = null!;
}

// Fluent API
modelBuilder.Entity<Enrollment>()
    .HasKey(e => new { e.StudentId, e.CourseId });

modelBuilder.Entity<Student>()
    .HasMany(s => s.Enrollments)
    .WithOne(e => e.Student)
    .HasForeignKey(e => e.StudentId);

// ThenInclude — load deeply
var students = await db.Students
    .Include(s => s.Enrollments)
        .ThenInclude(e => e.Course)
    .AsNoTracking()
    .ToListAsync(ct);`,
    },
    {
      label: 'Owned Entities',
      language: 'csharp',
      code: `// Owned entity — no separate table, no identity outside owner
public class Order
{
    public int     Id      { get; set; }
    public Address Address { get; set; } = null!;
}

public class Address     // value object — no Id
{
    public string Street  { get; set; } = "";
    public string City    { get; set; } = "";
    public string Country { get; set; } = "";
}

// Fluent API — stored as columns in Orders table
modelBuilder.Entity<Order>().OwnsOne(o => o.Address, a =>
{
    a.Property(x => x.Street).HasColumnName("ShipStreet").HasMaxLength(200);
    a.Property(x => x.City).HasColumnName("ShipCity").HasMaxLength(100);
    a.Property(x => x.Country).HasColumnName("ShipCountry").HasMaxLength(60);
});

// Usage — no DbSet<Address>; queried through Order
var order = new Order
{
    Address = new Address { Street = "1 Main St", City = "London", Country = "GB" }
};
db.Orders.Add(order);
await db.SaveChangesAsync(ct);`,
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
    public int    Id    { get; set; }
    public string Name  { get; set; } = "";
    public List<Post> Posts { get; set; } = [];
}

public class Post
{
    public int    Id      { get; set; }
    public string Title   { get; set; } = "";
    public string Content { get; set; } = "";
    public int    BlogId  { get; set; }
    public Blog   Blog    { get; set; } = null!;
    public List<Tag> Tags { get; set; } = [];
}

public class Tag
{
    public int    Id    { get; set; }
    public string Name  { get; set; } = "";
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
    var post = await db.Posts.Include(p => p.Tags).FirstOrDefaultAsync(p => p.Id == postId, ct);
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
      explanation: 'N+1 happens when you load a collection (query 1) then access a navigation property per item in a loop (N queries). Without lazy loading (disabled by default in EF Core), navigations are null until you Include() them — which collapses the N queries into 1 JOIN.',
    },
    {
      q: 'What does ThenInclude() do?',
      options: [
        'Adds a second top-level Include',
        'Loads a navigation property of the already-included navigation property',
        'Splits the query into two separate SQL statements',
        'Sorts included entities',
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
      explanation: 'Cascade delete: deleting the parent entity causes all related children to be deleted. It is the default for required (non-nullable FK) relationships. Use DeleteBehavior.Restrict to block parent deletion when children exist.',
    },
    {
      q: 'Which is the simplest way to model a many-to-many without extra payload?',
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
      q: 'Where does an owned entity\'s data get stored by default?',
      options: [
        'In its own table with a FK back to the owner',
        'In the owner\'s table as additional columns',
        'In a JSON column',
        'In a separate owned-entity schema',
      ],
      answer: 1,
      explanation: 'OwnsOne() stores the owned type\'s properties as columns in the owner\'s table (table splitting). This models value objects with no separate identity. Use OwnsMany() for a collection of owned types — those go in a separate table with a shadow FK.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Include() and Select() for loading related data?',
      a: 'Include() generates a JOIN and populates the navigation property on the full entity — convenient but loads all columns of both entities. Select() projects a custom shape — you choose exactly which fields to include from both entities. For APIs, Select() is usually more efficient: smaller payloads, no over-fetching, and the compiler ensures you only read what you asked for.',
    },
    {
      q: 'Can I configure relationships with Data Annotations instead of Fluent API?',
      a: 'Yes, for simple cases. [ForeignKey("CategoryId")] on a navigation property, [InverseProperty("Products")] to disambiguate multiple navigations to the same type. But Fluent API in OnModelCreating is more powerful and readable for complex configurations — cascade behavior, composite keys, owned types, and table splitting all require Fluent API.',
    },
    {
      q: 'What does AsSplitQuery() do, and when should I use it?',
      a: 'AsSplitQuery() splits a query with multiple collection Includes into separate SQL SELECTs instead of one big JOIN. Without it, joining multiple one-to-many collections causes a "cartesian explosion" — if an order has 10 items and each item has 5 properties, the JOIN produces 50 rows for one order. Split queries avoid this at the cost of an extra round trip. Enable globally with UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery) or per-query with AsSplitQuery().',
    },
    {
      q: 'How do I handle self-referencing relationships (e.g., a Category with sub-categories)?',
      a: 'Model it exactly like any other one-to-many, but with the FK pointing to the same table: public int? ParentId { get; set; } and public Category? Parent { get; set; } with public List<Category> Children { get; set; } = []. EF Core supports this — use nullable FK (int?) to allow top-level categories. Loading the full tree requires recursive Include (limited depth) or a raw recursive CTE query.',
    },
    {
      q: 'What happens if I forget to initialize a collection navigation property?',
      a: 'If the collection navigation is null (not initialized to an empty list) and you access it without first loading it via Include(), you get a NullReferenceException. Always initialize: public List<T> Items { get; set; } = []. This has no DB impact — it just prevents null-reference bugs in code that touches the collection before EF loads it.',
    },
  ];
}
