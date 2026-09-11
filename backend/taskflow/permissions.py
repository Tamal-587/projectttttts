"""
Role-based permission classes for CodeAlpha_TaskFlow.
Enforces security boundaries at the workspace and entity levels.
"""

from rest_framework import permissions
from .models import Workspace, WorkspaceMember, Project, Task


def get_user_workspace_role(user, workspace):
    """Helper to get user's role in a workspace, or None if not a member."""
    if not user.is_authenticated:
        return None
    try:
        membership = WorkspaceMember.objects.get(workspace=workspace, user=user)
        return membership.role
    except WorkspaceMember.DoesNotExist:
        if workspace.owner == user:
            return WorkspaceMember.ROLE_OWNER
        return None


class IsWorkspaceMember(permissions.BasePermission):
    """Allows access only to authenticated members of the given workspace."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        workspace = None
        if isinstance(obj, Workspace):
            workspace = obj
        elif isinstance(obj, (Project, WorkspaceMember)):
            workspace = obj.workspace
        elif isinstance(obj, Task):
            workspace = obj.project.workspace

        if not workspace:
            return False

        role = get_user_workspace_role(request.user, workspace)
        return role is not None


class IsWorkspaceAdminOrOwner(permissions.BasePermission):
    """Allows write/admin actions only to Workspace Admins or Owners."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        workspace = None
        if isinstance(obj, Workspace):
            workspace = obj
        elif isinstance(obj, (Project, WorkspaceMember)):
            workspace = obj.workspace
        elif isinstance(obj, Task):
            workspace = obj.project.workspace

        if not workspace:
            return False

        # Read-only actions allowed for any member
        if request.method in permissions.SAFE_METHODS:
            return get_user_workspace_role(request.user, workspace) is not None

        role = get_user_workspace_role(request.user, workspace)
        return role in [WorkspaceMember.ROLE_OWNER, WorkspaceMember.ROLE_ADMIN]


class IsWorkspaceOwner(permissions.BasePermission):
    """Only workspace owner can perform destructive actions like workspace deletion."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        workspace = obj if isinstance(obj, Workspace) else getattr(obj, 'workspace', None)
        if not workspace:
            return False
        return workspace.owner == request.user


class CanManageTask(permissions.BasePermission):
    """
    Task permission rules:
    - Viewers have read-only access.
    - Members can create tasks, update status, comment, or edit tasks they reported/assigned.
    - Admins and Owners have full CRUD access.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if not isinstance(obj, Task):
            return False

        workspace = obj.project.workspace
        role = get_user_workspace_role(request.user, workspace)

        if not role:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        if role == WorkspaceMember.ROLE_VIEWER:
            return False

        if role in [WorkspaceMember.ROLE_OWNER, WorkspaceMember.ROLE_ADMIN]:
            return True

        # Member can update status, or edit if assignee/reporter
        if request.method in ['PATCH', 'PUT']:
            # If changing only status, allow member
            if set(request.data.keys()).issubset({'status', 'order'}):
                return True
            return obj.assignee == request.user or obj.reporter == request.user

        if request.method == 'DELETE':
            return obj.reporter == request.user

        return False
