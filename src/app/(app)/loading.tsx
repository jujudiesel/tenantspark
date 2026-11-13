export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-6 animate-pulse">
      <div className="h-9 w-56 rounded-lg bg-line" />
      <div className="flex flex-wrap gap-6">
        <div className="flex-[2_1_380px] h-48 rounded-[14px] bg-white border border-line" />
        <div className="flex-[1_1_300px] h-48 rounded-[14px] bg-white border border-line" />
      </div>
      <div className="h-64 rounded-[14px] bg-white border border-line" />
    </div>
  );
}
