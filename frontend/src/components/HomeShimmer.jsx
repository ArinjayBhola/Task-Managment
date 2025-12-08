const HomeShimmer = () => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-6 p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm animate-pulse">
      <div className="h-8 bg-white/10 rounded-md w-1/3 mb-6"></div>
      <div className="space-y-4">
        <div className="h-4 bg-white/10 rounded w-3/4"></div>
        <div className="h-4 bg-white/10 rounded w-1/2"></div>
      </div>
      <div className="mt-8 flex gap-4">
        <div className="h-24 bg-white/10 rounded-xl w-full"></div>
        <div className="h-24 bg-white/10 rounded-xl w-full"></div>
      </div>
    </div>
  );
};

export default HomeShimmer;
