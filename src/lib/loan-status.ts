export type BadgeTone = "neutral" | "info" | "warning" | "success" | "danger";

export const REQUEST_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  submitted: { label: "Soumise", tone: "warning" },
  contacted: { label: "Contactée", tone: "info" },
  processing: { label: "En traitement", tone: "info" },
  approved: { label: "Approuvée", tone: "success" },
  rejected: { label: "Rejetée", tone: "danger" },
  cancelled: { label: "Annulée", tone: "neutral" },
  completed: { label: "Terminée", tone: "success" },
};

export const LOAN_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  approved: { label: "Approuvé", tone: "info" },
  active: { label: "Actif", tone: "warning" },
  paid: { label: "Remboursé", tone: "success" },
  defaulted: { label: "En défaut", tone: "danger" },
  cancelled: { label: "Annulé", tone: "neutral" },
};

export const DISBURSEMENT_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: "À décaisser", tone: "warning" },
  processing: { label: "En cours", tone: "info" },
  completed: { label: "Décaissé", tone: "success" },
  failed: { label: "Échec", tone: "danger" },
};

export const LOAN_TYPE_LABEL: Record<string, string> = {
  money: "Prêt d'argent",
  flight: "Prêt billet d'avion",
};

export const PAYMENT_METHODS = [
  { value: "manual", label: "Manuel" },
  { value: "bank", label: "Virement bancaire" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "cash", label: "Espèces" },
  { value: "wallet", label: "Wallet" },
] as const;

export function describe(
  map: Record<string, { label: string; tone: BadgeTone }>,
  status: string | null | undefined,
): { label: string; tone: BadgeTone } {
  if (!status) return { label: "—", tone: "neutral" };
  return map[status] ?? { label: status, tone: "neutral" };
}
