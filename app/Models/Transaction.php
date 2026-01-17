<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'order_id',
        'provider',
        'amount',
        'currency',
        'status',
        'reference_id',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
