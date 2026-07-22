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
  templateUrl: './scm-basic-auth-is-a-separate-attack-surface-from-kudu.html',
  styleUrl: './scm-basic-auth-is-a-separate-attack-surface-from-kudu.scss'
})
export class ScmBasicAuthIsASeparateAttackSurfaceFromKuduSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own quickRef names Kudu as a management dashboard — but never once discusses how it authenticates, or that the main page\'s own security mistake entry doesn\'t cover it',
      points: [
        'The main page\'s own quickRef states: "Kudu: The App Service SCM (Source Control Manager) dashboard at <app>.scm.azurewebsites.net — log streaming, console, process explorer, deployment history." This introduces a powerful management surface — including a live console — with zero mention of who can access it or how.',
        'The main page\'s own mistake entry #4 covers securing SECRETS (Key Vault references instead of plaintext), but the DEPLOYMENT credentials that can reach Kudu itself — and through it, a live console on the app\'s own filesystem — are a separate, unaddressed attack surface.',
      ]
    },
    {
      heading: 'SCM/Kudu access is gated by its own Basic Authentication toggle, separate from the app\'s own auth, with a real dependency and per-deployment-method consequences',
      points: [
        'Per Microsoft\'s own documentation, this access is controlled by a dedicated, independent flag: "For other deployment methods that use basic authentication, such as Visual Studio, local Git, and GitHub, basic authentication is controlled by the basicPublishingCredentialsPolicies/scm flag or the SCM Basic Auth Publishing Credentials portal option." This is a username/password credential pair, entirely separate from any authentication configured on the application itself.',
        'A real, easy-to-miss dependency exists between the SCM and FTP toggles: "SCM basic authentication is required for enabling FTP basic authentication." Disabling SCM basic auth while leaving FTP enabled does not actually leave FTP access open — FTP basic auth cannot function without SCM basic auth also being enabled.',
        'Microsoft explicitly recommends moving away from this toggle entirely: "Enterprises often require more secure deployment methods than basic authentication, such as Microsoft Entra ID. Microsoft Entra OAuth 2.0 access tokens have a limited usable lifetime, are specific to the applications and resources they\'re issued for, and can\'t be reused. OAuth token-based authorization helps mitigate many problems with basic authentication."',
        'Disabling SCM basic auth has genuinely different consequences per deployment method, not a uniform "everything breaks" outcome: per Microsoft\'s own compatibility table, Azure CLI 2.48.1+ commands like az webapp deploy "fall back to Microsoft Entra authentication" automatically (no workflow change needed), Azure Pipelines with the AzureWebApp task "Works" unaffected, but Local Git, FTP, and GitHub Actions using the App Service build service simply "Doesn\'t work" with no automatic fallback — each deployment method the main page\'s own theory lists needs to be checked individually against this table before disabling basic auth broadly.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Disabling SCM and FTP basic auth',
      language: 'bash',
      code: `# Disable SCM basic auth (blocks Kudu console/API, Local Git,
# Visual Studio publish-profile deploy, older CLI versions)
az resource update \\
  --resource-group my-rg --name scm --namespace Microsoft.Web \\
  --resource-type basicPublishingCredentialsPolicies \\
  --parent sites/my-webapp-unique --set properties.allow=false

# Disable FTP basic auth too
az resource update \\
  --resource-group my-rg --name ftp --namespace Microsoft.Web \\
  --resource-type basicPublishingCredentialsPolicies \\
  --parent sites/my-webapp-unique --set properties.allow=false

# Per Microsoft's own docs: "SCM basic authentication is required
# for enabling FTP basic authentication" -- disabling SCM alone
# already renders FTP basic auth non-functional even before
# explicitly disabling the FTP flag too.

# Confirm SCM is actually blocked
curl -u deploy-user:deploy-pass \\
  https://my-webapp-unique.scm.azurewebsites.net/api/settings
# Expect: 401 Unauthorized (once SCM basic auth is disabled)`,
    },
    {
      label: 'What still works, and what needs a fallback',
      language: 'bash',
      code: `# Azure CLI 2.48.1+ falls back to Microsoft Entra automatically --
# no change needed to this exact command:
az webapp deploy \\
  --resource-group my-rg --name my-webapp-unique \\
  --type zip --src-path ./publish.zip
# Per Microsoft's own docs, this command "fall[s] back to Microsoft
# Entra authentication" once basic auth is disabled -- it keeps
# working as long as the caller has appropriate RBAC permissions.

# GitHub Actions using the OLDER "App Service build service"
# integration breaks with no fallback -- per Microsoft's own docs
# it simply "Doesn't work." The fix is reconfiguring the GitHub
# Actions workflow to use a service principal or OpenID Connect
# (federated identity) instead of the old publish-profile secret:
az ad sp create-for-rbac --name "github-actions-deploy" \\
  --role contributor \\
  --scopes /subscriptions/{sub}/resourceGroups/my-rg \\
  --sdk-auth
# -- then reconfigure the workflow's auth step to use OIDC/service
# principal credentials instead of a basic-auth publish profile.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security team asks a developer to disable FTP access to their App Service app, since it\'s an old, rarely-used deployment path. The developer disables the FTP Basic Auth Publishing Credentials toggle in the portal, leaving SCM Basic Auth Publishing Credentials enabled (since GitHub Actions still needs it). Using this subtopic\'s theory, does this actually leave the Kudu console and API reachable via username/password?',
    hint: 'Per Microsoft\'s own documentation, is FTP basic auth an independent toggle, or does it depend on SCM basic auth also being enabled?',
    solution: 'Per this subtopic\'s theory, yes — leaving SCM Basic Auth Publishing Credentials enabled means the Kudu console and API remain fully reachable via username/password, completely independent of the FTP toggle the developer just disabled. Microsoft\'s own documentation confirms these are two separate flags — "basic authentication is controlled by the basicPublishingCredentialsPolicies/ftp flag" for FTP, and "the basicPublishingCredentialsPolicies/scm flag" for "Visual Studio, local Git, and GitHub" — SCM auth governs Kudu access specifically, not FTP. The dependency runs only in the OTHER direction: "SCM basic authentication is required for enabling FTP basic authentication," meaning disabling SCM would have also broken FTP, but disabling only FTP has zero effect on SCM/Kudu access. If the security team\'s actual goal was reducing the attack surface of the live Kudu console specifically, disabling only FTP accomplished nothing toward that goal — SCM basic auth (and the console it protects) is a genuinely separate toggle that needed its own explicit decision.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Disabling FTP Basic Auth Publishing Credentials also blocks basic-auth access to the Kudu console and SCM API, since they\'re both "deployment credentials."',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms these are independent flags — FTP is controlled by basicPublishingCredentialsPolicies/ftp, while Kudu/SCM access is controlled by the separate basicPublishingCredentialsPolicies/scm flag; disabling one has no effect on the other.'
    },
    {
      thought: 'Disabling SCM/Kudu basic authentication breaks every deployment method equally, requiring a full deployment pipeline overhaul before it can be safely turned off.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own compatibility table shows genuinely different outcomes per method — modern Azure CLI versions and Azure Pipelines with the AzureWebApp task keep working via automatic Microsoft Entra fallback with zero workflow changes, while Local Git, FTP, and the older GitHub Actions build-service integration break outright and need reconfiguration.'
    },
    {
      thought: 'The Kudu dashboard\'s username/password credentials are the same as, or tied to, the app\'s own end-user authentication system.',
      reality: 'Per this subtopic\'s theory, SCM basic auth deployment credentials are entirely separate from any authentication configured on the application itself — they authenticate access to the App Service management/deployment surface (Kudu console, deployment APIs), not to the running web application\'s own users.'
    }
  ];
}
