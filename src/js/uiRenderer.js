// UI渲染模块
class UIRenderer {
    constructor(game) {
        this.game = game;
    }

    // 渲染棋盘
    renderBoard(game) {
        game.boardEl.innerHTML = '';

        for (let row = 0; row < game.boardSize; row++) {
            for (let col = 0; col < game.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const cellKey = `${row},${col}`;
                const piece = game.board[row][col];

                // 处理特殊格子状态
                if (game.bossSystem && game.bossSystem.frozenCells.has(cellKey)) {
                    cell.classList.add('frozen-cell');
                }

                if (game.bossSystem && game.bossSystem.poisonedCells.has(cellKey)) {
                    cell.classList.add('poisoned-cell');
                }

                if (game.bossSystem && game.bossSystem.monsterCells.has(cellKey)) {
                    cell.classList.add('monster-cell');
                    cell.dataset.hp = game.bossSystem.monsterCells.get(cellKey);
                }

                if (game.bossSystem && game.bossSystem.bombCells.has(cellKey)) {
                    cell.classList.add('bomb-cell');
                    cell.dataset.countdown = game.bossSystem.bombCells.get(cellKey);
                }

                if (piece) {
                    const pieceEl = this.createPieceElement(piece);
                    cell.appendChild(pieceEl);
                }

                game.boardEl.appendChild(cell);
            }
        }
    }

