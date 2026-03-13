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
}

/** 基因单元：单个等位基因 */
export interface GeneAllele {
    trait: string;      // 性状值，如 "blue", "orange"
    dominant: boolean;  // 是否为显性
}

/** 基因对：[父本基因, 母本基因] */
export type GenePair = [GeneAllele, GeneAllele];

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
