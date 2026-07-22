import Spinner from "./Spinner";

// full-page loading state: centers the spinner in the content area below the navbar
const CenteredSpinner = () => (
  <div className="flex h-[calc(100dvh-5rem)] w-full items-center justify-center">
    <Spinner />
  </div>
);

export default CenteredSpinner;
