"""
Django management command to seed realistic demo data for CodeAlpha Developer Social & TaskFlow Platform.
Creates demo team members, follow relations, developer posts, likes, comments, workspace, projects, and sprint tasks.
"""

from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from taskflow.models import (
    UserProfile, Workspace, WorkspaceMember, Project, Task, TaskComment, ActivityLog,
    Post, PostComment, Like, Follow
)


class Command(BaseCommand):
    help = 'Seeds database with realistic demo team, posts, likes, comments, follows, projects, and tasks.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding CodeAlpha demo data..."))

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
                'bio': 'Passionate full-stack developer focusing on distributed systems and clean architectures.',
                'website': 'https://alexvance.dev',
                'github': 'https://github.com/alexvance'
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
                'bio': 'Obsessed with micro-interactions, responsive accessibility, and performance optimization.',
                'website': 'https://sophialin.design',
                'github': 'https://github.com/sophialin'
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
                'bio': 'Database tuning, high-throughput REST APIs, and authentication security enthusiast.',
                'website': 'https://brody-systems.io',
                'github': 'https://github.com/marcusbrody'
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
                'bio': 'Continuous integration, containerization, and zero-defect QA automation advocate.',
                'website': 'https://rostova-ops.tech',
                'github': 'https://github.com/elenarostova'
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
            profile.website = udata['website']
            profile.github_url = udata['github']
            profile.save()

            created_users[udata['username']] = user

        alex = created_users['alex']
        sophia = created_users['sophia']
        marcus = created_users['marcus']
        elena = created_users['elena']

        # 2. Seed Follow Relations
        Follow.objects.all().delete()
        follows = [
            (alex, sophia),
            (alex, marcus),
            (sophia, alex),
            (sophia, elena),
            (marcus, alex),
            (marcus, sophia),
            (elena, alex),
            (elena, marcus),
        ]
        for follower, following in follows:
            Follow.objects.get_or_create(follower=follower, following=following)

        # 3. Seed Posts
        Post.objects.all().delete()
        posts_data = [
            {
                'author': alex,
                'content': "Just wrapped up architecting JWT token rotation with automatic replay in Axios! Here's a clean snippet for attaching Bearer authorization and handling 401 refresh queues gracefully without interrupting user workflow.",
                'code_snippet': "api.interceptors.response.use(\n  response => response,\n  async error => {\n    if (error.response?.status === 401 && !originalRequest._retry) {\n      originalRequest._retry = true;\n      const newAccess = await refreshAccessToken();\n      return api(originalRequest);\n    }\n    return Promise.reject(error);\n  }\n);",
                'code_language': 'javascript',
                'tags': 'react,django,jwt,architecture',
                'image_url': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
            },
            {
                'author': sophia,
                'content': "Exploring Tailwind CSS v4 in our React 19 client. The build speed is phenomenal — sub-second HMR with zero postcss config needed. Loving the sleek dark-mode slate/indigo color tokens for the new Sprint Board!",
                'code_snippet': "@import \"tailwindcss\";\n\n@layer base {\n  body {\n    @apply bg-slate-950 text-slate-100 antialiased;\n  }\n}",
                'code_language': 'css',
                'tags': 'react,tailwind,frontend,ui',
                'image_url': 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80',
            },
            {
                'author': marcus,
                'content': "Tip of the day for Django REST Framework: Always use select_related on ForeignKeys and prefetch_related on ManyToMany/Reverse relations. Cut our endpoint payload response times down by 75% on large sprint boards.",
                'code_snippet': "qs = Task.objects.select_related(\n    'project', 'assignee', 'reporter', 'assignee__profile'\n).prefetch_related('comments', 'comments__author')",
                'code_language': 'python',
                'tags': 'python,django,performance,sql',
                'image_url': '',
            },
            {
                'author': elena,
                'content': "Set up a clean GitHub Actions pipeline with automated unit testing and Vite build verification. High confidence in zero regressions before any pull request hits production.",
                'code_snippet': "name: CI Pipeline\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: python manage.py test\n      - run: npm run build",
                'code_language': 'yaml',
                'tags': 'devops,github,testing,automation',
                'image_url': '',
            }
        ]

        created_posts = []
        for pdata in posts_data:
            post = Post.objects.create(**pdata)
            created_posts.append(post)

        # 4. Seed Likes
        Like.objects.all().delete()
        likes_data = [
            (sophia, created_posts[0]),
            (marcus, created_posts[0]),
            (elena, created_posts[0]),
            (alex, created_posts[1]),
            (marcus, created_posts[1]),
            (alex, created_posts[2]),
            (sophia, created_posts[2]),
            (alex, created_posts[3]),
        ]
        for u, p in likes_data:
            Like.objects.create(user=u, post=p)

        # 5. Seed Post Comments
        PostComment.objects.all().delete()
        comments_data = [
            (created_posts[0], sophia, "The seamless refresh on 401 is game-changing. No more unexpected session expirations!"),
            (created_posts[0], marcus, "Clean interceptor design. Matches our SimpleJWT rotation settings perfectly."),
            (created_posts[1], alex, "The slate-950 backdrop gives it a real Linear/Vercel feel. Beautiful contrast!"),
            (created_posts[2], elena, "N+1 query bottlenecks are silent killers. Excellent optimization Marcus."),
        ]
        for p, u, content in comments_data:
            PostComment.objects.create(post=p, author=u, content=content)

        # 6. Seed Workspace & Projects
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
        ]

        for t_dict in tasks_p1:
            Task.objects.create(project=p1, **t_dict)

        self.stdout.write(self.style.SUCCESS("[OK] Successfully seeded CodeAlpha demo data!"))
        self.stdout.write(self.style.SUCCESS("  Demo credentials:"))
        self.stdout.write(self.style.SUCCESS("  Admin: alex@codealpha.io / Password123!"))
        self.stdout.write(self.style.SUCCESS("  Team:  sophia@codealpha.io, marcus@codealpha.io / Password123!"))
