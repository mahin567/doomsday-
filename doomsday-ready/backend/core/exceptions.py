from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.views import exception_handler


class CircularDependency(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "This change would make a movie depend on itself."
    default_code = "circular_dependency"
    error_code = "CIRCULAR_DEPENDENCY"


_CODES_BY_STATUS = {
    400: "VALIDATION_ERROR",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    415: "UNSUPPORTED_MEDIA_TYPE",
}


def api_exception_handler(exc, context):
    """Every error looks the same: {"error": {"code", "message", "details"?}}"""
    response = exception_handler(exc, context)
    if response is None:
        return None

    code = getattr(exc, "error_code", None) or _CODES_BY_STATUS.get(
        response.status_code, "ERROR"
    )
    body = {"code": code}

    if isinstance(exc, ValidationError):
        body["message"] = "Invalid input."
        body["details"] = response.data
    else:
        detail = response.data.get("detail") if isinstance(response.data, dict) else None
        body["message"] = str(detail or exc)

    response.data = {"error": body}
    return response
