/**
 * 孟德尔的小猫王朝 - 定义文件
 * 纯数据定义，无 Cocos 依赖，便于单测
 */

/** 六维属性，每项 0-100 */
export interface Stats {
    constitution: number;  // 体质
    strength: number;      // 力量
    agility: number;       // 敏捷
    intelligence: number;  // 智力
    charm: number;         // 魅力
    luck: number;          // 幸运
}

/** 血统类型 */
export enum BloodlineType {
    ROYAL = 'ROYAL',
    WILD = 'WILD',
    MYTHIC = 'MYTHIC',  // 稀有突变触发的神话血统
}

/** 基因单元：单个等位基因 */
export interface GeneAllele {
    trait: string;      // 性状值，如 "blue", "orange"
    dominant: boolean;  // 是否为显性
}

/** 基因对：[父本基因, 母本基因] */
export type GenePair = [GeneAllele, GeneAllele];

/** 共显性：双显性且性状不同时的合成结果，key 为排序后的 "traitA|traitB" */
export const CODOMINANCE_MAP: Record<string, string> = {
    'Flame|Ice': 'Steam',
    'Blue|Gold': 'Azure',
    'Fire|Water': 'Mist',
    'Light|Shadow': 'Twilight',
    'Storm|Sun': 'Rainbow',
};

/** 性状 → 六维属性加成（微小加成） */
export const TRAIT_STAT_BONUSES: Record<string, Partial<Stats>> = {
    // 稀有/合成性状
    StarryEye: { luck: 5 },
    Azure: { intelligence: 4 },
    Steam: { constitution: 3 },
    Twilight: { charm: 4 },
    Rainbow: { luck: 3, charm: 2 },
    Godly_Glow: { constitution: 2, strength: 2, agility: 2, intelligence: 2, charm: 2, luck: 2 },
    Mist: { agility: 3 },
    // 常见性状
    blue: { intelligence: 2 },
    orange: { charm: 2 },
    green: { agility: 2 },
    gold: { luck: 2 },
    amber: { constitution: 2 },
    gray: { strength: 2 },
    white: { charm: 1 },
    black: { strength: 1 },
    striped: { agility: 1 },
};

/** 稀有突变性状 */
export const MYTHIC_TRAIT = 'Godly_Glow';

/** 稀有突变概率 */
export const MUTATION_CHANCE = 0.01;

/** 盟约加成系数基础值（母亲国家偏好属性） */
export const COVENANT_MULTIPLIER_BASE = 1.1;

/** 盟约加成系数上限（智力 100 时达到） */
export const COVENANT_MULTIPLIER_MAX = 1.2;

/** 幸运对突变率的加成：父母幸运均值每 100 点，突变率 +100% */
export const LUCK_MUTATION_FACTOR = 0.01;

/** 寿命基础值 */
export const BASE_LIFESPAN = 10;

/** 纯合子性状加成倍率 */
export const HOMOZYGOUS_BONUS_MULTIPLIER = 1.5;

/** MYTHIC 突变：全属性额外加成 */
export const MYTHIC_STAT_BONUS = 3;

/** MYTHIC 突变：寿命额外加成 */
export const MYTHIC_LIFESPAN_BONUS = 5;

/** 近亲繁殖：同国家父母时属性惩罚（乘以 0.95） */
export const INBREEDING_PENALTY = 0.95;

/** 跨国杂交：不同国家父母时属性加成 */
export const HYBRID_VIGOR_BONUS = 3;

/** 性状繁育触发器：该性状的父母参与繁育时，后代突变率乘数 */
export const TRAIT_MUTATION_BOOST: Record<string, number> = {
    StarryEye: 1.5,   // 星空眼：下一代突变率 +50%
    Godly_Glow: 1.2,  // 神话光辉：下一代突变率 +20%
};

/** 六维属性键名（用于遍历） */
export const STAT_KEYS: (keyof Stats)[] = [
    'constitution', 'strength', 'agility', 'intelligence', 'charm', 'luck'
];

/** 国家配置 */
export interface KingdomConfig {
    id: string;
    name: string;
    preferredStats: (keyof Stats)[];  // 偏好属性（可多个）
    covenantBonus: string;            // 盟约加成描述
}

/** 王国配置数组 - 5 个国家 */
export const KINGDOMS: KingdomConfig[] = [
    {
        id: 'north',
        name: '北境王国',
        preferredStats: ['constitution', 'strength'],
        covenantBonus: '体质与力量成长 +15%，寒冬抗性提升',
    },
    {
        id: 'east',
        name: '东域王朝',
        preferredStats: ['intelligence', 'charm'],
        covenantBonus: '智力与魅力成长 +15%，外交成功率提升',
    },
    {
        id: 'south',
        name: '南疆联邦',
        preferredStats: ['agility', 'luck'],
        covenantBonus: '敏捷与幸运成长 +15%，探险收益提升',
    },
    {
        id: 'west',
        name: '西海公国',
        preferredStats: ['charm', 'agility'],
        covenantBonus: '魅力与敏捷成长 +15%，贸易折扣提升',
    },
    {
        id: 'central',
        name: '中央帝国',
        preferredStats: ['constitution', 'intelligence', 'strength'],
        covenantBonus: '全属性均衡成长 +5%，继承权优先',
    },
];
