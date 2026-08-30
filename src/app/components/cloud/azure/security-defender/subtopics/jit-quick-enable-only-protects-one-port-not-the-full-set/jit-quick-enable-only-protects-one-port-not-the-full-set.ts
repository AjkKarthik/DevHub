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
  templateUrl: './jit-quick-enable-only-protects-one-port-not-the-full-set.html',
  styleUrl: './jit-quick-enable-only-protects-one-port-not-the-full-set.scss'
})
export class JitQuickEnableOnlyProtectsOnePortNotTheFullSetSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes JIT\'s default behavior as covering "management ports," plural, without distinguishing how JIT was actually enabled',
      points: [
        'The main page\'s own theory states: "NSG rules are automatically set to DENY inbound on management ports (RDP 3389, SSH 22, WinRM 5985/5986)" when JIT is enabled — describing a full four-port set as the default outcome, with no mention that HOW you enable JIT changes which of those ports actually get protected.',
        'There are two different places to turn on JIT for a VM — from Defender for Cloud\'s own Just-in-time VM access page, or from a quick "Enable just-in-time" toggle right on the VM\'s own Configuration blade — and they don\'t produce the same result.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own JIT reference: the VM blade\'s quick-enable path only protects a single port',
      points: [
        'Per Microsoft\'s own documentation, enabling JIT directly from a VM\'s own Configuration page uses fixed, minimal defaults: "Windows machines: RDP port: 3389... Linux machines: SSH port: 22" — just one port, matching the VM\'s own OS type, not the fuller management-port list the main page\'s theory describes.',
        'The full recommended list Defender for Cloud itself surfaces when configuring JIT from its own dedicated page is longer: "22 - SSH, 3389 - RDP, 5985 - WinRM, 5986 - WinRM." A Windows VM protected via the quick VM-blade toggle gets RDP locked down, but its WinRM ports (5985/5986) — a real, commonly-targeted remote-management surface — are left completely untouched by that quick-enable flow.',
        'Custom application admin ports (a non-standard SSH port, a custom management API) are never included in either default set automatically — per Microsoft\'s own docs, adding one requires an explicit step: "select Add for a new custom port," available only through Defender for Cloud\'s own JIT configuration page, not the VM blade\'s quick toggle at all.',
      ]
    },
    {
      heading: 'Why this gap is easy to miss, and how to close it',
      points: [
        'The VM Configuration blade\'s "Enable just-in-time" toggle is the more discoverable, closer-to-hand option for someone configuring a VM directly — exactly the kind of place a team securing a new VM would reach for first, without necessarily realizing Defender for Cloud\'s own dedicated JIT page offers a materially more complete default.',
        'The fix is straightforward once known: after enabling JIT via the VM blade\'s quick toggle (or instead of using it at all), go to Defender for Cloud\'s own Just-in-time VM access page, find the VM under the Configured tab, and Edit its policy to add the remaining recommended ports (WinRM 5985/5986 for Windows) or any custom application port the workload actually needs protected.',
        'This is a genuine "secure by default, but only partially" trap — a team that enables JIT via the quick VM-blade path and considers the job done has correctly closed RDP or SSH, but may have an unmonitored, still-fully-open WinRM or custom admin port sitting right next to it, with no warning that the "default" protection they enabled was the narrower of the two available defaults.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What each enable path actually protects, side by side',
      language: 'bash',
      code: `# Path 1: VM's own Configuration blade -- "Enable just-in-time"
# Per Microsoft's own docs, this uses FIXED, MINIMAL defaults:
#   Windows VM -> protects ONLY RDP (3389)
#   Linux VM   -> protects ONLY SSH (22)
# WinRM (5985/5986) on a Windows VM is NOT touched by this path.

# Path 2: Defender for Cloud's own Just-in-time VM access page
# Recommends the FULL management-port set on first configuration:
#   22   - SSH
#   3389 - RDP
#   5985 - WinRM
#   5986 - WinRM
# ...and lets you add custom ports beyond this list.

# Checking which ports are actually protected on a given VM,
# regardless of which path was used to enable JIT:
az security jit-policy show \\
  --resource-group my-rg --location eastus --name default \\
  --query "virtualMachines[?id contains 'my-vm'].ports[].number"`,
    },
    {
      label: 'Closing the gap after a quick-enable via the VM blade',
      language: 'bash',
      code: `# If JIT was enabled via the VM's own "Enable just-in-time"
# toggle, only RDP or SSH is actually protected. Add the remaining
# recommended ports (and any custom app port) explicitly:
az security jit-policy create \\
  --resource-group my-rg --location eastus --name default \\
  --virtual-machines "[{
    'id': '/subscriptions/{sub-id}/resourceGroups/my-rg/providers/Microsoft.Compute/virtualMachines/my-windows-vm',
    'ports': [
      { 'number': 3389, 'protocol': 'TCP', 'allowedSourceAddressPrefix': '*', 'maxRequestAccessDuration': 'PT3H' },
      { 'number': 5985, 'protocol': 'TCP', 'allowedSourceAddressPrefix': '*', 'maxRequestAccessDuration': 'PT3H' },
      { 'number': 5986, 'protocol': 'TCP', 'allowedSourceAddressPrefix': '*', 'maxRequestAccessDuration': 'PT3H' }
    ]
  }]"

# This creates/updates the SAME policy object either enable path
# writes to -- the two paths aren't separate systems, just
# different STARTING defaults for what gets included.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team provisions a new Windows Server VM and, following what they believe is best practice, immediately enables Just-in-Time access using the "Enable just-in-time" toggle right on the VM\'s own Configuration page. They consider the VM\'s management ports secured. A later security review finds WinRM port 5986 still wide open to the internet on that same VM. How did this happen, given JIT was enabled?',
    hint: 'Check which specific ports the VM Configuration blade\'s quick-enable JIT toggle actually protects by default, versus the full recommended set Defender for Cloud\'s own dedicated JIT page suggests.',
    solution: 'This happened because the VM Configuration blade\'s quick "Enable just-in-time" toggle uses a narrower default than the team assumed. Per Microsoft\'s own documentation, that path protects only "RDP port: 3389" for a Windows machine — it does not touch WinRM (5985/5986) at all. The fuller recommended set (SSH, RDP, and both WinRM ports) is only offered when configuring JIT from Defender for Cloud\'s own dedicated Just-in-time VM access page. The fix is going to that page, finding the VM, and editing its JIT policy to explicitly add ports 5985 and 5986 — the quick VM-blade toggle alone was never going to cover them.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Enabling Just-in-Time access, regardless of which portal page or button is used to turn it on, always locks down the same full set of management ports (SSH, RDP, and both WinRM ports).',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms the VM Configuration blade\'s quick-enable toggle protects only a single port matching the VM\'s OS (RDP for Windows, SSH for Linux) — the fuller recommended set is only offered by Defender for Cloud\'s own dedicated JIT configuration page.'
    },
    {
      thought: 'A custom application admin port automatically gets JIT protection alongside the standard management ports once JIT is enabled on a VM.',
      reality: 'Per this subtopic\'s theory, custom ports are never included in either default set — Microsoft\'s own documentation confirms adding one requires an explicit "Add" step in Defender for Cloud\'s own JIT configuration page.'
    },
    {
      thought: 'The VM Configuration blade\'s "Enable just-in-time" toggle and Defender for Cloud\'s own dedicated JIT page are two separate, independent JIT systems that could conflict with each other.',
      reality: 'Per this subtopic\'s theory, they write to the same underlying JIT policy object for the VM — they\'re two different entry points with different starting defaults, not competing systems, and either one can be used to edit and extend the same policy.'
    }
  ];
}
