import Stripe from 'stripe';
import { ENV } from '../env';

export const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: '2024-06-20',
});
