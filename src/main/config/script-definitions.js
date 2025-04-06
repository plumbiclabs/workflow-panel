const SCRIPT_DEFINITIONS = [
  {
    id: 'system-info',
    name: 'System Information',
    description: 'Retrieves basic system information',
    path: 'system-info.js',
    requiredParams: []
  },
  {
    id: 'user-greeting',
    name: 'User Greeting',
    description: 'Creates a personalized greeting using variables from other tasks',
    path: 'user-greeting.js',
    requiredParams: ['username', 'platform', 'memory', 'greeting']
  }
];

module.exports = { SCRIPT_DEFINITIONS };