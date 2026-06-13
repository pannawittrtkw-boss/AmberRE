import AcceptForm from "./AcceptForm";

export default function ScanLinkAcceptPage({
  searchParams,
}: {
  searchParams: { propId?: string; urlId?: string; seq?: string; by?: string };
}) {
  return (
    <AcceptForm
      propId={searchParams.propId ?? ""}
      urlId={searchParams.urlId ?? ""}
      seq={searchParams.seq ?? ""}
      by={searchParams.by ?? ""}
    />
  );
}
