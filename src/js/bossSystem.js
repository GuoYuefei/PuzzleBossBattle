// Boss战系统模块
class BossSystem {
    constructor(game) {
        this.game = game;

        // Boss战相关属性
        this.bossLevel = 1;
        this.bossMaxLevel = BOSS_MAX_LEVEL;
        this.boss = null;
        this.playerHp = 100;
        this.playerMaxHp = 100;
        this.bossSkillSealed = 0; // Boss技能被封印的回合数
        this.frozenCells = new Map(); // 冻结的格子 {row_col: remainingCount}
        this.poisonedCells = new Set(); // 有毒的格子
        this.monsterCells = new Map(); // 小怪格子 {row_col: hp}
        this.bombCells = new Map(); // 炸弹格子 {row_col: countdown}
        this.initialMoves = 30; // Boss战初始步数（用于显示）
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
        const bossAvatar = BOSS_AVATARS[Math.floor(Math.random() * BOSS_AVATARS.length)];

        this.boss = {
            name: bossName,
            avatar: bossAvatar,
            maxHp: bossHp,
            hp: bossHp,
            shield: 0,
            skillRate: skillRate
        };

        // 玩家血量为Boss的一定比例，每关回满
        this.playerMaxHp = Math.ceil(bossHp * PLAYER_HP_RATIO);
        this.playerHp = this.playerMaxHp;
        this.bossSkillSealed = 0;

        // 清空特殊格子
        this.frozenCells.clear();
        this.poisonedCells.clear();
        this.monsterCells.clear();
        this.bombCells.clear();

        // 计算Boss战步数：使用常量配置
        // 例如：第1关=50步，第10关=50+90+30=170步，第70关=50+690+210=950步
        const { baseSteps, stepsPerLevel, bonusForTenthLevels } = BOSS_MOVES_CONFIG;

        // 计算到当前关卡的总步数
        // 已击败的boss数量 = 当前关卡 - 1
        const defeatedBosses = this.bossLevel - 1;
        const tenthLevelsPassed = Math.floor(defeatedBosses / 10);

        this.game.moves = baseSteps + (defeatedBosses * stepsPerLevel) + (tenthLevelsPassed * bonusForTenthLevels);
        this.initialMoves = this.game.moves; // 记录初始步数用于显示

        // 更新Boss UI
        this.game.uiRenderer.updateBossUI(this);
        this.game.uiRenderer.updateMoves(this.game.moves, this.initialMoves, this.game.gameMode);
    }

    // 获取Boss技能触发率
    getBossSkillRate() {
        const level = this.bossLevel;

        // 使用常量配置查找对应的技能触发率
        // 按关卡范围查找：从当前关卡开始向下查找最近的配置
        for (let i = level; i >= 1; i--) {
            if (BOSS_SKILL_RATES[i] !== undefined) {
                return BOSS_SKILL_RATES[i];
            }
        }

        // 默认返回10%
        return 0.1;
    }

    // Boss触发技能
    async triggerBossSkill() {
        // 如果Boss被红方块封印，不触发技能
        if (this.bossSkillSealed > 0) {
            this.game.logSystem.addLog('Boss', `技能被封印，剩余${this.bossSkillSealed}回合`, 'system');
            this.bossSkillSealed--;
            this.game.uiRenderer.updateBossUI(this);
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
        this.game.uiRenderer.showSkillAnimation(skill.name);

        this.game.logSystem.addLog('Boss技能', `${skill.name}：${skill.description}`, 'system');

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
            case 'transform':
                await this.skillTransform();
                break;
            case 'countdown':
                await this.skillCountdown();
                break;
            case 'normal_attack':
                await this.skillNormalAttack();
                break;
        }
    }

