class WorkflowService {
  static async getAllWorkflows() {
    return await window.electronAPI.workflow.getAll();
  }

  static async saveWorkflow(workflow) {
    return await window.electronAPI.workflow.save(workflow);
  }

  static async deleteWorkflow(id) {
    return await window.electronAPI.workflow.delete(id);
  }
}

export default WorkflowService;
