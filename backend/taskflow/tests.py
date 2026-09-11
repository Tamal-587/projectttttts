"""
Comprehensive unit and API integration tests for CodeAlpha Platform.
Covers Auth, Profiles, Posts, Likes, Comments, Follow/Unfollow, and Feed.
"""

from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import (
    UserProfile, Workspace, WorkspaceMember, Project, Task,
    Post, PostComment, Like, Follow
)


class SocialAndAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # User 1: Alex
        self.alex = User.objects.create_user(
            username='alex', email='alex@example.com', password='Password123!',
            first_name='Alexander', last_name='Vance'
        )
        # User 2: Sophia
        self.sophia = User.objects.create_user(
            username='sophia', email='sophia@example.com', password='Password123!',
            first_name='Sophia', last_name='Lin'
        )

        # Login as Alex
        login_res = self.client.post('/api/auth/login/', {
            'username_or_email': 'alex',
            'password': 'Password123!'
        })
        self.alex_token = login_res.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.alex_token}')

    def test_registration_and_validation(self):
        client = APIClient()
        # Missing fields / invalid password
        res_fail = client.post('/api/auth/register/', {
            'username': 'testuser',
            'email': 'not-an-email',
            'password': '123',
            'password_confirm': '456'
        })
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid registration
        res_ok = client.post('/api/auth/register/', {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'first_name': 'Test',
            'last_name': 'User'
        })
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res_ok.data['success'])
        self.assertIn('access', res_ok.data['tokens'])

    def test_profile_update(self):
        res = self.client.patch('/api/auth/profile/', {
            'job_title': 'Principal Architect',
            'bio': 'Designing resilient cloud distributed systems.',
            'website': 'https://alexvance.io'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.alex.profile.refresh_from_db()
        self.assertEqual(self.alex.profile.job_title, 'Principal Architect')
        self.assertEqual(self.alex.profile.website, 'https://alexvance.io')

    def test_post_creation_and_feed(self):
        # Create a post
        res_create = self.client.post('/api/posts/', {
            'content': 'First developer post on the platform!',
            'code_snippet': 'console.log("Hello World");',
            'code_language': 'javascript',
            'tags': 'javascript,react'
        })
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        post_id = res_create.data['id']
        self.assertEqual(res_create.data['content'], 'First developer post on the platform!')

        # Explore feed includes the post
        res_explore = self.client.get('/api/posts/')
        self.assertEqual(res_explore.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res_explore.data['results']), 1)

    def test_post_edit_and_delete_permissions(self):
        # Create post by Alex
        post = Post.objects.create(author=self.alex, content='Original content')

        # Alex edits own post
        res_edit = self.client.patch(f'/api/posts/{post.id}/', {'content': 'Updated content'})
        self.assertEqual(res_edit.status_code, status.HTTP_200_OK)
        self.assertEqual(res_edit.data['content'], 'Updated content')

        # Switch to Sophia
        sophia_login = self.client.post('/api/auth/login/', {
            'username_or_email': 'sophia',
            'password': 'Password123!'
        })
        sophia_token = sophia_login.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {sophia_token}')

        # Sophia attempts to edit Alex's post (must be forbidden)
        res_forbidden_edit = self.client.patch(f'/api/posts/{post.id}/', {'content': 'Hacked content'})
        self.assertEqual(res_forbidden_edit.status_code, status.HTTP_403_FORBIDDEN)

        # Sophia attempts to delete Alex's post (must be forbidden)
        res_forbidden_del = self.client.delete(f'/api/posts/{post.id}/')
        self.assertEqual(res_forbidden_del.status_code, status.HTTP_403_FORBIDDEN)

        # Switch back to Alex and delete
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.alex_token}')
        res_del = self.client.delete(f'/api/posts/{post.id}/')
        self.assertEqual(res_del.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Post.objects.filter(id=post.id).exists())

    def test_likes_and_comments(self):
        post = Post.objects.create(author=self.alex, content='Test post for likes and comments')

        # Like the post
        res_like = self.client.post(f'/api/posts/{post.id}/like/')
        self.assertEqual(res_like.status_code, status.HTTP_200_OK)
        self.assertTrue(res_like.data['is_liked'])
        self.assertEqual(res_like.data['likes_count'], 1)

        # Unlike the post
        res_unlike = self.client.post(f'/api/posts/{post.id}/like/')
        self.assertEqual(res_unlike.status_code, status.HTTP_200_OK)
        self.assertFalse(res_unlike.data['is_liked'])
        self.assertEqual(res_unlike.data['likes_count'], 0)

        # Add comment
        res_comment = self.client.post(f'/api/posts/{post.id}/comments/', {
            'content': 'Super helpful architecture insight!'
        })
        self.assertEqual(res_comment.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_comment.data['content'], 'Super helpful architecture insight!')
        comment_id = res_comment.data['id']

        # Delete comment
        res_del_comment = self.client.delete(f'/api/post-comments/{comment_id}/')
        self.assertEqual(res_del_comment.status_code, status.HTTP_204_NO_CONTENT)

    def test_follow_and_home_feed(self):
        # Alex creates post
        post_alex = Post.objects.create(author=self.alex, content='Alex exclusive update')

        # Login as Sophia
        sophia_login = self.client.post('/api/auth/login/', {
            'username_or_email': 'sophia',
            'password': 'Password123!'
        })
        sophia_token = sophia_login.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {sophia_token}')

        # Sophia's home feed before following Alex (should NOT contain Alex's post)
        res_feed_before = self.client.get('/api/posts/?feed=home')
        self.assertEqual(res_feed_before.status_code, status.HTTP_200_OK)
        post_ids = [p['id'] for p in res_feed_before.data['results']]
        self.assertNotIn(post_alex.id, post_ids)

        # Sophia follows Alex
        res_follow = self.client.post('/api/users/alex/follow/')
        self.assertEqual(res_follow.status_code, status.HTTP_200_OK)
        self.assertTrue(res_follow.data['is_following'])

        # Sophia's home feed after following Alex (MUST contain Alex's post)
        res_feed_after = self.client.get('/api/posts/?feed=home')
        self.assertEqual(res_feed_after.status_code, status.HTTP_200_OK)
        post_ids_after = [p['id'] for p in res_feed_after.data['results']]
        self.assertIn(post_alex.id, post_ids_after)

        # Sophia unfollows Alex
        res_unfollow = self.client.post('/api/users/alex/follow/')
        self.assertEqual(res_unfollow.status_code, status.HTTP_200_OK)
        self.assertFalse(res_unfollow.data['is_following'])
