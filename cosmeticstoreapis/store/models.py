from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import re
from cloudinary.models import CloudinaryField
from decimal import Decimal

# ==========================
# ENUM CHO LỰA CHỌN
# ==========================
class UserRole(models.TextChoices):
    CUSTOMER = "customer", "Customer"
    ADMIN = "admin", "Admin"
    STAFF = "staff", "Staff"
    WAREHOUSE = "warehouse", "Warehouse Manager"


class OrderStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    SHIPPED = "shipped", "Shipped"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class PaymentMethod(models.TextChoices):
    CASH = "cash", "Cash"
    VNPAY = "vnpay", "VNPay"
    STRIPE = "stripe", "Stripe"


class PaymentTransactionStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    SUCCESS = "success", "Success"
    FAILED = "failed", "Failed"


class OrderType(models.TextChoices):
    DELIVERY = "delivery", "Delivery"
    PICKUP = "pickup", "Pickup"


# ==========================
# USER & USER ADDRESS
# ==========================
class User(AbstractUser):
    phone = models.CharField(max_length=20, blank=True, null=True)
    image = CloudinaryField('image', blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True, help_text="Địa chỉ giao hàng mặc định")
    role = models.CharField(
        max_length=20, choices=UserRole.choices, default=UserRole.CUSTOMER
    )

    def __str__(self):
        return self.username


class UserAddress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.is_default:
            UserAddress.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.address}"


# ==========================
# PRODUCT & DANH MỤC
# ==========================
class Brand(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image = CloudinaryField('image', blank=True, null=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    sold = models.PositiveIntegerField(default=0)
    barcode = models.CharField(max_length=100, unique=True, blank=True, null=True)
    image = CloudinaryField('image', blank=True, null=True)
    capacity = models.CharField(max_length=50, blank=True, null=True)
    origin = models.CharField(max_length=100, blank=True, null=True)
    ingredients = models.TextField(blank=True, null=True)
    skin_type = models.CharField(max_length=100, blank=True, null=True)

    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name="products")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")

    def __str__(self):
        return self.name

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = CloudinaryField('image', blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class ImportTransaction(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="imports")
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    import_date = models.DateTimeField(auto_now_add=True)


# ==========================
# SẢN PHẨM YÊU THÍCH
# ==========================
class FavoriteProduct(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_products')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user.username} thích {self.product.name}"


# ==========================
# CART & ORDER
# ==========================
class Cart(models.Model):
    discount_code = models.ForeignKey('DiscountCode', on_delete=models.SET_NULL, null=True, blank=True, related_name='carts')
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="cart")
    created_at = models.DateTimeField(auto_now_add=True)
    address = models.CharField(max_length=255, blank=True, null=True, help_text="Địa chỉ giao hàng của giỏ hàng")    
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    service_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)


class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    discount_code = models.ForeignKey("DiscountCode", on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    order_type = models.CharField(max_length=20, choices=OrderType.choices, default=OrderType.DELIVERY)
    created_at = models.DateTimeField(auto_now_add=True)
    address = models.TextField(blank=True, null=True)
    receiver_phone = models.CharField(max_length=20, blank=True, null=True)
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)


# ==========================
# PAYMENT & REVIEW
# ==========================
class PaymentTransaction(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    status = models.CharField(max_length=20, choices=PaymentTransactionStatus.choices, default=PaymentTransactionStatus.PENDING)
    transaction_date = models.DateTimeField(auto_now_add=True)


class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    rating = models.FloatField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


# ==========================
# DISCOUNT & PROMOTION
# ==========================
class DiscountCode(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    used_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def is_valid(self):
        now = timezone.now()
        if self.valid_from <= now <= self.valid_to and (self.max_uses is None or self.used_count < self.max_uses):
            return self.is_active
        return False

class Promotion(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    products = models.ManyToManyField(Product, related_name='promotions')
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    is_active = models.BooleanField(default=True)


# ==========================
# USER VOUCHER
# ==========================
class UserVoucher(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='vouchers')
    discount_code = models.ForeignKey('DiscountCode', on_delete=models.CASCADE, related_name='user_vouchers')
    received_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    expired_at = models.DateTimeField(null=True, blank=True)

    def is_active(self):
        if self.used:
            return False
        if self.expired_at and self.expired_at < timezone.now():
            return False
        return True

    def __str__(self):
        return f"{self.user.username} - {self.discount_code.code}"


# ==========================
# NOTIFICATION
# ==========================
class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('order', 'Order Update'),
        ('promotion', 'Promotion'),
        ('system', 'System'),
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class UserNotification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_notifications')
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='user_notifications')
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'notification')


# ==========================
# CHAT
# ==========================
class ChatMessage(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages_sent")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages_received")
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)


# ==========================
# SERVICE FEE
# ==========================
class ServiceFee(models.Model):
    percent = models.FloatField(default=2.0, help_text="Phần trăm phí dịch vụ")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Service Fee: {self.percent}%"
    


# ==========================
# HÀM TIỆN ÍCH LIÊN QUAN ĐẾN CART & ĐƠN HÀNG
# ==========================

# Nhận diện địa chỉ nội thành
def is_inner_city(address):
    inner_city_patterns = [
        r'\b(hà nội|hn|ha noi)\b',
        r'\b(Thành phố Hồ Chí Minh|thành phố hồ chí minh|tp hcm|hcm|sài gòn|ho chi minh|ho chi minh city)\b',
        r'\b(đà nẵng|da nang)\b'
    ]
    address_str = str(address).lower()
    return any(re.search(pattern, address_str) for pattern in inner_city_patterns)

# Tính phí vận chuyển dựa trên tổng tiền và khu vực giao hàng
def calculate_shipping_fee(cart_total, is_inner_city):
    if cart_total > 500000:
        return 0
    return 30000 if is_inner_city else 50000

# Lấy phần trăm phí dịch vụ
def get_service_fee_percent():
    config = ServiceFee.objects.order_by('-updated_at').first()
    return config.percent if config else 2.0


# Tính phí dịch vụ dựa trên tổng tiền và phần trăm phí dịch vụ
def calculate_service_fee(cart_total):
    percent = get_service_fee_percent()
    return int(cart_total * Decimal(str(percent)) / Decimal('100'))

# Tính tổng tiền đơn hàng
def calculate_order_total(cart_total, shipping_fee, service_fee, discount_amount=0):
    return cart_total + shipping_fee + service_fee - discount_amount

# Cập nhật lại phí vận chuyển và phí dịch vụ cho Cart dựa trên địa chỉ giao hàng và tổng tiền sản phẩm.
def recalculate_cart_fees(cart):
    cart_total = sum([item.product.price * item.quantity for item in cart.items.all()])
    inner_city_flag = False
    if hasattr(cart, 'address') and cart.address:
        inner_city_flag = is_inner_city(cart.address)
    shipping_fee = calculate_shipping_fee(cart_total, inner_city_flag)
    service_fee = calculate_service_fee(cart_total)
    cart.shipping_fee = shipping_fee
    cart.service_fee = service_fee
    cart.save(update_fields=['shipping_fee', 'service_fee'])
