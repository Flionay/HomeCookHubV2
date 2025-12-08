# HomeCookHub 部署文档 (Production)

本文档详细介绍了如何使用 Docker 和 Docker Compose 将 HomeCookHub (前后端分离版) 部署到生产环境。

## 📋 架构说明

*   **Frontend**: React (Vite) + Nginx (Port 80)
*   **Backend**: FastAPI (Python 3.10) (Port 8000, internal)
*   **Database**: SQLite (持久化存储)
*   **Communication**: Nginx 反向代理 `/api` 请求到 Backend。

## 🛠️ 准备工作

1.  **服务器**: Linux (Ubuntu/CentOS/Debian)
2.  **环境**:
    *   [Docker](https://docs.docker.com/get-docker/)
    *   [Docker Compose](https://docs.docker.com/compose/install/)
3.  **API Key**: 高德地图 API Key (用于天气功能)。

---

## 🚀 部署步骤

### 1. 获取代码

```bash
git clone https://github.com/your-repo/homecookhub.git
cd homecookhub
```

### 2. 配置环境变量

在项目根目录下创建 `.env` 文件。

```bash
nano .env
```

写入以下内容：

```env
# 高德地图天气 Key (必须)
VITE_WEATHER_KEY=your_amap_weather_key
```

### 3. 启动服务

使用 Docker Compose 一键构建并启动：

```bash
docker-compose up -d --build
```

此命令会：
1.  构建 Backend 镜像 (安装依赖)。
2.  构建 Frontend 镜像 (npm install & build)。
3.  启动 Backend 容器 (挂载数据卷 `backend_data` 和 `backend_static`)。
4.  启动 Frontend (Nginx) 容器，并配置反向代理。

### 4. 验证部署

访问你的服务器 IP 或域名：

*   **URL**: `http://<your-server-ip>`
*   **API Check**: `http://<your-server-ip>/users` (应返回 JSON 或 401)

### 5. 数据持久化

*   **数据库**: SQLite 文件存储在 Docker Volume `backend_data` 中，映射到容器内的 `/app/data/homecook.db`。
*   **图片**: 生成的图片存储在 Docker Volume `backend_static` 中。

即使删除容器 (`docker-compose down`)，数据卷依然保留。如果需要彻底清除数据：
```bash
docker-compose down -v
```

### 6. 更新部署

代码更新后：

```bash
git pull
docker-compose up -d --build
```

---

## 📁 文件结构说明

*   `docker-compose.yml`: 定义前后端服务编排。
*   `nginx.conf`: Nginx 配置文件，处理静态文件服务和 API 反向代理。
*   `backend/Dockerfile`: 后端构建文件。
*   `Dockerfile`: 前端构建文件 (Multi-stage build)。
*   `backend/requirements.txt`: 后端依赖。

## ⚠️ 注意事项

*   **生产环境安全**: 请确保 `.env` 文件不被提交到版本控制。
*   **端口**: 默认占用宿主机 80 端口。如需修改，编辑 `docker-compose.yml` 中的 `ports` 映射 (例如 `"8080:80"`).
*   **SECRET_KEY**: `backend/auth.py` 中的 `SECRET_KEY` 目前是硬编码的。生产环境建议将其改为从环境变量读取。

### 修改 SECRET_KEY (推荐)

1. 修改 `backend/auth.py`:
   ```python
   SECRET_KEY = os.getenv("SECRET_KEY", "your-fallback-secret")
   ```
2. 在 `docker-compose.yml` 的 `backend` environment 中添加:
   ```yaml
   - SECRET_KEY=your_strong_random_secret_key
   ```
