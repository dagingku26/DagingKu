<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Masa berlaku premium. Kosong (null) = tanpa batas waktu (diatur manual)
        Schema::table('users', function (Blueprint $table) {
            $table->dateTime('premium_until')->nullable()->after('is_premium');
        });

        // Daftar paket dan harganya (harga bisa diubah admin kapan saja)
        Schema::create('paket_langganan', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->unsignedTinyInteger('durasi_bulan')->unique();
            $table->unsignedInteger('harga');
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        // Catatan keuangan: satu baris = satu pembayaran. Jumlah disimpan apa adanya
        // sehingga perubahan harga di kemudian hari tidak mengubah pendapatan lama.
        Schema::create('transaksi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('paket_id')->nullable()->constrained('paket_langganan')->nullOnDelete();
            $table->unsignedTinyInteger('durasi_bulan');
            $table->unsignedInteger('jumlah');
            $table->dateTime('dibayar_pada');
            $table->dateTime('mulai');
            $table->dateTime('berakhir');
            $table->string('catatan')->nullable();
            $table->foreignId('dicatat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('dibayar_pada');
        });

        // Harga bawaan
        DB::table('paket_langganan')->insert([
            ['nama' => 'Premium 1 Bulan', 'durasi_bulan' => 1, 'harga' => 35000, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'Premium 3 Bulan', 'durasi_bulan' => 3, 'harga' => 75000, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('transaksi');
        Schema::dropIfExists('paket_langganan');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('premium_until');
        });
    }
};
