import { useState, useEffect } from 'react';
import ScriptService from '../../../services/script.service';

function useScriptOptions(initialScriptId) {
  const [scriptOptions, setScriptOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScriptId, setSelectedScriptId] = useState(initialScriptId || 'default');
  const [selectedScript, setSelectedScript] = useState(null);

  // 加载脚本选项
  useEffect(() => {
    async function loadScripts() {
      setLoading(true);
      try {
        const scripts = await ScriptService.getAllScripts();
        setScriptOptions(scripts);
        
        // 设置当前选择的脚本
        const current = scripts.find(s => s.id === selectedScriptId) || scripts[0];
        setSelectedScript(current);
      } catch (error) {
        console.error('Failed to load scripts:', error);
        // 使用本地定义作为备用
        const localScripts = ScriptService.getLocalScriptDefinitions();
        setScriptOptions(localScripts);
        setSelectedScript(localScripts.find(s => s.id === selectedScriptId) || localScripts[0]);
      } finally {
        setLoading(false);
      }
    }
    
    loadScripts();
  }, [initialScriptId]);
  
  // 当选择的脚本ID变更时，更新选中的脚本对象
  useEffect(() => {
    const script = scriptOptions.find(s => s.id === selectedScriptId);
    if (script) {
      setSelectedScript(script);
    }
  }, [selectedScriptId, scriptOptions]);

  return {
    scriptOptions,
    loading,
    selectedScriptId,
    setSelectedScriptId,
    selectedScript
  };
}

export default useScriptOptions; 