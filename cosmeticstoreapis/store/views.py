from .serializers import DiscountCodeSerializer
from .models import DiscountCode
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework import status
from .serializers import UserSerializer
from rest_framework import viewsets, generics, filters
from rest_framework.permissions import IsAuthenticated
from oauth2_provider.contrib.rest_framework import TokenHasReadWriteScope
from rest_framework.response import Response
from .models import (
	Product, Category, Order, Review,
	Cart, CartItem
)
from .serializers import (
	ProductSerializer, CategorySerializer, OrderSerializer, ReviewSerializer,
	CartSerializer, CartItemSerializer
)
from .permissions import IsStaffOrReadOnly, IsOwnerOrAdmin
from .pagination import StandardResultsSetPagination
from rest_framework.decorators import action


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
	search_fields = ['shipping_address', 'receiver_phone']
	queryset = Order.objects.all().order_by('id')
	serializer_class = OrderSerializer
	pagination_class = StandardResultsSetPagination
	permission_classes = [IsAuthenticated, IsOwnerOrAdmin, TokenHasReadWriteScope]

	def retrieve(self, request, pk=None):
		try:
			order = Order.objects.get(pk=pk)
		except Order.DoesNotExist:
			return Response(status=404)
		serializer = OrderSerializer(order)
		return Response(serializer.data)

	def create(self, request):
		serializer = OrderSerializer(data=request.data)
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
		serializer = ReviewSerializer(data=request.data)
		if serializer.is_valid():
			serializer.save()
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
	def get_queryset(self):
		user = self.request.user
		return Cart.objects.filter(user=user).order_by('id')
	filter_backends = [filters.SearchFilter]
	search_fields = ['user__username']
	queryset = Cart.objects.all().order_by('id')
	serializer_class = CartSerializer
	pagination_class = StandardResultsSetPagination
	permission_classes = [IsAuthenticated, IsOwnerOrAdmin, TokenHasReadWriteScope]

	def retrieve(self, request, pk=None):
		try:
			cart = Cart.objects.get(pk=pk)
		except Cart.DoesNotExist:
			return Response(status=404)
		# Chỉ cho phép user truy cập cart của chính mình
		if cart.user != request.user:
			return Response({'detail': 'Bạn không có quyền truy cập giỏ hàng này.'}, status=403)
		serializer = CartSerializer(cart)
		return Response(serializer.data)

	def create(self, request):
		serializer = CartSerializer(data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=201)
		return Response(serializer.errors, status=400)

	def update(self, request, pk=None):
		try:
			cart = Cart.objects.get(pk=pk)
		except Cart.DoesNotExist:
			return Response(status=404)
		serializer = CartSerializer(cart, data=request.data)
		if serializer.is_valid():
			serializer.save()
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
			serializer = CartItemSerializer(cart_item)
			return Response(serializer.data, status=200)
		else:
			data = request.data.copy()
			data['cart'] = cart.id
			data['product'] = product_id
			serializer = CartItemSerializer(data=data)
			if serializer.is_valid():
				serializer.save()
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
			return Response(serializer.data)
		return Response(serializer.errors, status=400)

	def destroy(self, request, pk=None):
		try:
			item = CartItem.objects.get(pk=pk)
		except CartItem.DoesNotExist:
			return Response(status=404)
		item.delete()
		return Response(status=204)
	
	def partial_update(self, request, pk=None):
		try:
			item = CartItem.objects.get(pk=pk)
		except CartItem.DoesNotExist:
			return Response(status=404)
		serializer = CartItemSerializer(item, data=request.data, partial=True)
		if serializer.is_valid():
			serializer.save()
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
				return Response({"valid": True, "value": float(discount.discount_percentage), "message": ""})
			else:
				return Response({"valid": False, "value": 0, "message": "Mã giảm giá hết hạn hoặc đã sử dụng tối đa"})
		except DiscountCode.DoesNotExist:
			return Response({"valid": False, "value": 0, "message": "Mã giảm giá không tồn tại"})

