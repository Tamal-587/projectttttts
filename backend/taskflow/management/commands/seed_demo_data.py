"""
Django management command to seed realistic demo data for CodeAlpha_TaskFlow.
Creates demo team members, a collaborative workspace, projects, tasks, comments, and activity audit logs.
"""

from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from taskflow.models import (
    UserProfile, Workspace, WorkspaceMember, Project, Task, TaskComment, ActivityLog
)


class Command(BaseCommand):
    help = 'Seeds database with realistic demo team, projects, tasks, comments and audit logs.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding CodeAlpha_TaskFlow demo data..."))

        # 1. Create Demo Users
        users_data = [
            {
                'username': 'alex',
                'email': 'alex@codealpha.io',
                'first_name': 'Alexander',
                'last_name': 'Vance',
                'password': 'Password123!',
                'title': 'Lead Software Architect',
                'dept': 'Engineering',
                'avatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                'bio': 'Passionate full-stack developer focusing on distributed systems and clean architectures.'
            },
            {
                'username': 'sophia',
                'email': 'sophia@codealpha.io',
                'first_name': 'Sophia',
                'last_name': 'Lin',
                'password': 'Password123!',
                'title': 'Senior Frontend Engineer',
                'dept': 'Product Design & UI',
                'avatar': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                'bio': 'Obsessed with micro-interactions, responsive accessibility, and performance optimization.'
            },
            {
                'username': 'marcus',
                'email': 'marcus@codealpha.io',
                'first_name': 'Marcus',
                'last_name': 'Brody',
                'password': 'Password123!',
                'title': 'Backend Specialist',
                'dept': 'Core Systems',
                'avatar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                'bio': 'Database tuning, high-throughput REST APIs, and authentication security enthusiast.'
            },
            {
                'username': 'elena',
                'email': 'elena@codealpha.io',
                'first_name': 'Elena',
                'last_name': 'Rostova',
                'password': 'Password123!',
                'title': 'DevOps & QA Engineer',
                'dept': 'Infrastructure',
                'avatar': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
                'bio': 'Continuous integration, containerization, and zero-defect QA automation advocate.'
            }
        ]

        created_users = {}
        for udata in users_data:
            user, created = User.objects.get_or_create(
                username=udata['username'],
                defaults={
                    'email': udata['email'],
                    'first_name': udata['first_name'],
                    'last_name': udata['last_name'],
                    'is_staff': (udata['username'] == 'alex'),
                    'is_superuser': (udata['username'] == 'alex')
                }
            )
            user.set_password(udata['password'])
            user.save()

            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.job_title = udata['title']
            profile.department = udata['dept']
            profile.avatar_url = udata['avatar']
            profile.bio = udata['bio']
            profile.save()

            created_users[udata['username']] = user

        alex = created_users['alex']
        sophia = created_users['sophia']
        marcus = created_users['marcus']
        elena = created_users['elena']

        # 2. Create Workspace
        workspace, _ = Workspace.objects.get_or_create(
            slug='codealpha-workspace',
            defaults={
                'name': 'CodeAlpha Enterprise Workspace',
                'description': 'Main engineering sprint space for CodeAlpha full-stack projects.',
                'owner': alex
            }
        )
        workspace.name = 'CodeAlpha Enterprise Workspace'
        workspace.owner = alex
        workspace.save()

        # Memberships
        memberships = [
            (alex, WorkspaceMember.ROLE_OWNER),
            (sophia, WorkspaceMember.ROLE_ADMIN),
            (marcus, WorkspaceMember.ROLE_MEMBER),
            (elena, WorkspaceMember.ROLE_MEMBER),
        ]
        for u, role in memberships:
            wm, _ = WorkspaceMember.objects.get_or_create(
                workspace=workspace,
                user=u,
                defaults={'role': role}
            )
            wm.role = role
            wm.save()

        # 3. Create Projects
        p1, _ = Project.objects.get_or_create(
            workspace=workspace,
            key='ALPHA',
            defaults={
                'name': 'TaskFlow Platform v2.0',
                'description': 'Next-gen enterprise agile management system with real-time kanban and metrics.',
                'status': Project.STATUS_ACTIVE,
                'start_date': timezone.now().date() - timedelta(days=14),
                'target_date': timezone.now().date() + timedelta(days=21),
                'created_by': alex
            }
        )

        p2, _ = Project.objects.get_or_create(
            workspace=workspace,
            key='CLOUD',
            defaults={
                'name': 'Cloud Infrastructure & CI/CD',
                'description': 'Containerization, automated pipelines, and PostgreSQL database cluster provisioning.',
                'status': Project.STATUS_PLANNING,
                'start_date': timezone.now().date() + timedelta(days=7),
                'target_date': timezone.now().date() + timedelta(days=45),
                'created_by': elena
            }
        )

        # 4. Clear and populate Tasks for project 1
        Task.objects.filter(project__in=[p1, p2]).delete()

        tasks_p1 = [
            {
                'title': 'Design high-converting SaaS landing and dashboard layout',
                'description': 'Implement responsive modern cards, KPI analytics counters, and interactive navigation bars using Tailwind CSS and Lucide icons.',
                'status': Task.STATUS_DONE,
                'priority': Task.PRIORITY_HIGH,
                'assignee': sophia,
                'reporter': alex,
                'due_date': timezone.now().date() - timedelta(days=2),
                'estimated_hours': 12,
                'order': 1
            },
            {
                'title': 'Architect JWT Authentication & Refresh Token Pipeline',
                'description': 'Configure Django REST Framework with SimpleJWT, supporting dual username/email login and automatic token refresh interceptors.',
                'status': Task.STATUS_DONE,
                'priority': Task.PRIORITY_URGENT,
                'assignee': marcus,
                'reporter': alex,
                'due_date': timezone.now().date() - timedelta(days=1),
                'estimated_hours': 8,
                'order': 2
            },
            {
                'title': 'Implement drag-and-drop & quick-move Kanban Board',
                'description': 'Enable seamless task status transitions between Backlog, To Do, In Progress, Review, and Done columns with visual indicators.',
                'status': Task.STATUS_IN_PROGRESS,
                'priority': Task.PRIORITY_URGENT,
                'assignee': sophia,
                'reporter': alex,
                'due_date': timezone.now().date() + timedelta(days=2),
                'estimated_hours': 16,
                'order': 3
            },
            {
                'title': 'Implement Workspace Role-Based Access Control (RBAC)',
                'description': 'Enforce strict backend permissions ensuring Viewers have read-only access while Members and Admins can manipulate entities.',
                'status': Task.STATUS_IN_PROGRESS,
                'priority': Task.PRIORITY_HIGH,
                'assignee': marcus,
                'reporter': alex,
                'due_date': timezone.now().date() + timedelta(days=3),
                'estimated_hours': 10,
                'order': 4
            },
            {
                'title': 'Conduct Automated API & Model Unit Tests',
                'description': 'Write comprehensive test cases covering authentication flows, permission boundary checks, and task status transitions.',
                'status': Task.STATUS_IN_REVIEW,
                'priority': Task.PRIORITY_HIGH,
                'assignee': elena,
                'reporter': marcus,
                'due_date': timezone.now().date() + timedelta(days=1),
                'estimated_hours': 6,
                'order': 5
            },
            {
                'title': 'Build slide-over Task Detail Drawer with live comment thread',
                'description': 'Create rich task inspector allowing team members to change status, adjust priority, reassign owners, and post instant comments.',
                'status': Task.STATUS_TODO,
                'priority': Task.PRIORITY_MEDIUM,
                'assignee': sophia,
                'reporter': alex,
                'due_date': timezone.now().date() + timedelta(days=5),
                'estimated_hours': 8,
                'order': 6
            },
            {
                'title': 'Optimize ORM queries with select_related & prefetch_related',
                'description': 'Prevent N+1 query overhead across workspace members, projects, and task commenter relations.',
                'status': Task.STATUS_TODO,
                'priority': Task.PRIORITY_MEDIUM,
                'assignee': marcus,
                'reporter': alex,
                'due_date': timezone.now().date() + timedelta(days=6),
                'estimated_hours': 4,
                'order': 7
            },
            {
                'title': 'Integrate WebSocket or Server-Sent Events for live push alerts',
                'description': 'Explore lightweight event dispatching for instant multi-user board synchronization.',
                'status': Task.STATUS_BACKLOG,
                'priority': Task.PRIORITY_LOW,
                'assignee': alex,
                'reporter': alex,
                'due_date': timezone.now().date() + timedelta(days=14),
                'estimated_hours': 20,
                'order': 8
            },
        ]

        tasks_p2 = [
            {
                'title': 'Draft Dockerfile and multi-stage container build',
                'description': 'Optimize production container image sizes with slim base images and clean asset compilation.',
                'status': Task.STATUS_TODO,
                'priority': Task.PRIORITY_HIGH,
                'assignee': elena,
                'reporter': alex,
                'due_date': timezone.now().date() + timedelta(days=10),
                'estimated_hours': 8,
                'order': 1
            },
            {
                'title': 'Configure GitHub Actions CI/CD Pipeline',
                'description': 'Automated linting, backend test suite execution, and frontend Vite build verification on every pull request.',
                'status': Task.STATUS_IN_PROGRESS,
                'priority': Task.PRIORITY_URGENT,
                'assignee': elena,
                'reporter': alex,
                'due_date': timezone.now().date() + timedelta(days=4),
                'estimated_hours': 10,
                'order': 2
            }
        ]

        all_created_tasks = []
        for t_dict in tasks_p1:
            task = Task.objects.create(project=p1, **t_dict)
            all_created_tasks.append(task)

        for t_dict in tasks_p2:
            task = Task.objects.create(project=p2, **t_dict)
            all_created_tasks.append(task)

        # 5. Add Task Comments
        if all_created_tasks:
            t_jwt = all_created_tasks[1]  # JWT task
            TaskComment.objects.create(
                task=t_jwt,
                author=alex,
                content="Ensure the refresh token rotation is enabled and access token expiry is set to 60 minutes for security."
            )
            TaskComment.objects.create(
                task=t_jwt,
                author=marcus,
                content="Completed! Added token refresh endpoint with Axios response interceptor that automatically replays pending requests."
            )

            t_kanban = all_created_tasks[2]  # Kanban task
            TaskComment.objects.create(
                task=t_kanban,
                author=sophia,
                content="Kanban layout looks slick! Working on optimistic UI updates so column transitions feel instantaneous."
            )

        # 6. Seed Activity Logs
        ActivityLog.objects.filter(workspace=workspace).delete()
        activities = [
            (alex, ActivityLog.ACTION_PROJECT_CREATED, 'Project', p1.id, "Created project 'TaskFlow Platform v2.0' (ALPHA)."),
            (alex, ActivityLog.ACTION_MEMBER_ADDED, 'WorkspaceMember', 2, "Added Sophia Lin as Admin to workspace."),
            (alex, ActivityLog.ACTION_MEMBER_ADDED, 'WorkspaceMember', 3, "Added Marcus Brody as Member to workspace."),
            (marcus, ActivityLog.ACTION_TASK_STATUS, 'Task', all_created_tasks[1].id, f"Completed {all_created_tasks[1].identifier}: 'Architect JWT Authentication'."),
            (sophia, ActivityLog.ACTION_TASK_STATUS, 'Task', all_created_tasks[0].id, f"Completed {all_created_tasks[0].identifier}: 'Design high-converting SaaS landing'."),
            (sophia, ActivityLog.ACTION_COMMENT_ADDED, 'Task', all_created_tasks[2].id, f"Commented on {all_created_tasks[2].identifier}."),
        ]

        for u, action_type, entity_type, entity_id, summary in activities:
            ActivityLog.objects.create(
                workspace=workspace,
                project=p1,
                user=u,
                action=action_type,
                entity_type=entity_type,
                entity_id=entity_id,
                summary=summary
            )

        self.stdout.write(self.style.SUCCESS("[OK] Successfully seeded CodeAlpha_TaskFlow demo data!"))
        self.stdout.write(self.style.SUCCESS("  Demo credentials:"))
        self.stdout.write(self.style.SUCCESS("  Admin: alex@codealpha.io / Password123!"))
        self.stdout.write(self.style.SUCCESS("  Team:  sophia@codealpha.io, marcus@codealpha.io / Password123!"))
