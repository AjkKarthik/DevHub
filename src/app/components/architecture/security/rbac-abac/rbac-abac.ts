import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'RBAC',         type: 'keyword', desc: 'Role-Based Access Control — permissions granted to roles; users assigned to roles.' },
  { name: 'ABAC',         type: 'keyword', desc: 'Attribute-Based Access Control — policies evaluated against subject/resource/environment attributes.' },
  { name: 'Permission',   type: 'keyword', desc: 'A specific allowed action on a resource, e.g. `posts:create`, `invoices:approve`.' },
  { name: 'Policy',       type: 'keyword', desc: 'ABAC rule: "user.department === resource.department && resource.status === \'draft\'".' },
  { name: 'PBAC',         type: 'keyword', desc: 'Permission-Based Access Control — direct permission assignment, no role intermediary.' },
  { name: 'Least Privilege', type: 'keyword', desc: 'Grant only the minimum permissions required — reduce blast radius of compromise.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'RBAC — Role-Based Access Control',
    points: [
      'Users are assigned to roles (admin, editor, viewer). Roles define what permissions they grant (create, read, update, delete on specific resources).',
      'Authorization check: "Does the user have a role that includes this permission?" — typically a set lookup: `user.roles.some(r => ROLE_PERMISSIONS[r].includes(permission))`.',
      'Pros: simple to reason about, easy to audit ("who has admin?"), low overhead, widely understood.',
      'Cons: role explosion — as requirements grow, roles proliferate (editor-us, editor-eu, editor-finance…). Hard to express row-level or context-dependent rules.',
      'Works best for: simple permission structures with a stable set of user types (admin/member/viewer).',
    ],
  },
  {
    heading: 'ABAC — Attribute-Based Access Control',
    points: [
      'Policies evaluate attributes of four entities: Subject (user — department, clearance), Resource (document — owner, classification), Action (read/write), Environment (time of day, IP location).',
      'Example policy: "A user may edit a document if user.department === document.department AND document.status === \'draft\'".',
      'Pros: fine-grained, context-aware, avoids role explosion. Can express "you can only access your own team\'s records".',
      'Cons: complex to reason about and audit. Performance overhead for policy evaluation. Harder to implement correctly.',
      'Works best for: multi-tenant systems, regulated industries (healthcare, finance), row-level security, or any system where "who can do what" depends on data attributes.',
    ],
  },
  {
    heading: 'ReBAC — Relationship-Based Access Control',
    points: [
      'Authorization is derived from relationships in a graph: "User A is a member of Group B which is an editor of Document C".',
      'Google Zanzibar (Google Docs, Drive) is the canonical example. Open-source implementations: OpenFGA, SpiceDB.',
      'Naturally expresses hierarchical and delegated permissions: "If you own a folder, you can access all documents in it".',
      'Increasingly popular for complex multi-tenant SaaS products where sharing and delegation are core features.',
    ],
  },
  {
    heading: 'Practical Patterns',
    points: [
      'Separate authentication from authorization: auth verifies identity; authz checks permissions. Keep them in separate services/layers.',
      'Centralize policy enforcement at the API gateway or middleware — avoid scattered `if (user.role === "admin")` checks throughout business logic.',
      'Externalize authorization: authorization logic evolves faster than business logic. Libraries (Casbin, CASL) or services (OPA, OpenFGA) keep policy separate from code.',
      'Audit log every authorization decision — who accessed what, when, and why it was allowed or denied.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'RBAC Implementation',
    language: 'typescript',
    code: `// ── Define roles and their permissions ───────────────────────────────────────
type Permission = 'posts:read' | 'posts:create' | 'posts:update' | 'posts:delete'
  | 'users:read' | 'users:manage' | 'analytics:read';

type Role = 'admin' | 'editor' | 'viewer';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin:  ['posts:read', 'posts:create', 'posts:update', 'posts:delete', 'users:read', 'users:manage', 'analytics:read'],
  editor: ['posts:read', 'posts:create', 'posts:update'],
  viewer: ['posts:read'],
};

// ── Authorization check ───────────────────────────────────────────────────────
function hasPermission(userRoles: Role[], permission: Permission): boolean {
  return userRoles.some(role => ROLE_PERMISSIONS[role]?.includes(permission) ?? false);
}

// ── Express middleware ────────────────────────────────────────────────────────
function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!hasPermission(user.roles, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Usage
app.post('/api/posts',   requireAuth, requirePermission('posts:create'), createPost);
app.delete('/api/posts/:id', requireAuth, requirePermission('posts:delete'), deletePost);
app.get('/api/analytics', requireAuth, requirePermission('analytics:read'), getAnalytics);`,
  },
  {
    label: 'ABAC with CASL',
    language: 'typescript',
    code: `import { AbilityBuilder, createMongoAbility } from '@casl/ability';

// ── Define abilities based on user attributes ─────────────────────────────────
function defineAbilitiesFor(user: { id: string; role: string; department: string }) {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  if (user.role === 'admin') {
    can('manage', 'all'); // admin can do everything
  } else if (user.role === 'editor') {
    can('read', 'Post');
    can('create', 'Post');
    // Can only update/delete their OWN posts
    can('update', 'Post', { authorId: user.id });
    can('delete', 'Post', { authorId: user.id });
    // Can only read documents from their department
    can('read', 'Document', { department: user.department });
    cannot('read', 'Document', { classification: 'confidential' });
  } else {
    can('read', 'Post');
  }

  return build();
}

// ── Check permission at runtime ───────────────────────────────────────────────
app.put('/api/posts/:id', requireAuth, async (req, res) => {
  const post = await db.posts.findById(req.params.id);
  const ability = defineAbilitiesFor(req.user);

  if (ability.cannot('update', post)) {
    return res.status(403).json({ error: 'Cannot update this post' });
  }

  const updated = await db.posts.update(req.params.id, req.body);
  res.json(updated);
});`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Checking role names in business logic instead of permissions',
    wrong: `if (user.role === 'admin') { deleteUser(targetId); }`,
    right: `if (hasPermission(user.roles, 'users:delete')) { deleteUser(targetId); }`,
    explanation: 'Checking role names couples business logic to your role taxonomy — changing a role name or splitting a role requires touching every check. Permission checks are stable: roles change but the action "delete users" does not.',
  },
  {
    title: 'Not checking ownership on row-level operations',
    wrong: `// Any authenticated editor can update any post
app.put('/api/posts/:id', requireAuth, requirePermission('posts:update'), updatePost);`,
    right: `app.put('/api/posts/:id', requireAuth, requirePermission('posts:update'), async (req, res) => {
  const post = await db.posts.findById(req.params.id);
  // Row-level check: verify ownership
  if (post.authorId !== req.user.id && !req.user.roles.includes('admin')) {
    return res.status(403).json({ error: 'Cannot update others\\'s posts' });
  }
  // proceed
});`,
    explanation: 'RBAC permissions like "posts:update" grant category-level access but not row-level access. Always check ownership or relationship when the operation is on a specific resource the user should only access if they own or are assigned to it.',
  },
  {
    title: 'Storing authorization logic in the frontend only',
    wrong: `// Angular — hide button if not admin (UI only, no backend check)
@if(user.role === 'admin') { <button (click)="deleteUser()">Delete</button> }`,
    right: `// Frontend hides UI; backend ALWAYS re-checks permission
// API: requirePermission('users:delete') middleware on the delete endpoint`,
    explanation: 'Frontend authorization is UX, not security. A user can call your API directly, bypassing the UI. Always enforce authorization server-side, on every API call.',
  },
  {
    title: 'Granting "admin" to too many users for convenience',
    wrong: `// Quick fix: give user admin role to unblock them
await db.users.updateRole(userId, 'admin');`,
    right: `// Audit what permission they actually need; create a scoped role
await db.users.addRole(userId, 'billing-manager'); // can only access billing`,
    explanation: 'The principle of least privilege: grant the minimum permissions needed. Admin roles grant everything — a compromised admin account or malicious admin causes maximum damage. Create scoped roles for specific use cases.',
  },
];

