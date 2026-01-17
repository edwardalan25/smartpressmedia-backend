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
            // logged in user
            $cart = Cart::firstOrCreate(
                ['user_id' => $user->id, 'is_active' => true],
                ['device_id' => $deviceId]
            );

            // merge guest cart
            if ($deviceId) {
                Cart::where('device_id', $deviceId)
                    ->where('is_active', true)
                    ->whereNull('user_id')
                    ->update(['user_id' => $user->id]);
            }
        } else {
            // guest cart
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
        if ($device) {
            if (!empty($device->device_id)) {
                return $device->device_id;
            }
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

        return response()->json([
            'message' => 'Product added to cart',
            'cart' => $cart->fresh('items')
        ]);
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
            return response()->json(['message' => 'Item not found'], 404);
        }
        $item->update([
            'quantity' => $request->quantity,
            'total_price' => $item->price * $request->quantity
        ]);

        $this->updateCartTotal($cart);

        return response()->json(['message' => 'Quantity updated']);
    }

    /**
     * REMOVE ITEM
     */
    public function removeItem(Request $request, $itemId)
    {
        $cart = $this->getCart($request);
        $item = CartItem::findOrFail($itemId);
        if ($item->cart_id !== $cart->id) {
            return response()->json(['message' => 'Item not found'], 404);
        }
        $item->delete();

        $this->updateCartTotal($cart);

        return response()->json(['message' => 'Item removed']);
    }

    /**
     * VIEW CART
     */
    public function viewCart(Request $request)
    {
        $cart = $this->getCart($request);

        return response()->json($cart);
    }

    /**
     * STRIPE CHECKOUT
     */
    public function checkoutStripe(Request $request)
    {
        $cart = $this->getCart($request)->load('items');
        if ($cart->items->isEmpty()) {
            return response()->json(['message' => 'Cart is empty'], 400);
        }

        $secret = config('services.stripe.secret');
        $successUrl = config('services.stripe.success_url');
        $cancelUrl = config('services.stripe.cancel_url');
        $currency = config('services.stripe.currency', 'usd');

        if (!$secret || !$successUrl || !$cancelUrl) {
            return response()->json(['message' => 'Stripe is not configured'], 500);
        }

        $lineItems = [];
        $orderItems = [];
        foreach ($cart->items as $item) {
            $product = Product::where('id', $item->product_id)
                ->where('is_active', true)
                ->first();
            if (!$product) {
                return response()->json(['message' => 'Product not available'], 400);
            }

            $name = $product->name;
            $price = $product->price;
            $variantName = null;
            if ($item->product_variant_id) {
                $variant = ProductVariant::where('id', $item->product_variant_id)
                    ->where('product_id', $product->id)
                    ->first();
                if (!$variant) {
                    return response()->json(['message' => 'Product variant not available'], 400);
                }
                $variantName = $variant->name;
                $name .= ' - ' . $variant->name;
                $price = $variant->price;
            }

            if ($price === null || $price <= 0) {
                return response()->json(['message' => 'Invalid product price'], 400);
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
                    'product_data' => [
                        'name' => $name,
                    ],
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

        $order->update([
            'stripe_session_id' => $session->id,
        ]);

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

        return response()->json([
            'session_id' => $session->id,
            'checkout_url' => $session->url,
        ]);
    }

    /**
     * STRIPE WEBHOOK
     */
    public function stripeWebhook(Request $request)
    {
        $secret = config('services.stripe.webhook_secret');
        if (!$secret) {
            return response('Webhook secret not configured', 500);
        }

        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $secret);
        } catch (\UnexpectedValueException $e) {
            return response('Invalid payload', 400);
        } catch (SignatureVerificationException $e) {
            return response('Invalid signature', 400);
        }

        $session = null;
        if ($event->type === 'checkout.session.completed') {
            $session = $event->data->object;
        } elseif ($event->type === 'checkout.session.async_payment_failed') {
            $session = $event->data->object;
        }

        if ($session) {
            $orderId = $session->metadata->order_id ?? null;
            $cartId = $session->metadata->cart_id ?? null;

            $order = null;
            if ($orderId) {
                $order = Order::find($orderId);
            }

            if (!$order && $cartId) {
                $order = Order::where('cart_id', $cartId)
                    ->orderBy('id', 'DESC')
                    ->first();
            }

            if ($order) {
                $isPaid = ($event->type === 'checkout.session.completed')
                    && ($session->payment_status ?? null) === 'paid';

                if ($isPaid && $order->payment_status !== 'paid') {
                    $order->update([
                        'payment_status' => 'paid',
                        'status' => 'completed',
                        'stripe_payment_intent_id' => $session->payment_intent ?? null,
                        'paid_at' => now(),
                    ]);
                } elseif (!$isPaid && $order->payment_status !== 'paid') {
                    $order->update([
                        'payment_status' => 'failed',
                        'status' => 'cancelled',
                    ]);
                }

                $amount = isset($session->amount_total) ? ($session->amount_total / 100) : $order->total_amount;
                $referenceId = $session->payment_intent ?? $session->id;

                Transaction::updateOrCreate(
                    ['reference_id' => $referenceId],
                    [
                        'order_id' => $order->id,
                        'provider' => 'stripe',
                        'amount' => $amount,
                        'currency' => $order->currency,
                        'status' => $isPaid ? 'paid' : 'failed',
                        'payload' => json_decode($payload, true),
                    ]
                );
            }

            if ($cartId && ($session->payment_status ?? null) === 'paid') {
                $cart = Cart::where('id', $cartId)
                    ->where('is_active', true)
                    ->first();
                if ($cart) {
                    $cart->update(['is_active' => false]);
                }
            }
        }

        return response()->json(['received' => true]);
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
