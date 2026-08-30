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
  templateUrl: './azure-sql-long-term-retention-goes-to-10-years-beyond-pitr.html',
  styleUrl: './azure-sql-long-term-retention-goes-to-10-years-beyond-pitr.scss'
})
export class AzureSqlLongTermRetentionGoesTo10YearsBeyondPitrSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own PITR bullet implies a 35-day ceiling on how far back Azure SQL backups reach',
      points: [
        'The main page\'s own theory states: "PITR (Point-in-Time Restore): Azure SQL retains transaction log backups enabling restore to any second within the retention window (7–35 days)." Read on its own, this is the only backup retention mechanism the main page mentions for Azure SQL — implying 35 days is the practical ceiling for how far back a restore can reach.',
        'It isn\'t. Azure SQL has a completely separate backup mechanism, sitting alongside PITR rather than replacing it, specifically designed for retention far beyond what PITR\'s transaction-log-based restore was ever meant to cover.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own documentation: Long-Term Retention reaches up to 10 years, built on top of the same PITR backups',
      points: [
        'Per Microsoft\'s own Long-Term Retention (LTR) overview: "Long-term retention can be configured for up to 10 years on backups for Azure SQL Database (including in the Hyperscale service tier) and Azure SQL Managed Instance." This directly addresses "regulatory, compliance, or other business reasons that require you to retain database backups beyond the 1-35 days provided by the short-term retention period of automatic backups."',
        'LTR isn\'t a separate backup pipeline — it reuses the same full backups PITR already creates: "Long-term backup retention (LTR) relies on the full database backups that are automatically created by the Azure SQL service... automated backups are copied to different blobs for long-term storage." Configuring LTR doesn\'t change how PITR itself works; it adds a second, much longer-lived copy of the same underlying backup data.',
        'LTR policy is configured with four parameters — weekly (W), monthly (M), yearly (Y) retention counts, plus a WeekOfYear anchor — each controlling how long a specific cadence of backup is kept, and these can be combined: a weekly backup kept for 12 weeks, the first backup of each month kept for 12 months, and the backup from a specific week of the year kept for 10 years, all from the same policy.',
      ]
    },
    {
      heading: 'Operational realities that don\'t apply to ordinary PITR',
      points: [
        'The timing isn\'t something you control: "The timing of individual LTR backups is controlled by Microsoft. You can\'t manually create an LTR backup or control the timing of the backup creation. After you configure an LTR policy, it might take up to seven days before the first LTR backup shows up on the list of available backups." A team enabling LTR expecting an immediate long-term backup to exist needs to plan around this week-long lag.',
        'LTR backups genuinely outlive the resources that created them: "If you delete a logical server or a SQL managed instance, all databases on that server or managed instance are also deleted... However, if you had configured LTR for a database, LTR backups aren\'t deleted." This is a meaningfully different guarantee from PITR, which is tied to the live database and server.',
        'LTR restore has its own scope constraint the main page\'s existing PITR/failover-group coverage doesn\'t need to worry about: "The database can be restored to any existing server or managed instance under the same subscription as the original database" — cross-subscription LTR restore isn\'t supported, and restoring between the Hyperscale tier and other service tiers isn\'t supported either.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Configuring an LTR policy alongside existing PITR',
      language: 'bash',
      code: `# PITR (the main page's own coverage) needs no extra configuration
# beyond the database's existing retention window (7-35 days) --
# it's automatic. LTR is a SEPARATE, additional policy:

az sql db ltr-policy set \\
  --resource-group my-rg --server my-sql-server --name my-db \\
  --weekly-retention P12W \\
  --monthly-retention P12M \\
  --yearly-retention P10Y \\
  --week-of-year 20
# Reading this policy: each weekly backup is kept 12 weeks, except
# the first backup of each month (kept 12 months), except the
# backup taken during week 20 of the year (kept 10 years).

# Per Microsoft's own docs, the first LTR backup can take up to
# 7 days to appear after this policy is set -- it is NOT immediate,
# unlike a manual on-demand backup.`,
    },
    {
      label: 'Restoring from an LTR backup vs. a PITR restore',
      language: 'bash',
      code: `# PITR restore -- any second within the 7-35 day window, same
# server, same subscription:
az sql db restore \\
  --dest-name my-db-restored \\
  --name my-db --resource-group my-rg --server my-sql-server \\
  --time "2026-07-15T10:00:00Z"

# LTR restore -- from a backup potentially YEARS old, restored as
# a NEW database (can target a different server, but must stay
# within the same subscription):
az sql db ltr-backup restore \\
  --resource-group my-rg \\
  --dest-database my-db-archival-restore \\
  --dest-server my-sql-server \\
  --ltr-backup-resource-id <backup-resource-id-from-ltr-backup-list>

# Even after deleting the original logical server entirely, LTR
# backups configured on its databases remain restorable -- PITR
# backups do not survive server deletion the same way.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A compliance team asks whether your Azure SQL Database can produce a restorable backup from exactly 3 years ago. Based on the main page\'s own PITR coverage alone ("restore to any second within the retention window, 7–35 days"), this sounds impossible. Is it actually impossible, and if not, what would need to have been configured in advance?',
    hint: 'Check whether Azure SQL has any backup retention mechanism beyond PITR\'s 7-35 day window, and whether it needs to be set up ahead of time or can be requested retroactively.',
    solution: 'It is possible, but only if it was configured in advance — Long-Term Retention (LTR) cannot be requested retroactively for data that\'s already outside the PITR window. Per Microsoft\'s own documentation, LTR "can be configured for up to 10 years" and works by copying the same automated full backups PITR already produces into long-term storage on a schedule defined by a weekly/monthly/yearly policy. If an LTR policy with sufficient yearly retention had been configured at least 3 years ago (and the first backup had time to appear, which itself can take up to 7 days after the policy is set), a 3-year-old backup would be restorable as a new database today. Without LTR configured in advance, PITR\'s 7-35 day window is genuinely the only option, and a 3-year-old restore point would not exist.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Azure SQL Database backups can never be restored from further back than the PITR retention window (7–35 days) — that\'s the practical ceiling for how far back a restore can reach.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation describes Long-Term Retention (LTR) as a separate mechanism reaching "up to 10 years" — it must be configured in advance, but it exists specifically to address exactly this kind of longer-retention requirement.'
    },
    {
      thought: 'Long-Term Retention is a completely separate backup process from the automated backups that power PITR, requiring its own independent backup pipeline.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states LTR "relies on the full database backups that are automatically created by the Azure SQL service" — it reuses the same underlying backups PITR already produces, just copying selected ones into longer-term storage on a separate schedule.'
    },
    {
      thought: 'If you delete the logical server hosting an Azure SQL database, all backup history for that database — including any long-term backups — is lost along with it, the same way PITR backups are.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states the opposite for LTR specifically: "if you had configured LTR for a database, LTR backups aren\'t deleted" when the server is deleted — they remain restorable to a different server or managed instance in the same subscription.'
    }
  ];
}
