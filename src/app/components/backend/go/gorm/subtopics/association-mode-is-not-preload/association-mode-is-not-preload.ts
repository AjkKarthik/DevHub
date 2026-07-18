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
  templateUrl: './association-mode-is-not-preload.html',
  styleUrl: './association-mode-is-not-preload.scss'
})
export class AssociationModeIsNotPreloadSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Associations example uses .Association(...).Append/.Count — without naming the concept',
      points: [
        'The main page\'s own Associations code tab writes db.Model(&u).Association("Posts").Append(&newPost) and db.Model(&u).Association("Posts").Count() right alongside db.Preload("Posts.Tags").First(&u, user.ID) — three genuinely different operations, presented with no distinction drawn between them. This subtopic names and explains the concept the Append/Count calls actually belong to: Association Mode.',
        'Preload, which the main page\'s own theory DOES cover, is exclusively about READING — eager-loading related records efficiently in the SAME query flow as fetching the parent, specifically to avoid the N+1 problem the main page\'s own mistake entry describes. It has no role in ADDING, REMOVING, or otherwise modifying which records are associated with a given parent.',
        'Association Mode, per GORM\'s own documentation, is a genuinely separate toolset: "helper methods to handle relationships between models" that let you "find associated records," "append new associations," "replace existing associations," "delete relationship references," "clear all references," and "count associations" — operating on an ALREADY-LOADED model instance (db.Model(&u).Association("Posts")) to directly manipulate that specific instance\'s relationships, not to fetch data alongside a query.',
      ]
    },
    {
      heading: 'Why conflating the two leads to reaching for the wrong tool',
      points: [
        'A developer who has only internalized Preload as "the GORM way to work with associations" has no obvious path to a genuinely different, common need: "this specific user already has some posts — add one more post to their existing collection" (Append), "replace this user\'s entire set of posts with a new set" (Replace), "remove the association between this user and a specific post without deleting the post itself" (Delete), or "how many posts does this specific user have, without loading them all" (Count). None of these are read-time eager-loading questions — they are all about directly manipulating one already-known record\'s own relationships.',
        'This distinction also clarifies something the main page\'s own theory leaves implicit: Preload is something you attach to a QUERY (db.Preload("Posts").Find(&users) — before any parent records are even loaded), while Association Mode is something you invoke on a MODEL INSTANCE that must already exist and typically already be loaded (db.Model(&u).Association("Posts") — u must already represent one specific, identified record). Trying to use Association Mode\'s methods on a query that hasn\'t yet loaded a specific parent instance, or expecting Preload to let you append a new related record, are both category errors stemming from treating the two as one interchangeable "associations API."',
        'Count() specifically is worth calling out on its own: db.Model(&u).Association("Posts").Count() returns the number of associated records via a targeted SQL COUNT, without loading any of the actual Post rows into memory at all — a genuinely different, more efficient operation than db.Preload("Posts").First(&u) followed by len(u.Posts) in Go, which the main page\'s own theory never contrasts against this dedicated Count() method.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Preload: reading, attached to a query, avoids N+1',
      language: 'typescript',
      code: `package main

import "gorm.io/gorm"

type User struct {
    gorm.Model
    Name  string
    Posts []Post
}

type Post struct {
    gorm.Model
    Title  string
    UserID uint
}

// Preload is a READ-time concern, attached to the QUERY -- it fetches
// the user AND all their posts efficiently (2 queries total,
// regardless of how many users match), exactly per the main page's
// own N+1-avoidance coverage.
func listUsersWithPosts(db *gorm.DB) ([]User, error) {
    var users []User
    err := db.Preload("Posts").Find(&users).Error
    return users, err
}`,
    },
    {
      label: 'Association Mode: manipulating ONE already-loaded record\'s relationships',
      language: 'typescript',
      code: `package main

import "gorm.io/gorm"

type User struct {
    gorm.Model
    Name  string
    Posts []Post
}

type Post struct {
    gorm.Model
    Title  string
    UserID uint
}

// addPostToUser: append a NEW post to an ALREADY-IDENTIFIED user's
// existing collection -- there is no "Preload" equivalent for this;
// it is a genuinely different operation, on a genuinely different
// starting point (one specific, already-loaded user).
func addPostToUser(db *gorm.DB, u *User, title string) error {
    newPost := Post{Title: title}
    return db.Model(u).Association("Posts").Append(&newPost)
}

// removePostFromUser: delete the ASSOCIATION between a user and a
// specific post -- the Post row itself is NOT deleted, only the
// UserID link, per GORM's own documented Association Mode behavior.
func removePostFromUser(db *gorm.DB, u *User, post *Post) error {
    return db.Model(u).Association("Posts").Delete(post)
}

// countUserPosts: a targeted COUNT query -- does NOT load any actual
// Post rows into memory, unlike Preload followed by len(u.Posts).
func countUserPosts(db *gorm.DB, u *User) int64 {
    return db.Model(u).Association("Posts").Count()
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer needs to display, for a specific already-loaded user, just the TOTAL NUMBER of posts they have written — the actual post content is never shown on this particular page, only the count. They write db.Preload("Posts").First(&user, userID) followed by len(user.Posts) in Go. Using this subtopic\'s theory, explain what is inefficient about this approach, and what the correct fix is.',
    hint: 'This subtopic\'s theory distinguishes Preload (loads the actual related ROWS into memory) from Association Mode\'s Count() method (a targeted SQL COUNT with no rows loaded). Given that only the NUMBER is ever needed here, which of the two operations is doing unnecessary work?',
    solution: 'The inefficiency is that db.Preload("Posts").First(&user, userID) followed by len(user.Posts) fully loads EVERY one of the user\'s post rows — every column of every post, transferred from the database and materialized into Go structs in memory — purely to then discard all of that data and keep only its length. Per this subtopic\'s theory, this is precisely the distinction between Preload (a read-time, eager-loading operation that fetches actual related records) and Association Mode\'s dedicated Count() method, which "returns the number of associated records via a targeted SQL COUNT, without loading any of the actual Post rows into memory at all." For a user with thousands of posts, the Preload approach transfers and constructs thousands of Post structs just to compute a single integer, while db.Model(&user).Association("Posts").Count() issues a single, lightweight COUNT(*) query and returns only the number — doing meaningfully less work at every layer (database, network transfer, and Go-side memory allocation) for a use case that never actually needed the individual post rows in the first place. The fix is to replace both the Preload call and the len() with count := db.Model(&user).Association("Posts").Count(), which requires user to already be loaded (even without its Posts preloaded) since Association Mode operates on an already-identified model instance, exactly as this subtopic\'s theory describes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'db.Model(&u).Association("Posts").Append(&newPost) and db.Preload("Posts") are two different syntaxes for accomplishing the same general task — working with a user\'s posts — so either one can reasonably be reached for depending on which syntax a developer happens to remember.',
      reality: 'This subtopic\'s theory and code examples show these solve fundamentally different problems: Preload is exclusively for READING (eager-loading existing related records efficiently alongside a query), while Association Mode\'s Append is exclusively for WRITING (adding a new association to an already-loaded record). There is no Preload equivalent for "add a new related record," and no Association Mode equivalent for "efficiently fetch many parents with their related records in one query flow" — they are not interchangeable syntaxes for the same task.'
    },
    {
      thought: 'db.Model(&u).Association("Posts") can be called on a fresh query or an unloaded reference, the same way db.Preload("Posts") can be chained onto a query before any records are fetched — both are just different ways to specify "I want to work with this relationship."',
      reality: 'This subtopic\'s theory draws a specific structural distinction: Preload attaches to a QUERY, before any parent record is loaded (db.Preload("Posts").Find(&users)), while Association Mode operates on a MODEL INSTANCE that must already represent one specific, identified record (db.Model(u).Association("Posts"), where u is already a loaded *User). Association Mode has no meaning without an already-identified starting record to attach relationships to or from.'
    },
    {
      thought: 'Since Association Mode\'s Count() method and a Preload-plus-len() approach both ultimately answer "how many related records does this parent have," the choice between them is a minor implementation detail unlikely to matter for typical application performance.',
      reality: 'This subtopic\'s exercise shows the difference is significant, not a minor detail — Count() issues a lightweight, targeted COUNT query that never loads the related rows at all, while Preload-plus-len() loads and materializes every single related row purely to discard it afterward. For a parent with a large number of related records, this is a meaningfully different amount of database, network, and memory work for the identical logical question.'
    }
  ];
}
