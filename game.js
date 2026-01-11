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

// Boss名字生成器
const BOSS_NAMES = [
    '暗黑魔王', '毁灭之神', '虚空领主', '暗影刺客', '火焰恶魔',
    '冰霜巨人', '雷霆暴君', '剧毒妖女', '狂战之神', '死灵法师',
    '深渊领主', '末日使者', '黑暗骑士', '血腥女王', '混沌魔神',
    '灵魂收割者', '噩梦之王', '绝望魔女', '毁灭之眼', '冥界之主',
    '黑暗之源', '深渊守护者', '末日审判者', '狂暴之灵', '暗夜君王',
    '破灭之神', '暗影主宰', '虚空行者', '死亡之翼', '混沌之源'
];

// Boss技能定义
const BOSS_SKILLS = {
    // 棋盘干扰
    FREEZE: {
        id: 'freeze',
        name: '冻结覆盖',
        type: 'board_interference',
        description: '冻结随机3-5个方块，需要消除3次才能完全解冻',
        probability: 0.03
    },
    POISON: {
        id: 'poison',
        name: '毒素蔓延',
        type: 'board_interference',
        description: '随机使1-10个方块含有毒素，消除后扣除玩家血量',
        probability: 0.02
    },
    // 目标干扰
    SUMMON: {
        id: 'summon',
        name: '召唤小怪',
        type: 'target_interference',
        description: '在棋盘上生成带有数字的"小怪块"，需多次消除才能击败',
        probability: 0.03
    },
    SHIELD: {
        id: 'shield',
        name: '护盾生成',
        type: 'target_interference',
        description: '为Boss施加护盾',
        probability: 0.04
    },
    SEAL: {
        id: 'seal',
        name: '元素封印',
        type: 'target_interference',
        description: '禁止玩家消除某种颜色的棋子若干回合',
        probability: 0.01
    },
    // 直接攻击
    COUNTDOWN: {
        id: 'countdown',
        name: '倒计时攻击',
        type: 'direct_attack',
        description: '在棋盘上生成倒计时炸弹，归零时扣除步数',
        probability: 0.01
    },
    NORMAL_ATTACK: {
        id: 'normal_attack',
        name: '普通攻击',
        type: 'direct_attack',
        description: '每次消除都有可能发生，对玩家造成boss血量的1%伤害',
        probability: 0.20
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

        // 游戏模式
        this.gameMode = 'classic'; // 'classic' or 'boss'

        // Boss战系统
        this.bossLevel = 1;
        this.bossMaxLevel = 70;
        this.boss = null;
        this.playerHp = 100;
        this.playerMaxHp = 100;
        this.bossSkillSealed = 0; // Boss技能被封印的回合数
        this.sealedColor = null; // 被封印的颜色
        this.sealedColorTurns = 0; // 颜色封印剩余回合数
        this.frozenCells = new Map(); // 冻结的格子 {row_col: remainingCount}
        this.poisonedCells = new Set(); // 有毒的格子
        this.monsterCells = new Map(); // 小怪格子 {row_col: hp}
        this.bombCells = new Map(); // 炸弹格子 {row_col: countdown}
        this.initialMoves = 30; // Boss战初始步数（用于显示）

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
        this.swapClickHandler = null; // 交换模式的事件处理器
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

    // ========== Boss战系统相关方法 ==========

    // 切换游戏模式
    switchMode(mode) {
        if (this.gameMode === mode) return;

        this.gameMode = mode;

        // 更新UI按钮状态
        document.getElementById('classic-mode-btn').classList.toggle('active', mode === 'classic');
        document.getElementById('boss-mode-btn').classList.toggle('active', mode === 'boss');

        // 显示/隐藏Boss面板
        const bossPanel = document.getElementById('boss-panel');
        bossPanel.classList.toggle('active', mode === 'boss');

        // 显示/隐藏玩家血量条
        const playerHpBar = document.getElementById('player-hp-container');
        playerHpBar.classList.toggle('active', mode === 'boss');

        // 显示/隐藏关卡选择按钮
        const levelSelectBtn = document.getElementById('level-select-btn');
        levelSelectBtn.style.display = mode === 'boss' ? 'inline-block' : 'none';

        // 重新开始游戏
        this.restart();
    }

    // 初始化Boss
    initBoss() {
        // 计算Boss血量：每关增加100，1-10关为100-1000
        const bossHp = this.bossLevel * 100;

        // 计算Boss技能触发率
        const skillRate = this.getBossSkillRate();

        // 随机生成Boss名字
        const bossName = BOSS_NAMES[Math.floor(Math.random() * BOSS_NAMES.length)];

        // 生成Boss头像（组合简单形象）
        const bossAvatars = ['👹', '👺', '🤡', '👿', '💀', '👻', '👽', '🤖', '🎃', '😈'];
        const bossAvatar = bossAvatars[Math.floor(Math.random() * bossAvatars.length)];

        this.boss = {
            name: bossName,
            avatar: bossAvatar,
            maxHp: bossHp,
            hp: bossHp,
            shield: 0,
            skillRate: skillRate
        };

        // 玩家血量为Boss的10%，每关回满
        this.playerMaxHp = Math.ceil(bossHp * 0.1);
        this.playerHp = this.playerMaxHp;
        this.bossSkillSealed = 0;
        this.sealedColor = null;
        this.sealedColorTurns = 0;

        // 清空特殊格子
        this.frozenCells.clear();
        this.poisonedCells.clear();
        this.monsterCells.clear();
        this.bombCells.clear();

        // 计算Boss战步数：初始50步 + (每关+10步) + (整十关额外+30步)
        // 例如：第1关=50步，第10关=50+90+30=170步，第70关=50+690+210=950步
        const baseSteps = 50;
        const stepsPerLevel = 10;
        const bonusForTenthLevels = 30;

        // 计算到当前关卡的总步数
        // 已击败的boss数量 = 当前关卡 - 1
        const defeatedBosses = this.bossLevel - 1;
        const tenthLevelsPassed = Math.floor(defeatedBosses / 10);

        this.moves = baseSteps + (defeatedBosses * stepsPerLevel) + (tenthLevelsPassed * bonusForTenthLevels);
        this.initialMoves = this.moves; // 记录初始步数用于显示

        // 更新Boss UI
        this.updateBossUI();
        this.updateMoves();
    }

    // 获取Boss技能触发率
    getBossSkillRate() {
        const level = this.bossLevel;

        // 1-9关：10%
        if (level <= 9) return 0.1;
        // 10关：30%
        if (level === 10) return 0.3;
        // 11-19关：20%
        if (level <= 19) return 0.2;
        // 20关：40%
        if (level === 20) return 0.4;
        // 21-29关：30%
        if (level <= 29) return 0.3;
        // 30关：50%
        if (level === 30) return 0.5;
        // 31-39关：40%
        if (level <= 39) return 0.4;
        // 40关：60%
        if (level === 40) return 0.6;
        // 41-49关：50%
        if (level <= 49) return 0.5;
        // 50关：70%
        if (level === 50) return 0.7;
        // 51-59关：60%
        if (level <= 59) return 0.6;
        // 60关：80%
        if (level === 60) return 0.8;
        // 61-69关：70%
        if (level <= 69) return 0.7;
        // 70关：90%
        return 0.9;
    }

    // 更新Boss UI
    updateBossUI() {
        if (!this.boss) return;

        // 更新Boss基本信息
        document.getElementById('boss-avatar').textContent = this.boss.avatar;
        document.getElementById('boss-name').textContent = this.boss.name;
        document.getElementById('boss-level').textContent = `第${this.bossLevel}关`;

        // 更新Boss血条
        const bossHpPercent = (this.boss.hp / this.boss.maxHp) * 100;
        const bossHpFill = document.getElementById('boss-hp-fill');
        bossHpFill.style.width = bossHpPercent + '%';
        bossHpFill.classList.toggle('shielded', this.boss.shield > 0);
        // 血量文本单独更新
        document.getElementById('boss-hp-text').textContent = `${this.boss.hp}/${this.boss.maxHp}`;

        // 更新Boss护盾
        const shieldPercent = this.boss.shield > 0 ? (this.boss.shield / this.boss.maxHp) * 100 : 0;
        const shieldFill = document.getElementById('boss-shield-fill');
        shieldFill.style.width = shieldPercent + '%';

        // 更新玩家血条
        const playerHpPercent = (this.playerHp / this.playerMaxHp) * 100;
        document.getElementById('player-hp-fill').style.width = playerHpPercent + '%';
        document.getElementById('player-hp-text').textContent = `${this.playerHp}/${this.playerMaxHp}`;

        // 更新技能封印状态（Boss技能被封印）
        const sealIndicator = document.getElementById('skill-seal-indicator');
        const bossAvatar = document.getElementById('boss-avatar');
        if (this.bossSkillSealed > 0) {
            sealIndicator.classList.add('active');
            document.getElementById('seal-remaining').textContent = this.bossSkillSealed;
            bossAvatar.classList.add('sealed');
        } else {
            sealIndicator.classList.remove('active');
            bossAvatar.classList.remove('sealed');
        }

        // 更新颜色封印状态
        const colorSealIndicator = document.getElementById('color-seal-indicator');
        if (this.sealedColor && this.sealedColorTurns > 0) {
            const colorNames = { green: '绿色', blue: '蓝色', red: '红色' };
            colorSealIndicator.classList.add('active');
            document.getElementById('color-seal-text').textContent = colorNames[this.sealedColor];
            document.getElementById('color-seal-remaining').textContent = this.sealedColorTurns;
        } else {
            colorSealIndicator.classList.remove('active');
        }
    }

    // Boss触发技能
    async triggerBossSkill() {
        // 如果Boss被红方块封印，不触发技能
        if (this.bossSkillSealed > 0) {
            this.addLog('Boss', `技能被封印，剩余${this.bossSkillSealed}回合`, 'system');
            this.bossSkillSealed--;
            this.updateBossUI();
            return;
        }

        // 检查是否触发技能
        if (Math.random() > this.boss.skillRate) {
            return;
        }

        // 随机选择一个技能
        const skills = Object.values(BOSS_SKILLS);
        let selectedSkill = skills[Math.floor(Math.random() * skills.length)];

        // 根据概率重新选择
        const rand = Math.random();
        let cumulative = 0;
        for (const skill of skills) {
            cumulative += skill.probability;
            if (rand <= cumulative) {
                selectedSkill = skill;
                break;
            }
        }

        // 执行技能
        await this.executeBossSkill(selectedSkill);
    }

    // 执行Boss技能
    async executeBossSkill(skill) {
        // 显示技能动画
        this.showSkillAnimation(skill.name);

        this.addLog('Boss技能', `${skill.name}：${skill.description}`, 'system');

        switch (skill.id) {
            case 'freeze':
                await this.skillFreeze();
                break;
            case 'poison':
                await this.skillPoison();
                break;
            case 'summon':
                await this.skillSummon();
                break;
            case 'shield':
                await this.skillShield();
                break;
            case 'seal':
                await this.skillSeal();
                break;
            case 'countdown':
                await this.skillCountdown();
                break;
            case 'normal_attack':
                await this.skillNormalAttack();
                break;
        }

        // 检查并确保棋盘可玩
        if (!this.hasPossibleMoves()) {
            this.addLog('系统', 'Boss技能后棋盘死局，自动刷新', 'system');
            await this.refreshBoard();
        }
    }

    // 技能：冻结覆盖
    async skillFreeze() {
        const freezeCount = Math.floor(Math.random() * 3) + 3; // 3-5个
        const availableCells = [];

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (!this.frozenCells.has(`${row},${col}`)) {
                    availableCells.push({ row, col });
                }
            }
        }

        const selected = availableCells
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(freezeCount, availableCells.length));

        selected.forEach(({ row, col }) => {
            this.frozenCells.set(`${row},${col}`, 3); // 需要消除3次
        });

        this.renderBoard();
        this.addLog('Boss技能', `冻结了${selected.length}个方块`, 'system');
    }

    // 技能：毒素蔓延
    async skillPoison() {
        const poisonCount = Math.floor(Math.random() * 10) + 1; // 1-10个
        const availableCells = [];

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (!this.poisonedCells.has(`${row},${col}`)) {
                    availableCells.push({ row, col });
                }
            }
        }

        const selected = availableCells
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(poisonCount, availableCells.length));

        selected.forEach(({ row, col }) => {
            this.poisonedCells.add(`${row},${col}`);
        });

        this.renderBoard();
        this.addLog('Boss技能', `使${selected.length}个方块带有毒素`, 'system');
    }

    // 技能：召唤小怪
    async skillSummon() {
        const availableCells = [];

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (!this.monsterCells.has(`${row},${col}`)) {
                    availableCells.push({ row, col });
                }
            }
        }

        const selected = availableCells
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(3, availableCells.length));

        selected.forEach(({ row, col }) => {
            const hp = Math.floor(Math.random() * 3) + 2; // 2-4点血
            this.monsterCells.set(`${row},${col}`, hp);
        });

        this.renderBoard();
        this.addLog('Boss技能', `召唤了${selected.length}个小怪`, 'system');
    }

    // 技能：护盾生成
    async skillShield() {
        const shieldRate = 0.1 + Math.random() * 0.2; // 0.1-0.3倍
        const shieldAmount = Math.ceil(this.boss.maxHp * shieldRate);

        this.boss.shield += shieldAmount;
        this.updateBossUI();

        this.addLog('Boss技能', `获得${shieldAmount}点护盾`, 'system');
    }

    // 技能：元素封印
    async skillSeal() {
        // 随机选择一种颜色封印
        const colors = ['green', 'blue', 'red'];
        this.sealedColor = colors[Math.floor(Math.random() * colors.length)];

        // 随机封印1-5回合
        this.sealedColorTurns = Math.floor(Math.random() * 5) + 1;

        const colorNames = { green: '绿色', blue: '蓝色', red: '红色' };
        this.addLog('Boss技能', `封印了${colorNames[this.sealedColor]}方块${this.sealedColorTurns}回合`, 'system');

        this.renderBoard();
    }

    // 技能：倒计时攻击
    async skillCountdown() {
        const availableCells = [];

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (!this.bombCells.has(`${row},${col}`)) {
                    availableCells.push({ row, col });
                }
            }
        }

        if (availableCells.length === 0) return;

        const selected = availableCells[Math.floor(Math.random() * availableCells.length)];
        const countdown = Math.floor(Math.random() * 3) + 3; // 3-5回合
        this.bombCells.set(`${selected.row},${selected.col}`, countdown);

        this.renderBoard();
        this.addLog('Boss技能', `在棋盘上放置了倒计时炸弹（${countdown}回合）`, 'system');
    }

    // 技能：普通攻击
    async skillNormalAttack() {
        const damage = Math.ceil(this.boss.maxHp * 0.01);
        this.playerHp -= damage;

        this.showDamageNumber(damage, 'damage');
        this.updateBossUI();

        this.addLog('Boss攻击', `对玩家造成${damage}点伤害`, 'system');

        // 检查玩家是否死亡
        if (this.playerHp <= 0) {
            this.playerHp = 0;
            this.updateBossUI();
            this.endGame(false); // 玩家失败
        }
    }

    // 玩家攻击Boss
    async playerAttackBoss(score, greenCount, redCount, matchCount) {
        if (!this.boss || this.gameMode !== 'boss') return;

        // 绿色方块回血
        if (greenCount > 0) {
            const healAmount = Math.ceil(score * 0.2);
            const actualHeal = Math.min(healAmount, this.playerMaxHp - this.playerHp);
            this.playerHp += actualHeal;
            if (actualHeal > 0) {
                this.showDamageNumber(actualHeal, 'heal');
                this.addLog('玩家回血', `绿色方块恢复${actualHeal}点生命`, 'system');
            }
        }

        // 红色方块封印Boss技能（不记录日志，界面已显示）
        if (redCount > 0) {
            this.bossSkillSealed += redCount;
        }

        // 对Boss造成伤害
        let damage = score;

        // 先扣护盾
        if (this.boss.shield > 0) {
            if (damage >= this.boss.shield) {
                damage -= this.boss.shield;
                this.boss.shield = 0;
                this.addLog('护盾破碎', 'Boss护盾已破碎', 'system');
            } else {
                this.boss.shield -= damage;
                damage = 0;
                this.addLog('护盾抵挡', `Boss护盾抵挡了${score}点伤害`, 'system');
            }
        }

        // 扣Boss血量
        if (damage > 0) {
            this.boss.hp -= damage;
            if (this.boss.hp < 0) this.boss.hp = 0;
            this.showDamageNumber(damage, 'boss-damage');
            this.addLog('玩家攻击', `对Boss造成${damage}点伤害`, 'system');
        }

        this.updateBossUI();

        // 检查Boss是否被击败
        if (this.boss.hp <= 0) {
            await this.bossDefeated();
        }
    }

    // Boss被击败
    async bossDefeated() {
        this.showMatchEffect('Boss被击败！');

        // 保存最高关卡
        this.saveMaxLevel();

        // 随机给1个道具
        this.giveRandomItemAfterBoss();

        // 检查是否通关
        if (this.bossLevel >= this.bossMaxLevel) {
            setTimeout(() => {
                alert('恭喜你通关了所有70关！');
                this.switchMode('classic');
            }, 500);
            return;
        }

        // 进入下一关
        this.bossLevel++;
        await this.delay(1000);
        this.initBoss();
        this.addLog('系统', `进入第${this.bossLevel}关`, 'system');
    }

    // 保存最高关卡
    saveMaxLevel() {
        if (this.bossLevel > this.getMaxLevel()) {
            localStorage.setItem('boss_max_level', this.bossLevel.toString());
        }
    }

    // 获取最高关卡
    getMaxLevel() {
        const saved = localStorage.getItem('boss_max_level');
        return saved ? parseInt(saved) : 1;
    }

    // Boss击败后随机给1个道具
    giveRandomItemAfterBoss() {
        // 所有道具（普通+特殊）
        const allItems = Object.values(ITEM_TYPES);
        const randomItem = allItems[Math.floor(Math.random() * allItems.length)];

        this.items[randomItem.id]++;
        this.updateItemsDisplay();
        this.showItemGain(randomItem);
        this.addLog('道具奖励', `击败Boss获得 ${randomItem.icon} ${randomItem.name}`, 'item');
    }

    // 显示关卡选择
    showLevelSelection() {
        const maxLevel = this.getMaxLevel();
        let html = '<h3>选择关卡</h3><p>当前最高关卡：' + maxLevel + '</p>';
        html += '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; max-height: 300px; overflow-y: auto;">';

        for (let i = 1; i <= maxLevel; i++) {
            html += `<button onclick="game.startFromLevel(${i})" style="padding: 8px; margin: 2px;">${i}</button>`;
        }

        html += '</div>';
        html += '<button onclick="game.closeModal()" style="margin-top: 15px;">取消</button>';

        this.showModal('关卡选择', html);
    }

    // 从指定关卡开始
    startFromLevel(level) {
        if (level < 1 || level > this.getMaxLevel()) {
            alert('无效的关卡！');
            return;
        }

        this.bossLevel = level;
        this.initBoss();
        this.createBoard();
        this.renderBoard();
        this.closeModal();
        this.addLog('系统', `从第${level}关开始`, 'system');
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

    // ========== 原有游戏逻辑 ==========

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

                const cellKey = `${row},${col}`;
                const piece = this.board[row][col];

                // 处理特殊格子状态
                if (this.frozenCells.has(cellKey)) {
                    cell.classList.add('frozen-cell');
                }

                if (this.poisonedCells.has(cellKey)) {
                    cell.classList.add('poisoned-cell');
                }

                if (this.monsterCells.has(cellKey)) {
                    cell.classList.add('monster-cell');
                    cell.dataset.hp = this.monsterCells.get(cellKey);
                }

                if (this.bombCells.has(cellKey)) {
                    cell.classList.add('bomb-cell');
                    cell.dataset.countdown = this.bombCells.get(cellKey);
                }

                // 处理颜色封印
                if (piece && this.sealedColor && piece.color === this.sealedColor) {
                    cell.classList.add('sealed-color');
                }

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
        const cellKey = `${row},${col}`;

        // Boss战模式：检查是否点击了冻结的方块
        if (this.gameMode === 'boss' && this.frozenCells.has(cellKey)) {
            this.showMatchEffect('该方块被冻结，无法移动！');
            return;
        }

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

            // Boss战模式：检查第二个方块是否被冻结
            const prevCellKey = `${prevRow},${prevCol}`;
            if (this.gameMode === 'boss' && this.frozenCells.has(prevCellKey)) {
                this.showMatchEffect('该方块被冻结，无法移动！');
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
        let totalScore = 0;
        let totalGreenCount = 0;
        let totalRedCount = 0;
        let totalMatchCount = 0;
        const initialScore = this.score; // 记录初始分数用于计算三部曲倍率后的实际伤害

        while (hasMatches) {
            const matches = this.findMatches();

            if (matches.length === 0) {
                hasMatches = false;

                // Boss战模式：触发Boss技能
                if (this.gameMode === 'boss' && totalMatchCount > 0) {
                    await this.triggerBossSkill();
                }

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

            // 计算分数和颜色统计（传入连击数）
            const { score, greenCount, redCount, matchCount } = this.calculateScore(matches, matchAnalysis, this.comboCount);
            totalScore += score;
            totalGreenCount += greenCount;
            totalRedCount += redCount;
            totalMatchCount += matchCount;
            this.addScore(score);

            // 标记匹配的格子并处理特殊状态
            const matchedCells = new Set();
            const blockedCells = new Set(); // 被阻挡的格子（冻结或小怪未完全消除）
            const skippedMatches = new Set(); // 被跳过的匹配索引（冻结/小怪）
            const sealedMatches = new Set(); // 被封印颜色的匹配索引（不加分但会消除）

            // 首先检查哪些匹配包含被阻挡的格子或封印颜色
            for (let i = 0; i < matches.length; i++) {
                const match = matches[i];
                let matchBlocked = false;
                let matchSealed = false;

                for (const cell of match.cells) {
                    const cellKey = `${cell.row},${cell.col}`;
                    const piece = this.board[cell.row][cell.col];

                    // 检查这个格子是否被阻挡（冻结或小怪）
                    if (this.frozenCells.has(cellKey) || this.monsterCells.has(cellKey)) {
                        matchBlocked = true;
                        break;
                    }

                    // 检查是否被封印颜色
                    if (piece && this.sealedColor && piece.color === this.sealedColor) {
                        matchSealed = true;
                    }
                }

                if (matchBlocked) {
                    // 这个匹配被阻挡，需要处理其中的冻结/小怪格子
                    skippedMatches.add(i);

                    for (const cell of match.cells) {
                        const cellKey = `${cell.row},${cell.col}`;

                        // 处理冻结格子（只减少计数，不消除）
                        if (this.frozenCells.has(cellKey)) {
                            const remaining = this.frozenCells.get(cellKey) - 1;
                            if (remaining <= 0) {
                                this.frozenCells.delete(cellKey);
                                // 冻结解除，但方块保留在棋盘上
                            } else {
                                this.frozenCells.set(cellKey, remaining);
                                blockedCells.add(cellKey);
                            }
                        }

                        // 处理小怪格子（只减少HP，不消除）
                        if (this.monsterCells.has(cellKey)) {
                            const hp = this.monsterCells.get(cellKey) - 1;
                            if (hp <= 0) {
                                this.monsterCells.delete(cellKey);
                                // 小怪被击败，但方块保留在棋盘上
                            } else {
                                this.monsterCells.set(cellKey, hp);
                                blockedCells.add(cellKey);
                            }
                        }
                    }
                } else if (matchSealed) {
                    // 这个匹配包含封印颜色，标记为封印匹配（不加分但会消除）
                    sealedMatches.add(i);
                }
            }

            // 处理未被阻挡的匹配和封印颜色的匹配
            for (let i = 0; i < matches.length; i++) {
                if (skippedMatches.has(i)) continue; // 跳过被阻挡的匹配（冻结/小怪）

                const match = matches[i];
                for (const cell of match.cells) {
                    const cellKey = `${cell.row},${cell.col}`;

                    // 处理毒素格子（毒素不影响消除，只是扣血）
                    if (this.poisonedCells.has(cellKey)) {
                        const piece = this.board[cell.row][cell.col];
                        if (piece) {
                            const baseDamage = this.shapeScores[piece.shape] * this.colorMultipliers[piece.color];
                            this.playerHp -= Math.ceil(baseDamage);
                            this.addLog('毒素伤害', `中毒方块扣除${Math.ceil(baseDamage)}点生命`, 'system');
                            this.poisonedCells.delete(cellKey);

                            if (this.playerHp <= 0) {
                                this.playerHp = 0;
                                this.updateBossUI();
                                this.endGame(false);
                                return;
                            }
                        }
                    }

                    matchedCells.add(cellKey);
                }
            }

            // 如果有被阻挡的格子，需要重新渲染棋盘以更新冻结/小怪状态
            if (blockedCells.size > 0) {
                this.renderBoard();
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

            // 如果有封印颜色的匹配，减少封印回合数
            if (sealedMatches.size > 0 && this.sealedColorTurns > 0) {
                this.sealedColorTurns--;
                if (this.sealedColorTurns <= 0) {
                    const colorNames = { green: '绿色', blue: '蓝色', red: '红色' };
                    this.addLog('系统', `${colorNames[this.sealedColor]}方块封印已解除`, 'system');
                    this.sealedColor = null;
                    this.sealedColorTurns = 0;
                } else {
                    const colorNames = { green: '绿色', blue: '蓝色', red: '红色' };
                    this.addLog('封印', `${colorNames[this.sealedColor]}方块封印剩余${this.sealedColorTurns}回合`, 'system');
                }
                this.renderBoard();
            }

            // 处理炸弹倒计时
            for (const [cellKey, countdown] of this.bombCells.entries()) {
                const newCountdown = countdown - 1;
                if (newCountdown <= 0) {
                    // 炸弹爆炸，扣除步数
                    this.moves = Math.max(0, this.moves - 3);
                    this.updateMoves();
                    this.bombCells.delete(cellKey);
                    this.showMatchEffect('炸弹爆炸！扣除3步！');
                    this.addLog('炸弹', '倒计时归零，扣除3步', 'system');
                } else {
                    this.bombCells.set(cellKey, newCountdown);
                }
            }

            // 下落填充
            await this.dropPieces();
            await this.fillBoard();

            await this.delay(200);
        }

        // Boss战模式：玩家攻击Boss
        if (this.gameMode === 'boss' && totalMatchCount > 0) {
            // 使用实际增加的分数（包括三部曲倍率）
            const actualDamage = this.score - initialScore;
            await this.playerAttackBoss(actualDamage, totalGreenCount, totalRedCount, totalMatchCount);
            this.updateBossUI();
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
                    const piece = this.board[cell.row][cell.col];
                    if (piece) {
                        // 统计绿色方块总分（用于回血）和红色方块数量（用于封印）
                        if (piece.color === 'green') {
                            greenCount += this.shapeScores[piece.shape];
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

        return { score: Math.floor(totalScore), greenCount, redCount, matchCount };
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
        if (this.gameMode === 'boss') {
            this.movesEl.textContent = `${this.moves}步`;
        } else {
            this.movesEl.textContent = this.moves;
        }
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

    endGame(isVictory = true) {
        if (this.gameMode === 'boss') {
            if (!isVictory) {
                // 玩家失败，重新开始当前关卡
                this.showMatchEffect('游戏结束！');
                setTimeout(() => {
                    alert(`你在第${this.bossLevel}关被Boss击败了！`);
                    this.initBoss();
                    this.createBoard();
                    this.renderBoard();
                }, 500);
            }
            return;
        }

        // 经典模式的游戏结束
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

        // Boss战模式：重置关卡和Boss
        if (this.gameMode === 'boss') {
            this.bossLevel = 1;
            this.initBoss();
        }

        this.updateScore();
        this.updateMoves();
        this.createBoard();
        this.renderBoard();
        this.updateItemsDisplay();

        // 清空日志
        if (this.logContent) {
            this.logContent.innerHTML = '';
            this.gameLog = [];
            const modeText = this.gameMode === 'boss' ? 'Boss战模式开始！' : '游戏开始！普通道具各1个，每100分获得随机奖励';
            this.addLog('系统', modeText, 'system');
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
        // 临时移除原始事件监听器
        this.boardEl.removeEventListener('click', this.originalClickHandler);

        // 创建交换模式的事件处理器
        this.swapClickHandler = (e) => {
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
                this.boardEl.removeEventListener('click', this.swapClickHandler);
                this.boardEl.addEventListener('click', this.originalClickHandler);
                this.swapClickHandler = null;
            }
        };

        // 添加交换模式的事件监听器
        this.boardEl.addEventListener('click', this.swapClickHandler);
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
        const isBossMode = this.gameMode === 'boss';

        let rulesHTML = `
            <h3>游戏模式</h3>
            <p>当前模式：<strong>${isBossMode ? 'Boss战模式' : '经典模式'}</strong></p>
            <p>点击上方的模式按钮可以切换游戏模式。</p>

            <h3>基本规则</h3>
            <p>交换相邻的图形，使3个或更多相同图形连成一线即可消除。</p>

            ${isBossMode ? this.getBossModeRules() : this.getClassicModeRules()}
        `;

        this.showModal('游戏规则', rulesHTML);
    }

    getBossModeRules() {
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
                <tr><td>元素封印</td><td>禁止消除某种颜色若干回合</td><td>1%</td></tr>
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
