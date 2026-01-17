<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    /**
     * Admin: List orders
     */
    public function index()
    {
        $orders = Order::with(['items', 'transactions'])
            ->orderBy('id', 'DESC')
            ->get();

        return $this->formatResponse('success', 'orders-fetched-successfully', $orders);
    }

    /**
     * Admin: Show order
     */
    public function show($id)
    {
        $order = Order::with(['items', 'transactions'])->find($id);
        if (!$order) {
            return $this->formatResponse('error', 'order-not-found', null, 404);
        }

        return $this->formatResponse('success', 'order-fetched-successfully', $order);
    }

    /**
     * Admin: Update order status
     */
    public function update(Request $request, $id)
    {
        $order = Order::find($id);
        if (!$order) {
            return $this->formatResponse('error', 'order-not-found', null, 404);
        }

        $data = $request->validate([
            'status' => ['nullable', Rule::in(['pending', 'processing', 'completed', 'cancelled'])],
            'payment_status' => ['nullable', Rule::in(['unpaid', 'paid', 'failed', 'refunded'])],
        ]);

        $order->update($data);

        if (($data['payment_status'] ?? null) === 'paid' && !$order->paid_at) {
            $order->update(['paid_at' => now()]);
        }

        return $this->formatResponse('success', 'order-updated-successfully', $order);
    }
}
