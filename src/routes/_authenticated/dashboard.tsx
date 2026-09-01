import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Banknote, FileText, Receipt, TrendingUp } from "lucide-react";
import { fetchLoanRequests, fetchLoans, fetchRepayments } from "@/lib/loan-queries";
import { formatFCFA, formatDate } from "@/lib/loan-format";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PageHeader } from "@/components/admin/AdminShell";
import { LOAN_STATUS, LOAN_TYPE_LABEL, REQUEST_STATUS, describe } from "@/lib/loan-status";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Vue d'ensemble des prêts — Zender237 Back-office" },
      {
        name: "description",
        content: "Indicateurs clés du portefeuille de prêts Zender237 : encours, demandes, remboursements.",
      },
      { property: "og:title", content: "Vue d'ensemble des prêts — Zender237" },
      { property: "og:description", content: "Encours, demandes en attente et remboursements du module Prêt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const requests = useQuery({ queryKey: ["loan_requests"], queryFn: fetchLoanRequests });
  const loans = useQuery({ queryKey: ["loans"], queryFn: fetchLoans });
  const repayments = useQuery({ queryKey: ["repayments"], queryFn: () => fetchRepayments() });

  const reqs = requests.data ?? [];
  const allLoans = loans.data ?? [];
  const pays = repayments.data ?? [];

  const pending = reqs.filter((r) => ["submitted", "contacted", "processing"].includes(r.status));
  const activeLoans = allLoans.filter((l) => l.status === "active");
  const outstanding = allLoans.reduce((s, l) => s + Number(l.outstanding_amount ?? 0), 0);
  const disbursed = allLoans
    .filter((l) => l.disbursement_status === "completed")
    .reduce((s, l) => s + Number(l.approved_amount ?? 0), 0);
  const repaid = pays.reduce((s, p) => s + Number((p as { amount: number }).amount ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Vue d'ensemble"
        description="Suivi global du portefeuille de prêts et des demandes en cours."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Demandes à traiter"
          value={pending.length}
          hint={`${reqs.length} demande(s) au total`}
          icon={<FileText className="size-5" />}
        />
        <StatCard
          label="Prêts actifs"
          value={activeLoans.length}
          hint={`${allLoans.length} prêt(s) au total`}
          icon={<Banknote className="size-5" />}
        />
        <StatCard
          label="Encours restant dû"
          value={formatFCFA(outstanding)}
          hint={`${formatFCFA(disbursed)} décaissés`}
          icon={<TrendingUp className="size-5" />}
        />
        <StatCard
          label="Total remboursé"
          value={formatFCFA(repaid)}
          hint={`${pays.length} versement(s)`}
          icon={<Receipt className="size-5" />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Dernières demandes</h2>
            <Link to="/applications" className="text-sm font-medium text-primary hover:underline">
              Tout voir
            </Link>
          </div>
          {reqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune demande enregistrée.</p>
          ) : (
            <ul className="divide-y divide-border">
              {reqs.slice(0, 6).map((r) => {
                const s = describe(REQUEST_STATUS, r.status);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        to="/applications/$id"
                        params={{ id: r.id }}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {r.full_name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {LOAN_TYPE_LABEL[r.loan_type] ?? r.loan_type} · {formatDate(r.submitted_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{formatFCFA(r.amount)}</span>
                      <StatusBadge label={s.label} tone={s.tone} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Prêts récents</h2>
            <Link to="/loans" className="text-sm font-medium text-primary hover:underline">
              Tout voir
            </Link>
          </div>
          {allLoans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun prêt actif pour le moment.</p>
          ) : (
            <ul className="divide-y divide-border">
              {allLoans.slice(0, 6).map((l) => {
                const s = describe(LOAN_STATUS, l.status);
                return (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        to="/loans/$id"
                        params={{ id: l.id }}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {l.profiles?.username ?? "Utilisateur"}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Reste {formatFCFA(l.outstanding_amount)} · {formatDate(l.approved_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{formatFCFA(l.approved_amount)}</span>
                      <StatusBadge label={s.label} tone={s.tone} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
