<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaketLangganan;
use App\Models\Transaksi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class KeuanganController extends Controller
{
    public function index(Request $request): Response
    {
        [$dari, $sampai] = $this->periode($request);

        $dalamPeriode = fn () => Transaksi::whereBetween('dibayar_pada', [$dari, $sampai]);

        $jumlahTransaksi = $dalamPeriode()->count();
        $pendapatan = (int) $dalamPeriode()->sum('jumlah');

        // Pendapatan per tanggal (terbaru di atas)
        $harian = $dalamPeriode()
            ->get(['jumlah', 'dibayar_pada'])
            ->groupBy(fn (Transaksi $t) => $t->dibayar_pada->format('Y-m-d'))
            ->map(fn ($grup, $tanggal) => [
                'tanggal' => $tanggal,
                'jumlah_transaksi' => $grup->count(),
                'pendapatan' => (int) $grup->sum('jumlah'),
            ])
            ->sortKeysDesc()
            ->values();

        return Inertia::render('admin/keuangan', [
            'periode' => [
                'dari' => $dari->format('Y-m-d'),
                'sampai' => $sampai->format('Y-m-d'),
            ],
            'stats' => [
                'pendapatan' => $pendapatan,
                'jumlah_transaksi' => $jumlahTransaksi,
                'rata_rata' => $jumlahTransaksi > 0 ? (int) round($pendapatan / $jumlahTransaksi) : 0,
                'total' => (int) Transaksi::sum('jumlah'),
            ],
            'harian' => $harian,
            'transaksi' => $dalamPeriode()
                ->with('user:id,name,email')
                ->latest('dibayar_pada')
                ->paginate(15)
                ->withQueryString()
                ->through(fn (Transaksi $t) => [
                    'id' => $t->id,
                    'user_id' => $t->user_id,
                    'user' => $t->user?->name,
                    'email' => $t->user?->email,
                    'durasi_bulan' => $t->durasi_bulan,
                    'jumlah' => $t->jumlah,
                    'tanggal' => $t->dibayar_pada?->format('Y-m-d'),
                    'waktu' => $t->dibayar_pada?->format('H:i'),
                    'berakhir' => $t->berakhir?->format('Y-m-d'),
                    'catatan' => $t->catatan,
                ]),
            'pakets' => PaketLangganan::orderBy('durasi_bulan')->get()->map(fn (PaketLangganan $p) => [
                'id' => $p->id,
                'nama' => $p->nama,
                'durasi_bulan' => $p->durasi_bulan,
                'harga' => $p->harga,
                'aktif' => $p->aktif,
            ]),
        ]);
    }

    // Data lengkap satu periode (tanpa halaman) untuk dijadikan berkas Excel di browser
    public function ekspor(Request $request): JsonResponse
    {
        [$dari, $sampai] = $this->periode($request);

        $baris = Transaksi::with(['user:id,name,email', 'paket:id,nama', 'admin:id,name'])
            ->whereBetween('dibayar_pada', [$dari, $sampai])
            ->orderBy('dibayar_pada')
            ->limit(10000)
            ->get();

        $transaksi = $baris->values()->map(fn (Transaksi $t, int $i) => [
            'no' => $i + 1,
            'tanggal' => $t->dibayar_pada->format('Y-m-d'),
            'waktu' => $t->dibayar_pada->format('H:i'),
            'pengguna' => $t->user?->name ?? '(akun dihapus)',
            'email' => $t->user?->email ?? '-',
            'paket' => $t->paket?->nama ?? "Premium {$t->durasi_bulan} Bulan",
            'durasi_bulan' => $t->durasi_bulan,
            'jumlah' => $t->jumlah,
            'berakhir' => $t->berakhir?->format('Y-m-d'),
            'catatan' => $t->catatan,
            'dicatat_oleh' => $t->admin?->name ?? '-',
        ])->all();

        $harian = $baris
            ->groupBy(fn (Transaksi $t) => $t->dibayar_pada->format('Y-m-d'))
            ->map(fn ($grup, $tanggal) => [
                'tanggal' => $tanggal,
                'jumlah_transaksi' => $grup->count(),
                'pendapatan' => (int) $grup->sum('jumlah'),
            ])
            ->sortKeys()
            ->values()
            ->all();

        $perPaket = $baris
            ->groupBy('durasi_bulan')
            ->map(fn ($grup, $durasi) => [
                'paket' => $grup->first()->paket?->nama ?? "Premium {$durasi} Bulan",
                'durasi_bulan' => (int) $durasi,
                'jumlah_transaksi' => $grup->count(),
                'pendapatan' => (int) $grup->sum('jumlah'),
            ])
            ->sortKeys()
            ->values()
            ->all();

        return response()->json([
            'periode' => [
                'dari' => $dari->format('Y-m-d'),
                'sampai' => $sampai->format('Y-m-d'),
            ],
            'dicetak_pada' => now()->format('Y-m-d H:i'),
            'dicetak_oleh' => $request->user()->name,
            'transaksi' => $transaksi,
            'harian' => $harian,
            'per_paket' => $perPaket,
        ]);
    }

    // Ubah harga paket. Hanya berlaku untuk penjualan berikutnya, catatan lama tidak berubah.
    public function updatePaket(Request $request, PaketLangganan $paket): RedirectResponse
    {
        $data = $request->validate([
            'harga' => ['required', 'integer', 'min:0', 'max:100000000'],
            'aktif' => ['required', 'boolean'],
        ]);

        $paket->update([
            'harga' => $data['harga'],
            'aktif' => $request->boolean('aktif'),
        ]);

        $nominal = number_format($paket->harga, 0, ',', '.');

        return back()->with('success', "{$paket->nama} sekarang Rp {$nominal}.");
    }

    /**
     * Periode dari query ?dari=YYYY-MM-DD&sampai=YYYY-MM-DD.
     * Jika kosong atau tidak valid, dipakai bulan ini.
     *
     * @return array{0: Carbon, 1: Carbon}
     */
    private function periode(Request $request): array
    {
        $dari = $this->tanggal($request->query('dari'));
        $sampai = $this->tanggal($request->query('sampai'));

        if (! $dari || ! $sampai) {
            return [now()->startOfMonth(), now()->endOfMonth()];
        }

        if ($dari->gt($sampai)) {
            [$dari, $sampai] = [$sampai, $dari];
        }

        return [$dari->startOfDay(), $sampai->endOfDay()];
    }

    private function tanggal(mixed $nilai): ?Carbon
    {
        if (! is_string($nilai) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $nilai)) {
            return null;
        }

        try {
            return Carbon::createFromFormat('!Y-m-d', $nilai);
        } catch (\Throwable) {
            return null;
        }
    }
}
