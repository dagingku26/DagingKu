<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class CronController extends Controller
{
    // Dipanggil oleh Vercel Cron atau layanan penjadwal luar. Dijaga dengan CRON_SECRET.
    public function premiumKadaluarsa(Request $request): JsonResponse
    {
        $secret = (string) config('services.cron.secret');

        abort_unless(
            $secret !== '' && hash_equals('Bearer '.$secret, (string) $request->header('Authorization')),
            401
        );

        Artisan::call('premium:kadaluarsa');

        return response()->json(['ok' => true, 'hasil' => trim(Artisan::output())]);
    }
}
