import * as dotenv from 'dotenv';
import * as FormData from 'form-data';
import Mailgun from 'mailgun.js'; // Change import statement

// Load environment variables from .env file
dotenv.config();

const formData = new FormData();
const mailgun = new Mailgun(formData);

// Replace 'yourkeyhere' with your actual Mailgun API key
const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY || 'yourkeyhere' });

mg.messages.create('sandbox-123.mailgun.org', {
    from: "Excited User <mailgun@sandbox-123.mailgun.org>",
    to: ["test@example.com"],
    subject: "Hello",
    text: "Testing some Mailgun awesomeness!",
    html: "<h1>Testing some Mailgun awesomeness!</h1>"
})
    .then((msg: any) => console.log(msg))
    .catch((err: any) => console.log(err));