const challenge: Challenge = {
  title: 'Permission Checker',
  language: 'typescript',
  description: `Implement a simple RBAC system:
- ROLE_PERMISSIONS maps roles to permissions
- hasPermission(roles: string[], permission: string): boolean returns true if any role has the permission
- canUserDo(user: { id: string; roles: string[] }, resource: { ownerId: string }, permission: string): boolean
  - For 'admin' role: always true
  - For 'editor' with 'posts:update': only if user.id === resource.ownerId
  - Otherwise: uses hasPermission`,
  hints: [
    'Check for admin role first',
    'Special case update/delete — require ownership',
    'Fall through to hasPermission for other permissions',
  ],
  starterCode: `const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin:  ['posts:read', 'posts:create', 'posts:update', 'posts:delete', 'users:manage'],
  editor: ['posts:read', 'posts:create', 'posts:update'],
  viewer: ['posts:read'],
};

function hasPermission(roles: string[], permission: string): boolean {
  // TODO
  return false;
}

function canUserDo(user: { id: string; roles: string[] }, resource: { ownerId: string }, permission: string): boolean {
  // TODO
  return false;
}`,
  solution: `const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin:  ['posts:read', 'posts:create', 'posts:update', 'posts:delete', 'users:manage'],
  editor: ['posts:read', 'posts:create', 'posts:update'],
  viewer: ['posts:read'],
};

function hasPermission(roles: string[], permission: string): boolean {
  return roles.some(role => ROLE_PERMISSIONS[role]?.includes(permission) ?? false);
}

function canUserDo(user: { id: string; roles: string[] }, resource: { ownerId: string }, permission: string): boolean {
  if (user.roles.includes('admin')) return true;
  if (!hasPermission(user.roles, permission)) return false;
  // Row-level ownership check for mutating operations
  if (permission === 'posts:update' || permission === 'posts:delete') {
    return user.id === resource.ownerId;
  }
  return true;
}

const editor = { id: 'u1', roles: ['editor'] };
const post = { ownerId: 'u1' };
const otherPost = { ownerId: 'u2' };
console.log(canUserDo(editor, post, 'posts:update'));      // true
console.log(canUserDo(editor, otherPost, 'posts:update')); // false`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the main advantage of ABAC over RBAC?',
    options: [
      'ABAC is simpler to implement and audit',
      'ABAC can express fine-grained, context-dependent policies (e.g., "only if same department") without role explosion',
      'ABAC is faster at runtime due to simpler lookups',
      'ABAC is the only approach supported by OAuth 2.0',
    ],
    answer: 1,
    explanation: 'RBAC works well for coarse-grained access control but leads to role explosion as requirements grow ("editor-finance", "editor-us", "editor-pending"). ABAC evaluates policies against dynamic attributes, enabling fine-grained control ("can edit if same department AND document is in draft") without creating a role for every combination.',
  },
  {
    q: 'Why should authorization always be enforced server-side, not just in the UI?',
    options: [
      'Frontend frameworks cannot reliably check permissions',
      'Users can call APIs directly, bypassing the UI entirely — the server must validate every request',
      'Server-side checks are faster',
      'JavaScript cannot access the user\'s roles',
    ],
    answer: 1,
    explanation: 'Frontend authorization is UX (hiding buttons) not security. Any user can open the browser console, use curl, or a tool like Postman to call your API endpoints directly without going through the UI. The server must enforce permissions on every request.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the principle of least privilege and how do you apply it in authorization?',
    a: 'Least privilege: grant each user, service, or process only the minimum permissions needed to perform their function — no more. In authorization: <ul><li>Create scoped roles (billing-reader vs admin) instead of granting admin for convenience</li><li>Default-deny: if no policy explicitly allows an action, deny it</li><li>Time-limited elevated access (just-in-time privilege escalation)</li><li>Audit and revoke unused permissions periodically</li><li>For services: each microservice should have its own credential with only the DB tables/API endpoints it needs</li></ul>',
  },
  {
    q: 'What is the difference between authorization and authentication?',
    a: '<strong>Authentication (authn)</strong>: "Who are you?" — verifies identity. Mechanisms: password + MFA, SSO, passkey. Result: a verified identity (user ID). <strong>Authorization (authz)</strong>: "What are you allowed to do?" — checks permissions for the authenticated identity. Mechanisms: RBAC, ABAC, ReBAC. Result: allow or deny. Authentication always precedes authorization. A system can authenticate successfully (valid JWT) but still deny access (insufficient permissions). These concerns should be implemented in separate layers.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'RBAC assigns permissions to roles; ABAC evaluates policies against attributes — use RBAC for simple structures, ABAC for row-level or context-dependent access; always enforce server-side.',
  mustKnow: [
    'RBAC: users → roles → permissions. Simple, auditable, but leads to role explosion',
    'ABAC: policies evaluated against subject + resource + action + environment attributes',
    'ReBAC: permissions derived from relationships (Google Zanzibar model, OpenFGA)',
    'Always check permissions server-side — frontend checks are UX only',
    'Check ownership for row-level operations even with RBAC',
    'Principle of least privilege: grant minimum permissions; default-deny',
  ],
  interviewFocus: [
    'When would you choose ABAC over RBAC?',
    'How do you prevent unauthorized access to another user\'s resources?',
    'What is the principle of least privilege?',
  ],
};

@Component({
  selector: 'app-sec-rbac-abac',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './rbac-abac.html',
  styleUrl: './rbac-abac.scss',
})
export class SecRbacAbac {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
