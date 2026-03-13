/**
 * 孟德尔的小猫王朝 - 猫咪实体
 * 纯数据与逻辑，无 Cocos 依赖，便于单测
 */

import type { Stats, GeneAllele, GenePair } from './Definitions';
import {
    BloodlineType,
    STAT_KEYS,
    CODOMINANCE_MAP,
    TRAIT_STAT_BONUSES,
    MYTHIC_TRAIT,
    MUTATION_CHANCE,
    COVENANT_MULTIPLIER,
    BASE_LIFESPAN,
    HOMOZYGOUS_BONUS_MULTIPLIER,
    MYTHIC_STAT_BONUS,
    MYTHIC_LIFESPAN_BONUS,
} from './Definitions';
import { KINGDOMS } from './Definitions';

/** 随机数生成器接口，便于单测注入 */
export interface RandomSource {
    random(): number;
}

/** 猫咪实体 */
export class CatEntity {
    /** 显示名称（可选，用于猫王等） */
    name?: string;

    /** 六维属性 */
    stats: Stats;

    /** 血统类型 */
    bloodline: BloodlineType;

    /** 所属国家 ID（对应 KINGDOMS 中的 id） */
    kingdomId: string;

    /** 母亲所属国家 ID（用于盟约加成，仅后代有） */
    motherKingdomId?: string;

    /** 母亲血统（用于判断盟约是否生效：仅王室/神话联姻有盟约） */
    motherBloodline?: BloodlineType;

    /** 突变率乘数（由父母性状触发，如 StarryEye 提高下一代突变率） */
    mutationChanceMultiplier?: number;

    /** 代数（第几代） */
    generation: number;

    /** 眼睛基因对：[父本基因, 母本基因] */
    eyeGene: GenePair;

    /** 毛发基因对：[父本基因, 母本基因] */
    furGene: GenePair;

    private rng: RandomSource;
    private _cachedEyeTrait?: string;
    private _cachedFurTrait?: string;

    constructor(params: {
        name?: string;
        stats: Stats;
        bloodline: BloodlineType;
        kingdomId: string;
        motherKingdomId?: string;
        motherBloodline?: BloodlineType;
        mutationChanceMultiplier?: number;
        generation: number;
        eyeGene: GenePair;
        furGene: GenePair;
        randomSource?: RandomSource;
        cachedTraits?: { eye?: string; fur?: string };
    }) {
        this.name = params.name;
        this.stats = { ...params.stats };
        this.bloodline = params.bloodline;
        this.rng = params.randomSource ?? { random: () => Math.random() };
        if (params.cachedTraits?.eye !== undefined) this._cachedEyeTrait = params.cachedTraits.eye;
        if (params.cachedTraits?.fur !== undefined) this._cachedFurTrait = params.cachedTraits.fur;
        this.kingdomId = params.kingdomId;
        this.motherKingdomId = params.motherKingdomId;
        this.motherBloodline = params.motherBloodline;
        this.mutationChanceMultiplier = params.mutationChanceMultiplier ?? 1.0;
        this.generation = params.generation;
        this.eyeGene = [params.eyeGene[0], params.eyeGene[1]];
        this.furGene = [params.furGene[0], params.furGene[1]];
    }

    /**
     * 计算基因对的表现性状（内部实现，支持缓存）
     * 1. 稀有突变：1% 概率返回 Godly_Glow，并标记 bloodline 为 MYTHIC
     * 2. 共显性：双显性且性状不同时，查表返回合成性状
     * 3. 常规：单显性表现该性状，双隐性表现第一个
     */
    private computeTrait(genePair: GenePair, cacheKey: 'eye' | 'fur'): string {
        if (cacheKey === 'eye' && this._cachedEyeTrait !== undefined) return this._cachedEyeTrait;
        if (cacheKey === 'fur' && this._cachedFurTrait !== undefined) return this._cachedFurTrait;

        // 1. 稀有突变（受父母性状影响，如 StarryEye 提高突变率）
        const effectiveChance = MUTATION_CHANCE * this.mutationChanceMultiplier!;
        if (this.rng.random() < effectiveChance) {
            this.bloodline = BloodlineType.MYTHIC;
            const trait = MYTHIC_TRAIT;
            if (cacheKey === 'eye') this._cachedEyeTrait = trait;
            else this._cachedFurTrait = trait;
            return trait;
        }

        const [alleleA, alleleB] = genePair;

        // 2. 共显性：双显性且性状不同
        if (alleleA.dominant && alleleB.dominant && alleleA.trait !== alleleB.trait) {
            const key = [alleleA.trait, alleleB.trait].sort().join('|');
            const combined = CODOMINANCE_MAP[key];
            const trait = combined ?? alleleA.trait;  // 无映射时取第一个
            if (cacheKey === 'eye') this._cachedEyeTrait = trait;
            else this._cachedFurTrait = trait;
            return trait;
        }

        // 3. 常规遗传
        let trait: string;
        if (alleleA.dominant) trait = alleleA.trait;
        else if (alleleB.dominant) trait = alleleB.trait;
        else trait = alleleA.trait;

        if (cacheKey === 'eye') this._cachedEyeTrait = trait;
        else this._cachedFurTrait = trait;
        return trait;
    }

