<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Scan extends Model
{
    protected $fillable = ['jumlah_scan', 'tanggal_scan'];

    protected function casts(): array
    {
        return ['tanggal_scan' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}