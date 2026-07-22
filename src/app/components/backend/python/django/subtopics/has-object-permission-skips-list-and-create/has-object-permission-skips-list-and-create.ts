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
  templateUrl: './has-object-permission-skips-list-and-create.html',
  styleUrl: './has-object-permission-skips-list-and-create.scss'
})
export class HasObjectPermissionSkipsListAndCreateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'has_object_permission() only runs when a view actually fetches ONE object',
      points: [
        'The main page\'s own challenge solution defines class IsOwnerOrReadOnly(permissions.BasePermission): def has_object_permission(self, request, view, obj): ... — a perfectly correct pattern for the retrieve/update/destroy actions it is used for. What the main page does not spell out is that this method has a real, silent blind spot for two of DRF\'s five standard actions.',
        'DRF\'s own docs describe two genuinely separate permission checks: has_permission() "checked at the start of the view, before any other code," and has_object_permission(), which "will only be called if the view code explicitly call[s] check_object_permissions(request, obj)" — a call that only happens inside get_object(), the method DRF uses to fetch a single instance for retrieve/update/partial_update/destroy.',
        'list() and create() never call get_object() at all — there is no single object to fetch for a list (it returns a filtered queryset) or a create (the object does not exist yet). DRF\'s own docs state this directly for both: "the generic views will not automatically apply object level permissions to each instance in a queryset when returning a list of objects," and for creation specifically, "because the get_object() method is not called, object level permissions from the has_object_permission() method are not applied when creating objects."',
      ]
    },
    {
      heading: 'A permission class that only overrides has_object_permission() is a silent no-op for list/create',
      points: [
        'BasePermission\'s default has_permission() implementation simply returns True — so a custom permission class that overrides ONLY has_object_permission() (like the main page\'s IsOwnerOrReadOnly, used alongside IsAuthenticatedOrReadOnly) inherits that permissive default has_permission() unchanged. For list and create requests, DRF checks has_permission() (which passes, via the inherited default) and then never calls has_object_permission() at all — the override the developer wrote never runs, and the request proceeds as if that permission class were not applied.',
        'This is not a bug in DRF — it is documented, intentional behavior, and DRF\'s own docs are explicit that the fix requires different mechanisms for each action type: for list, "you\'ll also want to filter the queryset appropriately" (restricting get_queryset() itself, rather than relying on has_object_permission() to reject items after the fact); for create, "you need to implement the permission check either in your Serializer class or override the perform_create() method" — has_object_permission() alone is documented as structurally unable to cover creation at all, no matter how it is written.',
        'The practical consequence: a ViewSet using ONLY an object-level "owner" permission class can end up allowing any authenticated user to see EVERY row in a list endpoint (since has_object_permission() never filters a queryset) or create objects under someone else\'s ownership (since there is no existing object yet for has_object_permission() to check against) — while the SAME permission class correctly protects retrieve/update/destroy on individual objects, making the gap easy to miss during manual testing that only exercises detail routes.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'has_object_permission()-only class silently does nothing for list/create',
      language: 'typescript',
      code: `from rest_framework import permissions, viewsets
from .models import Note
from .serializers import NoteSerializer

class IsOwner(permissions.BasePermission):
    # Only has_object_permission() is overridden — has_permission()
    # inherits BasePermission's default, which simply returns True.
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()          # NOT filtered by owner!
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

# GET /notes/          -> list(): calls get_queryset(), NEVER calls
#                          get_object(), so has_object_permission()
#                          NEVER runs. Every authenticated user sees
#                          EVERY note from EVERY owner — the IsOwner
#                          check the developer wrote provides ZERO
#                          protection here.
#
# POST /notes/         -> create(): also never calls get_object().
#                          Any authenticated user can create a Note
#                          with any owner value the serializer allows
#                          — IsOwner has no way to check "ownership"
#                          of an object that doesn't exist yet.
#
# GET /notes/{pk}/      -> retrieve(): DOES call get_object(), which
#                          calls check_object_permissions(), which
#                          DOES call has_object_permission() — this
#                          route is correctly protected.`,
    },
    {
      label: 'The documented fix: filter the queryset AND check has_permission() too',
      language: 'typescript',
      code: `from rest_framework import permissions, viewsets
from .models import Note
from .serializers import NoteSerializer

class IsOwner(permissions.BasePermission):
    # Still needed for retrieve/update/destroy — has_object_permission()
    # correctly protects those, unchanged from before.
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user

class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        # THE FIX for list(): restrict the queryset itself — DRF's
        # own docs recommend this exact pattern, since list() never
        # calls get_object()/has_object_permission() at all.
        return Note.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        # THE FIX for create(): set ownership explicitly here — DRF's
        # own docs point to overriding perform_create() (or enforcing
        # it in the serializer) specifically because has_object_permission()
        # structurally cannot run for an object that doesn't exist yet.
        serializer.save(owner=self.request.user)

# Now: GET /notes/ only returns the requesting user's own notes.
# POST /notes/ always creates a note owned by the requesting user,
# regardless of what the request body tries to set. Both fixes were
# necessary — has_object_permission() alone never covered either case.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A DRF ViewSet has permission_classes = [IsAuthenticated, IsProjectMember] where IsProjectMember only overrides has_object_permission() (checking obj.project.members.contains(request.user)). During QA, someone reports that GET /tasks/ (the list endpoint) returns tasks from projects the logged-in user is not a member of, even though GET /tasks/{id}/ on any one of those same tasks correctly returns a 403. Explain why the two endpoints behave differently, using what this subtopic covers, and describe the fix.',
    hint: 'Which of DRF\'s two permission-check methods does list() actually invoke — does it ever call get_object(), the method that triggers has_object_permission()? Compare that to what retrieve() does.',
    solution: 'The two endpoints behave differently because they call fundamentally different permission-checking machinery, even though both use the exact same IsProjectMember class. GET /tasks/{id}/ (retrieve) calls self.get_object(), which internally calls self.check_object_permissions(request, obj) — and THAT is what actually invokes has_object_permission(), correctly rejecting a task from a project the user isn\'t a member of with a 403. GET /tasks/ (list) never calls get_object() at all — per DRF\'s own documentation, "the generic views will not automatically apply object level permissions to each instance in a queryset when returning a list of objects" — so has_object_permission() simply never runs for any of the tasks being listed, and since IsProjectMember never overrode has_permission() (which defaults to returning True), there is no check of any kind blocking the list endpoint from returning every task regardless of project membership. This is exactly the documented gap this subtopic covers: a permission class implementing only has_object_permission() provides real protection for detail routes and zero protection for list. The fix is to filter the queryset itself in get_queryset() — something like Task.objects.filter(project__members=self.request.user) — rather than relying on IsProjectMember\'s object-level check to somehow apply retroactively to a list of many objects, since DRF\'s own architecture never gives it the chance to run there at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A permission class that overrides has_object_permission() to check ownership or membership protects EVERY action on a ViewSet (list, create, retrieve, update, destroy) equally, since it is applied via the same permission_classes list for all of them.',
      reality: 'This subtopic\'s theory and first code example show has_object_permission() only runs for actions that call get_object() — retrieve, update, partial_update, and destroy. list() and create() never call get_object() at all, so has_object_permission() genuinely never executes for those two actions, regardless of what logic it contains or how correct that logic is for the actions where it DOES run.'
    },
    {
      thought: 'If a ViewSet\'s list endpoint is returning objects a permission class should be blocking, the fix is to make the has_object_permission() check stricter or add more logic to it.',
      reality: 'This subtopic\'s theory and second code example show no amount of logic inside has_object_permission() can fix a list-endpoint permission gap, because DRF\'s list() action never calls the method that invokes has_object_permission() in the first place. DRF\'s own docs recommend the actual fix instead: filtering the queryset itself inside get_queryset(), which is a structurally different mechanism from object-level permission checking.'
    },
    {
      thought: 'Since has_object_permission() checks whether a request should be allowed to act on a specific object, it naturally also protects object CREATION — after all, the request is trying to establish who owns the new object.',
      reality: 'This subtopic\'s theory shows DRF\'s own docs state this directly: "because the get_object() method is not called, object level permissions from the has_object_permission() method are not applied when creating objects" — there is no existing object for has_object_permission() to receive as its obj argument during creation, so the method is structurally unable to run at all for create(), regardless of what it checks. Ownership on create must instead be enforced in perform_create() or the serializer.'
    }
  ];
}
