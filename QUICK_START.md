# 快速开始指南

## 一分钟部署

### Windows用户
1. 双击 `build.bat`
2. 打开 `dist/index.html`

### 所有用户
```bash
# 安装Python 3（如果未安装）
# 从 https://www.python.org/downloads/ 下载

# 运行构建脚本
python build.py

# 打开游戏
# Windows: 双击 dist/index.html
# Mac/Linux: open dist/index.html 或 xdg-open dist/index.html
```

## 文件说明

### 源代码
- `index.html` - 游戏界面和样式
- `src/js/` - 所有JavaScript代码

### 构建脚本
- `build.py` - 主构建脚本（Python）
- `build.bat` - Windows一键构建

### 输出文件
构建后生成在 `dist/` 目录：
- `index.html` - 完整的游戏文件（单个HTML）

## 部署到网站

### GitHub Pages
1. 将 `dist/index.html` 重命名为 `index.html`
2. 推送到GitHub仓库
3. 在仓库设置中启用GitHub Pages

### 其他托管服务
1. 上传 `dist/` 目录中的所有文件
2. 确保 `index.html` 在根目录
3. 访问你的网站URL

## 游戏特性

✅ 已完成的功能：
- 经典模式（30步挑战）
- Boss战模式（70个关卡）
- 6种道具系统
- 排行榜和本地存储
- 游戏日志系统
- 响应式设计

🎮 游戏玩法：
1. 选择游戏模式
2. 点击相邻方块交换
3. 匹配3个或更多相同形状
4. 使用道具获得优势
5. 挑战Boss关卡

## 技术支持

### 测试构建脚本
```bash
# 运行测试脚本
bash test.sh

# 或手动检查
python simple_test.py
```

### 常见问题
1. **游戏无法运行**：检查浏览器控制台错误
2. **构建失败**：确保所有JS文件存在
3. **显示异常**：清除浏览器缓存

### 手动调试
如果构建脚本有问题，可以：
1. 手动合并 `src/js/` 中的所有 `.js` 文件
2. 将合并的代码插入到 `index.html` 的 `</body>` 前
3. 删除原有的 `<script src="src/js/...">` 标签

## 下一步

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
**提示**：游戏数据保存在浏览器的localStorage中，清除浏览器数据会重置游戏进度。

**祝游戏愉快！** 🎮