import stripe
import json
import traceback
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Cart, CartItem, Order, OrderItem, User

stripe.api_key = settings.STRIPE_SECRET_KEY

class StripeCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        try:
            cart = Cart.objects.get(user=user)
            cart_items = CartItem.objects.filter(cart=cart)
        except Cart.DoesNotExist:
            return JsonResponse({'error': 'Cart not found'}, status=404)

        line_items = []
        errors = []
        VND_TO_USD = 24000
        subtotal = 0
        for item in cart_items:
            if not item.product.price or item.product.price <= 0:
                errors.append(f"Product '{item.product.name}' has invalid price: {item.product.price}")
            if not item.quantity or item.quantity <= 0:
                errors.append(f"Product '{item.product.name}' has invalid quantity: {item.quantity}")
            usd_price = float(item.product.price) / VND_TO_USD
            image_url = ''
            if hasattr(item.product, 'image') and item.product.image:
                try:
                    image_url = item.product.image.url
                except Exception:
                    image_url = ''
            line_items.append({
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': item.product.name,
                        'description': item.product.description or '',
                        'images': [image_url] if image_url else [],
                    },
                    'unit_amount': int(usd_price * 100),
                },
                'quantity': item.quantity,
            })
            subtotal += float(item.product.price) * item.quantity

        shipping_fee = float(cart.shipping_fee) if cart.shipping_fee else 0
        service_fee = float(cart.service_fee) if cart.service_fee else 0
        discount = 0
        discount_code = getattr(cart, 'discount_code', None)
        discount_percent = 0
        if discount_code and hasattr(discount_code, 'discount_percentage'):
            discount_percent = float(discount_code.discount_percentage)
            if discount_percent > 0:
                discount = subtotal * discount_percent / 100

        if shipping_fee > 0:
            line_items.append({
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': 'Phí vận chuyển',
                    },
                    'unit_amount': int(shipping_fee / VND_TO_USD * 100),
                },
                'quantity': 1,
            })
        if service_fee > 0:
            line_items.append({
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': 'Phí dịch vụ',
                    },
                    'unit_amount': int(service_fee / VND_TO_USD * 100),
                },
                'quantity': 1,
            })
        if discount > 0:
            line_items.append({
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': 'Giảm giá',
                    },
                    'unit_amount': int(discount / VND_TO_USD * 100),
                },
                'quantity': 1,
            })
        if not user.email:
            errors.append("User does not have a valid email.")
        if errors:
            return JsonResponse({'error': ' | '.join(errors)}, status=400)

        # Lưu các giá trị vào metadata để dùng lại ở webhook
        metadata = {
            'subtotal': str(subtotal),
            'shipping_fee': str(shipping_fee),
            'service_fee': str(service_fee),
            'discount': str(discount),
            'discount_percent': str(discount_percent),
        }

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=settings.STRIPE_SUCCESS_URL,
                cancel_url=settings.STRIPE_CANCEL_URL,
                customer_email=user.email,
                metadata=metadata,
            )
            return JsonResponse({'checkout_url': session.url})
        except Exception as e:
            print('Stripe error:', str(e))
            print(traceback.format_exc())
            return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', None)
    event = None
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        ) if endpoint_secret else json.loads(payload)
    except Exception as e:
        print('Webhook error:', str(e))
        return HttpResponse(status=400)

    # Xử lý sự kiện thanh toán thành công
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        email = session.get('customer_email')
        metadata = session.get('metadata', {})
        try:
            user = User.objects.get(email=email)
            cart = Cart.objects.get(user=user)
            cart_items = CartItem.objects.filter(cart=cart)
            from decimal import Decimal
            from .models import calculate_order_total
            # Tính lại giá trị từ DB
            cart_total = sum([Decimal(str(item.product.price)) * item.quantity for item in cart_items])
            shipping_fee = Decimal(str(cart.shipping_fee)) if cart.shipping_fee else Decimal('0')
            service_fee = Decimal(str(cart.service_fee)) if cart.service_fee else Decimal('0')
            discount_amount = Decimal('0')
            discount_code = getattr(cart, 'discount_code', None)
            if discount_code and hasattr(discount_code, 'discount_percentage'):
                discount_percent = Decimal(str(discount_code.discount_percentage))
                if discount_percent > 0:
                    discount_amount = cart_total * discount_percent / Decimal('100')
            total_price = calculate_order_total(cart_total, shipping_fee, service_fee, discount_amount)
            if total_price < 0:
                total_price = Decimal('0')
            # Lấy địa chỉ giao hàng từ giỏ hàng hoặc user
            address = cart.address if cart and cart.address else user.address
            order = Order.objects.create(
                user=user,
                status='paid',
                total_price=total_price,
                order_type='delivery',
                discount_code=discount_code,
                address=address,
                shipping_fee=shipping_fee
            )
            for item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    price=item.product.price,
                )
            # Đảm bảo discount_code đã được lưu vào order trước khi xóa khỏi cart
            cart_items.delete()
            cart.discount_code = None
            # Reset shipping_fee, service_fee, and address after successful payment
            cart.shipping_fee = 0
            cart.service_fee = 0
            cart.address = ""
            cart.save(update_fields=['shipping_fee', 'service_fee', 'address', 'discount_code'])
        except Exception as e:
            print('Order creation error:', str(e))
            return HttpResponse(status=400)
    return HttpResponse(status=200)
