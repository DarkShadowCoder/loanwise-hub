import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchLoans } from "@/lib/loan-queries";
import { formatDate, formatFCFA } from "@/lib/loan-format";
import {
  DISBURSEMENT_STATUS,
  LOAN_STATUS,
  LOAN_TYPE_LABEL,
  describe,
} from "@/lib/loan-status";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PageHeader } from "@/components/admin/AdminShell";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/loans/")({
  head: () => ({
    meta: [
      { title: "Prêts actifs — Zender237 Back-office" },
      {
        name: "description",
        content:
          "Portefeuille des prêts Zender237 : décaissements, encours, échéances et statut de remboursement.",
      },
      { property: "og:title", content: "Prêts actifs — Zender237" },
      { property: "og:description", content: "Suivi du portefeuille de prêts décaissés." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoansPage,
});

const STATUS_FILTERS = ["all", ...Object.keys(LOAN_STATUS)];

function LoansPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["loans"], queryFn: fetchLoans });
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    return (data ?? []).filter((l) => {
      const matchStatus = status === "all" || l.status === status;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (l.profiles?.username ?? "").toLowerCase().includes(q) ||
        (l.profiles?.whatsapp_number ?? "").includes(q) ||
        l.id.startsWith(q);
      return matchStatus && matchSearch;
    });
  }, [data, status, search]);

  return (
    <div>
      <PageHeader
        title="Prêts"
        description="Cycle du prêt : approuvé → décaissé → actif → remboursé ou en défaut."
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Rechercher un emprunteur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "Tous les statuts" : (LOAN_STATUS[s]?.label ?? s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-3">Emprunteur</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Approuvé</th>
              <th className="px-4 py-3">Total dû</th>
              <th className="px-4 py-3">Remboursé</th>
              <th className="px-4 py-3">Reste</th>
              <th className="px-4 py-3">Échéance</th>
              <th className="px-4 py-3">Décaissement</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                  Chargement…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-destructive">
                  {(error as Error).message}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                  Aucun prêt correspondant.
                </td>
              </tr>
            ) : (
              rows.map((l) => {
                const s = describe(LOAN_STATUS, l.status);
                const d = describe(DISBURSEMENT_STATUS, l.disbursement_status);
                return (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-medium">{l.profiles?.username ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.profiles?.whatsapp_number ?? ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">{LOAN_TYPE_LABEL[l.loan_type] ?? l.loan_type}</td>
                    <td className="px-4 py-3">{formatFCFA(l.approved_amount)}</td>
                    <td className="px-4 py-3">{formatFCFA(l.total_due)}</td>
                    <td className="px-4 py-3 text-success">{formatFCFA(l.amount_repaid)}</td>
                    <td className="px-4 py-3 font-semibold">{formatFCFA(l.outstanding_amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(l.maturity_date)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={d.label} tone={d.tone} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={s.label} tone={s.tone} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/loans/$id"
                        params={{ id: l.id }}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
