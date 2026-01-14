// 消消乐游戏主类
class Match3Game {
    constructor() {
        // 基本配置
        this.boardSize = BOARD_SIZE;
        this.board = [];
        this.selectedCell = null;
        this.score = 0;
        this.moves = CLASSIC_MOVES;
        this.isAnimating = false;
        this.comboCount = 0;

        // DOM元素引用
        this.boardEl = document.getElementById('game-board');
        this.scoreEl = document.getElementById('score');
        this.movesEl = document.getElementById('moves');

        // 游戏模式
        this.gameMode = 'classic'; // 'classic' or 'boss'

        // 初始化各个子系统
        this.bossSystem = new BossSystem(this);
        this.itemSystem = new ItemSystem(this);
        this.logSystem = new LogSystem(this);
        this.gameLogic = new GameLogic(this);
        this.uiRenderer = new UIRenderer(this);

        // 概率配置
        this.probabilities = this.gameLogic.calculateProbabilities();

        // 保存原始点击处理器引用
        this.originalClickHandler = null;

        this.init();
    }

    // 初始化游戏
    init() {
        this.gameLogic.createBoard();
        this.uiRenderer.renderBoard(this);
        this.setupEventListeners();
        this.itemSystem.updateItemsDisplay();
        this.logSystem.initLogDisplay();
    }

    // 设置事件监听器
    setupEventListeners() {
        this.originalClickHandler = (e) => {
            this.handleCellClick(e);
        };
        this.boardEl.addEventListener('click', this.originalClickHandler);
    }

    // 处理格子点击
    handleCellClick(e) {
        if (this.isAnimating) return;

        const cell = e.target.closest('.cell');
        if (!cell) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const cellKey = `${row},${col}`;

        // Boss战模式：检查是否点击了冻结的方块
        if (this.gameMode === 'boss' && this.bossSystem.frozenCells.has(cellKey)) {
            this.uiRenderer.showMatchEffect('该方块被冻结，无法移动！');
            return;
        }

        // 选择第一个格子时，清除放大镜的高亮
        if (this.selectedCell === null) {
            this.itemSystem.clearHighlightedCells();
        }

        if (this.selectedCell === null) {
            // 选择第一个格子
            this.selectedCell = { row, col };
            this.uiRenderer.highlightCell(row, col);
        } else {
            const { row: prevRow, col: prevCol } = this.selectedCell;

            // 点击同一个格子，取消选择
            if (prevRow === row && prevCol === col) {
                this.uiRenderer.clearSelection();
                return;
            }

            // Boss战模式：检查第二个方块是否被冻结
            const prevCellKey = `${prevRow},${prevCol}`;
            if (this.gameMode === 'boss' && this.bossSystem.frozenCells.has(prevCellKey)) {
                this.uiRenderer.showMatchEffect('该方块被冻结，无法移动！');
                this.uiRenderer.clearSelection();
                return;
            }

            // 检查是否相邻
            const isAdjacent = this.gameLogic.areAdjacent(prevRow, prevCol, row, col);

            if (isAdjacent) {
                this.gameLogic.swapPieces(prevRow, prevCol, row, col);
            } else {
                // 不相邻，选择新的格子
                this.uiRenderer.clearSelection();
                this.selectedCell = { row, col };
                this.uiRenderer.highlightCell(row, col);
            }
        }
    }

    // 切换游戏模式
    switchMode(mode) {
        if (this.gameMode === mode) return;

        this.gameMode = mode;

        // 显示/隐藏Boss面板
        const bossPanel = document.getElementById('boss-panel');
        if (bossPanel) {
            bossPanel.classList.toggle('active', mode === 'boss');
        }

        // 显示/隐藏玩家血量条
        const playerHpBar = document.getElementById('player-hp-container');
        if (playerHpBar) {
            playerHpBar.classList.toggle('active', mode === 'boss');
        }

        // 显示/隐藏关卡选择按钮
        const levelSelectBtn = document.getElementById('level-select-btn');
        if (levelSelectBtn) {
            levelSelectBtn.style.display = mode === 'boss' ? 'inline-block' : 'none';
        }

        // 重新开始游戏
        this.restart();
    }

    // 添加分数
    addScore(points) {
        let originalPoints = points;

        // 检查三部曲倍率
        const actualPoints = this.itemSystem.checkTripleCombo(points);

        this.score += actualPoints;
        this.uiRenderer.updateScore(this.score);

        // 检查是否获得道具（每100分）
        const previousHundreds = Math.floor((this.score - actualPoints) / 100);
        const currentHundreds = Math.floor(this.score / 100);

        if (currentHundreds > previousHundreds) {
            this.itemSystem.giveRandomItem();
        }
    }

    // 延时函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 游戏结束
    endGame(isVictory = true) {
        if (this.gameMode === 'boss') {
            if (!isVictory) {
                // 玩家失败，重新开始当前关卡
                this.uiRenderer.showMatchEffect('游戏结束！');
                setTimeout(() => {
                    alert(`你在第${this.bossSystem.bossLevel}关被Boss击败了！`);
                    this.bossSystem.initBoss();
                    this.gameLogic.createBoard();
                    this.uiRenderer.renderBoard(this);
                }, 500);
            }
            return;
        }

        // 经典模式的游戏结束
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.add('active');
    }

    // 重新开始
    restart() {
        this.score = 0;
        this.moves = 30;
        this.selectedCell = null;
        this.isAnimating = false;
        this.comboCount = 0;

        // 重置道具系统
        this.itemSystem.reset();
        this.itemSystem.updateItemsDisplay();

        // Boss战模式：重置关卡和Boss
        if (this.gameMode === 'boss') {
            this.bossSystem.reset();
            this.bossSystem.initBoss();
        }

        this.uiRenderer.updateScore(this.score);
        this.uiRenderer.updateMoves(this.moves, this.bossSystem ? this.bossSystem.initialMoves : CLASSIC_MOVES, this.gameMode);
        this.gameLogic.createBoard();
        this.uiRenderer.renderBoard(this);

        // 重置日志
        this.logSystem.reset();

        document.getElementById('game-over').classList.remove('active');
    }

    // 保存并重新开始
    saveAndRestart() {
        const nameInput = document.getElementById('player-name');
        const playerName = nameInput ? nameInput.value.trim() : '';
        this.saveScore(playerName);
        nameInput.value = ''; // 清空输入框
        this.restart();
    }

    // 保存分数
    saveScore(playerName = '') {
        const rankings = this.getRankings();
        const now = new Date();
        const date = now.toLocaleDateString('zh-CN');
        const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

        rankings.push({
            score: this.score,
            date: date,
            time: time,
            name: playerName || '【无名之辈】'
        });

        // 排序并保留前10名
        rankings.sort((a, b) => b.score - a.score);
        const topRankings = rankings.slice(0, 10);

        localStorage.setItem('match3_rankings', JSON.stringify(topRankings));
    }

    // 获取排行榜
    getRankings() {
        const stored = localStorage.getItem('match3_rankings');
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    }

    // 显示排行榜
    showRanking() {
        this.uiRenderer.showRanking(this.getRankings());
    }

    // 显示规则
    showRules() {
        this.uiRenderer.showRules(this.gameMode, this.bossSystem ? this.bossSystem.bossLevel : 1);
    }

    // 显示关卡选择
    showLevelSelection() {
        const maxLevel = this.bossSystem.getMaxLevel();
        this.uiRenderer.showLevelSelection(maxLevel, this.startFromLevel.bind(this));
    }

    // 从指定关卡开始
    startFromLevel(level) {
        if (level < 1 || level > this.bossSystem.getMaxLevel()) {
            alert('无效的关卡！');
            return;
        }

        this.bossSystem.setLevel(level);
        this.bossSystem.initBoss();
        this.gameLogic.createBoard();
        this.uiRenderer.renderBoard(this);
        this.uiRenderer.closeModal();
        this.logSystem.addLog('系统', `从第${level}关开始`, 'system');
    }

    // 切换日志显示
    toggleLog() {
        this.logSystem.toggleLog();
    }

    // 关闭模态框
    closeModal() {
        this.uiRenderer.closeModal();
    }
}

// 游戏实例将在pageController.js中初始化
