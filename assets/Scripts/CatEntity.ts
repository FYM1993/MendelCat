/**
 * 孟德尔的小猫王朝 - 猫咪实体
 * 纯数据与逻辑，无 Cocos 依赖，便于单测
 */

import type { Stats, BloodlineType, GeneAllele, GenePair } from './Definitions';

/** 猫咪实体 */
export class CatEntity {
    /** 六维属性 */
    stats: Stats;

    /** 血统类型 */
    bloodline: BloodlineType;

    /** 所属国家 ID（对应 KINGDOMS 中的 id） */
    kingdomId: string;

    /** 代数（第几代） */
    generation: number;

    /** 眼睛基因对：[父本基因, 母本基因] */
    eyeGene: GenePair;

    /** 毛发基因对：[父本基因, 母本基因] */
    furGene: GenePair;

    constructor(params: {
        stats: Stats;
        bloodline: BloodlineType;
        kingdomId: string;
        generation: number;
        eyeGene: GenePair;
        furGene: GenePair;
    }) {
        this.stats = { ...params.stats };
        this.bloodline = params.bloodline;
        this.kingdomId = params.kingdomId;
        this.generation = params.generation;
        this.eyeGene = [params.eyeGene[0], params.eyeGene[1]];
        this.furGene = [params.furGene[0], params.furGene[1]];
    }

    /**
     * 计算基因对的表现性状
     * 孟德尔遗传：若两个基因中有一个是显性，则表现该显性性状；
     * 若两者均为隐性，则表现第一个隐性性状（或可约定为第二个，此处取第一个）
     */
    getExpressedTrait(genePair: GenePair): string {
        const [alleleA, alleleB] = genePair;
        if (alleleA.dominant) return alleleA.trait;
        if (alleleB.dominant) return alleleB.trait;
        // 两者均为隐性，表现第一个
        return alleleA.trait;
    }

    /** 眼睛表现性状 */
    get expressedEyeTrait(): string {
        return this.getExpressedTrait(this.eyeGene);
    }

    /** 毛发表现性状 */
    get expressedFurTrait(): string {
        return this.getExpressedTrait(this.furGene);
    }

    /** 克隆当前实体（深拷贝） */
    clone(): CatEntity {
        return new CatEntity({
            stats: { ...this.stats },
            bloodline: this.bloodline,
            kingdomId: this.kingdomId,
            generation: this.generation,
            eyeGene: [
                { ...this.eyeGene[0] },
                { ...this.eyeGene[1] },
            ],
            furGene: [
                { ...this.furGene[0] },
                { ...this.furGene[1] },
            ],
        });
    }
}
