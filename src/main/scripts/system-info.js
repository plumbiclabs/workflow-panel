/**
 * System Information Script
 * 
 * This script returns basic system information as structured data
 * that can be referenced by other tasks.
 */

const os = require('os');

module.exports = function(params, callback) {
  try {
    // Get basic system information
    const systemInfo = {
      os: {
        type: os.type(),
        platform: os.platform(),
        release: os.release(),
        arch: os.arch()
      },
      memory: {
        total: Math.round(os.totalmem() / (1024 * 1024 * 1024) * 100) / 100 + 'GB',
        free: Math.round(os.freemem() / (1024 * 1024 * 1024) * 100) / 100 + 'GB',
        usage: Math.round((1 - os.freemem() / os.totalmem()) * 1000) / 10 + '%'
      },
      cpu: {
        model: os.cpus()[0].model,
        cores: os.cpus().length
      },
      network: {
        hostname: os.hostname(),
        interfaces: Object.keys(os.networkInterfaces()).length
      },
      user: {
        username: os.userInfo().username,
        homedir: os.userInfo().homedir
      },
      time: {
        uptime: Math.round(os.uptime() / 3600 * 10) / 10 + ' hours',
        current: new Date().toISOString()
      }
    };
    
    // Return the information
    callback(null, {
      success: true,
      output: systemInfo
    });
  } catch (error) {
    callback({
      success: false,
      error: error.message
    });
  }
}; 