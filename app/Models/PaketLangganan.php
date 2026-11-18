<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaketLangganan extends Model
{
    protected $table = 'paket_langganan';

    protected $fillable = ['nama', 'durasi_bulan', 'harga', 'aktif'];

    protected function casts(): array
    {
        return [
            'durasi_bulan' => 'integer',
            'harga' => 'integer',
            'aktif' => 'boolean',
        ];
    }
}
