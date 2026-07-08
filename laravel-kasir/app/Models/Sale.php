<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice',
        'subtotal',
        'discount',
        'tax',
        'total',
        'payment_method',
        'cash',
        'change',
    ];

    protected $casts = [
        'subtotal' => 'integer',
        'discount' => 'integer',
        'tax' => 'integer',
        'total' => 'integer',
        'cash' => 'integer',
        'change' => 'integer',
    ];

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }
}
