const nodemailer = require('nodemailer');

// Create transporter for sending emails
const createTransporter = () => {
  // For development, use Ethereal Email (fake SMTP service)
  // For production, replace with your actual email service
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
      pass: process.env.EMAIL_PASS || 'ethereal.pass'
    }
  });
};

// Send email to single user
const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"SkillSwap Platform" <noreply@skillswap.com>',
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send email to multiple users
const sendBulkEmail = async (recipients, subject, text, html) => {
  try {
    const transporter = createTransporter();
    const results = [];

    // Send emails in batches to avoid overwhelming the server
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const promises = batch.map(async (recipient) => {
        try {
          const mailOptions = {
            from: process.env.EMAIL_FROM || '"SkillSwap Platform" <noreply@skillswap.com>',
            to: recipient.email,
            subject,
            text: text.replace('{{name}}', recipient.name),
            html: html.replace('{{name}}', recipient.name)
          };

          const info = await transporter.sendMail(mailOptions);
          return { 
            success: true, 
            email: recipient.email, 
            messageId: info.messageId 
          };
        } catch (error) {
          return { 
            success: false, 
            email: recipient.email, 
            error: error.message 
          };
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    throw error;
  }
};

// Email templates
const emailTemplates = {
  platformAlert: {
    subject: 'Important Platform Update - SkillSwap',
    text: `Hi {{name}},

We have an important update regarding the SkillSwap platform:

{{message}}

Thank you for your understanding.

Best regards,
The SkillSwap Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">SkillSwap Platform</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333;">Hi {{name}},</h2>
          <p style="color: #666; line-height: 1.6;">We have an important update regarding the SkillSwap platform:</p>
          <div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p style="color: #333; margin: 0;">{{message}}</p>
          </div>
          <p style="color: #666;">Thank you for your understanding.</p>
          <p style="color: #666;">Best regards,<br>The SkillSwap Team</p>
        </div>
        <div style="background: #333; padding: 10px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">© 2024 SkillSwap Platform. All rights reserved.</p>
        </div>
      </div>
    `
  },
  downtime: {
    subject: 'Scheduled Maintenance - SkillSwap Platform',
    text: `Hi {{name}},

We will be performing scheduled maintenance on the SkillSwap platform.

{{message}}

We apologize for any inconvenience this may cause.

Best regards,
The SkillSwap Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">SkillSwap Platform</h1>
          <h2 style="color: white; margin: 10px 0 0 0;">Scheduled Maintenance</h2>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333;">Hi {{name}},</h2>
          <p style="color: #666; line-height: 1.6;">We will be performing scheduled maintenance on the SkillSwap platform.</p>
          <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="color: #856404; margin: 0;">{{message}}</p>
          </div>
          <p style="color: #666;">We apologize for any inconvenience this may cause.</p>
          <p style="color: #666;">Best regards,<br>The SkillSwap Team</p>
        </div>
        <div style="background: #333; padding: 10px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">© 2024 SkillSwap Platform. All rights reserved.</p>
        </div>
      </div>
    `
  }
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  emailTemplates
};