import nodemailer from 'nodemailer';
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { ENV } from '../env';

export type SendEmailJob = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const transporter = nodemailer.createTransport({
  host: ENV.smtpHost,
  port: ENV.smtpPort,
  secure: ENV.smtpSecure,
  auth: {
    user: ENV.smtpUser,
    pass: ENV.smtpPass,
  },
});

const shouldUseQueue = Boolean(ENV.redisUrl) && ENV.nodeEnv !== 'development';

const redisConnection = shouldUseQueue && ENV.redisUrl
  ? new IORedis(ENV.redisUrl, { maxRetriesPerRequest: null })
  : null;

export const emailQueue = redisConnection
  ? new Queue<SendEmailJob>('email', {
      connection: redisConnection,
      defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    })
  : undefined;

if (redisConnection && emailQueue) {
  new Worker<SendEmailJob>(
    'email',
    async (job: Job<SendEmailJob>) => {
      const { to, subject, html, text } = job.data;
      await transporter.sendMail({
        from: ENV.smtpFrom,
        to,
        subject,
        html,
        text,
      });
    },
    { connection: redisConnection }
  );
}

export async function enqueueEmail(job: SendEmailJob) {
  if (!emailQueue) {
    await transporter.sendMail({
      from: ENV.smtpFrom,
      to: job.to,
      subject: job.subject,
      html: job.html,
      text: job.text,
    });
    return;
  }

  await emailQueue.add('send', job);
}
