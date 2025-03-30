class ScriptService {
  
  // 从主进程获取完整脚本列表
  static async getAllScripts() {
    return await window.electronAPI.script.getAll();
  }
  
  // 根据ID获取脚本
  static async getScriptById(scriptId) {
    return await window.electronAPI.script.getById(scriptId);
  }
}

export default ScriptService;