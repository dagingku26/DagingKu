<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ScanController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('google', [AuthController::class, 'google'])->middleware('throttle:10,1');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1'); // admin
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    // Khusus pengguna
    Route::middleware('role:pengguna')->group(function () {
        Route::get('profile', [ProfileController::class, 'show']);
        Route::put('profile', [ProfileController::class, 'update']);

        Route::get('scans', [ScanController::class, 'index']);
        Route::get('scans/quota', [ScanController::class, 'quota']);
        Route::post('scans', [ScanController::class, 'store']);
        Route::get('scans/{id}', [ScanController::class, 'show'])->whereNumber('id');
    });

    // Khusus admin (diisi nanti, file terpisah supaya tidak bentrok)
    Route::prefix('admin')->middleware('role:admin')->group(base_path('routes/admin.php'));
});