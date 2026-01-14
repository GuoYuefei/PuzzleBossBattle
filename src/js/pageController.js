// 页面管理器
const PageManager = {
    // 初始化页面
    init() {
        // 设置初始z-index
        document.getElementById('start-page').style.zIndex = '2';
        document.getElementById('game-page').style.zIndex = '1';

        // 检查是否需要显示游戏页面
        if (localStorage.getItem('gameStarted')) {
            this.showGamePage();
        } else {
            this.showStartPage();
        }
    },

    // 显示开始页面
    showStartPage() {
        const startPage = document.getElementById('start-page');
        const gamePage = document.getElementById('game-page');

        startPage.classList.add('active');
        gamePage.classList.remove('active');
        startPage.style.zIndex = '2';
        gamePage.style.zIndex = '1';
    },

    // 显示游戏页面
    showGamePage() {
        console.log('showGamePage called');
        const startPage = document.getElementById('start-page');
        const gamePage = document.getElementById('game-page');

        startPage.classList.remove('active');
        gamePage.classList.add('active');
        startPage.style.zIndex = '1';
        gamePage.style.zIndex = '2';

        // 如果游戏还没有初始化，则初始化游戏
        if (!window.game) {
            console.log('Initializing game');
            window.game = new Match3Game();

            // 根据选择的模式设置游戏模式
            const gameMode = localStorage.getItem('gameMode') || 'classic';
            console.log('Current game mode from localStorage:', gameMode);

            if (gameMode === 'boss') {
                console.log('Switching to boss mode');
                window.game.switchMode('boss');
            } else {
                console.log('Keeping classic mode');
                // 确保boss面板隐藏
                const bossPanel = document.getElementById('boss-panel');
                if (bossPanel) {
                    bossPanel.classList.remove('active');
                }
            }
        }
    },

    // 返回开始页面
    backToStart() {
        this.showStartPage();
        // 清除游戏开始标志
        localStorage.removeItem('gameStarted');
        // 销毁游戏实例
        if (window.game) {
            window.game = null;
        }
    }
};

// 开始游戏函数
function startClassicMode() {
    console.log('startClassicMode called');
    localStorage.setItem('gameStarted', 'true');
    localStorage.setItem('gameMode', 'classic');
    PageManager.showGamePage();
}

function startBossMode() {
    console.log('startBossMode called');
    localStorage.setItem('gameStarted', 'true');
    localStorage.setItem('gameMode', 'boss');
    PageManager.showGamePage();
}

// 返回主页函数
function backToStart() {
    PageManager.backToStart();
}

