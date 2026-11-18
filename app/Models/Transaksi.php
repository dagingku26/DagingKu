<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaksi extends Model
{
    protected $table = 'transaksi';

    protected $fillable = [
        'user_id',
        'paket_id',
        'durasi_bulan',
        'jumlah',
        'dibayar_pada',
        'mulai',
        'berakhir',
        'catatan',
        'dicatat_oleh',
    ];

    protected function casts(): array
    {
        return [
            'durasi_bulan' => 'integer',
            'jumlah' => 'integer',
            'dibayar_pada' => 'datetime',
            'mulai' => 'datetime',
            'berakhir' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function paket(): BelongsTo
    {
        return $this->belongsTo(PaketLangganan::class, 'paket_id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }
}
