import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchInstallments,
  fetchLoan,
  fetchLoanEvents,
  fetchRepayments,
} from "@/lib/loan-queries";
import { formatDate, formatDateTime, formatFCFA } from "@/lib/loan-format";
import {
  DISBURSEMENT_STATUS,
  LOAN_STATUS,
  LOAN_TYPE_LABEL,
  PAYMENT_METHODS,
  describe,
} from "@/lib/loan-status";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/loans/$id")({
  head: () => ({
    meta: [
      { title: "Détail du prêt — Zender237 Back-office" },
      {
        name: "description",
        content:
          "Détail d'un prêt Zender237 : décaissement, échéancier, remboursements enregistrés et événements.",
      },
      { property: "og:title", content: "Détail du prêt — Zender237" },
      { property: "og:description", content: "Gestion du décaissement et du remboursement d'un prêt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoanDetail,
});

const INSTALLMENT_TONE: Record<string, "neutral" | "warning" | "success" | "danger"> = {
  pending: "neutral",
  due: "warning",
  overdue: "danger",
  paid: "success",
  partial: "warning",
};

function LoanDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const router = useRouter();

  const loan = useQuery({ queryKey: ["loan", id], queryFn: () => fetchLoan(id) });
  const installments = useQuery({
    queryKey: ["installments", id],
    queryFn: () => fetchInstallments(id),
  });
  const repayments = useQuery({
    queryKey: ["repayments", id],
    queryFn: () => fetchRepayments(id),
  });
  const events = useQuery({ queryKey: ["loan_events", id], queryFn: () => fetchLoanEvents(id) });

  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("manual");
  const [note, setNote] = useState("");
  const [payOpen, setPayOpen] = useState(false);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["loan", id] });
    void qc.invalidateQueries({ queryKey: ["installments", id] });
    void qc.invalidateQueries({ queryKey: ["repayments", id] });
    void qc.invalidateQueries({ queryKey: ["loan_events", id] });
    void qc.invalidateQueries({ queryKey: ["loans"] });
    void qc.invalidateQueries({ queryKey: ["repayments"] });
  };

  const disburse = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_disburse_loan", {
        p_loan_id: id,
        p_external_reference: reference || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Prêt décaissé");
      setReference("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const recordPayment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_record_loan_repayment", {
        p_loan_id: id,
        p_amount: Number(amount),
        p_payment_method: method,
        p_note: note || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Remboursement enregistré");
      setPayOpen(false);
      setAmount("");
      setNote("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markDefault = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_mark_loan_defaulted", { p_loan_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Prêt marqué en défaut");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loan.isLoading) return <p className="text-sm text-muted-foreground">Chargement du prêt…</p>;
  if (loan.error)
    return <p className="text-sm text-destructive">{(loan.error as Error).message}</p>;
  const l = loan.data;
  if (!l) return <p className="text-sm text-muted-foreground">Prêt introuvable.</p>;

  const s = describe(LOAN_STATUS, l.status);
  const d = describe(DISBURSEMENT_STATUS, l.disbursement_status);
  const nextInstallment = (installments.data ?? []).find(
    (i) => (i as { status: string }).status !== "paid",
  ) as { due_date: string; amount_due: number } | undefined;

  return (
    <div>
      <button
        onClick={() => router.navigate({ to: "/loans" })}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour aux prêts
      </button>

      <PageHeader
        title={`Prêt ${l.id.slice(0, 8).toUpperCase()}`}
        description={`${LOAN_TYPE_LABEL[l.loan_type] ?? l.loan_type} · ${l.profiles?.username ?? "—"} · rang ${l.rank_at_approval}`}
        actions={
          <div className="flex gap-2">
            <StatusBadge label={d.label} tone={d.tone} />
            <StatusBadge label={s.label} tone={s.tone} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Montant approuvé" value={formatFCFA(l.approved_amount)} hint={`Frais : ${formatFCFA(l.service_fee)}`} />
        <StatCard label="Total à rembourser" value={formatFCFA(l.total_due)} hint={`${l.repayment_months} mois`} />
        <StatCard label="Déjà remboursé" value={formatFCFA(l.amount_repaid)} />
        <StatCard
          label="Reste à payer"
          value={formatFCFA(l.outstanding_amount)}
          hint={
            nextInstallment
              ? `Prochaine échéance : ${formatDate(nextInstallment.due_date)}`
              : "Aucune échéance en attente"
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="panel overflow-x-auto">
            <h2 className="px-5 pt-5 pb-3 text-sm font-semibold">Échéancier</h2>
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Échéance</th>
                  <th className="px-4 py-3">Montant dû</th>
                  <th className="px-4 py-3">Payé</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {(installments.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Aucune échéance générée.
                    </td>
                  </tr>
                ) : (
                  (installments.data ?? []).map((row) => {
                    const i = row as {
                      id: string;
                      installment_number: number;
                      due_date: string;
                      amount_due: number;
                      amount_paid: number;
                      status: string;
                    };
                    return (
                      <tr key={i.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">{i.installment_number}</td>
                        <td className="px-4 py-3">{formatDate(i.due_date)}</td>
                        <td className="px-4 py-3">{formatFCFA(i.amount_due)}</td>
                        <td className="px-4 py-3">{formatFCFA(i.amount_paid)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={i.status}
                            tone={INSTALLMENT_TONE[i.status] ?? "neutral"}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </section>

          <section className="panel p-5">
            <h2 className="mb-4 text-sm font-semibold">Remboursements enregistrés</h2>
            {(repayments.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun remboursement enregistré.</p>
            ) : (
              <ul className="space-y-3">
                {(repayments.data ?? []).map((row) => {
                  const p = row as {
                    id: string;
                    amount: number;
                    payment_method: string;
                    paid_at: string;
                    note: string | null;
                  };
                  return (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{formatFCFA(p.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {PAYMENT_METHODS.find((m) => m.value === p.payment_method)?.label ??
                            p.payment_method}
                          {p.note ? ` · ${p.note}` : ""}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(p.paid_at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="panel p-5">
            <h2 className="mb-4 text-sm font-semibold">Journal du prêt</h2>
            {(events.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun évènement.</p>
            ) : (
              <ol className="space-y-2">
                {(events.data ?? []).map((row) => {
                  const e = row as {
                    id: string;
                    event_type: string;
                    note: string | null;
                    amount: number | null;
                    created_at: string;
                  };
                  return (
                    <li key={e.id} className="flex flex-wrap gap-2 text-sm">
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(e.created_at)}
                      </span>
                      <span className="font-medium">{e.event_type}</span>
                      {e.amount ? <span>{formatFCFA(e.amount)}</span> : null}
                      {e.note ? (
                        <span className="text-xs text-muted-foreground">· {e.note}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="mb-4 text-sm font-semibold">Actions</h2>
            <div className="space-y-3">
              {l.disbursement_status !== "completed" ? (
                <div className="space-y-2">
                  <Label htmlFor="ref">Référence de décaissement</Label>
                  <Input
                    id="ref"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Réf. virement / MoMo"
                  />
                  <Button
                    className="w-full"
                    disabled={disburse.isPending}
                    onClick={() => disburse.mutate()}
                  >
                    Décaisser le prêt
                  </Button>
                </div>
              ) : null}

              <Dialog open={payOpen} onOpenChange={setPayOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={!["active", "approved"].includes(l.status)}
                  >
                    Enregistrer un remboursement
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enregistrer un remboursement</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="amount">Montant (FCFA)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Moyen de paiement</Label>
                      <Select value={method} onValueChange={setMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="note">Note</Label>
                      <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => recordPayment.mutate()}
                      disabled={recordPayment.isPending || !amount}
                    >
                      Enregistrer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {l.status === "active" ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={markDefault.isPending}
                  onClick={() => markDefault.mutate()}
                >
                  Marquer en défaut
                </Button>
              ) : null}
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="mb-4 text-sm font-semibold">Informations</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Approuvé le : </span>
                {formatDateTime(l.approved_at)}
              </p>
              <p>
                <span className="text-muted-foreground">Décaissé le : </span>
                {formatDateTime(l.disbursed_at)}
              </p>
              <p>
                <span className="text-muted-foreground">Maturité : </span>
                {formatDate(l.maturity_date)}
              </p>
              <Link
                to="/applications/$id"
                params={{ id: l.loan_request_id }}
                className="inline-block text-sm font-medium text-primary hover:underline"
              >
                Voir la demande d'origine
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
