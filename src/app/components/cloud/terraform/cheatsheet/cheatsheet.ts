import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';

interface CheatItem {
  category: string;
  command: string;
  desc: string;
}

@Component({
  selector: 'app-tf-cheatsheet',
  standalone: true,
  imports: [CommonModule, FormsModule, PageMetaComponent],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class TfCheatsheet {
  searchQuery = signal('');
  activeCategory = signal('All');

  categories = ['All', 'CLI', 'HCL', 'State', 'Meta-Arguments', 'Functions', 'Backends'];

  items: CheatItem[] = [
    // CLI
    { category: 'CLI', command: 'terraform init',                          desc: 'Initialize working directory, download providers and modules.' },
    { category: 'CLI', command: 'terraform init -upgrade',                 desc: 'Re-download providers, respecting version constraints.' },
    { category: 'CLI', command: 'terraform validate',                      desc: 'Check HCL syntax and type correctness without API calls.' },
    { category: 'CLI', command: 'terraform fmt -recursive',                desc: 'Format all .tf files in place recursively.' },
    { category: 'CLI', command: 'terraform fmt -check',                    desc: 'Check formatting without modifying files (CI use).' },
    { category: 'CLI', command: 'terraform plan',                          desc: 'Preview changes Terraform will make to reach desired state.' },
    { category: 'CLI', command: 'terraform plan -out=plan.tfplan',         desc: 'Save plan to file for deterministic CI apply.' },
    { category: 'CLI', command: 'terraform plan -refresh-only',            desc: 'Show drift — what changed outside Terraform.' },
    { category: 'CLI', command: 'terraform plan -detailed-exitcode',       desc: 'Exit 2 if changes present — use in CI drift scripts.' },
    { category: 'CLI', command: 'terraform apply',                         desc: 'Apply the planned changes (prompts for approval).' },
    { category: 'CLI', command: 'terraform apply -auto-approve',           desc: 'Apply without interactive prompt (CI).' },
    { category: 'CLI', command: 'terraform apply plan.tfplan',             desc: 'Apply a saved plan file (deterministic).' },
    { category: 'CLI', command: 'terraform apply -refresh-only',          desc: 'Update state to match real infra (no resource changes).' },
    { category: 'CLI', command: 'terraform destroy',                       desc: 'Destroy all managed resources (prompts for approval).' },
    { category: 'CLI', command: 'terraform output',                        desc: 'Show root module output values.' },
    { category: 'CLI', command: 'terraform output -json',                  desc: 'Output values as JSON (for scripting).' },
    { category: 'CLI', command: 'terraform show plan.tfplan',              desc: 'Display saved plan in human-readable form.' },
    { category: 'CLI', command: 'terraform show -json plan.tfplan',        desc: 'Machine-readable plan JSON for policy tools.' },
    { category: 'CLI', command: 'terraform workspace new staging',         desc: 'Create a new workspace named staging.' },
    { category: 'CLI', command: 'terraform workspace select staging',      desc: 'Switch to the staging workspace.' },
    { category: 'CLI', command: 'terraform workspace list',                desc: 'List all available workspaces.' },
    { category: 'CLI', command: 'terraform import aws_s3_bucket.b <id>',  desc: 'Import existing resource into state.' },
    { category: 'CLI', command: 'terraform test',                          desc: 'Run .tftest.hcl tests (TF 1.6+).' },
    { category: 'CLI', command: 'terraform graph | dot -Tsvg > g.svg',    desc: 'Generate dependency graph as SVG.' },
    // State
    { category: 'State', command: 'terraform state list',                  desc: 'List all resource addresses in state.' },
    { category: 'State', command: 'terraform state show aws_instance.web', desc: 'Show all attributes of a tracked resource.' },
    { category: 'State', command: 'terraform state mv A B',                desc: 'Rename resource address in state (use moved {} instead).' },
    { category: 'State', command: 'terraform state rm resource.name',      desc: 'Remove resource from state without destroying it.' },
    { category: 'State', command: 'terraform state pull > backup.json',    desc: 'Download current state JSON for inspection/backup.' },
    { category: 'State', command: 'terraform state push backup.json',      desc: 'Upload a state file to the remote backend.' },
    { category: 'State', command: 'terraform force-unlock <lock-id>',      desc: 'Release a stuck state lock (dangerous — confirm first).' },
    // HCL
    { category: 'HCL', command: 'variable "name" { type = string }',      desc: 'Declare an input variable.' },
    { category: 'HCL', command: 'variable "x" { sensitive = true }',      desc: 'Mark variable as sensitive — redacted in logs.' },
    { category: 'HCL', command: 'locals { name = "value" }',              desc: 'Define local values (computed or named constants).' },
    { category: 'HCL', command: 'output "name" { value = resource.attr }',desc: 'Expose a value from the module.' },
    { category: 'HCL', command: 'output "x" { sensitive = true }',        desc: 'Sensitive output — redacted in terminal.' },
    { category: 'HCL', command: 'data "aws_vpc" "main" { id = var.vpc }', desc: 'Read existing resource (no management).' },
    { category: 'HCL', command: 'import { to = res.name; id = "id" }',    desc: 'Declarative import block (TF 1.5+).' },
    { category: 'HCL', command: 'moved { from = old; to = new }',         desc: 'Rename resource address without destroy+recreate.' },
    { category: 'HCL', command: 'removed { from = res; lifecycle { destroy = false } }', desc: 'Declarative state removal (TF 1.7+).' },
    { category: 'HCL', command: '${var.name}',                            desc: 'Variable interpolation in strings.' },
    { category: 'HCL', command: 'condition ? true_val : false_val',       desc: 'Ternary conditional expression.' },
    { category: 'HCL', command: '[for x in list : x.name]',              desc: 'For expression — build a list.' },
    { category: 'HCL', command: '{for k, v in map : k => upper(v)}',     desc: 'For expression — build a map.' },
    { category: 'HCL', command: 'resource.name[*].attr',                  desc: 'Splat expression on count-based list.' },
    // Meta-Arguments
    { category: 'Meta-Arguments', command: 'count = 3',                   desc: 'Create N copies — indexed [0], [1], [2].' },
    { category: 'Meta-Arguments', command: 'count.index',                 desc: 'Current iteration index in count.' },
    { category: 'Meta-Arguments', command: 'for_each = toset(list)',      desc: 'Create one instance per set element — stable keys.' },
    { category: 'Meta-Arguments', command: 'each.key / each.value',       desc: 'Current key and value in for_each iteration.' },
    { category: 'Meta-Arguments', command: 'depends_on = [res]',          desc: 'Explicit dependency when implicit is not enough.' },
    { category: 'Meta-Arguments', command: 'provider = aws.us_west',      desc: 'Use an aliased provider.' },
    { category: 'Meta-Arguments', command: 'lifecycle { create_before_destroy = true }', desc: 'Create replacement before destroying original.' },
    { category: 'Meta-Arguments', command: 'lifecycle { prevent_destroy = true }',       desc: 'Error if resource would be destroyed.' },
    { category: 'Meta-Arguments', command: 'lifecycle { ignore_changes = [tags] }',      desc: 'Suppress plan noise for specific attributes.' },
    { category: 'Meta-Arguments', command: 'lifecycle { replace_triggered_by = [res] }', desc: 'Force replace when another resource changes.' },
    // Functions
    { category: 'Functions', command: 'merge(map1, map2)',                 desc: 'Merge maps — later maps win on key conflicts.' },
    { category: 'Functions', command: 'flatten([[1,2],[3]])',              desc: 'Flatten nested lists into a single list.' },
    { category: 'Functions', command: 'toset(list)',                       desc: 'Convert list to set (removes duplicates, sorts).' },
    { category: 'Functions', command: 'tolist(set)',                       desc: 'Convert set or tuple to list.' },
    { category: 'Functions', command: 'lookup(map, key, default)',         desc: 'Safe map lookup with default if key missing.' },
    { category: 'Functions', command: 'cidrsubnet(cidr, newbits, netnum)', desc: 'Calculate a subnet CIDR from a parent block.' },
    { category: 'Functions', command: 'cidrhost(cidr, hostnum)',           desc: 'Calculate specific host IP within a CIDR.' },
    { category: 'Functions', command: 'jsonencode(value)',                 desc: 'Encode HCL value to JSON string.' },
    { category: 'Functions', command: 'jsondecode(string)',                desc: 'Parse JSON string to HCL value.' },
    { category: 'Functions', command: 'templatefile(path, vars)',          desc: 'Render a template file with variable substitution.' },
    { category: 'Functions', command: 'format("%s-%s", a, b)',             desc: 'Format a string using sprintf syntax.' },
    { category: 'Functions', command: 'length(list)',                      desc: 'Number of elements in list, map, or string.' },
    { category: 'Functions', command: 'contains(list, value)',             desc: 'True if list contains value.' },
    { category: 'Functions', command: 'coalesce(a, b, c)',                 desc: 'Return first non-null, non-empty value.' },
    { category: 'Functions', command: 'one(list)',                         desc: 'Assert list has exactly one element and return it.' },
    // Backends
    { category: 'Backends', command: 'backend "s3" { bucket encrypt }',   desc: 'S3 backend — always add encrypt=true.' },
    { category: 'Backends', command: 'dynamodb_table = "tf-locks"',       desc: 'S3+DynamoDB state locking table.' },
    { category: 'Backends', command: 'backend "azurerm" { }',             desc: 'Azure Blob backend — native locking via blob leases.' },
    { category: 'Backends', command: 'backend "gcs" { }',                 desc: 'Google Cloud Storage backend.' },
    { category: 'Backends', command: 'backend "remote" { }',              desc: 'Terraform Cloud backend for managed runs.' },
    { category: 'Backends', command: 'terraform init -migrate-state',     desc: 'Migrate state to a new backend configuration.' },
    { category: 'Backends', command: 'terraform init -reconfigure',       desc: 'Force backend re-initialization (discards existing state config).' },
  ];

  filtered = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const cat = this.activeCategory();
    return this.items.filter(i =>
      (cat === 'All' || i.category === cat) &&
      (i.command.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q))
    );
  });

  setCategory(cat: string) { this.activeCategory.set(cat); }
}
