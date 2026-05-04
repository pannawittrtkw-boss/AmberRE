"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import ProjectForm from "@/components/admin/ProjectForm";

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [projectId, setProjectId] = useState<number | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async ({ locale: l, id }) => {
      setLocale(l);
      const pid = parseInt(id);
      setProjectId(pid);
      try {
        const res = await fetch(`/api/admin/projects/${pid}`);
        const data = await res.json();
        if (data.success) setInitialData(data.data);
      } catch {}
      setLoading(false);
    });
  }, [params]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
      </div>
    );
  }

  if (!projectId || !initialData) {
    return (
      <div className="text-center py-20 text-gray-500">Project not found</div>
    );
  }

  return (
    <ProjectForm locale={locale} projectId={projectId} initialData={initialData} />
  );
}
