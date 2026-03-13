/**
 * 孟德尔的小猫王朝 - 遗传系统
 * 纯逻辑类，负责繁育计算、基因交叉、变异判断
 * 无 Cocos 依赖，便于单测
 */

import type { Stats, GenePair, GeneAllele } from './Definitions';
import { BloodlineType, STAT_KEYS } from './Definitions';
import { CatEntity } from './CatEntity';

/** 随机数生成器接口，便于单测时注入确定性随机源 */
export interface RandomSource {
    random(): number;
}

/** 默认使用 Math.random */
const defaultRandom: RandomSource = {
    random: () => Math.random(),
};

export class GeneticsSystem {
    private rng: RandomSource;

    /** 属性扰动幅度（相对于均值的比例），如 0.1 表示 ±10% */
    private readonly statVariance = 0.1;

    /** 偏科突变：大涨属性的增幅（绝对值） */
    private readonly mutationBoost = 25;

    /** 偏科突变：其他属性的减幅（绝对值） */
    private readonly mutationPenalty = 15;

    constructor(randomSource?: RandomSource) {
        this.rng = randomSource ?? defaultRandom;
    }

    /**
     * 繁育：根据父母生成后代
     */
    breed(father: CatEntity, mother: CatEntity): CatEntity {
        const stats = this.calcInheritedStats(father, mother);
        const eyeGene = this.crossoverGenePair(father.eyeGene, mother.eyeGene);
        const furGene = this.crossoverGenePair(father.furGene, mother.furGene);
        const kingdomId = this.pickKingdom(father.kingdomId, mother.kingdomId);
        const bloodline = this.pickBloodline(father.bloodline, mother.bloodline);
        const generation = Math.max(father.generation, mother.generation) + 1;

        return new CatEntity({
            stats,
            bloodline,
            kingdomId,
            generation,
            eyeGene,
            furGene,
        });
    }

    /**
     * 计算遗传属性：均值 + 随机扰动
     * 若父母任一方含 WILD 血统，触发偏科突变
     */
    private calcInheritedStats(father: CatEntity, mother: CatEntity): Stats {
        const hasWild = father.bloodline === BloodlineType.WILD || mother.bloodline === BloodlineType.WILD;

        const base: Stats = {
            constitution: 0,
            strength: 0,
            agility: 0,
            intelligence: 0,
            charm: 0,
            luck: 0,
        };

        for (const key of STAT_KEYS) {
            const avg = (father.stats[key] + mother.stats[key]) / 2;
            const variance = avg * this.statVariance;
            const perturbed = avg + (this.rng.random() * 2 - 1) * variance;
            base[key] = this.clampStat(perturbed);
        }

        if (hasWild) {
            return this.applyMutation(base);
        }

        return base;
    }

    /**
     * 偏科突变：随机一项属性大涨，其他大跌
     */
    private applyMutation(stats: Stats): Stats {
        const result = { ...stats };
        const boostKey = STAT_KEYS[Math.floor(this.rng.random() * STAT_KEYS.length)];

        for (const key of STAT_KEYS) {
            if (key === boostKey) {
                result[key] = this.clampStat(result[key] + this.mutationBoost);
            } else {
                result[key] = this.clampStat(result[key] - this.mutationPenalty);
            }
        }

        return result;
    }

    /**
     * 基因交叉：从父母基因对中各随机取一个，组成后代基因对
     */
    private crossoverGenePair(fatherPair: GenePair, motherPair: GenePair): GenePair {
        const fromFather: GeneAllele = fatherPair[this.rng.random() < 0.5 ? 0 : 1];
        const fromMother: GeneAllele = motherPair[this.rng.random() < 0.5 ? 0 : 1];
        return [{ ...fromFather }, { ...fromMother }];
    }

    private pickKingdom(fatherId: string, motherId: string): string {
        return this.rng.random() < 0.5 ? fatherId : motherId;
    }

    private pickBloodline(father: BloodlineType, mother: BloodlineType): BloodlineType {
        return this.rng.random() < 0.5 ? father : mother;
    }

    private clampStat(value: number): number {
        return Math.max(0, Math.min(100, Math.round(value)));
    }
}
