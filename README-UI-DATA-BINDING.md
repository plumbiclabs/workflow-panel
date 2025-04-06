 # UI 和 数据 Store 的双向绑定设计

本项目使用 React Context API 结合 Electron Store 实现了完整的 UI 和数据 Store 的双向绑定，包括数据持久化。

## 完整数据链路图

```
磁盘存储 <----> Electron Store <----> 主进程服务 <----> IPC通信 <----> 渲染进程服务 <----> Context API <----> React UI
(持久化)       (workflow.store.js)  (ipc.service.js)              (workflow.service.js) (WorkflowContext)   (组件)
```

## 详细数据流向图

```
+---------------+      +-------------------+      +------------------+
| 磁盘文件存储   | <--> | Electron Store    | <--> | 主进程服务       |
| (.json文件)   |      | (数据持久化层)     |      | (ipc.service.js) |
+---------------+      +-------------------+      +--------+---------+
                                                           |
                                                  IPC通信   |
                                                           v
+-----------------+    +--------------------+    +----------+---------+
| React UI组件    | <- | WorkflowContext    | <- | 渲染进程服务       |
| (WorkflowList等)|    | (状态管理层)        |    | (workflow.service)|
+--------+--------+    +----------+---------+    +--------------------+
         |                        |
         v                        v
   用户操作触发 -------> Context方法调用 ------> 更新应用状态
```

## 数据链路完整流程

### 1. 数据保存流程 (写入链路)

1. **用户UI交互**: 用户在UI中进行操作（添加工作流、更新任务等）
2. **React组件调用**: 组件调用Context提供的方法
3. **Context方法处理**: Context方法调用渲染进程服务
4. **渲染进程服务**: 通过IPC与主进程通信
5. **主进程IPC处理**: 主进程接收请求并调用相应的store方法
6. **数据持久化**: Electron Store将数据写入JSON文件到磁盘
7. **更新确认返回**: 结果从磁盘 -> Electron Store -> 主进程 -> IPC -> 渲染进程 -> Context
8. **状态更新**: Context更新内部状态
9. **UI更新**: React自动重新渲染使用该状态的组件

### 2. 数据加载流程 (读取链路)

1. **应用启动**: Electron应用启动
2. **主进程初始化**: 主进程初始化并设置IPC通道
3. **渲染进程初始化**: React应用启动，WorkflowContext提供者挂载
4. **初始数据请求**: Context useEffect触发数据加载
5. **服务层请求**: 渲染进程服务通过IPC请求数据
6. **主进程处理**: 主进程从Electron Store加载持久化数据
7. **数据读取**: Electron Store从磁盘JSON文件读取数据
8. **数据返回**: 数据从磁盘 -> Electron Store -> 主进程 -> IPC -> 渲染进程 -> Context
9. **状态初始化**: Context使用加载的数据更新状态
10. **初始UI渲染**: React组件使用加载的数据进行渲染

## 关键代码示例

### 1. Electron Store 初始化 (持久化层)

```javascript
// src/main/store/workflow.store.js
const Store = require('electron-store');

class WorkflowStore {
  constructor() {
    this.store = new Store({
      name: 'workflows', // 创建workflows.json文件
      defaults: {
        workflows: []    // 默认数据结构
      }
    });
  }
  
  // 获取所有工作流
  getAllWorkflows() {
    return this.store.get('workflows'); // 从持久化存储读取数据
  }
  
  // 添加工作流
  addWorkflow(workflow) {
    const workflows = this.getAllWorkflows();
    const newWorkflow = { ...workflow, id: workflow.id || Date.now() };
    workflows.push(newWorkflow);
    this.store.set('workflows', workflows); // 持久化到磁盘
    return newWorkflow;
  }
  
  // 更多方法...
}
```

### 2. IPC通信设置 (通信层)

```javascript
// src/main/services/ipc.service.js
const { ipcMain } = require('electron');
const workflowStore = require('../store/workflow.store');

function setupIpcHandlers() {
  // 工作流操作
  ipcMain.handle('workflow:getAll', () => {
    return workflowStore.getAllWorkflows(); // 从store获取数据并通过IPC返回
  });

  ipcMain.handle('workflow:add', (_, workflow) => {
    return workflowStore.addWorkflow(workflow); // 接收数据并传递到store
  });
  
  // 更多IPC处理函数...
}
```

### 3. 渲染进程服务 (服务层)

```javascript
// src/renderer/services/workflow.service.js
class WorkflowService {
  static async getAllWorkflows() {
    return await window.electronAPI.workflow.getAll(); // 通过IPC调用主进程
  }

  static async addWorkflow(workflow) {
    return await window.electronAPI.workflow.add(workflow); // 通过IPC发送数据
  }
  
  // 更多服务方法...
}
```

### 4. Context状态管理 (状态层)

```javascript
// src/renderer/context/WorkflowContext.jsx
export const WorkflowProvider = ({ children }) => {
  const [workflows, setWorkflows] = useState([]);
  
  // 加载数据
  const loadWorkflows = async () => {
    try {
      // 从服务层获取持久化数据
      const data = await WorkflowService.getAllWorkflows();
      setWorkflows(data || []);
    } catch (err) {
      setError(err.message);
    }
  };
  
  // 初始加载
  useEffect(() => {
    loadWorkflows(); // 应用启动时加载持久化数据
  }, []);
  
  // 添加工作流
  const addWorkflow = async (workflow) => {
    try {
      // 调用服务层，触发持久化
      const newWorkflow = await WorkflowService.addWorkflow(workflow);
      setWorkflows([...workflows, newWorkflow]); // 更新状态
      return newWorkflow;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  // 更多方法和上下文值...
}
```

## 数据持久化的好处

1. **会话间状态保持**: 应用关闭后，所有数据都会被保存，再次打开时可以恢复
2. **离线可用**: 数据存储在本地，不依赖网络
3. **快速访问**: Electron Store优化了数据读写性能
4. **自动序列化/反序列化**: JSON数据自动处理
5. **数据安全**: 可以选择加密敏感数据

## 完整链路优势

1. **职责分离**: 每一层都有明确的责任
   - UI层: 用户交互和展示
   - Context层: 状态管理
   - 服务层: 通信抽象
   - 主进程层: IPC处理
   - 存储层: 数据持久化

2. **单一数据流**: 从UI到磁盘存储再到UI形成完整的单向循环

3. **解耦合**: 每一层之间通过明确的接口通信，降低耦合度

4. **可测试性**: 每一层都可以独立测试

5. **可维护性**: 隔离关注点，使代码更易于理解和维护