import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-ai-clustering',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './clustering.html',
  styleUrl: './clustering.scss',
})
export class AiClustering {
  quickRef: QuickRefItem[] = [
    { name: 'K-means',         type: 'keyword', desc: 'Assign points to k centroids, recompute centroids — repeat until convergence.' },
    { name: 'Inertia',         type: 'keyword', desc: 'Sum of squared distances to nearest centroid. Lower = tighter clusters. Use elbow method.' },
    { name: 'DBSCAN',          type: 'keyword', desc: 'Density-based: groups dense regions. Finds clusters of arbitrary shape; handles noise.' },
    { name: 'PCA',             type: 'keyword', desc: 'Projects data onto top-k eigenvectors of covariance matrix. Maximises explained variance.' },
    { name: 'Explained variance', type: 'keyword', desc: 'How much variance each PC captures. Keep PCs until ~95% variance is explained.' },
    { name: 't-SNE',           type: 'keyword', desc: 'Non-linear 2D/3D visualisation. Preserves local structure. Not for distance inference.' },
    { name: 'UMAP',            type: 'keyword', desc: 'Faster than t-SNE, better preserves global structure. Used for embedding visualisation.' },
    { name: 'Silhouette score',type: 'keyword', desc: '(b−a)/max(a,b): how well a point fits its cluster vs nearest other cluster. Range: −1 to 1.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'K-Means Clustering',
      points: [
        'Algorithm: (1) Randomly initialise k centroids. (2) Assign each point to the nearest centroid. (3) Recompute each centroid as the mean of its points. (4) Repeat until assignments stop changing.',
        'K-means minimises within-cluster sum of squares (WCSS = inertia). Guaranteed to converge but may find local optima.',
        'K-means++: initialise centroids far apart (probabilistic) — avoids bad initialisations, faster convergence.',
        'Choosing k: elbow method (plot inertia vs k, pick the knee), silhouette score, or domain knowledge.',
        'Limitations: assumes spherical clusters, sensitive to outliers, requires k in advance.',
      ],
    },
    {
      heading: 'DBSCAN',
      points: [
        'Core concept: a point is a "core point" if it has ≥ min_samples neighbours within radius ε.',
        'Clusters = connected components of core points. Border points: within ε of a core point but not core themselves. Noise: neither core nor border.',
        'Advantages: finds clusters of arbitrary shape, automatically detects noise/outliers, doesn\'t need k.',
        'Key hyperparameters: ε (neighbourhood radius) and min_samples. Tune ε using a k-distance plot.',
        'Limitation: struggles with varying density clusters and high-dimensional data (curse of dimensionality).',
      ],
    },
    {
      heading: 'PCA — Principal Component Analysis',
      points: [
        'Goal: find k orthogonal directions (principal components) that capture the most variance in the data.',
        'Steps: (1) Standardise features. (2) Compute covariance matrix. (3) Eigendecompose: eigenvectors = PCs, eigenvalues = variance captured. (4) Project data onto top-k PCs.',
        'Explained variance ratio: how much total variance each PC captures. Sum the top-k until ≥ 95%.',
        'Use cases: preprocessing before training (reduce noise, speed up training), visualisation (2D/3D), feature engineering.',
        'PCA is linear — doesn\'t capture non-linear structure. Use autoencoders for non-linear compression.',
      ],
    },
    {
      heading: 't-SNE and UMAP',
      points: [
        't-SNE: converts high-dimensional distances to probabilities, then finds a 2D layout that preserves these probabilities via KL divergence minimisation.',
        't-SNE preserves local neighbourhoods well but distorts global distances. Do NOT interpret cluster distances as meaningful.',
        'UMAP: based on Riemannian geometry and topological data analysis. Faster than t-SNE, better preserves global structure.',
        'Both are used only for visualisation, not for feature engineering or downstream ML — the resulting coordinates have no consistent meaning across runs.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'K-Means',
      language: 'typescript',
      code: `// K-means clustering implementation
function kmeans(X: number[][], k: number, maxIter = 100): {
  centroids: number[][];
  labels: number[];
  inertia: number;
} {
  // K-means++ initialisation
  const centroids: number[][] = [X[Math.floor(Math.random() * X.length)]];
  while (centroids.length < k) {
    const dists = X.map(x => Math.min(...centroids.map(c =>
      x.reduce((s, v, i) => s + (v - c[i]) ** 2, 0)
    )));
    const total = dists.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < X.length; i++) { r -= dists[i]; if (r <= 0) { centroids.push(X[i]); break; } }
  }

  let labels: number[] = new Array(X.length).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    // Assign
    const newLabels = X.map(x =>
      centroids.reduce((bestK, c, ki) => {
        const d = x.reduce((s, v, i) => s + (v - c[i]) ** 2, 0);
        return d < centroids.reduce((bd, bc, bki) => bki === bestK ? bd : bd, Infinity) ? ki : bestK;
      }, 0)
    );
    // Check convergence
    if (newLabels.every((l, i) => l === labels[i])) break;
    labels = newLabels;
    // Recompute centroids
    for (let ki = 0; ki < k; ki++) {
      const pts = X.filter((_, i) => labels[i] === ki);
      if (pts.length === 0) continue;
      centroids[ki] = pts[0].map((_, d) => pts.reduce((s, p) => s + p[d], 0) / pts.length);
    }
  }
  const inertia = X.reduce((s, x, i) =>
    s + x.reduce((ds, v, d) => ds + (v - centroids[labels[i]][d]) ** 2, 0), 0);
  return { centroids, labels, inertia };
}`,
    },
    {
      label: 'PCA',
      language: 'typescript',
      code: `// PCA: project data onto top-k principal components
function pca(X: number[][], k: number): { projected: number[][]; explainedVariance: number[] } {
  const n = X.length, d = X[0].length;
  // 1. Standardise
  const means = X[0].map((_, j) => X.reduce((s, x) => s + x[j], 0) / n);
  const centred = X.map(x => x.map((v, j) => v - means[j]));

  // 2. Covariance matrix (d×d)
  const cov: number[][] = Array.from({length: d}, (_, i) =>
    Array.from({length: d}, (__, j) =>
      centred.reduce((s, x) => s + x[i] * x[j], 0) / (n - 1)
    )
  );

  // 3. Power iteration for top eigenvectors (simplified)
  // In practice: use numpy.linalg.eigh or sklearn.decomposition.PCA
  // sklearn usage:
  // from sklearn.decomposition import PCA
  // pca = PCA(n_components=k)
  // X_reduced = pca.fit_transform(X)
  // print(pca.explained_variance_ratio_)  // e.g. [0.45, 0.22, 0.15]

  // Elbow rule: cumulative explained variance
  // cumsum = np.cumsum(pca.explained_variance_ratio_)
  // n_components = np.argmax(cumsum >= 0.95) + 1

  return { projected: centred.slice(0, k), explainedVariance: [] }; // placeholder
}

// Silhouette score for cluster quality
function silhouetteScore(X: number[][], labels: number[]): number {
  const dist = (a: number[], b: number[]) => Math.sqrt(a.reduce((s,v,i) => s+(v-b[i])**2, 0));
  return X.reduce((sum, x, i) => {
    const sameCluster = X.filter((_, j) => j !== i && labels[j] === labels[i]);
    const otherClusters = [...new Set(labels.filter((l, j) => j !== i && l !== labels[i]))];
    if (sameCluster.length === 0 || otherClusters.length === 0) return sum;
    const a = sameCluster.reduce((s, y) => s + dist(x, y), 0) / sameCluster.length;
    const b = Math.min(...otherClusters.map(c => {
      const pts = X.filter((_, j) => labels[j] === c);
      return pts.reduce((s, y) => s + dist(x, y), 0) / pts.length;
    }));
    return sum + (b - a) / Math.max(a, b);
  }, 0) / X.length;
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not scaling features before K-means or PCA',
      wrong: `# Feature 1: age [20-80], Feature 2: salary [20k-200k]
# K-means will cluster primarily on salary — age is ignored
kmeans.fit(X)`,
      right: `from sklearn.preprocessing import StandardScaler
X_scaled = StandardScaler().fit_transform(X)
kmeans.fit(X_scaled)  # balanced influence of all features`,
      explanation: 'K-means uses Euclidean distance. Features on large scales dominate the distance computation. Always standardise before K-means or PCA.',
    },
    {
      title: 'Interpreting t-SNE distances as real distances',
      wrong: `# "Cluster A and B are far apart in t-SNE — they are very different"
# t-SNE distorts global distances; only local neighbourhoods are preserved`,
      right: `# Use t-SNE for visualisation only
# For actual distance/similarity, use cosine similarity on the original embeddings`,
      explanation: 't-SNE optimises local cluster structure but distorts global distances. Two clusters far apart in 2D may not actually be more different than clusters close together.',
    },
    {
      title: 'Choosing k for K-means arbitrarily',
      wrong: `kmeans = KMeans(n_clusters=3)  # why 3? just a guess`,
      right: `# Elbow method: plot inertia vs k
inertias = [KMeans(n_clusters=k).fit(X).inertia_ for k in range(2, 11)]
# Pick k where inertia stops decreasing steeply

# Or use silhouette score: pick k that maximises it
scores = [silhouette_score(X, KMeans(n_clusters=k).fit_predict(X)) for k in range(2, 11)]`,
      explanation: 'Picking k arbitrarily leads to suboptimal clusters. Use the elbow method (inertia vs k) or silhouette score to find the best k.',
    },
    {
      title: 'Applying PCA before scaling',
      wrong: `pca = PCA(n_components=2)
X_pca = pca.fit_transform(X)  # PCA on unscaled data — dominated by high-variance features`,
      right: `X_scaled = StandardScaler().fit_transform(X)
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)`,
      explanation: 'PCA finds directions of maximum variance. Without scaling, features with large ranges dominate the first PCs regardless of their information content.',
    },
  ];

  challenge: Challenge = {
    title: 'K-Means Assign Step',
    language: 'typescript',
    description: 'Given data points X (n×d) and k centroids (k×d), return the cluster assignment for each point (the index of the nearest centroid by Euclidean distance).',
    hints: [
      'For each point, compute squared distance to each centroid',
      'Return the index of the centroid with minimum distance',
    ],
    starterCode: `function assignClusters(X: number[][], centroids: number[][]): number[] {
  // Return array of centroid indices (length n)
}`,
    solution: `function assignClusters(X: number[][], centroids: number[][]): number[] {
  return X.map(x =>
    centroids.reduce((bestK, c, ki) => {
      const d = x.reduce((s, v, i) => s + (v - c[i]) ** 2, 0);
      const bestD = x.reduce((s, v, i) => s + (v - centroids[bestK][i]) ** 2, 0);
      return d < bestD ? ki : bestK;
    }, 0)
  );
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is inertia in K-means and how is it used to choose k?',
      options: [
        'Number of iterations — lower is better',
        'Sum of squared distances to nearest centroid — plot vs k and pick the elbow',
        'Number of outlier points — choose k to minimise outliers',
        'Silhouette score — maximise it',
      ],
      answer: 1,
      explanation: 'Inertia = WCSS (within-cluster sum of squares). Plotting inertia vs k creates an "elbow" where further increasing k gives diminishing returns in inertia reduction.',
    },
    {
      q: 'What makes DBSCAN different from K-means?',
      options: [
        'DBSCAN requires specifying k clusters',
        'DBSCAN finds clusters of arbitrary shape and labels outliers as noise',
        'DBSCAN only works in 2D',
        'DBSCAN minimises variance within clusters',
      ],
      answer: 1,
      explanation: 'DBSCAN groups dense regions without requiring k. It finds clusters of arbitrary shape and explicitly labels low-density points as noise — unlike K-means which assigns every point to a cluster.',
    },
    {
      q: 'What does the explained variance ratio in PCA tell you?',
      options: [
        'How many features were removed',
        'The proportion of total variance captured by each principal component',
        'The accuracy of the PCA model',
        'How correlated features are before PCA',
      ],
      answer: 1,
      explanation: 'Each PC has an eigenvalue proportional to the variance it captures. The explained variance ratio is eigenvalue / total variance. Summing the top-k ratios tells you how much information is retained.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use UMAP over t-SNE?',
      a: 'Use UMAP when: (1) your dataset is large (t-SNE scales as O(n²) in memory/time, UMAP is O(n) with approximate NN); (2) you need to transform new points after fitting (t-SNE cannot); (3) global structure matters — UMAP preserves it better. Use t-SNE when you need a publication-quality local-structure visualisation and have time. For most production use cases (embedding visualisation, cluster inspection), UMAP is the better choice.',
    },
    {
      q: 'Can you use PCA for feature engineering before supervised learning?',
      a: 'Yes, but with caveats. PCA reduces dimensionality and can remove noise, speeding up training. But it loses interpretability — PCA components are linear combinations of all features. Also, PCA must be fit only on training data and transformed on test data (same leakage rule as scaling). For non-linear structure, autoencoders outperform PCA. In practice, tree-based models often handle high-dimensional raw features better than PCA-reduced ones.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Clustering: K-means (spherical, needs k), DBSCAN (arbitrary shape, handles noise). Reduction: PCA (linear, keeps variance), t-SNE/UMAP (non-linear, visual only). Always scale features first.',
    mustKnow: [
      'K-means: assign to nearest centroid, recompute means — repeat',
      'Elbow method: plot inertia vs k; pick the knee',
      'DBSCAN: core points (≥minSamples in ε) → clusters; rest = noise',
      'PCA: eigenvectors of covariance matrix → max variance directions',
      'Explained variance ratio: keep PCs until ~95% variance covered',
      't-SNE/UMAP: visualisation only — distances not meaningful across runs',
    ],
    interviewFocus: [
      'How does K-means work and how do you choose k?',
      'When would you use DBSCAN over K-means?',
      'What does PCA do and why must features be scaled first?',
    ],
  };
}
