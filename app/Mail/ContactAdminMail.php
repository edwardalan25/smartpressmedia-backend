<?php

namespace App\Mail;

use App\Models\Contact;
use Illuminate\Mail\Mailable;

class ContactAdminMail extends Mailable
{
    public $contact;

    public function __construct(Contact $contact)
    {
        $this->contact = $contact;
    }

    public function build()
    {
        return $this->subject('New Contact Form Submission')
            ->view('emails.contact-admin');
    }
}
