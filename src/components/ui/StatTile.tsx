interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
}

/** Compact stat box used on hero / detail pages — gold icon, big number, uppercase label */
export default function StatTile({ icon, label, value }: StatTileProps) {
  return (
    <div className="px-4 py-5 text-center">
      <div className="text-[#C8A951] mx-auto mb-2 flex justify-center">{icon}</div>
      <div className="text-2xl font-bold text-stone-900 leading-none">
        {value ?? "—"}
      </div>
      <div className="text-[10px] text-stone-500 uppercase tracking-widest mt-2">
        {label}
      </div>
    </div>
  );
}
