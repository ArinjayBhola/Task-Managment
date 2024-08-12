const HomeShimmer = () => {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col space-y-4 p-4">
        <div className="h-6 bg-gray-300 rounded-md w-1/3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded-md w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded-md w-1/4"></div>
        </div>
        <div className="h-20 bg-gray-300 rounded-md"></div>
      </div>
    </div>
  );
};

export default HomeShimmer;
