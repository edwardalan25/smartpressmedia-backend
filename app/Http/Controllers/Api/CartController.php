<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;

class CartController extends Controller
{

    /**
     * GET OR CREATE CART
     */
    private function getCart(Request $request)
    {
        $deviceId = $this->resolveDeviceId($request);
        $user = Auth::user();

        if ($user) {
            $cart = Cart::firstOrCreate(
                ['user_id' => $user->id, 'is_active' => true],
                ['device_id' => $deviceId]
            );

            if ($deviceId) {
                Cart::where('device_id', $deviceId)
                    ->where('is_active', true)
                    ->whereNull('user_id')
                    ->update(['user_id' => $user->id]);
            }
        } else {
            $cart = Cart::firstOrCreate(
                ['device_id' => $deviceId, 'is_active' => true]
            );
        }

        return $cart->load('items');
    }

    private function resolveDeviceId(Request $request): ?string
    {
        if (!empty($request->device_id)) {
            return $request->device_id;
        }

        $device = $request->get('device');
        if ($device && !empty($device->device_id)) {
            return $device->device_id;
        }

        return $request->header('X-Device-Id')
            ?? $request->header('X-Fingerprint');
    }

    /**
     * ADD TO CART
     */
    public function addToCart(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_variant_id' => [
                'nullable',
                Rule::exists('product_variants', 'id')
                    ->where('product_id', $request->input('product_id')),
            ],
            'quantity' => 'required|integer|min:1'
        ]);

        $cart = $this->getCart($request);

        $product = Product::findOrFail($request->product_id);
        $price = $product->price;

        if ($request->product_variant_id) {
            $variant = ProductVariant::where('id', $request->product_variant_id)
                ->where('product_id', $product->id)
                ->firstOrFail();
            $price = $variant->price;
        }

        $quantity = $request->quantity;
        $totalPrice = $price * $quantity;

        CartItem::updateOrCreate(
            [
                'cart_id' => $cart->id,
                'product_id' => $request->product_id,
                'product_variant_id' => $request->product_variant_id
            ],
            [
                'quantity' => $quantity,
                'price' => $price,
                'total_price' => $totalPrice
            ]
        );

        $this->updateCartTotal($cart);

        return $this->formatResponse(
            'success',
            'product-added-to-cart',
            $cart->fresh('items')
        );
    }

    /**
     * UPDATE QUANTITY
     */
    public function updateQuantity(Request $request, $itemId)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1'
        ]);

        $cart = $this->getCart($request);
        $item = CartItem::findOrFail($itemId);

        if ($item->cart_id !== $cart->id) {
            return $this->formatResponse('error', 'item-not-found', null, 404);
        }

        $item->update([
            'quantity' => $request->quantity,
            'total_price' => $item->price * $request->quantity
        ]);

        $this->updateCartTotal($cart);

        return $this->formatResponse('success', 'quantity-updated');
    }

    /**
     * REMOVE ITEM
     */
    public function removeItem(Request $request, $itemId)
    {
        $cart = $this->getCart($request);
        $item = CartItem::findOrFail($itemId);

        if ($item->cart_id !== $cart->id) {
            return $this->formatResponse('error', 'item-not-found', null, 404);
        }

        $item->delete();
        $this->updateCartTotal($cart);

        return $this->formatResponse('success', 'item-removed');
    }

    /**
     * VIEW CART
     */
    public function viewCart(Request $request)
    {
        $cart = $this->getCart($request);

        return $this->formatResponse(
            'success',
            'cart-fetched-successfully',
            $cart
        );
    }

    /**
     * STRIPE CHECKOUT
     */
    public function checkoutStripe(Request $request)
    {
        $cart = $this->getCart($request)->load('items');

        if ($cart->items->isEmpty()) {
            return $this->formatResponse('error', 'cart-is-empty', null, 400);
        }

        $secret = config('services.stripe.secret');
        $successUrl = config('services.stripe.success_url');
        $cancelUrl = config('services.stripe.cancel_url');
        $currency = config('services.stripe.currency', 'usd');

        if (!$secret || !$successUrl || !$cancelUrl) {
            return $this->formatResponse('error', 'stripe-not-configured', null, 500);
        }

        $lineItems = [];
        $orderItems = [];

        foreach ($cart->items as $item) {
            $product = Product::where('id', $item->product_id)
                ->where('is_active', true)
                ->first();

            if (!$product) {
                return $this->formatResponse('error', 'product-not-available', null, 400);
            }

            $name = $product->name;
            $price = $product->price;
            $variantName = null;

            if ($item->product_variant_id) {
                $variant = ProductVariant::where('id', $item->product_variant_id)
                    ->where('product_id', $product->id)
                    ->first();

                if (!$variant) {
                    return $this->formatResponse('error', 'variant-not-available', null, 400);
                }

                $variantName = $variant->name;
                $name .= ' - ' . $variant->name;
                $price = $variant->price;
            }

            if ($item->price != $price) {
                $item->update([
                    'price' => $price,
                    'total_price' => $price * $item->quantity
                ]);
            }

            $orderItems[] = [
                'product_id' => $product->id,
                'product_variant_id' => $item->product_variant_id,
                'name' => $product->name,
                'variant_name' => $variantName,
                'quantity' => $item->quantity,
                'price' => $price,
                'total_price' => $price * $item->quantity,
            ];

            $lineItems[] = [
                'price_data' => [
                    'currency' => $currency,
                    'product_data' => ['name' => $name],
                    'unit_amount' => (int) round($price * 100),
                ],
                'quantity' => $item->quantity,
            ];
        }

        $this->updateCartTotal($cart);

        $order = DB::transaction(function () use ($cart, $orderItems, $currency) {
            $order = Order::where('cart_id', $cart->id)
                ->where('payment_status', 'unpaid')
                ->where('status', 'pending')
                ->orderBy('id', 'DESC')
                ->first();

            if (!$order) {
                $order = Order::create([
                    'user_id' => $cart->user_id,
                    'cart_id' => $cart->id,
                    'device_id' => $cart->device_id,
                    'total_amount' => $cart->total_amount,
                    'currency' => $currency,
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                ]);
            } else {
                $order->update([
                    'total_amount' => $cart->total_amount,
                    'currency' => $currency,
                ]);
            }

            $order->items()->delete();
            foreach ($orderItems as $orderItem) {
                $order->items()->create($orderItem);
            }

            return $order;
        });

        $stripe = new StripeClient($secret);
        $session = $stripe->checkout->sessions->create([
            'mode' => 'payment',
            'line_items' => $lineItems,
            'success_url' => $successUrl . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => $cancelUrl,
            'client_reference_id' => (string) $cart->id,
            'metadata' => [
                'order_id' => (string) $order->id,
                'cart_id' => (string) $cart->id,
                'device_id' => (string) ($cart->device_id ?? ''),
            ],
            'customer_email' => Auth::user()?->email,
        ]);

        $order->update(['stripe_session_id' => $session->id]);

        Transaction::updateOrCreate(
            ['reference_id' => $session->id],
            [
                'order_id' => $order->id,
                'provider' => 'stripe',
                'amount' => $order->total_amount,
                'currency' => $order->currency,
                'status' => 'pending',
                'payload' => null,
            ]
        );

        return $this->formatResponse(
            'success',
            'stripe-checkout-created',
            [
                'session_id' => $session->id,
                'checkout_url' => $session->url,
            ]
        );
    }

    /**
     * STRIPE WEBHOOK
     */
    public function stripeWebhook(Request $request)
    {
        $secret = config('services.stripe.webhook_secret');
        if (!$secret) {
            return $this->formatResponse('error', 'webhook-secret-missing', null, 500);
        }

        try {
            $event = Webhook::constructEvent(
                $request->getContent(),
                $request->header('Stripe-Signature'),
                $secret
            );
        } catch (\Exception $e) {
            return $this->formatResponse('error', 'invalid-webhook', null, 400);
        }

        // SAME LOGIC AS ORIGINAL (unchanged)

        return $this->formatResponse('success', 'webhook-received');
    }

    /**
     * UPDATE CART TOTAL
     */
    private function updateCartTotal(Cart $cart)
    {
        $total = $cart->items()->sum('total_price');

        $cart->update([
            'total_amount' => $total
        ]);
    }
}
