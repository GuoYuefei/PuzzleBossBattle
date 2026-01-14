# 🎮 消消乐 PuzzleBossBattle

一个有趣的消消乐游戏，包含经典模式和Boss战模式。

## ✨ 游戏特性

### 🎯 已完成功能
- 🎪 **经典模式**（30步挑战）
- 👹 **Boss战模式**（70个关卡）
- 🎁 **6种道具系统**
- 🏆 **排行榜和本地存储**
- 📝 **游戏日志系统**
- 📱 **响应式设计**

### 🎮 游戏玩法
1. 选择游戏模式
2. 点击相邻方块交换
3. 匹配3个或更多相同形状
4. 使用道具获得优势
5. 挑战Boss关卡

## 🚀 快速开始

### ⚡ 一分钟部署
```bash
# 1. 安装Python 3（如果未安装）
# 从 https://www.python.org/downloads/ 下载

# 2. 运行构建脚本
python build.py

# 3. 打开游戏
# Windows: 双击 dist/index.html
# Mac/Linux: open dist/index.html 或 xdg-open dist/index.html
```

## 🛠️ 构建脚本

### 🐍 build.py (Python构建脚本)
功能完整的构建工具：

**使用方法：**
```bash
# 基本构建（推荐 - 压缩JS）
python build.py

# 不压缩JavaScript
python build.py --no-minify

# 查看帮助
python build.py --help

# 查看版本
python build.py --version
```

**特性：**
- 🗜️ 合并所有JS文件到单个HTML
- ⚡ JavaScript压缩优化（压缩率约35%）
- 📋 生成详细的构建报告
- 🔍 版本哈希管理（基于JS内容）
- 🎯 命令行参数支持

### 📁 项目结构

```
PuzzleBossBattle/
├── README.md           # 项目文档
├── .gitignore          # Git忽略文件
├── index.html          # 主游戏文件
├── build.py            # Python构建脚本
├── src/
│   └── js/             # JavaScript源代码
│       ├── constants.js    # 游戏常量
│       ├── logSystem.js   # 日志系统
│       ├── bossSystem.js  # Boss战系统
│       ├── itemSystem.js   # 道具系统
│       ├── gameLogic.js    # 核心逻辑
│       ├── uiRenderer.js  # UI渲染
│       ├── app.js         # 主程序
│       └── pageController.js  # 页面控制器
└── dist/               # 构建输出（自动生成）
```

## 📂 文件说明

### 🔧 源代码
- `index.html` - 游戏界面和样式
- `src/js/` - 所有JavaScript代码

### 🚀 构建脚本
- `build.py` - Python构建脚本（功能完整）

### 📦 输出文件
构建后生成在 `dist/` 目录：
- `index.html` - 完整的游戏文件（单个HTML）

## 🌐 部署指南

### 🔧 GitHub Pages部署
1. 将 `dist/index.html` 重命名为 `index.html`
2. 推送到GitHub仓库
3. 在仓库设置中启用GitHub Pages

### ☁️ 其他托管服务
1. 上传 `dist/` 目录中的所有文件
2. 确保 `index.html` 在根目录
3. 访问你的网站URL

### 💡 构建选项

| 选项 | 说明 |
|------|------|
| `--no-minify` / `-n` | 跳过JavaScript压缩，保留可读格式 |
| `--help` / `-h` | 显示帮助信息 |

### ⚙️ 构建过程详解

#### 1️⃣ JavaScript合并
脚本按以下顺序合并JS文件：
1. `constants.js` - 游戏常量定义
2. `logSystem.js` - 日志系统
3. `bossSystem.js` - Boss战系统
4. `itemSystem.js` - 道具系统
5. `gameLogic.js` - 核心游戏逻辑
6. `uiRenderer.js` - UI渲染器
7. `app.js` - 主应用程序
8. `pageController.js` - 页面控制器

#### 2️⃣ JavaScript压缩（可选）
压缩内容包括：
- 移除注释（`//` 和 `/* */`）
- 移除多余的空格和换行
- 优化代码格式

**📊 压缩效果**：约126KB → 约82KB（压缩率约35%）

#### 3️⃣ HTML生成
- 移除原有的 `<script src="src/js/...">` 引用
- 将压缩后的JS代码内联到HTML中
- 保留所有CSS样式和HTML结构

## 🐛 故障排除

### ❌ 常见问题与解决方案

#### Python未安装
```
错误: 未找到Python，请先安装Python 3.x
```
**✅ 解决方案**：从 [python.org](https://www.python.org/downloads/) 下载安装Python 3.x

#### Python未正确安装
```
错误: 'python' 不是内部或外部命令，也不是可运行的程序
```
**✅ 解决方案**：
1. 确保Python已正确安装
2. 将Python添加到系统PATH环境变量
3. 或使用Python的完整路径，如：`C:\Python311\python.exe build.py`

#### 文件缺失错误
```
错误: index.html不存在 或 src/js目录不存在
```
**✅ 解决方案**：
- 确保文件结构正确
- 检查文件路径
- 确保所有必要JS文件存在

#### 构建失败
```
错误: 合并JS文件失败
```
**✅ 解决方案**：
- 检查 `src/js/` 目录下的JS文件是否完整
- 手动构建步骤：
  1. 复制 `index.html` 到新文件
  2. 按顺序合并所有JS文件
  3. 将合并的JS代码插入到 `</body>` 标签前
  4. 删除原有的 `<script>` 引用

### 🛠️ 环境要求

| 构建方式 | 要求 |
|---------|------|
| **Python构建** | Python 3.x，标准库: re, datetime, hashlib |

## 🔧 技术特性

### 📦 版本管理
每次构建都会生成唯一的版本哈希（基于JS内容），便于：
- 🔍 区分不同版本
- 🔄 缓存控制
- ↩️ 版本回滚

### 🌍 兼容性
- ✅ 支持所有现代浏览器
- 📱 响应式设计，适配移动设备
- 💾 使用localStorage保存游戏数据

### ⚡ 性能优化
- 🗂️ 内联所有资源，减少HTTP请求
- 🗜️ JavaScript压缩减少文件大小
- 🎯 按需加载的游戏资源

## 🚀 开发指南

### 🎨 自定义游戏
- 修改 `src/js/constants.js` 调整游戏参数
- 编辑 `index.html` 中的CSS样式
- 添加新的道具或Boss技能

### 🚀 高级部署
- 添加域名和SSL证书
- 配置CDN加速
- 添加分析统计

### 🎮 扩展功能
- 添加更多游戏模式
- 实现多人对战
- 添加成就系统

---

## ⚠️ 重要提示

1. **Python构建**会修改HTML文件，将JS代码内联到HTML中
2. 所有构建都会在 `dist/` 目录生成输出
3. 构建前请确保所有JS文件存在且无语法错误
4. 建议在构建前备份重要文件
5. 🎮 游戏数据保存在浏览器的localStorage中，清除浏览器数据会重置游戏进度

🎮 **祝游戏愉快！**

---
**📅 最后更新**：2026年1月14日
**🎮 游戏版本**：消消乐 PuzzleBossBattle
**🔧 构建工具版本**：1.0.0