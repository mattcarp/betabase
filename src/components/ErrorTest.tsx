import React, { useState } from "react";

const ErrorTest: React.FC = () => {
  const [throwError, setThrowError] = useState(false);

  if (throwError) {
    throw new Error("This is a test error to verify the ErrorBoundary.");
  }

  return (
    <button
      onClick={() => setThrowError(true)}
      className="m-4 p-2 bg-red-500 text-white rounded"
      data-testid="error-test-button"
    >
      Throw Test Error
    </button>
  );
};

export default ErrorTest;
