// 道具类型定义
const ITEM_TYPES = {
    // 普通道具
    MAGNIFYING_GLASS: {
        id: 'magnifying_glass',
        name: '放大镜',
        type: 'normal',
        description: '找到随机三个可以消消乐的方块',
        icon: '🔍'
    },
    BOMB: {
        id: 'bomb',
        name: '炸弹',
        type: 'normal',
        description: '炸除3*3的方块',
        icon: '💣'
    },
    REFRESH: {
        id: 'refresh',
        name: '刷新道具',
        type: 'normal',
        description: '刷新游戏场地的所有方块',
        icon: '🔄'
    },
    // 特殊道具
    COLOR_CHANGE: {
        id: 'color_change',
        name: '改色道具',
        type: 'special',
        description: '将图形的所有颜色，改为蓝色',
        icon: '🎨'
    },
    TRIPLE_COMBO: {
        id: 'triple_combo',
        name: '三部曲',
        type: 'special',
        description: '接下来三步，获得的分数随机倍率',
        icon: '🎯'
    },
    SWAP: {
        id: 'swap',
        name: '交换道具',
        type: 'special',
        description: '可以任意交换两个方块',
        icon: '🔄'
    }
};

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
        this.originalClickHandler = null;

        // 道具系统
        this.items = {
            [ITEM_TYPES.MAGNIFYING_GLASS.id]: 1,
            [ITEM_TYPES.BOMB.id]: 1,
            [ITEM_TYPES.REFRESH.id]: 1,
            [ITEM_TYPES.COLOR_CHANGE.id]: 0,
            [ITEM_TYPES.TRIPLE_COMBO.id]: 0,
            [ITEM_TYPES.SWAP.id]: 0
        };
        this.itemsEl = document.getElementById('items');
        this.itemButtons = {};
        this.tripleComboActive = false;
        this.tripleComboCount = 0;
        this.swapModeActive = false;
        this.firstSwapCell = null;
        this.highlightedCells = []; // 存储放大镜高亮的方块
        this.gameLog = []; // 游戏日志
        this.logContainer = null;
        this.logContent = null;

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
        this.updateItemsDisplay();
        this.initLogDisplay();
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
        this.originalClickHandler = (e) => {
            this.handleCellClick(e);
        };
        this.boardEl.addEventListener('click', this.originalClickHandler);
    }

    handleCellClick(e) {
        if (this.isAnimating) return;

        const cell = e.target.closest('.cell');
        if (!cell) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // 选择第一个格子时，清除放大镜的高亮
        if (this.selectedCell === null) {
            this.clearHighlightedCells();
        }

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

        // 计算连击倍数（第2次*2，第3次*3，...，第5次及以上*5）
        let comboMultiplier = 1;
        if (comboCount >= 2) {
            comboMultiplier = Math.min(comboCount, 5);
        }

        // 收集所有匹配的格子信息，按形状和颜色分组
        const matchedCells = new Set();
        const shapeColorGroups = {};

        for (const match of matches) {
            for (const cell of match.cells) {
                const key = `${cell.row},${cell.col}`;
                if (!matchedCells.has(key)) {
                    matchedCells.add(key);
                    const piece = this.board[cell.row][cell.col];
                    if (piece) {
                        const groupKey = `${piece.shape}-${piece.color}`;
                        if (!shapeColorGroups[groupKey]) {
                            shapeColorGroups[groupKey] = {
                                shape: piece.shape,
                                color: piece.color,
                                count: 0,
                                shapeScore: this.shapeScores[piece.shape],
                                colorMultiplier: this.colorMultipliers[piece.color]
                            };
                        }
                        shapeColorGroups[groupKey].count++;
                    }
                }
            }
        }

        // 确定消除类型
        let matchType = '';
        let specialMultiplier = 1;
        let typeBonus = '';

        if (matchAnalysis.type === 'five') {
            matchType = '五连消除';
            specialMultiplier = 2;
            typeBonus = '×2(五连)';
            this.showMatchEffect('五连消除！');
        } else if (matchAnalysis.type === 'special') {
            matchType = 'T型晋级消除';
            // T型特殊消除：使用晋级后的分数
            const firstMatch = matches[0];
            const firstCell = firstMatch.cells[0];
            const piece = this.board[firstCell.row][firstCell.col];
            const nextShape = this.getNextShape(piece.shape);
            const nextColor = this.getNextColor(piece.color);

            // 将所有分组的形状和颜色都晋级
            for (const key in shapeColorGroups) {
                shapeColorGroups[key].shapeScore = this.shapeScores[nextShape];
                shapeColorGroups[key].colorMultiplier = this.colorMultipliers[nextColor];
            }
            typeBonus = '(晋级)';
            this.showMatchEffect('T型晋级消除！');
        } else if (matchAnalysis.type === 'L') {
            matchType = 'L型消除';
        } else {
            matchType = '普通消除';
        }

        // 计算每种形状颜色组合的分数
        const scoreDetails = [];
        for (const key in shapeColorGroups) {
            const group = shapeColorGroups[key];
            const groupScore = group.count * group.shapeScore * group.colorMultiplier * specialMultiplier * comboMultiplier;
            totalScore += groupScore;

            const shapeName = this.getShapeName(group.shape);
            const colorName = this.getColorName(group.color);
            scoreDetails.push({
                count: group.count,
                shape: shapeName,
                color: colorName,
                shapeScore: group.shapeScore,
                colorMultiplier: group.colorMultiplier,
                score: groupScore
            });
        }

        // 生成详细的计分公式
        let formulaParts = [];
        for (const detail of scoreDetails) {
            const part = `${detail.count}(${detail.shape}+${detail.color})×${detail.shapeScore}×${detail.colorMultiplier}`;
            if (specialMultiplier > 1) {
                formulaParts.push(part + `×${specialMultiplier}`);
            } else if (typeBonus) {
                formulaParts.push(part + typeBonus);
            } else {
                formulaParts.push(part);
            }
        }

        let formula = formulaParts.join(' + ');
        if (comboMultiplier > 1) {
            formula += ` ×${comboMultiplier}(连击)`;
        }

        // 添加三部曲倍率信息（如果有）
        let tripleInfo = '';
        if (this.tripleComboActive) {
            tripleInfo = ` [三部曲第${this.tripleComboCount + 1}步]`;
        }

        // 添加得分日志
        this.addLog('得分', `${matchType}${tripleInfo} +${Math.floor(totalScore)}分`, 'score', formula);

        return Math.floor(totalScore);
    }

    getShapeName(shape) {
        const names = {
            'triangle': '△',
            'square': '□',
            'circle': '○',
            'star': '★'
        };
        return names[shape] || shape;
    }

    getColorName(color) {
        const names = {
            'green': '绿',
            'blue': '蓝',
            'red': '红'
        };
        return names[color] || color;
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
        let originalPoints = points;
        let tripleMultiplier = null;

        // 检查三部曲倍率
        if (this.tripleComboActive) {
            const multipliers = [0.1, 0.5, 0.8, 1, 1.5, 2, 3];
            tripleMultiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
            const newPoints = Math.ceil(points * tripleMultiplier);
            this.addLog('三部曲',
                `第${this.tripleComboCount + 1}步：${points}分 × ${tripleMultiplier.toFixed(1)} = ${newPoints}分`,
                'combo',
                `${points} × ${tripleMultiplier.toFixed(1)} = ${newPoints}`
            );
            points = newPoints;
            this.tripleComboCount++;
            this.showMatchEffect(`三部曲 x${tripleMultiplier.toFixed(1)} = ${points}分`);

            if (this.tripleComboCount >= 3) {
                this.tripleComboActive = false;
                this.tripleComboCount = 0;
                this.addLog('三部曲', '3步结束，三部曲效果已失效', 'combo');
            }
        }

        this.score += points;
        this.updateScore();

        // 检查是否获得道具（每100分）
        const previousHundreds = Math.floor((this.score - points) / 100);
        const currentHundreds = Math.floor(this.score / 100);

        if (currentHundreds > previousHundreds) {
            this.giveRandomItem();
        }
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
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.add('active');
    }

    restart() {
        this.score = 0;
        this.moves = 30;
        this.selectedCell = null;
        this.isAnimating = false;
        this.comboCount = 0;
        this.tripleComboActive = false;
        this.tripleComboCount = 0;
        this.swapModeActive = false;
        this.firstSwapCell = null;

        // 重置道具（普通道具重置为1，特殊道具重置为0）
        this.items = {
            [ITEM_TYPES.MAGNIFYING_GLASS.id]: 1,
            [ITEM_TYPES.BOMB.id]: 1,
            [ITEM_TYPES.REFRESH.id]: 1,
            [ITEM_TYPES.COLOR_CHANGE.id]: 0,
            [ITEM_TYPES.TRIPLE_COMBO.id]: 0,
            [ITEM_TYPES.SWAP.id]: 0
        };

        this.updateScore();
        this.updateMoves();
        this.createBoard();
        this.renderBoard();
        this.updateItemsDisplay();

        // 清空日志
        if (this.logContent) {
            this.logContent.innerHTML = '';
            this.gameLog = [];
            this.addLog('系统', '游戏开始！普通道具各1个，每100分获得随机奖励', 'system');
        }

        document.getElementById('game-over').classList.remove('active');
    }

    saveAndRestart() {
        const nameInput = document.getElementById('player-name');
        const playerName = nameInput ? nameInput.value.trim() : '';
        this.saveScore(playerName);
        nameInput.value = ''; // 清空输入框
        this.restart();
    }

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

    // 道具系统相关方法
    giveRandomItem() {
        const rand = Math.random();
        const scoreMilestone = Math.floor(this.score / 100) * 100;

        if (rand < 0.75) {
            // 75%概率获得普通道具
            const normalItems = [
                ITEM_TYPES.MAGNIFYING_GLASS,
                ITEM_TYPES.BOMB,
                ITEM_TYPES.REFRESH
            ];
            const item = normalItems[Math.floor(Math.random() * normalItems.length)];
            this.items[item.id]++;
            this.showItemGain(item);
            this.addLog('道具获得',
                `达到${scoreMilestone}分！获得 ${item.icon} ${item.name}（${item.description}）`,
                'item');
        } else if (rand < 0.90) {
            // 15%概率获得特殊道具（0.75-0.90）
            const specialItems = [
                ITEM_TYPES.COLOR_CHANGE,
                ITEM_TYPES.TRIPLE_COMBO,
                ITEM_TYPES.SWAP
            ];
            const item = specialItems[Math.floor(Math.random() * specialItems.length)];
            this.items[item.id]++;
            this.showItemGain(item);
            this.addLog('道具获得',
                `达到${scoreMilestone}分！获得 ${item.icon} ${item.name}（${item.description}）`,
                'item');
        } else {
            // 10%概率获得步数奖励（0.90-1.00）
            this.giveMovesBonus(scoreMilestone);
        }

        this.updateItemsDisplay();
    }

    giveMovesBonus(scoreMilestone) {
        const rand = Math.random();
        let moves = 0;
        let percentage = '';

        if (rand < 0.2) {
            // 10%中的2%：+3步
            moves = 3;
            percentage = '2%';
        } else if (rand < 0.5) {
            // 10%中的3%：+2步
            moves = 2;
            percentage = '3%';
        } else {
            // 10%中的5%：+1步
            moves = 1;
            percentage = '5%';
        }

        this.moves += moves;
        this.updateMoves();
        this.showMatchEffect(`获得步数奖励：+${moves}步！`);
        this.addLog('步数奖励',
            `达到${scoreMilestone}分！幸运触发（${percentage}）获得 +${moves}步（当前${this.moves}步）`,
            'item');
    }

    showItemGain(item) {
        const message = `获得道具: ${item.icon} ${item.name}!`;
        const comboDisplay = document.getElementById('combo-display');
        comboDisplay.textContent = message;
        comboDisplay.classList.add('show');
        comboDisplay.style.color = '#ffd700';
        comboDisplay.style.fontSize = '32px';

        setTimeout(() => {
            comboDisplay.classList.remove('show');
        }, 1500);
    }

    updateItemsDisplay() {
        if (!this.itemsEl) return;

        this.itemsEl.innerHTML = '';

        Object.entries(ITEM_TYPES).forEach(([key, item]) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            itemDiv.innerHTML = `
                <div class="item-icon">${item.icon}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-count">${this.items[item.id]}</div>
            `;

            const button = document.createElement('button');
            button.textContent = '使用';
            button.onclick = () => this.useItem(item.id);
            button.disabled = this.items[item.id] <= 0;

            if (this.items[item.id] > 0) {
                itemDiv.appendChild(button);
            }

            this.itemsEl.appendChild(itemDiv);
            this.itemButtons[item.id] = button;
        });
    }

    useItem(itemId) {
        if (this.items[itemId] <= 0) return;

        switch (itemId) {
            case ITEM_TYPES.MAGNIFYING_GLASS.id:
                this.useMagnifyingGlass();
                break;
            case ITEM_TYPES.BOMB.id:
                this.useBomb();
                break;
            case ITEM_TYPES.REFRESH.id:
                this.useRefresh();
                break;
            case ITEM_TYPES.COLOR_CHANGE.id:
                this.useColorChange();
                break;
            case ITEM_TYPES.TRIPLE_COMBO.id:
                this.useTripleCombo();
                break;
            case ITEM_TYPES.SWAP.id:
                this.useSwap();
                break;
        }
    }

    useMagnifyingGlass() {
        // 找到所有可以消除的方块
        const possibleMatches = this.findAllPossibleMatches();

        if (possibleMatches.length === 0) {
            this.showMatchEffect('没有可消除的方块！');
            this.addLog('放大镜', '没有可消除的方块', 'system');
            return;
        }

        // 随机选择3个，如果不足则全部选择
        const selected = possibleMatches
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        // 清除之前的高亮
        this.clearHighlightedCells();

        // 高亮显示选中的方块（持续到下一次交换）
        selected.forEach(({ row, col }) => {
            const index = row * this.boardSize + col;
            const cell = this.boardEl.children[index];
            if (cell) {
                cell.classList.add('highlighted');
                this.highlightedCells.push({ row, col, cell });
            }
        });

        this.items[ITEM_TYPES.MAGNIFYING_GLASS.id]--;
        this.updateItemsDisplay();
        this.showMatchEffect('找到' + selected.length + '个可消除的方块！');
        this.addLog('放大镜', `找到 ${selected.length} 个可消除的方块（持续到下次交换）`, 'item');
    }

    clearHighlightedCells() {
        this.highlightedCells.forEach(({ cell }) => {
            cell.classList.remove('highlighted');
        });
        this.highlightedCells = [];
    }

    useBomb() {
        // 获取所有可能的3x3区域中心点
        const centers = [];
        for (let row = 1; row < this.boardSize - 1; row++) {
            for (let col = 1; col < this.boardSize - 1; col++) {
                centers.push({ row, col });
            }
        }

        if (centers.length === 0) {
            this.showMatchEffect('无法使用炸弹！');
            return;
        }

        // 随机选择一个中心点
        const center = centers[Math.floor(Math.random() * centers.length)];

        // 炸毁3x3区域
        const destroyed = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const row = center.row + dr;
                const col = center.col + dc;
                if (this.board[row][col]) {
                    this.board[row][col] = null;
                    destroyed.push({ row, col });
                }
            }
        }

        // 播放爆炸动画
        destroyed.forEach(({ row, col }) => {
            const index = row * this.boardSize + col;
            const cell = this.boardEl.children[index];
            if (cell) {
                cell.classList.add('exploded');
                setTimeout(() => cell.classList.remove('exploded'), 500);
            }
        });

        // 下落填充
        setTimeout(async () => {
            await this.dropPieces();
            await this.fillBoard();
            this.processMatches();
        }, 300);

        this.items[ITEM_TYPES.BOMB.id]--;
        this.updateItemsDisplay();
        this.showMatchEffect('爆炸！消除了' + destroyed.length + '个方块！');
        this.addLog('炸弹', `炸除了 ${destroyed.length} 个方块（3×3区域）`, 'item');
    }

    useRefresh() {
        // 刷新所有方块
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                this.board[row][col] = this.getRandomPiece();
            }
        }

        this.renderBoard();
        this.items[ITEM_TYPES.REFRESH.id]--;
        this.updateItemsDisplay();
        this.showMatchEffect('棋盘已刷新！');
        this.addLog('刷新', '重新生成了所有方块', 'item');

        // 检查并消除匹配
        setTimeout(async () => {
            const matches = this.findMatches();
            if (matches.length > 0) {
                this.comboCount = 0;
                await this.processMatches();
            }
        }, 300);
    }

    useColorChange() {
        // 将所有方块改为蓝色
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col]) {
                    this.board[row][col].color = 'blue';
                }
            }
        }

        this.renderBoard();
        this.items[ITEM_TYPES.COLOR_CHANGE.id]--;
        this.updateItemsDisplay();
        this.showMatchEffect('所有方块已变为蓝色！');
        this.addLog('改色', '将所有方块变为蓝色（系数×1.5）', 'item');

        // 检查并消除匹配
        setTimeout(async () => {
            const matches = this.findMatches();
            if (matches.length > 0) {
                this.comboCount = 0;
                await this.processMatches();
            }
        }, 300);
    }

    useTripleCombo() {
        this.tripleComboActive = true;
        this.tripleComboCount = 0;
        this.items[ITEM_TYPES.TRIPLE_COMBO.id]--;
        this.updateItemsDisplay();
        this.showMatchEffect('三部曲激活！接下来三步随机倍率！');
        this.addLog('三部曲', '接下来3步随机倍率（0.1/0.5/0.8/1/1.5/2/3）', 'item');
    }

    useSwap() {
        this.swapModeActive = true;
        this.selectedCell = null;
        this.items[ITEM_TYPES.SWAP.id]--;
        this.updateItemsDisplay();
        this.showMatchEffect('交换模式：点击两个方块进行交换');
        this.addLog('交换', '进入交换模式，可选择任意两个方块交换', 'item');

        // 更新事件监听器
        this.setupSwapEventListeners();
    }

    setupSwapEventListeners() {
        // 临时移除原始事件监听器，使用自定义逻辑
        this.boardEl.removeEventListener('click', this.originalClickHandler);

        this.boardEl.onclick = (e) => {
            // 如果不是交换模式，恢复原始逻辑
            if (!this.swapModeActive) {
                if (this.originalClickHandler) {
                    this.originalClickHandler(e);
                }
                return;
            }

            if (this.isAnimating) return;

            const cell = e.target.closest('.cell');
            if (!cell) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            if (this.firstSwapCell === null) {
                // 选择第一个方块
                this.firstSwapCell = { row, col };
                this.highlightCell(row, col);
                this.showMatchEffect('已选择第一个方块，请选择第二个');
            } else {
                // 选择第二个方块
                const { row: firstRow, col: firstCol } = this.firstSwapCell;

                // 检查是否是同一个方块
                if (firstRow === row && firstCol === col) {
                    this.clearSelection();
                    this.firstSwapCell = null;
                    this.showMatchEffect('取消选择');
                    return;
                }

                // 交换两个方块
                this.swapPiecesWithoutCheck(firstRow, firstCol, row, col);

                this.clearSelection();
                this.firstSwapCell = null;
                this.swapModeActive = false;

                // 恢复原始事件监听器
                this.boardEl.removeEventListener('click', this.boardEl.onclick);
                this.boardEl.addEventListener('click', this.originalClickHandler);
            }
        };
    }

    swapPiecesWithoutCheck(row1, col1, row2, col2) {
        this.isAnimating = true;

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
            this.comboCount = 0;
            this.processMatches().then(() => {
                this.isAnimating = false;
                // 检查游戏是否结束
                if (this.moves <= 0) {
                    this.endGame();
                }
            });
        } else {
            // 没有匹配，换回来
            setTimeout(() => {
                const temp = this.board[row1][col1];
                this.board[row1][col1] = this.board[row2][col2];
                this.board[row2][col2] = temp;
                this.renderBoard();
                this.isAnimating = false;
                this.showMatchEffect('交换后没有可消除的方块！');
            }, 300);
        }
    }

    findAllPossibleMatches() {
        const matches = [];

        // 检查所有可能的交换
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                // 尝试向右交换
                if (col < this.boardSize - 1) {
                    const temp = this.board[row][col];
                    this.board[row][col] = this.board[row][col + 1];
                    this.board[row][col + 1] = temp;

                    if (this.findMatches().length > 0) {
                        matches.push({ row, col });
                        matches.push({ row, col: col + 1 });
                    }

                    // 换回来
                    this.board[row][col + 1] = this.board[row][col];
                    this.board[row][col] = temp;
                }

                // 尝试向下交换
                if (row < this.boardSize - 1) {
                    const temp = this.board[row][col];
                    this.board[row][col] = this.board[row + 1][col];
                    this.board[row + 1][col] = temp;

                    if (this.findMatches().length > 0) {
                        matches.push({ row, col });
                        matches.push({ row: row + 1, col });
                    }

                    // 换回来
                    this.board[row + 1][col] = this.board[row][col];
                    this.board[row][col] = temp;
                }
            }
        }

        // 去重
        const uniqueMatches = [];
        const seen = new Set();
        for (const match of matches) {
            const key = `${match.row},${match.col}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueMatches.push(match);
            }
        }

        return uniqueMatches;
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
                const timeStr = item.time ? ` ${item.time}` : '';
                li.innerHTML = `
                    <span>${index + 1}. ${item.name}</span>
                    <span>${item.score}分</span>
                    <span style="font-size: 11px; color: #999;">${item.date}${timeStr}</span>
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

            <h3>道具系统</h3>
            <p>每局游戏开始时，每个普通道具拥有1个，特殊道具初始为0。每当分数超过100分（100、200、300...）时，会随机获得奖励。</p>

            <h4>普通道具（总概率75%）</h4>
            <table class="rules-table">
                <tr>
                    <th>道具</th>
                    <th>效果</th>
                    <th>概率</th>
                </tr>
                <tr>
                    <td>🔍 放大镜</td>
                    <td>找到随机三个可以消消乐的方块</td>
                    <td>75%/3</td>
                </tr>
                <tr>
                    <td>💣 炸弹</td>
                    <td>炸除3×3的方块</td>
                    <td>75%/3</td>
                </tr>
                <tr>
                    <td>🔄 刷新</td>
                    <td>刷新游戏场地的所有方块</td>
                    <td>75%/3</td>
                </tr>
            </table>

            <h4>特殊道具（总概率15%）</h4>
            <table class="rules-table">
                <tr>
                    <th>道具</th>
                    <th>效果</th>
                    <th>概率</th>
                </tr>
                <tr>
                    <td>🎨 改色</td>
                    <td>将图形的所有颜色，改为蓝色</td>
                    <td>15%/3</td>
                </tr>
                <tr>
                    <td>🎯 三部曲</td>
                    <td>接下来三步，获得的分数随机倍率（0.1-3倍）</td>
                    <td>15%/3</td>
                </tr>
                <tr>
                    <td>🔄 交换</td>
                    <td>可以任意交换两个方块</td>
                    <td>15%/3</td>
                </tr>
            </table>

            <h4>步数奖励（总概率10%）</h4>
            <table class="rules-table">
                <tr>
                    <th>奖励</th>
                    <th>效果</th>
                    <th>概率</th>
                </tr>
                <tr>
                    <td>+3步</td>
                    <td>增加3步游戏步数</td>
                    <td>2%</td>
                </tr>
                <tr>
                    <td>+2步</td>
                    <td>增加2步游戏步数</td>
                    <td>3%</td>
                </tr>
                <tr>
                    <td>+1步</td>
                    <td>增加1步游戏步数</td>
                    <td>5%</td>
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

    // 日志系统相关方法
    initLogDisplay() {
        this.logContainer = document.getElementById('log-container');
        this.logContent = document.getElementById('log-content');
        this.addLog('系统', '游戏开始！普通道具各1个，每100分获得随机道具', 'system');
    }

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
}

// 启动游戏
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new Match3Game();
});
