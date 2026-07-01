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
  {
    heading: 'Choosing Between RBAC and ABAC',
    points: [
      'Role-Based Access Control (RBAC) assigns permissions to roles (admin, editor, viewer), and users are assigned one or more roles — simple to reason about and audit, but can become unwieldy ("role explosion") when access needs vary by many independent dimensions.',
      'Attribute-Based Access Control (ABAC) evaluates policies against attributes of the user, resource, and context (department = "finance" AND resource.classification = "confidential" AND time.hour BETWEEN 9 AND 17) — far more flexible for fine-grained, context-aware authorization but harder to audit and reason about at a glance.',
      'Many real systems use a hybrid: RBAC for broad access tiers (which features a user can see at all) combined with ABAC-style fine-grained checks within those tiers (a "manager" role that can only approve expenses for their own department, not all departments).',
      'Whichever model is chosen, authorization logic should be centralized (a policy engine or a consistent middleware layer) rather than scattered as ad-hoc if-checks throughout the codebase — centralization makes the actual access rules auditable and preventing accidental gaps.',
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
  { q: 'Why is auditing "who can access what" generally harder in a mature ABAC system than in an equivalent RBAC system?', options: ['ABAC systems do not support audit logging at all', 'In RBAC, "who can access X" reduces to a simple lookup of role assignments and role-permission mappings; in ABAC, access depends on evaluating a policy against potentially many dynamic attributes (time, location, resource state) at request time, so answering "who can access X" requires either simulating the policy across all possible attribute combinations or accepting that the true answer is genuinely context-dependent and cannot be listed as a static fact', 'ABAC systems store audit logs in a proprietary format that tools cannot parse', 'RBAC has no concept of auditing, unlike ABAC', 'None of the above'], answer: 1, explanation: 'With RBAC, "can Alice access document X?" reduces to: does Alice have a role, and does that role have the permission — a fact you can look up and list exhaustively ahead of time. With ABAC, the same question might depend on the current time, Alice\'s current location, the document\'s current classification, and other request-time context — meaning the true answer to "who CAN access X" is not a fixed list but a function that must be evaluated per-request, making compliance audits (which often want a static "who has access to what" report) fundamentally harder to produce for ABAC than for RBAC.' },
  { q: 'What is role explosion in RBAC and how is it solved?', options: ['Too many user accounts creating performance issues with role evaluation', 'When role combinations grow exponentially to represent fine-grained permissions, creating hundreds of roles that are difficult to manage', 'Users accumulating too many roles over time due to lack of role revocation', 'A performance issue when checking role membership in large organizations'], answer: 1, explanation: 'Role explosion: in a simple RBAC system, each unique combination of permissions requires a new role. For an organization with 10 departments, 5 data sensitivity levels, and 4 function types, a complete RBAC model might need 10 x 5 x 4 = 200 roles. As the organization grows, roles multiply, management becomes intractable, and drift occurs. Solutions: role hierarchies (senior roles inherit junior role permissions, reducing duplication). Attribute enrichment (add attributes to roles to make them context-aware, moving toward ABAC). Group roles into role categories with constraints. External authorization services (OPA, Casbin) that evaluate complex policies. Hybrid RBAC+ABAC: coarse roles for categories, ABAC constraints within roles for fine-grained control.' },
  { q: 'What is Open Policy Agent (OPA) and how does it implement ABAC?', options: ['A database access control layer for SQL queries', 'A general-purpose policy engine that decouples authorization policies from application code using the Rego policy language', 'An OAuth 2.0 server that handles role-based permissions for microservices', 'A network firewall policy management system for cloud infrastructure'], answer: 1, explanation: 'OPA (Open Policy Agent): a policy engine that externalizes authorization decisions from application code. Applications send a decision request: input (user, resource, action, context). OPA evaluates Rego policies and returns a decision (allow/deny). Rego policy example: allow if input.user.department == input.resource.department and input.action == read. OPA decouples policy from code: update policies without redeploying applications. Centralized policy management across microservices. Integration points: Kubernetes admission control (OPA Gatekeeper), API gateway authorization, database query filtering. OPA bundles allow distributing policies centrally while evaluating them locally (no network round-trip per decision).' },
  { q: 'What is privilege escalation and how does insecure RBAC implementation enable it?', options: ['A user gaining physical access to an administrator workstation', 'An attacker gaining higher permissions than authorized through role assignment flaws, API vulnerabilities, or missing access checks', 'A software vulnerability allowing arbitrary code execution with system privileges', 'A social engineering technique targeting help desk staff to reset admin passwords'], answer: 1, explanation: 'Privilege escalation in RBAC contexts: vertical escalation (user gains admin or higher-privilege role). Horizontal escalation (user accesses resources of another user at the same privilege level). RBAC implementation flaws that enable it: missing server-side authorization checks (client-side role display only). Mass assignment vulnerabilities (user submits role=admin in a profile update and the API applies it without authorization check). Insecure direct object references (user accesses /api/records/123 by changing the ID to 456, which belongs to another user). Unprotected administrative endpoints. Privilege escalation via role assignment (a role can assign other roles; does that role have the right to assign admin?). Prevention: audit role assignment endpoints. Validate all authorization server-side.' },
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
  { q: 'What is the principle of separation of duties and how does RBAC enforce it?', a: 'Separation of duties (SoD): no single person should have enough access to commit and conceal fraud without involving a second person. Classic example: the person who can approve a payment should not also be the person who can submit a payment request. Requestor and approver must be different people. RBAC enforcement: define roles that are mutually exclusive. A user cannot hold both the Requestor role and Approver role simultaneously. Role assignment system enforces SoD constraints at assignment time. Implementation: static SoD (roles are statically incompatible — no user can hold both). Dynamic SoD (the same user can hold both roles but cannot invoke both in the same session or transaction). SoD is especially important in financial, HR, and compliance-sensitive systems. SOX and PCI DSS mandate SoD for financial and payment operations.' },
  { q: 'How do you implement row-level security in an application with RBAC?', a: 'Row-level security (RLS) restricts which database rows a user can access based on their identity. Application-level RLS: every query includes a WHERE clause enforcing ownership or access rules: SELECT * FROM orders WHERE user_id = currentUserId (for regular users) or no filter for admins. Risk: developer forgets to add the WHERE clause on one endpoint, exposing all orders. Database-level RLS (PostgreSQL example): CREATE POLICY orders_user_policy ON orders USING (user_id = current_user_id()). The database automatically applies the filter to all queries on that table for that user, regardless of what the application queries. Database-level RLS is safer because it cannot be bypassed by an omitted application filter. Use it for sensitive tables where data ownership is per-user. In multi-tenant SaaS, RLS prevents cross-tenant data leakage.' },
  { q: 'How do you handle RBAC in a microservices architecture?', a: 'Microservices authorization challenges: each service needs to enforce its own authorization, but maintaining role definitions consistently across services is difficult. Centralized authorization service: all services delegate authorization decisions to a shared service (OPA, Casbin, Permit.io). The authorization service holds all policies. Services send authorization requests: can user X do action Y on resource Z? Decentralized with shared token claims: an API gateway validates authentication and injects user claims (roles, permissions) into a trusted header for downstream services. Each service reads claims from the header without re-authenticating. Service-to-service authorization: use separate service identity tokens (not user tokens) for inter-service calls. Map service identities to allowed operations in the authorization policy.' },
  { q: 'What is ReBAC (Relationship-Based Access Control) and what problems does it solve?', a: 'ReBAC: access control is based on relationships between entities (user, resource, organization). Google Zanzibar is the most prominent ReBAC system. Example: user can edit document D if user is a member of group G which has editor permission on D. The relationship chain: user -> member_of -> group -> editor_of -> document. ReBAC solves problems that RBAC and ABAC struggle with: sharing: a user shares a specific file with another user (direct relationship, no role or attribute fits). Nested groups: a user inherits permissions from being a member of a group that is a member of another group. Fine-grained ownership: resource ownership relationships (user owns project which contains documents). Permission inheritance: a project viewer can view all documents in the project. Implemented by: Ory (open-source Zanzibar), Authzed, Permit.io.' },
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
