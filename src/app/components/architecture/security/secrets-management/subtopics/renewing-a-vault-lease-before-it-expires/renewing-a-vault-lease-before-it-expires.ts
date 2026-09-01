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
    heading: 'The Quiz Names the Pattern — Renew Before Expiry, Not React After Failure',
    points: [
      'The quiz\'s own explanation states the operational responsibility precisely: "the standard pattern is to renew the lease well before expiry... rather than letting a credential expire and reactively handling a failed connection." No codeTab on the page ever implements a renewal loop.',
      'Vault\'s own HTTP API exposes exactly this: <code>POST /v1/sys/leases/renew</code>, taking a <code>lease_id</code> and an optional <code>increment</code> (seconds), returning a NEW <code>lease_duration</code> — the lease is extended, not replaced with a new credential.',
      'A dynamic secret\'s response includes its own <code>lease_id</code> and <code>lease_duration</code> at issue time — a renewal loop needs to track both, since the renewal interval should be calculated relative to the ACTUAL duration Vault granted, not an assumed fixed value.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Fetching a Dynamic Secret and Tracking Its Lease',
    language: 'typescript',
    code: `interface VaultLeaseInfo {
  lease_id: string;
  lease_duration: number; // seconds
  renewable: boolean;
  data: Record<string, string>; // e.g. { username, password }
}

async function fetchDynamicDbCredential(vaultAddr: string, vaultToken: string): Promise<VaultLeaseInfo> {
  const res = await fetch(\`\${vaultAddr}/v1/database/creds/readonly-role\`, {
    headers: { 'X-Vault-Token': vaultToken },
  });
  const body = await res.json();
  return {
    lease_id: body.lease_id,
    lease_duration: body.lease_duration,
    renewable: body.renewable,
    data: body.data,
  };
}

// The application stores the CURRENT lease, not just the credential --
// renewal needs the lease_id, and the credential values themselves
// never change on a successful renewal (only the expiry does).
let currentLease: VaultLeaseInfo | null = null;`,
  },
  {
    label: 'The Renewal Loop: Renew Before Expiry, Not After Failure',
    language: 'typescript',
    code: `async function renewLease(vaultAddr: string, vaultToken: string, leaseId: string): Promise<number> {
  const res = await fetch(\`\${vaultAddr}/v1/sys/leases/renew\`, {
    method: 'POST',
    headers: { 'X-Vault-Token': vaultToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ lease_id: leaseId }),
  });
  const body = await res.json();
  return body.lease_duration; // the NEW duration granted by this renewal
}

async function startLeaseRenewalLoop(vaultAddr: string, vaultToken: string) {
  currentLease = await fetchDynamicDbCredential(vaultAddr, vaultToken);
  scheduleNextRenewal(vaultAddr, vaultToken);
}

function scheduleNextRenewal(vaultAddr: string, vaultToken: string) {
  if (!currentLease) return;

  // Renew at roughly 2/3 of the lease duration -- well BEFORE expiry,
  // matching the quiz's own "renew-before-expiry, not renew-after-
  // failure" principle. A credential with a 1-hour lease gets renewed
  // around the 40-minute mark, leaving comfortable margin.
  const renewInMs = (currentLease.lease_duration * 1000 * 2) / 3;

  setTimeout(async () => {
    if (!currentLease) return;
    try {
      const newDuration = await renewLease(vaultAddr, vaultToken, currentLease.lease_id);
      currentLease.lease_duration = newDuration;
      scheduleNextRenewal(vaultAddr, vaultToken); // schedule the NEXT renewal too
    } catch (err) {
      // Renewal failed (Vault may cap total renewable lifetime) --
      // fetch a completely FRESH credential instead of retrying
      // renewal indefinitely.
      currentLease = await fetchDynamicDbCredential(vaultAddr, vaultToken);
      scheduleNextRenewal(vaultAddr, vaultToken);
    }
  }, renewInMs);
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A credential is issued with <code>lease_duration: 3600</code> (1 hour). The renewal loop renews it successfully, and Vault\'s response for THAT renewal returns <code>lease_duration: 1800</code> (30 minutes) — a shorter value than the original. What should the NEXT renewal timer be based on?',
  hint: 'The codeTab reads <code>currentLease.lease_duration</code> when scheduling each renewal — does it use the ORIGINAL 3600 value, or something else?',
  solution: `// The next renewal timer should be based on the NEW value, 1800
// seconds -- and the codeTab above already does this correctly: it
// updates currentLease.lease_duration to the renewal response's own
// value BEFORE calling scheduleNextRenewal() again.

// This matters because Vault can grant a SHORTER duration on renewal
// than the original issuance -- often because the secret engine or
// mount has a maximum total lease lifetime (max_ttl), and Vault caps
// each successive renewal to stay within that ceiling as the
// credential approaches its absolute expiry.

// A renewal loop that kept using the ORIGINAL 3600-second value for
// every future timer -- instead of the actual duration each renewal
// granted -- would eventually schedule its next renewal AFTER the
// credential had already expired, defeating the entire point of
// renewing proactively.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Renewing a lease is the same operation as fetching a brand-new credential.',
    reality: '<code>POST /v1/sys/leases/renew</code> extends the EXISTING credential\'s expiry — the username/password values themselves stay exactly the same. Fetching a new credential (<code>GET /v1/database/creds/...</code>) issues a COMPLETELY DIFFERENT credential with its own new lease_id. The codeTab above only falls back to fetching a new one if renewal itself fails.',
  },
  {
    thought: 'A dynamic secret\'s lease can be renewed indefinitely, forever, as long as the application keeps calling the renew endpoint.',
    reality: 'Vault mounts typically configure a maximum total lease lifetime (<code>max_ttl</code>) — renewal calls extend the lease but cannot push it past that ceiling. Once the maximum is reached, renewal itself starts failing, which is exactly why the codeTab\'s renewal loop falls back to fetching an entirely fresh credential when a renewal attempt errors.',
  },
  {
    thought: 'The renewal timer should be scheduled at a fixed interval (e.g. every 10 minutes) regardless of the actual lease duration.',
    reality: 'It should be a FRACTION of the ACTUAL granted duration (the codeTab uses roughly 2/3) — a fixed interval would either renew needlessly often for a long-lived lease, or fail to renew in time for a short-lived one, exactly the scenario the Try It traces when a renewal grants a shorter duration than expected.',
  },
];

@Component({
  selector: 'app-sec-secrets-lease-renew',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './renewing-a-vault-lease-before-it-expires.html',
  styleUrl: './renewing-a-vault-lease-before-it-expires.scss',
})
export class RenewingAVaultLeaseBeforeItExpiresSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
