/**
 * 孟德尔的小猫王朝 - 游戏玩法服务
 * 将六维属性与核心玩法机制绑定，纯逻辑无 Cocos 依赖
 */

import type { Stats } from './Definitions';
import { CatEntity } from './CatEntity';
import { KINGDOMS } from './Definitions';

/** 篡位基础概率 */
const BASE_USURP_CHANCE = 0.2;

/** 篡位：力量每超 1 点增加的胜率 */
const STR_USURP_FACTOR = 0.01;

/** 篡位：体质每高 1 点减少的被篡位率 */
const CON_DEFENSE_FACTOR = 0.005;

/** 刺杀基础概率（每代） */
const BASE_ASSASSINATION_CHANCE = 0.12;

/** 敏捷：每点减少的刺杀死亡率 */
const AGI_DODGE_FACTOR = 0.008;

/** 魅力：流浪猫出现概率基础值 */
const BASE_WILD_CHANCE = 0.25;

/** 魅力：每点增加的流浪猫概率 */
const CHA_WILD_FACTOR = 0.003;

/**
 * 计算篡位成功概率
 * 力量：篡位者 STR 越高、新王 STR 越低，成功率越高
 * 体质：新王 CON 越高，越难被推翻（王朝稳定性）
 */
export function calcUsurpChance(king: CatEntity, usurper: CatEntity): number {
    const kingEff = king.getEffectiveStats();
    const usurperEff = usurper.getEffectiveStats();
    const strDiff = usurperEff.strength - kingEff.strength;
    const conDefense = kingEff.constitution * CON_DEFENSE_FACTOR;
    let chance = BASE_USURP_CHANCE + strDiff * STR_USURP_FACTOR - conDefense;
    return Math.max(0, Math.min(1, chance));
}

/**
 * 计算刺杀事件中猫王存活概率
 * 敏捷：AGI 越高，越容易规避刺杀
 */
export function calcAssassinationSurviveChance(king: CatEntity): number {
    const eff = king.getEffectiveStats();
    return Math.min(0.95, eff.agility * AGI_DODGE_FACTOR);
}

/**
 * 每代刺杀事件触发概率
 */
export function getAssassinationChance(): number {
    return BASE_ASSASSINATION_CHANCE;
}

/**
 * 根据猫王魅力计算配偶池中荒野流浪猫的出现概率
 * 魅力：CHA 越高，流浪猫（基因库）造访概率越高
 */
export function calcWildSpouseChance(king: CatEntity): number {
    const eff = king.getEffectiveStats();
    return Math.min(0.6, BASE_WILD_CHANCE + eff.charm * CHA_WILD_FACTOR);
}
