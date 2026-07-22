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
  templateUrl: './response-model-needs-from-attributes-for-orm-objects.html',
  styleUrl: './response-model-needs-from-attributes-for-orm-objects.scss'
})
export class ResponseModelNeedsFromAttributesForOrmObjectsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Pydantic validates dicts by default — an ORM object needs an explicit opt-in',
      points: [
        'The main page\'s own mistake entry shows returning db.query(User).filter(...).first() directly with response_model=UserResponse, treating this as if it works automatically once a response_model is set. It leaves out a real, common prerequisite: Pydantic\'s BaseModel, by default, validates dict-like input — it does not automatically know how to read attributes off an arbitrary Python object like a SQLAlchemy ORM instance.',
        'Pydantic\'s own documentation describes the feature needed: "Pydantic can also validate arbitrary objects, by getting attributes on the object corresponding to the field names... This feature needs to be manually enabled" via model_config = ConfigDict(from_attributes=True) on the response schema. Without it, handing Pydantic a SQLAlchemy object (which has a .name attribute, not a "name" dict key) does not validate the way a dict with the same data would.',
        'This is not a new Pydantic v2 concept — it replaces what Pydantic v1 called orm_mode = True inside a nested class Config, per Pydantic\'s own docs describing from_attributes as "formerly known as \'ORM Mode\'/from_orm()." Any FastAPI code written against Pydantic v1 examples using orm_mode needs the v2-equivalent from_attributes config to keep working the same way.',
      ]
    },
    {
      heading: 'Why this is easy to miss on the main page\'s own example',
      points: [
        'The main page\'s UserResponse example never actually sets from_attributes, and the mistake entry\'s "right" side happens to keep working anyway in a toy example only if UserResponse is populated some other way (e.g. constructed manually, or the ORM object is coerced to a dict first) — in a genuinely direct return of a raw ORM instance with response_model set, without from_attributes configured, FastAPI/Pydantic raises a validation error rather than silently serializing the object\'s attributes.',
        'This gap is easy to miss specifically because FastAPI\'s own current SQL tutorial has moved to SQLModel (a library whose model classes are simultaneously SQLAlchemy models and Pydantic models), which sidesteps the from_attributes question entirely — a developer following that newer tutorial pattern for a while, then hand-rolling a plain SQLAlchemy + Pydantic setup from an older reference, can easily reproduce the classic "why won\'t my ORM object serialize" error without realizing SQLModel was quietly handling this for them the whole time.',
        'The fix is a one-line addition to the response schema itself: model_config = ConfigDict(from_attributes=True) on any Pydantic model that will ever be constructed FROM an ORM instance (or any other attribute-bearing object) rather than from a plain dict — a schema used only for request bodies (dict-shaped incoming JSON) never needs it, but any schema used as a response_model over ORM data does.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without from_attributes — validation fails on a raw ORM object',
      language: 'typescript',
      code: `from fastapi import FastAPI
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class UserORM(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String)

class UserResponse(BaseModel):
    # No model_config = ConfigDict(from_attributes=True) here —
    # this schema still only knows how to validate dict-like input.
    id: int
    name: str
    email: str

app = FastAPI()

def fake_get_user(user_id: int) -> UserORM:
    u = UserORM(id=user_id, name="Alice", email="alice@example.com")
    return u   # a real ORM instance, NOT a dict

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    return fake_get_user(user_id)
    # FastAPI passes this UserORM instance to UserResponse for
    # validation — since UserResponse has no from_attributes config,
    # Pydantic expects dict-like input and raises a validation
    # error rather than reading .id/.name/.email off the object,
    # even though the ORM object genuinely HAS those attributes.`,
    },
    {
      label: 'With from_attributes=True — the ORM object validates correctly',
      language: 'typescript',
      code: `from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class UserORM(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String)

class UserResponse(BaseModel):
    # The fix: opt in to attribute-based validation, not just dicts.
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str

app = FastAPI()

def fake_get_user(user_id: int) -> UserORM:
    return UserORM(id=user_id, name="Alice", email="alice@example.com")

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    return fake_get_user(user_id)
    # Now UserResponse.model_validate() (which FastAPI calls under
    # the hood for response_model) reads .id, .name, .email straight
    # off the UserORM instance by attribute access — this is exactly
    # the Pydantic v2 replacement for v1's "class Config: orm_mode
    # = True", per Pydantic's own docs describing the rename.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team migrates an old FastAPI codebase from Pydantic v1 to v2. Every response schema that used to have class Config: orm_mode = True was mechanically renamed to model_config = ConfigDict(from_attributes=True) — except one: ProductResponse, which the developer doing the rename skipped because "it looks like it only returns dicts anyway" based on a quick read of one route. After the migration, a DIFFERENT route that returns a raw Product ORM instance with response_model=ProductResponse starts failing with a validation error it never had before. Explain why, using what this subtopic covers.',
    hint: 'Does a response schema need from_attributes/orm_mode configured based on how ONE route happens to use it, or based on whether ANY route ever passes it a non-dict, attribute-bearing object? What changed about ProductResponse specifically, versus what changed about Pydantic\'s validation behavior in general?',
    solution: 'The migration missed that from_attributes/orm_mode is a property of the SCHEMA CLASS itself, not of any one particular route that happens to use it — ProductResponse is presumably used as response_model on more than one route, and the developer only checked one of them (the one that happened to construct data as a plain dict) before deciding the rename was unnecessary. The other route, which returns a raw Product ORM instance directly, still needs Pydantic to read attributes off that object rather than expect a dict — and without model_config = ConfigDict(from_attributes=True) on ProductResponse, Pydantic v2\'s default (dict-only) validation now correctly rejects the raw ORM instance, producing the validation error that previously didn\'t occur under Pydantic v1\'s more permissive default handling in some configurations, or simply hadn\'t been exercised/tested since v1\'s own orm_mode had been silently in place before the migration touched the file at all. The fix is to check every route that uses a given response schema as response_model, not just one representative example, before deciding whether that schema needs from_attributes — and in general, add model_config = ConfigDict(from_attributes=True) to any response schema unless it can be confirmed with certainty that literally every route returning that schema always constructs it from a plain dict, never directly from an ORM instance or other attribute-bearing object.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Setting response_model=SomeSchema on a FastAPI route is enough by itself to correctly serialize whatever object type the route handler returns — a raw SQLAlchemy ORM instance, a dict, a dataclass — since response_model\'s whole job is output serialization.',
      reality: 'This subtopic\'s theory and first code example show response_model alone is not sufficient for non-dict objects — Pydantic\'s BaseModel validates dict-like input by default, and reading attributes off an ORM instance instead requires the schema to explicitly opt in with model_config = ConfigDict(from_attributes=True); without it, a route returning a raw ORM object with response_model set raises a validation error rather than silently working.'
    },
    {
      thought: 'from_attributes=True (Pydantic v2) is a new capability that did not exist in Pydantic v1 — older FastAPI codebases simply didn\'t have this problem because v1 always allowed ORM objects to validate.',
      reality: 'This subtopic\'s theory shows Pydantic v1 had the identical requirement under a different name — orm_mode = True inside a nested class Config — and Pydantic\'s own docs describe from_attributes as the direct v2 rename of that same feature, not a new restriction. Any v1 codebase relying on ORM objects as response_model input already needed orm_mode set; migrating to v2 just renames the setting, it does not remove the requirement.'
    },
    {
      thought: 'Whether a Pydantic response schema needs from_attributes configured is a fixed property that can be determined once by looking at the schema\'s field definitions alone, independent of how any particular route happens to use it.',
      reality: 'This subtopic\'s exercise shows the opposite — the need for from_attributes depends on what KIND of object gets passed into that schema at runtime across every route that uses it as response_model, not on the schema\'s own field types. A schema that only ever receives dicts on one route can still need from_attributes because a completely different route passes it a raw ORM instance instead.'
    }
  ];
}
