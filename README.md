# 消消乐 PuzzleBossBattle

一个有趣的消消乐游戏，包含经典模式和Boss战模式。

## 🎮 游戏特性

### ✅ 已完成功能
- 经典模式（30步挑战）
- Boss战模式（70个关卡）
- 6种道具系统
- 排行榜和本地存储
- 游戏日志系统
- 响应式设计

### 🎯 游戏玩法
1. 选择游戏模式
2. 点击相邻方块交换
3. 匹配3个或更多相同形状
4. 使用道具获得优势
5. 挑战Boss关卡

## 📦 快速开始

### 一分钟部署
#### Windows用户
1. 双击 `build.bat`
2. 打开 `dist/index.html`

#### 所有用户
```bash
# 安装Python 3（如果未安装）
# 从 https://www.python.org/downloads/ 下载

# 运行构建脚本
python build.py

# 打开游戏
# Windows: 双击 dist/index.html
# Mac/Linux: open dist/index.html 或 xdg-open dist/index.html
```

## 🛠️ 构建指南

### 可用构建脚本

#### 1. build.bat (主构建脚本 - 推荐)
这是一个交互式的批处理脚本，提供多种构建方式：

**使用方法：**
```
双击 build.bat 或运行: build.bat
```

**功能：**
- 提供菜单选择构建方式
- 自动检查环境依赖
- 支持三种构建方式：
  1. Python构建（推荐，包含JS压缩）
  2. 简单复制（不压缩，直接复制文件）
  3. PowerShell构建

#### 2. build.py (Python构建脚本)
原始的Python构建脚本，提供完整的构建功能：

**功能：**
- 合并所有JS文件到单个HTML
- JavaScript压缩优化
- 生成构建报告

**使用方法：**
```
python build.py [选项]
```

**选项：**
- `--no-minify`, `-n`: 跳过JavaScript压缩
- `--help`, `-h`: 显示帮助信息

#### 3. build.ps1 (PowerShell构建脚本)
PowerShell版本的构建脚本（已弃用，使用build.bat代替）

**功能：**
- 文件复制构建
- 生成构建报告
- 更好的错误处理

#### 4. build_simple.bat (简单复制脚本)
最简单的构建脚本，仅复制文件：

**功能：**
- 复制所有必要文件到dist目录
- 不进行任何压缩或合并

**使用方法：**
```
双击 build_simple.bat
```

### 构建方式对比

| 构建方式 | 优点 | 缺点 | 适用场景 |
|---------|------|------|----------|
| **Python构建** | 1. 合并所有JS到单个HTML<br>2. JavaScript压缩优化<br>3. 生成详细构建报告 | 需要Python环境 | 生产环境部署 |
| **简单复制** | 1. 无需额外环境<br>2. 快速简单<br>3. 保持原始文件结构 | 1. 不压缩<br>2. 文件较多 | 开发测试、快速部署 |
| **PowerShell构建** | 1. 更好的错误处理<br>2. 交互式界面<br>3. Windows原生支持 | 需要PowerShell 5.1+ | Windows环境 |

### 文件结构要求

构建脚本需要以下文件结构：
```
项目根目录/
├── index.html          # 主HTML文件
├── src/
│   └── js/
│       ├── constants.js
│       ├── logSystem.js
│       ├── bossSystem.js
│       ├── itemSystem.js
│       ├── gameLogic.js
│       ├── uiRenderer.js
│       └── app.js
├── build.bat          # 主构建脚本
├── build.py           # Python构建脚本
├── build.ps1          # PowerShell构建脚本（已弃用）
└── build_simple.bat   # 简单复制脚本
```

## 📂 文件说明

### 源代码
- `index.html` - 游戏界面和样式
- `src/js/` - 所有JavaScript代码

### 构建脚本
- `build.py` - 主构建脚本（Python）
- `build.bat` - Windows一键构建

### 输出文件
构建后生成在 `dist/` 目录：
- `index.html` - 完整的游戏文件（单个HTML）

## 🚀 部署到网站

### GitHub Pages
1. 将 `dist/index.html` 重命名为 `index.html`
2. 推送到GitHub仓库
3. 在仓库设置中启用GitHub Pages

