<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScanController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->scans()->latest('tanggal_scan')->paginate(20)
        );
    }

    public function quota(Request $request)
    {
        return response()->json($this->quotaOf($request->user()));
    }

    // Dipanggil aplikasi setelah scan berhasil. Satu panggilan = satu scan.
    public function store(Request $request)
    {
        $scan = DB::transaction(function () use ($request) {
            // Kunci baris user agar dua request bersamaan tidak melewati batas
            $user = User::whereKey($request->user()->id)->lockForUpdate()->first();

            if (! $user->canScan()) {
                return null;
            }
            return $user->scans()->create([
                'jumlah_scan' => 1,
                'tanggal_scan' => now(),
            ]);
        });

        if (! $scan) {
            return response()->json([
                'message' => 'Kuota scan habis.',
                'code' => 'quota_exceeded',
                'quota' => $this->quotaOf($request->user()),
            ], 403);
        }

        return response()->json([
            'scan' => $scan,
            'quota' => $this->quotaOf($request->user()),
        ], 201);
    }

    public function show(Request $request, int $id)
    {
        return response()->json($request->user()->scans()->findOrFail($id));
    }

    private function quotaOf(User $user): array
    {
        return [
            'can_scan' => $user->canScan(),
            'unlimited' => (bool) $user->is_premium,
            'limit' => $user->is_premium ? null : (int) $user->scan_limit,
            'used' => $user->scanUsed(),
            'remaining' => $user->scanRemaining(),
        ];
    }
}