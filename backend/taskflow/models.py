"""
Database models for CodeAlpha Full Stack Platform.
Includes Social Network (Posts, Comments, Likes, Follows) + Agile Projects & Workspaces.
"""

from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar_url = models.CharField(max_length=500, blank=True, default='')
    job_title = models.CharField(max_length=120, blank=True, default='Full Stack Engineer')
    department = models.CharField(max_length=120, blank=True, default='Engineering')
    bio = models.TextField(blank=True, default='')
    phone = models.CharField(max_length=30, blank=True, default='')
    website = models.CharField(max_length=200, blank=True, default='')
    github_url = models.CharField(max_length=200, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    @property
    def followers_count(self):
        return self.user.follower_relations.count()

    @property
    def following_count(self):
        return self.user.following_relations.count()

    @property
    def posts_count(self):
        return self.user.posts.count()


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()


# ==============================================================================
# SOCIAL NETWORK / DEVELOPER COMMUNITY MODELS
# ==============================================================================

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_relations')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='follower_relations')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['follower', 'following'], name='unique_follow_relation')
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"


class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    code_snippet = models.TextField(blank=True, default='')
    code_language = models.CharField(max_length=50, blank=True, default='javascript')
    image_url = models.CharField(max_length=500, blank=True, default='')
    tags = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post by {self.author.username} on {self.created_at.strftime('%Y-%m-%d')}"

    @property
    def likes_count(self):
        return self.likes.count()

    @property
    def comments_count(self):
        return self.post_comments.count()


class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'post'], name='unique_post_like')
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} liked post {self.post.id}"


class PostComment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='post_comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on post {self.post.id}"


# ==============================================================================
# WORKSPACES & PROJECTS MODELS
# ==============================================================================

class Workspace(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, db_index=True)
    description = models.TextField(blank=True, default='')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_workspaces')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or 'workspace'
            slug = base_slug
            counter = 1
            while Workspace.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class WorkspaceMember(models.Model):
    ROLE_OWNER = 'OWNER'
    ROLE_ADMIN = 'ADMIN'
    ROLE_MEMBER = 'MEMBER'
    ROLE_VIEWER = 'VIEWER'

    ROLE_CHOICES = [
        (ROLE_OWNER, 'Owner'),
        (ROLE_ADMIN, 'Admin'),
        (ROLE_MEMBER, 'Member'),
        (ROLE_VIEWER, 'Viewer'),
    ]

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workspace_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['workspace', 'user'], name='unique_workspace_member')
        ]
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.user.username} - {self.workspace.name} ({self.role})"


class Project(models.Model):
    STATUS_PLANNING = 'PLANNING'
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_ON_HOLD = 'ON_HOLD'
    STATUS_COMPLETED = 'COMPLETED'

    STATUS_CHOICES = [
        (STATUS_PLANNING, 'Planning'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_ON_HOLD, 'On Hold'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=150)
    key = models.CharField(max_length=10)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    start_date = models.DateField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['workspace', 'key'], name='unique_project_key_per_workspace')
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.key}] {self.name}"

    def save(self, *args, **kwargs):
        self.key = self.key.upper().strip()
        super().save(*args, **kwargs)


class Task(models.Model):
    STATUS_BACKLOG = 'BACKLOG'
    STATUS_TODO = 'TODO'
    STATUS_IN_PROGRESS = 'IN_PROGRESS'
    STATUS_IN_REVIEW = 'IN_REVIEW'
    STATUS_DONE = 'DONE'

    STATUS_CHOICES = [
        (STATUS_BACKLOG, 'Backlog'),
        (STATUS_TODO, 'To Do'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_IN_REVIEW, 'In Review'),
        (STATUS_DONE, 'Done'),
    ]

    PRIORITY_LOW = 'LOW'
    PRIORITY_MEDIUM = 'MEDIUM'
    PRIORITY_HIGH = 'HIGH'
    PRIORITY_URGENT = 'URGENT'

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, 'Low'),
        (PRIORITY_MEDIUM, 'Medium'),
        (PRIORITY_HIGH, 'High'),
        (PRIORITY_URGENT, 'Urgent'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    task_number = models.PositiveIntegerField(default=1)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_TODO)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM)
    due_date = models.DateField(null=True, blank=True)
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    reporter = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reported_tasks')
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['assignee', 'status']),
        ]

    def __str__(self):
        return f"{self.identifier}: {self.title}"

    @property
    def identifier(self):
        return f"{self.project.key}-{self.task_number}"

    def save(self, *args, **kwargs):
        if not self.pk and self.task_number == 1:
            last_task = Task.objects.filter(project=self.project).order_by('-task_number').first()
            if last_task:
                self.task_number = last_task.task_number + 1
        super().save(*args, **kwargs)


class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on {self.task.identifier}"


class ActivityLog(models.Model):
    ACTION_TASK_CREATED = 'TASK_CREATED'
    ACTION_TASK_UPDATED = 'TASK_UPDATED'
    ACTION_TASK_STATUS = 'TASK_STATUS_CHANGED'
    ACTION_TASK_DELETED = 'TASK_DELETED'
    ACTION_PROJECT_CREATED = 'PROJECT_CREATED'
    ACTION_MEMBER_ADDED = 'MEMBER_ADDED'
    ACTION_MEMBER_REMOVED = 'MEMBER_REMOVED'
    ACTION_COMMENT_ADDED = 'COMMENT_ADDED'
    ACTION_POST_CREATED = 'POST_CREATED'

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, null=True, blank=True, related_name='activities')
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    action = models.CharField(max_length=50)
    entity_type = models.CharField(max_length=50)
    entity_id = models.PositiveIntegerField(null=True, blank=True)
    summary = models.CharField(max_length=255)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M')}] {self.summary}"
