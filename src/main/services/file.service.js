const { dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class FileService {
  // 导出工作流到JSON文件
  async exportWorkflow(workflowData) {
    try {
      logger.info('开始导出工作流', { workflowId: workflowData.id });
      
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: '导出工作流',
        defaultPath: `${workflowData.name || 'workflow'}.json`,
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });
      
      if (canceled || !filePath) {
        logger.info('导出操作已取消');
        return { success: false, message: '操作已取消' };
      }
      
      // 确保工作流数据是最新的副本
      const workflowJson = JSON.stringify(workflowData, null, 2);
      await fs.promises.writeFile(filePath, workflowJson, 'utf-8');
      
      logger.info('工作流导出成功', { filePath });
      return { success: true, filePath };
    } catch (error) {
      logger.error('导出工作流失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导入工作流从JSON文件
  async importWorkflow() {
    try {
      logger.info('开始导入工作流');
      
      const { filePaths, canceled } = await dialog.showOpenDialog({
        title: '导入工作流',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile']
      });
      
      if (canceled || !filePaths || filePaths.length === 0) {
        logger.info('导入操作已取消');
        return { success: false, message: '操作已取消' };
      }
      
      const fileContent = await fs.promises.readFile(filePaths[0], 'utf-8');
      let workflowData;
      
      try {
        workflowData = JSON.parse(fileContent);
      } catch (parseError) {
        logger.error('无效的JSON格式:', parseError);
        return { success: false, error: '无效的工作流文件格式' };
      }
      
      // 基本验证
      if (!workflowData || !workflowData.name) {
        logger.error('无效的工作流数据格式');
        return { success: false, error: '无效的工作流数据格式' };
      }
      
      logger.info('工作流导入成功', { workflowName: workflowData.name });
      return { success: true, workflowData };
    } catch (error) {
      logger.error('导入工作流失败:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new FileService(); 