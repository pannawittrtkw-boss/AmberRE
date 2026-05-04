"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import ContractForm from "../../ContractForm";

export default function EditContractPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [contractId, setContractId] = useState<number | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ locale: l, id }) => {
      setLocale(l);
      setContractId(parseInt(id, 10));
      fetch(`/api/admin/contracts/${id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setData(d.data);
        })
        .finally(() => setLoading(false));
    });
  }, [params]);

  if (loading || !data)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <ContractForm
      locale={locale}
      initialData={data}
      contractId={contractId!}
    />
  );
}
