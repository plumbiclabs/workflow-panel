 # Workflow Panel

工作流管理应用，使用Electron和React构建。

## 项目结构

```
workflow-panel/
├── electron/              # Electron配置
├── src/                   # 源代码目录
│   ├── main/              # 电子主进程
│   │   ├── services/      # 主进程服务
│   │   └── store/         # 数据存储
│   ├── renderer/          # React渲染进程
│   │   ├── components/    # UI组件
│   │   ├── containers/    # 容器组件
│   │   ├── context/       # React Context
│   │   ├── hooks/         # 自定义Hooks
│   │   ├── services/      # 渲染进程服务
│   │   ├── utils/         # 工具函数
│   │   ├── App.jsx        # 应用入口组件
│   │   └── main.jsx       # 渲染进程入口
│   └── styles/            # 全局样式
└── ...
```

## 开发指南

### 目录职责

- **components/**: 纯UI组件，专注于渲染和用户交互
- **containers/**: 容器组件，连接组件与状态
- **context/**: React上下文管理全局状态
- **hooks/**: 可复用的逻辑封装
- **services/**: 与主进程通信的服务
- **utils/**: 工具函数和辅助方法

### 工作流程

1. 定义服务层接口 (services/)
2. 实现状态管理 (context/)
3. 创建容器组件 (containers/)
4. 实现UI组件 (components/)

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式
npm run electron:dev

# 构建应用
npm run build
```