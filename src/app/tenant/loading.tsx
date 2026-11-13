export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-5 animate-pulse">
      <div className="h-8 w-40 rounded-lg bg-line" />
      <div className="h-52 rounded-[18px] bg-navy/90" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-[84px] rounded-[14px] bg-white border border-line" />
        <div className="h-[84px] rounded-[14px] bg-white border border-line" />
      </div>
    </div>
  );
}
