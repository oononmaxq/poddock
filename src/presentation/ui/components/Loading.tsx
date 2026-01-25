export function Loading() {
  return (
    <div className="flex justify-center py-12">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="card bg-base-200 animate-pulse">
      <div className="card-body">
        <div className="h-6 bg-base-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-base-300 rounded w-1/2"></div>
      </div>
    </div>
  );
}
