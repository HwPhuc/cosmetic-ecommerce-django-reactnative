from rest_framework import viewsets, generics, filters
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


# Product chỉ staff được chỉnh sửa, người khác chỉ xem
class ProductViewSet(viewsets.ViewSet, generics.ListAPIView):
	filter_backends = [filters.SearchFilter]
	search_fields = ['name', 'description', 'barcode']
	queryset = Product.objects.all().order_by('id')
	serializer_class = ProductSerializer
	pagination_class = StandardResultsSetPagination
	permission_classes = [IsStaffOrReadOnly]

	def retrieve(self, request, pk=None):
		try:
			product = Product.objects.get(pk=pk)
		except Product.DoesNotExist:
			return Response(status=404)
		serializer = ProductSerializer(product)
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
	permission_classes = [IsStaffOrReadOnly]

	def retrieve(self, request, pk=None):
		try:
			category = Category.objects.get(pk=pk)
		except Category.DoesNotExist:
			return Response(status=404)
		serializer = CategorySerializer(category)
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
	permission_classes = [IsOwnerOrAdmin]

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
	queryset = Review.objects.all().order_by('id')
	serializer_class = ReviewSerializer
	pagination_class = StandardResultsSetPagination
	permission_classes = [IsOwnerOrAdmin]

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
	filter_backends = [filters.SearchFilter]
	search_fields = ['user__username']
	queryset = Cart.objects.all().order_by('id')
	serializer_class = CartSerializer
	pagination_class = StandardResultsSetPagination
	permission_classes = [IsOwnerOrAdmin]

	def retrieve(self, request, pk=None):
		try:
			cart = Cart.objects.get(pk=pk)
		except Cart.DoesNotExist:
			return Response(status=404)
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
	permission_classes = [IsOwnerOrAdmin]

	def retrieve(self, request, pk=None):
		try:
			item = CartItem.objects.get(pk=pk)
		except CartItem.DoesNotExist:
			return Response(status=404)
		serializer = CartItemSerializer(item)
		return Response(serializer.data)

	def create(self, request):
		serializer = CartItemSerializer(data=request.data)
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


