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
  selector: 'app-python-celery',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './celery.html',
  styleUrl: './celery.scss'
})
export class PythonCelery {
  readingTime = 22; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'Celery 5.x+';
  route = 'py-celery'; nextRoute = '/python/numpy-pandas'; nextLabel = 'NumPy & Pandas';

  quickRef: QuickRefItem[] = [
    { name: '@app.task(bind=True)', type: 'decorator', desc: 'Defines a task. bind=True passes self (task instance) as first arg — needed for self.retry().' },
    { name: 'task.delay(*args)', type: 'method', desc: 'Shorthand for .apply_async(args=args). Returns AsyncResult. Non-blocking — dispatches to broker.' },
    { name: 'task.apply_async(args, eta, countdown)', type: 'method', desc: 'Full dispatch. countdown=30 = run in 30s. eta=datetime for exact time. retry_policy for retries.' },
    { name: 'self.retry(exc, countdown)', type: 'method', desc: 'Retry the task. countdown=2**self.request.retries for exponential backoff. max_retries on decorator.' },
    { name: 'chord(group | callback)', type: 'function', desc: 'Run a group in parallel; when all complete, run callback with results. Requires result backend.' },
    { name: 'group(task.s() | ...)', type: 'function', desc: 'Run multiple tasks in parallel. .get() waits for all results.' },
    { name: 'chain(t1.s() | t2.s())', type: 'function', desc: 'Run tasks sequentially — output of t1 is first arg of t2. | operator is syntactic sugar.' },
    { name: 'celery beat', type: 'keyword', desc: 'Periodic task scheduler. beat_schedule in config. celery -A app beat. Sends tasks to workers on schedule.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Celery Architecture — Broker, Worker, Backend',
      points: [
        'Celery has three components: (1) Producer: your web app calls task.delay(args) which serialises the task and sends it to the broker. (2) Broker: a message queue (Redis or RabbitMQ) stores tasks and delivers them to workers. (3) Workers: separate processes running celery worker — they consume tasks from the broker, execute them, and optionally store results in the backend.',
        'Broker choice: Redis is the most common (simple setup, good performance). RabbitMQ is more robust (durable queues, dead-letter queues, message acknowledgement). For most applications, Redis is sufficient. Broker URL: redis://localhost:6379/0 or amqp://user:pass@localhost:5672/vhost.',
        'Result backend stores task results: Redis (redis://), Django DB (django-db), or Redis+Sentinel for HA. Without a backend, AsyncResult.get() and chord/chain results are unavailable. If you only need fire-and-forget, you can omit the backend (CELERY_TASK_IGNORE_RESULT = True) for better performance.',
        'Worker concurrency: celery -A myapp worker -c 4 runs 4 concurrent worker processes (or threads with --pool=gevent for I/O-bound tasks). Default pool is prefork (multiprocessing). Each worker process handles one task at a time. Scale workers horizontally for throughput.',
      ]
    },
    {
      heading: 'Tasks — Defining and Dispatching',
      points: [
        '@app.task defines a task. Use bind=True to receive self (the task instance) — required for self.retry(), self.request.id (task ID), and self.request.retries (current retry count). Keep tasks idempotent — they must produce the same result if retried after a partial failure.',
        'task.delay(arg1, arg2) dispatches immediately. task.apply_async(args=[arg1], kwargs={}, countdown=30) dispatches with options: countdown (seconds to wait), eta (specific datetime), expires (task expires after), queue (target queue name), priority.',
        'Retrying: self.retry(exc=e, countdown=2**self.request.retries, max_retries=5) raises Retry exception (not a failure). Exponential backoff prevents thundering herds when a downstream service is down. autoretry_for=(SomeException,) on the decorator auto-retries on specific exceptions without manual self.retry().',
        'Task routing: route tasks to different queues based on task name: CELERY_TASK_ROUTES = {"myapp.tasks.heavy_task": {"queue": "heavy"}}. Run a worker listening to a specific queue: celery -A myapp worker -Q heavy. This allows separate worker pools with different resources for different task types.',
      ]
    },
    {
      heading: 'Workflows — group, chain, chord',
      points: [
        'group([t1.s(), t2.s(), t3.s()]) runs tasks in parallel and returns an AsyncResult for each. group.get() blocks until all complete and returns a list of results. Use with a backend. group is a fanout — use when tasks are independent.',
        'chain(t1.s() | t2.s() | t3.s()) runs tasks sequentially — the return value of t1 is prepended to t2\'s arguments. Useful for pipelines: download → parse → store. The .s() creates a signature (partial task) instead of dispatching immediately.',
        'chord(group, callback) runs the group in parallel, collects all results, and passes them as a list to the callback: chord(group([download.s(url) for url in urls]), aggregate.s())() → aggregate([result1, result2, ...]). Requires a result backend.',
        'Celery Beat: periodic task scheduler. Define schedules in CELERY_BEAT_SCHEDULE: {"run-daily": {"task": "tasks.report", "schedule": crontab(hour=9, minute=0)}}. Run: celery -A myapp beat. Beat sends tasks to workers via the broker — it is NOT the worker itself. Run one beat process per deployment.',
      ]
    },
    {
      heading: 'Production Patterns',
      points: [
        'Task idempotency: tasks can be retried or executed more than once (at-least-once delivery with Redis broker). Design tasks to be safe to run multiple times — use database UPSERT, check if work was already done, or use a unique constraint. Exactly-once is hard; at-least-once + idempotency is the standard approach.',
        'Dead-letter queue: configure max_retries on the task. When all retries are exhausted, the task fails permanently. Use a Flower monitoring dashboard (celery flower) to inspect failed tasks. Or catch the final failure with on_failure callback: def on_failure(self, exc, ...) — log to Sentry, notify on-call.',
        'Database sessions in tasks: do NOT share the same database connection between the web process and Celery workers. Workers are separate processes — create a new DB session at the start of each task and close it in finally. For Django: use database connections normally (Django closes them after each task). For SQLAlchemy: call SessionLocal() per task.',
        'Soft time limit: CELERYD_TASK_SOFT_TIME_LIMIT = 300 raises SoftTimeLimitExceeded inside the task at 300 seconds (catchable for cleanup). CELERYD_TASK_TIME_LIMIT = 360 terminates the worker process if the task exceeds 360 seconds (hard kill). Always set time limits in production to prevent stuck tasks from blocking workers.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tasks & retry',
      language: 'typescript',
      code: `from celery import Celery
from kombu import Queue

app = Celery("myapp", broker="redis://localhost:6379/0",
             backend="redis://localhost:6379/1")

app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    task_track_started=True,
    task_soft_time_limit=300,
    task_time_limit=360,
)

# Basic task
@app.task(name="tasks.send_email")
def send_email(to: str, subject: str, body: str) -> dict:
    # In production: use smtplib, SendGrid, SES, etc.
    print(f"Sending email to {to}: {subject}")
    return {"status": "sent", "to": to}

# Task with retry + exponential backoff
@app.task(bind=True, max_retries=5, default_retry_delay=60)
def process_webhook(self, payload: dict) -> dict:
    try:
        result = call_external_api(payload)
        return result
    except TemporaryError as exc:
        raise self.retry(exc=exc,
                         countdown=2 ** self.request.retries)
    except PermanentError:
        raise   # don't retry — fail immediately

# Auto-retry on specific exceptions
@app.task(autoretry_for=(ConnectionError,), retry_backoff=True,
          retry_backoff_max=600, retry_jitter=True, max_retries=10)
def fetch_remote(url: str) -> str:
    import urllib.request
    return urllib.request.urlopen(url).read().decode()

# Dispatch from web app
result = send_email.delay("user@example.com", "Welcome!", "Hello!")
print(result.id)           # task UUID
result.get(timeout=5)      # block until done (optional)

# Dispatch with options
process_webhook.apply_async(
    args=[{"event": "payment"}],
    countdown=30,         # wait 30 seconds
    expires=3600,         # expire if not started within 1 hour
    queue="webhooks",     # specific queue
)

def call_external_api(payload): return {"ok": True}
class TemporaryError(Exception): pass
class PermanentError(Exception): pass`
    },
    {
      label: 'group, chain, chord & Beat',
      language: 'typescript',
      code: `from celery import group, chain, chord, signature

@app.task
def download(url: str) -> str:
    return f"data from {url}"   # returns content string

@app.task
def process(content: str) -> dict:
    return {"words": len(content.split())}

@app.task
def aggregate(results: list[dict]) -> dict:
    total = sum(r["words"] for r in results)
    return {"total_words": total}

urls = ["https://example.com/1", "https://example.com/2", "https://example.com/3"]

# chain: sequential pipeline — output of download feeds into process
pipeline = chain(download.s(urls[0]) | process.s())
pipeline.apply_async()

# group: parallel dispatch
g = group(download.s(url) for url in urls)
async_results = g()   # dispatches all 3
results = async_results.get(timeout=60)   # blocks: ["data...","data...","data..."]

# chord: parallel + callback
workflow = chord(
    group(download.s(url) for url in urls),   # parallel fanout
    aggregate.s()                              # callback with all results
)
final = workflow()          # dispatches; aggregate runs when all downloads done
print(final.get(timeout=60))  # {"total_words": N}

# Celery Beat — periodic tasks
from celery.schedules import crontab

app.conf.beat_schedule = {
    "daily-report": {
        "task": "tasks.send_daily_report",
        "schedule": crontab(hour=9, minute=0),  # 09:00 every day
    },
    "cleanup-every-hour": {
        "task": "tasks.cleanup_old_sessions",
        "schedule": 3600.0,   # every 3600 seconds
    },
}

# Run workers:
# celery -A myapp worker --loglevel=info --concurrency=4
# celery -A myapp beat --loglevel=info
# celery -A myapp flower   # monitoring UI at :5555`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Making tasks non-idempotent',
      wrong: `@app.task
def charge_user(user_id: int, amount: float):
    user.balance -= amount   # retried after a crash = double-charged!
    save(user)`,
      right: `@app.task
def charge_user(user_id: int, amount: float, idempotency_key: str):
    if Payment.objects.filter(idempotency_key=idempotency_key).exists():
        return {"status": "already_charged"}  # safe to retry
    Payment.objects.create(user_id=user_id, amount=amount, key=idempotency_key)
    deduct_balance(user_id, amount)
    return {"status": "charged"}`,
      explanation: 'Celery uses at-least-once delivery. If a worker crashes after executing a task but before acknowledging it, the task is retried. Non-idempotent tasks (charging, sending emails, creating records) execute twice. Use idempotency keys stored in the database: check on arrival and no-op if already processed.'
    },
    {
      title: 'Sharing database connections between web app and workers',
      wrong: `# In tasks.py:
from myapp import db   # imports the web app's DB connection
@app.task
def process(item_id):
    item = db.session.get(Item, item_id)   # SQLAlchemy session from web process!`,
      right: `from sqlalchemy.orm import sessionmaker
from myapp.database import engine
TaskSession = sessionmaker(engine)

@app.task
def process(item_id):
    with TaskSession() as session:
        item = session.get(Item, item_id)
        # use item
        session.commit()`,
      explanation: 'Celery workers are separate processes. Importing the web app\'s database session passes a process-local object that cannot be used in a different process. Each Celery task must create its own database session. For Django, django.db connections are managed per-process automatically.'
    },
    {
      title: 'Using .get() in a task (deadlock risk)',
      wrong: `@app.task
def parent_task():
    child = child_task.delay()
    return child.get()   # blocks a worker waiting for another worker — deadlock!`,
      right: `# Use canvas primitives instead:
@app.task
def child_task(data): return data * 2

# At the call site:
workflow = chain(prepare.s() | child_task.s() | finalize.s())
workflow.delay()`,
      explanation: 'Calling result.get() inside a task blocks a worker thread/process waiting for a child task to complete. If all worker slots are occupied by parent tasks waiting for children, no worker is free to run the children — deadlock. Use chain, chord, or callbacks instead of blocking .get() inside tasks.'
    },
    {
      title: 'Not setting time limits in production',
      wrong: `@app.task
def process_file(path):
    import time; time.sleep(9999)   # hangs forever, blocking a worker`,
      right: `@app.task(soft_time_limit=120, time_limit=180)
def process_file(path):
    try:
        # processing...
        pass
    except SoftTimeLimitExceeded:
        cleanup()
        raise`,
      explanation: 'Without time limits, a hung task occupies a worker indefinitely. soft_time_limit raises SoftTimeLimitExceeded inside the task at the deadline — you can catch it, clean up, and re-raise. time_limit forcibly terminates the worker process. Always set both in production — set soft limit slightly below hard limit to allow graceful cleanup.'
    },
  ];

  challenge: Challenge = {
    title: 'Email Campaign Worker',
    language: 'typescript',
    description: 'Build a Celery task system for an email campaign: (1) send_email(to, subject, body) task with retry on ConnectionError (exponential backoff, max 5 retries). (2) send_campaign(campaign_id, emails) function that uses chord: run send_email in parallel for all emails, then collect_results(results, campaign_id) as the chord callback to mark the campaign as done. (3) A Celery Beat schedule that runs daily_report() every day at 8 AM.',
    hints: [
      'chord(group(send_email.s(to, ...) for to in emails), collect_results.s(campaign_id))',
      'autoretry_for=(ConnectionError,) with retry_backoff=True',
      'crontab(hour=8, minute=0) for 8 AM daily',
    ],
    starterCode: `from celery import Celery, chord, group
from celery.schedules import crontab

app = Celery("campaign", broker="redis://localhost:6379/0",
             backend="redis://localhost:6379/1")

@app.task
def send_email(to: str, subject: str, body: str) -> dict:
    pass

@app.task
def collect_results(results: list[dict], campaign_id: int) -> dict:
    pass

def send_campaign(campaign_id: int, emails: list[str]) -> None:
    pass`,
    solution: `from celery import Celery, chord, group
from celery.schedules import crontab

app = Celery("campaign", broker="redis://localhost:6379/0",
             backend="redis://localhost:6379/1")

@app.task(autoretry_for=(ConnectionError,), retry_backoff=True,
          retry_backoff_max=300, max_retries=5)
def send_email(to: str, subject: str, body: str) -> dict:
    print(f"Sending to {to}")
    # simulate: raise ConnectionError("smtp timeout") for retry demo
    return {"to": to, "status": "sent"}

@app.task
def collect_results(results: list[dict], campaign_id: int) -> dict:
    sent = sum(1 for r in results if r.get("status") == "sent")
    print(f"Campaign {campaign_id}: {sent}/{len(results)} emails sent")
    return {"campaign_id": campaign_id, "sent": sent, "total": len(results)}

def send_campaign(campaign_id: int, emails: list[str]) -> None:
    subject = "Your campaign email"
    body = "Hello from our campaign!"
    workflow = chord(
        group(send_email.s(email, subject, body) for email in emails),
        collect_results.s(campaign_id)
    )
    workflow.delay()

@app.task
def daily_report() -> None:
    print("Sending daily report...")

app.conf.beat_schedule = {
    "daily-report": {"task": "celery_tasks.daily_report",
                     "schedule": crontab(hour=8, minute=0)}
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the difference between task.delay() and task.apply_async()?', options: ['delay() is synchronous; apply_async is async', 'delay() is shorthand for apply_async with positional args only; apply_async supports all options (eta, countdown, queue)', 'apply_async() always uses a different queue', 'delay() blocks until complete'], answer: 1, explanation: 'task.delay(arg1, arg2) is equivalent to task.apply_async(args=[arg1, arg2]) — a convenience shorthand for positional arguments. apply_async gives full control: countdown (seconds to delay), eta (exact datetime), expires (TTL), queue (target queue), priority, link (callback), link_error (error callback). Use delay() for simple dispatch; apply_async() when you need options.' },
    { q: 'What is a chord in Celery?', options: ['A way to run tasks sequentially', 'A primitive that runs a group of tasks in parallel, then runs a callback with all results', 'A Celery Beat schedule type', 'A retry mechanism'], answer: 1, explanation: 'chord(group, callback): the group\'s tasks run in parallel, and when ALL group tasks complete, the callback is invoked with a list of all group results as its first argument. Requires a result backend to store intermediate results. Use for fan-out + aggregation patterns (download all → aggregate totals).' },
    { q: 'Why is task idempotency important in Celery?', options: ['Celery requires idempotent tasks', 'Celery uses at-least-once delivery — a task may be executed more than once; idempotent tasks produce the same result on repetition', 'Idempotent tasks run faster', 'Only for tasks with retries'], answer: 1, explanation: 'Redis broker provides at-least-once delivery: if a worker crashes after executing a task but before acknowledging it, the broker redelivers the task. Non-idempotent operations (charge payment, send email, insert record) would execute twice. Use idempotency keys or check-before-act patterns to make tasks safe to rerun.' },
    { q: 'What is the risk of calling result.get() inside a Celery task?', options: ['It causes a ValueError', 'It can cause deadlock if all worker slots are occupied by parent tasks waiting for child tasks', 'It prevents task retries', 'result.get() is not available inside tasks'], answer: 1, explanation: 'A task calling result.get() blocks a worker thread/process waiting for another task. If the worker pool is full (all slots occupied by tasks calling .get()), and the child tasks are waiting for a free slot, no task can proceed — deadlock. Use chain, chord, or link callbacks instead of blocking .get() inside tasks.' },
  ];

  qna: QnaItem[] = [
    { q: 'How do you monitor Celery workers in production?', a: 'Flower (pip install flower) is the standard Celery monitoring web UI: celery -A myapp flower starts it on port 5555. It shows active tasks, task history, worker status, queues, and lets you inspect/revoke tasks. For alerting, send failed tasks to Sentry (celery signals: task_failure), or use Celery\'s built-in on_failure callback. For queue length monitoring, use Redis\'s LLEN command on the queue key, or expose Celery metrics via celery-exporter + Prometheus + Grafana.' },
    { q: 'When should you use Celery instead of FastAPI BackgroundTasks?', a: 'FastAPI BackgroundTasks runs in the same process after the response is sent. It is NOT reliable: if the server restarts, tasks are lost. Use Celery when: (1) tasks must survive server restarts; (2) tasks are long-running (> a few seconds); (3) you need retries with exponential backoff; (4) you need to distribute work across multiple machines; (5) you need scheduling (Celery Beat). Use BackgroundTasks only for fire-and-forget low-stakes work (logging, cache invalidation) that is safe to lose.' },
    { q: 'What is the difference between Redis as a Celery broker vs result backend?', a: 'The broker is the message queue: tasks are serialised to JSON and pushed to Redis lists (one per queue). Workers pop tasks from the list. The result backend is where task return values are stored: when a task completes, the result is saved to Redis (as a Redis key with TTL). They can be the same Redis instance (different DB indices or key namespaces) or different instances. For high load, use RabbitMQ as the broker (more robust, durable queues, better routing) and Redis for results (fast key-value lookup).' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Celery distributes tasks via a broker (Redis/RabbitMQ) to workers; use group/chain/chord for workflows; design tasks to be idempotent; set time limits and monitor with Flower.',
    mustKnow: [
      'Producer → Broker (Redis/RabbitMQ) → Worker; result backend for .get().',
      'task.delay() = shorthand; apply_async() = full options (countdown, eta, queue).',
      'self.retry(exc, countdown=2**retries) for exponential backoff.',
      'chord(group, callback): parallel fanout + aggregation. Requires backend.',
      'Tasks must be idempotent — at-least-once delivery means tasks can repeat.',
      'Never call result.get() inside a task — deadlock risk.',
    ],
    interviewFocus: [
      'Explain the Celery architecture: broker, worker, backend.',
      'Why must Celery tasks be idempotent?',
      'When would you use chord vs chain?',
    ]
  };
}