    /** 眼睛表现性状 */
    get expressedEyeTrait(): string {
        return this.computeTrait(this.eyeGene, 'eye');
    }

    /** 毛发表现性状 */
    get expressedFurTrait(): string {
        return this.computeTrait(this.furGene, 'fur');
    }

    /** 是否为纯合子（两基因相同且均为显性） */
    private isHomozygous(genePair: GenePair): boolean {
        const [a, b] = genePair;
        return a.trait === b.trait && a.dominant && b.dominant;
    }

    /** 获取性状加成（含纯合子 50% 提升） */
    private getTraitBonus(trait: string, genePair: GenePair): Partial<Stats> {
        const base = TRAIT_STAT_BONUSES[trait];
        if (!base) return {};
        const mult = this.isHomozygous(genePair) ? HOMOZYGOUS_BONUS_MULTIPLIER : 1;
        const result: Partial<Stats> = {};
        for (const k of STAT_KEYS) {
            const v = (base[k] ?? 0) * mult;
            if (v > 0) result[k] = Math.round(v);
        }
        return result;
    }

    /**
     * 盟约加成：仅当母亲为王室/神话血统时生效（README：只有母系血统对上时盟约才生效）
     * 荒野流浪猫联姻不提供盟约
     */
    applyCovenant(stats: Stats): Stats {
        if (!this.motherKingdomId) return stats;
        if (this.motherBloodline === BloodlineType.WILD) return stats;  // 流浪猫无盟约
        const kingdom = KINGDOMS.find((k) => k.id === this.motherKingdomId);
        if (!kingdom) return stats;
        const result = { ...stats };
        for (const k of kingdom.preferredStats) {
            result[k] = Math.round(result[k] * COVENANT_MULTIPLIER);
            result[k] = Math.max(0, Math.min(100, result[k]));
        }
        return result;
    }

    /** 寿命：base_age(10) + constitution / 10 + MYTHIC 加成 */
    get lifespan(): number {
        let base = BASE_LIFESPAN + this.stats.constitution / 10;
        if (this.bloodline === BloodlineType.MYTHIC) base += MYTHIC_LIFESPAN_BONUS;
        return base;
    }

    /** 有效属性（基础 + 性状加成 + MYTHIC 加成 + 盟约加成） */
    getEffectiveStats(): Stats {
        const result = { ...this.stats };
        const eyeBonus = this.getTraitBonus(this.expressedEyeTrait, this.eyeGene);
        const furBonus = this.getTraitBonus(this.expressedFurTrait, this.furGene);
        for (const k of STAT_KEYS) {
            result[k] = this.stats[k] + (eyeBonus[k] ?? 0) + (furBonus[k] ?? 0);
            if (this.bloodline === BloodlineType.MYTHIC) result[k] += MYTHIC_STAT_BONUS;
            result[k] = Math.max(0, Math.min(100, Math.round(result[k])));
        }
        return this.applyCovenant(result);
    }

    /** 综合属性（六维之和，含性状加成） */
    getCompositeScore(): number {
        const eff = this.getEffectiveStats();
        return STAT_KEYS.reduce((sum, k) => sum + eff[k], 0);
    }

    /** 六维均值（含性状加成） */
    getStatsAverage(): number {
        return this.getCompositeScore() / STAT_KEYS.length;
    }

    /** 是否存在偏科天才（某属性 > 95，含性状加成） */
    hasGeniusMutation(): boolean {
        const eff = this.getEffectiveStats();
        return STAT_KEYS.some((k) => eff[k] > 95);
    }

    /** 是否为神话血统（稀有突变） */
    isMythic(): boolean {
        return this.bloodline === BloodlineType.MYTHIC;
    }

    /** 克隆当前实体（深拷贝，保留已计算的性状） */
    clone(): CatEntity {
        const eyeTrait = this.expressedEyeTrait;
        const furTrait = this.expressedFurTrait;
        return new CatEntity({
            name: this.name,
            stats: { ...this.stats },
            bloodline: this.bloodline,
            kingdomId: this.kingdomId,
            motherKingdomId: this.motherKingdomId,
            motherBloodline: this.motherBloodline,
            mutationChanceMultiplier: this.mutationChanceMultiplier,
            generation: this.generation,
            eyeGene: [
                { ...this.eyeGene[0] },
                { ...this.eyeGene[1] },
            ],
            furGene: [
                { ...this.furGene[0] },
                { ...this.furGene[1] },
            ],
            cachedTraits: { eye: eyeTrait, fur: furTrait },
        });
    }
}
