<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    protected $fillable = [
        'user_id',
        'device_id',
        'total_amount',
        'is_active'
    ];

    public function items()
    {
        return $this->hasMany(CartItem::class);
    }
}
