<?php

namespace App\Models;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // role & google_id sengaja tidak fillable agar tidak bisa diubah lewat request
    protected $fillable = ['name', 'email', 'password'];

    protected $hidden = ['password', 'remember_token', 'google_id'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => Role::class,
            'scan_limit' => 'integer',
            'is_premium' => 'boolean',
        ];
    }

    public function scanUsed(): int
    {
        return (int) $this->scans()->sum('jumlah_scan');
    }

    public function canScan(): bool
    {
        return $this->is_premium || $this->scanUsed() < $this->scan_limit;
    }

// null = tak terbatas
    public function scanRemaining(): ?int
    {
        if ($this->is_premium) {
            return null;
        }

        return max(0, $this->scan_limit - $this->scanUsed());
    }

    public function scans(): HasMany
    {
        return $this->hasMany(Scan::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === Role::Admin;
    }
}