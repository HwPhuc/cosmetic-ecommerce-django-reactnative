from django.urls import include, path
from django.http import HttpResponse
from store.stripe_payment import stripe_webhook, StripeCheckoutSessionView
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, CategoryViewSet, OrderViewSet, ReviewViewSet, CartViewSet, CartItemViewSet,
    CurrentUserAPIView, RegisterUserAPIView, UpdateUserAPIView, DiscountCodeViewSet,
    stripe_success_view, stripe_cancel_view, UserAddressViewSet, UserVoucherViewSet, FavoriteProductViewSet,
    AdminOrderViewSet, InventoryListView, UpdateStockAPIView, StockHistoryListAPIView, ReportSummaryAPIView, DashboardAPIView
)

router = DefaultRouter()
router.register('products', ProductViewSet, basename='product')
router.register('categories', CategoryViewSet, basename='category')
router.register('orders', OrderViewSet, basename='order')
router.register('admin-orders', AdminOrderViewSet, basename='admin-order')
router.register('reviews', ReviewViewSet, basename='review')
router.register('carts', CartViewSet, basename='cart')
router.register('cart-items', CartItemViewSet, basename='cartitem')
router.register('discounts', DiscountCodeViewSet, basename='discountcode')
router.register('user-addresses', UserAddressViewSet, basename='user-address')
router.register('user-vouchers', UserVoucherViewSet, basename='user-voucher')
router.register('favorite-products', FavoriteProductViewSet, basename='favoriteproduct')

urlpatterns = [
    path('', include(router.urls)),
    path('current-user/', CurrentUserAPIView.as_view(), name='current-user'),
    path('register/', RegisterUserAPIView.as_view(), name='register-user'),
    path('update-user/', UpdateUserAPIView.as_view(), name='update-user'),
    path('create-stripe-session/', StripeCheckoutSessionView.as_view(), name='create-stripe-session'),
    path('success/', stripe_success_view, name='stripe-success'),
    path('cancel/', stripe_cancel_view, name='stripe-cancel'),
    path('stripe/webhook/', stripe_webhook, name='stripe-webhook'),
    path('inventory/', InventoryListView.as_view(), name='inventory'),
    path('update-stock/', UpdateStockAPIView.as_view(), name='update-stock'),
    path('stock-history/', StockHistoryListAPIView.as_view(), name='stock-history'),
    path('report-summary/', ReportSummaryAPIView.as_view(), name='report-summary'),
    path('dashboard/', DashboardAPIView.as_view(), name='dashboard'),
]