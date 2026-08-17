import { NotificationType } from '@prisma/client';
import { prisma } from '../prisma';
import { enqueueEmail } from './email';
import { ENV } from '../env';

type CreateNotificationParams = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
  emailSubject?: string;
  emailHtml?: string;
  emailText?: string;
};

/**
 * Create a notification for a user
 * Optionally sends an email notification
 */
export async function createNotification(params: CreateNotificationParams) {
  const {
    userId,
    type,
    title,
    message,
    link,
    metadata,
    sendEmail = false,
    emailSubject,
    emailHtml,
    emailText,
  } = params;

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      emailSent: false,
    },
  });

  // Send email if requested
  if (sendEmail && (emailHtml || emailText)) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (user?.email) {
      try {
        await enqueueEmail({
          to: user.email,
          subject: emailSubject ?? title,
          html: emailHtml ?? `<p>${message}</p>`,
          text: emailText ?? message,
        });

        await prisma.notification.update({
          where: { id: notification.id },
          data: { emailSent: true, emailSentAt: new Date() },
        });
      } catch (error) {
        console.error('[notifications] Failed to send email:', error);
      }
    }
  }

  return notification;
}

/**
 * Notify vendor of a new order
 */
export async function notifyNewOrder(params: {
  vendorUserId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  totalCents: number;
  currency: string;
  itemCount: number;
}) {
  const { vendorUserId, orderId, orderNumber, customerName, totalCents, currency, itemCount } = params;
  const amount = (totalCents / 100).toFixed(2);

  const user = await prisma.user.findUnique({
    where: { id: vendorUserId },
    select: { email: true, name: true },
  });

  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">New Order Received!</h2>
      <p>Hi ${user?.name ?? 'there'},</p>
      <p>Great news! You've received a new order.</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Order:</strong> #${orderNumber}</p>
        <p style="margin: 4px 0;"><strong>Customer:</strong> ${customerName}</p>
        <p style="margin: 4px 0;"><strong>Items:</strong> ${itemCount}</p>
        <p style="margin: 4px 0;"><strong>Total:</strong> ${amount} ${currency.toUpperCase()}</p>
      </div>
      <p>
        <a href="${ENV.frontendUrl}/dashboard/orders"
           style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Order
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">Thank you for selling with us!</p>
    </div>
  `;

  return createNotification({
    userId: vendorUserId,
    type: 'ORDER_NEW',
    title: 'New Order Received',
    message: `New order #${orderNumber} from ${customerName} for ${amount} ${currency.toUpperCase()}`,
    link: `/dashboard/orders`,
    metadata: { orderId, orderNumber, customerName, totalCents, currency, itemCount },
    sendEmail: true,
    emailSubject: `New Order #${orderNumber} - ${amount} ${currency.toUpperCase()}`,
    emailHtml,
    emailText: `New order #${orderNumber} from ${customerName} for ${amount} ${currency.toUpperCase()}. View at ${ENV.frontendUrl}/dashboard/orders`,
  });
}

/**
 * Notify vendor of order payment received
 */
export async function notifyOrderPaid(params: {
  vendorUserId: string;
  orderId: string;
  orderNumber: string;
  totalCents: number;
  currency: string;
}) {
  const { vendorUserId, orderId, orderNumber, totalCents, currency } = params;
  const amount = (totalCents / 100).toFixed(2);

  return createNotification({
    userId: vendorUserId,
    type: 'ORDER_PAID',
    title: 'Payment Received',
    message: `Payment of ${amount} ${currency.toUpperCase()} received for order #${orderNumber}`,
    link: `/dashboard/orders`,
    metadata: { orderId, orderNumber, totalCents, currency },
    sendEmail: true,
    emailSubject: `Payment Received - Order #${orderNumber}`,
    emailHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Payment Confirmed!</h2>
        <p>Payment of <strong>${amount} ${currency.toUpperCase()}</strong> has been received for order #${orderNumber}.</p>
        <p>You can now prepare and ship the order.</p>
        <p>
          <a href="${ENV.frontendUrl}/dashboard/orders"
             style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Order
          </a>
        </p>
      </div>
    `,
    emailText: `Payment of ${amount} ${currency.toUpperCase()} received for order #${orderNumber}.`,
  });
}

/**
 * Notify vendor of a new inquiry/message
 */
