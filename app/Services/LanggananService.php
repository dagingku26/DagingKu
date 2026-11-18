<?php

namespace App\Services;

use App\Models\PaketLangganan;
use App\Models\Transaksi;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class LanggananService
{
    /**
     * Aktifkan (atau perpanjang) premium dan catat pembayarannya.
     *
     * - Kalau premium masih aktif, masa berlaku ditambahkan dari tanggal berakhir saat ini.
     * - Premium berlaku sampai akhir hari (23:59:59) pada tanggal berakhir.
     */
    public function aktifkan(User $user, PaketLangganan $paket, int $jumlah, ?string $catatan, User $admin): Transaksi
    {
        return DB::transaction(function () use ($user, $paket, $jumlah, $catatan, $admin) {
            // Kunci baris user agar dua pengaktifan bersamaan tidak saling menimpa
            $user = User::whereKey($user->id)->lockForUpdate()->firstOrFail();

            $mulai = ($user->isPremiumActive() && $user->premium_until)
                ? $user->premium_until->copy()
                : now();

            $berakhir = $mulai->copy()->addMonthsNoOverflow($paket->durasi_bulan)->endOfDay();

            $user->forceFill([
                'is_premium' => true,
                'premium_until' => $berakhir,
            ])->save();

            return Transaksi::create([
                'user_id' => $user->id,
                'paket_id' => $paket->id,
                'durasi_bulan' => $paket->durasi_bulan,
                'jumlah' => $jumlah,
                'dibayar_pada' => now(),
                'mulai' => $mulai,
                'berakhir' => $berakhir,
                'catatan' => $catatan,
                'dicatat_oleh' => $admin->id,
            ]);
        });
    }

    /** Kembalikan ke akun biasa. Catatan keuangan tidak diubah. */
    public function cabut(User $user): void
    {
        $user->forceFill([
            'is_premium' => false,
            'premium_until' => null,
        ])->save();
    }
}
