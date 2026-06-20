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
  selector: 'app-python-django',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './django.html',
  styleUrl: './django.scss'
})
export class PythonDjango {
  readingTime = 28; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'Django 4.x+';
  route = 'py-django'; nextRoute = '/python/sqlalchemy'; nextLabel = 'SQLAlchemy';

  quickRef: QuickRefItem[] = [
    { name: 'models.Model', type: 'class', desc: 'Base class for Django ORM models. Each subclass maps to a database table.' },
    { name: 'QuerySet.filter(**lookup)', type: 'method', desc: 'Lazy queryset. filter(age__gte=18, name__icontains="ali"). Evaluated on iteration/len/bool.' },
    { name: 'select_related(*fields)', type: 'method', desc: 'SQL JOIN for ForeignKey/OneToOne — avoids N+1 with a single query. Use for known related objects.' },
    { name: 'prefetch_related(*fields)', type: 'method', desc: 'Separate query for ManyToMany/reverse FK — batches in memory. Use for sets of related objects.' },
    { name: 'get_object_or_404(Model, **kw)', type: 'function', desc: 'get() or raise Http404. Saves try/except in views. Django shortcut.' },
    { name: '@login_required', type: 'decorator', desc: 'Redirect unauthenticated users to settings.LOGIN_URL. View decorator. Use @permission_required for object-level auth.' },
    { name: 'Serializer (DRF)', type: 'class', desc: 'Django REST Framework. Validates and serialises model data to/from JSON. ModelSerializer auto-generates from a Model.' },
    { name: 'ViewSet (DRF)', type: 'class', desc: 'Groups CRUD actions (list, create, retrieve, update, destroy) into one class. Router auto-generates URLs.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Django Architecture — MVT',
      points: [
        'Django follows the Model-View-Template (MVT) pattern. Models define the data structure and map to DB tables via the ORM. Views handle HTTP logic — receive requests, query models, and return responses. Templates render HTML. URL patterns route URLs to views. Note: Django\'s "View" plays the role of a "Controller" in MVC.',
        'Project structure: manage.py for CLI commands; settings.py for configuration; urls.py for URL routing; each app has its own models.py, views.py, urls.py, admin.py. Apps are reusable components: django.contrib.auth (authentication), django.contrib.admin (admin UI), django.contrib.staticfiles (asset serving).',
        'Request lifecycle: Django URL dispatcher matches the path → calls the matched view function/class → view queries models → passes data to a template (or returns JSON) → Django sends the HttpResponse. Middleware wraps this: each middleware can process the request before the view and the response after.',
        'The Django admin (django.contrib.admin) auto-generates a CRUD interface for registered models — register with admin.site.register(MyModel). Customise with ModelAdmin: list_display, list_filter, search_fields, ordering, fieldsets. The admin is a powerful internal tool — always restrict access (staff_member_required or custom permissions).',
      ]
    },
    {
      heading: 'ORM — Querysets and N+1',
      points: [
        'Django ORM querysets are lazy — no SQL is executed until the queryset is evaluated (iterated, converted to list, accessed with [n], or passed to len/bool). Chain filter/exclude/order_by/annotate without hitting the database. Queryset evaluation triggers the SQL and caches the results.',
        'N+1 query problem: for post in Post.objects.all(): print(post.author.name) — this generates 1 query for all posts + N queries for each author. Fix: Post.objects.select_related("author") generates a single JOIN query. For reverse FK (post.comments.all()), use prefetch_related("comments") which does 2 queries total.',
        'Annotate and aggregate: Post.objects.annotate(comment_count=Count("comments")).filter(comment_count__gt=5). This adds a computed field to each queryset row — no Python loop needed. aggregate() returns a dict: Post.objects.aggregate(avg_views=Avg("views")).',
        'F() expressions reference column values in SQL: Post.objects.filter(views__gt=F("likes") * 2). This avoids a Python round-trip — the comparison happens in the database. Use F() for atomic updates too: Post.objects.filter(pk=1).update(views=F("views") + 1) is atomic and avoids race conditions.',
      ]
    },
    {
      heading: 'Django REST Framework',
      points: [
        'DRF adds REST API building blocks on top of Django. Serializers validate and convert data: ModelSerializer introspects a Model and auto-generates fields. validate_fieldname() for per-field validation; validate() for cross-field validation. Create/update are handled by serializer.save().',
        'ViewSets group list/create/retrieve/update/destroy into one class. ModelViewSet inherits all five CRUD operations. Override queryset and serializer_class. Router(prefix, viewset) auto-generates the URL patterns: /users/ (list/create) and /users/{pk}/ (retrieve/update/destroy).',
        'Authentication: DRF supports SessionAuthentication (cookie-based), BasicAuthentication (base64), and TokenAuthentication (DRF tokens). For JWT, use djangorestframework-simplejwt. Authentication backends are listed in DEFAULT_AUTHENTICATION_CLASSES in REST_FRAMEWORK settings.',
        'Permissions: IsAuthenticated, IsAdminUser, AllowAny are built-in. Custom: class IsOwner(BasePermission): def has_object_permission(self, request, view, obj): return obj.owner == request.user. Apply per-view: permission_classes = [IsAuthenticated, IsOwner]. Throttle with DEFAULT_THROTTLE_RATES for rate limiting.',
      ]
    },
    {
      heading: 'Migrations, Signals, and Performance',
      points: [
        'makemigrations auto-generates migration files from model changes. migrate applies them to the DB. Squashmigrations compresses many migrations into one. Check --plan to preview. In production: always run migrate in a deployment step, after backing up the database. Use atomic=True (default) to run migrations in a transaction.',
        'Signals allow decoupled actions on model events. post_save.connect(send_welcome_email, sender=User) runs send_welcome_email after a User is saved. Signals are synchronous and run in the same transaction. Overuse leads to spaghetti code — prefer explicit calls in views or service layer for complex business logic.',
        'Caching: Django cache framework wraps memcached/Redis. @cache_page(60 * 15) caches a view for 15 minutes. cache.set(key, value, timeout) / cache.get(key) for low-level caching. cache.get_or_set(key, callable, timeout) is the atomic read-or-compute pattern.',
        'Database optimisation: only fetch needed columns with .values() or .values_list(); add DB indexes on frequently-filtered fields (db_index=True on the model field or Meta.indexes); use .iterator() for large querysets to avoid loading all rows into memory. Use django-debug-toolbar to profile queries in development.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Models & ORM',
      language: 'typescript',
      code: `from django.db import models
from django.contrib.auth.models import User
from django.db.models import Count, Avg, F, Q

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "categories"

class Post(models.Model):
    title   = models.CharField(max_length=200, db_index=True)
    content = models.TextField()
    author  = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="posts")
    views   = models.PositiveIntegerField(default=0)
    likes   = models.PositiveIntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["-created"])]
        ordering = ["-created"]

# --- Queryset examples ---

# N+1 FIX: select_related for FK/OneToOne
posts = Post.objects.select_related("author", "category")

# N+1 FIX: prefetch_related for reverse FK / M2M
posts_with_comments = Post.objects.prefetch_related("comments")

# Annotate + filter
popular = Post.objects.annotate(
    comment_count=Count("comments")
).filter(comment_count__gt=5).order_by("-comment_count")

# F() — DB-level comparison and atomic update
trending = Post.objects.filter(views__gt=F("likes") * 2)
Post.objects.filter(pk=1).update(views=F("views") + 1)  # atomic!

# Q() — complex OR/AND queries
qs = Post.objects.filter(
    Q(title__icontains="python") | Q(content__icontains="asyncio"),
    author__username="alice"
)

# aggregate — returns dict, not queryset
stats = Post.objects.aggregate(
    total=Count("id"), avg_views=Avg("views")
)  # {"total": 42, "avg_views": 1053.7}

# values() — dicts instead of model instances (lighter)
Post.objects.values("id", "title").order_by("-created")[:10]`
    },
    {
      label: 'DRF ViewSet & Serializer',
      language: 'typescript',
      code: `from rest_framework import serializers, viewsets, permissions, routers, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Post

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)
    comment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Post
        fields = ["id", "title", "content", "author_name", "views", "created", "comment_count"]
        read_only_fields = ["views", "created"]

    def validate_title(self, value: str) -> str:
        if len(value) < 5:
            raise serializers.ValidationError("Title must be at least 5 characters")
        return value.strip()

    def create(self, validated_data: dict) -> Post:
        # inject request user as author
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "content"]
    ordering_fields = ["created", "views"]

    def get_queryset(self):
        from django.db.models import Count
        return Post.objects.select_related("author").annotate(
            comment_count=Count("comments")
        ).order_by("-created")

    @action(detail=True, methods=["post"], url_path="like")
    def like(self, request, pk=None):
        """POST /posts/{pk}/like/ — increment likes"""
        post = self.get_object()
        from django.db.models import F
        Post.objects.filter(pk=post.pk).update(likes=F("likes") + 1)
        post.refresh_from_db()
        return Response({"likes": post.likes})

# Wire to URLs
router = routers.DefaultRouter()
router.register(r"posts", PostViewSet, basename="post")

# urls.py:
# from .views import router
# urlpatterns = [path("api/", include(router.urls))]`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'N+1 queries: accessing FK in a loop without select_related',
      wrong: `posts = Post.objects.all()   # 1 query
for post in posts:
    print(post.author.name)   # N additional queries — 1 per post!`,
      right: `posts = Post.objects.select_related("author")   # 1 JOIN query
for post in posts:
    print(post.author.name)   # no extra queries`,
      explanation: 'Accessing a ForeignKey attribute (post.author) on a queryset not prefetched causes a separate DB query per object. For 100 posts, this is 101 queries. select_related() generates a single JOIN. For ManyToMany or reverse ForeignKey relations, use prefetch_related() which does 2 queries total regardless of result size.'
    },
    {
      title: 'Using non-atomic counter update (race condition)',
      wrong: `post = Post.objects.get(pk=1)
post.views = post.views + 1   # reads then writes — race condition!
post.save()`,
      right: `from django.db.models import F
Post.objects.filter(pk=1).update(views=F("views") + 1)   # atomic in DB`,
      explanation: 'The read-then-write pattern has a race condition: two concurrent requests both read views=100, both compute 101, both save — the view count ends at 101 instead of 102. F("views") + 1 generates "SET views = views + 1" SQL, which is atomic at the database level.'
    },
    {
      title: 'Querying in a loop instead of using annotate/aggregate',
      wrong: `posts = Post.objects.all()
for post in posts:
    comment_count = post.comments.count()   # N queries!
    print(f"{post.title}: {comment_count}")`,
      right: `from django.db.models import Count
posts = Post.objects.annotate(comment_count=Count("comments"))
for post in posts:
    print(f"{post.title}: {post.comment_count}")   # 1 query total`,
      explanation: 'Calling queryset.count() inside a loop generates one query per iteration. annotate(comment_count=Count("comments")) adds the count as a SQL subquery, computing all counts in one database round-trip. The result is available as post.comment_count on each instance.'
    },
    {
      title: 'Returning model instances directly from API views without serializer',
      wrong: `from django.http import JsonResponse
def user_view(request, pk):
    user = User.objects.get(pk=pk)
    return JsonResponse(user.__dict__)   # includes password_hash, _state, etc.!`,
      right: `from rest_framework.response import Response
class UserView(APIView):
    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserSerializer(user)
        return Response(serializer.data)`,
      explanation: 'user.__dict__ includes Django internal fields (_state, _deferred_fields) and sensitive fields (password, is_superuser). Serializers explicitly declare which fields to expose and can transform values (e.g. read_only=True on password). Always serialise with an explicit serializer in DRF.'
    },
  ];

  challenge: Challenge = {
    title: 'Blog API with DRF',
    language: 'typescript',
    description: 'Build a Django/DRF mini-blog: (1) Post model with title, content, author (FK to User), created_at, views (int). (2) PostSerializer with ModelSerializer — include author_name (read_only), exclude password. (3) PostViewSet with list (authenticated users), create (authenticated, auto-sets author), retrieve (anyone), update/destroy (owner only). (4) Custom permission IsOwnerOrReadOnly.',
    hints: [
      'ModelSerializer: source="author.username" for author_name',
      'override get_queryset() to use select_related("author")',
      'IsOwnerOrReadOnly: SAFE_METHODS pass; others check obj.author == request.user',
    ],
    starterCode: `from rest_framework import serializers, viewsets, permissions
from rest_framework.response import Response
from django.contrib.auth.models import User
# assume Post model exists with title, content, author FK, created_at, views

class IsOwnerOrReadOnly(permissions.BasePermission):
    pass

class PostSerializer(serializers.ModelSerializer):
    pass

class PostViewSet(viewsets.ModelViewSet):
    pass`,
    solution: `from rest_framework import serializers, viewsets, permissions
from rest_framework.response import Response
from django.db.models import F
from .models import Post

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Post
        fields = ["id", "title", "content", "author_name", "created_at", "views"]
        read_only_fields = ["views", "created_at"]

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        return Post.objects.select_related("author").order_by("-created_at")

    def retrieve(self, request, *args, **kwargs):
        Post.objects.filter(pk=kwargs["pk"]).update(views=F("views") + 1)
        return super().retrieve(request, *args, **kwargs)`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the N+1 query problem and how do you fix it?', options: ['Using N+1 database connections', 'Generating 1 query for a list + N queries for related data; fixed with select_related or prefetch_related', 'Using N+1 Django apps', 'Having 1 model with N+1 fields'], answer: 1, explanation: 'N+1 occurs when you query a list (1 query) and then access a related FK field on each item in a Python loop (N queries). Fix: select_related("fk_field") for ForeignKey/OneToOne (generates a SQL JOIN), or prefetch_related("reverse_fk") for reverse FK/ManyToMany (2 queries total). Both are methods on QuerySet.' },
    { q: 'What does F() do in Django ORM?', options: ['Format a query result', 'Reference a column value in SQL, enabling atomic updates and DB-level comparisons', 'Create a foreign key field', 'Filter querysets by function'], answer: 1, explanation: 'F("field") creates a reference to a database column, not a Python value. Post.objects.filter(views__gt=F("likes")) generates SQL WHERE views > likes — no Python round-trip. Post.objects.update(views=F("views")+1) generates SQL SET views = views + 1 — atomic, avoiding race conditions from read-then-write.' },
    { q: 'What is the difference between a ViewSet and an APIView in DRF?', options: ['They are identical', 'ViewSet groups multiple CRUD actions into one class; APIView handles one action per method', 'APIView supports JSON; ViewSet supports XML', 'ViewSet is for read-only; APIView for write'], answer: 1, explanation: 'APIView is one class per endpoint with explicit get(), post(), etc. methods — like a standard Django class-based view. ViewSet groups all CRUD operations (list, create, retrieve, update, destroy) into one class and relies on a Router to generate the URL patterns. Use ViewSet + Router for standard CRUD APIs; use APIView for non-standard endpoints.' },
    { q: 'Why use select_related instead of prefetch_related for a ForeignKey?', options: ['select_related is always faster', 'select_related generates a SQL JOIN (1 query); prefetch_related generates 2 queries and is for M2M/reverse FK', 'prefetch_related cannot be used with ForeignKey', 'They produce identical SQL'], answer: 1, explanation: 'select_related generates a SQL JOIN — best for FK/OneToOne where you always need the related object and the data is small. prefetch_related generates 2 separate queries and batches the results in Python — best for ManyToMany or reverse FK where the related set can be large. Using select_related on M2M would generate duplicated rows (one per M2M item).' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between Django ORM and SQLAlchemy?', a: 'Django ORM is tightly integrated with Django: models are Python classes, migrations are auto-generated, and it works within Django\'s app/project structure. It is "Active Record" style — model instances know how to save themselves. SQLAlchemy is standalone and uses a "Data Mapper" pattern — models are separate from the DB session. SQLAlchemy is more flexible for complex queries, supports async natively (sqlalchemy.ext.asyncio), and works outside Django. For Django apps, use Django ORM; for standalone services or FastAPI, SQLAlchemy is the standard choice.' },
    { q: 'How do Django signals work and when should you avoid them?', a: 'Signals (post_save, pre_delete, m2m_changed) allow decoupled code to react to model events. They are synchronous and run in the same transaction as the triggering operation. Avoid signals when: the relationship is not decoupled (same module); the signal has side effects that must succeed or fail atomically; or you need the call order to be predictable (signals fire in connection order). Prefer explicit service calls in views or managers for business logic that is tightly coupled to the save operation.' },
    { q: 'How do you add pagination to a DRF API?', a: 'Set DEFAULT_PAGINATION_CLASS and PAGE_SIZE in REST_FRAMEWORK settings: {"DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination", "PAGE_SIZE": 20}. This applies globally. For per-view pagination, set pagination_class on the ViewSet. The paginator wraps the queryset and returns {"count": N, "next": URL, "previous": URL, "results": [...]}. Use CursorPagination for large datasets — it uses an opaque cursor instead of page numbers, which is more efficient and consistent for real-time feeds.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Django ORM uses lazy querysets; fix N+1 with select_related/prefetch_related; use F() for atomic updates; DRF ViewSets + Routers generate RESTful CRUD APIs automatically.',
    mustKnow: [
      'Querysets are lazy — evaluated on iteration, len, bool, or index access.',
      'N+1: select_related (JOIN) for FK; prefetch_related (2 queries) for M2M/reverse FK.',
      'F("field") enables DB-level atomicity: update(views=F("views")+1) avoids race conditions.',
      'DRF ModelSerializer auto-generates fields from Model. Override validate_field() for validation.',
      'ViewSet + Router generates all CRUD URLs automatically.',
      'IsAuthenticatedOrReadOnly + has_object_permission for owner-only updates.',
    ],
    interviewFocus: [
      'What is the N+1 problem and how do you fix it in Django?',
      'Why is F("views") + 1 safer than post.views + 1?',
      'Explain select_related vs prefetch_related.',
    ]
  };
}
