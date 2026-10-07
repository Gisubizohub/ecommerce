import { Resend } from 'resend';
import { welcomeEmailTemplate } from "../templates/welcome.template";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to: string, subject: string, html: string) => {
    await resend.emails.send({
        from: `"Node Auth App" <onboarding@resend.dev>`,
        to,
        subject,
        html
    });
}

export const sendResetCodeEmail = async (to: string, code: string) => {
    const subject = "Password Reset Code";
    const html = `
    <p>Hello,</p>
    <p>Here is your password reset OTP: ${code}</p>
    <P>This code will expire in 10 minutes</P>
    `
    await sendEmail(to, subject, html);
}

export const sendWelcomeEmail = async (to: string, name: string) => {
    const subject = "Welcome to Node Auth App";
    const html = welcomeEmailTemplate(name);
    await sendEmail(to, subject, html);
}