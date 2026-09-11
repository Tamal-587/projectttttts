"""
Django admin registrations for CodeAlpha_TaskFlow.
"""

from django.contrib import admin
from .models import UserProfile, Workspace, WorkspaceMember, Project, Task, TaskComment, ActivityLog


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'job_title', 'department', 'phone')
    search_fields = ('user__username', 'user__email', 'job_title', 'department')


class WorkspaceMemberInline(admin.TabularInline):
    model = WorkspaceMember
    extra = 1


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'owner', 'created_at')
    search_fields = ('name', 'slug', 'owner__username')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [WorkspaceMemberInline]


@admin.register(WorkspaceMember)
class WorkspaceMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'workspace', 'role', 'joined_at')
    list_filter = ('role', 'workspace')
    search_fields = ('user__username', 'workspace__name')


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('key', 'name', 'workspace', 'status', 'target_date', 'created_by')
    list_filter = ('status', 'workspace')
    search_fields = ('name', 'key', 'description')


class TaskCommentInline(admin.StackedInline):
    model = TaskComment
    extra = 0


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('identifier', 'title', 'project', 'status', 'priority', 'assignee', 'due_date')
    list_filter = ('status', 'priority', 'project__workspace', 'project')
    search_fields = ('title', 'description', 'project__key')
    inlines = [TaskCommentInline]


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ('task', 'author', 'created_at')
    search_fields = ('task__title', 'author__username', 'content')


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('summary', 'action', 'entity_type', 'user', 'workspace', 'created_at')
    list_filter = ('action', 'entity_type', 'workspace')
    search_fields = ('summary', 'user__username')
    readonly_fields = ('workspace', 'project', 'user', 'action', 'entity_type', 'entity_id', 'summary', 'details', 'created_at')
