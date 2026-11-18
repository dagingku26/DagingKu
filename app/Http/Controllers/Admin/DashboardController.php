<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Scan;
use App\Models\Transaksi;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $pengguna = fn () => User::query()->where('role', Role::Pengguna->value);

        // Total scan per hari selama 7 hari terakhir
        $perHari = Scan::query()
            ->where('tanggal_scan', '>=', now()->subDays(6)->startOfDay())
            ->selectRaw('DATE(tanggal_scan) as hari, SUM(jumlah_scan) as total')
            ->groupBy('hari')
            ->pluck('total', 'hari');

        $chart = collect(range(6, 0))->map(function (int $i) use ($perHari) {
            $tanggal = now()->subDays($i);

            return [
                'tanggal' => $tanggal->toDateString(),
                'label' => $tanggal->format('d/m'),
                'total' => (int) $perHari->get($tanggal->toDateString(), 0),
            ];
        })->values();

        // Pendapatan per bulan selama 6 bulan terakhir (dikelompokkan di PHP agar cocok untuk MySQL maupun PostgreSQL)
        $perBulan = Transaksi::query()
            ->where('dibayar_pada', '>=', now()->startOfMonth()->subMonths(5))
            ->get(['jumlah', 'dibayar_pada'])
            ->groupBy(fn (Transaksi $t) => $t->dibayar_pada->format('Y-m'))
            ->map(fn ($grup) => (int) $grup->sum('jumlah'));

        $chartKeuangan = collect(range(5, 0))->map(function (int $i) use ($perBulan) {
            $bulan = now()->startOfMonth()->subMonths($i);

            return [
                'bulan' => $bulan->format('Y-m'),
                'label' => $bulan->format('m/Y'),
                'total' => (int) $perBulan->get($bulan->format('Y-m'), 0),
            ];
        })->values();

        $awalBulan = now()->startOfMonth();

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total_pengguna' => $pengguna()->count(),
                'premium' => $pengguna()->premiumAktif()->count(),
                'segera_berakhir' => $pengguna()->premiumAktif()
                    ->whereNotNull('premium_until')
                    ->where('premium_until', '<=', now()->addDays(7))
                    ->count(),
                'total_scan' => (int) Scan::sum('jumlah_scan'),
                'scan_hari_ini' => (int) Scan::where('tanggal_scan', '>=', now()->startOfDay())->sum('jumlah_scan'),
            ],
            'keuangan' => [
                'hari_ini' => (int) Transaksi::where('dibayar_pada', '>=', now()->startOfDay())->sum('jumlah'),
                'bulan_ini' => (int) Transaksi::where('dibayar_pada', '>=', $awalBulan)->sum('jumlah'),
                'total' => (int) Transaksi::sum('jumlah'),
                'transaksi_bulan_ini' => Transaksi::where('dibayar_pada', '>=', $awalBulan)->count(),
            ],
            'chart' => $chart,
            'chart_keuangan' => $chartKeuangan,
            'scan_terbaru' => Scan::with('user:id,name,email')
                ->latest('tanggal_scan')
                ->limit(5)
                ->get()
                ->map(fn (Scan $s) => [
                    'id' => $s->id,
                    'user' => $s->user?->name,
                    'email' => $s->user?->email,
                    'jumlah' => (int) $s->jumlah_scan,
                    'tanggal' => $s->tanggal_scan?->toIso8601String(),
                ]),
            'pengguna_terbaru' => $pengguna()
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'premium_aktif' => $u->isPremiumActive(),
                    'created_at' => $u->created_at?->toIso8601String(),
                ]),
        ]);
    }
}
