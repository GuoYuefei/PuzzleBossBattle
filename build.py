#!/usr/bin/env python3
"""
消消乐游戏发布脚本
将多个JavaScript文件合并压缩，并生成单个HTML文件
"""

import os
import re
import sys
from datetime import datetime
import hashlib

class GameBuilder:
    def __init__(self, project_root):
        self.project_root = project_root
        self.src_js_dir = os.path.join(project_root, 'src', 'js')
        self.index_html = os.path.join(project_root, 'index.html')
        self.output_dir = os.path.join(project_root, 'dist')

        # 检查是分文件还是单文件
        self.is_single_file = not os.path.exists(self.src_js_dir)

        if self.is_single_file:
            # 单文件模式：从index.html中提取JavaScript
            print("检测到单文件结构，从index.html提取JavaScript")
            self.js_files_order = ['index.js']
        else:
            # 分文件模式：按照index.html中的顺序
            print("检测到分文件结构，合并src/js目录下的文件")
            self.js_files_order = [
                'constants.js',
                'logSystem.js',
                'bossSystem.js',
                'itemSystem.js',
                'gameLogic.js',
                'uiRenderer.js',
                'app.js'
            ]

        # 创建输出目录
        os.makedirs(self.output_dir, exist_ok=True)

    def read_file(self, filepath):
        """读取文件内容"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            print(f"错误: 文件不存在: {filepath}")
            return None
        except Exception as e:
            print(f"错误: 读取文件失败 {filepath}: {e}")
            return None

    def write_file(self, filepath, content):
        """写入文件内容"""
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[OK] 写入文件: {filepath}")
        except Exception as e:
            print(f"错误: 写入文件失败 {filepath}: {e}")

    def minify_js(self, js_content):
        """安全的JavaScript压缩"""
        # 移除单行注释
        js_content = re.sub(r'//.*', '', js_content)

        # 移除多行注释（但要保留内容中的空格以避免粘连）
        js_content = re.sub(r'/\*\s*([\s\S]*?)\s*\*/', '', js_content)

        # 在运算符前后保留单个空格（避免粘连）
        js_content = re.sub(r'\s*([+\-*/%&|^<>!=?:,{}()])\s*', r' \1 ', js_content)

        # 在逗号后保留空格
        js_content = re.sub(r',\s*', ', ', js_content)

        # 在分号后移除空格（除了for语句中）
        js_content = re.sub(r';\s*(?!for\s*\([^;]*;[^;]*;)', ';', js_content)

        # 在花括号前后保留空格
        js_content = re.sub(r'\s*{\s*', ' { ', js_content)
        js_content = re.sub(r'\s*}\s*', ' } ', js_content)

        # 在return语句后保留空格
        js_content = re.sub(r'return\s+', 'return ', js_content)

        # 保留关键字周围的空格
        js_content = re.sub(r'\bfunction\s+', 'function ', js_content)
        js_content = re.sub(r'\bclass\s+', 'class ', js_content)
        js_content = re.sub(r'\bconst\s+', 'const ', js_content)
        js_content = re.sub(r'\blet\s+', 'let ', js_content)
        js_content = re.sub(r'\bvar\s+', 'var ', js_content)
        js_content = re.sub(r'\bif\s+', 'if ', js_content)
        js_content = re.sub(r'\belse\s+', 'else ', js_content)
        js_content = re.sub(r'\bfor\s+', 'for ', js_content)
        js_content = re.sub(r'\bwhile\s+', 'while ', js_content)
        js_content = re.sub(r'\bswitch\s+', 'switch ', js_content)
        js_content = re.sub(r'\bcase\s+', 'case ', js_content)
        js_content = re.sub(r'\btry\s+', 'try ', js_content)
        js_content = re.sub(r'\bcatch\s+', 'catch ', js_content)
        js_content = re.sub(r'\bfinally\s+', 'finally ', js_content)
        js_content = re.sub(r'\bthrow\s+', 'throw ', js_content)
        js_content = re.sub(r'\bnew\s+', 'new ', js_content)
        js_content = re.sub(r'\btypeof\s+', 'typeof ', js_content)
        js_content = re.sub(r'\binstanceof\s+', 'instanceof ', js_content)

        # 移除多余空格（保留单词之间必要的空格）
        js_content = re.sub(r'\s+', ' ', js_content).strip()

        # 确保语句末尾有分号
        js_content = re.sub(r'([^;\}\]])\s*$', r'\1;', js_content, flags=re.MULTILINE)

        # 确保window赋值语句不会被破坏
        js_content = re.sub(r'window\.\w+\s*=\s*\w+\s*;', lambda m: m.group(0).replace(' ', ''), js_content)

        return js_content

    def merge_js_files(self):
        """合并所有JavaScript文件"""
        print("正在合并JavaScript文件...")

        merged_js = []
        total_size = 0

        if self.is_single_file:
            # 单文件模式：从index.html中提取script标签内容
            html_content = self.read_file(self.index_html)
            if not html_content:
                return None

            # 提取<script>标签中的JavaScript代码
            import re
            script_pattern = r'<script[^>]*>(.*?)</script>'
            scripts = re.findall(script_pattern, html_content, re.DOTALL)

            for i, script_content in enumerate(scripts):
                # 清理script内容
                script_content = script_content.strip()
                if script_content:  # 只添加非空的script
                    merged_js.append(f'\n// ===== Script {i+1} =====\n')
                    merged_js.append(script_content)
                    total_size += len(script_content)
                    print(f"  [OK] 提取: Script {i+1} ({len(script_content)} 字节)")
        else:
            # 分文件模式：合并各个JS文件，同时提取index.html中的内联script标签
            # 1. 首先合并src/js目录下的文件
            for js_file in self.js_files_order:
                filepath = os.path.join(self.src_js_dir, js_file)
                content = self.read_file(filepath)

                if content:
                    # 添加文件分隔注释
                    merged_js.append(f'\n// ===== {js_file} =====\n')
                    merged_js.append(content)
                    total_size += len(content)
                    print(f"  [OK] 添加: {js_file} ({len(content)} 字节)")
                else:
                    print(f"  [ERROR] 跳过: {js_file} (读取失败)")

            # 2. 提取index.html中的内联script标签内容
            html_content = self.read_file(self.index_html)
            if html_content:
                import re
                script_pattern = r'<script[^>]*>(.*?)</script>'
                scripts = re.findall(script_pattern, html_content, re.DOTALL)

                for i, script_content in enumerate(scripts):
                    script_content = script_content.strip()
                    if script_content:
                        merged_js.append(f'\n// ===== Inline Script {i+1} from index.html =====\n')
                        merged_js.append(script_content)
                        total_size += len(script_content)
                        print(f"  [OK] 提取: Inline Script {i+1} ({len(script_content)} 字节)")

        merged_content = '\n'.join(merged_js)
        print(f"[OK] 合并完成: {len(merged_js)} 个代码块, 总计 {total_size} 字节")

        return merged_content

    def compress_js(self, js_content):
        """压缩JavaScript代码"""
        print("正在压缩JavaScript代码...")

        original_size = len(js_content)
        compressed = self.minify_js(js_content)
        compressed_size = len(compressed)

        compression_rate = (1 - compressed_size / original_size) * 100

        print(f"[OK] 压缩完成: {original_size} → {compressed_size} 字节 (压缩率: {compression_rate:.1f}%)")

        return compressed

    def minify_css(self, css_content):
        """简单的CSS压缩"""
        # 移除注释
        css_content = re.sub(r'/\*[\s\S]*?\*/', '', css_content)

        # 移除多余的空格和换行
        css_content = re.sub(r'\s+', ' ', css_content)
        css_content = re.sub(r'\s*([=+\-*/%&|^<>!?:;,{}()\[\]#>~])\s*', r'\1', css_content)

        # 移除选择器之间的多余空格
        css_content = re.sub(r'\s*([>+~])\s*', r'\1', css_content)

        # 移除规则块前后的空格
        css_content = re.sub(r'\s*{\s*', ' {', css_content)
        css_content = re.sub(r'\s*}\s*', '}', css_content)

        # 移除属性值之间的多余空格
        css_content = re.sub(r';\s+', ';', css_content)

        # 移除规则块内的多余空格（保留属性值内的空格）
        css_content = re.sub(r'([:;])\s+', r'\1', css_content)

        return css_content.strip()

    def minify_html(self, html_content):
        """简单的HTML压缩"""
        # 移除HTML注释
        html_content = re.sub(r'<!--[\s\S]*?-->', '', html_content)

        # 移除多余的空格和换行（保留标签内的空格）
        html_content = re.sub(r'>\s+<', '><', html_content)
        html_content = re.sub(r'\s+\n\s*', '\n', html_content)
        html_content = re.sub(r'\n\s+', '\n', html_content)

        # 移除标签属性前的多余空格
        html_content = re.sub(r'\s+([=])', r' \1', html_content)
        html_content = re.sub(r'(["\'])\s+', r'\1', html_content)
        html_content = re.sub(r'\s+(["\'])', r'\1', html_content)

        return html_content.strip()

    def generate_single_html(self, js_content, minify_css=True, minify_html=True):
        """生成单个HTML文件"""
        print("正在生成单个HTML文件...")

        # 读取原始HTML
        html_content = self.read_file(self.index_html)
        if not html_content:
            return None

        # 提取CSS部分
        css_start = html_content.find('<style>')
        css_end = html_content.find('</style>')

        if css_start != -1 and css_end != -1:
            css_content = html_content[css_start + 7:css_end]
            remaining_html = html_content[:css_start] + html_content[css_end + 8:]

            # 压缩CSS（如果启用）
            if minify_css:
                original_css_size = len(css_content)
                css_content = self.minify_css(css_content)
                compressed_css_size = len(css_content)
                css_compression_rate = (1 - compressed_css_size / original_css_size) * 100
                print(f"[OK] CSS压缩完成: {original_css_size} → {compressed_css_size} 字节 (压缩率: {css_compression_rate:.1f}%)")
            else:
                compressed_css_size = len(css_content)
                print(f"[OK] CSS未压缩: {compressed_css_size} 字节")

            # 重新插入CSS
            html_content = remaining_html[:css_start] + '<style>' + css_content + '</style>' + remaining_html[css_start:]
        else:
            print("[WARNING] 未找到CSS样式部分")

        # 移除所有的script标签（包括内联和外部引用）
        import re
        script_pattern = r'<script[^>]*>(.*?)</script>'

        # 移除所有内联script标签
        html_content = re.sub(script_pattern, '', html_content, flags=re.DOTALL)

        # 移除外部JS文件引用
        lines = html_content.split('\n')
        new_lines = []
        in_external_script = False

        for line in lines:
            if '<script src="src/js/' in line:
                in_external_script = True
                continue
            elif in_external_script and '</script>' in line:
                in_external_script = False
                continue
            elif in_external_script:
                continue
            else:
                new_lines.append(line)

        # 重新组合内容
        html_content = '\n'.join(new_lines)

        print("[OK] 移除了所有script标签（内联和外部引用）")

        # 在</body>标签前插入压缩后的JS

        # 找到</body>标签的位置
        body_end_pos = html_content.rfind('</body>')
        if body_end_pos == -1:
            body_end_pos = html_content.rfind('</html>')

        if body_end_pos != -1:
            # 构建新的HTML内容
            new_html = html_content[:body_end_pos]
            new_html += f'\n\n    <!-- 压缩后的游戏代码 (生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}) -->\n'
            new_html += '    <script>\n'
            new_html += js_content
            new_html += '\n    </script>\n\n'
            new_html += html_content[body_end_pos:]
        else:
            # 如果没有找到</body>标签，直接追加到末尾
            new_html = html_content
            new_html += f'\n\n<!-- 压缩后的游戏代码 (生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}) -->\n'
            new_html += '<script>\n'
            new_html += js_content
            new_html += '\n</script>\n'

        # 压缩HTML（如果启用）
        if minify_html:
            original_html_size = len(new_html)
            new_html = self.minify_html(new_html)
            compressed_html_size = len(new_html)
            html_compression_rate = (1 - compressed_html_size / original_html_size) * 100
            print(f"[OK] HTML压缩完成: {original_html_size} → {compressed_html_size} 字节 (压缩率: {html_compression_rate:.1f}%)")
        else:
            compressed_html_size = len(new_html)
            print(f"[OK] HTML未压缩: {compressed_html_size} 字节")

        return new_html

    def calculate_hash(self, content):
        """计算内容的哈希值"""
        return hashlib.md5(content.encode('utf-8')).hexdigest()[:8]

    def build(self, minify=True, minify_css=True, minify_html=True):
        """执行构建过程"""
        print("=" * 60)
        print("消消乐游戏发布脚本")
        print("=" * 60)

        # 1. 合并JS文件
        merged_js = self.merge_js_files()
        if not merged_js:
            print("错误: 合并JS文件失败")
            return False

        # 2. 压缩JS（可选）
        if minify:
            final_js = self.compress_js(merged_js)
        else:
            final_js = merged_js
            print("跳过压缩步骤")

        # 3. 生成单个HTML
        single_html = self.generate_single_html(final_js, minify_css, minify_html)
        if not single_html:
            print("错误: 生成HTML文件失败")
            return False

        # 4. 计算版本哈希
        version_hash = self.calculate_hash(final_js)

        # 5. 保存单个HTML文件
        html_filename = 'index.html'
        html_path = os.path.join(self.output_dir, html_filename)
        self.write_file(html_path, single_html)

        # 6. 生成构建报告
        self.generate_build_report(html_path, version_hash, minify, minify_css, minify_html, len(final_js))

        print("\n" + "=" * 60)
        print("构建完成!")
        print(f"输出文件: {html_path}")
        print(f"文件大小: {len(single_html)/1024:.1f} KB")
        print(f"版本哈希: {version_hash}")
        print("=" * 60)

        return True

    def generate_build_report(self, html_path, version_hash, minify, minify_css, minify_html, js_size):
        """生成构建报告"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        html_size = os.path.getsize(html_path)

        report = f"""# 消消乐游戏构建报告

## 构建信息
- 构建时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
- 版本哈希: {version_hash}
- JS压缩: {'是' if minify else '否'}
- CSS压缩: {'是' if minify_css else '否'}
- HTML压缩: {'是' if minify_html else '否'}
- JS大小: {js_size} 字节 ({js_size/1024:.1f} KB)
- HTML大小: {html_size} 字节 ({html_size/1024:.1f} KB)

## 输出文件
`index.html` - 完整的游戏文件，包含所有JavaScript和CSS代码

## 文件结构
```
{self.output_dir}/
└── index.html  # 完整的游戏文件
```

## 使用说明
1. 直接打开 `index.html` 即可运行游戏
2. 所有JavaScript和CSS代码已内联到HTML中，无需额外文件
3. 版本哈希用于区分不同构建版本

## 注意事项
- 此文件为独立文件，可部署到任何静态网站托管服务
- 游戏数据保存在浏览器的localStorage中
- 如需更新游戏，只需替换此HTML文件即可
"""

        report_path = os.path.join(self.output_dir, f'build_report_{timestamp}.md')
        self.write_file(report_path, report)


def main():
    """主函数"""
    # 获取项目根目录
    project_root = os.path.dirname(os.path.abspath(__file__))

    # 解析命令行参数
    minify = True
    minify_css = True
    minify_html = True

    if len(sys.argv) > 1:
        if sys.argv[1] in ['--help', '-h']:
            print("用法: python build.py [选项]")
            print("选项:")
            print("  --no-minify, -n       跳过JavaScript压缩")
            print("  --no-css-compress     跳过CSS压缩")
            print("  --no-html-compress   跳过HTML压缩")
            print("  --help, -h           显示帮助信息")
            return
        else:
            # 处理参数
            for arg in sys.argv[1:]:
                if arg in ['--no-minify', '-n']:
                    minify = False
                elif arg in ['--no-css-compress']:
                    minify_css = False
                elif arg in ['--no-html-compress']:
                    minify_html = False

    # 创建构建器并执行构建
    builder = GameBuilder(project_root)
    success = builder.build(minify=minify, minify_css=minify_css, minify_html=minify_html)

    if not success:
        sys.exit(1)


if __name__ == '__main__':
    main()