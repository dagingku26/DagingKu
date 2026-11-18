<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Halaman awal: arahkan ke login. Nama 'home' dipertahankan karena dipakai starter kit.
Route::redirect('/', '/login')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function () {
        // Admin langsung diarahkan ke panel admin
        if (auth()->user()->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin-web.php';