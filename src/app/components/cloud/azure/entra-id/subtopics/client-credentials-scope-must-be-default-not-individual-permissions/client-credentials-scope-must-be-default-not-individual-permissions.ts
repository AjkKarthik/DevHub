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
  templateUrl: './client-credentials-scope-must-be-default-not-individual-permissions.html',
  styleUrl: './client-credentials-scope-must-be-default-not-individual-permissions.scss'
})
export class ClientCredentialsScopeMustBeDefaultNotIndividualPermissionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own client credentials example uses .default without ever explaining it\'s the only valid option',
      points: [
        'The main page\'s own "OAuth2 Client Credentials Flow" codeTab requests -d "scope=https://management.azure.com/.default" — and its QnA describes .default as something you "use... for Client Credentials Flow where you want all configured Application permissions," phrasing it as a choice among alternatives rather than a hard requirement of the flow itself.',
        'This reads as if requesting a narrower, individual scope (e.g. https://management.azure.com/ReadOnly) is also a valid option for this flow, just a less common one. It isn\'t — there is no individual-scope alternative for client credentials at all.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own protocol reference: .default isn\'t optional, and multi-resource requests are explicitly rejected',
      points: [
        'Per Microsoft\'s own client credentials flow documentation: "The value passed for the scope parameter in this request should be the resource identifier (application ID URI) of the resource you want, suffixed with .default... This value tells the Microsoft identity platform that of all the direct application permissions you have configured for your app, the endpoint should issue a token for the ones associated with the resource you want to use."',
        'There is no application-permission equivalent of a delegated-permission individual scope request (like User.Read) in this flow — Application permissions are granted at admin-consent time, all at once, for a given resource. The token request itself cannot narrow that set down to a subset; scope is always all-of-them-for-this-resource, expressed as .default.',
        'Multi-resource requests are explicitly disallowed, not just discouraged: "All scopes included must be for a single resource. Including scopes for multiple resources will result in an error." A daemon that needs tokens for both Microsoft Graph and Azure Resource Manager must make two separate token requests — one per resource, each ending in its own /.default.',
        'Sending anything other than <resource>/.default produces a specific, documented failure — Microsoft\'s own example error response shows exactly this case: "error": "invalid_scope", "error_description": "AADSTS70011: The provided value for the input parameter \'scope\' is not valid. The scope https://foo.microsoft.com/.default is not valid."',
      ]
    },
    {
      heading: 'What this means for how you actually scope down a daemon\'s access',
      points: [
        'Since the token request itself can\'t narrow permissions, the ONLY place to control what a client-credentials app can do is the app registration\'s own configured Application permissions (and the admin consent granted for them) — request exactly the permissions the daemon needs there, not more, since every one of them will be included in every token issued via .default.',
        'This is a meaningfully different mental model from delegated, user-facing scopes, where the app can request a narrow subset per sign-in (e.g. only Mail.Read this time). For client credentials, "least privilege" is enforced entirely at registration/consent time, not at token-request time — there is no equivalent runtime lever.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The only valid scope shape for this flow',
      language: 'bash',
      code: `# This is the ONLY form the scope parameter can take for
# client_credentials -- <resource-app-id-uri>/.default
curl -X POST \\
  "https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials" \\
  -d "client_id=<client-id>" \\
  -d "client_secret=<client-secret>" \\
  -d "scope=https://graph.microsoft.com/.default"

# Trying to request an individual permission scope instead --
# this does NOT work for client credentials:
curl -X POST \\
  "https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials" \\
  -d "client_id=<client-id>" \\
  -d "client_secret=<client-secret>" \\
  -d "scope=https://graph.microsoft.com/Mail.Read"
# Per Microsoft's own docs, a scope that isn't "<resource>/.default"
# for this grant type returns:
# { "error": "invalid_scope",
#   "error_description": "AADSTS70011: The provided value for the
#     input parameter 'scope' is not valid..." }`,
    },
    {
      label: 'Needing two resources means two separate token requests',
      language: 'bash',
      code: `# "All scopes included must be for a single resource. Including
# scopes for multiple resources will result in an error."
# -- so a daemon needing both Graph and ARM access makes TWO calls:

# Token #1: Microsoft Graph
curl -X POST "https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials&client_id=<id>&client_secret=<secret>" \\
  -d "scope=https://graph.microsoft.com/.default"

# Token #2: Azure Resource Manager
curl -X POST "https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials&client_id=<id>&client_secret=<secret>" \\
  -d "scope=https://management.azure.com/.default"

# Each token only carries the app's configured Application
# permissions FOR THAT ONE RESOURCE -- there is no single combined
# token spanning both.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A background service needs read-only access to Microsoft Graph mail data via client credentials. A teammate proposes requesting scope=https://graph.microsoft.com/Mail.Read at token-request time to keep the token narrowly scoped, planning to grant the app the broader Mail.ReadWrite permission in the registration "just in case" but rely on the narrower scope request to limit what any individual token can actually do. Will this design work as intended?',
    hint: 'Check what values the scope parameter actually accepts for the client_credentials grant type, and where "least privilege" is actually enforced for this flow.',
    solution: 'No — this design does not work. The client_credentials grant type only accepts <resource>/.default as its scope value; requesting an individual permission like Mail.Read returns an AADSTS70011 invalid_scope error, per Microsoft\'s own documentation. There is no way to request a narrower subset of permissions at token-request time for this flow — every token issued via .default includes ALL of the app\'s configured, admin-consented Application permissions for that resource. If the goal is least privilege, the fix is granting only Mail.Read (not the broader Mail.ReadWrite) as the app\'s actual configured permission in the app registration — that is the only lever available, since scoping down happens entirely at registration/consent time, not at token-request time.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'For the client credentials flow, requesting a specific permission scope (like Mail.Read) instead of .default lets you get a token narrowly limited to just that permission, even if the app has broader permissions configured.',
      reality: 'Per this subtopic\'s theory, .default is the only valid scope value for this grant type — Microsoft\'s own docs confirm a non-.default scope returns an AADSTS70011 invalid_scope error. Narrowing what a token can do can only be done by narrowing the app\'s configured Application permissions themselves, not by the scope parameter at request time.'
    },
    {
      thought: 'A single client credentials token request can include scopes for multiple resources (e.g. both Graph and Azure Resource Manager) if you list them together.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own docs state plainly: "All scopes included must be for a single resource. Including scopes for multiple resources will result in an error." Each resource requires its own separate token request.'
    },
    {
      thought: '.default is just a convenience shortcut for client credentials flow — you could alternatively spell out each individual Application permission scope if you wanted more explicit control.',
      reality: 'Per this subtopic\'s theory, .default is not a convenience shortcut with an equivalent alternative — it is the only value the protocol accepts for this grant type. There is no individual-scope form of an Application permission request at all.'
    }
  ];
}
