// 日志系统模块
class LogSystem {
    constructor(game) {
        this.game = game;
        this.gameLog = []; // 游戏日志
        this.logContainer = null;
        this.logContent = null;
    }

    // 初始化日志显示
    initLogDisplay() {
        this.logContainer = document.getElementById('log-container');
        this.logContent = document.getElementById('log-content');
        this.addLog('系统', '游戏开始！普通道具各1个，每100分获得随机道具', 'system');
    }

    // 添加日志
    addLog(title, message, type = 'normal', formula = '') {
        if (!this.logContent) return;

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;

        let html = `
            <div class="log-time">${timeStr} ${title}</div>
            <div class="log-message">${message}</div>
        `;

        if (formula) {
            html += `<div class="log-formula">公式: ${formula}</div>`;
        }

        logEntry.innerHTML = html;
        this.logContent.appendChild(logEntry);

        // 自动滚动到最新日志
        this.logContent.scrollTop = this.logContent.scrollHeight;

        // 保存到日志数组
        this.gameLog.push({ title, message, type, formula, time: timeStr });
    }

    // 切换日志显示/隐藏
    toggleLog() {
        if (!this.logContainer) return;

        const isHidden = this.logContainer.classList.contains('hidden');
        const showBtn = document.getElementById('show-log-btn');

        if (isHidden) {
            this.logContainer.classList.remove('hidden');
            showBtn.style.display = 'none';
        } else {
            this.logContainer.classList.add('hidden');
            showBtn.style.display = 'block';
        }
    }

    // 清空日志
    clearLog() {
        if (this.logContent) {
            this.logContent.innerHTML = '';
            this.gameLog = [];
        }
    }

    // 重置日志系统
    reset() {
        this.clearLog();
        const modeText = this.game.gameMode === 'boss' ? 'Boss战模式开始！' : '游戏开始！普通道具各1个，每100分获得随机奖励';
        this.addLog('系统', modeText, 'system');
    }
}
