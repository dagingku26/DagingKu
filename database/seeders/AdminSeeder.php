<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = config('admin.email');
        $password = config('admin.password');

        if (! $email || ! $password) {
            $this->command->error('ADMIN_EMAIL dan ADMIN_PASSWORD harus diisi di .env');
            return;
        }

        $admin = User::firstOrNew(['email' => $email]);

        $admin->forceFill([
            'name' => 'Admin',
            'password' => $password, // di-hash otomatis oleh cast
            'role' => Role::Admin,
            'email_verified_at' => now(),
        ])->save();
    }
}