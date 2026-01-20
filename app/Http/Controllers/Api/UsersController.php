<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UsersController extends Controller
{
    public function index(Request $request)
    {
        $role = $request->query('role');

        $query = User::query();

        if ($role && $role !== 'all') {
            $query->where('role', $role);
        } elseif (!$role) {
            $query->where('role', User::USER);
        }

        $users = $query->orderByDesc('id')->get();

        return $this->formatResponse('success', 'users-fetched-successfully', $users);
    }
}
