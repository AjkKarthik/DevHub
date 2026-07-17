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
  templateUrl: './groupby-silently-drops-nan-keys-by-default.html',
  styleUrl: './groupby-silently-drops-nan-keys-by-default.scss'
})
export class GroupbySilentlyDropsNanKeysByDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'groupby() does not give NaN its own group by default — it removes those rows entirely',
      points: [
        'The main page\'s own theory describes groupby(by).agg(func) as Pandas\' "SQL GROUP BY," implying a fairly direct analogy — but SQL\'s GROUP BY and Pandas\' default groupby() diverge in exactly this case. Pandas\' own documentation for the dropna parameter states the default plainly: "dropna : bool, default True — If True, and if group keys contain NA values, NA values together with row/column will be dropped."',
        'The word "dropped" here means something more specific than it might first sound: rows whose groupby key is NaN are not placed into their own "NaN" group the way SQL\'s GROUP BY would keep a NULL-keyed group — they are excluded from EVERY group and from the aggregation entirely. Pandas\' own documented example demonstrates this directly: grouping a DataFrame containing a row with b=None by column "b" and summing produces an output where that row\'s data simply never appears anywhere in the result, under any key.',
        'This means a completely ordinary-looking df.groupby("category").sum() can silently produce totals that under-count reality, purely because some rows have a missing "category" value — with no error, no warning printed by default, and no visible "NaN" row in the output to signal that anything was excluded. The output simply looks like a complete, correct grouped summary of the data.',
      ]
    },
    {
      heading: 'dropna=False is the documented opt-in — but it changes the default for the WHOLE groupby call',
      points: [
        'Pandas\' own documentation states the alternative directly: "If False, NA values will also be treated as the key in groups" — passing dropna=False to groupby() causes NaN-keyed rows to form their own explicit group (appearing in the output, typically labeled NaN), rather than vanishing. This is the documented, correct way to include them when that\'s actually the intent.',
        'The main page\'s own theory on missing data explains that "NaN propagates in arithmetic... but is excluded from most aggregations (df.mean() ignores NaN by default)" — describing NaN\'s behavior WITHIN a column\'s VALUES during aggregation. groupby()\'s dropna default is a related but genuinely separate mechanism: it is about NaN appearing in the GROUPING KEY column, not the values being aggregated, and the two defaults (aggregation ignores NaN values; groupby excludes NaN keys) can compound in the same pipeline without either one warning about the other.',
        'The practical discipline this implies: before trusting a groupby().agg() result as a complete picture of the data, check whether the grouping key column(s) actually contain any NaN values at all (df["category"].isna().sum()) — if they do, and those rows matter for the analysis, either clean/impute the key column first, or pass dropna=False explicitly and treat the resulting "NaN" group as a real, meaningful bucket rather than assuming a grouped summary always accounts for 100% of the original rows.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A groupby total that silently omits NaN-keyed rows',
      language: 'typescript',
      code: `import pandas as pd
import numpy as np

df = pd.DataFrame({
    "category": ["A", "B", "A", np.nan, "B", np.nan],
    "revenue":  [100,  200,  150,  999,   50,   777],
})

print(len(df))                    # 6 rows total
print(df["revenue"].sum())        # 2276 -- the TRUE total of all rows

# Default groupby (dropna=True implicitly):
summary = df.groupby("category")["revenue"].sum()
print(summary)
# category
# A    250
# B    250
# Name: revenue, dtype: int64
# -- looks like a complete, clean summary. But add it up:
print(summary.sum())              # 500 -- NOT 2276!
# The two NaN-category rows (999 and 777, totaling 1776) vanished
# entirely -- not shown as their own group, not folded into A or B,
# just silently absent from every group AND from the grand total.
# Nothing here raised a warning or looked visibly "wrong."`,
    },
    {
      label: 'dropna=False recovers the missing rows as their own explicit group',
      language: 'typescript',
      code: `import pandas as pd
import numpy as np

df = pd.DataFrame({
    "category": ["A", "B", "A", np.nan, "B", np.nan],
    "revenue":  [100,  200,  150,  999,   50,   777],
})

# THE FIX: explicitly opt out of the default NaN-key exclusion.
summary_all = df.groupby("category", dropna=False)["revenue"].sum()
print(summary_all)
# category
# A      250
# B      250
# NaN    1776
# Name: revenue, dtype: int64
# -- now every row is accounted for, including an explicit NaN
# group holding the two previously-vanished rows' combined total.

print(summary_all.sum())          # 2276 -- matches the true total

# A defensive habit worth adopting BEFORE trusting any groupby():
missing_keys = df["category"].isna().sum()
if missing_keys > 0:
    print(f"WARNING: {missing_keys} rows have a missing category "
          f"and would be silently excluded by default groupby()")`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A monthly reporting script does monthly_totals = df.groupby("region")["sales"].sum(), then asserts monthly_totals.sum() == df["sales"].sum() as a sanity check before publishing the report. The assertion has always passed in testing but fails for the first time in production, on a real dataset where a recent data-import bug occasionally leaves the "region" column blank (NaN) for a handful of rows. Explain why the assertion fails, using what this subtopic covers, and describe the fix that would make the sanity check itself catch this class of bug earlier and more clearly.',
    hint: 'Per this subtopic\'s theory, does df.groupby("region")["sales"].sum() include the sales figures from rows where "region" is NaN? What does that mean for comparing monthly_totals.sum() against df["sales"].sum(), which DOES include every row regardless of "region"?',
    solution: 'The assertion fails because df.groupby("region")["sales"].sum() silently excludes every row where "region" is NaN, per this subtopic\'s theory — Pandas\' own documented default (dropna=True) drops NA-keyed rows from all groups and the aggregation entirely, rather than folding them into an existing group or their own NaN group. Meanwhile, df["sales"].sum() is a plain column sum with no grouping involved at all, so it includes EVERY row\'s sales value regardless of whether "region" is present or missing. Once the import bug started occasionally leaving "region" blank, those affected rows\' sales figures were still counted in df["sales"].sum() but silently dropped from monthly_totals (the grouped sum) — making the two sides of the assertion genuinely unequal for the first time, exactly when it mattered most. The test data passing previously simply reflects that no NaN region values existed in the test fixtures, not that the code was actually correct in general. The fix that makes this class of bug easier to catch going forward is twofold: first, and most directly, use dropna=False in the groupby call so the grouped sum always accounts for every row (df.groupby("region", dropna=False)["sales"].sum()), making the sanity check assertion meaningful and self-consistent again regardless of missing keys; second, and more diagnostically, replace or supplement the blunt equality assertion with an earlier, explicit check on the raw data itself — assert df["region"].isna().sum() == 0, "found rows with missing region" — so that a data-quality problem like the import bug surfaces as a clear, specifically-worded failure about missing region values, rather than as a numerically mismatched total that gives no hint about WHY the totals disagree.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'df.groupby("col") behaves like SQL\'s GROUP BY, where rows with a NULL/missing key value form their own group in the output, the same way any other distinct key value does.',
      reality: 'This subtopic\'s theory and first code example show Pandas\' actual default (dropna=True) is different from that SQL analogy — rows with a NaN groupby key are excluded from ALL groups and from the aggregation result entirely by default, not placed into their own NaN group, meaning they simply vanish from a grouped summary rather than appearing as a distinct bucket.'
    },
    {
      thought: 'If groupby().sum() silently drops some rows due to missing key values, the resulting total will still look obviously wrong or incomplete, making the issue easy to spot without needing to check for it explicitly.',
      reality: 'This subtopic\'s first code example shows the output of a default groupby().sum() with NaN keys present looks like a perfectly normal, clean, complete summary — there is no visible sign, warning, or unusual formatting indicating that some rows were excluded. The only way to catch it is to independently check for NaN values in the grouping key column, or to compare the grouped total against the ungrouped column total.'
    },
    {
      thought: 'The fact that df.mean() and most other Pandas aggregations already ignore NaN VALUES by default (as covered elsewhere on the main page) means groupby() handling NaN the same general way — by ignoring it — is just the same, single, consistent behavior applied everywhere.',
      reality: 'This subtopic\'s theory shows these are two distinct mechanisms addressing two different things — an aggregation like .mean() ignoring NaN among the VALUES being averaged is a separate, documented default from groupby()\'s dropna parameter governing whether NaN in the GROUPING KEY excludes entire rows from the result. Both defaults happen to lean toward "quietly excluding NaN," but they operate on different parts of the DataFrame and can compound in the same pipeline without either one being aware of the other.'
    }
  ];
}
