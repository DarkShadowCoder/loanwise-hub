import { supabase } from "@/integrations/supabase/client";

export type ProfileLite = {
  id: string;
  username: string;
  whatsapp_number: string;
  rank_code: string;
  country: string;
};

export type LoanRequestRow = {
  id: string;
  user_id: string;
  loan_type: string;
  amount: number;
  rank_at_request: string;
  repayment_months: number;
  accommodation_months: number;
  full_name: string;
  phone_number: string | null;
  whatsapp_number: string;
  status: string;
  admin_notes: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  contacted_at: string | null;
  processed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  travel_origin: string | null;
  travel_destination: string | null;
  travel_date: string | null;
  passenger_name: string | null;
  accommodation_requested: boolean;
  id_front_path: string;
  id_back_path: string;
  profiles: ProfileLite | null;
};

export type LoanRow = {
  id: string;
  loan_request_id: string;
  user_id: string;
  loan_type: string;
  rank_at_approval: string;
  requested_amount: number;
  approved_amount: number;
  service_fee: number;
  total_due: number;
  amount_repaid: number;
  outstanding_amount: number;
  repayment_months: number;
  status: string;
  disbursement_status: string;
  approved_at: string;
  disbursed_at: string | null;
  maturity_date: string | null;
  closed_at: string | null;
  notes: string | null;
  profiles: ProfileLite | null;
};

const REQUEST_SELECT = "*, profiles:user_id(id, username, whatsapp_number, rank_code, country)";
const LOAN_SELECT = "*, profiles:user_id(id, username, whatsapp_number, rank_code, country)";

export async function fetchLoanRequests(): Promise<LoanRequestRow[]> {
  const { data, error } = await supabase
    .from("loan_requests")
    .select(REQUEST_SELECT)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LoanRequestRow[];
}

export async function fetchLoanRequest(id: string) {
  const { data, error } = await supabase
    .from("loan_requests")
    .select(REQUEST_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as LoanRequestRow | null;
}

export async function fetchLoans(): Promise<LoanRow[]> {
  const { data, error } = await supabase
    .from("loans")
    .select(LOAN_SELECT)
    .order("approved_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LoanRow[];
}

export async function fetchLoan(id: string) {
  const { data, error } = await supabase
    .from("loans")
    .select(LOAN_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as LoanRow | null;
}

export async function fetchLoanByRequest(requestId: string) {
  const { data, error } = await supabase
    .from("loans")
    .select(LOAN_SELECT)
    .eq("loan_request_id", requestId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as LoanRow | null;
}

export async function fetchInstallments(loanId: string) {
  const { data, error } = await supabase
    .from("loan_installments")
    .select("*")
    .eq("loan_id", loanId)
    .order("installment_number");
  if (error) throw error;
  return data ?? [];
}

export async function fetchRepayments(loanId?: string) {
  let query = supabase
    .from("loan_repayments")
    .select("*, loans:loan_id(id, user_id, loan_type, outstanding_amount, total_due)")
    .order("paid_at", { ascending: false });
  if (loanId) query = query.eq("loan_id", loanId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchStatusHistory(requestId: string) {
  const { data, error } = await supabase
    .from("loan_status_history")
    .select("*")
    .eq("loan_request_id", requestId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchLoanEvents(loanId: string) {
  const { data, error } = await supabase
    .from("loan_events")
    .select("*")
    .eq("loan_id", loanId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchRankRules() {
  const { data, error } = await supabase
    .from("rank_rules")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchProfilesByRank() {
  const { data, error } = await supabase.from("profiles").select("id, rank_code");
  if (error) throw error;
  return data ?? [];
}
