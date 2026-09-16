import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-apollo-server-dropped-upload-support',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './apollo-server-dropped-upload-support.html',
  styleUrl: './apollo-server-dropped-upload-support.scss',
})
export class ApolloServerDroppedUploadSupportSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The multipart spec still exists — Apollo Server just stopped shipping it',
      points: [
        'The main page\'s own QnA said "Apollo Server supports it via graphql-upload." That was true for Apollo Server 2. Apollo Server 3 (2021) removed the BUILT-IN multipart-request integration entirely, and Apollo Server 4 never brought it back.',
        'The <code>graphql-multipart-request-spec</code> — a batched JSON operation plus raw file parts in one <code>multipart/form-data</code> request — is a community convention, not part of the official GraphQL specification. It never went away; only Apollo\'s built-in wiring for it did.',
        '<code>graphql-upload</code> still exists as a standalone npm package. You can wire it in manually with <code>graphqlUploadExpress()</code> middleware ahead of your Apollo Server integration — it just is not on by default anymore.',
      ],
    },
    {
      heading: 'Why Apollo pulled it: a CSRF loophole, not a bug',
      points: [
        'Browsers protect against CSRF by restricting which request shapes a cross-origin <code>&lt;form&gt;</code> can send without triggering a CORS preflight. <code>multipart/form-data</code> is one of the historically "simple" content types a form can submit with no preflight at all.',
        'That means a malicious page on another origin can submit a multipart GraphQL mutation to your server using the victim\'s own cookies — the exact CSRF shape ordinary JSON POST requests are protected against, reopened by the multipart content type.',
        'Apollo\'s own current guidance: "We really really don\'t think you should use multipart uploads with GraphQL." The preferred pattern is a signed URL — the client uploads the file straight to S3 (or similar) using a short-lived pre-signed URL your API hands back from an ordinary JSON mutation, and the GraphQL server never touches the file bytes at all.',
        'If a codebase must keep multipart uploads (a legacy client, say), Apollo Server 3.7+ ships explicit CSRF-prevention options that have to be turned on — it is not automatically safe just because <code>graphql-upload</code> is installed.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Old pattern (Apollo Server 2, no longer built in)',
      language: 'typescript',
      code: `# Schema
scalar Upload
type Mutation {
  uploadAvatar(file: Upload!): User!
}

// Resolver -- required Apollo Server's own built-in multipart wiring,
// which does not exist in Apollo Server 3+ without manual setup.
uploadAvatar: async (_, { file }) => {
  const { createReadStream, filename } = await file;
  const stream = createReadStream();
  // ... pipe stream to storage ...
}`,
    },
    {
      label: 'Current recommendation: signed URL',
      language: 'typescript',
      code: `# Schema -- the GraphQL server never sees file bytes
type Mutation {
  requestAvatarUploadUrl(contentType: String!): UploadUrlPayload!
  confirmAvatarUpload(key: String!): User!
}
type UploadUrlPayload { uploadUrl: String!; key: String! }

// Step 1: client asks for a short-lived signed URL (ordinary JSON mutation)
requestAvatarUploadUrl: async (_, { contentType }, { s3 }) => {
  const key = \`avatars/\${crypto.randomUUID()}\`;
  const uploadUrl = await s3.getSignedUrl('putObject', {
    Bucket: 'my-app-uploads', Key: key, ContentType: contentType, Expires: 60,
  });
  return { uploadUrl, key };
}

// Step 2: browser PUTs the file DIRECTLY to S3 using uploadUrl -- no GraphQL involved.

// Step 3: client confirms the upload finished (another ordinary JSON mutation)
confirmAvatarUpload: async (_, { key }, { db, user }) =>
  db.users.update(user.id, { avatarKey: key });`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A codebase still uses <code>graphql-upload</code> with Apollo Server 4, wired in manually. A security review flags it for CSRF. What is the actual attack, and what are the two fixes (one that keeps multipart uploads, one that removes the need for them)?',
    hint: 'What HTTP request shape does a plain cross-origin &lt;form&gt; submit avoid triggering a CORS preflight for?',
    solution: `The attack: multipart/form-data is one of the "simple" content types a plain cross-origin <form> can POST without a CORS preflight. A malicious page on attacker.com can silently submit a multipart GraphQL mutation to your API, and the victim's browser attaches their session cookies automatically -- a CSRF request the server has no way to distinguish from a legitimate one, since no preflight ever asked permission.

Fix 1 (keep multipart): turn on Apollo Server's own CSRF-prevention options (3.7+) explicitly -- they are opt-in, not automatic just because graphql-upload is installed.

Fix 2 (remove the need entirely): switch to the signed-URL pattern -- the client requests a short-lived pre-signed upload URL via an ordinary JSON mutation (which IS protected by normal CSRF defenses, since JSON POST triggers a preflight), then uploads the file directly to S3/cloud storage. The GraphQL server is never in the file's request path at all, so the multipart CSRF surface disappears completely. This is Apollo's own current recommendation.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Apollo Server has built-in file upload support via graphql-upload."',
      reality: 'True for Apollo Server 2 only. Apollo Server 3 (2021) removed the built-in multipart integration, and Apollo Server 4 never restored it. <code>graphql-upload</code> can still be wired in manually as a third-party package.',
    },
    {
      thought: '"The multipart request spec is part of the official GraphQL specification."',
      reality: 'It is a community convention (graphql-multipart-request-spec), not part of the GraphQL spec itself. Apollo dropping built-in support for it is a library decision, not a spec deprecation.',
    },
    {
      thought: '"If I install graphql-upload, my server is automatically safe against CSRF."',
      reality: 'No — multipart requests reopen a CSRF loophole regardless of which library implements them. Apollo Server 3.7+ ships explicit CSRF-prevention options you must turn on yourself.',
    },
  ];

  topicLabel = 'Mutations';
  topicRoute = '/graphql/mutations';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'Serial Execution Is Not a Transaction',
    route: '/graphql/mutations/serial-execution-is-not-a-transaction',
  };
}
