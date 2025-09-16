from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny, BasePermission

# Chỉ cho phép staff chỉnh sửa, người dùng khác chỉ được xem
class IsStaffOrReadOnly(IsAuthenticated):
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return bool(request.user and request.user.is_staff)

# Chỉ chủ sở hữu hoặc admin mới được chỉnh sửa, người khác chỉ được xem
class IsOwnerOrAdmin(IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return obj.user == request.user or request.user.is_superuser

# Chỉ cho phép staff truy cập
class IsStaffOnly(BasePermission):
	def has_permission(self, request, view):
		return bool(request.user and request.user.is_staff)
     