    // 创建图形元素
    createPieceElement(piece) {
        const pieceEl = document.createElement('div');

        // 根据格子大小动态调整图形尺寸，让图形在格子里更大
        const size = Math.max(22, Math.floor(100 / this.game.boardSize * 1.1));

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

    // 获取颜色代码
    getColorCode(color) {
        return COLOR_CODES[color] || '#2ecc71';
    }

    // 高亮格子
    highlightCell(row, col) {
        const index = row * this.game.boardSize + col;
        const cell = this.game.boardEl.children[index];
        cell.classList.add('selected');
    }

    // 清除选择
    clearSelection() {
        const selected = this.game.boardEl.querySelector('.selected');
        if (selected) {
            selected.classList.remove('selected');
        }
        this.game.selectedCell = null;
    }

    // 更新分数
    updateScore(score) {
        this.game.scoreEl.textContent = score;
    }

    // 更新步数
    updateMoves(moves, initialMoves, gameMode) {
        if (gameMode === 'boss') {
            this.game.movesEl.textContent = `${moves}步`;
        } else {
            this.game.movesEl.textContent = moves;
        }
    }

    // 显示连击
    showCombo(combo) {
        const comboDisplay = document.getElementById('combo-display');
        const multiplier = Math.min(combo, 5);
        comboDisplay.textContent = `连击 x${multiplier}!`;
        comboDisplay.classList.add('show');

        setTimeout(() => {
            comboDisplay.classList.remove('show');
        }, 800);
    }

    // 显示匹配效果
    showMatchEffect(text) {
        const comboDisplay = document.getElementById('combo-display');
        comboDisplay.textContent = text;
        comboDisplay.classList.add('show');

        setTimeout(() => {
            comboDisplay.classList.remove('show');
        }, 800);
    }

    // 显示技能动画
    showSkillAnimation(text) {
        const anim = document.createElement('div');
        anim.className = 'skill-animation';
        anim.textContent = text;
        document.body.appendChild(anim);

        setTimeout(() => {
            document.body.removeChild(anim);
        }, 1500);
    }

    // 显示伤害数字
    showDamageNumber(damage, type) {
        const dmgEl = document.createElement('div');
        dmgEl.className = `damage-number ${type}`;

        // 随机位置在屏幕中央附近
        const x = 50 + (Math.random() - 0.5) * 20;
        const y = 50 + (Math.random() - 0.5) * 20;

        dmgEl.style.left = x + '%';
        dmgEl.style.top = y + '%';
        dmgEl.textContent = type === 'heal' ? `+${damage}` : `-${damage}`;

        document.body.appendChild(dmgEl);

        setTimeout(() => {
            document.body.removeChild(dmgEl);
        }, 1000);
    }

    // 更新Boss UI
    updateBossUI(bossSystem) {
        if (!bossSystem.boss) return;

        // 更新Boss基本信息
        document.getElementById('boss-avatar').textContent = bossSystem.boss.avatar;
        document.getElementById('boss-name').textContent = bossSystem.boss.name;
        document.getElementById('boss-level').textContent = `第${bossSystem.bossLevel}关`;

        // 更新Boss血条
        const bossHpPercent = (bossSystem.boss.hp / bossSystem.boss.maxHp) * 100;
        const bossHpFill = document.getElementById('boss-hp-fill');
        bossHpFill.style.width = bossHpPercent + '%';
        bossHpFill.classList.toggle('shielded', bossSystem.boss.shield > 0);
        // 血量文本单独更新
        document.getElementById('boss-hp-text').textContent = `${bossSystem.boss.hp}/${bossSystem.boss.maxHp}`;

        // 更新Boss护盾
        const shieldPercent = bossSystem.boss.shield > 0 ? (bossSystem.boss.shield / bossSystem.boss.maxHp) * 100 : 0;
        const shieldFill = document.getElementById('boss-shield-fill');
        shieldFill.style.width = shieldPercent + '%';

        // 更新玩家血条
        const playerHpPercent = (bossSystem.playerHp / bossSystem.playerMaxHp) * 100;
        document.getElementById('player-hp-fill').style.width = playerHpPercent + '%';
        document.getElementById('player-hp-text').textContent = `${bossSystem.playerHp}/${bossSystem.playerMaxHp}`;

        // 更新技能封印状态（Boss技能被封印）
        const sealIndicator = document.getElementById('skill-seal-indicator');
        const bossAvatar = document.getElementById('boss-avatar');
        if (bossSystem.bossSkillSealed > 0) {
            sealIndicator.classList.add('active');
            document.getElementById('seal-remaining').textContent = bossSystem.bossSkillSealed;
            bossAvatar.classList.add('sealed');
        } else {
            sealIndicator.classList.remove('active');
            bossAvatar.classList.remove('sealed');
        }
    }

    // 更新有变化的格子，避免全盘刷新
    updateChangedCells(newPieces = []) {
        for (let row = 0; row < this.game.boardSize; row++) {
            for (let col = 0; col < this.game.boardSize; col++) {
                const index = row * this.game.boardSize + col;
                const cellEl = this.game.boardEl.children[index];

                if (!cellEl) continue;

                // 清空格子
                cellEl.innerHTML = '';
                cellEl.className = 'cell';

                const piece = this.game.board[row][col];
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

    // 显示模态框
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

    // 关闭模态框
    closeModal() {
        document.getElementById('modal').classList.remove('active');
    }

    // 显示排行榜
    showRanking(rankings) {
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
            this.showRanking([]);
        };

        const container = document.createElement('div');
        container.appendChild(rankingsList);
        container.appendChild(clearBtn);

        this.showModal('排行榜', container);
    }

    // 显示规则
    showRules(gameMode, bossLevel) {
        const isBossMode = gameMode === 'boss';

        let rulesHTML = `
            <h3>游戏模式</h3>
            <p>当前模式：<strong>${isBossMode ? 'Boss战模式' : '经典模式'}</strong></p>
            <p>点击上方的模式按钮可以切换游戏模式。</p>

            <h3>基本规则</h3>
            <p>交换相邻的图形，使3个或更多相同图形连成一线即可消除。</p>

            ${isBossMode ? this.getBossModeRules(bossLevel) : this.getClassicModeRules()}
        `;

        this.showModal('游戏规则', rulesHTML);
    }

    // 获取Boss战模式规则
    getBossModeRules(bossLevel) {
        return `
            <h3>Boss战模式说明</h3>
            <p>共有70关，每关Boss血量增加100。击败Boss进入下一关。</p>

            <h3>Boss技能触发率</h3>
            <table class="rules-table">
                <tr><th>关卡</th><th>技能触发率</th></tr>
                <tr><td>1-9关</td><td>10%</td></tr>
                <tr><td>10关</td><td>30%</td></tr>
                <tr><td>11-19关</td><td>20%</td></tr>
                <tr><td>20关</td><td>40%</td></tr>
                <tr><td>21-29关</td><td>30%</td></tr>
                <tr><td>30关</td><td>50%</td></tr>
                <tr><td>...</td><td>...</td></tr>
                <tr><td>70关</td><td>90%</td></tr>
            </table>

            <h3>Boss技能</h3>
            <h4>棋盘干扰</h4>
            <table class="rules-table">
                <tr><th>技能</th><th>效果</th><th>概率</th></tr>
                <tr><td>冻结覆盖</td><td>冻结3-5个方块，需消除3次解冻</td><td>3%</td></tr>
                <tr><td>毒素蔓延</td><td>使1-10个方块含毒素，消除扣血</td><td>2%</td></tr>
            </table>

            <h4>目标干扰</h4>
            <table class="rules-table">
                <tr><th>技能</th><th>效果</th><th>概率</th></tr>
                <tr><td>召唤小怪</td><td>生成需多次消除的小怪块</td><td>3%</td></tr>
                <tr><td>护盾生成</td><td>Boss获得护盾</td><td>7%</td></tr>
                <tr><td>元素转换</td><td>将40%的图形随机转换成其他形状</td><td>1%</td></tr>
            </table>

            <h4>直接攻击</h4>
            <table class="rules-table">
                <tr><th>技能</th><th>效果</th><th>概率</th></tr>
                <tr><td>倒计时攻击</td><td>放置炸弹，归零扣步数</td><td>1%</td></tr>
                <tr><td>普通攻击</td><td>每次消除可能发生，造成Boss血量1%伤害</td><td>20%</td></tr>
            </table>

            <h3>玩家攻击与特殊效果</h3>
            <table class="rules-table">
                <tr><th>颜色</th><th>效果</th></tr>
                <tr><td>绿色方块</td><td>消除后回血（分数×20%，向上取整）</td></tr>
                <tr><td>红色方块</td><td>消除图案数量封印Boss技能相应回合数</td></tr>
                <tr><td>任意颜色</td><td>消除后对Boss造成分数点伤害</td></tr>
            </table>

            <h3>回合说明</h3>
            <p>每次消除就是一回合，消除后Boss可能触发技能。Boss技能后会自动判活确保棋盘可玩。</p>
        `;
    }

    // 获取经典模式规则
    getClassicModeRules() {
        return `
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
    }

    // 显示关卡选择
    showLevelSelection(maxLevel, startFromLevelCallback) {
        let html = '<h3>选择关卡</h3><p>当前最高关卡：' + maxLevel + '</p>';
        html += '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; max-height: 300px; overflow-y: auto;">';

        for (let i = 1; i <= maxLevel; i++) {
            html += `<button onclick="game.startFromLevel(${i})" style="padding: 8px; margin: 2px;">${i}</button>`;
        }

        html += '</div>';
        html += '<button onclick="game.uiRenderer.closeModal()" style="margin-top: 15px;">取消</button>';

        this.showModal('关卡选择', html);
    }
}
