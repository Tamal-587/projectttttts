"""
Standardized RFC-compliant custom exception handler for Django REST Framework.
Ensures predictable, beginner-friendly and frontend-friendly error structures.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        message = "An error occurred while processing your request."
        details = response.data

        # If details is a dict with 'detail', extract that as main message
        if isinstance(details, dict):
            if 'detail' in details:
                message = str(details['detail'])
            elif 'non_field_errors' in details:
                message = str(details['non_field_errors'][0])
            else:
                first_key = next(iter(details))
                val = details[first_key]
                if isinstance(val, list) and len(val) > 0:
                    message = f"{first_key}: {val[0]}"
                else:
                    message = f"Validation error on {first_key}"
        elif isinstance(details, list) and len(details) > 0:
            message = str(details[0])

        custom_data = {
            'success': False,
            'error': {
                'status_code': response.status_code,
                'message': message,
                'details': details,
            }
        }
        response.data = custom_data

    return response
