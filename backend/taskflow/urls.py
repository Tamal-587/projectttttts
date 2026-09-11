"""
API URL routes for CodeAlpha_TaskFlow.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, LoginView, CurrentUserView, ChangePasswordView,
    WorkspaceViewSet, ProjectViewSet, TaskViewSet, TaskCommentViewSet
)

router = DefaultRouter()
router.register(r'workspaces', WorkspaceViewSet, basename='workspace')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'comments', TaskCommentViewSet, basename='comment')

urlpatterns = [
    # Auth & Profile Endpoints
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='auth_me'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth_change_password'),

    # ViewSets Router
    path('', include(router.urls)),
]
