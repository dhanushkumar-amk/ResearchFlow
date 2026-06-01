import axios from 'axios';

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@dhanushkumaramk.dev';
  const fromName = process.env.RESEND_FROM_NAME || 'ResearchMind';

  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY is not set. Printing email to console:');
    console.warn(`To: ${to}`);
    console.warn(`Subject: ${subject}`);
    console.warn(`Body:\n${html}`);
    return;
  }

  try {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('[Email] Email sent successfully via Resend:', response.data);
    return response.data;
  } catch (err: any) {
    console.error('[Email] Failed to send email via Resend:', err.response?.data || err.message);
    throw new Error('Failed to send verification email. Please try again later.');
  }
}
