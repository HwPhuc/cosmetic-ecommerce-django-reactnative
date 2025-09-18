from rest_framework import serializers
from .models import (
    User, Brand, Category, Product, ProductImage, ImportTransaction, Cart, CartItem, Order, OrderItem,
    PaymentTransaction, Review, DiscountCode, Promotion, Notification, UserAddress, UserNotification, ChatMessage, UserVoucher, FavoriteProduct, StockHistory
)

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(read_only=False, required=False)
    phone = serializers.CharField(required=False)
    image = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)
    last_login = serializers.DateTimeField(read_only=True)

    def validate_email(self, value):
        if not value or '@' not in value:
            raise serializers.ValidationError("Email không hợp lệ.")
        return value

    def validate_phone(self, value):
        if value and (not value.isdigit() or len(value) < 9):
            raise serializers.ValidationError("Số điện thoại không hợp lệ.")
        return value

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'phone', 'first_name', 'last_name', 'image', 'role', 'password', 'is_active', 'is_staff', 'is_superuser', 'created_at', 'last_login')
        extra_kwargs = {
            'is_active': {'read_only': True},
            'is_staff': {'read_only': True},
            'is_superuser': {'read_only': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True, required=True)
    phone = serializers.CharField(write_only=True, required=False)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email đã tồn tại.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    class Meta:
        model = User
        fields = ('username', 'email', 'phone', 'role', 'password')

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request', None)
        if instance.image and request:
            data['image'] = request.build_absolute_uri(instance.image.url)
        else:
            data['image'] = instance.image.url if instance.image else ''
        return data

    class Meta:
        model = Category
        fields = '__all__'

class ProductImageSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request', None)
        if instance.image and request:
            data['image'] = request.build_absolute_uri(instance.image.url)
        else:
            data['image'] = instance.image.url if instance.image else ''
        return data

    class Meta:
        model = ProductImage
        fields = ('id', 'product', 'image', 'uploaded_at')

class ProductSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    review_count = serializers.SerializerMethodField()
    promotion_names = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_promotion_names(self, obj):
        return [promo.name for promo in obj.promotions.all()]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request', None)
        if instance.image and request:
            data['image'] = request.build_absolute_uri(instance.image.url)
        else:
            data['image'] = instance.image.url if instance.image else ''
        return data

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'description', 'price', 'stock', 'sold',
            'barcode', 'image', 'brand', 'category', 'images',
            'review_count', 'promotion_names', 'created_at',
            'capacity', 'origin', 'ingredients', 'skin_type'
        )
    
class FavoriteProductSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), write_only=True, source='product')

    class Meta:
        model = FavoriteProduct
        fields = ['id', 'user', 'product', 'product_id', 'created_at']
        read_only_fields = ['user', 'created_at', 'product']
 
class ImportTransactionSerializer(serializers.ModelSerializer):
    import_date = serializers.DateTimeField(read_only=True)
    class Meta:
        model = ImportTransaction
        fields = '__all__'

class CartItemSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    product_name = serializers.SerializerMethodField()
    product_detail = ProductSerializer(source='product', read_only=True)

    def get_product_name(self, obj):
        return obj.product.name if obj.product else ""
    class Meta:
        model = CartItem
        fields = '__all__'

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    total_quantity = serializers.SerializerMethodField()
    shipping_fee = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    service_fee = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    user_address = serializers.SerializerMethodField()
    discount_code = serializers.SerializerMethodField()
    discount_amount = serializers.SerializerMethodField()
    def get_discount_code(self, obj):
        code = obj.discount_code
        if code:
            return {
                'id': code.id,
                'code': code.code,
                'discount_percentage': str(code.discount_percentage)
            }
        return None

    def get_discount_amount(self, obj):
        # Tính số tiền giảm giá dựa trên discount_percentage
        from decimal import Decimal
        if obj.discount_code:
            subtotal = sum([(item.product.price if item.product else Decimal('0')) * item.quantity for item in obj.items.all()])
            percent = Decimal(str(obj.discount_code.discount_percentage))
            return int(subtotal * percent / Decimal('100'))
        return 0

    def get_total_quantity(self, obj):
        return sum([item.quantity for item in obj.items.all()])

    def get_cart_total(self, obj):
        return sum([(item.product.price if item.product else 0) * item.quantity for item in obj.items.all()])

    # Xoá các hàm get_shipping_fee và get_service_fee, chỉ lấy từ trường của model
    
    def get_user_address(self, obj):
        return obj.user.address if obj.user else ""

    class Meta:
        model = Cart
        fields = ('id', 'user', 'created_at', 'items', 'total_quantity', 'shipping_fee', 'service_fee', 'address', 'user_address', 'discount_code', 'discount_amount')

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    class Meta:
        model = OrderItem
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    discount_code = serializers.SerializerMethodField()
    payments = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    status_display = serializers.SerializerMethodField()

    def get_status_display(self, obj):
        return obj.get_status_display()
    
    def get_discount_code(self, obj):
        code = obj.discount_code
        if code:
            return {
                'id': code.id,
                'code': code.code,
                'discount_percentage': str(code.discount_percentage)
            }
        return None

    class Meta:
        model = Order
        fields = ['id', 'user', 'status', 'status_display', 'total_price', 'order_type', 'created_at', 'address', 'receiver_phone', 'discount_code', 'items', 'payments', 'shipping_fee']

class PaymentTransactionSerializer(serializers.ModelSerializer):
    order = serializers.PrimaryKeyRelatedField(read_only=True)
    transaction_date = serializers.DateTimeField(read_only=True)
    class Meta:
        model = PaymentTransaction
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    comment = serializers.CharField()
    created_at = serializers.DateTimeField(read_only=True)

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating phải từ 1 đến 5.")
        return value

    class Meta:
        model = Review
        fields = '__all__'

class DiscountCodeSerializer(serializers.ModelSerializer):
    valid_from = serializers.DateTimeField(read_only=True)
    valid_to = serializers.DateTimeField(read_only=True)
    used_count = serializers.IntegerField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    class Meta:
        model = DiscountCode
        fields = '__all__'

class PromotionSerializer(serializers.ModelSerializer):
    products = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    valid_from = serializers.DateTimeField(read_only=True)
    valid_to = serializers.DateTimeField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    class Meta:
        model = Promotion
        fields = '__all__'

# UserVoucherSerializer
class UserVoucherSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    discount_code = DiscountCodeSerializer(read_only=True)
    class Meta:
        model = UserVoucher
        fields = ['id', 'user', 'discount_code', 'received_at', 'used', 'used_at', 'expired_at']

class NotificationSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)
    class Meta:
        model = Notification
        fields = '__all__'

class UserNotificationSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    notification = NotificationSerializer(read_only=True)
    is_read = serializers.BooleanField(read_only=True)
    read_at = serializers.DateTimeField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    class Meta:
        model = UserNotification
        fields = '__all__'

class ChatMessageSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField(read_only=True)
    receiver = serializers.StringRelatedField(read_only=True)
    timestamp = serializers.DateTimeField(read_only=True)
    class Meta:
        model = ChatMessage
        fields = '__all__'

class StockHistorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = StockHistory
        fields = ['id', 'product', 'product_name', 'user', 'user_name', 'change', 'note', 'created_at']
        read_only_fields = ['id', 'product_name', 'user_name', 'created_at']

