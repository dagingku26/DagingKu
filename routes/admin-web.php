<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\KeuanganController;
use App\Http\Controllers\Admin\PenjualanController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

// Halaman web admin (Inertia). Bukan API: memakai login session, bukan token.
Route::middleware(['auth', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        // Pengguna
        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::get('users/{user}', [UserController::class, 'show'])->whereNumber('user')->name('users.show');
        Route::patch('users/{user}/cabut-premium', [UserController::class, 'cabutPremium'])->whereNumber('user')->name('users.cabut');
        Route::patch('users/{user}/limit', [UserController::class, 'updateLimit'])->whereNumber('user')->name('users.limit');

        // Penjualan (WhatsApp Web + aktivasi premium)
        Route::get('penjualan', [PenjualanController::class, 'index'])->name('penjualan');
        Route::post('penjualan', [PenjualanController::class, 'store'])->name('penjualan.store');

        // Keuangan dan harga paket
        Route::get('keuangan', [KeuanganController::class, 'index'])->name('keuangan');
        Route::get('keuangan/ekspor', [KeuanganController::class, 'ekspor'])->name('keuangan.ekspor');
        Route::patch('paket/{paket}', [KeuanganController::class, 'updatePaket'])->whereNumber('paket')->name('paket.update');
    });
