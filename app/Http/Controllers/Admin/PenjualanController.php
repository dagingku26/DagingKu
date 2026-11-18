<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\PaketLangganan;
use App\Models\Transaksi;
use App\Models\User;
use App\Services\LanggananService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PenjualanController extends Controller
{
    public function index(Request $request): Response
    {
        $cari = trim((string) $request->query('cari', ''));

        return Inertia::render('admin/penjualan', [
            'pakets' => PaketLangganan::where('aktif', true)
                ->orderBy('durasi_bulan')
                ->get(['id', 'nama', 'durasi_bulan', 'harga']),

            // Pengguna yang dipilih lewat ?user=ID (misalnya dari tombol di halaman Pengguna)
            'terpilih' => function () use ($request) {
                if (! $request->filled('user')) {
                    return null;
                }

                $user = User::where('role', Role::Pengguna->value)->find($request->integer('user'));

                return $user ? $this->ringkas($user) : null;
            },

            // Hasil pencarian (dipanggil lewat partial reload dari halaman)
            'hasil' => fn () => $this->cari($cari),

            'transaksi_terbaru' => Transaksi::with(['user:id,name', 'paket:id,nama'])
                ->latest('dibayar_pada')
                ->limit(5)
                ->get()
                ->map(fn (Transaksi $t) => [
                    'id' => $t->id,
                    'user' => $t->user?->name,
                    'paket' => $t->paket?->nama ?? "{$t->durasi_bulan} bulan",
                    'jumlah' => $t->jumlah,
                    'dibayar_pada' => $t->dibayar_pada?->toIso8601String(),
                ]),
        ]);
    }

    public function store(Request $request, LanggananService $layanan): RedirectResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')->where('role', Role::Pengguna->value)],
            'paket_id' => ['required', 'integer', Rule::exists('paket_langganan', 'id')->where('aktif', true)],
            'jumlah' => ['required', 'integer', 'min:0', 'max:100000000'],
            'catatan' => ['nullable', 'string', 'max:255'],
        ], [
            'user_id.required' => 'Pilih pengguna terlebih dahulu.',
            'paket_id.required' => 'Pilih paket terlebih dahulu.',
        ]);

        $user = User::findOrFail($data['user_id']);
        $paket = PaketLangganan::findOrFail($data['paket_id']);

        $transaksi = $layanan->aktifkan(
            $user,
            $paket,
            (int) $data['jumlah'],
            $data['catatan'] ?? null,
            $request->user()
        );

        $nominal = number_format($transaksi->jumlah, 0, ',', '.');

        return redirect()
            ->route('admin.penjualan', ['user' => $user->id])
            ->with('success', "{$user->name} aktif Premium sampai {$transaksi->berakhir->format('d/m/Y')} (Rp {$nominal} tercatat).");
    }

    private function cari(string $cari): array
    {
        if (mb_strlen($cari) < 2) {
            return [];
        }

        $like = '%'.mb_strtolower($cari).'%';

        return User::query()
            ->where('role', Role::Pengguna->value)
            ->where(function ($w) use ($like) {
                $w->whereRaw('LOWER(name) like ?', [$like])
                    ->orWhereRaw('LOWER(email) like ?', [$like]);
            })
            ->orderBy('name')
            ->limit(8)
            ->get()
            ->map(fn (User $u) => $this->ringkas($u))
            ->all();
    }

    private function ringkas(User $u): array
    {
        return [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'premium_aktif' => $u->isPremiumActive(),
            'premium_until' => $u->premium_until?->toIso8601String(),
        ];
    }
}
