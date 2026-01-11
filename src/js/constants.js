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

// 颜色代码映射
const COLOR_CODES = {
    'red': '#ff4757',
    'blue': '#3498db',
    'green': '#2ecc71'
};

// 形状名称映射
const SHAPE_NAMES = {
    'triangle': '△',
    'square': '□',
    'circle': '○',
    'star': '★'
};

// 颜色名称映射
const COLOR_NAMES = {
    'green': '绿色',
    'blue': '蓝色',
    'red': '红色'
};

// 形状列表
const SHAPES = ['triangle', 'square', 'circle', 'star'];

// 颜色列表
const COLORS = ['green', 'blue', 'red'];

// 形状分数
const SHAPE_SCORES = {
    'triangle': 3,
    'square': 4,
    'circle': 5,
    'star': 10
};

// 颜色倍数
const COLOR_MULTIPLIERS = {
    'green': 1,
    'blue': 1.5,
    'red': 3
};

// 形状晋级顺序
const SHAPE_PROGRESSION = ['triangle', 'square', 'circle', 'star'];

// 颜色晋级顺序
const COLOR_PROGRESSION = ['green', 'blue', 'red'];

// Boss头像列表
const BOSS_AVATARS = ['👹', '👺', '🤡', '👿', '💀', '👻', '👽', '🤖', '🎃', '😈'];
