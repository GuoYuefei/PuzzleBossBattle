@echo off
chcp 65001 >nul
echo.
echo ============================================================
echo   消消乐游戏发布脚本 (Windows批处理版)
echo ============================================================
echo.

REM 显示菜单
:menu
echo 请选择构建方式:
echo   1. Python构建 (推荐，包含JS压缩)
echo   2. 简单复制 (不压缩，直接复制文件)
echo   3. PowerShell构建
echo   4. PowerShell高级构建 (支持CSS/HTML压缩)
echo   5. 显示帮助
echo   6. 退出
echo.
set /p "CHOICE=请选择 (1-6): "

if "%CHOICE%"=="1" goto python_build
if "%CHOICE%"=="2" goto simple_copy
if "%CHOICE%"=="3" goto powershell_build
if "%CHOICE%"=="4" goto powershell_advanced
if "%CHOICE%"=="5" goto show_help
if "%CHOICE%"=="6" goto exit_script
echo 无效选择，请重新输入
goto menu

:python_build
echo.
echo 正在准备Python构建...
echo.

REM 检查Python是否安装
where python >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python
    echo 请先安装Python 3.x: https://www.python.org/downloads/
    echo.
    echo 建议选择其他构建方式:
    echo   2. 简单复制 (不压缩，直接复制文件)
    echo   3. PowerShell构建
    echo.
    pause
    goto menu
)

REM 检查Python版本
python --version >nul 2>&1
if errorlevel 1 (
    echo 警告: Python无法正常运行
    echo 尝试使用python3...
    where python3 >nul 2>&1
    if errorlevel 1 (
        echo 错误: Python无法正常运行
        echo 请检查Python安装
        echo.
        pause
        goto menu
    ) else (
        set "PYTHON_CMD=python3"
    )
) else (
    set "PYTHON_CMD=python"
)

REM 显示Python版本
for /f "tokens=*" %%i in ('%PYTHON_CMD% --version 2^>^&1') do set "PYTHON_VERSION=%%i"
echo Python版本: %PYTHON_VERSION%

REM 询问是否压缩
echo.
set /p "MINIFY=是否压缩JavaScript? (Y/N, 默认Y): "
if /i "%MINIFY%"=="N" (
    set "JS_COMPRESS=--no-minify"
    echo 跳过JavaScript压缩
) else (
    set "JS_COMPRESS="
    echo 启用JavaScript压缩
)

REM 询问是否压缩CSS
echo.
set /p "CSS_COMPRESS=是否压缩CSS? (Y/N, 默认Y): "
if /i "%CSS_COMPRESS%"=="N" (
    set "CSS_ARG=--no-css-compress"
    echo 跳过CSS压缩
) else (
    set "CSS_ARG="
    echo 启用CSS压缩
)

REM 询问是否压缩HTML
echo.
set /p "HTML_COMPRESS=是否压缩HTML? (Y/N, 默认Y): "
if /i "%HTML_COMPRESS%"=="N" (
    set "HTML_ARG=--no-html-compress"
    echo 跳过HTML压缩
) else (
    set "HTML_ARG="
    echo 启用HTML压缩
)

REM 组合参数
set "ARGS=%JS_COMPRESS% %CSS_ARG% %HTML_ARG%"
if "%ARGS%"==" " set "ARGS="

echo.
echo 正在运行Python构建脚本...
%PYTHON_CMD% build.py %ARGS%

if errorlevel 1 (
    echo.
    echo Python构建失败!
    echo 建议尝试其他构建方式
    pause
    goto menu
)

goto build_success

:simple_copy
echo.
echo 正在执行简单复制构建...
echo.

REM 检查必要文件
if not exist "index.html" (
    echo 错误: index.html 不存在
    pause
    goto menu
)

if not exist "src\js\" (
    echo 错误: src\js 目录不存在
    pause
    goto menu
)

REM 创建输出目录
if not exist "dist\" (
    mkdir "dist"
    echo 创建输出目录: dist
)

REM 复制文件
echo 复制文件...
copy "index.html" "dist\index.html" >nul
echo ✓ 复制: index.html

if not exist "dist\src\js\" (
    mkdir "dist\src\js"
)

REM 复制JS文件
set "JS_FILES=constants.js logSystem.js bossSystem.js itemSystem.js gameLogic.js uiRenderer.js app.js"
for %%f in (%JS_FILES%) do (
    if exist "src\js\%%f" (
        copy "src\js\%%f" "dist\src\js\%%f" >nul
        echo ✓ 复制: src\js\%%f
    ) else (
        echo ✗ 缺失: src\js\%%f
    )
)

REM 创建构建报告
(
echo # 消消乐游戏简单构建报告
echo.
echo ## 构建信息
echo - 构建时间: %date% %time%
echo - 构建类型: 简单复制
echo - 输出目录: dist
echo.
echo ## 包含的文件
echo - index.html
for %%f in (%JS_FILES%) do (
    if exist "src\js\%%f" (
        echo - src/js/%%f
    )
)
) > "dist\build_report.txt"

echo ✓ 构建报告: dist\build_report.txt
goto build_success

:powershell_build
echo.
echo 正在准备PowerShell构建...
echo.

REM 检查PowerShell
powershell -Command "exit 0" >nul 2>&1
if errorlevel 1 (
    echo 错误: PowerShell不可用
    echo 请选择其他构建方式
    pause
    goto menu
)

echo 运行PowerShell构建脚本...
powershell -ExecutionPolicy Bypass -File "build.ps1"

if errorlevel 1 (
    echo.
    echo PowerShell构建失败!
    pause
    goto menu
)

goto build_success

:show_help
echo.
echo ============================================================
echo 消消乐游戏构建脚本帮助
echo ============================================================
echo.
echo 可用构建方式:
echo.
echo 1. Python构建 (推荐)
echo     - 合并所有JS文件到单个HTML
echo     - 可选JavaScript、CSS和HTML压缩
echo     - 需要Python 3.x环境
echo.
echo 2. 简单复制
echo     - 直接复制所有文件到dist目录
echo     - 不进行任何压缩或合并
echo     - 不需要额外环境
echo.
echo 3. PowerShell构建
echo     - 使用PowerShell脚本
echo     - 功能与简单复制类似
echo     - 需要PowerShell 5.1+
echo.
echo 压缩选项:
echo   - JavaScript压缩: 移除注释和多余空格
echo   - CSS压缩: 移除注释和多余空格
echo   - HTML压缩: 移除注释和多余空格
echo.
echo 文件结构要求:
echo   - index.html (主HTML文件)
echo   - src/js/ (包含所有JS文件)
echo.
pause
goto menu

:build_success
echo.
echo ============================================================
echo 构建成功!
echo ============================================================
echo.
echo 输出目录: dist\
echo.
echo 输出文件:
dir "dist\" /b

echo.
set /p "OPEN=是否打开输出目录? (Y/N): "
if /i "%OPEN%"=="Y" (
    explorer "dist\"
)

:powershell_advanced
echo.
echo 正在准备PowerShell高级构建...
echo.

REM 检查PowerShell
powershell -Command "exit 0" >nul 2>&1
if errorlevel 1 (
    echo 错误: PowerShell不可用
    echo 请选择其他构建方式
    pause
    goto menu
)

echo 运行PowerShell高级构建脚本...
powershell -ExecutionPolicy Bypass -File "build_advanced.ps1"

if errorlevel 1 (
    echo.
    echo PowerShell高级构建失败!
    pause
    goto menu
)

goto build_success

:exit_script
echo.
echo 按任意键退出...
pause >nul
exit /b 0