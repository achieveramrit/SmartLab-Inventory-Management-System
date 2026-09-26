const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
const sendOverdueEmail = async (studentEmail, studentName, componentName, expectedReturnDate) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: studentEmail,
        subject: "SmartLab Component Overdue Warning",
        html: `
            <h2>SmartLab Inventory - Overdue Warning</h2>
            <p>Hello ${studentName},</p>
            <p>
                The following component issued to you is overdue:
            </p>
            <ul>
                <li><strong>Component:</strong> ${componentName}</li>
                <li><strong>Expected Return Date:</strong> ${new Date(expectedReturnDate).toDateString()}</li>
            </ul>
            <p>
                Please return the component to the lab as soon as possible.
            </p>
            <p>
                Regards,<br>
                SmartLab Inventory Management System
            </p>
        `
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendOverdueEmail };