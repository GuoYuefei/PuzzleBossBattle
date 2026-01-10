// 消消乐游戏主逻辑
class Match3Game {
    constructor() {
        this.boardSize = 11;
        this.board = [];
        this.selectedCell = null;
        this.score = 0;
        this.moves = 30;
        this.isAnimating = false;
        this.comboCount = 0;
        this.boardEl = document.getElementById('game-board');
        this.scoreEl = document.getElementById('score');
        this.movesEl = document.getElementById('moves');

        // 形状配置
        this.shapes = ['triangle', 'square', 'circle', 'star'];
        this.shapeScores = {
            'triangle': 3,
            'square': 4,
            'circle': 5,
            'star': 10
        };
        this.colors = ['green', 'blue', 'red'];
        this.colorMultipliers = {
            'green': 1,
            'blue': 1.5,
            'red': 3
        };

        // 出现概率配置
        this.probabilities = this.calculateProbabilities();

        this.init();
    }

    // 计算各个组合的出现概率
    calculateProbabilities() {
        const probs = {};

        // 调整概率：增加红色出现概率
        for (const shape of this.shapes) {
            for (const color of this.colors) {
                let prob = 1;

                // 形状概率：五角星10%，其他均匀分配
                if (shape === 'star') {
                    prob *= 0.1;
                } else {
                    prob *= 0.3; // (1 - 0.1) / 3
                }

                // 颜色概率：红色20%，蓝色40%，绿色40%
                if (color === 'red') {
                    prob *= 0.2;  // 从5%提升到20%
                } else if (color === 'blue') {
                    prob *= 0.4;
                } else {
                    prob *= 0.4;
                }

                const key = `${shape}-${color}`;
                probs[key] = prob;
            }
        }

        return probs;
    }

    // 根据概率生成随机图形
    getRandomPiece() {
        const rand = Math.random();
        let cumulative = 0;

        for (const [key, prob] of Object.entries(this.probabilities)) {
            cumulative += prob;
            if (rand <= cumulative) {
                const [shape, color] = key.split('-');
                return { shape, color };
            }
        }

        // 默认返回绿色三角形（最常见）
        return { shape: 'triangle', color: 'green' };
    }

    init() {
        this.createBoard();
        this.renderBoard();
        this.setupEventListeners();
    }

    createBoard() {
        this.board = [];
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                this.board[row][col] = this.getRandomPiece();
            }
        }

        // 检查初始盘面是否有匹配，如果有则重新生成
        while (this.findMatches().length > 0) {
            for (let row = 0; row < this.boardSize; row++) {
                for (let col = 0; col < this.boardSize; col++) {
                    this.board[row][col] = this.getRandomPiece();
                }
            }
        }

        // 检查是否有可消除的移动，如果没有则重新生成
        let attempts = 0;
        while (!this.hasPossibleMoves() && attempts < 100) {
            for (let row = 0; row < this.boardSize; row++) {
                for (let col = 0; col < this.boardSize; col++) {
                    this.board[row][col] = this.getRandomPiece();
                }
            }

            // 再次检查初始盘面是否有匹配
            while (this.findMatches().length > 0) {
                for (let row = 0; row < this.boardSize; row++) {
                    for (let col = 0; col < this.boardSize; col++) {
                        this.board[row][col] = this.getRandomPiece();
                    }
                }
            }
            attempts++;
        }
    }

    // 检查是否有可以消除的移动
    hasPossibleMoves() {
        // 检查所有可能的交换
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                // 尝试向右交换
                if (col < this.boardSize - 1) {
                    // 临时交换
                    const temp = this.board[row][col];
                    this.board[row][col] = this.board[row][col + 1];
                    this.board[row][col + 1] = temp;

                    // 检查是否有匹配
                    const hasMatch = this.findMatches().length > 0;

                    // 换回来
                    this.board[row][col + 1] = this.board[row][col];
                    this.board[row][col] = temp;

                    if (hasMatch) return true;
                }

                // 尝试向下交换
                if (row < this.boardSize - 1) {
                    // 临时交换
                    const temp = this.board[row][col];
                    this.board[row][col] = this.board[row + 1][col];
                    this.board[row + 1][col] = temp;

                    // 检查是否有匹配
                    const hasMatch = this.findMatches().length > 0;

                    // 换回来
                    this.board[row + 1][col] = this.board[row][col];
                    this.board[row][col] = temp;

                    if (hasMatch) return true;
                }
            }
        }

        return false;
    }

    renderBoard(animateNew = false) {
        this.boardEl.innerHTML = '';

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const piece = this.board[row][col];
                if (piece) {
                    const pieceEl = this.createPieceElement(piece);
                    cell.appendChild(pieceEl);
                }

                this.boardEl.appendChild(cell);
            }
        }
    }

    createPieceElement(piece) {
        const pieceEl = document.createElement('div');

        // 根据格子大小动态调整图形尺寸，让图形在格子里更大
        const size = Math.max(22, Math.floor(100 / this.boardSize * 1.1));

        if (piece.shape === 'triangle') {
            // 使用SVG绘制三角形，确保正确显示
            pieceEl.innerHTML = `
                <svg width="${size}" height="${size}" viewBox="0 0 26 26">
                    <polygon points="13,2 24,24 2,24" fill="${this.getColorCode(piece.color)}"/>
                </svg>
            `;
        } else if (piece.shape === 'square') {
            // 正方形：明显的方形，添加边框让它更突出
            pieceEl.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                background-color: ${this.getColorCode(piece.color)};
                border-radius: 2px;
                border: 2px solid rgba(255,255,255,0.5);
                box-shadow: inset 0 0 4px rgba(0,0,0,0.2);
            `;
        } else if (piece.shape === 'circle') {
            // 圆形：完全的圆，添加光晕效果让它更明显
            pieceEl.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                background-color: ${this.getColorCode(piece.color)};
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.6);
                box-shadow: 0 0 6px rgba(255,255,255,0.4);
            `;
        } else if (piece.shape === 'star') {
            // 使用SVG绘制五角星
            pieceEl.innerHTML = `
                <svg width="${size}" height="${size}" viewBox="0 0 26 26">
                    <polygon points="13,1 16,10 25,10 18,16 21,25 13,20 5,25 8,16 1,10 10,10" fill="${this.getColorCode(piece.color)}"/>
                </svg>
            `;
        }

        return pieceEl;
    }

    getColorCode(color) {
        const colorCodes = {
            'red': '#ff4757',
            'blue': '#3498db',
            'green': '#2ecc71'
        };
        return colorCodes[color] || '#2ecc71';
    }

    setupEventListeners() {
        this.boardEl.addEventListener('click', (e) => {
            if (this.isAnimating) return;

            const cell = e.target.closest('.cell');
            if (!cell) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            this.handleCellClick(row, col);
        });
    }

    handleCellClick(row, col) {
        if (this.selectedCell === null) {
            // 选择第一个格子
            this.selectedCell = { row, col };
            this.highlightCell(row, col);
        } else {
            const { row: prevRow, col: prevCol } = this.selectedCell;

            // 点击同一个格子，取消选择
            if (prevRow === row && prevCol === col) {
                this.clearSelection();
                return;
            }

            // 检查是否相邻
            const isAdjacent = this.areAdjacent(prevRow, prevCol, row, col);

            if (isAdjacent) {
                this.swapPieces(prevRow, prevCol, row, col);
            } else {
                // 不相邻，选择新的格子
                this.clearSelection();
                this.selectedCell = { row, col };
                this.highlightCell(row, col);
            }
        }
    }

    highlightCell(row, col) {
        const index = row * this.boardSize + col;
        const cell = this.boardEl.children[index];
        cell.classList.add('selected');
    }

    clearSelection() {
        const selected = this.boardEl.querySelector('.selected');
        if (selected) {
            selected.classList.remove('selected');
        }
        this.selectedCell = null;
    }

    areAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    async swapPieces(row1, col1, row2, col2) {
        this.isAnimating = true;
        this.clearSelection();

        // 交换
        const temp = this.board[row1][col1];
        this.board[row1][col1] = this.board[row2][col2];
        this.board[row2][col2] = temp;

        this.renderBoard();

        // 检查是否有匹配
        const matches = this.findMatches();

        if (matches.length > 0) {
            this.moves--;
            this.updateMoves();
            this.comboCount = 0; // 重置连击计数
            await this.processMatches();
        } else {
            // 没有匹配，换回来
            await this.delay(200);
            const temp = this.board[row1][col1];
            this.board[row1][col1] = this.board[row2][col2];
            this.board[row2][col2] = temp;
            this.renderBoard();
        }

        this.isAnimating = false;

        // 检查游戏是否结束
        if (this.moves <= 0) {
            this.endGame();
        }
    }

    findMatches() {
        const matches = [];
        const matchedCells = new Set();

        // 检查横向匹配
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize - 2; col++) {
                const piece = this.board[row][col];
                if (!piece) continue;

                const match = [{ row, col }];
                let c = col + 1;

                while (c < this.boardSize &&
                       this.board[row][c] &&
                       this.board[row][c].shape === piece.shape &&
                       this.board[row][c].color === piece.color) {
                    match.push({ row, col: c });
                    c++;
                }

                if (match.length >= 3) {
                    matches.push({ cells: match, type: 'horizontal' });
                }
            }
        }

        // 检查纵向匹配
        for (let col = 0; col < this.boardSize; col++) {
            for (let row = 0; row < this.boardSize - 2; row++) {
                const piece = this.board[row][col];
                if (!piece) continue;

                const match = [{ row, col }];
                let r = row + 1;

                while (r < this.boardSize &&
                       this.board[r][col] &&
                       this.board[r][col].shape === piece.shape &&
                       this.board[r][col].color === piece.color) {
                    match.push({ row: r, col });
                    r++;
                }

                if (match.length >= 3) {
                    matches.push({ cells: match, type: 'vertical' });
                }
            }
        }

        return matches;
    }

    // 分析匹配类型，检测L型、T型等特殊形状
    analyzeMatches(matches) {
        if (matches.length === 0) {
            return { type: 'normal', totalCells: 0 };
        }

        // 收集所有匹配的格子
        const allCells = new Set();
        for (const match of matches) {
            for (const cell of match.cells) {
                allCells.add(`${cell.row},${cell.col}`);
            }
        }

        const totalCells = allCells.size;

        // 检查是否是五连或更多
        const hasFiveOrMore = matches.some(m => m.cells.length >= 5);

        if (hasFiveOrMore) {
            return { type: 'five', totalCells }; // 五连
        }

        // 检查是否有交叉（L型或T型）
        if (this.checkIntersection(matches)) {
            const matchType = this.detectTOrLShape(matches);
            if (matchType === 'T') {
                return { type: 'special', totalCells }; // T型享受晋级
            } else {
                return { type: 'L', totalCells }; // L型普通计分
            }
        }

        return { type: 'normal', totalCells }; // 普通消除
    }

    // 检查匹配是否有交叉点
    checkIntersection(matches) {
        if (matches.length < 2) return false;

        // 分为横向和纵向匹配
        const horizontal = matches.filter(m => m.type === 'horizontal');
        const vertical = matches.filter(m => m.type === 'vertical');

        // 检查横向和纵向是否有交叉
        for (const h of horizontal) {
            for (const v of vertical) {
                // 检查是否有交叉点
                for (const hCell of h.cells) {
                    for (const vCell of v.cells) {
                        if (hCell.row === vCell.row && hCell.col === vCell.col) {
                            return true; // 有交叉点
                        }
                    }
                }
            }
        }

        return false;
    }

    // 检测是T型还是L型
    detectTOrLShape(matches) {
        const horizontal = matches.filter(m => m.type === 'horizontal');
        const vertical = matches.filter(m => m.type === 'vertical');

        // 如果有多个横向或纵向匹配，可能是T型
        if (horizontal.length >= 2 || vertical.length >= 2) {
            return 'T';
        }

        // 如果只有一个横向和一个纵向，检查长度
        if (horizontal.length === 1 && vertical.length === 1) {
            const hLen = horizontal[0].cells.length;
            const vLen = vertical[0].cells.length;

            // T型：至少有一个方向的长度>=4
            if (hLen >= 4 || vLen >= 4) {
                return 'T';
            }
        }

        return 'L'; // 否则是L型
    }

    async processMatches() {
        let hasMatches = true;

        while (hasMatches) {
            const matches = this.findMatches();

            if (matches.length === 0) {
                hasMatches = false;

                // 检查是否死局，如果死局则自动刷新
                if (!this.hasPossibleMoves()) {
                    await this.refreshBoard();
                }
                continue;
            }

            this.comboCount++;

            // 分析匹配类型
            const matchAnalysis = this.analyzeMatches(matches);

            if (this.comboCount > 1) {
                this.showCombo(this.comboCount);
            }

            // 计算分数（传入连击数）
            const score = this.calculateScore(matches, matchAnalysis, this.comboCount);
            this.addScore(score);

            // 标记匹配的格子
            const matchedCells = new Set();
            for (const match of matches) {
                for (const cell of match.cells) {
                    matchedCells.add(`${cell.row},${cell.col}`);
                }
            }

            // 播放消除动画
            for (const cellKey of matchedCells) {
                const [row, col] = cellKey.split(',').map(Number);
                const index = row * this.boardSize + col;
                const cellEl = this.boardEl.children[index];
                if (cellEl) {
                    cellEl.classList.add('matched');
                }
            }

            await this.delay(300);

            // 清除匹配的格子
            for (const cellKey of matchedCells) {
                const [row, col] = cellKey.split(',').map(Number);
                this.board[row][col] = null;
            }

            // 下落填充
            await this.dropPieces();
            await this.fillBoard();

            await this.delay(200);
        }
    }

    // 刷新棋盘（死局时调用）
    async refreshBoard() {
        this.showMatchEffect('死局刷新！');

        // 重新生成棋盘
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                this.board[row][col] = this.getRandomPiece();
            }
        }

        // 确保没有初始匹配
        while (this.findMatches().length > 0) {
            for (let row = 0; row < this.boardSize; row++) {
                for (let col = 0; col < this.boardSize; col++) {
                    this.board[row][col] = this.getRandomPiece();
                }
            }
        }

        // 确保有可消除的移动
        let attempts = 0;
        while (!this.hasPossibleMoves() && attempts < 100) {
            for (let row = 0; row < this.boardSize; row++) {
                for (let col = 0; col < this.boardSize; col++) {
                    this.board[row][col] = this.getRandomPiece();
                }
            }

            while (this.findMatches().length > 0) {
                for (let row = 0; row < this.boardSize; row++) {
                    for (let col = 0; col < this.boardSize; col++) {
                        this.board[row][col] = this.getRandomPiece();
                    }
                }
            }
            attempts++;
        }

        this.renderBoard();
        await this.delay(500);
    }

    calculateScore(matches, matchAnalysis, comboCount) {
        let totalScore = 0;

        // 获取第一个匹配的图形信息
        const firstMatch = matches[0];
        const firstCell = firstMatch.cells[0];
        const piece = this.board[firstCell.row][firstCell.col];

        let shapeScore = this.shapeScores[piece.shape];
        let colorMultiplier = this.colorMultipliers[piece.color];

        const totalCells = matchAnalysis.totalCells;

        // 计算连击倍数（第2次*2，第3次*3，...，第5次及以上*5）
        let comboMultiplier = 1;
        if (comboCount >= 2) {
            comboMultiplier = Math.min(comboCount, 5);
        }

        if (matchAnalysis.type === 'five') {
            // 五连消除：翻倍
            totalScore += totalCells * shapeScore * colorMultiplier * 2 * comboMultiplier;
            this.showMatchEffect('五连消除！');
        } else if (matchAnalysis.type === 'special') {
            // T型特殊消除：晋级
            const nextShape = this.getNextShape(piece.shape);
            const nextColor = this.getNextColor(piece.color);

            const promotedShapeScore = this.shapeScores[nextShape];
            const promotedColorMultiplier = this.colorMultipliers[nextColor];

            totalScore += totalCells * promotedShapeScore * promotedColorMultiplier * comboMultiplier;
            this.showMatchEffect('T型晋级消除！');
        } else {
            // 普通消除（包括L型）：只计算基本分数
            totalScore += totalCells * shapeScore * colorMultiplier * comboMultiplier;
        }

        return Math.floor(totalScore);
    }

    getNextShape(shape) {
        const shapes = ['triangle', 'square', 'circle', 'star'];
        const index = shapes.indexOf(shape);
        if (index < shapes.length - 1) {
            return shapes[index + 1];
        }
        return shape; // 星星已经是最高的
    }

    getNextColor(color) {
        const colors = ['green', 'blue', 'red'];
        const index = colors.indexOf(color);
        if (index < colors.length - 1) {
            return colors[index + 1];
        }
        return color; // 红色已经是最高的
    }

    async dropPieces() {
        const drops = []; // 记录每个格子的下落距离

        for (let col = 0; col < this.boardSize; col++) {
            for (let row = this.boardSize - 1; row >= 0; row--) {
                if (this.board[row][col] === null) {
                    // 向上寻找非空格子
                    for (let r = row - 1; r >= 0; r--) {
                        if (this.board[r][col] !== null) {
                            this.board[row][col] = this.board[r][col];
                            this.board[r][col] = null;
                            drops.push({ row, col, fromRow: r });
                            break;
                        }
                    }
                }
            }
        }

        if (drops.length > 0) {
            // 只更新有变化的格子
            this.updateChangedCells();
            await this.delay(200);
        }
    }

    async fillBoard() {
        const newPieces = []; // 记录新生成的格子

        for (let col = 0; col < this.boardSize; col++) {
            for (let row = 0; row < this.boardSize; row++) {
                if (this.board[row][col] === null) {
                    this.board[row][col] = this.getRandomPiece();
                    newPieces.push({ row, col });
                }
            }
        }

        if (newPieces.length > 0) {
            // 只更新新生成的格子
            this.updateChangedCells(newPieces);
            await this.delay(200);
        }
    }

    // 更新有变化的格子，避免全盘刷新
    updateChangedCells(newPieces = []) {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const index = row * this.boardSize + col;
                const cellEl = this.boardEl.children[index];

                if (!cellEl) continue;

                // 清空格子
                cellEl.innerHTML = '';
                cellEl.className = 'cell';

                const piece = this.board[row][col];
                if (piece) {
                    const pieceEl = this.createPieceElement(piece);

                    // 检查是否是新生成的格子，添加下落动画
                    const isNewPiece = newPieces.some(p => p.row === row && p.col === col);
                    if (isNewPiece) {
                        pieceEl.style.animation = 'fall 0.3s ease-in';
                    }

                    cellEl.appendChild(pieceEl);
                }
            }
        }
    }

    addScore(points) {
        this.score += points;
        this.updateScore();
    }

    updateScore() {
        this.scoreEl.textContent = this.score;
    }

    updateMoves() {
        this.movesEl.textContent = this.moves;
    }

    showCombo(combo) {
        const comboDisplay = document.getElementById('combo-display');
        const multiplier = Math.min(combo, 5);
        comboDisplay.textContent = `连击 x${multiplier}!`;
        comboDisplay.classList.add('show');

        setTimeout(() => {
            comboDisplay.classList.remove('show');
        }, 800);
    }

    showMatchEffect(text) {
        const comboDisplay = document.getElementById('combo-display');
        comboDisplay.textContent = text;
        comboDisplay.classList.add('show');

        setTimeout(() => {
            comboDisplay.classList.remove('show');
        }, 800);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    endGame() {
        this.saveScore();
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.add('active');
    }

    restart() {
        this.score = 0;
        this.moves = 30;
        this.selectedCell = null;
        this.isAnimating = false;
        this.comboCount = 0;

        this.updateScore();
        this.updateMoves();
        this.createBoard();
        this.renderBoard();

        document.getElementById('game-over').classList.remove('active');
    }

    saveScore() {
        const rankings = this.getRankings();
        const date = new Date().toLocaleDateString('zh-CN');

        rankings.push({
            score: this.score,
            date: date
        });

        // 排序并保留前10名
        rankings.sort((a, b) => b.score - a.score);
        const topRankings = rankings.slice(0, 10);

        localStorage.setItem('match3_rankings', JSON.stringify(topRankings));
    }

    getRankings() {
        const stored = localStorage.getItem('match3_rankings');
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    }

    showRanking() {
        const rankings = this.getRankings();
        const rankingsList = document.createElement('ul');
        rankingsList.className = 'ranking-list';

        if (rankings.length === 0) {
            rankingsList.innerHTML = '<li class="ranking-item">暂无记录</li>';
        } else {
            rankings.forEach((item, index) => {
                const li = document.createElement('li');
                li.className = 'ranking-item';
                li.innerHTML = `
                    <span>${index + 1}. ${item.date}</span>
                    <span>${item.score}分</span>
                `;
                rankingsList.appendChild(li);
            });
        }

        const clearBtn = document.createElement('button');
        clearBtn.textContent = '清空记录';
        clearBtn.style.marginTop = '15px';
        clearBtn.onclick = () => {
            localStorage.removeItem('match3_rankings');
            this.showRanking();
        };

        const container = document.createElement('div');
        container.appendChild(rankingsList);
        container.appendChild(clearBtn);

        this.showModal('排行榜', container);
    }

    showRules() {
        const rulesHTML = `
            <h3>游戏规则</h3>
            <p>交换相邻的图形，使3个或更多相同图形连成一线即可消除。</p>

            <h3>计分规则</h3>
            <table class="rules-table">
                <tr>
                    <th>消除类型</th>
                    <th>计分方式</th>
                </tr>
                <tr>
                    <td>三连消除</td>
                    <td>数量 × 形状分数 × 颜色系数</td>
                </tr>
                <tr>
                    <td>五连消除</td>
                    <td>数量 × 形状分数 × 颜色系数 × 2</td>
                </tr>
                <tr>
                    <td>T型消除</td>
                    <td>数量 × 晋级形状分 × 晋级颜色系数</td>
                </tr>
                <tr>
                    <td>L型消除</td>
                    <td>数量 × 形状分数 × 颜色系数（与普通消除相同）</td>
                </tr>
            </table>

            <h3>连击加成</h3>
            <p>连续消除时，第2次×2，第3次×3，...，第5次及以上×5</p>

            <h3>死局处理</h3>
            <p>当棋盘无法进行任何消除时，会自动刷新棋盘</p>

            <h3>晋级规则</h3>
            <p>T型消除时，形状和颜色都会晋升：</p>
            <p>△三角形 → □正方形 → ○圆形 → ★五角星</p>
            <p>绿色 → 蓝色 → 红色</p>

            <h3>形状分数</h3>
            <table class="rules-table">
                <tr>
                    <th>形状</th>
                    <th>分数</th>
                </tr>
                <tr>
                    <td>△ 三角形</td>
                    <td>3分</td>
                </tr>
                <tr>
                    <td>□ 正方形</td>
                    <td>4分</td>
                </tr>
                <tr>
                    <td>○ 圆形</td>
                    <td>5分</td>
                </tr>
                <tr>
                    <td>★ 五角星</td>
                    <td>10分</td>
                </tr>
            </table>

            <h3>颜色系数</h3>
            <table class="rules-table">
                <tr>
                    <th>颜色</th>
                    <th>系数</th>
                </tr>
                <tr>
                    <td>绿色</td>
                    <td>×1</td>
                </tr>
                <tr>
                    <td>蓝色</td>
                    <td>×1.5</td>
                </tr>
                <tr>
                    <td>红色</td>
                    <td>×3</td>
                </tr>
            </table>
        `;

        this.showModal('游戏规则', rulesHTML);
    }

    showModal(title, content) {
        document.getElementById('modal-title').textContent = title;

        const bodyEl = document.getElementById('modal-body');
        bodyEl.innerHTML = '';
        if (typeof content === 'string') {
            bodyEl.innerHTML = content;
        } else {
            bodyEl.appendChild(content);
        }

        document.getElementById('modal').classList.add('active');
    }

    closeModal() {
        document.getElementById('modal').classList.remove('active');
    }
}

// 启动游戏
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new Match3Game();
});
