/**
 * Expert Network & Booking Models
 * Connects devotees with vetted Pandits and Astrological Scholars.
 */

export type ExpertSpecialization =
  | "vedic_astrology"
  | "karmakanda_puja"
  | "vastu_shastra"
  | "vedanta_philosophy"
  | "sanskrit_scholar";

export type ExpertVerificationStatus =
  | "unverified"
  | "documents_submitted"
  | "scholarly_vetted"
  | "accredited";

export interface ExpertProfile {
  id: string;
  user_id: string;
  full_name: string;
  title: string;
  specializations: ExpertSpecialization[];
  years_of_experience: number;
  languages: string[];
  gurukul_or_institution?: string;
  bio: string;
  hourly_fee_inr: number;
  verification_status: ExpertVerificationStatus;
  rating?: number;
  review_count: number;
  is_active: boolean;
}

export interface ConsultationSlot {
  id: string;
  expert_id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
}

export type BookingStatus =
  | "pending_confirmation"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "refunded";

export interface BookingRequest {
  id: string;
  expert_id: string;
  user_id: string;
  slot_id: string;
  service_type: "online_consultation" | "in_person_puja" | "kundli_matching";
  status: BookingStatus;
  amount_inr: number;
  payment_status: "pending" | "paid" | "failed";
  created_at: string;
  updated_at: string;
}
