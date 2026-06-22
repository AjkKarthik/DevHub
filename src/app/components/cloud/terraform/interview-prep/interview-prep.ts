import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';

interface IQItem {
  q: string;
  a: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
}

@Component({
  selector: 'app-tf-interview-prep',
  standalone: true,
  imports: [CommonModule, PageMetaComponent],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class TfInterviewPrep {
  activeDiff = signal('All');
  activeTopic = signal('All');
  openIndex = signal<number | null>(null);

  difficulties = ['All', 'beginner', 'intermediate', 'advanced'];
  topics = ['All', 'State', 'Modules', 'Backends', 'Workspaces', 'CI/CD', 'Security', 'Expressions', 'Lifecycle', 'OpenTofu'];

  items: IQItem[] = [
    // beginner
    { difficulty: 'beginner', topic: 'State',    q: 'What is Terraform state and why does it exist?', a: 'Terraform state (terraform.tfstate) maps your HCL resources to real-world infrastructure. It records resource IDs, attributes, and dependencies so Terraform knows what already exists when planning changes. Without state, Terraform cannot determine what to create vs. update vs. destroy.' },
    { difficulty: 'beginner', topic: 'State',    q: 'What is the difference between terraform plan and terraform apply?', a: 'terraform plan is a dry-run — it reads current state and HCL, then shows what changes would be made. No real infrastructure is modified. terraform apply executes those changes. In CI, always save plan with -out and apply the saved file to guarantee determinism.' },
    { difficulty: 'beginner', topic: 'Modules',  q: 'What is a Terraform module?', a: 'A module is a directory of .tf files treated as a reusable unit. The root module is your entry point. Child modules are called with module {} blocks and expose inputs (variables) and outputs. Modules enable reuse across environments without duplicating HCL.' },
    { difficulty: 'beginner', topic: 'Expressions', q: 'What is the difference between count and for_each?', a: 'count creates N numbered copies (indexed [0],[1],…). for_each creates one instance per key in a map or set. for_each is preferred for distinct resources because its string keys are stable — removing one item does not renumber others. count is simpler for identical homogeneous resources.' },
    { difficulty: 'beginner', topic: 'State',    q: 'What does terraform init do?', a: 'terraform init initializes the working directory: downloads providers specified in required_providers, downloads modules, and configures the backend. It must be run before plan or apply. -upgrade re-downloads providers respecting version constraints.' },
    { difficulty: 'beginner', topic: 'Lifecycle', q: 'What does create_before_destroy do?', a: 'By default, Terraform destroys then creates when a resource must be replaced. create_before_destroy = true reverses this — the replacement is created first, then the old one destroyed. Essential for resources like load balancers or certificates that cannot have a gap.' },
    { difficulty: 'beginner', topic: 'Backends',  q: 'Why should you use a remote backend?', a: 'A remote backend stores state in a shared, durable location (S3, Azure Blob, GCS). This enables team collaboration (everyone sees the same state), state locking (prevents concurrent applies), and encryption at rest. Never use local state for team projects.' },
    // intermediate
    { difficulty: 'intermediate', topic: 'State',    q: 'How does Terraform state locking work?', a: 'When an operation that could modify state begins (plan or apply), Terraform writes a lock to the backend (DynamoDB for S3, blob lease for Azure, native for GCS/TF Cloud). Other operations that attempt to acquire the lock are blocked. If a lock is stuck after a crash, terraform force-unlock <lock-id> releases it — confirm no other process is running first.' },
    { difficulty: 'intermediate', topic: 'Backends',  q: 'How do you bootstrap an S3+DynamoDB backend?', a: 'The backend cannot reference itself — use a chicken-and-egg pattern: 1) Create the S3 bucket and DynamoDB table with local state (or via CLI/console), 2) Add the backend "s3" {} block to your config, 3) Run terraform init -migrate-state to move local state to S3. After that, all future state is remote.' },
    { difficulty: 'intermediate', topic: 'Modules',  q: 'What is the difference between root and child modules?', a: 'The root module is the entry point — it calls child modules and wires their outputs to inputs. Child modules are focused, reusable components (network, compute, database). The root module is environment-specific; child modules are generic and reused across environments. Avoid putting business logic in the root module.' },
    { difficulty: 'intermediate', topic: 'Workspaces', q: 'When should you use workspaces vs. directory-per-environment?', a: 'Workspaces are suitable for near-identical environments where the same codebase applies everywhere with only variable differences. Directory-per-environment (separate state files) is better when environments differ significantly, need separate approval gates, or have different provider configs. Many teams prefer directories for clarity.' },
    { difficulty: 'intermediate', topic: 'Expressions', q: 'How do you create optional resources based on a flag?', a: 'Use count = var.enable_x ? 1 : 0. When the flag is false, count = 0 means no resource is created. Access the optional resource with resource.name[0] (since it may not exist). For object variables, use optional(type, default) (TF 1.3+) to allow callers to omit object keys.' },
    { difficulty: 'intermediate', topic: 'CI/CD',    q: 'Why save a plan file in CI instead of running apply separately?', a: 'Running plan then a separate apply evaluates the resource graph twice. State could change between the two runs (concurrent pipeline, manual change). Saving with -out=plan.tfplan and applying that exact file guarantees what you reviewed is exactly what gets applied — deterministic CI.' },
    { difficulty: 'intermediate', topic: 'Security',  q: 'Does sensitive = true encrypt the value in state?', a: 'No. sensitive = true only redacts the value in terminal plan/apply output. The value is stored as plaintext JSON in the state file. Protect secrets by: encrypting the state backend (S3 SSE/KMS, Azure encryption), restricting IAM access to the state bucket, and never committing .tfstate to git.' },
    { difficulty: 'intermediate', topic: 'Lifecycle', q: 'What does ignore_changes do and when should you use it?', a: 'ignore_changes tells Terraform to ignore specific attribute changes detected during plan. Use it for attributes that legitimately change outside Terraform (e.g. autoscaling desired_capacity, tags set by cost-allocation tools). Never use ignore_changes = all on critical resources — it hides security patches and config changes.' },
    { difficulty: 'intermediate', topic: 'State',    q: 'How do you safely rename a Terraform resource without destroying it?', a: 'Add a moved {} block (TF 1.1+): moved { from = resource.old_name; to = resource.new_name }. Then rename the resource in HCL. Run terraform plan — it should show 0 resource changes. Apply updates state addresses. Without moved {}, Terraform would destroy old + create new.' },
    { difficulty: 'intermediate', topic: 'Modules',  q: 'How do you version-pin a module from the Terraform Registry?', a: 'Use the version argument in the module block: module "vpc" { source = "terraform-aws-modules/vpc/aws"; version = "~> 5.0" }. Run terraform init to download. Pin to a minor version (~> 5.0 allows 5.x but not 6.0). Never pin to a tag only (HEAD may change) — use semantic version constraints.' },
    // advanced
    { difficulty: 'advanced', topic: 'State',    q: 'What are the risks of storing secrets in Terraform state?', a: 'Terraform state is plaintext JSON — it stores all resource attributes including passwords, private keys, and connection strings. Anyone with read access to the state backend can read all secrets. Mitigate with: S3 SSE+KMS encryption, strict IAM policies on the state bucket, avoid storing passwords in state by using external secret managers (Vault, AWS Secrets Manager) that return references not values.' },
    { difficulty: 'advanced', topic: 'Expressions', q: 'How do moved {} blocks help when migrating from count to for_each?', a: 'count addresses are numeric ([0],[1]). for_each addresses are keyed (["prod-a"]). Renaming without moved {} would destroy and recreate. Add one moved {} block per instance: moved { from = resource.name[0]; to = resource.name["prod-a"] }. After all moved {} blocks, terraform plan shows 0 resource changes — only state addresses change.' },
    { difficulty: 'advanced', topic: 'Backends',  q: 'How do you migrate state between two backends?', a: '1) Update the backend {} block in config, 2) Run terraform init -migrate-state — Terraform copies state from the old backend to the new one and verifies the copy, 3) Confirm when prompted. For cross-account moves, use terraform state pull > backup.json, configure new backend, then terraform state push backup.json.' },
    { difficulty: 'advanced', topic: 'CI/CD',    q: 'How do you prevent two CI pipelines from applying simultaneously?', a: 'State locking (DynamoDB for S3, native for Azure/GCS) blocks concurrent applies at the Terraform level. Additionally: use serialized CI pipelines (concurrency: group in GitHub Actions), add apply_requirements = [mergeable] in Atlantis, and use Terraform Cloud\'s queue for managed serialization.' },
    { difficulty: 'advanced', topic: 'Security',  q: 'How would you enforce mandatory tagging across all Terraform resources?', a: 'Multiple layers: 1) Sentinel policy (Terraform Cloud/Enterprise) — checks tfplan for required tags, hard-mandatory blocks applies, 2) OPA/conftest — enforces policies against terraform show -json plan output in CI, 3) Provider-level: AWS provider default_tags{} block applies tags to all resources automatically, 4) checkov rules for static tag validation.' },
    { difficulty: 'advanced', topic: 'Modules',  q: 'How do you design a module interface that is easy to use but flexible?', a: 'Minimal surface area: expose only what callers must control, default everything else. Use optional(type, default) for object attributes. Feature flags (bool vars, default false) for optional sub-resources. Never expose internal resource attributes directly — go through declared outputs. Provide an examples/ directory as documentation and as integration test cases.' },
    { difficulty: 'advanced', topic: 'OpenTofu', q: 'What is OpenTofu and why was it created?', a: 'OpenTofu is an open-source fork of Terraform under the Linux Foundation (CNCF), created after HashiCorp re-licensed Terraform from MPL-2.0 to BSL 1.1 in August 2023. The BSL restricts use in competing products. OpenTofu remains MPL-2.0, is governed by the community, and provides a drop-in tofu CLI replacement with added features: native state encryption and provider-defined functions.' },
    { difficulty: 'advanced', topic: 'CI/CD',    q: 'What is OIDC authentication and why use it for Terraform in CI?', a: 'OIDC (OpenID Connect) lets CI workflows assume cloud IAM roles using short-lived JWT tokens instead of long-lived static access keys. The workflow presents an OIDC token; AWS/Azure/GCP validates it and issues temporary credentials. Benefits: no secrets stored in CI, tokens expire automatically, scoped to specific repos/branches, auditable. Use aws-actions/configure-aws-credentials@v4 with role-to-assume in GitHub Actions.' },
    { difficulty: 'advanced', topic: 'State',    q: 'How does terraform plan -refresh-only differ from terraform refresh?', a: 'terraform refresh (deprecated since 0.15) updated state immediately without any review. terraform plan -refresh-only creates a reviewable plan first — you see exactly what would change in state before committing. terraform apply -refresh-only then applies that plan, updating state to match reality without modifying real infrastructure. Always prefer -refresh-only over the deprecated refresh.' },
  ];

  filtered = computed(() => {
    const d = this.activeDiff();
    const t = this.activeTopic();
    return this.items.filter(i =>
      (d === 'All' || i.difficulty === d) &&
      (t === 'All' || i.topic === t)
    );
  });

  toggle(i: number) {
    this.openIndex.set(this.openIndex() === i ? null : i);
  }

  setDiff(d: string) { this.activeDiff.set(d); this.openIndex.set(null); }
  setTopic(t: string) { this.activeTopic.set(t); this.openIndex.set(null); }
}
