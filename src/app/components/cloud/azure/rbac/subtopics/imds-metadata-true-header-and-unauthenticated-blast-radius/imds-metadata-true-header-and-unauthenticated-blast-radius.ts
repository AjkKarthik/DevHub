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
  templateUrl: './imds-metadata-true-header-and-unauthenticated-blast-radius.html',
  styleUrl: './imds-metadata-true-header-and-unauthenticated-blast-radius.scss'
})
export class ImdsMetadataTrueHeaderAndUnauthenticatedBlastRadiusSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own IMDS codeTab uses a header without explaining what it protects against, or who else on the VM can use the same endpoint',
      points: [
        'The main page\'s own "Managed Identity Token" codeTab calls http://169.254.169.254/metadata/identity/oauth2/token with -H "Metadata: true" — presented as a required-looking but unexplained API convention, the same way an API key header might be treated.',
        'The main page\'s own "Least Privilege & Access Reviews" section discusses blast radius extensively for role ASSIGNMENTS (narrow scope, avoid Owner, use PIM) — but never extends that same blast-radius thinking to the token ACQUISITION endpoint itself, which has its own, separate risk profile worth understanding.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own IMDS reference: the header is a specific SSRF defense, and the endpoint is intentionally unauthenticated',
      points: [
        'Per Microsoft\'s own documentation: "In order to ensure that requests are directly intended for IMDS and prevent unintended or unwanted redirection of requests, requests: Must contain the header Metadata: true. Must not contain an X-Forwarded-For header. Any request that doesn\'t meet both of these requirements are rejected by the service." The header isn\'t an arbitrary convention — it specifically defends against a class of server-side request forgery (SSRF) where an attacker tricks some other process into making an HTTP request on their behalf and reading back the response.',
        'Critically, per the same documentation: "IMDS is not a channel for sensitive data. The API is unauthenticated and open to all processes on the VM. Information exposed through this service should be considered as shared information to all applications running inside the VM." This means the Managed Identity token endpoint has NO per-process authentication of its own — any code capable of making an HTTP request to 169.254.169.254 from inside the VM can request a token, not just the specific application the main page\'s codeTab assumes is calling it.',
        'IMDS also explicitly rejects being used through a proxy: "IMDS is not intended to be used behind a proxy and doing so is unsupported... Even if you don\'t know of any proxy configuration in your environment, you still must override any default client proxy settings. Proxy configurations can be automatically discovered, and failing to bypass such configurations exposes you to outage risks." A misconfigured or auto-discovered proxy silently breaking Managed Identity token acquisition is a real, documented operational risk distinct from the SSRF concern.',
      ]
    },
    {
      heading: 'What this means for the main page\'s own least-privilege guidance',
      points: [
        'Because IMDS is unauthenticated to every process on the VM, the effective blast radius of a Managed Identity\'s RBAC role assignments is "anything that can run code on this VM" — not just the specific application the identity was set up for. A completely unrelated process, a compromised dependency, or malicious code from any source running on the same VM can silently mint tokens using the SAME identity and the SAME role assignments, with no additional credential of its own to steal or leak.',
        'This directly reinforces, from a different angle, the main page\'s own advice to scope role assignments narrowly and avoid Owner for service accounts — on a shared or multi-tenant-workload VM, the identity\'s permissions are effectively available to everything running there, so "least privilege" has to account for the full set of code that could ever run on that VM, not just the one application the identity was created for.',
        'Microsoft\'s own mitigation, mentioned in the same documentation, is local network-level restriction: "If it isn\'t necessary for every process on the VM to access IMDS endpoint, you can set local firewall rules to limit the access... only allowing the specific process(es) to access, or denying access for the rest of the processes." This is a genuinely separate hardening step from anything RBAC itself can enforce — RBAC controls what the identity CAN do once it has a token; a local firewall rule controls WHO on the VM can obtain that token in the first place.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why the header matters, and what gets rejected without it',
      language: 'bash',
      code: `# The main page's own example, unchanged:
curl -s -H "Metadata: true" \\
  "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://storage.azure.com/"

# Per Microsoft's own docs, omitting the header is REJECTED, not
# just discouraged -- this is the documented error:
curl -s "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://storage.azure.com/"
# -> 400 Bad Request, "Required metadata header not specified"

# The header exists specifically to prevent SSRF-style unintended
# redirection -- per Microsoft's own docs, requests must ALSO omit
# any X-Forwarded-For header, or they're rejected the same way:
curl -s -H "Metadata: true" -H "X-Forwarded-For: 10.0.0.5" \\
  "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://storage.azure.com/"
# -> rejected -- both conditions (header present, no X-Forwarded-For)
# must hold together`,
    },
    {
      label: 'Any process on the VM can do this -- no extra auth required',
      language: 'bash',
      code: `# This is the real blast-radius point: the exact same curl command
# succeeds for ANY process running on this VM, not just the specific
# application the Managed Identity was set up for.
#
# Per Microsoft's own docs: "IMDS is not a channel for sensitive
# data. The API is unauthenticated and open to all processes on
# the VM."
#
# A completely unrelated script, a compromised npm/pip dependency,
# or a malicious cron job on the SAME VM can run this exact command
# and receive a fully valid token carrying every RBAC permission
# the Managed Identity has been assigned -- with no separate secret
# to steal, phish, or leak. The token IS the credential, and
# anything on the VM can mint one on demand.

# Mitigation Microsoft's own docs suggest -- a LOCAL firewall rule,
# separate from anything RBAC itself can enforce:
# "If it isn't necessary for every process on the VM to access IMDS
#  endpoint, you can set local firewall rules to limit the access...
#  only allowing the specific process(es) to access."
# (exact firewall syntax is OS-specific -- iptables on Linux,
# Windows Firewall rules on Windows -- restricting outbound access
# to 169.254.169.254 to only the application's own process/user)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A VM runs both your trusted application (which needs its Managed Identity\'s Key Vault Secrets User role) and a third-party monitoring agent installed by a different team, with no coordination between the two about IMDS access. The monitoring agent has no legitimate reason to read Key Vault secrets. Does the monitoring agent currently have the technical ability to obtain a token with your application\'s Key Vault access, and if so, what — if anything — in standard Azure RBAC configuration prevents it?',
    hint: 'Check whether the IMDS token endpoint distinguishes between different processes running on the same VM, and whether RBAC role assignments operate at the process level or the identity level.',
    solution: 'Yes — the monitoring agent has the technical ability to obtain the same token, and nothing in standard Azure RBAC configuration prevents it. Per Microsoft\'s own IMDS documentation, "the API is unauthenticated and open to all processes on the VM" — RBAC role assignments are scoped to the Managed Identity itself, not to which specific process on the VM requested the token. Any process capable of making an HTTP request to 169.254.169.254 with the Metadata: true header (which requires no special privilege beyond running on the VM) receives a valid token carrying every permission the identity has been assigned. The only mitigations available are outside RBAC entirely: a local firewall rule restricting which processes/users on the VM can reach the IMDS endpoint (as Microsoft\'s own docs suggest), or avoiding co-locating unrelated/untrusted workloads on the same VM as an identity with sensitive access in the first place.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The "Metadata: true" header on an IMDS request is just a required API convention, similar to a Content-Type header, with no real security purpose.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states it exists specifically "to prevent unintended or unwanted redirection of requests" — a defense against SSRF-style attacks, paired with a requirement that requests must NOT contain an X-Forwarded-For header.'
    },
    {
      thought: 'Since a Managed Identity\'s RBAC role assignments are scoped narrowly, only the specific application the identity was configured for can actually use those permissions.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states the IMDS token endpoint is "unauthenticated and open to all processes on the VM" — any code running on that VM, not just the intended application, can request and receive a token carrying the identity\'s full set of assigned permissions.'
    },
    {
      thought: 'Putting a corporate or debugging HTTP proxy in front of Managed Identity token requests is a safe, standard way to add logging or inspection, the same as it would be for any other outbound HTTP traffic from the VM.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states IMDS "is not intended to be used behind a proxy and doing so is unsupported," and explicitly warns that even an automatically-discovered proxy configuration the operator isn\'t aware of "exposes you to outage risks" for Managed Identity token acquisition specifically.'
    }
  ];
}
