// 游戏逻辑模块
class GameLogic {
    constructor(game) {
        this.game = game;
    }

    // 计算各个组合的出现概率
    calculateProbabilities() {
        const probs = {};

        // 调整概率：增加红色出现概率
        for (const shape of SHAPES) {
            for (const color of COLORS) {
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

        for (const [key, prob] of Object.entries(this.game.probabilities)) {
            cumulative += prob;
            if (rand <= cumulative) {
                const [shape, color] = key.split('-');
                return { shape, color };
            }
        }

        // 默认返回绿色三角形（最常见）
        return { shape: 'triangle', color: 'green' };
    }

    // 创建棋盘
    createBoard() {
        this.game.board = [];
        for (let row = 0; row < this.game.boardSize; row++) {
            this.game.board[row] = [];
            for (let col = 0; col < this.game.boardSize; col++) {
                this.game.board[row][col] = this.getRandomPiece();
            }
        }

        // 检查初始盘面是否有匹配，如果有则重新生成
        while (this.findMatches().length > 0) {
            for (let row = 0; row < this.game.boardSize; row++) {
                for (let col = 0; col < this.game.boardSize; col++) {
                    this.game.board[row][col] = this.getRandomPiece();
                }
            }
        }

        // 检查是否有可消除的移动，如果没有则重新生成
        let attempts = 0;
        while (!this.hasPossibleMoves() && attempts < 100) {
            for (let row = 0; row < this.game.boardSize; row++) {
                for (let col = 0; col < this.game.boardSize; col++) {
                    this.game.board[row][col] = this.getRandomPiece();
                }
            }

            // 再次检查初始盘面是否有匹配
            while (this.findMatches().length > 0) {
                for (let row = 0; row < this.game.boardSize; row++) {
                    for (let col = 0; col < this.game.boardSize; col++) {
                        this.game.board[row][col] = this.getRandomPiece();
                    }
                }
            }
            attempts++;
        }
    }

    // 检查是否有可以消除的移动
    hasPossibleMoves() {
        // 检查所有可能的交换
        for (let row = 0; row < this.game.boardSize; row++) {
            for (let col = 0; col < this.game.boardSize; col++) {
                // 尝试向右交换
                if (col < this.game.boardSize - 1) {
                    // 临时交换
                    const temp = this.game.board[row][col];
                    this.game.board[row][col] = this.game.board[row][col + 1];
                    this.game.board[row][col + 1] = temp;

                    // 检查是否有匹配
                    const hasMatch = this.findMatches().length > 0;

                    // 换回来
                    this.game.board[row][col + 1] = this.game.board[row][col];
                    this.game.board[row][col] = temp;

                    if (hasMatch) return true;
                }

                // 尝试向下交换
                if (row < this.game.boardSize - 1) {
                    // 临时交换
                    const temp = this.game.board[row][col];
                    this.game.board[row][col] = this.game.board[row + 1][col];
                    this.game.board[row + 1][col] = temp;

                    // 检查是否有匹配
                    const hasMatch = this.findMatches().length > 0;

                    // 换回来
                    this.game.board[row + 1][col] = this.game.board[row][col];
                    this.game.board[row][col] = temp;

                    if (hasMatch) return true;
                }
            }
        }

        return false;
    }

    // 查找匹配
    findMatches() {
        const matches = [];
        const matchedCells = new Set();

        // 检查横向匹配
        for (let row = 0; row < this.game.boardSize; row++) {
            for (let col = 0; col < this.game.boardSize - 2; col++) {
                const piece = this.game.board[row][col];
                if (!piece) continue;

                const match = [{ row, col }];
                let c = col + 1;

                while (c < this.game.boardSize &&
                       this.game.board[row][c] &&
                       this.game.board[row][c].shape === piece.shape &&
                       this.game.board[row][c].color === piece.color) {
                    match.push({ row, col: c });
                    c++;
                }

                if (match.length >= 3) {
                    matches.push({ cells: match, type: 'horizontal' });
                }
            }
        }

        // 检查纵向匹配
        for (let col = 0; col < this.game.boardSize; col++) {
            for (let row = 0; row < this.game.boardSize - 2; row++) {
                const piece = this.game.board[row][col];
                if (!piece) continue;

                const match = [{ row, col }];
                let r = row + 1;

                while (r < this.game.boardSize &&
                       this.game.board[r][col] &&
                       this.game.board[r][col].shape === piece.shape &&
                       this.game.board[r][col].color === piece.color) {
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

    // 处理匹配消除
    async processMatches() {
        let hasMatches = true;
        let totalScore = 0;
        let totalGreenCount = 0;
        let totalRedCount = 0;
        let totalMatchCount = 0;
        const initialScore = this.game.score; // 记录初始分数用于计算三部曲倍率后的实际伤害

        while (hasMatches) {
            const matches = this.findMatches();

            if (matches.length === 0) {
                hasMatches = false;

                // Boss战模式：触发Boss技能
                if (this.game.gameMode === 'boss' && totalMatchCount > 0) {
                    await this.game.bossSystem.triggerBossSkill();
                }

                // 检查是否死局，如果死局则自动刷新
                if (!this.hasPossibleMoves()) {
                    await this.refreshBoard();
                }
                continue;
            }

            this.game.comboCount++;

            // 分析匹配类型
            const matchAnalysis = this.analyzeMatches(matches);

            if (this.game.comboCount > 1) {
                this.game.uiRenderer.showCombo(this.game.comboCount);
            }

            // 计算分数和颜色统计（传入连击数）
            const { score, greenCount, redCount, matchCount } = this.calculateScore(matches, matchAnalysis, this.game.comboCount);
            totalScore += score;
            totalGreenCount += greenCount;
            totalRedCount += redCount;
            totalMatchCount += matchCount;
            this.game.addScore(score);

            // 标记匹配的格子并处理特殊状态
            const matchedCells = new Set();
            const blockedCells = new Set(); // 被阻挡的格子（冻结或小怪未完全消除）
            const skippedMatches = new Set(); // 被跳过的匹配索引（冻结/小怪）

            // 首先检查哪些匹配包含被阻挡的格子
            for (let i = 0; i < matches.length; i++) {
                const match = matches[i];
                let matchBlocked = false;

                for (const cell of match.cells) {
                    const cellKey = `${cell.row},${cell.col}`;
                    const piece = this.game.board[cell.row][cell.col];
                    const bossSystem = this.game.bossSystem;

                    // 检查这个格子是否被阻挡（冻结或小怪）
                    if (bossSystem && (bossSystem.frozenCells.has(cellKey) || bossSystem.monsterCells.has(cellKey))) {
                        matchBlocked = true;
                        break;
                    }
                }

                if (matchBlocked) {
                    // 这个匹配被阻挡，需要处理其中的冻结/小怪格子
                    skippedMatches.add(i);

                    for (const cell of match.cells) {
                        const cellKey = `${cell.row},${cell.col}`;
                        const bossSystem = this.game.bossSystem;

                        // 处理冻结格子（只减少计数，不消除）
                        if (bossSystem && bossSystem.frozenCells.has(cellKey)) {
                            const remaining = bossSystem.frozenCells.get(cellKey) - 1;
                            if (remaining <= 0) {
                                bossSystem.frozenCells.delete(cellKey);
                                // 冻结解除，但方块保留在棋盘上
                            } else {
                                bossSystem.frozenCells.set(cellKey, remaining);
                                blockedCells.add(cellKey);
                            }
                        }

                        // 处理小怪格子（只减少HP，不消除）
                        if (bossSystem && bossSystem.monsterCells.has(cellKey)) {
                            const hp = bossSystem.monsterCells.get(cellKey) - 1;
                            if (hp <= 0) {
                                bossSystem.monsterCells.delete(cellKey);
                                // 小怪被击败，但方块保留在棋盘上
                            } else {
                                bossSystem.monsterCells.set(cellKey, hp);
                                blockedCells.add(cellKey);
                            }
                        }
                    }
                }
            }

            // 处理未被阻挡的匹配
            for (let i = 0; i < matches.length; i++) {
                if (skippedMatches.has(i)) continue; // 跳过被阻挡的匹配（冻结/小怪）

                const match = matches[i];
                for (const cell of match.cells) {
                    const cellKey = `${cell.row},${cell.col}`;
                    const bossSystem = this.game.bossSystem;

                    // 处理毒素格子（毒素不影响消除，只是扣血）
                    if (bossSystem && bossSystem.poisonedCells.has(cellKey)) {
                        const piece = this.game.board[cell.row][cell.col];
                        if (piece) {
                            const baseDamage = SHAPE_SCORES[piece.shape] * COLOR_MULTIPLIERS[piece.color];
                            bossSystem.playerHp -= Math.ceil(baseDamage);
                            this.game.logSystem.addLog('毒素伤害', `中毒方块扣除${Math.ceil(baseDamage)}点生命`, 'system');
                            bossSystem.poisonedCells.delete(cellKey);

                            if (bossSystem.playerHp <= 0) {
                                bossSystem.playerHp = 0;
                                this.game.uiRenderer.updateBossUI(bossSystem);
                                this.game.endGame(false);
                                return;
                            }
                        }
                    }

                    matchedCells.add(cellKey);
                }
            }

            // 如果有被阻挡的格子，需要重新渲染棋盘以更新冻结/小怪状态
            if (blockedCells.size > 0) {
                this.game.uiRenderer.renderBoard(this.game);
            }

            // 播放消除动画
            for (const cellKey of matchedCells) {
                const [row, col] = cellKey.split(',').map(Number);
                const index = row * this.game.boardSize + col;
                const cellEl = this.game.boardEl.children[index];
                if (cellEl) {
                    cellEl.classList.add('matched');
                }
            }

            await this.game.delay(300);

            // 清除匹配的格子
            for (const cellKey of matchedCells) {
                const [row, col] = cellKey.split(',').map(Number);
                this.game.board[row][col] = null;
            }

            // 处理炸弹倒计时
            const bossSystem = this.game.bossSystem;
            if (bossSystem) {
                for (const [cellKey, countdown] of bossSystem.bombCells.entries()) {
                    const newCountdown = countdown - 1;
                    if (newCountdown <= 0) {
                        // 炸弹爆炸，扣除步数
                        this.game.moves = Math.max(0, this.game.moves - 3);
                        this.game.uiRenderer.updateMoves(this.game.moves, bossSystem.initialMoves, this.game.gameMode);
                        bossSystem.bombCells.delete(cellKey);
                        this.game.uiRenderer.showMatchEffect('炸弹爆炸！扣除3步！');
                        this.game.logSystem.addLog('炸弹', '倒计时归零，扣除3步', 'system');
                    } else {
                        bossSystem.bombCells.set(cellKey, newCountdown);
                    }
                }
            }

            // 下落填充
            await this.dropPieces();
            await this.fillBoard();

            await this.game.delay(200);
        }

        // Boss战模式：玩家攻击Boss
        if (this.game.gameMode === 'boss' && totalMatchCount > 0) {
            // 使用实际增加的分数（包括三部曲倍率）
            const actualDamage = this.game.score - initialScore;
            await this.game.bossSystem.playerAttackBoss(actualDamage, totalGreenCount, totalRedCount, totalMatchCount);
            this.game.uiRenderer.updateBossUI(this.game.bossSystem);
        }
    }

    // 计算分数
    calculateScore(matches, matchAnalysis, comboCount) {
        let totalScore = 0;
        let greenCount = 0;
        let redCount = 0;
        let matchCount = 0;

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
                    const piece = this.game.board[cell.row][cell.col];
                    if (piece) {
                        // 统计绿色方块总分（用于回血）和红色方块数量（用于封印）
                        if (piece.color === 'green') {
                            greenCount += SHAPE_SCORES[piece.shape];
                        } else if (piece.color === 'red') {
                            redCount += 1; // 红色方块数量+1
                        }
                        matchCount++;

                        const groupKey = `${piece.shape}-${piece.color}`;
                        if (!shapeColorGroups[groupKey]) {
                            shapeColorGroups[groupKey] = {
                                shape: piece.shape,
                                color: piece.color,
                                count: 0,
                                shapeScore: SHAPE_SCORES[piece.shape],
                                colorMultiplier: COLOR_MULTIPLIERS[piece.color]
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
            this.game.uiRenderer.showMatchEffect('五连消除！');
        } else if (matchAnalysis.type === 'special') {
            matchType = 'T型晋级消除';
            // T型特殊消除：使用晋级后的分数
            const firstMatch = matches[0];
            const firstCell = firstMatch.cells[0];
            const piece = this.game.board[firstCell.row][firstCell.col];
            const nextShape = this.getNextShape(piece.shape);
            const nextColor = this.getNextColor(piece.color);

            // 将所有分组的形状和颜色都晋级
            for (const key in shapeColorGroups) {
                shapeColorGroups[key].shapeScore = SHAPE_SCORES[nextShape];
                shapeColorGroups[key].colorMultiplier = COLOR_MULTIPLIERS[nextColor];
            }
            typeBonus = '(晋级)';
            this.game.uiRenderer.showMatchEffect('T型晋级消除！');
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

            const shapeName = SHAPE_NAMES[group.shape];
            const colorName = COLOR_NAMES[group.color];
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
        if (this.game.itemSystem.tripleComboActive) {
            tripleInfo = ` [三部曲第${this.game.itemSystem.tripleComboCount + 1}步]`;
        }

        // 添加得分日志
        this.game.logSystem.addLog('得分', `${matchType}${tripleInfo} +${Math.floor(totalScore)}分`, 'score', formula);

        return { score: Math.floor(totalScore), greenCount, redCount, matchCount };
    }

    // 获取下一个形状
    getNextShape(shape) {
        const index = SHAPE_PROGRESSION.indexOf(shape);
        if (index < SHAPE_PROGRESSION.length - 1) {
            return SHAPE_PROGRESSION[index + 1];
        }
        return shape; // 星星已经是最高的
    }

    // 获取下一个颜色
    getNextColor(color) {
        const index = COLOR_PROGRESSION.indexOf(color);
        if (index < COLOR_PROGRESSION.length - 1) {
            return COLOR_PROGRESSION[index + 1];
        }
        return color; // 红色已经是最高的
    }

    // 方块下落
    async dropPieces() {
        const drops = []; // 记录每个格子的下落距离

        for (let col = 0; col < this.game.boardSize; col++) {
            for (let row = this.game.boardSize - 1; row >= 0; row--) {
                if (this.game.board[row][col] === null) {
                    // 向上寻找非空格子
                    for (let r = row - 1; r >= 0; r--) {
                        if (this.game.board[r][col] !== null) {
                            this.game.board[row][col] = this.game.board[r][col];
                            this.game.board[r][col] = null;
                            drops.push({ row, col, fromRow: r });
                            break;
                        }
                    }
                }
            }
        }

        if (drops.length > 0) {
            // 只更新有变化的格子
            this.game.uiRenderer.updateChangedCells([]);
            await this.game.delay(200);
        }
    }

    // 填充棋盘
    async fillBoard() {
        const newPieces = []; // 记录新生成的格子

        for (let col = 0; col < this.game.boardSize; col++) {
            for (let row = 0; row < this.game.boardSize; row++) {
                if (this.game.board[row][col] === null) {
                    this.game.board[row][col] = this.getRandomPiece();
                    newPieces.push({ row, col });
                }
            }
        }

        if (newPieces.length > 0) {
            // 只更新新生成的格子
            this.game.uiRenderer.updateChangedCells(newPieces);
            await this.game.delay(200);
        }
    }

    // 刷新棋盘（死局时调用）
    async refreshBoard() {
        this.game.uiRenderer.showMatchEffect('死局刷新！');

        // 重新生成棋盘
        for (let row = 0; row < this.game.boardSize; row++) {
            for (let col = 0; col < this.game.boardSize; col++) {
                this.game.board[row][col] = this.getRandomPiece();
            }
        }

        // 确保没有初始匹配
        while (this.findMatches().length > 0) {
            for (let row = 0; row < this.game.boardSize; row++) {
                for (let col = 0; col < this.game.boardSize; col++) {
                    this.game.board[row][col] = this.getRandomPiece();
                }
            }
        }

        // 确保有可消除的移动
        let attempts = 0;
        while (!this.hasPossibleMoves() && attempts < 100) {
            for (let row = 0; row < this.game.boardSize; row++) {
                for (let col = 0; col < this.game.boardSize; col++) {
                    this.game.board[row][col] = this.getRandomPiece();
                }
            }

            while (this.findMatches().length > 0) {
                for (let row = 0; row < this.game.boardSize; row++) {
                    for (let col = 0; col < this.game.boardSize; col++) {
                        this.game.board[row][col] = this.getRandomPiece();
                    }
                }
            }
            attempts++;
        }

        this.game.uiRenderer.renderBoard(this.game);
        await this.game.delay(500);
    }

    // 检查两个格子是否相邻
    areAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    // 交换方块
    async swapPieces(row1, col1, row2, col2) {
        this.game.isAnimating = true;
        this.game.uiRenderer.clearSelection();

        // 交换
        const temp = this.game.board[row1][col1];
        this.game.board[row1][col1] = this.game.board[row2][col2];
        this.game.board[row2][col2] = temp;

        this.game.uiRenderer.renderBoard(this.game);

        // 检查是否有匹配
        const matches = this.findMatches();

        if (matches.length > 0) {
            this.game.moves--;
            this.game.uiRenderer.updateMoves(this.game.moves, this.game.bossSystem ? this.game.bossSystem.initialMoves : 30, this.game.gameMode);
            this.game.comboCount = 0; // 重置连击计数
            await this.processMatches();
        } else {
            // 没有匹配，换回来
            await this.game.delay(200);
            const temp = this.game.board[row1][col1];
            this.game.board[row1][col1] = this.game.board[row2][col2];
            this.game.board[row2][col2] = temp;
            this.game.uiRenderer.renderBoard(this.game);
        }

        this.game.isAnimating = false;

        // 检查游戏是否结束
        if (this.game.moves <= 0) {
            this.game.endGame();
        }
    }
}
