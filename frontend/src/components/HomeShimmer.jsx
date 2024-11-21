const HomeShimmer = () => {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col space-y-4 p-4 w-full sm:w-11/12 md:w-10/12 lg:w-8/12 xl:w-7/12 mx-auto">
        <div className="h-6 bg-gray-300 rounded-md w-1/3 sm:w-1/4 md:w-1/6 lg:w-1/5"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded-md w-1/2 sm:w-2/5 md:w-1/3 lg:w-1/4"></div>
          <div className="h-4 bg-gray-300 rounded-md w-1/4 sm:w-2/5 md:w-1/3 lg:w-1/4"></div>
        </div>
        <div className="h-20 bg-gray-300 rounded-md w-full sm:w-11/12 md:w-10/12 lg:w-8/12"></div>
      </div>
    </div>
  );
};

export default HomeShimmer;
