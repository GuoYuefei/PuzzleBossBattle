# 消消乐游戏发布脚本使用说明

## 概述

这个发布脚本用于将消消乐游戏打包成单个HTML文件，便于部署和分发。脚本会自动：
1. 合并所有JavaScript文件
2. 压缩JavaScript代码（可选）
3. 生成包含所有资源的单个HTML文件

## 文件结构

```
PuzzleBossBattle/
├── build.py              # Python构建脚本
├── build.bat             # Windows批处理脚本
├── index.html            # 原始游戏HTML文件
├── src/js/               # JavaScript源代码
│   ├── constants.js      # 常量定义
│   ├── logSystem.js      # 日志系统
│   ├── bossSystem.js     # Boss战系统
│   ├── itemSystem.js     # 道具系统
│   ├── gameLogic.js      # 游戏逻辑
│   ├── uiRenderer.js     # UI渲染器
│   └── app.js            # 主应用程序
├── dist/                 # 构建输出目录（自动创建）
└── README_BUILD.md       # 本文件
```

## 使用方法

### Windows用户

1. **双击运行**：直接双击 `build.bat` 文件
2. **命令行运行**：
   ```cmd
   build.bat
   ```
   或
   ```cmd
   python build.py
   ```

### 所有平台（需要Python 3）

```bash
# 基本构建（包含压缩）
python build.py

# 跳过JavaScript压缩
python build.py --no-minify

# 显示帮助信息
python build.py --help
```

## 构建选项

| 选项 | 说明 |
|------|------|
| `--no-minify` 或 `-n` | 跳过JavaScript压缩，保留可读格式 |
| `--help` 或 `-h` | 显示帮助信息 |

## 输出文件

构建完成后，只生成一个HTML文件到 `dist/` 目录：

```
dist/
├── index.html          # 完整的游戏文件（单个HTML）
└── build_report_*.md   # 构建报告（可选）
```

### 文件说明

**index.html**
- 完整的游戏文件，包含所有JavaScript代码（内联）
- 可直接双击打开运行
- 适合部署到任何静态网站托管服务
- 版本哈希记录在构建报告中

## 构建过程详解

### 1. JavaScript合并
脚本按照以下顺序合并JS文件：
1. `constants.js` - 常量定义
2. `logSystem.js` - 日志系统
3. `bossSystem.js` - Boss战系统
4. `itemSystem.js` - 道具系统
5. `gameLogic.js` - 游戏逻辑
6. `uiRenderer.js` - UI渲染器
7. `app.js` - 主应用程序

### 2. JavaScript压缩（可选）
压缩过程包括：
- 移除注释（`//` 和 `/* */`）
- 移除多余的空格和换行
- 优化代码格式

**压缩效果**：约107KB → 约70KB（压缩率约35%）

### 3. HTML生成
- 移除原有的 `<script src="src/js/...">` 引用
- 将压缩后的JS代码内联到HTML中
- 保留所有CSS样式和HTML结构

## 部署说明

### 本地使用
直接双击 `dist/index.html` 即可运行游戏。

### 网站部署
将 `dist/puzzle_boss_battle_<hash>.html` 上传到：
1. **GitHub Pages**：重命名为 `index.html`
2. **Netlify/Vercel**：直接上传
3. **传统服务器**：放到网站根目录

### 更新游戏
1. 修改源代码
2. 重新运行构建脚本
3. 替换服务器上的HTML文件

## 技术细节

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

## 故障排除

### 常见问题

1. **Python未安装**
   ```
   错误: 未找到Python，请先安装Python 3.x
   ```
   解决方案：从 [python.org](https://www.python.org/downloads/) 下载安装Python 3.x

2. **文件权限问题**
   ```
   错误: 写入文件失败
   ```
   解决方案：以管理员身份运行或检查目录权限

3. **构建失败**
   ```
   错误: 合并JS文件失败
   ```
   解决方案：检查 `src/js/` 目录下的JS文件是否完整

### 手动构建步骤

如果脚本无法运行，可以手动构建：

1. 复制 `index.html` 到新文件
2. 按顺序合并所有JS文件
3. 将合并的JS代码插入到 `</body>` 标签前
4. 删除原有的 `<script>` 引用

## 联系与支持

如有问题或建议，请检查：
1. 项目文件是否完整
2. Python版本是否为3.x
3. 文件路径是否包含中文或特殊字符

构建脚本设计为简单易用，适合没有构建工具经验的使用者。

---
**最后更新**：2026年1月12日
**游戏版本**：消消乐 PuzzleBossBattle
**构建工具版本**：1.0.0