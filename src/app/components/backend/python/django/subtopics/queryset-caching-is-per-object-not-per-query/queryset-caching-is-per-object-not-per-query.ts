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
  templateUrl: './queryset-caching-is-per-object-not-per-query.html',
  styleUrl: './queryset-caching-is-per-object-not-per-query.scss'
})
export class QuerysetCachingIsPerObjectNotPerQuerySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A QuerySet caches its results — but only that specific QuerySet object',
      points: [
        'The main page\'s own theory says querysets are "lazy — no SQL is executed until the queryset is evaluated" — true, but it leaves out what happens AFTER evaluation. Django\'s own docs describe a second mechanism: "The first time a QuerySet is evaluated... Django saves the query results in the QuerySet\'s cache." Iterating that SAME queryset object a second time reuses the cache instead of hitting the database again.',
        'The word "cache" here means a cache belonging to that one Python object, not a query-level or model-level cache Django tracks globally. Django\'s own docs state this explicitly: "Each time you refine a QuerySet, you get a brand-new QuerySet that is in no way bound to the previous QuerySet. Each refinement creates a separate and distinct QuerySet." Two separately-constructed querysets — even from the exact same filter() call with identical arguments — are two different objects with two independent, initially-empty caches.',
        'This means the caching benefit only exists across multiple USES of the same variable, not across multiple CONSTRUCTIONS of an equivalent queryset. posts = Post.objects.filter(...) followed by two separate for p in posts: loops hits the database once. But calling Post.objects.filter(...) fresh a second time, even with identical filter arguments, always executes a brand-new query — there is no cross-call memoization at all.',
      ]
    },
    {
      heading: 'The slicing gotcha — evaluated vs. unevaluated changes what a slice actually does',
      points: [
        'Django\'s own docs draw a precise, testable line: "When evaluating only part of the queryset, the cache is checked, but if it is not populated then the items returned by the subsequent query are not cached" — meaning posts[0:5] on a queryset that has never been fully evaluated generates a fresh SQL query with LIMIT/OFFSET, and does NOT populate (or read from) the full-result cache at all.',
        'But: "if the entire queryset has already been evaluated, the cache will be checked instead" of hitting the database — the exact same posts[0:5] expression, written after something like list(posts) has already run once, reuses the in-memory Python list instead of generating any SQL at all. The identical line of code does genuinely different things depending purely on whether the queryset object it is called on has already been fully evaluated.',
        'One documented exception worth knowing: "simply printing the queryset will not populate the cache" — Django\'s own __repr__() only evaluates a small slice for display purposes, so debugging with print(queryset) or viewing it in a Python shell does not have the side effect of caching the full result set the way list(queryset) or a for loop does.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Same variable, two loops — one query. Two calls — two queries.',
      language: 'typescript',
      code: `from django.db import connection, reset_queries
from .models import Post

def demonstrate_same_object_caching():
    reset_queries()
    posts = Post.objects.filter(views__gt=100)   # NOT executed yet — lazy

    for p in posts:
        pass   # first iteration: executes 1 query, populates the cache

    for p in posts:
        pass   # second iteration of the SAME 'posts' object:
               # reuses the cache — NO new query

    print(len(connection.queries))   # 1 — only ever hit the DB once


def demonstrate_fresh_call_no_caching():
    reset_queries()

    for p in Post.objects.filter(views__gt=100):
        pass   # constructs a brand-new QuerySet, executes 1 query

    for p in Post.objects.filter(views__gt=100):
        pass   # constructs ANOTHER brand-new QuerySet — identical
               # filter arguments, but a totally separate object with
               # its own empty cache — executes a SECOND query

    print(len(connection.queries))   # 2 — same logical filter, but
                                       # two genuinely separate queries,
                                       # because these are two different
                                       # QuerySet objects, not one reused`,
    },
    {
      label: 'The slicing gotcha: evaluated vs. unevaluated changes the SQL',
      language: 'typescript',
      code: `from django.db import connection, reset_queries
from .models import Post

def slicing_before_evaluation():
    reset_queries()
    posts = Post.objects.all()          # unevaluated — cache empty

    first_five = posts[0:5]              # generates SQL with LIMIT 5
                                           # OFFSET 0 — does NOT touch
                                           # or populate the full cache

    print(len(connection.queries))       # 1 (the LIMIT/OFFSET query)


def slicing_after_evaluation():
    reset_queries()
    posts = Post.objects.all()
    all_posts = list(posts)              # forces full evaluation —
                                           # populates posts' cache with
                                           # every row, 1 query

    first_five = posts[0:5]              # posts is now fully evaluated
                                           # — this slice is served from
                                           # the in-memory Python list,
                                           # NO new SQL query at all

    print(len(connection.queries))       # still 1 — the slice was free`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A Django view builds a queryset once — active_users = User.objects.filter(is_active=True) — then passes active_users to the template context twice: once as {"active_users": active_users, "count": active_users.count()}. Django Debug Toolbar shows TWO separate SQL queries for this one view, even though only one queryset variable was ever created. Explain exactly which operation causes the second query, using what this subtopic covers.',
    hint: 'Does calling .count() on a queryset evaluate it the same way iterating it does, or is .count() a genuinely different kind of query? Does the main "active_users" queryset\'s own cache (if any) get used by a separate .count() call on that same object?',
    solution: 'The second query comes from .count() specifically — it is not the same kind of evaluation as iterating the queryset, and it does not read from (or populate) the queryset\'s own result cache the way list()/iteration/bool() do. Per Django\'s own documented caching mechanics, the cache is only checked and populated by full evaluation operations like iteration, list(), or bool() — .count() instead generates its own separate SQL query using SQL COUNT(*), specifically because computing a count in the database is far cheaper than fetching every row into Python just to call len() on the resulting list. Since active_users.count() is called as a SEPARATE operation from whatever eventually iterates active_users in the template (Django templates iterate a queryset passed into context to render {% for user in active_users %}), and .count() does not share a cache with a full iteration, this view genuinely executes two independent queries: one COUNT(*) query for the count key, and one SELECT ... query when the template actually iterates active_users to render the list. If the count were instead computed as len(active_users) AFTER active_users had already been fully evaluated once (e.g. by first converting it to a list, or after the template has already iterated it), Django would serve the length from the already-populated Python-side cache instead of issuing a second COUNT(*) query — but that is a different code path from calling .count() directly, which always issues its own query regardless of whether the queryset has already been evaluated elsewhere.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Calling Post.objects.filter(views__gt=100) twice with identical arguments in the same request benefits from Django\'s queryset caching the second time, since it is "the same query."',
      reality: 'This subtopic\'s theory and first code example show the opposite — each call to filter() constructs a brand-new QuerySet object with its own independent, empty cache. Django\'s own docs state each refinement "creates a separate and distinct QuerySet" — caching only helps when the SAME queryset variable/object is reused and re-evaluated, never across separately-constructed equivalent queries.'
    },
    {
      thought: 'Slicing a queryset, like posts[0:5], always generates the same kind of SQL query (a LIMIT/OFFSET query) regardless of whether the queryset has been used before.',
      reality: 'This subtopic\'s theory and second code example show the identical slicing expression behaves differently depending on evaluation state — on an unevaluated queryset it generates a fresh LIMIT/OFFSET SQL query, but on an already-fully-evaluated queryset (e.g. after list(queryset) ran once) the same slice is served entirely from the in-memory Python-side cache with no SQL query at all.'
    },
    {
      thought: 'Since Django caches queryset results after evaluation, simply printing a queryset for debugging (print(queryset) or viewing it in a shell) has the useful side effect of pre-warming that queryset\'s cache for later use.',
      reality: 'This subtopic\'s theory shows Django\'s own docs explicitly call this out as NOT true — "simply printing the queryset will not populate the cache," since __repr__() only evaluates a small slice of the queryset for display, not the entire result set, so a later full iteration of that same queryset still triggers its own separate database query.'
    }
  ];
}
