<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Scan;
use App\Models\Transaksi;
use App\Models\User;
use App\Services\LanggananService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = in_array($request->query('status'), ['premium', 'gratis'], true)
            ? $request->query('status')
            : 'semua';

        $like = '%'.mb_strtolower($search).'%';

        $users = User::query()
            ->where('role', Role::Pengguna->value)
            ->withSum('scans as scan_terpakai', 'jumlah_scan')
            ->when($search !== '', fn ($q) => $q->where(function ($w) use ($like) {
                $w->whereRaw('LOWER(name) like ?', [$like])
                    ->orWhereRaw('LOWER(email) like ?', [$like]);
            }))
            ->when($status === 'premium', fn ($q) => $q->premiumAktif())
            ->when($status === 'gratis', fn ($q) => $q->where(function ($w) {
                $w->where('is_premium', false)
                    ->orWhere(fn ($x) => $x->whereNotNull('premium_until')->where('premium_until', '<=', now()));
            }))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'premium_aktif' => $u->isPremiumActive(),
                'premium_until' => $u->premium_until?->toIso8601String(),
                'scan_limit' => (int) $u->scan_limit,
                'scan_terpakai' => (int) ($u->scan_terpakai ?? 0),
                'created_at' => $u->created_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }

    public function show(User $user): Response
    {
        $this->pastikanPengguna($user);

        return Inertia::render('admin/users/show', [
            'pengguna' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'premium_aktif' => $user->isPremiumActive(),
                'premium_until' => $user->premium_until?->toIso8601String(),
                'scan_limit' => (int) $user->scan_limit,
                'scan_terpakai' => $user->scanUsed(),
                'sisa' => $user->scanRemaining(), // null = tanpa batas (premium)
                'google' => $user->google_id !== null,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
            'riwayat' => $user->scans()
                ->latest('tanggal_scan')
                ->paginate(10)
                ->through(fn (Scan $s) => [
                    'id' => $s->id,
                    'jumlah' => (int) $s->jumlah_scan,
                    'tanggal' => $s->tanggal_scan?->toIso8601String(),
                ]),
            'pembayaran' => $user->transaksi()
                ->latest('dibayar_pada')
                ->limit(10)
                ->get()
                ->map(fn (Transaksi $t) => [
                    'id' => $t->id,
                    'durasi_bulan' => $t->durasi_bulan,
                    'jumlah' => $t->jumlah,
                    'dibayar_pada' => $t->dibayar_pada?->toIso8601String(),
                    'berakhir' => $t->berakhir?->toIso8601String(),
                    'catatan' => $t->catatan,
                ]),
        ]);
    }

    // Mencabut premium: akun kembali menjadi akun biasa. Catatan keuangan tidak berubah.
    public function cabutPremium(User $user, LanggananService $layanan): RedirectResponse
    {
        $this->pastikanPengguna($user);

        $layanan->cabut($user);

        return back()->with('success', "Premium {$user->name} dicabut. Akun kembali menjadi akun biasa.");
    }

    // Admin mengubah batas scan untuk akun biasa
    public function updateLimit(Request $request, User $user): RedirectResponse
    {
        $this->pastikanPengguna($user);

        $data = $request->validate([
            'scan_limit' => ['required', 'integer', 'min:0', 'max:100000'],
        ]);

        $user->forceFill(['scan_limit' => $data['scan_limit']])->save();

        return back()->with('success', "Batas scan {$user->name} diubah menjadi {$user->scan_limit}.");
    }

    // Halaman ini hanya untuk akun pengguna, bukan admin
    private function pastikanPengguna(User $user): void
    {
        abort_if($user->role === Role::Admin, 404);
    }
}
