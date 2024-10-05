import nodemailer from 'nodemailer';
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env['EMAIL_HOST'],
  port: process.env['EMAIL_PORT'],
  secure: true,
  
  auth: {
    user: process.env['EMAIL_USER'],
    pass: process.env['EMAIL_PASS'],
  },
});

export const SendEmail = (result) => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      to: process.env['EMAIL_TO'],
      from: result.email,
      subject: `${result.subject}`,
      // text: "hello",
      html: `<!DOCTYPE html>

    <title>Inquiry about Product Availability</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background-color: #f9f9f9;
        }
        h1 {
            color: #333;
            font-size: 20px;
            margin-bottom: 20px;
        }
        .contact-details {
            margin-top: 20px;
        }
        .contact-details p {
            margin: 5px 0;
        }
        .signature {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <h1>Inquiry about Product Availability</h1>
        <p>Dear info@evvisolutions.com </p>
        <p>I hope this message finds you well.</p>
        <p>My name is ${result.name}, and I am reaching out to inquire about the availability of your new product line. Specifically, I am interested in learning more about the stock levels and expected delivery dates for these products.</p>
        <div class="contact-details">
            <p><strong>Phone:</strong> ${result.phone}</p>
            <p><strong>Email:</strong> ${result.email}</p>
        </div>
        <p>${result.details}</p>
        <div class="signature">
            <p>Best regards,</p>
            <p>${result.name}</p>
        </div>
    </div>
</body>
</html>
`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info);
      }
    });
  });
};


