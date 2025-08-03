// Error Tracking Utility - Development Only
// This helps identify where network error notifications are coming from

let errorCount = 0;
const errorLog = [];

// Override toast.error to track where network errors are coming from
if (import.meta.env.DEV) {
  const originalToastError = window.toast?.error;
  if (originalToastError && typeof originalToastError === 'function') {
    window.toast.error = function(message, ...args) {
      // Check if this is a network error message
      if (typeof message === 'string' && message.includes('Network error')) {
        errorCount++;
        const stack = new Error().stack;
        errorLog.push({
          count: errorCount,
          message,
          timestamp: new Date().toISOString(),
          stack: stack?.split('\n').slice(0, 5) // First 5 lines of stack trace
        });
        
        console.group(`🚨 Network Error Toast Detected (#${errorCount})`);
        console.log('Message:', message);
        console.log('Stack trace:', stack);
        console.log('All errors so far:', errorLog);
        console.groupEnd();
        
        // Still show the error for debugging, but with a warning
        return originalToastError(`[DEBUG] ${message}`, ...args);
      }
      
      // For other errors, call original function
      return originalToastError(message, ...args);
    };
  }
}

export { errorCount, errorLog };
