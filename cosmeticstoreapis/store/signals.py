from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Order, OrderStatus, OrderItem, Product

# Cập nhật last_login khi xác thực OAuth2
from django.contrib.auth import get_user_model
from django.utils import timezone
from oauth2_provider.signals import app_authorized

def update_last_login(sender, request, token, **kwargs):
    user = token.user
    if user:
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

app_authorized.connect(update_last_login)

# Tăng số lượng đã bán cho sản phẩm khi đơn hàng hoàn tất
@receiver(post_save, sender=Order)
def update_product_sold_on_order_completed(sender, instance, created, **kwargs):
    if not created and instance.status == OrderStatus.COMPLETED:
        for item in instance.items.all():
            product = item.product
            product.sold = (product.sold or 0) + item.quantity
            product.save(update_fields=['sold'])
