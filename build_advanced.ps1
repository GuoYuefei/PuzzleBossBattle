# Puzzle Boss Battle Build Script (PowerShell Advanced Version - Supports CSS and HTML compression)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   Puzzle Boss Battle Build Script (PowerShell Advanced Version)" -ForegroundColor Cyan
Write-Host "============================================================"
Write-Host ""

# Ask for compression options
$minify_js = Read-Host "Minify JavaScript? (Y/N, default Y)"
if ([string]::IsNullOrWhiteSpace($minify_js)) { $minify_js = "Y" }
$minify_js = $minify_js.ToUpper() -eq "Y"

$minify_css = Read-Host "Minify CSS? (Y/N, default Y)"
if ([string]::IsNullOrWhiteSpace($minify_css)) { $minify_css = "Y" }
$minify_css = $minify_css.ToUpper() -eq "Y"

$minify_html = Read-Host "Minify HTML? (Y/N, default Y)"
if ([string]::IsNullOrWhiteSpace($minify_html)) { $minify_html = "Y" }
$minify_html = $minify_html.ToUpper() -eq "Y"

# Build arguments
$build_args = @()
if (-not $minify_js) { $build_args += "--no-minify" }
if (-not $minify_css) { $build_args += "--no-css-compress" }
if (-not $minify_html) { $build_args += "--no-html-compress" }

Write-Host ""
Write-Host "Compression options:" -ForegroundColor Yellow
Write-Host "  JavaScript minify: $minify_js" -ForegroundColor $(if($minify_js){"Green"}else{"Red"})
Write-Host "  CSS minify: $minify_css" -ForegroundColor $(if($minify_css){"Green"}else{"Red"})
Write-Host "  HTML minify: $minify_html" -ForegroundColor $(if($minify_html){"Green"}else{"Red"})
Write-Host ""

# Check Python
$python_cmd = "python"
if (-not (Get-Command $python_cmd -ErrorAction SilentlyContinue)) {
    $python_cmd = "python3"
    if (-not (Get-Command $python_cmd -ErrorAction SilentlyContinue)) {
        Write-Host "Error: Python not found" -ForegroundColor Red
        Write-Host "Please install Python 3.x: https://www.python.org/downloads/" -ForegroundColor Red
        Read-Host "Press any key to exit"
        exit 1
    }
}

Write-Host "Using Python: $python_cmd" -ForegroundColor Cyan
Write-Host "Running build script..." -ForegroundColor Yellow

# Execute build
try {
    & $python_cmd build.py $build_args

    if ($LASTEXITCODE -ne 0) {
        Write-Host "" -ForegroundColor Red
        Write-Host "Build failed!" -ForegroundColor Red
        Read-Host "Press any key to exit"
        exit 1
    }
}
catch {
    Write-Host "" -ForegroundColor Red
    Write-Host "Build failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Read-Host "Press any key to exit"
    exit 1
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Build completed!" -ForegroundColor Green
Write-Host "Output directory: dist/" -ForegroundColor Yellow
Write-Host ""

# Show file size
if (Test-Path "dist/index.html") {
    $html_size = (Get-Item "dist/index.html").Length / 1KB
    Write-Host "index.html: $([math]::Round($html_size, 2)) KB" -ForegroundColor Cyan
}

# Ask to open output directory
$openDir = Read-Host "Open output directory? (Y/N)"
if ($openDir -eq "Y" -or $openDir -eq "y") {
    Invoke-Item "dist"
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')