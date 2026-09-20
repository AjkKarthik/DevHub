import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-kc-drift',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './debezium-config-drift-and-wal-level.html',
  styleUrl: './debezium-config-drift-and-wal-level.scss'
})
export class DebeziumConfigDriftAndWalLevelSubtopic {
  topicLabel = 'Kafka Connect';
  topicRoute = '/messaging/kafka-connect';

  theory: TheoryPoint[] = [
    {
      heading: 'A property that no longer exists',
      points: [
        'The Debezium Postgres example set both <code>database.server.name</code> and <code>topic.prefix</code>. In Debezium 2.0 the <code>database.server.name</code> property was renamed to <code>topic.prefix</code> for the MySQL, PostgreSQL and SQL Server connectors, a breaking change that meant editing every connector configuration when upgrading.',
        'The example\'s own comment shows the topic names come from the prefix (<code>shop.public.orders</code>). The old property was a leftover from the 1.x era and does nothing useful next to it. Copying old snippets into a 2.x deployment is exactly how this kind of stale key spreads.',
        'When a Connect configuration has a property you cannot find in the current connector documentation, treat it as suspect rather than harmless.'
      ]
    },
    {
      heading: 'wal_level: the default is replica, not minimal',
      points: [
        'The second mistake block said the default Postgres config has <code>wal_level = minimal</code>. The PostgreSQL documentation says the default is <code>replica</code>. The three values are minimal, replica and logical, and logical adds the information needed to extract logical change sets from the WAL.',
        'Debezium needs logical decoding, so the setting must be <code>logical</code>. The parameter can only be set at server start, so switching it means a restart of the database, which is worth planning before the first connector deploy.',
        'The block also implied you must create the replication slot by hand. Debezium\'s documentation says that by default, when the connector starts it creates the configured replication slot if it does not exist and its database user has the required privileges. Creating it yourself is optional.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: a small config check',
      language: 'typescript',
      code: `const RENAMED: Record<string, string> = { 'database.server.name': 'topic.prefix' };

function checkConnector(config: Record<string, string>, walLevel: string): string[] {
  const problems: string[] = [];
  for (const [oldKey, newKey] of Object.entries(RENAMED)) {
    if (oldKey in config) problems.push(oldKey + ' was renamed to ' + newKey + ' in Debezium 2.0');
  }
  if (!('topic.prefix' in config)) problems.push('topic.prefix is missing');
  if (walLevel !== 'logical') problems.push('wal_level is ' + walLevel + ', logical decoding needs logical');
  return problems;
}

// The old example config on a default Postgres (wal_level = replica):
console.log(checkConnector({ 'database.server.name': 'shop', 'topic.prefix': 'shop' }, 'replica'));
// [ 'database.server.name was renamed to topic.prefix in Debezium 2.0',
//   'wal_level is replica, logical decoding needs logical' ]

console.log(checkConnector({ 'topic.prefix': 'shop' }, 'logical'));   // [ ]`
    },
    {
      label: 'Postgres setup',
      language: 'bash',
      code: `-- postgresql.conf: the default is replica; logical is required, and needs a restart
wal_level = logical

-- Check it from psql
SHOW wal_level;        -- logical

-- Optional: Debezium creates its slot itself by default. To create it manually instead:
SELECT pg_create_logical_replication_slot('debezium', 'pgoutput');`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'You deploy the page\'s old Debezium Postgres config to a fresh, default PostgreSQL server. Name two things wrong, and whether you must run <code>pg_create_logical_replication_slot</code> yourself.',
    hint: 'One is a renamed connector property, the other is a database setting with a default you might assume is different.',
    solution: 'The config still carries database.server.name, which Debezium 2.0 renamed to topic.prefix, so the stale key should be removed. And the server\'s wal_level is the default replica, not logical, so logical decoding is not available until you set wal_level = logical and restart PostgreSQL. You do not have to create the replication slot manually: Debezium creates it by default if its user has the privileges, so the manual call is optional.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A default PostgreSQL has <code>wal_level = minimal</code>.',
      reality: 'The default is <code>replica</code>. Debezium needs <code>logical</code>, which requires a server restart to apply.'
    },
    {
      thought: 'I have to create the Debezium replication slot manually.',
      reality: 'By default Debezium creates the configured slot itself when the connector starts, provided its database user has the required privileges.'
    },
    {
      thought: 'Old properties in a connector config are harmless leftovers.',
      reality: 'They signal a config copied from an older version. <code>database.server.name</code> became <code>topic.prefix</code> in Debezium 2.0, and stale keys are how upgrades go wrong.'
    }
  ];
}
