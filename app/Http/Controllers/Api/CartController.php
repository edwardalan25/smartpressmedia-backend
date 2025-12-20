<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    /**
     * GET OR CREATE CART
     */
    private function getCart(Request $request)
    {
        $user = Auth::user();
        if ($user) {
            // logged in user
            $cart = Cart::firstOrCreate(
                ['user_id' => $user->id],
                ['device_id' => $request->device_id]
            );

            // merge guest cart
            if ($request->device_id) {
                Cart::where('device_id', $request->device_id)
                    ->whereNull('user_id')
                    ->update(['user_id' => $user->id]);
            }
        } else {
            // guest cart
            $cart = Cart::firstOrCreate(
                ['device_id' => $request->device_id]
            );
        }

        return $cart->load('items');
    }

    /**
     * ADD TO CART
     */
    public function addToCart(Request $request)
    {
        $request->validate([
            'device_id' => 'required',
            'product_id' => 'required|exists:products,id',
            'product_variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'required|integer|min:1'
        ]);

        $cart = $this->getCart($request);

        $product = Product::findOrFail($request->product_id);
        $price = $product->price;

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

        $item = CartItem::findOrFail($itemId);
        $item->update([
            'quantity' => $request->quantity,
            'total_price' => $item->price * $request->quantity
        ]);

        $this->updateCartTotal($item->cart);

        return response()->json(['message' => 'Quantity updated']);
    }

    /**
     * REMOVE ITEM
     */
    public function removeItem($itemId)
    {
        $item = CartItem::findOrFail($itemId);
        $cart = $item->cart;
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
