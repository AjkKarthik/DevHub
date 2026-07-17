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
  templateUrl: './transaction-on-commit-defers-signal-side-effects.html',
  styleUrl: './transaction-on-commit-defers-signal-side-effects.scss'
})
export class TransactionOnCommitDefersSignalSideEffectsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A signal fires DURING the transaction, before anyone knows it will commit',
      points: [
        'The main page\'s own theory says signals are "synchronous and run in the same transaction" as the triggering save — true, but it does not spell out the direct consequence: a post_save signal handler runs at the moment .save() is called, which can be well BEFORE the surrounding transaction.atomic() block actually finishes and commits. If that handler has an external side effect (sending an email, calling a payment API, enqueueing a Celery task), that side effect fires immediately — regardless of what happens to the rest of the transaction afterward.',
        'Django\'s own docs describe the fix directly: "Sometimes you need to perform an action related to the current database transaction, but only if the transaction successfully commits... on_commit() allows you to register callbacks" for exactly this situation. And critically: "If the transaction is instead rolled back... the callback will be discarded, and never called" — meaning a side effect wrapped in on_commit() genuinely never fires if the surrounding transaction fails, while the same side effect called directly inside the signal handler already fired the moment the handler ran, with no way to take it back.',
        'This creates a real, observable bug shape: a view does user.save() (triggering a post_save signal that sends a welcome email), then goes on to do more work inside the SAME transaction.atomic() block, and THAT later work raises an exception. The whole transaction rolls back — the user row never actually persists — but the welcome email, having already been sent synchronously from inside the signal handler, was never rolled back with it. The database says the signup never happened; the user\'s inbox says otherwise.',
      ]
    },
    {
      heading: 'on_commit() only matters when there is a transaction actually pending',
      points: [
        'Django\'s own docs are explicit about the boundary case: "If you call on_commit() while there isn\'t an open transaction, the callback will be executed immediately." Wrapping a side effect in on_commit() outside of any atomic() block has no deferred behavior at all — it runs right away, exactly like calling it directly, since there is no pending commit/rollback decision to wait for.',
        'This means on_commit() only changes behavior specifically for code that runs INSIDE an atomic() block (or a request wrapped by Django\'s ATOMIC_REQUESTS setting) — the exact context a post_save signal handler is almost always running in during a typical view that calls .save() inside (or implicitly wrapped by) a transaction. Outside that context, reaching for on_commit() is harmless but has no protective effect to offer.',
        'A related, easy-to-miss testing gotcha from the same docs: Django\'s TestCase wraps each test in its own transaction that gets rolled back after the test finishes, for isolation — and since on_commit() callbacks only fire on a genuine commit, they "will never be run" inside a normal TestCase unless the test explicitly opts in with TestCase.captureOnCommitCallbacks(). Code that correctly uses on_commit() in production can appear to silently do nothing when exercised by an ordinary Django test, which is a source of confusing, hard-to-diagnose test failures (or worse, false test passes that mask a genuinely broken on_commit() callback).',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without on_commit() — the email survives a rollback that should have prevented it',
      language: 'typescript',
      code: `from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Order

@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    if created:
        # BUG: this runs the instant User.save() is called — which
        # can be BEFORE the surrounding transaction actually commits.
        send_email(instance.email, "Welcome!")

def signup_view(request):
    with transaction.atomic():
        user = User.objects.create(email=request.POST["email"])
        # post_save fires HERE, synchronously — send_welcome_email
        # runs and the email is sent RIGHT NOW, mid-transaction.

        order = Order.objects.create(user=user, total=request.POST["total"])
        if order.total <= 0:
            raise ValueError("invalid order total")   # rolls back the
                                                          # WHOLE atomic()
                                                          # block, including
                                                          # the User row —
                                                          # but the welcome
                                                          # email was ALREADY
                                                          # sent and cannot
                                                          # be un-sent.`,
    },
    {
      label: 'With on_commit() — the email only fires if the transaction actually commits',
      language: 'typescript',
      code: `from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Order

@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    if created:
        # THE FIX: defer the side effect until the transaction this
        # signal fired inside of has genuinely, successfully committed.
        transaction.on_commit(lambda: send_email(instance.email, "Welcome!"))
        # If this handler runs OUTSIDE any atomic() block, on_commit()
        # executes the callback immediately — no behavior change there.

def signup_view(request):
    with transaction.atomic():
        user = User.objects.create(email=request.POST["email"])
        # post_save fires HERE — but send_welcome_email only REGISTERS
        # the callback via on_commit(); no email is sent yet.

        order = Order.objects.create(user=user, total=request.POST["total"])
        if order.total <= 0:
            raise ValueError("invalid order total")   # rolls back —
                                                          # the registered
                                                          # on_commit()
                                                          # callback is
                                                          # DISCARDED and
                                                          # never runs, so
                                                          # no welcome email
                                                          # is ever sent for
                                                          # a signup that
                                                          # never actually
                                                          # persisted.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wraps every external side effect in their signal handlers with transaction.on_commit(), as a blanket rule. During a code review, someone points out that one particular handler — a post_save on an AuditLog model that is only ever created from a Celery task, never from inside a request or any transaction.atomic() block — doesn\'t actually need it. Explain, using what this subtopic covers, whether wrapping it in on_commit() there is harmful, harmless-but-pointless, or still necessary, and why.',
    hint: 'What does Django\'s own documented behavior say happens when on_commit() is called with no open transaction pending? Does that change anything observable about when the callback runs, compared to calling it directly?',
    solution: 'Wrapping the AuditLog handler\'s side effect in on_commit() there is harmless but pointless, not harmful and not still necessary in the way it would be inside an actual transaction — per Django\'s own documented behavior, "if you call on_commit() while there isn\'t an open transaction, the callback will be executed immediately." If this particular Celery task never runs inside a transaction.atomic() block (and isn\'t covered by ATOMIC_REQUESTS, which only applies to request/response cycles anyway, not background tasks), there is no pending commit-or-rollback decision for on_commit() to defer against — the callback fires right away, functionally identical to calling the side effect directly without on_commit() at all. The blanket rule isn\'t WRONG to apply here (it costs nothing and correctly protects the handler if the surrounding code ever does end up inside a transaction later, which is a reasonable defensive habit), but the specific claim that it is "necessary" for THIS handler in THIS context is inaccurate — its protective effect (deferring until commit, discarding on rollback) only actually changes anything when the handler runs inside genuinely pending transaction. The team\'s broader habit of using on_commit() by default in signal handlers is generally sound precisely because it is a no-op outside a transaction and a real safeguard inside one — but reviewers should still understand the difference between "this is doing something" and "this happens to be inert here."'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A post_save signal handler with an external side effect (sending an email, calling an API) is automatically protected from firing on a later-rolled-back transaction, since Django knows the signal was triggered "inside" that transaction.',
      reality: 'This subtopic\'s theory and first code example show the opposite — a signal handler\'s code runs synchronously the instant .save() is called, immediately executing any side effect it contains, with no automatic connection to whether the surrounding transaction later commits or rolls back. Only explicitly wrapping the side effect in transaction.on_commit() defers it until the commit genuinely happens.'
    },
    {
      thought: 'Since transaction.on_commit() defers a callback until commit, wrapping every side effect in it everywhere is always strictly safer and changes nothing when there happens to be no active transaction.',
      reality: 'This subtopic\'s theory and exercise show wrapping in on_commit() outside an open transaction is genuinely harmless (Django\'s own docs confirm the callback "will be executed immediately" in that case) — but it is worth recognizing this is a no-op in that context, not a meaningful safeguard, since its actual protective behavior (discarding the callback on rollback) only exists when a transaction is genuinely pending.'
    },
    {
      thought: 'A Django TestCase that calls user.save() and asserts a transaction.on_commit()-wrapped side effect happened (like checking a mock email function was called) will observe that side effect normally, the same way it would in production.',
      reality: 'This subtopic\'s theory shows Django\'s own docs flag this as a real testing gotcha — TestCase wraps each test in its own transaction that is rolled back for isolation after the test finishes, so on_commit() callbacks "will never be run" under a plain TestCase unless the test explicitly opts in with TestCase.captureOnCommitCallbacks(), meaning a naive test can silently fail to exercise the deferred callback at all.'
    }
  ];
}
