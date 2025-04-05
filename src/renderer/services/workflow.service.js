class WorkflowService {
  // 工作流操作
  static async getAllWorkflows() {
    return await window.electronAPI.workflow.getAll();
  }

  static async getWorkflowById(id) {
    return await window.electronAPI.workflow.getById(id);
  }

  static async addWorkflow(workflow) {
    return await window.electronAPI.workflow.add(workflow);
  }

  static async updateWorkflow(id, workflowData) {
    return await window.electronAPI.workflow.update(id, workflowData);
  }

  static async deleteWorkflow(id) {
    return await window.electronAPI.workflow.delete(id);
  }

  // 任务操作
  static async addTask(workflowId, task) {
    return await window.electronAPI.task.add(workflowId, task);
  }

  static async updateTask(workflowId, taskId, taskData) {
    return await window.electronAPI.task.update(workflowId, taskId, taskData);
  }

  static async deleteTask(workflowId, taskId) {
    return await window.electronAPI.task.delete(workflowId, taskId);
  }
  
  // 添加运行任务方法
  static async runTask(workflowId, taskId, terminalId) {
    return await window.electronAPI.task.run(workflowId, taskId, terminalId);
  }

  // 添加注册任务输出结果回调方法
  static registerTaskCompletionHandler(callback) {
    return window.electronAPI.task.onComplete(callback);
  }

  // 命令操作
  static async addCommand(workflowId, taskId, command) {
    return await window.electronAPI.command.add(workflowId, taskId, command);
  }

  static async updateCommand(workflowId, taskId, commandIndex, newCommand) {
    return await window.electronAPI.command.update(workflowId, taskId, commandIndex, newCommand);
  }

  static async deleteCommand(workflowId, taskId, commandIndex) {
    return await window.electronAPI.command.delete(workflowId, taskId, commandIndex);
  }
}

export default WorkflowService;