// 显示排行榜
function showLeaderboard() {
    // 创建模态框
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; justify-content: center; align-items: center;';

    // 创建内容容器
    const content = document.createElement('div');
    content.style.cssText = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; padding: 20px; max-width: 400px; width: 90%; max-height: 80vh; overflow-y: auto; color: white;';

    // 创建标题和关闭按钮
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;';

    const title = document.createElement('h2');
    title.textContent = '排行榜';
    title.style.cssText = 'margin: 0; font-size: 24px;';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px;';
    closeBtn.onclick = function() {
        document.body.removeChild(modal);
    };

    header.appendChild(title);
    header.appendChild(closeBtn);

    // 创建模式切换标签
    const tabs = document.createElement('div');
    tabs.style.cssText = 'display: flex; margin-bottom: 20px; background: rgba(255,255,255,0.1); border-radius: 12px; padding: 4px;';

    const classicTab = document.createElement('button');
    classicTab.textContent = '经典模式';
    classicTab.style.cssText = 'flex: 1; background: rgba(255,255,255,0.2); border: none; color: white; padding: 10px; cursor: pointer; border-radius: 8px; font-size: 14px; font-weight: 500;';
    classicTab.onclick = function() {
        classicTab.style.background = 'rgba(255,255,255,0.2)';
        bossTab.style.background = 'none';
        loadLeaderboard('classic', list);
    };

    const bossTab = document.createElement('button');
    bossTab.textContent = 'Boss战模式';
    bossTab.style.cssText = 'flex: 1; background: none; border: none; color: rgba(255,255,255,0.7); padding: 10px; cursor: pointer; border-radius: 8px; font-size: 14px; font-weight: 500;';
    bossTab.onclick = function() {
        bossTab.style.background = 'rgba(255,255,255,0.2)';
        bossTab.style.color = 'white';
        classicTab.style.background = 'none';
        classicTab.style.color = 'rgba(255,255,255,0.7)';
        loadLeaderboard('boss', list);
    };

    tabs.appendChild(classicTab);
    tabs.appendChild(bossTab);

    // 创建排行榜列表
    const list = document.createElement('ul');
    list.style.cssText = 'list-style: none; margin: 0; padding: 0;';

    // 加载排行榜数据
    function loadLeaderboard(mode, listElement) {
        const key = mode === 'classic' ? 'classicScores' : 'bossScores';
        const scores = JSON.parse(localStorage.getItem(key) || '[]');

        listElement.innerHTML = '';

        if (scores.length === 0) {
            const noScores = document.createElement('div');
            noScores.textContent = '暂无记录';
            noScores.style.cssText = 'text-align: center; padding: 40px 20px; opacity: 0.7;';
            listElement.appendChild(noScores);
            return;
        }

        scores.sort((a, b) => b.score - a.score).forEach((entry, index) => {
            const item = document.createElement('li');
            item.style.cssText = 'display: flex; align-items: center; padding: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.1); border-radius: 12px;';

            const rank = document.createElement('div');
            rank.textContent = index + 1;
            rank.style.cssText = 'width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; font-size: 14px;';

            if (index === 0) {
                rank.style.background = '#FFD700';
                rank.style.color = '#333';
            } else if (index === 1) {
                rank.style.background = '#C0C0C0';
                rank.style.color = '#333';
            } else if (index === 2) {
                rank.style.background = '#CD7F32';
                rank.style.color = 'white';
            } else {
                rank.style.background = 'rgba(255,255,255,0.3)';
                rank.style.color = 'white';
            }

            const playerInfo = document.createElement('div');
            playerInfo.style.cssText = 'flex: 1;';

            const playerName = document.createElement('div');
            playerName.textContent = entry.name;
            playerName.style.cssText = 'font-size: 16px; margin-bottom: 4px;';

            const playerScore = document.createElement('div');
            playerScore.textContent = entry.score + ' 分 - ' + entry.steps + ' 步';
            playerScore.style.cssText = 'font-size: 14px; opacity: 0.8;';

            playerInfo.appendChild(playerName);
            playerInfo.appendChild(playerScore);

            item.appendChild(rank);
            item.appendChild(playerInfo);
            listElement.appendChild(item);
        });
    }

    // 组装所有元素
    content.appendChild(header);
    content.appendChild(tabs);
    content.appendChild(list);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // 初始加载经典模式排行榜
    loadLeaderboard('classic', list);

    // 点击模态框背景关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// 显示游戏说明
function showAbout() {
    // 创建模态框
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; justify-content: center; align-items: center;';

    // 创建内容容器
    const content = document.createElement('div');
    content.style.cssText = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; padding: 20px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; color: white;';

    // 创建标题和关闭按钮
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;';

    const title = document.createElement('h2');
    title.textContent = '游戏说明';
    title.style.cssText = 'margin: 0; font-size: 24px;';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px;';
    closeBtn.onclick = function() {
        document.body.removeChild(modal);
    };

    header.appendChild(title);
    header.appendChild(closeBtn);

    // 创建内容区域
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = 'background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 20px;';

    // 经典模式说明
    const classicMode = document.createElement('div');
    classicMode.style.cssText = 'margin-bottom: 20px;';

    const classicTitle = document.createElement('h3');
    classicTitle.textContent = '🎮 经典模式';
    classicTitle.style.cssText = 'font-size: 20px; font-weight: bold; margin-bottom: 10px; color: #FFD700;';

    const classicDesc1 = document.createElement('p');
    classicDesc1.textContent = '经典消消乐玩法，通过交换相邻的宝石，匹配3个或更多相同颜色的宝石来消除它们。';
    classicDesc1.style.cssText = 'line-height: 1.6; margin-bottom: 10px; opacity: 0.9;';

    const classicDesc2 = document.createElement('p');
    classicDesc2.textContent = '每次消除都会获得分数，尽可能获得更高的分数！';
    classicDesc2.style.cssText = 'line-height: 1.6; margin-bottom: 10px; opacity: 0.9;';

    classicMode.appendChild(classicTitle);
    classicMode.appendChild(classicDesc1);
    classicMode.appendChild(classicDesc2);

    // Boss战模式说明
    const bossMode = document.createElement('div');
    bossMode.style.cssText = 'margin-bottom: 20px;';

    const bossTitle = document.createElement('h3');
    bossTitle.textContent = '⚔️ Boss战模式';
    bossTitle.style.cssText = 'font-size: 20px; font-weight: bold; margin-bottom: 10px; color: #FFD700;';

    const bossDesc1 = document.createElement('p');
    bossDesc1.textContent = '挑战70个不同的Boss！每个Boss都有独特的技能和血量，你需要通过消除宝石来对Boss造成伤害。';
    bossDesc1.style.cssText = 'line-height: 1.6; margin-bottom: 10px; opacity: 0.9;';

    const bossDesc2 = document.createElement('p');
    bossDesc2.textContent = 'Boss会使用技能阻止你，合理使用道具是获胜的关键！';
    bossDesc2.style.cssText = 'line-height: 1.6; margin-bottom: 10px; opacity: 0.9;';

    bossMode.appendChild(bossTitle);
    bossMode.appendChild(bossDesc1);
    bossMode.appendChild(bossDesc2);

    // 游戏特色
    const features = document.createElement('div');
    features.style.cssText = 'background: rgba(255,255,255,0.1); border-radius: 12px; padding: 15px; margin-top: 20px;';

    const featuresTitle = document.createElement('h3');
    featuresTitle.textContent = '🎯 游戏特色';
    featuresTitle.style.cssText = 'margin-bottom: 15px; font-size: 18px;';

    const featuresList = document.createElement('ul');
    featuresList.style.cssText = 'list-style: none; margin: 0; padding: 0;';

    const featuresItems = [
        { icon: '💎', text: '4种不同的宝石形状' },
        { icon: '🎁', text: '6种强力道具系统' },
        { icon: '🏆', text: '排行榜系统，挑战高分' },
        { icon: '📱', text: '完美适配手机端' },
        { icon: '✨', text: '流畅的动画效果' },
        { icon: '💾', text: '自动保存进度' }
    ];

    featuresItems.forEach(item => {
        const li = document.createElement('li');
        li.style.cssText = 'display: flex; align-items: center; margin-bottom: 8px; padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 8px;';

        const icon = document.createElement('span');
        icon.textContent = item.icon;
        icon.style.cssText = 'font-size: 20px; margin-right: 12px;';

        const text = document.createElement('span');
        text.textContent = item.text;

        li.appendChild(icon);
        li.appendChild(text);
        featuresList.appendChild(li);
    });

    features.appendChild(featuresTitle);
    features.appendChild(featuresList);

    // 组装所有元素
    contentContainer.appendChild(classicMode);
    contentContainer.appendChild(bossMode);
    contentContainer.appendChild(features);

    content.appendChild(header);
    content.appendChild(contentContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // 点击模态框背景关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// 动态调整游戏棋盘大小
function adjustGameBoardSize() {
    const gameBoard = document.getElementById('game-board');
    if (!gameBoard) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 计算可用空间
    const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
    const controlsHeight = document.querySelector('.controls')?.offsetHeight || 60;
    const itemsHeight = document.getElementById('items')?.offsetHeight || 50;
    const bossPanelHeight = document.getElementById('boss-panel')?.offsetHeight || 0;

    const availableHeight = viewportHeight - headerHeight - controlsHeight - itemsHeight - bossPanelHeight - 30; // 30px为边距

    // 确保棋盘不会超出屏幕
    const maxSize = Math.min(viewportWidth * 0.95, Math.max(availableHeight * 0.95, 200)); // 最小200px
    const size = Math.min(maxSize, 500); // 最大500px

    gameBoard.style.width = `${size}px`;
    gameBoard.style.height = `${size}px`;

    console.log('调整棋盘大小:', { viewportWidth, viewportHeight, availableHeight, size });
}

// 检查并修复滚动条问题
function checkAndFixScrollbars() {
    const gamePage = document.querySelector('.game-page.active');
    if (!gamePage) return;

    const body = document.body;
    const html = document.documentElement;

    // 检查是否有滚动条
    const hasVerticalScroll = body.scrollHeight > window.innerHeight;
    const hasHorizontalScroll = body.scrollWidth > window.innerWidth;

    console.log('滚动条检查:', {
        bodyScrollHeight: body.scrollHeight,
        windowHeight: window.innerHeight,
        bodyScrollWidth: body.scrollWidth,
        windowWidth: window.innerWidth,
        hasVerticalScroll,
        hasHorizontalScroll
    });

    // 如果有水平滚动条，尝试修复
    if (hasHorizontalScroll) {
        console.log('检测到水平滚动条，尝试修复...');
        // 确保所有容器宽度不超过视口
        const containers = document.querySelectorAll('.game-container, .header, .controls, #items');
        containers.forEach(container => {
            container.style.maxWidth = '100vw';
            container.style.overflowX = 'hidden';
        });
    }

    // 强制隐藏滚动条
    setTimeout(() => {
        window.scrollTo(0, 0);
        html.scrollTop = 0;
        body.scrollTop = 0;
    }, 100);
}

// 页面加载完成后初始化
function initializePage() {
    PageManager.init();

    // 初始调整棋盘大小
    setTimeout(() => {
        adjustGameBoardSize();
        checkAndFixScrollbars();
    }, 100);

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        adjustGameBoardSize();
        setTimeout(checkAndFixScrollbars, 300);
    });

    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            adjustGameBoardSize();
            checkAndFixScrollbars();
        }, 500);
    });

    // 监听页面切换
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('game-page') && target.classList.contains('active')) {
                    setTimeout(() => {
                        adjustGameBoardSize();
                        checkAndFixScrollbars();
                    }, 200);
                }
            }
        });
    });

    // 观察游戏页面
    const gamePage = document.getElementById('game-page');
    if (gamePage) {
        observer.observe(gamePage, { attributes: true });
    }
}

// 确保函数在全局作用域中
window.startClassicMode = startClassicMode;
window.startBossMode = startBossMode;
window.showLeaderboard = showLeaderboard;
window.showAbout = showAbout;
window.backToStart = backToStart;

// 在DOM加载完成后初始化页面
document.addEventListener('DOMContentLoaded', initializePage);