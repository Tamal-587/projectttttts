"""
DRF Serializers for CodeAlpha Developer Social & TaskFlow Platform.
Handles data validation, serialization for Auth, Posts, Likes, Comments, Follows, Workspaces, and Tasks.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import (
    UserProfile, Workspace, WorkspaceMember, Project, Task, TaskComment, ActivityLog,
    Post, PostComment, Like, Follow
)


class UserProfileSerializer(serializers.ModelSerializer):
    followers_count = serializers.ReadOnlyField()
    following_count = serializers.ReadOnlyField()
    posts_count = serializers.ReadOnlyField()

    class Meta:
        model = UserProfile
        fields = [
            'avatar_url', 'job_title', 'department', 'bio', 'phone',
            'website', 'github_url', 'followers_count', 'following_count', 'posts_count',
            'created_at', 'updated_at'
        ]


class UserPublicSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile', 'is_following']

    def get_is_following(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or request.user == obj:
            return False
        return Follow.objects.filter(follower=request.user, following=obj).exists()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value.lower()

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value


# ==============================================================================
# SOCIAL NETWORK / POSTS & COMMENTS SERIALIZERS
# ==============================================================================

class PostCommentSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)

    class Meta:
        model = PostComment
        fields = ['id', 'post', 'author', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'post', 'author', 'created_at', 'updated_at']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['author'] = request.user
        return super().create(validated_data)


class PostSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)
    likes_count = serializers.ReadOnlyField()
    comments_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    comments = PostCommentSerializer(source='post_comments', many=True, read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'author', 'content', 'code_snippet', 'code_language',
            'image_url', 'tags', 'likes_count', 'comments_count',
            'is_liked', 'comments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Like.objects.filter(user=request.user, post=obj).exists()

    def validate_content(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Post content cannot be empty.")
        return val

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['author'] = request.user
        return super().create(validated_data)


class FollowSerializer(serializers.ModelSerializer):
    follower = UserPublicSerializer(read_only=True)
    following = UserPublicSerializer(read_only=True)

    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at']


# ==============================================================================
# WORKSPACES & PROJECTS SERIALIZERS
# ==============================================================================

class WorkspaceMemberSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    username_or_email = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = WorkspaceMember
        fields = ['id', 'workspace', 'user', 'user_id', 'username_or_email', 'role', 'joined_at']
        read_only_fields = ['id', 'workspace', 'joined_at']

    def create(self, validated_data):
        username_or_email = validated_data.pop('username_or_email', None)
        user_id = validated_data.pop('user_id', None)
        user = None

        if user_id:
            user = User.objects.filter(id=user_id).first()
        elif username_or_email:
            user = User.objects.filter(email__iexact=username_or_email).first() or \
                   User.objects.filter(username__iexact=username_or_email).first()

        if not user:
            raise serializers.ValidationError({"user": "User could not be found with the provided username or email."})

        workspace = validated_data['workspace']
        if WorkspaceMember.objects.filter(workspace=workspace, user=user).exists():
            raise serializers.ValidationError({"user": "User is already a member of this workspace."})

        return WorkspaceMember.objects.create(workspace=workspace, user=user, **validated_data)


class WorkspaceSerializer(serializers.ModelSerializer):
    owner = UserPublicSerializer(read_only=True)
    my_role = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    project_count = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = [
            'id', 'name', 'slug', 'description', 'owner',
            'my_role', 'member_count', 'project_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'owner', 'created_at', 'updated_at']

    def get_my_role(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        if obj.owner == request.user:
            return WorkspaceMember.ROLE_OWNER
        membership = obj.memberships.filter(user=request.user).first()
        return membership.role if membership else None

    def get_member_count(self, obj):
        return obj.memberships.count()

    def get_project_count(self, obj):
        return obj.projects.count()

    def create(self, validated_data):
        request = self.context.get('request')
        workspace = Workspace.objects.create(owner=request.user, **validated_data)
        WorkspaceMember.objects.create(workspace=workspace, user=request.user, role=WorkspaceMember.ROLE_OWNER)
        return workspace


class ProjectSerializer(serializers.ModelSerializer):
    created_by = UserPublicSerializer(read_only=True)
    task_metrics = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'workspace', 'name', 'key', 'description',
            'status', 'start_date', 'target_date', 'created_by',
            'task_metrics', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_task_metrics(self, obj):
        tasks = obj.tasks.all()
        total = tasks.count()
        done = tasks.filter(status=Task.STATUS_DONE).count()
        in_progress = tasks.filter(status=Task.STATUS_IN_PROGRESS).count()
        todo = tasks.filter(status__in=[Task.STATUS_TODO, Task.STATUS_BACKLOG]).count()
        completion_rate = int((done / total) * 100) if total > 0 else 0
        return {
            'total': total,
            'done': done,
            'in_progress': in_progress,
            'todo': todo,
            'completion_rate': completion_rate
        }

    def validate_key(self, value):
        val = value.strip().upper()
        if not val.isalnum():
            raise serializers.ValidationError("Project key must contain only letters and numbers (e.g. PRJ, DEV1).")
        if len(val) < 2 or len(val) > 8:
            raise serializers.ValidationError("Project key must be between 2 and 8 characters.")
        return val


class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)

    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'author', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'task', 'author', 'created_at', 'updated_at']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['author'] = request.user
        return super().create(validated_data)


class TaskSerializer(serializers.ModelSerializer):
    assignee = UserPublicSerializer(read_only=True)
    reporter = UserPublicSerializer(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='assignee', allow_null=True, required=False, write_only=True
    )
    comments_count = serializers.SerializerMethodField()
    identifier = serializers.ReadOnlyField()

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'task_number', 'identifier', 'title', 'description',
            'status', 'priority', 'due_date', 'estimated_hours',
            'assignee', 'assignee_id', 'reporter', 'order',
            'comments_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'task_number', 'identifier', 'reporter', 'order', 'created_at', 'updated_at']

    def get_comments_count(self, obj):
        return obj.comments.count()

    def validate_title(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Task title cannot be empty.")
        return val

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['reporter'] = request.user
        return super().create(validated_data)


class TaskStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['status', 'order']


class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'workspace', 'project', 'user', 'action', 'entity_type', 'entity_id', 'summary', 'details', 'created_at']
        read_only_fields = fields
