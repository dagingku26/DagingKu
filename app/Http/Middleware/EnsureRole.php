<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();

        abort_unless($user && in_array($user->role->value, $roles, true), 403, 'Akses ditolak.');

        return $next($request);
    }
}