export async function notifyNewInquiry(params: {
  vendorUserId: string;
  conversationId: string;
  customerName: string;
  preview: string;
  productTitle?: string;
}) {
  const { vendorUserId, conversationId, customerName, preview, productTitle } = params;

  const user = await prisma.user.findUnique({
    where: { id: vendorUserId },
    select: { email: true, name: true },
  });

  const subject = productTitle
    ? `New inquiry about "${productTitle}"`
    : `New message from ${customerName}`;

  return createNotification({
    userId: vendorUserId,
    type: 'INQUIRY_NEW',
    title: 'New Customer Inquiry',
    message: productTitle
      ? `${customerName} asked about "${productTitle}": ${preview}`
      : `${customerName}: ${preview}`,
    link: `/dashboard/inbox/${conversationId}`,
    metadata: { conversationId, customerName, productTitle },
    sendEmail: true,
    emailSubject: subject,
    emailHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">New Customer Inquiry</h2>
        <p>Hi ${user?.name ?? 'there'},</p>
        <p>You have a new message from <strong>${customerName}</strong>${productTitle ? ` about "${productTitle}"` : ''}.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; font-style: italic;">
          "${preview}"
        </div>
        <p>
          <a href="${ENV.frontendUrl}/dashboard/inbox/${conversationId}"
             style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Reply Now
          </a>
        </p>
      </div>
    `,
    emailText: `New message from ${customerName}: "${preview}". Reply at ${ENV.frontendUrl}/dashboard/inbox/${conversationId}`,
  });
}

/**
 * Notify vendor of low stock
 */
export async function notifyLowStock(params: {
  vendorUserId: string;
  productId: string;
  productTitle: string;
  currentStock: number;
}) {
  const { vendorUserId, productId, productTitle, currentStock } = params;

  return createNotification({
    userId: vendorUserId,
    type: 'LOW_STOCK',
    title: 'Low Stock Alert',
    message: `"${productTitle}" is running low (${currentStock} left)`,
    link: `/dashboard/products/${productId}/edit`,
    metadata: { productId, productTitle, currentStock },
    sendEmail: true,
    emailSubject: `Low Stock Alert: ${productTitle}`,
    emailHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Low Stock Alert</h2>
        <p>Your product <strong>"${productTitle}"</strong> is running low on stock.</p>
        <p style="font-size: 24px; color: #f59e0b;"><strong>${currentStock}</strong> items remaining</p>
        <p>
          <a href="${ENV.frontendUrl}/dashboard/products/${productId}/edit"
             style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Update Stock
          </a>
        </p>
      </div>
    `,
    emailText: `Low stock alert: "${productTitle}" has only ${currentStock} items remaining.`,
  });
}

/**
 * Notify vendor of payout sent
 */
export async function notifyPayoutSent(params: {
  vendorUserId: string;
  amountCents: number;
  currency: string;
}) {
  const { vendorUserId, amountCents, currency } = params;
  const amount = (amountCents / 100).toFixed(2);

  return createNotification({
    userId: vendorUserId,
    type: 'PAYOUT_SENT',
    title: 'Payout Sent',
    message: `${amount} ${currency.toUpperCase()} has been sent to your bank account`,
    link: `/dashboard/earnings`,
    metadata: { amountCents, currency },
    sendEmail: true,
    emailSubject: `Payout Sent: ${amount} ${currency.toUpperCase()}`,
    emailHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Payout Sent!</h2>
        <p>Great news! A payout of <strong>${amount} ${currency.toUpperCase()}</strong> has been sent to your bank account.</p>
        <p>It should arrive within 2-5 business days depending on your bank.</p>
        <p>
          <a href="${ENV.frontendUrl}/dashboard/earnings"
             style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Earnings
          </a>
        </p>
      </div>
    `,
    emailText: `Payout of ${amount} ${currency.toUpperCase()} has been sent to your bank account.`,
  });
}

/**
 * Notify vendor of new review
 */
export async function notifyNewReview(params: {
  vendorUserId: string;
  productId: string;
  productTitle: string;
  rating: number;
  reviewerName: string;
  comment?: string;
}) {
  const { vendorUserId, productId, productTitle, rating, reviewerName, comment } = params;
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  return createNotification({
    userId: vendorUserId,
    type: 'REVIEW_NEW',
    title: 'New Review',
    message: `${reviewerName} left a ${rating}-star review on "${productTitle}"`,
    link: `/dashboard/products/${productId}/edit`,
    metadata: { productId, productTitle, rating, reviewerName, comment },
    sendEmail: true,
    emailSubject: `New ${rating}-Star Review on "${productTitle}"`,
    emailHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">New Review</h2>
        <p><strong>${reviewerName}</strong> left a review on <strong>"${productTitle}"</strong>:</p>
        <p style="font-size: 24px; color: #f59e0b;">${stars}</p>
        ${comment ? `<blockquote style="background: #f3f4f6; padding: 16px; border-left: 4px solid #8b5cf6; margin: 16px 0;">"${comment}"</blockquote>` : ''}
        <p>
          <a href="${ENV.frontendUrl}/dashboard/products/${productId}/edit"
             style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Product
          </a>
        </p>
      </div>
    `,
    emailText: `${reviewerName} left a ${rating}-star review on "${productTitle}"${comment ? `: "${comment}"` : ''}.`,
  });
}

/**
 * Notify vendor their shop was approved
 */
export async function notifyShopApproved(params: {
  vendorUserId: string;
  shopName: string;
}) {
  const { vendorUserId, shopName } = params;

  return createNotification({
    userId: vendorUserId,
    type: 'SHOP_APPROVED',
    title: 'Shop Approved!',
    message: `Congratulations! Your shop "${shopName}" has been approved`,
    link: `/dashboard`,
    metadata: { shopName },
    sendEmail: true,
    emailSubject: `Your shop "${shopName}" has been approved!`,
    emailHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Congratulations!</h2>
        <p>Your shop <strong>"${shopName}"</strong> has been approved and is now live!</p>
        <p>You can now start adding products and selling to customers.</p>
        <p>
          <a href="${ENV.frontendUrl}/dashboard"
             style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Go to Dashboard
          </a>
        </p>
      </div>
    `,
    emailText: `Congratulations! Your shop "${shopName}" has been approved. Start selling at ${ENV.frontendUrl}/dashboard`,
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

/**
 * Mark notifications as read
 */
export async function markAsRead(notificationIds: string[], userId: string) {
  return prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId, // Ensure user owns these notifications
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}
