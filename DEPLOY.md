# HomeCookHub 部署文档

本文档详细介绍了如何使用 Docker 将 HomeCookHub 部署到云服务器上。

## 📋 准备工作

1. **云服务器**：一台安装了 Linux (Ubuntu/CentOS) 的服务器。
2. **环境依赖**：
   - [Docker](https://docs.docker.com/get-docker/)
   - [Docker Compose](https://docs.docker.com/compose/install/) (可选，推荐)
   - [Git](https://git-scm.com/downloads)
3. **Supabase 配置**：你需要准备好你的 Supabase Project URL 和 Anon Key。

---

## 🚀 部署步骤

### 1. 获取代码

登录到你的服务器，克隆项目代码：

```bash
git clone https://github.com/your-repo/homecookhub.git
cd homecookhub
```

### 2. 配置环境变量

在项目根目录下创建一个 `.env` 文件，用于存放构建时需要的环境变量。

```bash
nano .env
```

在该文件中填入你的 Supabase 信息和天气 API Key：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_WEATHER_KEY=your-amap-weather-key
```

> ⚠️ **注意**：由于本项目是基于 Vite 的纯前端项目，环境变量是在**构建阶段 (Build Time)** 注入到代码中的。如果你后续修改了 `.env` 文件，必须重新构建镜像才能生效。

### 3. 方式一：使用 Docker Compose (推荐)

我们提供了 `docker-compose.yml` 文件，这是最简单的部署方式。

#### 3.1 构建并启动

```bash
# 构建镜像并后台启动容器
docker-compose up -d --build
```

#### 3.2 验证部署

启动成功后，访问服务器的 8080 端口：
`http://<你的服务器IP>:8080`

#### 3.3 常用命令

```bash
# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 更新代码后重新部署
git pull
docker-compose up -d --build
```

---

### 4. 方式二：使用 Docker 原生命令

如果你不想使用 Docker Compose，也可以直接使用 Docker 命令。

#### 4.1 构建镜像

需要通过 `--build-arg` 传入环境变量：

```bash
# 请替换为你实际的 URL 和 Key，或者确保 .env 文件存在并使用 export 加载
export $(cat .env | xargs)

docker build \
  --build-arg VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
  --build-arg VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
  --build-arg VITE_WEATHER_KEY=$VITE_WEATHER_KEY \
  -t homecookhub .
```

#### 4.2 启动容器

```bash
docker run -d \
  --name homecookhub \
  -p 8080:80 \
  --restart always \
  homecookhub
```

访问 `http://<你的服务器IP>:8080` 即可看到应用。

---

## 🍎 Mac M1/M2/M3 用户特别说明 (跨平台构建)

如果你是在 **Apple Silicon (M1/M2/M3)** 芯片的 Mac 上构建镜像，并打算部署到 **普通的 Linux 服务器 (x86_64/amd64)**，你**必须**指定目标平台，否则构建出的镜像在服务器上无法运行（会报错 `exec format error`）。

### 方式一：使用 Docker Compose (构建时)

修改 `docker-compose.yml`，在 `app` 服务下添加 `platform` 字段：

```yaml
services:
  app:
    platform: linux/amd64  # <--- 添加这行
    build:
      # ...
```

然后正常运行 `docker-compose build` 即可。

### 方式二：使用 Docker Buildx (推荐)

使用 `--platform` 参数进行构建：

```bash
# 确保先加载环境变量
export $(cat .env | xargs)

docker buildx build --platform linux/amd64 \
  --build-arg VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
  --build-arg VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
  --build-arg VITE_WEATHER_KEY=$VITE_WEATHER_KEY \
  -t homecookhub-x86 . --load
```

> 注意：跨平台构建速度会比本地构建慢很多，因为涉及指令集转译。

---

## 🔧 高级配置

### 修改端口

默认配置将容器内的 80 端口映射到宿主机的 `8080` 端口。如果你想使用默认的 HTTP 端口 (80)，请修改 `docker-compose.yml`：

```yaml
ports:
  - "80:80"
```

或者在 `docker run` 命令中使用 `-p 80:80`。

### 配置域名与 HTTPS (Nginx 反向代理)

生产环境中，建议在 Docker 容器外层再加一层 Nginx 反向代理，用于配置域名和 SSL 证书。

宿主机 Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## ❓ 常见问题排查

**Q: 页面加载白屏，控制台报错 404**
A: 检查 `nginx.conf` 是否正确配置了 `try_files $uri $uri/ /index.html;`，这是 SPA 应用路由必须的配置。我们提供的镜像已包含此配置。

**Q: Supabase 连接失败**
A: 请检查构建镜像时是否正确传入了 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。你可以进入容器内部检查构建后的文件（比较困难，因为代码被压缩了），最简单的验证方法是重新检查 `.env` 并重新构建。