    // 技能：冻结覆盖
    async skillFreeze() {
        const freezeCount = Math.floor(Math.random() * 3) + 3; // 3-5个
        const availableCells = [];

        for (let row = 0; row < this.game.boardSize; row++) {
            for (let col = 0; col < this.game.boardSize; col++) {
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

        this.game.uiRenderer.renderBoard(this.game);
        this.game.logSystem.addLog('Boss技能', `冻结了${selected.length}个方块`, 'system');
    }

    // 技能：毒素蔓延
    async skillPoison() {
        const poisonCount = Math.floor(Math.random() * 10) + 1; // 1-10个
        const availableCells = [];

        for (let row = 0; row < this.game.boardSize; row++) {
            for (let col = 0; col < this.game.boardSize; col++) {
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

        this.game.uiRenderer.renderBoard(this.game);
        this.game.logSystem.addLog('Boss技能', `使${selected.length}个方块带有毒素`, 'system');
    }

    // 技能：召唤小怪
    async skillSummon() {
        const availableCells = [];

        for (let row = 0; row < this.game.boardSize; row++) {
            for (let col = 0; col < this.game.boardSize; col++) {
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

        this.game.uiRenderer.renderBoard(this.game);
        this.game.logSystem.addLog('Boss技能', `召唤了${selected.length}个小怪`, 'system');
    }

    // 技能：护盾生成
    async skillShield() {
        const shieldRate = 0.1 + Math.random() * 0.2; // 0.1-0.3倍
        const shieldAmount = Math.ceil(this.boss.maxHp * shieldRate);

        this.boss.shield += shieldAmount;
        this.game.uiRenderer.updateBossUI(this);

        this.game.logSystem.addLog('Boss技能', `获得${shieldAmount}点护盾`, 'system');
    }

    // 技能：元素转换
    async skillTransform() {
        // 将40%的图形随机转换成其他形状
        const totalCells = this.game.boardSize * this.game.boardSize;
        const transformCount = Math.floor(totalCells * 0.4);
        let transformed = 0;

        // 获取所有有方块的格子
        const availableCells = [];
        for (let row = 0; row < this.game.boardSize; row++) {
            for (let col = 0; col < this.game.boardSize; col++) {
                if (this.game.board[row][col]) {
                    availableCells.push({ row, col });
                }
            }
        }

        // 随机打乱并选择要转换的格子
        const selected = availableCells
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(transformCount, availableCells.length));

        selected.forEach(({ row, col }) => {
            const piece = this.game.board[row][col];
            if (piece) {
                // 随机选择一个不同于当前形状的新形状
                const currentShapeIndex = SHAPES.indexOf(piece.shape);
                const otherShapes = SHAPES.filter((_, index) => index !== currentShapeIndex);
                const newShape = otherShapes[Math.floor(Math.random() * otherShapes.length)];
                piece.shape = newShape;
                transformed++;
            }
        });

        this.game.uiRenderer.renderBoard(this.game);
        this.game.logSystem.addLog('Boss技能', `将${transformed}个方块的形状随机转换`, 'system');
    }

    // 技能：倒计时攻击
    async skillCountdown() {
        const availableCells = [];

        for (let row = 0; row < this.game.boardSize; row++) {
            for (let col = 0; col < this.game.boardSize; col++) {
                if (!this.bombCells.has(`${row},${col}`)) {
                    availableCells.push({ row, col });
                }
            }
        }

        if (availableCells.length === 0) return;

        const selected = availableCells[Math.floor(Math.random() * availableCells.length)];
        const countdown = Math.floor(Math.random() * 3) + 3; // 3-5回合
        this.bombCells.set(`${selected.row},${selected.col}`, countdown);

        this.game.uiRenderer.renderBoard(this.game);
        this.game.logSystem.addLog('Boss技能', `在棋盘上放置了倒计时炸弹（${countdown}回合）`, 'system');
    }

    // 技能：普通攻击
    async skillNormalAttack() {
        const damage = Math.ceil(this.boss.maxHp * 0.01);
        this.playerHp -= damage;

        this.game.uiRenderer.showDamageNumber(damage, 'damage');
        this.game.uiRenderer.updateBossUI(this);

        this.game.logSystem.addLog('Boss攻击', `对玩家造成${damage}点伤害`, 'system');

        // 检查玩家是否死亡
        if (this.playerHp <= 0) {
            this.playerHp = 0;
            this.game.uiRenderer.updateBossUI(this);
            this.game.endGame(false); // 玩家失败
        }
    }

    // 玩家攻击Boss
    async playerAttackBoss(score, greenCount, redCount, matchCount) {
        if (!this.boss || this.game.gameMode !== 'boss') return;

        // 绿色方块回血
        if (greenCount > 0) {
            const healAmount = Math.ceil(score * 0.2);
            const actualHeal = Math.min(healAmount, this.playerMaxHp - this.playerHp);
            this.playerHp += actualHeal;
            if (actualHeal > 0) {
                this.game.uiRenderer.showDamageNumber(actualHeal, 'heal');
                this.game.logSystem.addLog('玩家回血', `绿色方块恢复${actualHeal}点生命`, 'system');
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
                this.game.logSystem.addLog('护盾破碎', 'Boss护盾已破碎', 'system');
            } else {
                this.boss.shield -= damage;
                damage = 0;
                this.game.logSystem.addLog('护盾抵挡', `Boss护盾抵挡了${score}点伤害`, 'system');
            }
        }

        // 扣Boss血量
        if (damage > 0) {
            this.boss.hp -= damage;
            if (this.boss.hp < 0) this.boss.hp = 0;
            this.game.uiRenderer.showDamageNumber(damage, 'boss-damage');
            this.game.logSystem.addLog('玩家攻击', `对Boss造成${damage}点伤害`, 'system');
        }

        this.game.uiRenderer.updateBossUI(this);

        // 检查Boss是否被击败
        if (this.boss.hp <= 0) {
            await this.bossDefeated();
        }
    }

    // Boss被击败
    async bossDefeated() {
        this.game.uiRenderer.showMatchEffect('Boss被击败！');

        // 保存最高关卡
        this.saveMaxLevel();

        // 随机给1个道具
        this.giveRandomItemAfterBoss();

        // 检查是否通关
        if (this.bossLevel >= this.bossMaxLevel) {
            setTimeout(() => {
                alert('恭喜你通关了所有70关！');
                this.game.switchMode('classic');
            }, 500);
            return;
        }

        // 进入下一关
        this.bossLevel++;
        await this.game.delay(1000);
        this.initBoss();
        this.game.logSystem.addLog('系统', `进入第${this.bossLevel}关`, 'system');
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

        this.game.itemSystem.items[randomItem.id]++;
        this.game.itemSystem.updateItemsDisplay();
        this.game.itemSystem.showItemGain(randomItem);
        this.game.logSystem.addLog('道具奖励', `击败Boss获得 ${randomItem.icon} ${randomItem.name}`, 'item');
    }

    // 重置Boss系统
    reset() {
        this.bossLevel = 1;
        this.boss = null;
        this.playerHp = 100;
        this.playerMaxHp = 100;
        this.bossSkillSealed = 0;
        this.frozenCells.clear();
        this.poisonedCells.clear();
        this.monsterCells.clear();
        this.bombCells.clear();
        this.initialMoves = 30;
    }
}
