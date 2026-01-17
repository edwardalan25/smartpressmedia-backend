<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ContactAdminMail;
use App\Mail\ContactThankYouMail;
use App\Models\Contact;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $validate = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'message' => 'required|string',
        ]);

        if ($validate->fails()) {
            return $this->formatResponse('error', $validate->errors()->first(), null, 422);
        }

        // Save contact
        $contact = Contact::create([
            'name' => $request->name,
            'email' => $request->email,
            'message' => $request->message,
        ]);

        //  Send THANK YOU email to USER
        try {
            Mail::to($contact->email)->send(new ContactThankYouMail($contact));
            $contact->update([
                'is_user_email_sent' => true,
                'user_email_error' => null
            ]);
        } catch (\Throwable $e) {
            $contact->update([
                'is_user_email_sent' => false,
                'user_email_error' => $e->getMessage()
            ]);
        }

        //  Send notification email to ADMIN
        try {
            $adminEmail = config('mail.admin_email');
            Mail::to($adminEmail)
                ->send(new ContactAdminMail($contact));

            $contact->update([
                'is_admin_email_sent' => true,
                'admin_email_error' => null
            ]);
        } catch (\Throwable $e) {
            $contact->update([
                'is_admin_email_sent' => false,
                'admin_email_error' => $e->getMessage()
            ]);
        }

        return $this->formatResponse(
            'success',
            'contact-submitted-successfully'
        );
    }
}
