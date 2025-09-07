from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, CategoryViewSet, OrderViewSet, ReviewViewSet, CartViewSet, CartItemViewSet,
    CurrentUserAPIView, RegisterUserAPIView, UpdateUserAPIView, DiscountCodeViewSet
)

router = DefaultRouter()
router.register('products', ProductViewSet, basename='product')
router.register('categories', CategoryViewSet, basename='category')
router.register('orders', OrderViewSet, basename='order')
router.register('reviews', ReviewViewSet, basename='review')
router.register('carts', CartViewSet, basename='cart')
router.register('cart-items', CartItemViewSet, basename='cartitem')
router.register('discounts', DiscountCodeViewSet, basename='discountcode')

urlpatterns = [
    path('', include(router.urls)),
    path('current-user/', CurrentUserAPIView.as_view(), name='current-user'),
    path('register/', RegisterUserAPIView.as_view(), name='register-user'),
    path('update-user/', UpdateUserAPIView.as_view(), name='update-user'),
]