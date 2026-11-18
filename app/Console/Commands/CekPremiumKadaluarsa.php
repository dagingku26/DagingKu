<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CekPremiumKadaluarsa extends Command
{
    protected $signature = 'premium:kadaluarsa';

    protected $description = 'Kembalikan akun premium yang masa berlangganannya sudah habis menjadi akun biasa';

    public function handle(): int
    {
        // Akun premium tanpa tanggal berakhir (diatur manual) tidak disentuh
        $jumlah = User::query()
            ->where('is_premium', true)
            ->whereNotNull('premium_until')
            ->where('premium_until', '<=', now())
            ->update(['is_premium' => false]);

        $this->info("{$jumlah} akun dikembalikan menjadi akun biasa.");

        return self::SUCCESS;
    }
}
