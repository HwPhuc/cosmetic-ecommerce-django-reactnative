from django.template.response import TemplateResponse
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework import status, viewsets, generics, filters, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from oauth2_provider.contrib.rest_framework import TokenHasReadWriteScope
from store.models import (
	UserAddress,
	recalculate_cart_fees,
	Product, Category, Order, Review,
	Cart, CartItem, DiscountCode, UserVoucher,
	OrderStatus, FavoriteProduct
)
from .serializers import (
	ProductSerializer, CategorySerializer, OrderSerializer, ReviewSerializer,
	CartSerializer, CartItemSerializer, UserAddressSerializer, UserSerializer, 
	DiscountCodeSerializer, UserVoucherSerializer, FavoriteProductSerializer
)
from .permissions import IsStaffOnly, IsStaffOrReadOnly, IsOwnerOrAdmin
from .pagination import StandardResultsSetPagination


# Trang thanh toán thành công
def stripe_success_view(request):
	return TemplateResponse(request, "store/stripe_success.html")

# Trang hủy thanh toán
def stripe_cancel_view(request):
	return TemplateResponse(request, "store/stripe_cancel.html")


# API lấy thông tin user hiện tại
class CurrentUserAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		serializer = UserSerializer(request.user)
		return Response(serializer.data)

