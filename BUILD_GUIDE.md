# 消消乐游戏构建指南

## 可用构建脚本

### 1. build.bat (主构建脚本 - 推荐)
这是一个交互式的批处理脚本，提供多种构建方式：

**使用方法：**
```
双击 build.bat 或运行: build.bat
```

**功能：**
- 提供菜单选择构建方式
- 自动检查环境依赖
- 支持三种构建方式：
  1. Python构建 (推荐，包含JS压缩)
  2. 简单复制 (不压缩，直接复制文件)
  3. PowerShell构建

### 2. build.py (Python构建脚本)
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

### 3. build.ps1 (PowerShell构建脚本)
PowerShell版本的构建脚本：

**功能：**
- 文件复制构建
- 生成构建报告
- 更好的错误处理

**使用方法：**
```
右键点击 build.ps1 -> "使用PowerShell运行"
或
powershell -ExecutionPolicy Bypass -File "build.ps1"
```

### 4. build_simple.bat (简单复制脚本)
最简单的构建脚本，仅复制文件：

**功能：**
- 复制所有必要文件到dist目录
- 不进行任何压缩或合并

**使用方法：**
```
双击 build_simple.bat
```

## 构建方式对比

| 构建方式 | 优点 | 缺点 | 适用场景 |
|---------|------|------|----------|
| **Python构建** | 1. 合并所有JS到单个HTML<br>2. JavaScript压缩优化<br>3. 生成详细构建报告 | 需要Python环境 | 生产环境部署 |
| **简单复制** | 1. 无需额外环境<br>2. 快速简单<br>3. 保持原始文件结构 | 1. 不压缩<br>2. 文件较多 | 开发测试、快速部署 |
| **PowerShell构建** | 1. 更好的错误处理<br>2. 交互式界面<br>3. Windows原生支持 | 需要PowerShell 5.1+ | Windows环境 |

## 文件结构要求

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
├── build.ps1          # PowerShell构建脚本
└── build_simple.bat   # 简单复制脚本
```

## 常见问题解决

### 1. Python构建失败
**问题：** "未找到Python" 或 "Python无法正常运行"
**解决：**
- 安装Python 3.x: https://www.python.org/downloads/
- 安装时勾选 "Add Python to PATH"
- 或使用其他构建方式（简单复制或PowerShell）

### 2. PowerShell执行策略限制
**问题：** PowerShell脚本无法运行
**解决：**
- 以管理员身份运行PowerShell
- 执行: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- 或使用其他构建方式

### 3. 文件缺失错误
**问题：** "index.html不存在" 或 "src/js目录不存在"
**解决：**
- 确保文件结构正确
- 检查文件路径
- 确保所有必要JS文件存在

### 4. 构建输出
所有构建方式都会在 `dist/` 目录生成输出：
- `index.html`: 游戏主文件
- `src/js/`: JavaScript文件（简单复制方式）
- `build_report.txt`: 构建报告

## 快速开始

### 对于大多数用户：
1. 双击 `build.bat`
2. 选择构建方式（推荐选择2或3如果Python不可用）
3. 按照提示操作

### 对于开发者：
```bash
# 使用Python构建（压缩）
python build.py

# 使用Python构建（不压缩）
python build.py --no-minify

# 使用PowerShell构建
powershell -ExecutionPolicy Bypass -File "build.ps1"
```

### 最简单的方式：
双击 `build_simple.bat`

## 环境要求

### Python构建：
- Python 3.x
- 标准库: re, datetime, hashlib

### PowerShell构建：
- PowerShell 5.1+
- Windows 7+

### 简单复制：
- Windows批处理支持
- 无额外要求

## 注意事项

1. **Python构建**会修改HTML文件，将JS代码内联到HTML中
2. **简单复制**保持原始文件结构，适合直接部署
3. 所有构建都会在 `dist/` 目录生成输出
4. 构建前请确保所有JS文件存在且无语法错误
5. 建议在构建前备份重要文件