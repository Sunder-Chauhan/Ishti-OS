/**
 * Early Access & Newsletter Subscriptions
 */

export interface EarlyAccessSubscriber {
  id: string;
  email?: string;
  phone?: string;
  preferred_tradition?: string;
  interested_in: string[];
  source: string;
  created_at: string;
}
