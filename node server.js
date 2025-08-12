const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve the 'contact.html' file when a GET request is made to the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

// POST route to handle form submission
app.post('/send-email', (req, res) => {
    const { name, email, message } = req.body;

    // Create a transporter object using your email service.
    // This example uses Gmail.
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'YOUR_GMAIL_EMAIL@gmail.com', // Your Gmail email
            pass: 'YOUR_GMAIL_APP_PASSWORD'    // Your Gmail App Password
        }
    });

    // Configure the email content
    const mailOptions = {
        from: `"${name}" <${email}>`,
        to: 'amandeepstudy7@gmail.com', // The recipient of the message
        subject: `New contact form message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
        html: `<p><strong>Name:</strong> ${name}</p>
               <p><strong>Email:</strong> ${email}</p>
               <p><strong>Message:</strong> ${message}</p>`
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            // Send an error response back to the client
            return res.status(500).send('Error sending message.');
        }
        console.log('Message sent: %s', info.messageId);
        // Send a success message or redirect
        res.status(200).send('Message sent successfully!');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});