<?php

namespace App\Mail;

use App\Models\Contact;
use Illuminate\Mail\Mailable;

class ContactThankYouMail extends Mailable
{
    public $contact;

    public function __construct(Contact $contact)
    {
        $this->contact = $contact;
    }

    public function build()
    {
        return $this->subject('Thank You for Contacting Us')
            ->view('emails.contact-thank-you');
    }
}
