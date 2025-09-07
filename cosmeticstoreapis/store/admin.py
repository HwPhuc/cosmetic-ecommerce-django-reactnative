from django.contrib import admin
from .models import (
	User, Brand, Category, Product, ProductImage, ImportTransaction,
	Cart, CartItem, Order, OrderItem,
	PaymentTransaction, Review,
	DiscountCode, Promotion,
	Notification, UserNotification,
	ChatMessage, DiscountCode
)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
	list_display = ("username", "email", "phone", "role", "is_staff", "is_superuser")
	search_fields = ("username", "email", "phone")
	list_filter = ("role", "is_staff", "is_superuser")

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
	list_display = ("name", "description")
	search_fields = ("name",)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
	list_display = ("name", "description", "image")
	search_fields = ("name",)

class ProductImageInline(admin.TabularInline):
	model = ProductImage
	extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
	list_display = ("name", "brand", "category", "price", "stock", "sold", "barcode")
	search_fields = ("name", "barcode")
	list_filter = ("brand", "category")
	inlines = [ProductImageInline]

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
	list_display = ("product", "image", "uploaded_at")

@admin.register(ImportTransaction)
class ImportTransactionAdmin(admin.ModelAdmin):
	list_display = ("product", "quantity", "price", "import_date")
	list_filter = ("product",)

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
	list_display = ("id", "user", "created_at")

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
	list_display = ("id", "cart", "product", "quantity")

class OrderItemInline(admin.TabularInline):
	model = OrderItem
	extra = 1

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
	list_display = ("user", "status", "total_price", "order_type", "created_at")
	list_filter = ("status", "order_type")
	search_fields = ("user__username", "receiver_phone")
	inlines = [OrderItemInline]

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
	list_display = ("order", "product", "quantity", "price")

@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
	list_display = ("order", "amount", "method", "status", "transaction_date")
	list_filter = ("method", "status")

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
	list_display = ("user", "product", "rating", "created_at")
	list_filter = ("rating",)
	search_fields = ("user__username", "product__name")

@admin.register(DiscountCode)
class DiscountCodeAdmin(admin.ModelAdmin):
	list_display = ("code", "discount_percentage", "valid_from", "valid_to", "max_uses", "used_count", "is_active")
	list_filter = ("is_active",)
	search_fields = ("code",)

@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
	list_display = ("name", "discount_percentage", "valid_from", "valid_to", "is_active")
	list_filter = ("is_active",)
	search_fields = ("name",)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
	list_display = ("title", "notification_type", "created_at")
	list_filter = ("notification_type",)
	search_fields = ("title",)

@admin.register(UserNotification)
class UserNotificationAdmin(admin.ModelAdmin):
	list_display = ("user", "notification", "is_read", "read_at", "created_at")
	list_filter = ("is_read",)

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
	list_display = ("sender", "receiver", "timestamp")
	search_fields = ("sender__username", "receiver__username")
