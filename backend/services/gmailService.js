import dotenv from 'dotenv';
dotenv.config();
import { google } from 'googleapis';
import User from '../models/User.js';
import Resume from '../models/Resume.js';
import EmailTracking from '../models/EmailTracking.js';

// Setup OAuth2 client supporting both configuration variations
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || (process.env.FRONTEND_URL + '/gmail-callback')
);

export async function getGmailAuthUrl(userId) {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: userId,
    prompt: 'consent' // Force refresh token retrieval
  });

  return url;
}

export async function handleGmailCallback(code, userId) {
  const { tokens } = await oauth2Client.getToken(code);
  
  const updateData = {
    gmail_access_token: tokens.access_token
  };
  
  if (tokens.refresh_token) {
    updateData.gmail_refresh_token = tokens.refresh_token;
  }
  
  await User.findByIdAndUpdate(userId, updateData);

  return tokens;
}

/**
 * Builds a valid raw MIME multi-part message with attachment
 */
function buildRawMimeMessage({ to, subject, htmlBody, pdfBuffer, pdfFilename }) {
  const boundary = '----boundary_str_1234567890----';
  const parts = [];

  parts.push(`To: ${to}`);
  parts.push(`Subject: ${subject}`);
  parts.push('MIME-Version: 1.0');
  parts.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  parts.push('');

  // Body text part
  parts.push(`--${boundary}`);
  parts.push('Content-Type: text/html; charset=utf-8');
  parts.push('Content-Transfer-Encoding: 7bit');
  parts.push('');
  parts.push(htmlBody);
  parts.push('');

  // Attachment part
  if (pdfBuffer && pdfBuffer.length > 0) {
    const filename = pdfFilename || 'Resume.pdf';
    parts.push(`--${boundary}`);
    parts.push(`Content-Type: application/pdf; name="${filename}"`);
    parts.push(`Content-Disposition: attachment; filename="${filename}"`);
    parts.push('Content-Transfer-Encoding: base64');
    parts.push('');
    parts.push(pdfBuffer.toString('base64'));
    parts.push('');
  }

  parts.push(`--${boundary}--`);

  return parts.join('\r\n');
}

/**
 * Sends a personalized outreach email via Gmail, attaching a resume and tracking pixel
 */
export async function sendGmailEmail({ userId, to, subject, body, trackingId, resumeId }) {
  const user = await User.findById(userId);
  
  if (!user.gmail_refresh_token) {
    throw new Error('Gmail not connected. Please authorize Gmail access.');
  }

  oauth2Client.setCredentials({
    refresh_token: user.gmail_refresh_token
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // 1. Fetch Resume PDF binary
  let pdfBuffer = null;
  let pdfFilename = 'Resume.pdf';

  if (resumeId) {
    const resume = await Resume.findById(resumeId);
    if (resume && resume.file_data) {
      pdfBuffer = resume.file_data;
      pdfFilename = resume.file_name || 'Resume.pdf';
    }
  } else {
    const resume = await Resume.findOne({ user_id: userId }).sort({ createdAt: -1 });
    if (resume && resume.file_data) {
      pdfBuffer = resume.file_data;
      pdfFilename = resume.file_name || 'Resume.pdf';
    }
  }

  // 2. Inject tracking pixel and format body
  const serverUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const trackingPixel = `<img src="${serverUrl}/api/outreach/track-open/${trackingId}" width="1" height="1" style="display:none;" />`;
  
  const htmlBody = `
    <html>
      <body>
        <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; white-space: pre-wrap;">${body}</div>
        ${trackingPixel}
      </body>
    </html>
  `;

  // 3. Compile MIME message
  const rawMime = buildRawMimeMessage({
    to,
    subject,
    htmlBody,
    pdfBuffer,
    pdfFilename
  });

  const encodedMessage = Buffer.from(rawMime)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage
    }
  });

  return { 
    messageId: result.data.id,
    threadId: result.data.threadId
  };
}

/**
 * Checks for replies to previously sent outreach threads and updates their tracking records
 */
export async function checkGmailReplies(userId) {
  const user = await User.findById(userId);
  
  if (!user || !user.gmail_refresh_token) {
    return [];
  }

  oauth2Client.setCredentials({
    refresh_token: user.gmail_refresh_token
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: 20
    });

    const messages = response.data.messages || [];
    const matchedReplies = [];

    for (const msg of messages) {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id
      });
      
      const threadId = detail.data.threadId;
      
      // Find matching sent outreach email
      const tracking = await EmailTracking.findOne({ user_id: userId, gmail_thread_id: threadId });
      
      if (tracking && !tracking.reply_received) {
        const snippet = detail.data.snippet || 'Reply received.';
        
        tracking.status = 'replied';
        tracking.reply_received = true;
        tracking.reply_at = new Date();
        tracking.reply_content = snippet;
        await tracking.save();

        // Mark as read in user's Gmail to avoid duplicate processings
        await gmail.users.messages.batchModify({
          userId: 'me',
          ids: [msg.id],
          removeLabelIds: ['UNREAD']
        });

        matchedReplies.push(tracking);
        console.log(`[Gmail Service] Successfully tracked reply for thread ${threadId}`);
      }
    }

    return matchedReplies;
  } catch (error) {
    console.error('[Gmail Service] Error checking replies:', error.message);
    return [];
  }
}
