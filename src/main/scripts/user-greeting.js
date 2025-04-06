/**
 * User Greeting Script
 * 
 * This script demonstrates using variables from other tasks.
 * It can reference variables like ${TaskX.output.user.username}
 */

module.exports = function(params, callback) {
  try {
    // The params object should contain references that have been resolved
    const username = params.username || 'User';
    const platform = params.platform || 'unknown platform';
    const memory = params.memory || 'unknown memory';
    const greeting = params.greeting || 'Hello';
    
    // Create a personalized message
    const message = `${greeting}, ${username}! 
You are using ${platform} with ${memory} of RAM.
The current time is ${new Date().toLocaleTimeString()}.`;
    
    // Generate some example output data
    const output = {
      message: message,
      timestamp: new Date().getTime(),
      details: {
        greeting: greeting,
        username: username,
        platform: platform,
        memory: memory
      }
    };
    
    // Return the output
    callback(null, {
      success: true,
      output: output
    });
  } catch (error) {
    callback({
      success: false,
      error: error.message
    });
  }
}; 