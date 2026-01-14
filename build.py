#!/usr/bin/env python3
"""
PuzzleBossBattle 构建脚本
将多个JS文件合并并内联到HTML中，生成单个可部署文件

使用方法：
    python build.py                    # 默认构建（压缩JS）
    python build.py --no-minify        # 不压缩JS
    python build.py --help             # 显示帮助信息
"""

import os
import re
import sys
import argparse
import datetime
import hashlib
from pathlib import Path

# 版本信息
VERSION = "1.0.0"
AUTHOR = "PuzzleBossBattle Team"

# JS文件合并顺序
JS_FILES = [
    "src/js/constants.js",
    "src/js/logSystem.js",
    "src/js/bossSystem.js",
    "src/js/itemSystem.js",
    "src/js/gameLogic.js",
    "src/js/uiRenderer.js",
    "src/js/app.js",
    "src/js/pageController.js"
]

def parse_arguments():
    """解析命令行参数"""
    parser = argparse.ArgumentParser(
        description="PuzzleBossBattle 构建脚本 - 合并JS文件到HTML",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python build.py                    # 默认构建（压缩JS）
  python build.py --no-minify        # 不压缩JS
  python build.py --help             # 显示帮助信息
        """
    )

    parser.add_argument(
        "--no-minify", "-n",
        action="store_true",
        help="跳过JavaScript压缩，保留可读格式"
    )

    parser.add_argument(
        "--version", "-v",
        action="version",
        version=f"PuzzleBossBattle 构建脚本 v{VERSION}"
    )

    return parser.parse_args()

def read_file(file_path):
    """读取文件内容"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"[错误] 文件不存在: {file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"[错误] 读取文件失败 {file_path}: {e}")
        sys.exit(1)

def write_file(file_path, content):
    """写入文件内容"""
    try:
        # 确保目录存在
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"[错误] 写入文件失败 {file_path}: {e}")
        return False

def minify_js(js_code):
    """简单的JavaScript压缩"""
    if not js_code:
        return js_code

    # 移除单行注释
    js_code = re.sub(r'//.*', '', js_code)

    # 移除多行注释
    js_code = re.sub(r'/\*[\s\S]*?\*/', '', js_code)

    # 移除多余的空格和换行
    # 保留必要的空格（如 var a = 1;）
    lines = js_code.split('\n')
    cleaned_lines = []

    for line in lines:
        line = line.strip()
        if line:  # 跳过空行
            # 移除行尾分号后的空格
            line = re.sub(r';\s*', ';', line)
            # 移除赋值操作符周围的空格
            line = re.sub(r'\s*=\s*', '=', line)
            line = re.sub(r'\s*\+\s*', '+', line)
            line = re.sub(r'\s*-\s*', '-', line)
            line = re.sub(r'\s*\*\s*', '*', line)
            line = re.sub(r'\s*/\s*', '/', line)
            line = re.sub(r'\s*,\s*', ',', line)
            line = re.sub(r'\s*:\s*', ':', line)
            line = re.sub(r'\s*{\s*', '{', line)
            line = re.sub(r'\s*}\s*', '}', line)
            line = re.sub(r'\s*\(\s*', '(', line)
            line = re.sub(r'\s*\)\s*', ')', line)
            cleaned_lines.append(line)

    return ' '.join(cleaned_lines)

def merge_js_files(js_files, minify=True):
    """合并JS文件"""
    print("📦 开始合并JavaScript文件...")

    all_js_content = []
    total_size = 0

    for js_file in js_files:
        if not os.path.exists(js_file):
            print(f"[错误] JS文件不存在: {js_file}")
            sys.exit(1)

        content = read_file(js_file)
        file_size = len(content.encode('utf-8'))
        total_size += file_size

        print(f"  📄 {js_file} ({file_size:,} 字节)")
        all_js_content.append(content)

    merged_js = '\n\n'.join(all_js_content)

    if minify:
        print("🗜️  压缩JavaScript代码...")
        original_size = len(merged_js.encode('utf-8'))
        merged_js = minify_js(merged_js)
        compressed_size = len(merged_js.encode('utf-8'))

        if original_size > 0:
            compression_rate = (1 - compressed_size / original_size) * 100
            print(f"  📊 压缩率: {compression_rate:.1f}% ({original_size:,} → {compressed_size:,} 字节)")

    return merged_js, total_size

