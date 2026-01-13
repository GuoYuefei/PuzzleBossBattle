// 道具系统模块
class ItemSystem {
    constructor(game) {
        this.game = game;

        // 道具数量
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
        this.swapClickHandler = null; // 交换模式的事件处理器
        this.highlightedCells = []; // 存储放大镜高亮的方块
    }

    // 更新道具显示
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

    // 使用道具
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

    // 使用放大镜
    useMagnifyingGlass() {
        // 找到所有可以消除的方块
        const possibleMatches = this.findAllPossibleMatches();

        if (possibleMatches.length === 0) {
            this.game.uiRenderer.showMatchEffect('没有可消除的方块！');
            this.game.logSystem.addLog('放大镜', '没有可消除的方块', 'system');
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
            const index = row * this.game.boardSize + col;
            const cell = this.game.boardEl.children[index];
            if (cell) {
                cell.classList.add('highlighted');
                this.highlightedCells.push({ row, col, cell });
            }
        });

        this.items[ITEM_TYPES.MAGNIFYING_GLASS.id]--;
        this.updateItemsDisplay();
        this.game.uiRenderer.showMatchEffect('找到' + selected.length + '个可消除的方块！');
        this.game.logSystem.addLog('放大镜', `找到 ${selected.length} 个可消除的方块（持续到下次交换）`, 'item');
    }

    // 清除高亮的方块
    clearHighlightedCells() {
        this.highlightedCells.forEach(({ cell }) => {
            cell.classList.remove('highlighted');
        });
        this.highlightedCells = [];
    }

    // 使用炸弹
    useBomb() {
        // 获取所有可能的3x3区域中心点
        const centers = [];
        for (let row = 1; row < this.game.boardSize - 1; row++) {
            for (let col = 1; col < this.game.boardSize - 1; col++) {
                centers.push({ row, col });
            }
        }

        if (centers.length === 0) {
            this.game.uiRenderer.showMatchEffect('无法使用炸弹！');
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
                if (this.game.board[row][col]) {
                    this.game.board[row][col] = null;
                    destroyed.push({ row, col });
                }
            }
        }

        // 播放爆炸动画
        destroyed.forEach(({ row, col }) => {
            const index = row * this.game.boardSize + col;
            const cell = this.game.boardEl.children[index];
            if (cell) {
                cell.classList.add('exploded');
                setTimeout(() => cell.classList.remove('exploded'), 500);
            }
        });

        // 下落填充
        setTimeout(async () => {
            await this.game.gameLogic.dropPieces();
            await this.game.gameLogic.fillBoard();
            this.game.gameLogic.processMatches();
        }, 300);

        this.items[ITEM_TYPES.BOMB.id]--;
        this.updateItemsDisplay();
        this.game.uiRenderer.showMatchEffect('爆炸！消除了' + destroyed.length + '个方块！');
        this.game.logSystem.addLog('炸弹', `炸除了 ${destroyed.length} 个方块（3×3区域）`, 'item');
    }

    // 使用刷新道具
    useRefresh() {
        // 刷新所有方块
        for (let row = 0; row < this.game.boardSize; row++) {
            for (let col = 0; col < this.game.boardSize; col++) {
                this.game.board[row][col] = this.game.gameLogic.getRandomPiece();
            }
        }

        this.game.uiRenderer.renderBoard(this.game);
        this.items[ITEM_TYPES.REFRESH.id]--;
        this.updateItemsDisplay();
        this.game.uiRenderer.showMatchEffect('棋盘已刷新！');
        this.game.logSystem.addLog('刷新', '重新生成了所有方块', 'item');

        // 检查并消除匹配
        setTimeout(async () => {
            const matches = this.game.gameLogic.findMatches();
            if (matches.length > 0) {
                this.game.comboCount = 0;
                await this.game.gameLogic.processMatches();
            }
        }, 300);
    }

    // 使用改色道具
    useColorChange() {
        // 将所有方块改为蓝色
        for (let row = 0; row < this.game.boardSize; row++) {
            for (let col = 0; col < this.game.boardSize; col++) {
                if (this.game.board[row][col]) {
                    this.game.board[row][col].color = 'blue';
                }
            }
        }

        this.game.uiRenderer.renderBoard(this.game);
        this.items[ITEM_TYPES.COLOR_CHANGE.id]--;
        this.updateItemsDisplay();
        this.game.uiRenderer.showMatchEffect('所有方块已变为蓝色！');
        this.game.logSystem.addLog('改色', '将所有方块变为蓝色（系数×1.5）', 'item');

        // 检查并消除匹配
        setTimeout(async () => {
            const matches = this.game.gameLogic.findMatches();
            if (matches.length > 0) {
                this.game.comboCount = 0;
                await this.game.gameLogic.processMatches();
            }
        }, 300);
    }

    // 使用三部曲道具
    useTripleCombo() {
        this.tripleComboActive = true;
        this.tripleComboCount = 0;
        this.items[ITEM_TYPES.TRIPLE_COMBO.id]--;
        this.updateItemsDisplay();
        this.game.uiRenderer.showMatchEffect('三部曲激活！接下来三步随机倍率！');
        this.game.logSystem.addLog('三部曲', '接下来3步随机倍率（0.5/0.8/1/1.5/2/3/5）', 'item');
    }

    // 使用交换道具
    useSwap() {
        this.swapModeActive = true;
        this.game.selectedCell = null;
        this.items[ITEM_TYPES.SWAP.id]--;
        this.updateItemsDisplay();
        this.game.uiRenderer.showMatchEffect('交换模式：点击两个方块进行交换');
        this.game.logSystem.addLog('交换', '进入交换模式，可选择任意两个方块交换', 'item');

        // 更新事件监听器
        this.setupSwapEventListeners();
    }

    // 设置交换模式事件监听器
    setupSwapEventListeners() {
        // 临时移除原始事件监听器
        this.game.boardEl.removeEventListener('click', this.game.originalClickHandler);

        // 创建交换模式的事件处理器
        this.swapClickHandler = (e) => {
            if (this.game.isAnimating) return;

            const cell = e.target.closest('.cell');
            if (!cell) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            if (this.firstSwapCell === null) {
                // 选择第一个方块
                this.firstSwapCell = { row, col };
                this.game.uiRenderer.highlightCell(row, col);
                this.game.uiRenderer.showMatchEffect('已选择第一个方块，请选择第二个');
            } else {
                // 选择第二个方块
                const { row: firstRow, col: firstCol } = this.firstSwapCell;

                // 检查是否是同一个方块
                if (firstRow === row && firstCol === col) {
                    this.game.uiRenderer.clearSelection();
                    this.firstSwapCell = null;
                    this.game.uiRenderer.showMatchEffect('取消选择');
                    return;
                }

                // 交换两个方块
                this.swapPiecesWithoutCheck(firstRow, firstCol, row, col);

                this.game.uiRenderer.clearSelection();
                this.firstSwapCell = null;
                this.swapModeActive = false;

                // 恢复原始事件监听器
                this.game.boardEl.removeEventListener('click', this.swapClickHandler);
                this.game.boardEl.addEventListener('click', this.game.originalClickHandler);
                this.swapClickHandler = null;
            }
        };

        // 添加交换模式的事件监听器
        this.game.boardEl.addEventListener('click', this.swapClickHandler);
    }

    // 交换方块（不检查是否相邻）
    swapPiecesWithoutCheck(row1, col1, row2, col2) {
        this.game.isAnimating = true;

        // 交换
        const temp = this.game.board[row1][col1];
        this.game.board[row1][col1] = this.game.board[row2][col2];
        this.game.board[row2][col2] = temp;

        this.game.uiRenderer.renderBoard(this.game);

        // 检查是否有匹配
        const matches = this.game.gameLogic.findMatches();

        if (matches.length > 0) {
            this.game.moves--;
            this.game.uiRenderer.updateMoves(this.game.moves, this.game.bossSystem ? this.game.bossSystem.initialMoves : 30, this.game.gameMode);
            this.game.comboCount = 0;
            this.game.gameLogic.processMatches().then(() => {
                this.game.isAnimating = false;
                // 检查游戏是否结束
                if (this.game.moves <= 0) {
                    // 步数到0时，Boss战模式视为失败，经典模式正常结束
                    const isVictory = this.game.gameMode !== 'boss';
                    this.game.endGame(isVictory);
                }
            });
        } else {
            // 没有匹配，换回来
            setTimeout(() => {
                const temp = this.game.board[row1][col1];
                this.game.board[row1][col1] = this.game.board[row2][col2];
                this.game.board[row2][col2] = temp;
                this.game.uiRenderer.renderBoard(this.game);
                this.game.isAnimating = false;
                this.game.uiRenderer.showMatchEffect('交换后没有可消除的方块！');
            }, 300);
        }
    }

    // 找到所有可消除的方块
    findAllPossibleMatches() {
        const matches = [];

        // 检查所有可能的交换
        for (let row = 0; row < this.game.boardSize; row++) {
            for (let col = 0; col < this.game.boardSize; col++) {
                // 尝试向右交换
                if (col < this.game.boardSize - 1) {
                    const temp = this.game.board[row][col];
                    this.game.board[row][col] = this.game.board[row][col + 1];
                    this.game.board[row][col + 1] = temp;

                    if (this.game.gameLogic.findMatches().length > 0) {
                        matches.push({ row, col });
                        matches.push({ row, col: col + 1 });
                    }

                    // 换回来
                    this.game.board[row][col + 1] = this.game.board[row][col];
                    this.game.board[row][col] = temp;
                }

                // 尝试向下交换
                if (row < this.game.boardSize - 1) {
                    const temp = this.game.board[row][col];
                    this.game.board[row][col] = this.game.board[row + 1][col];
                    this.game.board[row + 1][col] = temp;

                    if (this.game.gameLogic.findMatches().length > 0) {
                        matches.push({ row, col });
                        matches.push({ row: row + 1, col });
                    }

                    // 换回来
                    this.game.board[row + 1][col] = this.game.board[row][col];
                    this.game.board[row][col] = temp;
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

    // 随机给道具
    giveRandomItem() {
        const rand = Math.random();
        const scoreMilestone = Math.floor(this.game.score / 100) * 100;

        if (rand < ITEM_PROBABILITIES.normal) {
            // 普通道具概率
            const normalItems = [
                ITEM_TYPES.MAGNIFYING_GLASS,
                ITEM_TYPES.BOMB,
                ITEM_TYPES.REFRESH
            ];
            const item = normalItems[Math.floor(Math.random() * normalItems.length)];
            this.items[item.id]++;
            this.showItemGain(item);
            this.game.logSystem.addLog('道具获得',
                `达到${scoreMilestone}分！获得 ${item.icon} ${item.name}（${item.description}）`,
                'item');
        } else if (rand < ITEM_PROBABILITIES.normal + ITEM_PROBABILITIES.special) {
            // 特殊道具概率
            const specialItems = [
                ITEM_TYPES.COLOR_CHANGE,
                ITEM_TYPES.TRIPLE_COMBO,
                ITEM_TYPES.SWAP
            ];
            const item = specialItems[Math.floor(Math.random() * specialItems.length)];
            this.items[item.id]++;
            this.showItemGain(item);
            this.game.logSystem.addLog('道具获得',
                `达到${scoreMilestone}分！获得 ${item.icon} ${item.name}（${item.description}）`,
                'item');
        } else {
            // 步数奖励概率
            this.giveMovesBonus(scoreMilestone);
        }

        this.updateItemsDisplay();
    }

    // 给步数奖励
    giveMovesBonus(scoreMilestone) {
        const rand = Math.random();
        let moves = 0;
        let percentage = '';

        if (rand < MOVES_BONUS_PROBABILITIES.threeSteps) {
            // +3步
            moves = MOVES_BONUS_VALUES.threeSteps;
            percentage = '2%';
        } else if (rand < MOVES_BONUS_PROBABILITIES.threeSteps + MOVES_BONUS_PROBABILITIES.twoSteps) {
            // +2步
            moves = MOVES_BONUS_VALUES.twoSteps;
            percentage = '3%';
        } else {
            // +1步
            moves = MOVES_BONUS_VALUES.oneStep;
            percentage = '5%';
        }

        this.game.moves += moves;
        this.game.uiRenderer.updateMoves(this.game.moves, this.game.bossSystem ? this.game.bossSystem.initialMoves : CLASSIC_MOVES, this.game.gameMode);
        this.game.uiRenderer.showMatchEffect(`获得步数奖励：+${moves}步！`);
        this.game.logSystem.addLog('步数奖励',
            `达到${scoreMilestone}分！幸运触发（${percentage}）获得 +${moves}步（当前${this.game.moves}步）`,
            'item');
    }

    // 显示获得道具
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

    // 检查三部曲倍率
    checkTripleCombo(points) {
        let actualPoints = points;

        if (this.tripleComboActive) {
            const multipliers = [0.5, 0.8, 1, 1.5, 2, 3, 5];
            const tripleMultiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
            const newPoints = Math.ceil(points * tripleMultiplier);
            this.game.logSystem.addLog('三部曲',
                `第${this.tripleComboCount + 1}步：${points}分 × ${tripleMultiplier.toFixed(1)} = ${newPoints}分`,
                'combo',
                `${points} × ${tripleMultiplier.toFixed(1)} = ${newPoints}`
            );
            actualPoints = newPoints;
            this.tripleComboCount++;
            this.game.uiRenderer.showMatchEffect(`三部曲 x${tripleMultiplier.toFixed(1)} = ${actualPoints}分`);

            if (this.tripleComboCount >= 3) {
                this.tripleComboActive = false;
                this.tripleComboCount = 0;
                this.game.logSystem.addLog('三部曲', '3步结束，三部曲效果已失效', 'combo');
            }
        }

        return actualPoints;
    }

    // 重置道具系统
    reset() {
        this.items = {
            [ITEM_TYPES.MAGNIFYING_GLASS.id]: 1,
            [ITEM_TYPES.BOMB.id]: 1,
            [ITEM_TYPES.REFRESH.id]: 1,
            [ITEM_TYPES.COLOR_CHANGE.id]: 0,
            [ITEM_TYPES.TRIPLE_COMBO.id]: 0,
            [ITEM_TYPES.SWAP.id]: 0
        };
        this.tripleComboActive = false;
        this.tripleComboCount = 0;
        this.swapModeActive = false;
        this.firstSwapCell = null;
        this.highlightedCells = [];
    }
}
