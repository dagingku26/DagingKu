<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;

class AuthController extends Controller
{
    // Pengguna: kirim id_token dari Google Sign-In di aplikasi
    public function google(Request $request)
    {
        $data = $request->validate(['id_token' => ['required', 'string']]);

        try {
            $res = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $data['id_token'],
            ]);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['message' => 'Gagal menghubungi Google.'], 502);
        }

        $payload = $res->successful() ? $res->json() : null;

        if (
            ! $payload
            || ($payload['aud'] ?? null) !== config('services.google.client_id')
            || ! in_array($payload['iss'] ?? '', ['accounts.google.com', 'https://accounts.google.com'], true)
            || ! filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)
            || empty($payload['sub'])
            || empty($payload['email'])
        ) {
            return response()->json(['message' => 'Token Google tidak valid.'], 401);
        }

        $user = User::where('google_id', $payload['sub'])
            ->orWhere('email', $payload['email'])
            ->first();

        // Admin tidak boleh login lewat Google
        if ($user && $user->role !== Role::Pengguna) {
            return response()->json(['message' => 'Akun ini tidak bisa login dengan Google.'], 403);
        }

        if (! $user) {
            $user = new User([
                'name' => $payload['name'] ?? $payload['email'],
                'email' => $payload['email'],
            ]);
            $user->forceFill([
                'role' => Role::Pengguna,
                'google_id' => $payload['sub'],
                'email_verified_at' => now(),
            ])->save();
        } elseif (! $user->google_id) {
            $user->forceFill(['google_id' => $payload['sub']])->save();
        }

        return $this->tokenResponse($user);
    }

    // Admin: email + password
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || $user->role !== Role::Admin || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Email atau password salah.'], 401);
        }

        return $this->tokenResponse($user);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil logout.']);
    }

    private function tokenResponse(User $user)
    {
        $token = $user->createToken('api', [$user->role->value])->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user]);
    }
}