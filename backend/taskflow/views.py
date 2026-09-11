"""
REST API Views and ViewSets for CodeAlpha_TaskFlow.
Handles Authentication, Workspaces, Projects, Tasks, Comments, and Analytics.
"""

from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.utils import timezone

from .models import (
    UserProfile, Workspace, WorkspaceMember, Project, Task, TaskComment, ActivityLog
)
from .serializers import (
    UserPublicSerializer, RegisterSerializer, ChangePasswordSerializer, UserProfileSerializer,
    WorkspaceSerializer, WorkspaceMemberSerializer, ProjectSerializer,
    TaskSerializer, TaskStatusUpdateSerializer, TaskCommentSerializer, ActivityLogSerializer
)
from .permissions import (
    IsWorkspaceMember, IsWorkspaceAdminOrOwner, IsWorkspaceOwner, CanManageTask,
    get_user_workspace_role
)


def log_activity(workspace, project, user, action, entity_type, entity_id, summary, details=None):
    """Helper to record audit trail entries in ActivityLog."""
    try:
        ActivityLog.objects.create(
            workspace=workspace,
            project=project,
            user=user,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            summary=summary,
            details=details or {}
        )
    except Exception:
        pass


# ==============================================================================
# AUTHENTICATION & PROFILE VIEWS
# ==============================================================================

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'success': True,
                'message': 'Registration successful.',
                'user': UserPublicSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username_or_email = request.data.get('username_or_email', '').strip()
        password = request.data.get('password', '')

        if not username_or_email or not password:
            return Response(
                {'detail': 'Both username/email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Allow login via either username or email
        user = None
        if '@' in username_or_email:
            matched_user = User.objects.filter(email__iexact=username_or_email).first()
            if matched_user:
                user = authenticate(username=matched_user.username, password=password)
        else:
            user = authenticate(username=username_or_email, password=password)

        if not user:
            return Response(
                {'detail': 'Invalid credentials. Please verify your username/email and password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'detail': 'This account has been disabled. Please contact support.'},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'message': 'Login successful.',
            'user': UserPublicSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserPublicSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        user = request.user
        user_updated = False

        first_name = request.data.get('first_name')
        if first_name is not None:
            user.first_name = first_name
            user_updated = True

        last_name = request.data.get('last_name')
        if last_name is not None:
            user.last_name = last_name
            user_updated = True

        if user_updated:
            user.save()

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile_serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if profile_serializer.is_valid():
            profile_serializer.save()
            return Response(UserPublicSerializer(user).data, status=status.HTTP_200_OK)

        return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({'success': True, 'message': 'Password updated successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==============================================================================
# WORKSPACES & MEMBERS VIEWS
# ==============================================================================

class WorkspaceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkspaceSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['destroy']:
            return [IsWorkspaceOwner()]
        if self.action in ['update', 'partial_update']:
            return [IsWorkspaceAdminOrOwner()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Workspace.objects.none()
        return Workspace.objects.filter(
            Q(owner=user) | Q(memberships__user=user)
        ).distinct()

    def perform_create(self, serializer):
        workspace = serializer.save()
        log_activity(
            workspace=workspace,
            project=None,
            user=self.request.user,
            action=ActivityLog.ACTION_PROJECT_CREATED,
            entity_type='Workspace',
            entity_id=workspace.id,
            summary=f"Created workspace '{workspace.name}'."
        )

    @action(detail=True, methods=['get', 'post'], url_path='members')
    def members(self, request, slug=None):
        workspace = self.get_object()
        role = get_user_workspace_role(request.user, workspace)

        if not role:
            return Response({'detail': 'You are not a member of this workspace.'}, status=status.HTTP_403_FORBIDDEN)

        if request.method == 'GET':
            members = workspace.memberships.select_related('user', 'user__profile').all()
            serializer = WorkspaceMemberSerializer(members, many=True)
            return Response(serializer.data)

        if request.method == 'POST':
            if role not in [WorkspaceMember.ROLE_OWNER, WorkspaceMember.ROLE_ADMIN]:
                return Response({'detail': 'Only owners and admins can invite new members.'}, status=status.HTTP_403_FORBIDDEN)

            serializer = WorkspaceMemberSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                member = serializer.save(workspace=workspace)
                log_activity(
                    workspace=workspace,
                    project=None,
                    user=request.user,
                    action=ActivityLog.ACTION_MEMBER_ADDED,
                    entity_type='WorkspaceMember',
                    entity_id=member.id,
                    summary=f"Added {member.user.username} as {member.role} to workspace."
                )
                return Response(WorkspaceMemberSerializer(member).data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch', 'delete'], url_path='members/(?P<member_id>[^/.]+)')
    def member_detail(self, request, slug=None, member_id=None):
        workspace = self.get_object()
        role = get_user_workspace_role(request.user, workspace)

        if role not in [WorkspaceMember.ROLE_OWNER, WorkspaceMember.ROLE_ADMIN]:
            return Response({'detail': 'Only owners and admins can modify team members.'}, status=status.HTTP_403_FORBIDDEN)

        member = get_object_or_404(WorkspaceMember, id=member_id, workspace=workspace)

        if member.role == WorkspaceMember.ROLE_OWNER and member.user == workspace.owner:
            return Response({'detail': 'Cannot modify the workspace owner role.'}, status=status.HTTP_400_BAD_REQUEST)

        if request.method == 'PATCH':
            new_role = request.data.get('role')
            if new_role not in dict(WorkspaceMember.ROLE_CHOICES):
                return Response({'detail': 'Invalid role choice.'}, status=status.HTTP_400_BAD_REQUEST)
            member.role = new_role
            member.save()
            return Response(WorkspaceMemberSerializer(member).data)

        if request.method == 'DELETE':
            username = member.user.username
            member.delete()
            log_activity(
                workspace=workspace,
                project=None,
                user=request.user,
                action=ActivityLog.ACTION_MEMBER_REMOVED,
                entity_type='WorkspaceMember',
                entity_id=member_id,
                summary=f"Removed {username} from workspace."
            )
            return Response({'success': True, 'message': 'Member removed.'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'], url_path='analytics')
    def analytics(self, request, slug=None):
        workspace = self.get_object()
        role = get_user_workspace_role(request.user, workspace)
        if not role:
            return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        projects = workspace.projects.all()
        tasks = Task.objects.filter(project__workspace=workspace)

        total_tasks = tasks.count()
        done_tasks = tasks.filter(status=Task.STATUS_DONE).count()
        in_progress_tasks = tasks.filter(status=Task.STATUS_IN_PROGRESS).count()
        in_review_tasks = tasks.filter(status=Task.STATUS_IN_REVIEW).count()
        todo_tasks = tasks.filter(status=Task.STATUS_TODO).count()
        backlog_tasks = tasks.filter(status=Task.STATUS_BACKLOG).count()

        today = timezone.now().date()
        overdue_tasks = tasks.filter(due_date__lt=today).exclude(status=Task.STATUS_DONE).count()

        urgent_tasks = tasks.filter(priority=Task.PRIORITY_URGENT).count()
        high_tasks = tasks.filter(priority=Task.PRIORITY_HIGH).count()
        medium_tasks = tasks.filter(priority=Task.PRIORITY_MEDIUM).count()
        low_tasks = tasks.filter(priority=Task.PRIORITY_LOW).count()

        completion_rate = int((done_tasks / total_tasks) * 100) if total_tasks > 0 else 0

        # Assigned to me
        my_tasks = tasks.filter(assignee=request.user)
        my_pending = my_tasks.exclude(status=Task.STATUS_DONE).count()

        return Response({
            'workspace': {
                'id': workspace.id,
                'name': workspace.name,
                'slug': workspace.slug,
            },
            'summary': {
                'total_projects': projects.count(),
                'total_members': workspace.memberships.count(),
                'total_tasks': total_tasks,
                'completed_tasks': done_tasks,
                'in_progress_tasks': in_progress_tasks,
                'overdue_tasks': overdue_tasks,
                'completion_rate': completion_rate,
                'my_pending_tasks': my_pending,
            },
            'status_breakdown': {
                'backlog': backlog_tasks,
                'todo': todo_tasks,
                'in_progress': in_progress_tasks,
                'in_review': in_review_tasks,
                'done': done_tasks,
            },
            'priority_breakdown': {
                'urgent': urgent_tasks,
                'high': high_tasks,
                'medium': medium_tasks,
                'low': low_tasks,
            }
        })

    @action(detail=True, methods=['get'], url_path='activity')
    def activity(self, request, slug=None):
        workspace = self.get_object()
        role = get_user_workspace_role(request.user, workspace)
        if not role:
            return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        activities = workspace.activities.select_related('user', 'project', 'user__profile').all()[:25]
        serializer = ActivityLogSerializer(activities, many=True)
        return Response(serializer.data)


# ==============================================================================
# PROJECTS VIEWS
# ==============================================================================

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.action in ['destroy']:
            return [IsWorkspaceAdminOrOwner()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Project.objects.none()

        qs = Project.objects.filter(
            Q(workspace__owner=user) | Q(workspace__memberships__user=user)
        ).distinct()

        workspace_slug = self.request.query_params.get('workspace')
        if workspace_slug:
            qs = qs.filter(workspace__slug=workspace_slug)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(key__icontains=search))

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        return qs.select_related('workspace', 'created_by')

    def perform_create(self, serializer):
        workspace = serializer.validated_data['workspace']
        role = get_user_workspace_role(self.request.user, workspace)
        if role not in [WorkspaceMember.ROLE_OWNER, WorkspaceMember.ROLE_ADMIN, WorkspaceMember.ROLE_MEMBER]:
            raise permissions.PermissionDenied("You do not have permission to create projects in this workspace.")

        project = serializer.save(created_by=self.request.user)
        log_activity(
            workspace=workspace,
            project=project,
            user=self.request.user,
            action=ActivityLog.ACTION_PROJECT_CREATED,
            entity_type='Project',
            entity_id=project.id,
            summary=f"Created project '{project.name}' ({project.key})."
        )

    def perform_destroy(self, instance):
        workspace = instance.workspace
        project_name = instance.name
        log_activity(
            workspace=workspace,
            project=None,
            user=self.request.user,
            action='PROJECT_DELETED',
            entity_type='Project',
            entity_id=instance.id,
            summary=f"Deleted project '{project_name}'."
        )
        instance.delete()


# ==============================================================================
# TASKS VIEWS
# ==============================================================================

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_permissions(self):
        if self.action in ['destroy', 'update', 'partial_update']:
            return [CanManageTask()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Task.objects.none()

        qs = Task.objects.filter(
            Q(project__workspace__owner=user) | Q(project__workspace__memberships__user=user)
        ).distinct()

        project_id = self.request.query_params.get('project')
        if project_id:
            qs = qs.filter(project_id=project_id)

        workspace_slug = self.request.query_params.get('workspace')
        if workspace_slug:
            qs = qs.filter(project__workspace__slug=workspace_slug)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        priority_filter = self.request.query_params.get('priority')
        if priority_filter:
            qs = qs.filter(priority=priority_filter)

        assignee_filter = self.request.query_params.get('assignee')
        if assignee_filter:
            if assignee_filter == 'unassigned':
                qs = qs.filter(assignee__isnull=True)
            elif assignee_filter == 'me':
                qs = qs.filter(assignee=user)
            else:
                qs = qs.filter(assignee_id=assignee_filter)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(project__key__icontains=search)
            )

        return qs.select_related('project', 'assignee', 'reporter', 'assignee__profile', 'reporter__profile')

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        workspace = project.workspace
        role = get_user_workspace_role(self.request.user, workspace)

        if role == WorkspaceMember.ROLE_VIEWER:
            raise permissions.PermissionDenied("Viewers cannot create tasks.")

        task = serializer.save(reporter=self.request.user)
        log_activity(
            workspace=workspace,
            project=project,
            user=self.request.user,
            action=ActivityLog.ACTION_TASK_CREATED,
            entity_type='Task',
            entity_id=task.id,
            summary=f"Created task {task.identifier}: '{task.title}'."
        )

    def perform_update(self, serializer):
        task_before = self.get_object()
        old_status = task_before.status
        old_assignee = task_before.assignee

        task = serializer.save()
        workspace = task.project.workspace

        if old_status != task.status:
            log_activity(
                workspace=workspace,
                project=task.project,
                user=self.request.user,
                action=ActivityLog.ACTION_TASK_STATUS,
                entity_type='Task',
                entity_id=task.id,
                summary=f"Changed status of {task.identifier} from {old_status} to {task.status}."
            )
        else:
            log_activity(
                workspace=workspace,
                project=task.project,
                user=self.request.user,
                action=ActivityLog.ACTION_TASK_UPDATED,
                entity_type='Task',
                entity_id=task.id,
                summary=f"Updated task {task.identifier}."
            )

    def perform_destroy(self, instance):
        workspace = instance.project.workspace
        task_id_str = instance.identifier
        log_activity(
            workspace=workspace,
            project=instance.project,
            user=self.request.user,
            action=ActivityLog.ACTION_TASK_DELETED,
            entity_type='Task',
            entity_id=instance.id,
            summary=f"Deleted task {task_id_str}."
        )
        instance.delete()

    @action(detail=True, methods=['patch'], url_path='status')
    def quick_status(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')
        new_order = request.data.get('order', task.order)

        if new_status not in dict(Task.STATUS_CHOICES):
            return Response({'detail': f"Invalid status '{new_status}'."}, status=status.HTTP_400_BAD_REQUEST)

        old_status = task.status
        task.status = new_status
        task.order = new_order
        task.save()

        log_activity(
            workspace=task.project.workspace,
            project=task.project,
            user=request.user,
            action=ActivityLog.ACTION_TASK_STATUS,
            entity_type='Task',
            entity_id=task.id,
            summary=f"Moved {task.identifier} from {old_status} to {new_status}."
        )

        return Response(TaskSerializer(task).data)


# ==============================================================================
# COMMENTS VIEWS
# ==============================================================================

class TaskCommentViewSet(viewsets.ModelViewSet):
    serializer_class = TaskCommentSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return TaskComment.objects.none()

        task_id = self.request.query_params.get('task')
        qs = TaskComment.objects.filter(
            Q(task__project__workspace__owner=user) | Q(task__project__workspace__memberships__user=user)
        )
        if task_id:
            qs = qs.filter(task_id=task_id)
        return qs.select_related('author', 'author__profile')

    def perform_create(self, serializer):
        task_id = self.request.data.get('task')
        task = get_object_or_404(Task, id=task_id)

        role = get_user_workspace_role(self.request.user, task.project.workspace)
        if not role or role == WorkspaceMember.ROLE_VIEWER:
            raise permissions.PermissionDenied("Viewers cannot add comments.")

        comment = serializer.save(author=self.request.user, task=task)
        log_activity(
            workspace=task.project.workspace,
            project=task.project,
            user=self.request.user,
            action=ActivityLog.ACTION_COMMENT_ADDED,
            entity_type='Task',
            entity_id=task.id,
            summary=f"Commented on {task.identifier}."
        )

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            role = get_user_workspace_role(self.request.user, instance.task.project.workspace)
            if role not in [WorkspaceMember.ROLE_OWNER, WorkspaceMember.ROLE_ADMIN]:
                raise permissions.PermissionDenied("You can only delete your own comments.")
        instance.delete()
