// setup-cli-environment.ts
// Sets up module aliases for CLI mode so vscode imports resolve to our shim

import * as path from 'path';

export function setupCLIEnvironment() {
  // Get the Module class from Node's internals
  const Module = require('module');
  
  // Get the original require function
  const originalRequire = Module.prototype.require;
  
  // Override require to intercept vscode imports
  Module.prototype.require = function(id: string) {
    if (id === 'vscode') {
      // Redirect to our shim
      const shimPath = path.join(__dirname, 'vscode-shim');
      return originalRequire.call(this, shimPath);
    }
    return originalRequire.call(this, id);
  };
}
