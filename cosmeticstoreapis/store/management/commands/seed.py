from django.core.management.base import BaseCommand
from store.models import Brand, Category, Product, User, Order, OrderItem, Review, Promotion, DiscountCode
from django.utils import timezone
import random

class Command(BaseCommand):
    help = 'Seed database with realistic sample data'

    def handle(self, *args, **kwargs):
        # Users
        users_data = [
            {"username": "admin", "email": "admin@example.com", "password": "admin123", "role": "admin", "is_superuser": True, "is_staff": True},
            {"username": "alice", "email": "alice@gmail.com", "password": "alice123", "role": "customer"},
            {"username": "bob", "email": "bob@gmail.com", "password": "bob123", "role": "customer"},
            {"username": "staff1", "email": "staff1@store.com", "password": "staff123", "role": "staff"},
        ]
        for u in users_data:
            if not User.objects.filter(username=u["username"]).exists():
                if u.get("is_superuser"):
                    User.objects.create_superuser(username=u["username"], email=u["email"], password=u["password"], role=u["role"])
                else:
                    User.objects.create_user(username=u["username"], email=u["email"], password=u["password"], role=u["role"])

        # Brands
        brands = [
            {"name": "L'Oreal", "description": "Thương hiệu mỹ phẩm nổi tiếng thế giới."},
            {"name": "Innisfree", "description": "Mỹ phẩm thiên nhiên Hàn Quốc."},
            {"name": "Maybelline", "description": "Trang điểm chuyên nghiệp."},
        ]
        brand_objs = []
        for b in brands:
            obj, _ = Brand.objects.get_or_create(name=b["name"], defaults={"description": b["description"]})
            brand_objs.append(obj)

        # Categories
        categories = [
            {"name": "Sữa rửa mặt", "description": "Làm sạch da mặt."},
            {"name": "Kem chống nắng", "description": "Bảo vệ da khỏi tia UV."},
            {"name": "Son môi", "description": "Trang điểm môi."},
        ]
        category_objs = []
        for c in categories:
            obj, _ = Category.objects.get_or_create(name=c["name"], defaults={"description": c["description"]})
            category_objs.append(obj)

        # Products
        products = [
            {"name": "Sữa rửa mặt Innisfree", "description": "Làm sạch dịu nhẹ, chiết xuất trà xanh.", "price": 120000, "stock": 100, "barcode": "SRM001", "brand": brand_objs[1], "category": category_objs[0]},
            {"name": "Kem chống nắng L'Oreal", "description": "Chống nắng SPF50+, không nhờn rít.", "price": 180000, "stock": 80, "barcode": "KCN001", "brand": brand_objs[0], "category": category_objs[1]},
            {"name": "Son môi Maybelline", "description": "Màu đỏ quyến rũ, lâu trôi.", "price": 150000, "stock": 60, "barcode": "SON001", "brand": brand_objs[2], "category": category_objs[2]},
        ]
        product_objs = []
        for p in products:
            obj, _ = Product.objects.get_or_create(
                name=p["name"], defaults={
                    "description": p["description"], "price": p["price"], "stock": p["stock"], "barcode": p["barcode"], "brand": p["brand"], "category": p["category"]
                }
            )
            product_objs.append(obj)

        # Discount Codes
        discounts = [
            {"code": "SALE10", "discount_percentage": 10, "valid_from": timezone.now(), "valid_to": timezone.now() + timezone.timedelta(days=30), "max_uses": 100},
            {"code": "FREESHIP", "discount_percentage": 5, "valid_from": timezone.now(), "valid_to": timezone.now() + timezone.timedelta(days=15), "max_uses": 50},
        ]
        for d in discounts:
            DiscountCode.objects.get_or_create(code=d["code"], defaults={
                "discount_percentage": d["discount_percentage"], "valid_from": d["valid_from"], "valid_to": d["valid_to"], "max_uses": d["max_uses"]
            })

        # Promotions
        promo = Promotion.objects.get_or_create(
            name="Khuyến mãi tháng 8",
            defaults={
                "description": "Giảm giá 10% cho tất cả sản phẩm Innisfree.",
                "discount_percentage": 10,
                "valid_from": timezone.now(),
                "valid_to": timezone.now() + timezone.timedelta(days=10),
                "is_active": True
            }
        )[0]
        promo.products.set([product_objs[0]])

        # Orders & OrderItems
        alice = User.objects.get(username="alice")
        order = Order.objects.create(user=alice, status="paid", total_price=270000, order_type="delivery", shipping_address="123 Đường ABC, Quận 1", receiver_phone="0901234567")
        OrderItem.objects.create(order=order, product=product_objs[0], quantity=1, price=120000)
        OrderItem.objects.create(order=order, product=product_objs[2], quantity=1, price=150000)

        # Reviews
        Review.objects.get_or_create(user=alice, product=product_objs[0], defaults={"rating": 4.5, "comment": "Sản phẩm tốt, dùng thích!"})
        Review.objects.get_or_create(user=alice, product=product_objs[2], defaults={"rating": 5, "comment": "Son màu đẹp, lâu trôi."})

        # PaymentTransaction
        from store.models import PaymentTransaction
        PaymentTransaction.objects.get_or_create(order=order, defaults={
            "amount": order.total_price,
            "method": "cash",
            "status": "success"
        })

        # Notification & UserNotification
        from store.models import Notification, UserNotification
        notif = Notification.objects.create(title="Đơn hàng đã được thanh toán", message="Cảm ơn bạn đã mua hàng!", notification_type="order")
        UserNotification.objects.create(user=alice, notification=notif, is_read=False)

        # ChatMessage
        from store.models import ChatMessage
        bob = User.objects.get(username="bob")
        ChatMessage.objects.create(sender=alice, receiver=bob, message="Bạn đã thử sản phẩm mới chưa?")
        ChatMessage.objects.create(sender=bob, receiver=alice, message="Rồi, dùng thích lắm!")

        # Cart & CartItem
        from store.models import Cart, CartItem
        cart, _ = Cart.objects.get_or_create(user=alice)
        CartItem.objects.get_or_create(cart=cart, product=product_objs[0], defaults={"quantity": 2})
        CartItem.objects.get_or_create(cart=cart, product=product_objs[2], defaults={"quantity": 1})

        # ImportTransaction
        from store.models import ImportTransaction
        ImportTransaction.objects.get_or_create(product=product_objs[0], defaults={"quantity": 50, "price": 100000})
        ImportTransaction.objects.get_or_create(product=product_objs[2], defaults={"quantity": 30, "price": 120000})

        self.stdout.write(self.style.SUCCESS('Seeded realistic data for tất cả các model chính!'))
