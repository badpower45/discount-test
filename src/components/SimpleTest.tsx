// Simple test component without context to verify React is working
import React from 'react';

export function SimpleTest() {
  const [count, setCount] = React.useState(0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border max-w-md mx-auto m-4">
      <h3 className="text-lg font-semibold mb-4 text-center">🧪 React Test</h3>
      
      <div className="text-center">
        <p className="mb-4">Counter: {count}</p>
        <button 
          onClick={() => setCount(count + 1)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Increment
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
        <p className="text-xs text-green-800">
          ✅ React hooks are working correctly
        </p>
      </div>
    </div>
  );
}