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
    heading: 'From "Store Restaurants, Find Nearby Ones" to Real Code',
    points: [
      'The main page\'s own QnA describes the whole pattern in real detail — a <code>2dsphere</code> index, GeoJSON <code>Point</code> storage, and <code>$near</code> queries sorted by distance — using restaurants as the running example. No codeTab anywhere on the page shows the actual index creation or query.',
      'GeoJSON coordinates are always written <code>[longitude, latitude]</code> — the opposite of the common <code>[lat, lng]</code> convention most mapping APIs and everyday map-reading use. This is not a MongoDB quirk specifically — it matches the underlying GeoJSON specification MongoDB implements — but it is a real, easy-to-get-backwards source of bugs.',
      '<code>$near</code> requires a <code>2dsphere</code> (or legacy <code>2d</code>) index to exist on the queried field — verified against MongoDB\'s own documented syntax: <code>$maxDistance</code> and <code>$minDistance</code> are both specified in METERS for a <code>2dsphere</code> index, and results are automatically sorted nearest-to-farthest with no explicit <code>.sort()</code> needed.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Storing and Querying Nearby Restaurants',
    language: 'typescript',
    code: `const restaurants = db.collection('restaurants');

// Create a 2dsphere index on the location field
await restaurants.createIndex({ location: '2dsphere' });

// Store a restaurant -- GeoJSON Point, [longitude, latitude] order
await restaurants.insertOne({
  name: 'Corner Bistro',
  location: {
    type: 'Point',
    coordinates: [-73.9667, 40.78], // longitude, then latitude (NYC)
  },
});

// Find restaurants near a point, sorted nearest-to-farthest,
// within 1000 meters
const nearby = await restaurants.find({
  location: {
    \$near: {
      \$geometry: { type: 'Point', coordinates: [-73.9667, 40.78] },
      \$maxDistance: 1000, // meters
    },
  },
}).toArray();

// Find restaurants in a "donut" -- between 1000m and 5000m away
// (e.g. "close enough to deliver, but not already crowded nearby")
const midRange = await restaurants.find({
  location: {
    \$near: {
      \$geometry: { type: 'Point', coordinates: [-73.9667, 40.78] },
      \$minDistance: 1000,
      \$maxDistance: 5000,
    },
  },
}).toArray();`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A developer accidentally swaps the order and stores NYC\'s coordinates as <code>[40.78, -73.9667]</code> (latitude first) instead of the correct <code>[-73.9667, 40.78]</code>. Does MongoDB reject this on insert, or does it silently accept it? If accepted, roughly where does this point actually represent?',
  hint: 'Check whether both numbers are individually valid as SOME coordinate value -- longitude ranges roughly -180 to 180, latitude -90 to 90 -- before assuming an out-of-range error would catch the mistake.',
  solution: `// MongoDB accepts it silently -- there's no validation checking
// whether the FIRST number is plausible as a longitude and the
// SECOND as a latitude specifically. Both 40.78 and -73.9667 are
// individually valid numbers within the general coordinate range,
// so nothing about the swap looks structurally wrong to MongoDB.
//
// Interpreted correctly (as written, longitude first): longitude
// 40.78, latitude -73.9667 -- but -73.9667 is NOT a valid latitude
// at all (latitude only ranges -90 to 90). Depending on the exact
// values involved, a swap can produce either a genuinely nonsensical
// out-of-range latitude (as here) or, worse, a technically VALID but
// wildly wrong location on the opposite side of the planet from the
// intended point -- with no error to catch it either way.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '$near automatically falls back to a full collection scan if no 2dsphere index exists, the same way most other query operators do when unindexed.',
    reality: '$near is a genuine exception to that general rule — verified against MongoDB\'s own docs, it REQUIRES a 2dsphere (or legacy 2d) index to exist on the queried field at all. Without one, the query fails outright with an error rather than falling back to an unindexed scan, unlike almost every other query operator this page covers.',
  },
  {
    thought: '$minDistance and $maxDistance are specified in the same units regardless of index type.',
    reality: 'The units depend on which index type is backing the query. For a 2dsphere index (GeoJSON-based, the modern, recommended choice), distances are in METERS. For the legacy 2d index (flat-plane coordinates, non-spherical), distances are in the same units as the coordinate system itself, which is typically NOT meters. Mixing this up when migrating from an old 2d-indexed schema to 2dsphere is a real, documented source of wildly wrong distance filtering.',
  },
];

@Component({
  selector: 'app-mongo-query-geospatial-near',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './finding-nearby-places-with-near-and-2dsphere.html',
  styleUrl: './finding-nearby-places-with-near-and-2dsphere.scss',
})
export class FindingNearbyPlacesWithNearAnd2dsphereSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
