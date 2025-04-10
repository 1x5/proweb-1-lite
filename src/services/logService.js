const logService = {
  success: (message) => {
    console.log('%c✅ ' + message, 'color: #059669; font-weight: bold;');
  },
  
  error: (message) => {
    console.log('%c❌ ' + message, 'color: #DC2626; font-weight: bold;');
  },
  
  warning: (message) => {
    console.log('%c⚠️ ' + message, 'color: #D97706; font-weight: bold;');
  },
  
  info: (message) => {
    console.log('%cℹ️ ' + message, 'color: #3B82F6; font-weight: bold;');
  }
};

export default logService; 