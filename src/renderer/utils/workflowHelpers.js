/**
* 工作流相关的工具函数
*/

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export const generateId = () => {
    return Date.now().toString();
};

/**
 * 创建新的工作流对象
 * @param {string} name - 工作流名称
 * @returns {Object} 工作流对象
 */
export const createWorkflow = (name = 'New Workflow') => {
    return {
        id: generateId(),
        name,
        tasks: []
    };
};

/**
 * 创建新的任务对象
 * @param {string} name - 任务名称
 * @returns {Object} 任务对象
 */
export const createTask = (name = 'New Task') => {
    return {
        id: generateId(),
        name,
        commands: []
    };
};

/**
 * 查找工作流中的任务
 * @param {Object} workflow - 工作流对象
 * @param {string} taskId - 任务ID
 * @returns {Object|null} 找到的任务或null
 */
export const findTaskInWorkflow = (workflow, taskId) => {
    if (!workflow || !workflow.tasks) return null;
    return workflow.tasks.find(task => task.id === taskId) || null;
};