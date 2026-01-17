<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

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
                ['user_id' => $user->id],
                ['device_id' => $deviceId]
            );

            // merge guest cart
            if ($deviceId) {
                Cart::where('device_id', $deviceId)
                    ->whereNull('user_id')
                    ->update(['user_id' => $user->id]);
            }
        } else {
            // guest cart
            $cart = Cart::firstOrCreate(
                ['device_id' => $deviceId]
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
