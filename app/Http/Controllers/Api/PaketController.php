<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaketLangganan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaketController extends Controller
{
    // Daftar harga paket premium untuk ditampilkan di aplikasi mobile.
    // Harga selalu mengikuti tabel paket_langganan (yang diubah admin di halaman Keuangan).
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $nomor = preg_replace('/\D+/', '', (string) config('services.whatsapp.nomor'));

        // Tautan WhatsApp dengan pesan yang sudah terisi, lengkap dengan email akun pengguna
        $tautan = fn (string $pesan): string => "https://wa.me/{$nomor}?text=".rawurlencode($pesan);

        $pakets = PaketLangganan::where('aktif', true)
            ->orderBy('durasi_bulan')
            ->get()
            ->map(function (PaketLangganan $p) use ($tautan, $user) {
                $harga = 'Rp '.number_format($p->harga, 0, ',', '.');

                return [
                    'id' => $p->id,
                    'nama' => $p->nama,
                    'durasi_bulan' => $p->durasi_bulan,
                    'harga' => $p->harga,
                    'harga_format' => $harga,
                    'whatsapp_url' => $tautan(
                        "Halo admin DagingKu, saya ingin berlangganan {$p->nama} ({$harga}).\n"
                        ."Email akun saya: {$user->email}"
                    ),
                ];
            })
            ->values();

        return response()->json([
            'pakets' => $pakets,
            'premium_aktif' => $user->isPremiumActive(),
            'premium_until' => $user->isPremiumActive() ? $user->premium_until?->toIso8601String() : null,
            'whatsapp' => [
                'nomor' => $nomor,
                'url' => $tautan("Halo admin DagingKu, saya ingin bertanya tentang paket Premium.\nEmail akun saya: {$user->email}"),
            ],
        ]);
    }
}