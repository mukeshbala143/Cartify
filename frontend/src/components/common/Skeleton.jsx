export function ProductSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-square w-full"></div>
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded"></div>
        <div className="skeleton h-3 w-1/2 rounded"></div>
        <div className="flex justify-between items-center mt-3">
          <div className="skeleton h-6 w-20 rounded"></div>
          <div className="skeleton h-5 w-12 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex justify-between">
        <div className="skeleton h-4 w-32 rounded"></div>
        <div className="skeleton h-4 w-20 rounded"></div>
      </div>
      <div className="skeleton h-16 w-full rounded"></div>
      <div className="flex justify-between">
        <div className="skeleton h-4 w-24 rounded"></div>
        <div className="skeleton h-4 w-16 rounded"></div>
      </div>
    </div>
  );
}
