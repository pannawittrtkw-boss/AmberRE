"use client";

import { useEffect, useState } from "react";
import ProjectForm from "@/components/admin/ProjectForm";

export default function NewProjectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  return <ProjectForm locale={locale} />;
}
