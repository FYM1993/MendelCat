import { _decorator, Component, log } from 'cc';
const { ccclass } = _decorator;

import { CatEntity } from './CatEntity';
import { GeneticsSystem } from './GeneticsSystem';
import { BloodlineType, STAT_KEYS, KINGDOMS, type Stats, type GenePair } from './Definitions';

/** 默认基因对模板 */
const DEFAULT_EYE_GENE: GenePair = [
    { trait: 'blue', dominant: true },
    { trait: 'green', dominant: false },
];
const DEFAULT_FUR_GENE: GenePair = [
    { trait: 'orange', dominant: true },
    { trait: 'white', dominant: false },
];

/** 邻国 ID 列表（不含中央帝国，用于候选） */
const NEIGHBOR_KINGDOM_IDS = ['north', 'east', 'south', 'west'];

@ccclass('BreedingTest')
export class BreedingTest extends Component {

    start() {
        this.runDynastySimulation();
    }

    /** 运行王朝模拟：10 代家族更迭 */
    runDynastySimulation() {
        log("--- 孟德尔的小猫王朝 ---");

        const genetics = new GeneticsSystem();

        // 初始化：初代猫王
        let catKing = this.createFirstCatKing();
        log(`【第 ${catKing.generation} 代】初代猫王登基，六维均值: ${catKing.getStatsAverage().toFixed(1)}，寿命: ${catKing.lifespan.toFixed(1)}`);

        for (let gen = 2; gen <= 10; gen++) {
            // 生成配偶候选：3 邻国 + 1 荒野
            const neighborCats = this.createNeighborCandidates(3);
            const wildCat = this.createWildStray();
            const spouseCandidates = [...neighborCats, wildCat];

            // 随机选一个配偶
            const spouseIndex = Math.floor(Math.random() * spouseCandidates.length);
            const spouse = spouseCandidates[spouseIndex];
            const spouseType =
                spouse.bloodline === BloodlineType.MYTHIC ? '神话血统' :
                spouse.bloodline === BloodlineType.WILD ? '荒野流浪猫' : '邻国王室';

            log(`【第 ${gen} 代】配偶类型: ${spouseType}`);

            // 繁育 3 个后代
            const offspring: CatEntity[] = [];
            for (let i = 0; i < 3; i++) {
                offspring.push(genetics.breed(catKing, spouse));
            }

            // 按综合属性降序排序
            offspring.sort((a, b) => b.getCompositeScore() - a.getCompositeScore());
            let nextKing = offspring[0];
            nextKing.name = `第${gen}代猫王`;

            // 模拟权力冲突：属性第二高的猫若在偏好属性上超过新王 15 点，30% 概率篡位
            if (offspring.length >= 2) {
                const usurper = offspring[1];
                const kingdom = KINGDOMS.find((k) => k.id === nextKing.kingdomId);
                const kingEff = nextKing.getEffectiveStats();
                const usurperEff = usurper.getEffectiveStats();
                const canUsurp = kingdom?.preferredStats.some(
                    (stat) => usurperEff[stat] - kingEff[stat] >= 15
                );
                if (canUsurp && Math.random() < 0.3) {
                    usurper.name = `第${gen}代猫王`;
                    nextKing = usurper;
                    log(`⚔️ 夺权篡位！次子在某项国家偏好属性上碾压新王，发动政变成功！`);
                }
            }

            const avg = nextKing.getStatsAverage().toFixed(1);
            log(`【第 ${gen} 代】新猫王六维均值: ${avg}，寿命: ${nextKing.lifespan.toFixed(1)}`);

            if (nextKing.isMythic()) {
                log(`🌟 喜报！稀有突变！神话血统觉醒，性状「Godly_Glow」降临！`);
            }
            if (nextKing.hasGeniusMutation()) {
                const eff = nextKing.getEffectiveStats();
                const geniusStat = STAT_KEYS.find((k) => eff[k] > 95);
                const statNames: Record<string, string> = {
                    constitution: '体质', strength: '力量', agility: '敏捷',
                    intelligence: '智力', charm: '魅力', luck: '幸运',
                };
                if (geniusStat) {
                    log(`🎉 喜报！偏科天才诞生！${statNames[geniusStat]}突破 95，达 ${eff[geniusStat]}！`);
                }
            }

            catKing = nextKing;
        }

        log("--- 王朝模拟结束 ---");
    }

    /** 创建初代猫王 */
    private createFirstCatKing(): CatEntity {
        return new CatEntity({
            name: '初代猫王',
            stats: { constitution: 70, strength: 65, agility: 60, intelligence: 55, charm: 50, luck: 45 },
            bloodline: BloodlineType.ROYAL,
            kingdomId: 'central',
            generation: 1,
            eyeGene: DEFAULT_EYE_GENE,
            furGene: DEFAULT_FUR_GENE,
        });
    }

    /** 创建邻国候选猫（属性平衡） */
    private createNeighborCandidates(count: number): CatEntity[] {
        const result: CatEntity[] = [];
        for (let i = 0; i < count; i++) {
            const base = 50 + Math.floor(Math.random() * 15);
            const stats: Stats = {
                constitution: base,
                strength: base + (Math.random() * 6 - 3),
                agility: base + (Math.random() * 6 - 3),
                intelligence: base + (Math.random() * 6 - 3),
                charm: base + (Math.random() * 6 - 3),
                luck: base + (Math.random() * 6 - 3),
            };
            for (const k of STAT_KEYS) {
                stats[k] = Math.max(0, Math.min(100, Math.round(stats[k])));
            }
            const kingdomId = NEIGHBOR_KINGDOM_IDS[i % NEIGHBOR_KINGDOM_IDS.length];
            result.push(new CatEntity({
                stats,
                bloodline: BloodlineType.ROYAL,
                kingdomId,
                generation: 1,
                eyeGene: DEFAULT_EYE_GENE,
                furGene: DEFAULT_FUR_GENE,
            }));
        }
        return result;
    }

    /** 创建荒野流浪猫（某项 90+，其他极低） */
    private createWildStray(): CatEntity {
        const boostIndex = Math.floor(Math.random() * STAT_KEYS.length);
        const stats: Stats = {
            constitution: 8,
            strength: 8,
            agility: 8,
            intelligence: 8,
            charm: 8,
            luck: 8,
        };
        stats[STAT_KEYS[boostIndex]] = 90 + Math.floor(Math.random() * 10);
        return new CatEntity({
            stats,
            bloodline: BloodlineType.WILD,
            kingdomId: 'south',
            generation: 1,
            eyeGene: [{ trait: 'amber', dominant: true }, { trait: 'green', dominant: false }],
            furGene: [{ trait: 'gray', dominant: true }, { trait: 'striped', dominant: false }],
        });
    }
}
