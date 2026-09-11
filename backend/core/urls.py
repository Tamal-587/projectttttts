"""
URL configuration for core project.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def api_root_view(request):
    return JsonResponse({
        'application': 'CodeAlpha_TaskFlow API',
        'status': 'healthy',
        'version': '1.0.0',
        'endpoints': {
            'auth_register': '/api/auth/register/',
            'auth_login': '/api/auth/login/',
            'auth_refresh': '/api/auth/token/refresh/',
            'auth_me': '/api/auth/me/',
            'workspaces': '/api/workspaces/',
            'projects': '/api/projects/',
            'tasks': '/api/tasks/',
            'comments': '/api/comments/',
            'admin': '/admin/',
        }
    })


urlpatterns = [
    path('', api_root_view, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/', include('taskflow.urls')),
]
