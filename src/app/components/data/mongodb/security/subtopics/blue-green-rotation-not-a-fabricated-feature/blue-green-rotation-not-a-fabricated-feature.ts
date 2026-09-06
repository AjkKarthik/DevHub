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
    heading: 'There Is No "Multiple Passwords Per User" Feature',
    points: [
      'The main page\'s own QnA on credential rotation used to describe a "multiple passwords per user (MongoDB 7.2+)" mechanism — verified directly against <code>db.updateUser()</code>\'s own reference documentation and MongoDB\'s own 8.0 changelog that no such feature exists at all: <code>pwd</code> takes a single value and REPLACES the existing password immediately, with no server-side concept of two simultaneously valid passwords.',
      'The actual zero-downtime pattern (already partially described on the same page for "older versions," which turns out to just be THE only pattern) is a blue/green NEW USER, not an in-place password change: create a new user with the new credentials, migrate connections to it gradually, then drop the old user only once nothing depends on it anymore.',
      'Calling <code>db.updateUser()</code> to change an IN-USE account\'s password in a single step changes the password for every connection at once — any connection still holding the old password fails its very next authentication attempt, which is exactly what a blue/green rotation avoids by keeping BOTH users valid throughout the migration window.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Naive In-Place Change vs. Blue/Green Rotation',
    language: 'typescript',
    code: `// Model: a set of active app connections, each holding a credential.
function simulateNaiveRotation(activeConnections: { credential: string }[]) {
  // updateUser() changes the password on the SAME user instantly --
  // every connection still authenticated with the OLD password fails
  // its next re-authentication attempt.
  return activeConnections.map(conn => ({
    ...conn,
    authFails: conn.credential === 'oldPassword',
  }));
}

function simulateBlueGreenRotation(activeConnections: { credential: string }[], migratedFraction: number) {
  // A NEW user is created; connections migrate to it gradually (rolling
  // restart). The OLD user is NOT dropped until migration reaches 100%.
  return activeConnections.map((conn, i) => ({
    ...conn,
    credential: i < activeConnections.length * migratedFraction ? 'newUser' : 'oldUser',
    authFails: false, // both oldUser and newUser stay valid throughout
  }));
}

const connections = Array.from({ length: 10 }, () => ({ credential: 'oldPassword' }));

const naive = simulateNaiveRotation(connections);
console.log('Naive in-place rotation -- connections that now fail auth:',
  naive.filter(c => c.authFails).length, 'of', naive.length);
// -> 10 of 10 -- every connection fails, all at once.

const blueGreen = simulateBlueGreenRotation(connections, 0.6); // 60% migrated so far
console.log('Blue/green rotation at 60% migrated -- connections that fail auth:',
  blueGreen.filter(c => c.authFails).length, 'of', blueGreen.length);
// -> 0 of 10 -- no connection ever fails, at any point during the migration.

// The actual blue/green steps, per MongoDB's own documented user-
// management commands (no special "rotation" API involved):
await adminClient.db('admin').command({
  createUser: 'shopService_v2',
  pwd: process.env['NEW_SERVICE_PASS'],
  roles: [{ role: 'readWrite', db: 'shop' }],
});
// ... deploy the new connection string to every app instance ...
// ... once ALL instances have switched, drop the old user ...
await adminClient.db('admin').command({ dropUser: 'shopService' });`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A team is mid-rotation: 70% of app instances have switched to the new user, 30% still use the old one. Someone on the team, impatient, drops the OLD user right now instead of waiting for 100%. What happens to the remaining 30% of connections?',
  hint: 'Think about what dropping a user actually does to any connection or reconnection attempt still authenticating as that user.',
  solution: `// The remaining 30% of app instances immediately fail to
// authenticate -- dropUser removes the account entirely, so any
// connection (or reconnection, after a network blip or pool refresh)
// still using the OLD user's credentials gets an authentication
// failure from that moment on.
//
// This is exactly the outage the blue/green pattern exists to avoid --
// but only if BOTH users are kept alive until migration reaches 100%.
// Dropping the old user early re-introduces the same all-at-once
// failure the naive single-step password change has, just delayed
// until whenever the drop happens instead of at rotation time.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'MongoDB 7.2+ added a real "multiple passwords per user" feature specifically for zero-downtime rotation — the main page\'s original QnA was describing a genuine, if lesser-known, capability.',
    reality: 'Verified directly against db.updateUser()\'s own reference documentation and MongoDB\'s own 8.0 changelog: no such feature exists. pwd is a single value that replaces the existing password immediately. The zero-downtime pattern has always been the blue/green new-user approach, not an in-place multi-password mechanism.',
  },
  {
    thought: 'Since blue/green rotation requires creating a whole new user, it must be significantly more complex or risky than a simple updateUser() password change.',
    reality: 'Blue/green rotation uses the exact same createUser/dropUser commands as ordinary user management — no special tooling or API. The complexity is entirely in COORDINATING the connection-string rollout across app instances, not in any unusual MongoDB-side mechanism, and it is the only approach that keeps every connection authenticated throughout the entire migration window.',
  },
];

@Component({
  selector: 'app-mongo-sec-blue-green-rotation',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './blue-green-rotation-not-a-fabricated-feature.html',
  styleUrl: './blue-green-rotation-not-a-fabricated-feature.scss',
})
export class BlueGreenRotationNotAFabricatedFeatureSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
