const Store = require('electron-store');

class WorkflowStore {
  constructor() {
    this.store = new Store({
      name: 'workflows',
      defaults: {
        workflows: []
      }
    });
  }

  getAllWorkflows() {
    return this.store.get('workflows');
  }

  saveWorkflow(workflow) {
    const workflows = this.getAllWorkflows();
    const existingIndex = workflows.findIndex(w => w.id === workflow.id);
    
    if (existingIndex !== -1) {
      workflows[existingIndex] = workflow;
      this.store.set('workflows', workflows);
    } else {
      this.store.set('workflows', [...workflows, workflow]);
    }
    return workflow;
  }

  deleteWorkflow(id) {
    const workflows = this.getAllWorkflows();
    this.store.set('workflows', workflows.filter(w => w.id !== id));
  }
}

module.exports = new WorkflowStore();