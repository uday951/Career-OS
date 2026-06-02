import AutomationSettings from '../models/AutomationSettings.js';
import User from '../models/User.js';
import Report from '../models/Report.js';
import nodemailer from 'nodemailer';

/**
 * Create email transporter
 */
function createTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Notifications] Email not configured.');
    return null;
  }
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Send email notification
 */
export async function sendEmail({ to, subject, html }) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('[Notifications] Email skipped (not configured)');
    return { success: false, reason: 'Email not configured' };
  }
  
  try {
    await transporter.sendMail({
      from: `"Career OS AI" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Notifications] Email sent to ${to}: ${subject}`);
    return { success: true };
  } catch (error) {
    console.error('[Notifications] Email send error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Telegram notification
 */
export async function sendTelegram(chatId, message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || !chatId) {
    console.log('[Notifications] Telegram skipped (not configured)');
    return { success: false, reason: 'Telegram not configured' };
  }
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`);
    }
    
    console.log(`[Notifications] Telegram sent to chat ${chatId}`);
    return { success: true };
  } catch (error) {
    console.error('[Notifications] Telegram error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Build daily report HTML email
 */
function buildReportEmail(metrics) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Daily Automation Report</h1>
    <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Your AI job application summary</p>
  </div>
  
  <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #333; margin-top: 0;">Today's Metrics</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e9ecef;">Jobs Scanned</td>
        <td style="padding: 10px; border-bottom: 1px solid #e9ecef; text-align: right; font-weight: bold;">${metrics.jobs_scanned || 0}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e9ecef;">Jobs Matched</td>
        <td style="padding: 10px; border-bottom: 1px solid #e9ecef; text-align: right; font-weight: bold; color: #28a745;">${metrics.jobs_matched || 0}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e9ecef;">Applications Submitted</td>
        <td style="padding: 10px; border-bottom: 1px solid #e9ecef; text-align: right; font-weight: bold; color: #007bff;">${metrics.applications_submitted || 0}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e9ecef;">Applications Failed</td>
        <td style="padding: 10px; border-bottom: 1px solid #e9ecef; text-align: right; font-weight: bold; color: ${metrics.applications_failed > 0 ? '#dc3545' : '#28a745'};">${metrics.applications_failed || 0}</td>
      </tr>
      <tr>
        <td style="padding: 10px;">Average Match Score</td>
        <td style="padding: 10px; text-align: right; font-weight: bold;">${metrics.avg_match_score || 0}%</td>
      </tr>
    </table>
  </div>
  
  <p style="color: #666; font-size: 12px; text-align: center;">
    This is an automated report from Career OS AI.<br>
    Configure your notification preferences in Settings.
  </p>
</body>
</html>`;
}

/**
 * Send daily report to user via their preferred channels
 */
export async function sendDailyReport(userId, metrics) {
  try {
    const report = await Report.create({
      user_id: userId,
      type: 'daily',
      period_start: metrics.period_start || new Date(Date.now() - 86400000),
      period_end: metrics.period_end || new Date(),
      metrics: {
        jobs_scanned: metrics.jobs_scanned || 0,
        jobs_matched: metrics.jobs_matched || 0,
        applications_submitted: metrics.applications_submitted || 0,
        applications_failed: metrics.applications_failed || 0,
        avg_match_score: metrics.avg_match_score || 0,
        interviews_generated: metrics.interviews_generated || 0,
        responses_received: metrics.responses_received || 0,
      },
      summary: `Daily automation run completed. Scanned ${metrics.jobs_scanned || 0} jobs, matched ${metrics.jobs_matched || 0}, submitted ${metrics.applications_submitted || 0} applications.`,
    });
    
    const settings = await AutomationSettings.findOne({ user_id: userId });
    if (!settings) return { success: true, report };
    
    // Look up user's email separately (user_id is ObjectId, not populated)
    if (settings.email_notifications) {
      const user = await User.findById(userId).select('email');
      if (user && user.email) {
        await sendEmail({
          to: user.email,
          subject: 'Daily Automation Report - Career OS AI',
          html: buildReportEmail(metrics),
        });
      }
    }
    
    // Send Telegram if enabled
    if (settings.telegram_notifications && settings.telegram_chat_id) {
      const message = `<b>Daily Automation Report</b>

Today's Results:
Jobs Scanned: ${metrics.jobs_scanned || 0}
Jobs Matched: ${metrics.jobs_matched || 0}
Applications Submitted: ${metrics.applications_submitted || 0}
Applications Failed: ${metrics.applications_failed || 0}
Avg Match Score: ${metrics.avg_match_score || 0}%

Configure at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/automation`;
      
      await sendTelegram(settings.telegram_chat_id, message);
    }
    
    return { success: true, report };
  } catch (error) {
    console.error('[Notifications] Send daily report error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send a notification email to the candidate
 */
export async function sendCandidateNotification(userId, subject, htmlContent) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.email) {
      console.warn(`[Notifications] User ${userId} or user email not found.`);
      return { success: false, reason: 'User email not found' };
    }

    // Try sending via Gmail first if the user has connected it
    if (user.gmail_refresh_token) {
      try {
        const { sendGmailEmail } = await import('./gmailService.js');
        await sendGmailEmail(userId, user.email, subject, htmlContent, true);
        console.log(`[Notifications] Confirmation email sent via user's connected Gmail to ${user.email}`);
        return { success: true, method: 'gmail' };
      } catch (gmailError) {
        console.error('[Notifications] Failed to send via Gmail, falling back to SMTP:', gmailError.message);
      }
    }

    // Fallback to nodemailer (SMTP)
    const smtpResult = await sendEmail({
      to: user.email,
      subject,
      html: htmlContent
    });
    
    return { success: smtpResult.success, method: 'smtp', error: smtpResult.error };
  } catch (error) {
    console.error('[Notifications] sendCandidateNotification error:', error.message);
    return { success: false, error: error.message };
  }
}

export default { sendEmail, sendTelegram, sendDailyReport, sendCandidateNotification };
