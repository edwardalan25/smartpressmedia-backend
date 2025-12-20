<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    protected $fillable = [
        'name',
        'email',
        'message',
        'is_admin_email_sent',
        'is_user_email_sent',
        'email_error',
    ];
}
