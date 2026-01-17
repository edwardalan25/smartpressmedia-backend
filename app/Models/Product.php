<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'category_id',
        'author_id',
        'image',
        'price',
        'discount_price',
        'is_active',
        'description',
    ];

    protected static function booted()
    {
        static::creating(function (Product $product) {
            if (empty($product->slug) && !empty($product->name)) {
                $product->slug = static::generateUniqueSlug($product->name);
            }
        });
    }

    public static function generateUniqueSlug(string $name): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $suffix = 2;

        while (static::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $suffix;
            $suffix++;
        }

        return $slug;
    }

    // Product → Category (belongs to)
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // Optional: Product → Author (if author table exists)
    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }
}
