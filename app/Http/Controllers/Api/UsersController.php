<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

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

    public function store(Request $request)
    {
        $validate = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,NULL,id,deleted_at,NULL',
            'phone' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:8',
            'date_of_birth' => 'nullable|date',
        ]);

        if ($validate->fails()) {
            return $this->formatResponse('error', $validate->errors()->first(), null, 400);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password ?? Str::random(16)),
            'date_of_birth' => $request->date_of_birth,
            'role' => User::USER,
        ]);

        return $this->formatResponse('success', 'user-created-successfully', $user);
    }

    public function show($id)
    {
        $user = User::where('role', User::USER)->where('id', $id)->first();

        if (!$user) {
            return $this->formatResponse('error', 'user-not-found', null, 404);
        }

        return $this->formatResponse('success', 'user-fetched-successfully', $user);
    }

    public function update(Request $request, $id)
    {
        $user = User::where('role', User::USER)->where('id', $id)->first();

        if (!$user) {
            return $this->formatResponse('error', 'user-not-found', null, 404);
        }

        $validate = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => "required|email|unique:users,email,{$user->id},id,deleted_at,NULL",
            'phone' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:8',
            'date_of_birth' => 'nullable|date',
        ]);

        if ($validate->fails()) {
            return $this->formatResponse('error', $validate->errors()->first(), null, 400);
        }

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'date_of_birth' => $request->date_of_birth,
            'role' => User::USER,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return $this->formatResponse('success', 'user-updated-successfully', $user);
    }

    public function destroy($id)
    {
        $user = User::where('role', User::USER)->where('id', $id)->first();

        if (!$user) {
            return $this->formatResponse('error', 'user-not-found', null, 404);
        }

        $user->delete();

        return $this->formatResponse('success', 'user-deleted-successfully');
    }
}
