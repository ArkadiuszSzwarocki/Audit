import crypto from 'crypto';

/**
 * Generates a secure, time-limited token for accessing a ticket via email link
 * Token expires after specified duration (default 24 hours)
 * 
 * Format: ticketId:expiresAt:hmacSignature
 */
export function generateTicketToken(
  ticketId: string,
  expiresIn: number = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
): string {
  const secret = process.env.HELP_DESK_TOKEN_SECRET || 'your-secret-key-change-in-env';
  const expiresAt = Date.now() + expiresIn;
  
  // Create data to sign: ticketId:expiresAt
  const data = `${ticketId}:${expiresAt}`;
  
  // Sign with HMAC-SHA256
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  
  // Return: ticketId:expiresAt:signature
  return `${data}:${signature}`;
}

/**
 * Verifies a ticket token
 * Returns true if token is valid and not expired
 * Returns false if token is invalid, expired, or tampered with
 */
export function verifyTicketToken(token: string, ticketId: string): boolean {
  try {
    const secret = process.env.HELP_DESK_TOKEN_SECRET || 'your-secret-key-change-in-env';
    
    // Split token: ticketId:expiresAt:signature
    const parts = token.split(':');
    if (parts.length !== 3) {
      console.warn('Invalid token format - incorrect number of parts');
      return false;
    }
    
    const [tokenTicketId, expiresAtStr, signature] = parts;
    
    // Verify ticket ID matches
    if (tokenTicketId !== ticketId) {
      console.warn('Token ticket ID does not match requested ticket ID');
      return false;
    }
    
    const expiresAt = parseInt(expiresAtStr, 10);
    
    // Verify token has not expired
    if (expiresAt < Date.now()) {
      console.warn('Token has expired');
      return false;
    }
    
    // Verify signature (prevents tampering)
    const data = `${tokenTicketId}:${expiresAt}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('hex');
    
    if (signature !== expectedSignature) {
      console.warn('Token signature is invalid - token may have been tampered with');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying ticket token:', error);
    return false;
  }
}
