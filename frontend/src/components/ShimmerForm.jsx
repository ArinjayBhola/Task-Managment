const ShimmerForm = () => {
  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mt-4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mt-4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mt-4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-full mt-6"></div>
        </div>
      </div>
    </div>
  );
};

export default ShimmerForm;
