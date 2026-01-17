<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;

class TransactionController extends Controller
{
    /**
     * Admin: List transactions
     */
    public function index()
    {
        $transactions = Transaction::with('order')
            ->orderBy('id', 'DESC')
            ->get();

        return $this->formatResponse('success', 'transactions-fetched-successfully', $transactions);
    }

    /**
     * Admin: Show transaction
     */
    public function show($id)
    {
        $transaction = Transaction::with('order')->find($id);
        if (!$transaction) {
            return $this->formatResponse('error', 'transaction-not-found', null, 404);
        }

        return $this->formatResponse('success', 'transaction-fetched-successfully', $transaction);
    }
}
