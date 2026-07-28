import { getAuthSession } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';
import { prisma } from '@/config/db';

export async function POST(request: Request) {
  try {
    console.log('=== test-email POST called ===');
    
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Always use EMAIL_FROM from environment - WP.pl doesn't allow sending from other addresses
    const senderEmail = process.env.EMAIL_FROM || 'dacklowicz@wp.pl';
    console.log('Sender email (WP.pl account):', senderEmail);

    const result = await sendMail({
      to: email,
      subject: '🧪 Test - Help Desk System',
      from: senderEmail,
      text: 'Test email from Help Desk System. If you see this, SMTP connection works!'
    });

    if (!result.success) {
      console.log('sendMail returned failure:', result);
      return new Response(JSON.stringify({ 
        error: 'Failed to send email',
        details: result.error,
        fullError: result.error
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `Email testowy wysłany na ${email}`
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Caught error in test-email:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to send test email',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
