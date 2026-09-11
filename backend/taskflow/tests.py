"""
Comprehensive unit and API integration tests for CodeAlpha_TaskFlow.
Covers Auth, RBAC Permissions, Projects, Tasks, and Activity Logging.
"""

from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Workspace, WorkspaceMember, Project, Task, TaskComment, ActivityLog


class AuthAndUserTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_user_registration_success(self):
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'first_name': 'Test',
            'last_name': 'User'
        }
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data['tokens'])
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_user_registration_mismatched_passwords(self):
        data = {
            'username': 'baduser',
            'email': 'baduser@example.com',
            'password': 'Password123!',
            'password_confirm': 'Different123!',
        }
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login_with_email_and_username(self):
        user = User.objects.create_user(
            username='johndoe', email='john@example.com', password='Password123!'
        )

        # Login with email
        res_email = self.client.post('/api/auth/login/', {
            'username_or_email': 'john@example.com',
            'password': 'Password123!'
        })
        self.assertEqual(res_email.status_code, status.HTTP_200_OK)
        self.assertIn('access', res_email.data['tokens'])

        # Login with username
        res_user = self.client.post('/api/auth/login/', {
            'username_or_email': 'johndoe',
            'password': 'Password123!'
        })
        self.assertEqual(res_user.status_code, status.HTTP_200_OK)

        # Login with invalid password
        res_bad = self.client.post('/api/auth/login/', {
            'username_or_email': 'johndoe',
            'password': 'WrongPassword!'
        })
        self.assertEqual(res_bad.status_code, status.HTTP_401_UNAUTHORIZED)


class WorkspaceAndTaskTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            username='owner_user', email='owner@example.com', password='Password123!'
        )
        self.member = User.objects.create_user(
            username='member_user', email='member@example.com', password='Password123!'
        )

        # Authenticate as owner
        login_res = self.client.post('/api/auth/login/', {
            'username_or_email': 'owner_user',
            'password': 'Password123!'
        })
        self.access_token = login_res.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

        # Create workspace
        self.workspace = Workspace.objects.create(
            name='Test Workspace', slug='test-workspace', owner=self.owner
        )
        WorkspaceMember.objects.create(
            workspace=self.workspace, user=self.owner, role=WorkspaceMember.ROLE_OWNER
        )
        WorkspaceMember.objects.create(
            workspace=self.workspace, user=self.member, role=WorkspaceMember.ROLE_MEMBER
        )

        # Create project
        self.project = Project.objects.create(
            workspace=self.workspace,
            name='Alpha Project',
            key='TST',
            created_by=self.owner
        )

    def test_list_workspaces(self):
        response = self.client.get('/api/workspaces/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['slug'], 'test-workspace')

    def test_create_and_update_task(self):
        # Create task
        task_data = {
            'project': self.project.id,
            'title': 'Implement API caching',
            'description': 'Cache repetitive queries using Redis',
            'priority': Task.PRIORITY_HIGH,
            'status': Task.STATUS_TODO
        }
        response = self.client.post('/api/tasks/', task_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        task_id = response.data['id']
        self.assertEqual(response.data['identifier'], 'TST-1')

        # Quick status update
        status_res = self.client.patch(f'/api/tasks/{task_id}/status/', {
            'status': Task.STATUS_IN_PROGRESS
        })
        self.assertEqual(status_res.status_code, status.HTTP_200_OK)
        self.assertEqual(status_res.data['status'], Task.STATUS_IN_PROGRESS)

        # Verify activity log entry created
        activity = ActivityLog.objects.filter(
            workspace=self.workspace,
            action=ActivityLog.ACTION_TASK_STATUS
        ).first()
        self.assertIsNotNone(activity)

    def test_workspace_analytics(self):
        # Create a task in the project
        Task.objects.create(
            project=self.project,
            title='Sample Analytics Task',
            status=Task.STATUS_DONE,
            priority=Task.PRIORITY_MEDIUM,
            reporter=self.owner
        )

        response = self.client.get(f'/api/workspaces/{self.workspace.slug}/analytics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['summary']['total_tasks'], 1)
        self.assertEqual(response.data['summary']['completed_tasks'], 1)
        self.assertEqual(response.data['summary']['completion_rate'], 100)
