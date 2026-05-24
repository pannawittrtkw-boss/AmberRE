"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import ContractForm from "../ContractForm";

export default function NewContractPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("propertyId");
  const copyFromId = searchParams.get("copyFromId");
  const [prefill, setPrefill] = useState<any>(null);
  const [loading, setLoading] = useState(!!propertyId || !!copyFromId);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  useEffect(() => {
    if (!propertyId) return;
    fetch(`/api/properties/${propertyId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const p = d.data;
          setPrefill({
            propertyId: Number(propertyId),
            projectName: p.projectName || p.titleTh || "",
            unitNumber: p.estCode || "",
            buildingName: p.building || "",
            floorNumber: p.floor ? String(p.floor) : "",
            propertyAddress: p.address || "",
            sizeSqm: p.sizeSqm ? Number(p.sizeSqm) : "",
            monthlyRent: p.price ? Number(p.price) : "",
            securityDeposit: p.price ? Number(p.price) * 2 : "",
            lessorName: p.ownerName || "",
            lessorPhone: p.ownerPhone || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [propertyId]);

  // Copy-from-existing seed: load the source contract and strip out
  // identifiers/dates/status so ContractForm treats the data as a brand
  // new draft. We keep furnitureList/applianceList/otherItems/
  // customClauses/clauseOverrides as the raw JSON strings the form's
  // parsers expect.
  useEffect(() => {
    if (!copyFromId) return;
    fetch(`/api/admin/contracts/${copyFromId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const {
          id: _id,
          contractNumber: _cn,
          contractDate: _cd,
          startDate: _sd,
          endDate: _ed,
          status: _st,
          createdAt: _ca,
          updatedAt: _ua,
          createdById: _cb,
          ...rest
        } = d.data;
        // touch the unused destructured locals to keep eslint quiet
        void _id;
        void _cn;
        void _cd;
        void _sd;
        void _ed;
        void _st;
        void _ca;
        void _ua;
        void _cb;
        setPrefill(rest);
      })
      .finally(() => setLoading(false));
  }, [copyFromId]);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return <ContractForm locale={locale} initialData={prefill} />;
}
