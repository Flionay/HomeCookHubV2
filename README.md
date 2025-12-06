# HomeCookHub (家庭点餐系统)

HomeCookHub 是一个集食材管理、菜谱记录与 AI 智能推荐于一体的现代化家庭厨房助手。它旨在解决“今天吃什么”、“冰箱里还有什么”以及“怎么做”的日常难题，通过数字化管理提升烹饪乐趣与效率。

## ✨ 核心功能

### 1. 🥦 食材库存管理 (Inventory Management)
- **全方位记录**：录入食材名称、数量、单位、分类及存放位置（冰箱冷藏/冷冻/常温）。
- **有效期提醒**：支持录入过期时间，系统自动提示临期食材，减少浪费。
- **快速消耗**：烹饪完成后可快速扣减库存。

### 2. 📖 家庭拿手菜谱库 (Family Recipe Book)
- **专属菜单**：记录家庭常做的拿手菜，支持上传图片或 AI 生成配图。
- **个性化标签**：记录“掌勺大厨”（爸爸/妈妈等）、口味（辣/清淡）、类型（荤/素/汤）。
- **评价系统**：家庭成员可对菜品打分和评论，标记“最爱”菜肴。

### 3. 🤖 AI 智能主厨 (AI Chef)
- **智能推荐**：
  - **基于库存**：分析冰箱现有食材，推荐可烹饪的菜肴。
  - **基于历史**：根据家庭饮食习惯，推荐许久未吃或高评分的菜品。
- **自由点餐**：输入口味、人数、主厨，自动生成三菜一汤等完整菜单。
- **详细指导**：生成详细的烹饪步骤及缺失食材提醒。
- **灵活配置**：支持自定义 OpenAI 兼容接口（API URL & Key）。

### 4. 📊 数据看板 (Dashboard)
- **库存预警**：直观展示临期或短缺的食材。
- **烹饪统计**：统计本周/本月做饭次数及“最常做的菜”。

## 🛠️ 技术栈

- **前端框架**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **UI 组件库**: [Tailwind CSS](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/)
- **路由管理**: React Router
- **后端/数据库**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage)
- **AI 集成**: OpenAI Compatible API

## 🚀 快速开始

### 前置要求
- Node.js (v18+)
- 一个 Supabase 项目 (获取 URL 和 Anon Key)

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-repo/homecookhub.git
   cd homecookhub
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   复制 `.env` 文件模版（如果有）或新建 `.env` 文件，填入 Supabase 配置：
   ```env
   VITE_SUPABASE_URL=你的_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY=你的_SUPABASE_ANON_KEY
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **构建生产版本**
   ```bash
   npm run build
   ```

## 📂 项目结构

```
src/
├── components/   # 通用组件 (购物车, 布局等)
├── context/      # 全局状态 (AppContext)
├── hooks/        # 自定义 Hooks
├── pages/        # 页面组件 (仪表盘, 库存, 菜谱, AI主厨等)
├── assets/       # 静态资源
└── supabaseClient.js # Supabase 客户端配置
```

## 📄 许可证

MIT License
