import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-python-numpy-pandas',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './numpy-pandas.html',
  styleUrl: './numpy-pandas.scss'
})
export class PythonNumpyPandas {
  readingTime = 25; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'NumPy 1.24+ / Pandas 2.x';
  route = 'py-numpy-pandas'; nextRoute = '/python/scikit-learn'; nextLabel = 'Machine Learning with scikit-learn';

  quickRef: QuickRefItem[] = [
    { name: 'np.array(data, dtype)', type: 'function', desc: 'Create ndarray. dtype=np.float64 etc. np.zeros(shape), np.ones(shape), np.arange(start, stop, step).' },
    { name: 'arr[mask]', type: 'syntax', desc: 'Boolean indexing. mask = arr > 5; arr[mask] returns elements where True. Core NumPy pattern.' },
    { name: 'arr.reshape(shape)', type: 'method', desc: 'Change array shape without copying. -1 infers the missing dimension: arr.reshape(-1, 3).' },
    { name: 'np.dot(a, b) / a @ b', type: 'function', desc: 'Matrix multiplication. @ operator (Python 3.5+). np.linalg.inv(), np.linalg.eig() for linear algebra.' },
    { name: 'pd.read_csv(path)', type: 'function', desc: 'Read CSV into DataFrame. usecols, dtype, parse_dates, chunksize params. pd.read_parquet, pd.read_json, pd.read_sql.' },
    { name: 'df.groupby(col).agg()', type: 'method', desc: 'GroupBy + aggregation. .agg({"col": "sum", "col2": "mean"}). Named aggregations with pd.NamedAgg.' },
    { name: 'pd.merge(left, right, on, how)', type: 'function', desc: 'SQL-style join. how="inner", "left", "right", "outer". on= for same-name key; left_on/right_on for different names.' },
    { name: 'df.pivot_table(values, index, columns)', type: 'method', desc: 'Reshape: rows → index, values → columns, cell = aggregated value. aggfunc default is mean.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'NumPy — Vectorised Computation',
      points: [
        'NumPy arrays are homogeneous, fixed-type, fixed-size arrays stored in contiguous memory. Operations run in compiled C/Fortran code — 10–1000× faster than equivalent Python loops. The key rule: avoid Python loops over arrays; replace them with NumPy vectorised operations (element-wise, broadcasting, universal functions).',
        'Broadcasting: NumPy automatically expands arrays of different shapes for element-wise operations. A (3, 4) array + a (4,) array broadcasts the 1D array along axis 0. Broadcasting rules: trailing dimensions must be equal or one of them must be 1. Shapes are aligned right-to-left. This eliminates many loops and temporary arrays.',
        'Fancy indexing: arr[[0, 2, 5]] selects rows by index list. arr[arr > 0] selects elements where condition is True. arr[condition] = 0 sets elements to 0. Combined: filtered = arr[(arr > 0) & (arr < 10)]. Use & and | for element-wise boolean (not and/or which apply to Python booleans).',
        'Common operations: np.sum(arr, axis=0) sum along columns; axis=1 along rows. np.concatenate([a, b], axis=0) stack vertically. np.vstack, np.hstack. np.unique(arr) deduplication. np.argsort(arr) returns sorted indices. np.where(cond, x, y) element-wise ternary.',
      ]
    },
    {
      heading: 'Pandas — DataFrames for Data Analysis',
      points: [
        'Pandas DataFrame is a 2D labelled data structure — like a spreadsheet with named columns and an index. Each column is a Series (1D). Data can be heterogeneous (int column, str column, float column). The index is a key for row alignment — Pandas aligns by index when combining DataFrames, not by position.',
        'The most important Pandas operations: read_csv/read_parquet, head/info/describe, filter (df[df.age > 18] or df.query("age > 18")), select (df[["col1", "col2"]]), groupby+agg, merge (join), pivot_table, apply (row/column function), to_csv/to_parquet. Master these to cover 90% of data work.',
        'Method chaining: Pandas operations return new DataFrames — chain them: result = (df.query("age > 18").groupby("city").agg(avg_income=("income", "mean")).sort_values("avg_income", ascending=False).head(10)). Use .pipe(fn) to include custom functions in a chain.',
        'Missing data: df.isna() returns a boolean DataFrame. df.fillna(value) or df.fillna(method="ffill") fills. df.dropna() removes rows with any NaN. Check for NaN before operations — NaN propagates in arithmetic (10 + NaN = NaN) but is excluded from most aggregations (df.mean() ignores NaN by default).',
      ]
    },
    {
      heading: 'GroupBy, Merge, and Pivot',
      points: [
        'groupby(by).agg(func) is Pandas\' SQL GROUP BY. Split-Apply-Combine: split by group, apply function to each group, combine results. Named aggregations: .agg(avg_age=("age", "mean"), total=("sales", "sum")). transform(func) returns a Series with same shape as input — useful for group-level normalisation.',
        'merge(left, right, on="id", how="inner") performs SQL JOINs. how="left" = LEFT JOIN, keeping all left rows. how="outer" = FULL OUTER JOIN. Merge on multiple keys: on=["year", "month"]. suffix=("_left", "_right") resolves duplicate column names. pd.concat([df1, df2], axis=0) appends rows (like UNION ALL).',
        'pivot_table(values="sales", index="region", columns="quarter", aggfunc="sum") reshapes data — equivalent to SQL PIVOT. Rows become the index, columns become the column headers, cells are aggregated values. fill_value=0 fills empty cells.',
        'apply(fn, axis=1) applies a function to each row (axis=1) or column (axis=0). Slower than vectorised operations — prefer np.where, .str methods, .dt methods, or groupby().transform() when possible. Use apply for complex row-level logic that cannot be expressed vectorised.',
      ]
    },
    {
      heading: 'Performance and Best Practices',
      points: [
        'Avoid iterrows(): it is 100–1000× slower than vectorised operations. Replace: for row in df.iterrows(): total += row["price"] * row["qty"] → total = (df["price"] * df["qty"]).sum(). If you must iterate, use itertuples() (returns namedtuples, ~10× faster than iterrows).',
        'Read large CSVs in chunks: pd.read_csv(path, chunksize=10000) returns an iterator of DataFrames. Process each chunk and aggregate. Or use Parquet (pd.read_parquet) — Parquet is columnar, compressed, and much faster to read than CSV.',
        'Categorical dtype: df["status"] = df["status"].astype("category") reduces memory for low-cardinality string columns (e.g. 3 values in 1M rows) from 8 bytes/string to 1 byte/row. Categorical operations are also faster. df.memory_usage(deep=True) shows actual memory per column.',
        'Use numpy operations on Series/DataFrame when available: df["col"].values gives the underlying NumPy array — use np.log(df["col"].values) instead of df["col"].apply(math.log). .to_numpy() is the explicit 2.0 API. Prefer built-in Pandas string methods (.str.lower()) over apply(lambda x: x.lower()).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'NumPy',
      language: 'typescript',
      code: `import numpy as np

# Array creation
arr = np.array([1, 2, 3, 4, 5], dtype=np.float64)
matrix = np.zeros((3, 4))           # 3x4 matrix of zeros
eye    = np.eye(3)                   # 3x3 identity
rng    = np.random.default_rng(42)  # reproducible random
data   = rng.normal(0, 1, (100, 10))  # 100×10 standard normal

# Vectorised operations — NO Python loops
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
print(a + b)        # [5, 7, 9]
print(a * b)        # [4, 10, 18]
print(np.sqrt(a))   # [1.  1.41  1.73]

# Broadcasting
matrix = np.ones((3, 4))
row_bias = np.array([1, 2, 3, 4])   # shape (4,) → broadcasts to (3, 4)
result = matrix + row_bias            # each row gets [1, 2, 3, 4] added

# Boolean indexing
scores = np.array([85, 42, 91, 67, 73, 55])
passing = scores[scores >= 60]   # [85, 91, 67, 73]
scores[scores < 60] = 0          # set failing to 0 in-place

# Fancy indexing
idx = np.array([0, 2, 4])
print(scores[idx])   # [85, 91, 73]

# Matrix operations
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])
print(A @ B)            # [[19, 22], [43, 50]] — matrix multiply
print(np.linalg.det(A)) # -2.0
print(np.linalg.inv(A)) # inverse

# axis operations
data2d = np.array([[1, 2, 3], [4, 5, 6]])
print(data2d.sum(axis=0))  # [5, 7, 9]  — sum per column
print(data2d.sum(axis=1))  # [6, 15]    — sum per row
print(data2d.mean(axis=0)) # [2.5, 3.5, 4.5]`
    },
    {
      label: 'Pandas',
      language: 'typescript',
      code: `import pandas as pd
import numpy as np

# Create DataFrame
df = pd.DataFrame({
    "name": ["Alice", "Bob", "Charlie", "Alice", "Bob"],
    "city": ["London", "Paris", "London", "Paris", "London"],
    "sales": [1200, 850, 1400, 960, 720],
    "quarter": ["Q1", "Q1", "Q1", "Q2", "Q2"],
})

# Basic exploration
print(df.head(2))
print(df.info())
print(df.describe())

# Filter
london = df[df["city"] == "London"]
high   = df.query("sales > 1000")

# GroupBy + named aggregation
summary = df.groupby("city").agg(
    total_sales=("sales", "sum"),
    avg_sales=("sales", "mean"),
    count=("name", "count"),
).reset_index()

# Merge — SQL-style JOIN
customers = pd.DataFrame({"name": ["Alice", "Bob"], "tier": ["gold", "silver"]})
merged = pd.merge(df, customers, on="name", how="left")

# Pivot table
pivot = df.pivot_table(values="sales", index="city", columns="quarter",
                       aggfunc="sum", fill_value=0)

# Apply + string operations
df["name_upper"] = df["name"].str.upper()  # no apply needed
df["name_len"] = df["name"].str.len()

# np.where — vectorised conditional
df["tier"] = np.where(df["sales"] > 1000, "high", "standard")

# Method chaining — preferred style
result = (
    df.query("quarter == 'Q1'")
      .groupby("city")
      .agg(total=("sales", "sum"))
      .sort_values("total", ascending=False)
      .head(5)
)

# Read / write
# df = pd.read_csv("data.csv", parse_dates=["date"], dtype={"code": str})
# df.to_parquet("output.parquet", index=False)  # faster than CSV`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using Python loops over arrays instead of vectorised operations',
      wrong: `result = []
for i in range(len(arr)):
    result.append(arr[i] ** 2 + arr[i] * 3)   # 100× slower for large arrays`,
      right: `result = arr ** 2 + arr * 3   # vectorised: runs in C, fast`,
      explanation: 'NumPy operations are implemented in compiled C/Fortran with SIMD optimisation. A Python loop over a NumPy array runs Python bytecode for each element — 10–1000× slower than the equivalent vectorised expression. Whenever you write "for i in range(len(arr))", ask: can this be expressed with NumPy operations?'
    },
    {
      title: 'Using iterrows() for row-level computation',
      wrong: `total = 0
for _, row in df.iterrows():   # 1000× slower than vectorised
    total += row["price"] * row["qty"]`,
      right: `total = (df["price"] * df["qty"]).sum()   # vectorised, fast`,
      explanation: 'df.iterrows() converts each row to a Python dict-like object, adding massive overhead. For simple arithmetic, use vectorised column operations. For complex per-row logic that cannot be vectorised, use df.apply(fn, axis=1) or (faster) itertuples(). Prefer vectorised approaches — they are 100–1000× faster.'
    },
    {
      title: 'Using & instead of and for boolean arrays — or vice versa',
      wrong: `mask = arr > 0 and arr < 10   # ValueError: ambiguous truth value
mask = (arr > 0) & arr < 10   # operator precedence error — parenthesise!`,
      right: `mask = (arr > 0) & (arr < 10)   # element-wise AND — correct
# or:
mask = np.logical_and(arr > 0, arr < 10)`,
      explanation: 'Python\'s and/or operators work on Python booleans and cannot handle element-wise comparison of arrays. For NumPy arrays and Pandas Series: use & (AND), | (OR), ~ (NOT) for element-wise boolean operations. Always wrap each comparison in parentheses: (arr > 0) & (arr < 10) — operator precedence can give unexpected results otherwise.'
    },
    {
      title: 'Chaining assignment — SettingWithCopyWarning',
      wrong: `df[df["age"] > 18]["score"] = 100   # SettingWithCopyWarning — may not modify df!`,
      right: `df.loc[df["age"] > 18, "score"] = 100   # direct loc assignment — always works`,
      explanation: 'df[condition]["col"] = value chains two indexing operations. The first df[condition] may return a copy or a view — undefined behavior. Assigning to a copy silently fails to modify the original df. Use df.loc[mask, "col"] = value for reliable in-place modification. loc uses label-based indexing; iloc uses integer-based indexing.'
    },
  ];

  challenge: Challenge = {
    title: 'Sales Data Analysis',
    language: 'typescript',
    description: 'Given a DataFrame with columns [date, region, product, quantity, price], write: (1) monthly_revenue(df) — group by year-month and return total revenue (quantity*price) per month sorted descending. (2) top_products(df, n=5) — return top-n products by total revenue. (3) regional_summary(df) — pivot table: rows=region, columns=month, values=revenue, fill NaN with 0.',
    hints: [
      'df["revenue"] = df["quantity"] * df["price"]',
      'df["month"] = pd.to_datetime(df["date"]).dt.to_period("M")',
      'pd.pivot_table(df, values="revenue", index="region", columns="month", aggfunc="sum", fill_value=0)',
    ],
    starterCode: `import pandas as pd
import numpy as np

def monthly_revenue(df: pd.DataFrame) -> pd.DataFrame:
    pass

def top_products(df: pd.DataFrame, n: int = 5) -> pd.DataFrame:
    pass

def regional_summary(df: pd.DataFrame) -> pd.DataFrame:
    pass`,
    solution: `import pandas as pd
import numpy as np

def monthly_revenue(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["revenue"] = df["quantity"] * df["price"]
    df["month"] = pd.to_datetime(df["date"]).dt.to_period("M")
    return (df.groupby("month").agg(total_revenue=("revenue", "sum"))
              .sort_values("total_revenue", ascending=False).reset_index())

def top_products(df: pd.DataFrame, n: int = 5) -> pd.DataFrame:
    df = df.copy()
    df["revenue"] = df["quantity"] * df["price"]
    return (df.groupby("product").agg(total_revenue=("revenue", "sum"))
              .sort_values("total_revenue", ascending=False).head(n).reset_index())

def regional_summary(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["revenue"] = df["quantity"] * df["price"]
    df["month"] = pd.to_datetime(df["date"]).dt.to_period("M").astype(str)
    return pd.pivot_table(df, values="revenue", index="region",
                          columns="month", aggfunc="sum", fill_value=0)`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is broadcasting in NumPy?', options: ['Converting dtypes automatically', 'Automatically expanding arrays of compatible shapes for element-wise operations', 'Sending array data to a GPU', 'Copying array data between processes'], answer: 1, explanation: 'Broadcasting allows NumPy to perform element-wise operations between arrays of different but compatible shapes. A (3, 4) array + a (4,) array: NumPy broadcasts the (4,) array along axis 0, treating it as (3, 4). Rules: shapes are compared right-to-left; dimensions must be equal or one must be 1. This eliminates many explicit loops.' },
    { q: 'Why should you avoid iterrows() for row-level computation?', options: ['iterrows() is deprecated', 'iterrows() converts each row to a Python dict, adding massive overhead — 100–1000× slower than vectorised operations', 'iterrows() does not preserve dtypes', 'iterrows() cannot be used with custom functions'], answer: 1, explanation: 'iterrows() creates a Python object for each row, losing NumPy\'s compiled-code advantage. For numeric computation, use column arithmetic: (df["price"] * df["qty"]).sum(). For complex per-row logic, use df.apply(fn, axis=1) (slow) or itertuples() (faster than iterrows). For vectorised conditionals, np.where() or df.loc[mask].' },
    { q: 'What does df.loc[mask, "col"] = value do differently from df[mask]["col"] = value?', options: ['They are identical', 'loc modifies the original DataFrame directly; chained [] may modify a copy — SettingWithCopyWarning', 'loc is for column selection; [] is for row selection', 'loc requires integer indexing'], answer: 1, explanation: 'df[mask]["col"] = value chains two operations. The first df[mask] may return a copy or a view depending on memory layout. Assigning to a copy silently fails. df.loc[mask, "col"] = value always modifies the original DataFrame. Pandas issues SettingWithCopyWarning when it detects potential chained assignment.' },
    { q: 'What is the performance advantage of Parquet over CSV for large datasets?', options: ['Parquet has no compression; CSV does', 'Parquet is columnar and compressed — faster to read, smaller on disk, and preserves dtypes', 'Parquet is only for time series data', 'CSV is always faster to read than Parquet'], answer: 1, explanation: 'CSV is row-oriented plain text — reading only 2 of 100 columns still reads all 100. Parquet is columnar — reading 2 columns reads only those 2. Parquet uses efficient compression (Snappy, Zstd) reducing file size 5–10×. It also stores dtypes, so pd.read_parquet() does not require specifying dtype — no silent string/number coercion issues.' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between .values, .to_numpy(), and .array in Pandas?', a: '.values returns the underlying NumPy array or ExtensionArray (for Categorical, Int64Dtype, etc.). It is legacy API — behaviour varies by dtype. .to_numpy() (Pandas 1.0+) always returns a NumPy ndarray, converting as needed. .array returns the ExtensionArray backing the column without conversion — preserves nullable integer, category etc. For numeric operations, use .to_numpy(); for accessing Categorical codes, use .array.' },
    { q: 'How do you handle duplicate rows in a DataFrame?', a: 'df.duplicated() returns a boolean Series — True for duplicate rows. df.drop_duplicates() removes them. By default, the first occurrence is kept (keep="first"); keep="last" keeps the last; keep=False drops ALL duplicates. Subset on specific columns: df.drop_duplicates(subset=["email"], keep="first"). For deduplication based on a sort (keep the latest record per user), sort first, then drop_duplicates: df.sort_values("date").drop_duplicates(subset=["user_id"], keep="last").' },
    { q: 'When would you use Polars instead of Pandas?', a: 'Polars (Rust-based DataFrame library) is 5–50× faster than Pandas for most operations: lazy evaluation avoids unnecessary computation, parallel execution uses multiple cores, and columnar storage matches Parquet. Polars is the right choice when: dataset is large (millions of rows), you need speed, or you want type safety (Polars has a strict type system). Polars has a different API (expressions instead of Python lambdas) and less ecosystem integration. Pandas remains the standard for ML pipelines and exploratory analysis due to wider library support.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'NumPy enables vectorised computation 100× faster than Python loops; Pandas provides labelled DataFrames with SQL-like groupby/merge/pivot; avoid iterrows, use loc for assignment.',
    mustKnow: [
      'Vectorise: replace Python loops over arrays with NumPy operations.',
      'Broadcasting: arrays expand along dimensions of size 1 for element-wise ops.',
      'Boolean indexing: arr[arr > 0]; & and | for element-wise, not and/or.',
      'Pandas: groupby().agg(), merge(on, how), pivot_table for SQL-like analytics.',
      'df.loc[mask, "col"] = value — never chain df[mask]["col"] = value.',
      'iterrows() is slow — use vectorised column ops or itertuples().',
    ],
    interviewFocus: [
      'Explain NumPy broadcasting with an example.',
      'What is the N+1 equivalent issue in Pandas (iterrows)?',
      'Why is Parquet preferred over CSV for large datasets?',
    ]
  };
}