def generate_version_hash(js_content):
    """生成版本哈希"""
    hash_obj = hashlib.md5(js_content.encode('utf-8'))
    return hash_obj.hexdigest()[:8]

def build_html_template(html_content, js_content, version_hash, build_info):
    """构建最终的HTML文件"""
    print("🔧 构建HTML文件...")

    # 移除原有的script标签
    script_pattern = r'<script src="src/js/[^"]+"></script>\s*'
    html_content = re.sub(script_pattern, '', html_content)

    # 在</body>标签前插入内联的JS代码
    js_comment = f"""
<!--
==========================================
PuzzleBossBattle - 构建版本: {version_hash}
构建时间: {build_info['timestamp']}
构建方式: {build_info['build_type']}
文件大小: {build_info['js_size']:,} 字节
==========================================
-->
<script>
{js_content}
</script>
"""

    # 插入到</body>标签前
    if '</body>' in html_content:
        html_content = html_content.replace('</body>', js_comment + '\n</body>')
    else:
        # 如果没有找到</body>标签，添加到文件末尾
        html_content += js_comment

    return html_content

def generate_build_report(args, js_size, version_hash, output_path):
    """生成构建报告"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    build_type = "压缩构建" if not args.no_minify else "非压缩构建"

    report = f"""
==========================================
🎮 PuzzleBossBattle 构建报告
==========================================
📅 构建时间: {timestamp}
🔧 构建方式: {build_type}
📦 版本哈希: {version_hash}
📊 JS文件大小: {js_size:,} 字节
📁 输出文件: {output_path}
==========================================
✅ 构建成功！

使用方法:
1. 直接打开 {output_path} 文件
2. 或部署到Web服务器

💡 提示:
- 构建版本已包含在HTML注释中
- 版本哈希用于区分不同构建版本
- 建议在生产环境使用压缩构建
==========================================
"""

    return report

def main():
    """主函数"""
    print(f"""
PuzzleBossBattle 构建脚本 v{VERSION}
==========================================
    """)

    # 解析参数
    args = parse_arguments()

    # 检查必要文件
    if not os.path.exists("index.html"):
        print("[错误] index.html 文件不存在")
        sys.exit(1)

    if not os.path.exists("src/js"):
        print("[错误] src/js 目录不存在")
        sys.exit(1)

    # 读取HTML文件
    print("📄 读取HTML文件...")
    html_content = read_file("index.html")

    # 合并JS文件
    merged_js, js_size = merge_js_files(JS_FILES, minify=not args.no_minify)

    # 生成版本哈希
    version_hash = generate_version_hash(merged_js)

    # 构建信息
    build_info = {
        'timestamp': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'build_type': "压缩构建" if not args.no_minify else "非压缩构建",
        'js_size': js_size
    }

    # 构建HTML
    final_html = build_html_template(html_content, merged_js, version_hash, build_info)

    # 输出文件
    output_dir = "dist"
    output_path = os.path.join(output_dir, "index.html")

    print(f"💾 保存到: {output_path}")
    if write_file(output_path, final_html):
        # 生成构建报告
        report = generate_build_report(args, js_size, version_hash, output_path)
        print(report)

        # 显示文件大小
        output_size = len(final_html.encode('utf-8'))
        print(f"📊 最终文件大小: {output_size:,} 字节")

        # 显示完成信息
        print("""
🎉 构建完成！
==========================================
现在你可以:
1. 直接打开 dist/index.html 文件玩游戏
2. 部署到GitHub Pages或其他Web服务器
3. 分享给朋友一起玩！

🎮 祝游戏愉快！
==========================================
        """)
    else:
        print("[错误] 构建失败！")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[警告] 构建被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n[错误] 构建过程中发生错误: {e}")
        sys.exit(1)