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

  // 基础 Workflow 操作
  getAllWorkflows() {
    return this.store.get('workflows');
  }

  getWorkflowById(id) {
    const workflows = this.getAllWorkflows();
    return workflows.find(w => w.id === id) || null;
  }

  addWorkflow(workflow) {
    const workflows = this.getAllWorkflows();
    const newWorkflow = {
      id: workflow.id || Date.now(),
      name: workflow.name || `Workflow ${workflows.length + 1}`,
      tasks: workflow.tasks || []
    };
    
    this.store.set('workflows', [...workflows, newWorkflow]);
    return newWorkflow;
  }
  
  updateWorkflow(id, workflowData) {
    const workflows = this.getAllWorkflows();
    const existingIndex = workflows.findIndex(w => w.id === id);
    
    if (existingIndex === -1) return null;
    
    const updatedWorkflow = {
      ...workflows[existingIndex],
      ...workflowData,
      id // 确保 ID 不被覆盖
    };
    
    workflows[existingIndex] = updatedWorkflow;
    this.store.set('workflows', workflows);
    return updatedWorkflow;
  }

  deleteWorkflow(id) {
    const workflows = this.getAllWorkflows();
    this.store.set('workflows', workflows.filter(w => w.id !== id));
    return true;
  }

  addTask(workflowId, task) {
    const workflow = this.getWorkflowById(workflowId);
    if (!workflow) return null;
  
    let newTask = {
      id: task.id || Date.now(),
      name: task.name || `Task ${(workflow.tasks || []).length + 1}`,
      type: task.type || 'command' // 默认为命令类型任务
    };
  
    // 根据任务类型设置不同的初始属性
    if (task.type === 'key-value') {
      newTask.parameters = task.parameters || [];
    } else {
      // 默认命令类型
      newTask.commands = task.commands || [];
    }
  
    const updatedWorkflow = {
      ...workflow,
      tasks: [...(workflow.tasks || []), newTask]
    };
  
    return this.updateWorkflow(workflowId, { tasks: updatedWorkflow.tasks });
  }

  updateTask(workflowId, taskId, taskData) {
    const workflow = this.getWorkflowById(workflowId);
    if (!workflow || !workflow.tasks) return null;

    const taskIndex = workflow.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return workflow;

    const updatedTasks = [...workflow.tasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      ...taskData,
      id: taskId // 确保 ID 不被覆盖
    };

    // 使用更新 workflow 的方法来保存
    return this.updateWorkflow(workflowId, { tasks: updatedTasks });
  }

  deleteTask(workflowId, taskId) {
    const workflow = this.getWorkflowById(workflowId);
    if (!workflow || !workflow.tasks) return workflow;

    const updatedTasks = workflow.tasks.filter(t => t.id !== taskId);
    
    // 使用更新 workflow 的方法来保存
    return this.updateWorkflow(workflowId, { tasks: updatedTasks });
  }

  // Command 相关操作
  addCommand(workflowId, taskId, command) {
    const workflow = this.getWorkflowById(workflowId);
    if (!workflow || !workflow.tasks) return null;

    const taskIndex = workflow.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return workflow;

    const task = workflow.tasks[taskIndex];
    const updatedCommands = [...(task.commands || []), command];
    
    // 使用更新任务的方法来保存
    return this.updateTask(workflowId, taskId, { commands: updatedCommands });
  }

  updateCommand(workflowId, taskId, commandIndex, newCommand) {
    const workflow = this.getWorkflowById(workflowId);
    if (!workflow || !workflow.tasks) return null;

    const taskIndex = workflow.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return workflow;

    const task = workflow.tasks[taskIndex];
    if (!task.commands || commandIndex >= task.commands.length) return workflow;

    const updatedCommands = [...task.commands];
    updatedCommands[commandIndex] = newCommand;

    // 使用更新任务的方法来保存
    return this.updateTask(workflowId, taskId, { commands: updatedCommands });
  }

  deleteCommand(workflowId, taskId, commandIndex) {
    const workflow = this.getWorkflowById(workflowId);
    if (!workflow || !workflow.tasks) return null;

    const taskIndex = workflow.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return workflow;

    const task = workflow.tasks[taskIndex];
    if (!task.commands || commandIndex >= task.commands.length) return workflow;

    const updatedCommands = [...task.commands];
    updatedCommands.splice(commandIndex, 1);

    // 使用更新任务的方法来保存
    return this.updateTask(workflowId, taskId, { commands: updatedCommands });
  }
}

module.exports = new WorkflowStore();
