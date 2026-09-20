import PropertyListPage from "@/components/admin/PropertyListPage";

export default function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <PropertyListPage params={params} />;
}