# API đăng ký user mới
class RegisterUserAPIView(APIView):
	def post(self, request):
		serializer = UserSerializer(data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=status.HTTP_201_CREATED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# API cập nhật thông tin user hiện tại
class UpdateUserAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def patch(self, request):
		serializer = UserSerializer(request.user, data=request.data, partial=True)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserAddressViewSet(viewsets.ModelViewSet):
	serializer_class = UserAddressSerializer
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		user = self.request.user
		if getattr(self, 'swagger_fake_view', False) or not user.is_authenticated:
			return UserAddress.objects.none()
		return UserAddress.objects.filter(user=user).order_by('-is_default', '-created_at')

	def perform_create(self, serializer):
		serializer.save(user=self.request.user)

	@action(detail=True, methods=['post'])
	def set_default(self, request, pk=None):
		address = self.get_object()
		address.is_default = True
		address.save()
		return Response({'status': 'Đã đặt làm mặc định'})

# API lấy voucher cá nhân của user
class UserVoucherViewSet(viewsets.ViewSet, generics.ListAPIView):
	serializer_class = UserVoucherSerializer
	pagination_class = StandardResultsSetPagination
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		user = self.request.user
		if getattr(self, 'swagger_fake_view', False) or not user.is_authenticated:
			return UserVoucher.objects.none()
		return UserVoucher.objects.filter(user=user).order_by('-received_at')

	def list(self, request):
		queryset = self.get_queryset()
		page = self.paginate_queryset(queryset)
		if page is not None:
			serializer = UserVoucherSerializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = UserVoucherSerializer(queryset, many=True)
		return Response(serializer.data)

	def retrieve(self, request, pk=None):
		try:
			voucher = UserVoucher.objects.get(pk=pk, user=request.user)
		except UserVoucher.DoesNotExist:
			return Response(status=404)
		serializer = UserVoucherSerializer(voucher)
		return Response(serializer.data)

# Product chỉ staff được chỉnh sửa, người khác chỉ xem
class ProductViewSet(viewsets.ViewSet, generics.ListAPIView):
	filter_backends = [filters.SearchFilter]
	search_fields = ['name', 'description', 'barcode']
	queryset = Product.objects.all().order_by('id')
	serializer_class = ProductSerializer
	pagination_class = StandardResultsSetPagination
	permission_classes = [IsAuthenticated, IsStaffOrReadOnly, TokenHasReadWriteScope]

	def get_queryset(self):
		queryset = Product.objects.all().order_by('id')
		category_id = self.request.query_params.get('category')
		brand_id = self.request.query_params.get('brand')
		if category_id:
			queryset = queryset.filter(category_id=category_id)
		if brand_id:
			queryset = queryset.filter(brand_id=brand_id)
		return queryset

	def retrieve(self, request, pk=None):
		try:
			product = Product.objects.get(pk=pk)
		except Product.DoesNotExist:
			return Response(status=404)
		serializer = ProductSerializer(product, context={'request': request})
		return Response(serializer.data)

	def create(self, request):
		serializer = ProductSerializer(data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=201)
		return Response(serializer.errors, status=400)

	def update(self, request, pk=None):
		try:
			product = Product.objects.get(pk=pk)
		except Product.DoesNotExist:
			return Response(status=404)
		serializer = ProductSerializer(product, data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)
		return Response(serializer.errors, status=400)

	def destroy(self, request, pk=None):
		try:
			product = Product.objects.get(pk=pk)
		except Product.DoesNotExist:
			return Response(status=404)
		product.delete()
		return Response(status=204)

class FavoriteProductViewSet(viewsets.ModelViewSet):
	serializer_class = FavoriteProductSerializer
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		queryset = FavoriteProduct.objects.filter(user=self.request.user)
		product_id = self.request.query_params.get('product')
		if product_id:
			queryset = queryset.filter(product_id=product_id)
		return queryset

	def perform_create(self, serializer):
		user = self.request.user
		product = serializer.validated_data.get('product')
		if FavoriteProduct.objects.filter(user=user, product=product).exists():
			raise serializers.ValidationError({'detail': 'Sản phẩm đã có trong danh sách yêu thích.'})
		serializer.save(user=user)

	def destroy(self, request, pk=None):
		try:
			fav = FavoriteProduct.objects.get(pk=pk, user=request.user)
		except FavoriteProduct.DoesNotExist:
			return Response({'detail': 'Không tìm thấy'}, status=404)
		fav.delete()
		return Response(status=204)

# Category chỉ staff được chỉnh sửa, người khác chỉ xem
class CategoryViewSet(viewsets.ViewSet, generics.ListAPIView):
	filter_backends = [filters.SearchFilter]
	search_fields = ['name', 'description']
	queryset = Category.objects.all().order_by('id')
	serializer_class = CategorySerializer
	pagination_class = StandardResultsSetPagination
	permission_classes = [IsAuthenticated, IsStaffOrReadOnly, TokenHasReadWriteScope]

	def retrieve(self, request, pk=None):
		try:
			category = Category.objects.get(pk=pk)
		except Category.DoesNotExist:
			return Response(status=404)
		serializer = CategorySerializer(category, context={'request': request})
		return Response(serializer.data)

	def create(self, request):
		serializer = CategorySerializer(data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=201)
		return Response(serializer.errors, status=400)

	def update(self, request, pk=None):
		try:
			category = Category.objects.get(pk=pk)
		except Category.DoesNotExist:
			return Response(status=404)
		serializer = CategorySerializer(category, data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)
		return Response(serializer.errors, status=400)

	def destroy(self, request, pk=None):
		try:
			category = Category.objects.get(pk=pk)
		except Category.DoesNotExist:
			return Response(status=404)
		category.delete()
		return Response(status=204)


# Order chỉ chủ sở hữu hoặc admin được chỉnh sửa, người khác chỉ xem
class OrderViewSet(viewsets.ViewSet, generics.ListAPIView):
	filter_backends = [filters.SearchFilter]
	search_fields = ['address', 'receiver_phone']
	serializer_class = OrderSerializer
	pagination_class = StandardResultsSetPagination
	permission_classes = [IsAuthenticated, IsOwnerOrAdmin, TokenHasReadWriteScope]

	def get_queryset(self):
		user = self.request.user
		if getattr(self, 'swagger_fake_view', False) or not user.is_authenticated:
			return Order.objects.none()
		return Order.objects.filter(user=user).order_by('id')

	def retrieve(self, request, pk=None):
		try:
			order = Order.objects.get(pk=pk)
		except Order.DoesNotExist:
			return Response(status=404)
		if order.user != request.user and not request.user.is_staff and not request.user.is_superuser:
			return Response({'detail': 'Bạn không có quyền truy cập đơn hàng này.'}, status=403)
		serializer = OrderSerializer(order)
		return Response(serializer.data)

	def create(self, request):
		data = request.data.copy()
		# address ưu tiên lấy từ request, nếu không có thì lấy từ giỏ hàng, nếu vẫn không có thì lấy từ user
		address = data.get('address')
		if not address:
			cart = getattr(request.user, 'cart', None)
			if cart and cart.address:
				address = cart.address
			else:
				address = request.user.address
		data['address'] = address
		serializer = OrderSerializer(data=data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=201)
		return Response(serializer.errors, status=400)

	def update(self, request, pk=None):
		try:
			order = Order.objects.get(pk=pk)
		except Order.DoesNotExist:
			return Response(status=404)
		serializer = OrderSerializer(order, data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)
		return Response(serializer.errors, status=400)

	def destroy(self, request, pk=None):
		try:
			order = Order.objects.get(pk=pk)
		except Order.DoesNotExist:
			return Response(status=404)
		order.delete()
		return Response(status=204)


# Review chỉ chủ sở hữu hoặc admin được chỉnh sửa, người khác chỉ xem
class ReviewViewSet(viewsets.ViewSet, generics.ListAPIView):
	filter_backends = [filters.SearchFilter]
	search_fields = ['comment']
	serializer_class = ReviewSerializer
	pagination_class = StandardResultsSetPagination
	permission_classes = [IsAuthenticated, IsOwnerOrAdmin, TokenHasReadWriteScope]

	def get_queryset(self):
		product_id = self.request.query_params.get('product')
		if product_id:
			return Review.objects.filter(product_id=product_id).order_by('id')
		return Review.objects.all().order_by('id')

	def retrieve(self, request, pk=None):
		try:
			review = Review.objects.get(pk=pk)
		except Review.DoesNotExist:
			return Response(status=404)
		serializer = ReviewSerializer(review)
		return Response(serializer.data)

	def create(self, request):
		user = request.user
		product_id = request.data.get('product')
		if not product_id:
			return Response({'detail': 'Thiếu product_id.'}, status=400)

		# Kiểm tra user đã mua sản phẩm này chưa
		has_bought = Order.objects.filter(
			user=user,
			status__in=[OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.COMPLETED],
			items__product_id=product_id
		).exists()
		if not has_bought:
			return Response({'detail': 'Bạn phải mua sản phẩm này trước khi bình luận.'}, status=403)

		serializer = ReviewSerializer(data=request.data)
		if serializer.is_valid():
			serializer.save(user=user)
			return Response(serializer.data, status=201)
		return Response(serializer.errors, status=400)

	def update(self, request, pk=None):
		try:
			review = Review.objects.get(pk=pk)
		except Review.DoesNotExist:
			return Response(status=404)
		serializer = ReviewSerializer(review, data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)
		return Response(serializer.errors, status=400)

	def destroy(self, request, pk=None):
		try:
			review = Review.objects.get(pk=pk)
		except Review.DoesNotExist:
			return Response(status=404)
		review.delete()
		return Response(status=204)


# Cart chỉ chủ sở hữu hoặc admin được chỉnh sửa, người khác chỉ xem
class CartViewSet(viewsets.ViewSet, generics.ListAPIView):
	filter_backends = [filters.SearchFilter]
	search_fields = ['user__username']
	queryset = Cart.objects.all().order_by('id')
	serializer_class = CartSerializer
	pagination_class = StandardResultsSetPagination
	permission_classes = [IsAuthenticated, IsOwnerOrAdmin, TokenHasReadWriteScope]

	def get_queryset(self):
		user = self.request.user
		if getattr(self, 'swagger_fake_view', False) or not user.is_authenticated:
			return Cart.objects.none()
		return Cart.objects.filter(user=user).order_by('id')

	def retrieve(self, request, pk=None):
		try:
			cart = Cart.objects.get(pk=pk)
		except Cart.DoesNotExist:
			return Response(status=404)
		# Chỉ cho phép user truy cập cart của chính mình
		if cart.user != request.user:
			return Response({'detail': 'Bạn không có quyền truy cập giỏ hàng này.'}, status=403)
		serializer = CartSerializer(cart)
		data = serializer.data
		# shipping_fee và service_fee đã có trong serializer
		return Response(data)

	def create(self, request):
		data = request.data.copy()
		# Nếu không truyền address, lấy mặc định từ user
		if not data.get('address'):
			data['address'] = request.user.address
		serializer = CartSerializer(data=data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=201)
		return Response(serializer.errors, status=400)

	def update(self, request, pk=None):
		try:
			cart = Cart.objects.get(pk=pk)
		except Cart.DoesNotExist:
			return Response(status=404)
		# Nếu truyền discount_code thì cập nhật vào cart
		discount_code_id = request.data.get('discount_code')
		if discount_code_id:
			from store.models import DiscountCode
			try:
				discount_code = DiscountCode.objects.get(pk=discount_code_id)
				cart.discount_code = discount_code
			except DiscountCode.DoesNotExist:
				cart.discount_code = None
		serializer = CartSerializer(cart, data=request.data, partial=True)
		if serializer.is_valid():
			serializer.save()
			# Tính lại phí sau khi cập nhật
			recalculate_cart_fees(cart)
			cart.refresh_from_db()
			return Response(CartSerializer(cart).data)
		return Response(serializer.errors, status=400)

	def partial_update(self, request, pk=None):
		try:
			cart = Cart.objects.get(pk=pk)
		except Cart.DoesNotExist:
			return Response(status=404)
		# Nếu truyền discount_code thì cập nhật vào cart
		discount_code_id = request.data.get('discount_code')
		if discount_code_id:
			from store.models import DiscountCode
			try:
				discount_code = DiscountCode.objects.get(pk=discount_code_id)
				cart.discount_code = discount_code
			except DiscountCode.DoesNotExist:
				cart.discount_code = None
		serializer = CartSerializer(cart, data=request.data, partial=True)
		if serializer.is_valid():
			serializer.save()
			recalculate_cart_fees(cart)
			return Response(serializer.data)
		return Response(serializer.errors, status=400)

	def destroy(self, request, pk=None):
		try:
			cart = Cart.objects.get(pk=pk)
		except Cart.DoesNotExist:
			return Response(status=404)
		cart.delete()
		return Response(status=204)


# CartItem chỉ chủ sở hữu hoặc admin được chỉnh sửa, người khác chỉ xem
class CartItemViewSet(viewsets.ViewSet, generics.ListAPIView):
	filter_backends = [filters.SearchFilter]
	search_fields = ['product__name']
	queryset = CartItem.objects.all().order_by('id')
	serializer_class = CartItemSerializer
	pagination_class = StandardResultsSetPagination
	permission_classes = [IsAuthenticated, IsOwnerOrAdmin, TokenHasReadWriteScope]

	def retrieve(self, request, pk=None):
		try:
			item = CartItem.objects.get(pk=pk)
		except CartItem.DoesNotExist:
			return Response(status=404)
		serializer = CartItemSerializer(item)
		return Response(serializer.data)

	def create(self, request):
		user = request.user
		cart, _ = Cart.objects.get_or_create(user=user)
		product_id = request.data.get('product')
		if not product_id:
			return Response({'error': 'Thiếu product_id'}, status=400)
		quantity = int(request.data.get('quantity', 1))
		# Kiểm tra sản phẩm đã có trong giỏ hàng chưa
		cart_item = CartItem.objects.filter(cart=cart, product_id=product_id).first()
		if cart_item:
			cart_item.quantity += quantity
			cart_item.save()
			# Tính lại phí sau khi thay đổi sản phẩm
			recalculate_cart_fees(cart)
			serializer = CartItemSerializer(cart_item)
			return Response(serializer.data, status=200)
		else:
			data = request.data.copy()
			data['cart'] = cart.id
			data['product'] = product_id
			serializer = CartItemSerializer(data=data)
			if serializer.is_valid():
				serializer.save()
				recalculate_cart_fees(cart)
				return Response(serializer.data, status=201)
			return Response(serializer.errors, status=400)

	def update(self, request, pk=None):
		try:
			item = CartItem.objects.get(pk=pk)
		except CartItem.DoesNotExist:
			return Response(status=404)
		serializer = CartItemSerializer(item, data=request.data)
		if serializer.is_valid():
			serializer.save()
			# Tính lại phí sau khi cập nhật sản phẩm
			recalculate_cart_fees(item.cart)
			return Response(serializer.data)
		return Response(serializer.errors, status=400)

	def destroy(self, request, pk=None):
		try:
			item = CartItem.objects.get(pk=pk)
		except CartItem.DoesNotExist:
			return Response(status=404)
		cart = item.cart
		item.delete()
		# Tính lại phí sau khi xóa sản phẩm
		recalculate_cart_fees(cart)
		return Response(status=204)
	
	def partial_update(self, request, pk=None):
		try:
			item = CartItem.objects.get(pk=pk)
		except CartItem.DoesNotExist:
			return Response(status=404)
		serializer = CartItemSerializer(item, data=request.data, partial=True)
		if serializer.is_valid():
			serializer.save()
			# Tính lại phí sau khi cập nhật sản phẩm
			recalculate_cart_fees(item.cart)
			return Response(serializer.data)
		return Response(serializer.errors, status=400)


# DiscountCode chỉ staff được chỉnh sửa, người khác chỉ xem
class DiscountCodeViewSet(viewsets.ViewSet, generics.ListAPIView):
	filter_backends = [filters.SearchFilter]
	search_fields = ['code']
	queryset = DiscountCode.objects.all().order_by('id')
	serializer_class = DiscountCodeSerializer
	pagination_class = StandardResultsSetPagination
	permission_classes = [IsAuthenticated, IsStaffOrReadOnly, TokenHasReadWriteScope]

	def retrieve(self, request, pk=None):
		try:
			discount = DiscountCode.objects.get(pk=pk)
		except DiscountCode.DoesNotExist:
			return Response(status=404)
		serializer = DiscountCodeSerializer(discount, context={'request': request})
		return Response(serializer.data)

	def create(self, request):
		serializer = DiscountCodeSerializer(data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=201)
		return Response(serializer.errors, status=400)

	def update(self, request, pk=None):
		try:
			discount = DiscountCode.objects.get(pk=pk)
		except DiscountCode.DoesNotExist:
			return Response(status=404)
		serializer = DiscountCodeSerializer(discount, data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)
		return Response(serializer.errors, status=400)

	def destroy(self, request, pk=None):
		try:
			discount = DiscountCode.objects.get(pk=pk)
		except DiscountCode.DoesNotExist:
			return Response(status=404)
		discount.delete()
		return Response(status=204)
	
	@action(detail=False, methods=['get'], url_path='validate')
	def validate(self, request):
		code = request.GET.get('code', '').strip()
		try:
			discount = DiscountCode.objects.get(code__iexact=code)
			if discount.is_valid():
				return Response({
					"valid": True,
					"value": float(discount.discount_percentage),
					"id": discount.id,
					"code": discount.code,
					"message": ""
				})
			else:
				return Response({"valid": False, "value": 0, "message": "Mã giảm giá hết hạn hoặc đã sử dụng tối đa"})
		except DiscountCode.DoesNotExist:
			return Response({"valid": False, "value": 0, "message": "Mã giảm giá không tồn tại"})


# API cho staff quản lý toàn bộ đơn hàng
class AdminOrderViewSet(viewsets.ModelViewSet):
	queryset = Order.objects.all().order_by('-created_at')
	serializer_class = OrderSerializer
	permission_classes = [IsAuthenticated, IsStaffOnly]
	pagination_class = StandardResultsSetPagination
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ['address', 'receiver_phone', 'user__username']
	ordering_fields = ['created_at', 'status', 'total_price']

	def get_queryset(self):
		queryset = super().get_queryset()
		status = self.request.query_params.get('status')
		if status:
			queryset = queryset.filter(status=status)
		return queryset