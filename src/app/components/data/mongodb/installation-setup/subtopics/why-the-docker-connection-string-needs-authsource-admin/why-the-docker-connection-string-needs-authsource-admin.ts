import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Missing authSource Doesn’t Default to "admin"',
    points: [
      'The main page\'s own "Docker Quick-start" section gave a connecting-from-another-container example — <code>mongodb://admin:secret@mongo:27017/myapp</code> — with no <code>authSource</code> at all. Verified directly against the driver\'s own documented resolution order: if <code>authSource</code> is omitted, the driver does NOT default to <code>admin</code> — it falls back to whatever database is in the connection string\'s own path segment, which here is <code>myapp</code>.',
      'That matters because the admin user in this exact scenario was created in the <code>admin</code> database — the same page\'s own preceding bullet on <code>MONGO_INITDB_ROOT_*</code> says exactly that. A connection string that omits <code>authSource</code> and points at <code>myapp</code> would try to authenticate that user against <code>myapp</code>, where it does not exist, and the connection fails.',
      'The SAME main page already gets this right elsewhere: its own "Docker Compose" codeTab connection string is <code>mongodb://admin:secret@mongo:27017/devhub?authSource=admin</code> — correctly explicit. The theory bullet\'s own separate example was the one place on the page missing it, caught by comparing the page\'s two connection-string examples against each other.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'authSource Resolution, Verified',
    language: 'typescript',
    code: `function resolveAuthSource(uri: string): string {
  // Borrow the URL parser for the pieces we need
  const url = new URL(uri.replace('mongodb://', 'http://'));
  const explicit = url.searchParams.get('authSource');
  if (explicit) return explicit;

  const pathDb = url.pathname.replace(/^\\//, '');
  if (pathDb) return pathDb;

  return 'admin'; // only reached if NEITHER authSource NOR a path db is given
}

const cases = [
  'mongodb://admin:secret@mongo:27017/myapp',                   // the original theory bullet's example
  'mongodb://admin:secret@mongo:27017/myapp?authSource=admin',  // the fixed version
  'mongodb://admin:secret@mongo:27017',                          // no path db at all
];

for (const c of cases) {
  console.log(c, '->', resolveAuthSource(c));
}
// -> mongodb://admin:secret@mongo:27017/myapp -> myapp  (WRONG -- admin user isn't here)
// -> mongodb://admin:secret@mongo:27017/myapp?authSource=admin -> admin  (correct)
// -> mongodb://admin:secret@mongo:27017 -> admin  (falls all the way back to admin)`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A connection string is <code>mongodb://admin:secret@mongo:27017</code> — no path database at all, and no <code>authSource</code> either. What does <code>authSource</code> resolve to, and would this connection successfully authenticate the admin user created via MONGO_INITDB_ROOT_*?',
  hint: 'Trace resolveAuthSource() through both of its fallback steps in order: is there an explicit authSource? Is there a path database? What’s left once both are empty?',
  solution: `// authSource resolves to 'admin' -- the final fallback, reached only
// because BOTH the explicit authSource AND the path database are missing.
//
// Yes, this connection WOULD successfully authenticate -- purely by
// coincidence of having no path database at all, the resolution falls
// all the way through to the same 'admin' database the user actually
// lives in. This is exactly why the original theory bullet's broken
// example is easy to miss in testing: a connection string with NO
// database path at all works fine, and a connection string WITH the
// correct authSource=admin also works fine -- it's specifically the
// middle case (a path database that ISN'T admin, with no authSource
// override) that silently breaks.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'authSource always defaults to "admin" unless you say otherwise, since that\'s where root/admin users typically live.',
    reality: '"admin" is only the LAST fallback, reached solely when the connection string has no path database at all. If a path database IS present — <code>/myapp</code>, <code>/devhub</code>, whatever the application actually queries — the driver uses THAT as authSource instead, regardless of where the user account itself was actually created. The two things (which database you\'re QUERYING and which database your CREDENTIALS live in) are entirely independent, and the connection string has to state the second one explicitly whenever it differs from the first.',
  },
  {
    thought: 'Since MongoDB rejects the connection either way, a missing authSource produces a clear, obvious error naming the problem.',
    reality: 'The failure is a generic authentication error — MongoDB does not (and cannot) know the developer INTENDED to authenticate against a different database than the one authSource silently resolved to. From the server\'s point of view, it received a username/password pair and checked it against the resolved authSource database, found no match, and rejected it — exactly the same error a genuinely wrong password would produce. Nothing in the error message points at authSource as the actual culprit.',
  },
];

@Component({
  selector: 'app-mongo-install-authsource-fallback',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './why-the-docker-connection-string-needs-authsource-admin.html',
  styleUrl: './why-the-docker-connection-string-needs-authsource-admin.scss',
})
export class WhyTheDockerConnectionStringNeedsAuthsourceAdminSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
