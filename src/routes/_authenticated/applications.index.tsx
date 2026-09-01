import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchLoanRequests } from "@/lib/loan-queries";
import { formatDate, formatFCFA } from "@/lib/loan-format";
import { REQUEST_STATUS, LOAN_TYPE_LABEL, describe } from "@/lib/loan-status";
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

export const Route = createFileRoute("/_authenticated/applications/")({
  head: () => ({
    meta: [
      { title: "Demandes de prêt — Zender237 Back-office" },
      {
        name: "description",
        content: "Traitez les demandes de prêt : prise en charge, approbation, rejet et suivi des statuts.",
      },
      { property: "og:title", content: "Demandes de prêt — Zender237" },
      { property: "og:description", content: "File de traitement des demandes de prêt utilisateurs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplicationsPage,
});

const STATUS_FILTERS = ["all", ...Object.keys(REQUEST_STATUS)];

function ApplicationsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["loan_requests"],
    queryFn: fetchLoanRequests,
  });
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const list = data ?? [];
    return list.filter((r) => {
      const matchStatus = status === "all" || r.status === status;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        r.full_name.toLowerCase().includes(q) ||
        (r.profiles?.username ?? "").toLowerCase().includes(q) ||
        r.whatsapp_number.includes(q);
      return matchStatus && matchSearch;
    });
  }, [data, status, search]);

  return (
    <div>
      <PageHeader
        title="Demandes de prêt"
        description="Chaque demande suit le cycle : soumise → contactée → en traitement → approuvée / rejetée."
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Rechercher un nom, un pseudo, un numéro…"
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
                {s === "all" ? "Tous les statuts" : (REQUEST_STATUS[s]?.label ?? s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[840px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-3">Demandeur</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Rang</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Durée</th>
              <th className="px-4 py-3">Soumise le</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  Chargement…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-destructive">
                  {(error as Error).message}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  Aucune demande correspondante.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const s = describe(REQUEST_STATUS, r.status);
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.full_name}</p>
                      <p className="text-xs text-muted-foreground">{r.whatsapp_number}</p>
                    </td>
                    <td className="px-4 py-3">{LOAN_TYPE_LABEL[r.loan_type] ?? r.loan_type}</td>
                    <td className="px-4 py-3 capitalize">{r.rank_at_request}</td>
                    <td className="px-4 py-3 font-semibold">{formatFCFA(r.amount)}</td>
                    <td className="px-4 py-3">{r.repayment_months} mois</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(r.submitted_at)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge label={s.label} tone={s.tone} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/applications/$id"
                        params={{ id: r.id }}
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