### 其他托管服务
1. 上传 `dist/` 目录中的所有文件
2. 确保 `index.html` 在根目录
3. 访问你的网站URL

## ⚙️ 构建选项

| 选项 | 说明 |
|------|------|
| `--no-minify` 或 `-n` | 跳过JavaScript压缩，保留可读格式 |
| `--help` 或 `-h` | 显示帮助信息 |

### 构建过程详解

#### 1. JavaScript合并
脚本按照以下顺序合并JS文件：
1. `constants.js` - 常量定义
2. `logSystem.js` - 日志系统
3. `bossSystem.js` - Boss战系统
4. `itemSystem.js` - 道具系统
5. `gameLogic.js` - 游戏逻辑
6. `uiRenderer.js` - UI渲染器
7. `app.js` - 主应用程序

#### 2. JavaScript压缩（可选）
压缩过程包括：
- 移除注释（`//` 和 `/* */`）
- 移除多余的空格和换行
- 优化代码格式

**压缩效果**：约107KB → 约70KB（压缩率约35%）

#### 3. HTML生成
- 移除原有的 `<script src="src/js/...">` 引用
- 将压缩后的JS代码内联到HTML中
- 保留所有CSS样式和HTML结构

## 🐛 故障排除

### 常见问题

#### 1. Python未安装
```
错误: 未找到Python，请先安装Python 3.x
```
解决方案：从 [python.org](https://www.python.org/downloads/) 下载安装Python 3.x

#### 2. PowerShell执行策略限制
```
错误: PowerShell脚本无法运行
```
解决方案：
- 以管理员身份运行PowerShell
- 执行: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- 或使用其他构建方式

#### 3. 文件缺失错误
```
错误: index.html不存在 或 src/js目录不存在
```
解决方案：
- 确保文件结构正确
- 检查文件路径
- 确保所有必要JS文件存在

#### 4. 构建失败
```
错误: 合并JS文件失败
```
解决方案：
- 检查 `src/js/` 目录下的JS文件是否完整
- 手动构建步骤：
  1. 复制 `index.html` 到新文件
  2. 按顺序合并所有JS文件
  3. 将合并的JS代码插入到 `</body>` 标签前
  4. 删除原有的 `<script>` 引用

### 环境要求

#### Python构建：
- Python 3.x
- 标准库: re, datetime, hashlib

#### PowerShell构建：
- PowerShell 5.1+
- Windows 7+

#### 简单复制：
- Windows批处理支持
- 无额外要求

## 🔧 技术细节

### 版本管理
每次构建都会生成唯一的版本哈希（基于JS内容），便于：
- 区分不同版本
- 缓存控制
- 版本回滚

### 兼容性
- 支持所有现代浏览器
- 响应式设计，适配移动设备
- 使用localStorage保存游戏数据

### 性能优化
- 内联所有资源，减少HTTP请求
- JavaScript压缩减少文件大小
- 按需加载的游戏资源

## 🎯 下一步

### 自定义游戏
- 修改 `src/js/constants.js` 调整游戏参数
- 编辑 `index.html` 中的CSS样式
- 添加新的道具或Boss技能

### 高级部署
- 添加域名和SSL证书
- 配置CDN加速
- 添加分析统计

### 扩展功能
- 添加更多游戏模式
- 实现多人对战
- 添加成就系统

---

## 📋 注意事项

1. **Python构建**会修改HTML文件，将JS代码内联到HTML中
2. **简单复制**保持原始文件结构，适合直接部署
3. 所有构建都会在 `dist/` 目录生成输出
4. 构建前请确保所有JS文件存在且无语法错误
5. 建议在构建前备份重要文件
6. 游戏数据保存在浏览器的localStorage中，清除浏览器数据会重置游戏进度

**提示**：build.ps1 已被 build.bat 替代，建议使用 build.bat 脚本。

**祝游戏愉快！** 🎮

---
**最后更新**：2026年1月12日
**游戏版本**：消消乐 PuzzleBossBattle
**构建工具版本**：1.0.0