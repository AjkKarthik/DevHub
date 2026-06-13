import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface PathStage { label: string; items: { text: string; route?: string }[]; }
interface LearningPath { audience: string; title: string; duration: string; stages: PathStage[]; }

@Component({
  selector: 'app-sql-learning-paths',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './learning-paths.html',
  styleUrl: './learning-paths.scss',
})
export class SqlLearningPaths {
  paths: LearningPath[] = [
    {
      audience: 'Complete Beginner',
      title: 'SQL from Zero to Productive',
      duration: '3–4 weeks',
      stages: [
        {
          label: 'Stage 1 — Read & Filter Data',
          items: [
            { text: 'SQL Basics — SELECT, WHERE, ORDER BY, NULL', route: '/sql/basics' },
            { text: 'Practice: Cheat Sheet (SELECT / WHERE section)', route: '/sql/cheatsheet' },
            { text: 'Quiz: basics questions', route: '/sql/quiz-practice' },
          ],
        },
        {
          label: 'Stage 2 — Combine Tables',
          items: [
            { text: 'Joins — INNER, LEFT, FULL OUTER, CROSS', route: '/sql/joins' },
            { text: 'Aggregations — GROUP BY, HAVING, COUNT/SUM/AVG', route: '/sql/aggregations' },
            { text: 'Practice: Cheat Sheet (Joins + Aggregates sections)', route: '/sql/cheatsheet' },
          ],
        },
        {
          label: 'Stage 3 — Build Real Queries',
          items: [
            { text: 'Subqueries — EXISTS, IN, correlated', route: '/sql/subqueries' },
            { text: 'CTEs — WITH clause, recursive CTEs', route: '/sql/ctes' },
            { text: 'Mini project: e-commerce schema walkthrough', route: '/sql/mini-projects' },
          ],
        },
        {
          label: 'Stage 4 — Reinforce',
          items: [
            { text: 'Common Errors — avoid the top SQL mistakes', route: '/sql/errors' },
            { text: 'Glossary — learn the terminology', route: '/sql/glossary' },
            { text: 'Quiz Practice — all basics topics', route: '/sql/quiz-practice' },
          ],
        },
      ],
    },
    {
      audience: 'Data Analyst',
      title: 'SQL for Analytics & Reporting',
      duration: '4–5 weeks',
      stages: [
        {
          label: 'Stage 1 — Fundamentals Refresh',
          items: [
            { text: 'SQL Basics — quick refresh', route: '/sql/basics' },
            { text: 'Joins — INNER, LEFT, FULL OUTER, self-join', route: '/sql/joins' },
            { text: 'Aggregations — GROUP BY, HAVING, ROLLUP', route: '/sql/aggregations' },
          ],
        },
        {
          label: 'Stage 2 — Advanced Query Patterns',
          items: [
            { text: 'CTEs — multi-CTE and recursive patterns', route: '/sql/ctes' },
            { text: 'Window Functions — ROW_NUMBER, LAG, LEAD, running totals', route: '/sql/window-functions' },
            { text: 'Subqueries — correlated, derived tables', route: '/sql/subqueries' },
          ],
        },
        {
          label: 'Stage 3 — Performance Awareness',
          items: [
            { text: 'Indexes — understand plans and sargability', route: '/sql/indexes' },
            { text: 'Query Performance — EXPLAIN, anti-patterns', route: '/sql/performance' },
            { text: 'Cheat Sheet — window functions reference', route: '/sql/cheatsheet' },
          ],
        },
        {
          label: 'Stage 4 — Real-World Practice',
          items: [
            { text: 'Mini Projects — analytics event log walkthrough', route: '/sql/mini-projects' },
            { text: 'Decision Guides — CTE vs subquery, IN vs EXISTS', route: '/sql/decision-guides' },
            { text: 'Interview Prep — mid-level analytics questions', route: '/sql/interview-prep' },
          ],
        },
      ],
    },
    {
      audience: 'Backend Developer',
      title: 'SQL for Application Development',
      duration: '4–5 weeks',
      stages: [
        {
          label: 'Stage 1 — Schema & Query Fundamentals',
          items: [
            { text: 'Schema Design — normalisation, constraints, data types', route: '/sql/schema-design' },
            { text: 'SQL Basics + Joins — reading and joining data', route: '/sql/basics' },
            { text: 'Aggregations + CTEs — reporting patterns', route: '/sql/aggregations' },
          ],
        },
        {
          label: 'Stage 2 — Programmatic SQL',
          items: [
            { text: 'Stored Procedures — params, TRY/CATCH, UDFs vs iTVFs', route: '/sql/stored-procedures' },
            { text: 'Transactions — ACID, isolation levels, deadlock handling', route: '/sql/transactions' },
            { text: 'JSON Features — OPENJSON, FOR JSON, jsonb', route: '/sql/json-features' },
          ],
        },
        {
          label: 'Stage 3 — Performance & Indexing',
          items: [
            { text: 'Indexes — clustered, covering, composite, sargability', route: '/sql/indexes' },
            { text: 'Query Performance — execution plans, anti-patterns', route: '/sql/performance' },
            { text: 'Common Errors — N+1, implicit conversions, NOT IN pitfalls', route: '/sql/errors' },
          ],
        },
        {
          label: 'Stage 4 — Production Readiness',
          items: [
            { text: 'Design Patterns — soft delete, audit trail, upsert, RLS', route: '/sql/design-patterns' },
            { text: 'Decision Guides — surrogate vs natural key, MSSQL vs PG', route: '/sql/decision-guides' },
            { text: 'Interview Prep — senior developer questions', route: '/sql/interview-prep' },
          ],
        },
      ],
    },
    {
      audience: 'DBA / Senior',
      title: 'SQL Mastery — DBA Track',
      duration: '6–8 weeks',
      stages: [
        {
          label: 'Stage 1 — Deep Dive: Internals',
          items: [
            { text: 'Indexes — B-trees, fragmentation, statistics, DMVs', route: '/sql/indexes' },
            { text: 'Transactions — MVCC, SNAPSHOT isolation, RCSI, deadlocks', route: '/sql/transactions' },
            { text: 'Query Performance — plan reading, STATISTICS IO, EXPLAIN ANALYZE', route: '/sql/performance' },
          ],
        },
        {
          label: 'Stage 2 — Schema & Procedures',
          items: [
            { text: 'Schema Design — normalisation, data types, partitioning', route: '/sql/schema-design' },
            { text: 'Stored Procedures — parameter sniffing, inline TVFs, dynamic SQL', route: '/sql/stored-procedures' },
            { text: 'Window Functions — running totals, ranking, frames', route: '/sql/window-functions' },
          ],
        },
        {
          label: 'Stage 3 — Advanced Features',
          items: [
            { text: 'CTEs — recursive, multi-step, CTE in DML', route: '/sql/ctes' },
            { text: 'JSON Features — OPENJSON, FOR JSON, jsonb, GIN indexes', route: '/sql/json-features' },
            { text: 'Design Patterns — temporal tables, RLS, partitioning', route: '/sql/design-patterns' },
          ],
        },
        {
          label: 'Stage 4 — Real-World Projects',
          items: [
            { text: 'All 4 mini projects — schema design + operational queries', route: '/sql/mini-projects' },
            { text: 'Decision Guides — all 8 comparisons', route: '/sql/decision-guides' },
            { text: 'Interview Prep — senior / DBA-level questions', route: '/sql/interview-prep' },
          ],
        },
      ],
    },
  ];
}
