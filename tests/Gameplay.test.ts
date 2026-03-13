/**
 * 《孟德尔的小猫王朝》玩法分支测试
 * 对应 docs/TEST_CASES.md 中的用例规格
 */

import { describe, it, expect } from 'vitest';
import { CatEntity } from '../assets/Scripts/CatEntity';
import { GeneticsSystem } from '../assets/Scripts/GeneticsSystem';
import {
  BloodlineType,
  KINGDOMS,
  BASE_LIFESPAN,
  MYTHIC_LIFESPAN_BONUS,
  MYTHIC_STAT_BONUS,
  INBREEDING_PENALTY,
  HYBRID_VIGOR_BONUS,
  type GenePair,
  type Stats,
} from '../assets/Scripts/Definitions';

/** 固定随机源：始终不触发突变 */
const noMutationRng = { random: () => 0.5 };
/** 固定随机源：触发突变（< 0.01） */
const triggerMutationRng = { random: () => 0.005 };
/** 固定随机源：触发 StarryEye 加成后的突变（< 0.015） */
const triggerStarryMutationRng = { random: () => 0.01 };

const baseStats: Stats = { constitution: 50, strength: 50, agility: 50, intelligence: 50, charm: 50, luck: 50 };
const defaultGene: GenePair = [{ trait: 'blue', dominant: true }, { trait: 'green', dominant: false }];

function createCat(overrides: Record<string, unknown> = {}) {
  return new CatEntity({
    stats: baseStats,
    bloodline: BloodlineType.ROYAL,
    kingdomId: 'central',
    generation: 1,
    eyeGene: defaultGene,
    furGene: defaultGene,
    randomSource: noMutationRng,
    ...overrides,
  });
}

// ========== 一、遗传系统 ==========

describe('1.1 显隐性逻辑', () => {
  it('G-1.1.1 单显性（父本显性）', () => {
    const cat = createCat({ eyeGene: [{ trait: 'blue', dominant: true }, { trait: 'green', dominant: false }] });
    expect(cat.expressedEyeTrait).toBe('blue');
  });

  it('G-1.1.2 单显性（母本显性）', () => {
    const cat = createCat({ eyeGene: [{ trait: 'blue', dominant: false }, { trait: 'green', dominant: true }] });
    expect(cat.expressedEyeTrait).toBe('green');
  });

  it('G-1.1.3 双隐性', () => {
    const cat = createCat({ eyeGene: [{ trait: 'blue', dominant: false }, { trait: 'green', dominant: false }] });
    expect(cat.expressedEyeTrait).toBe('blue');
  });
});

describe('1.2 共显性', () => {
  it('G-1.2.1 Flame + Ice → Steam', () => {
    const cat = createCat({
      eyeGene: [{ trait: 'Flame', dominant: true }, { trait: 'Ice', dominant: true }],
    });
    expect(cat.expressedEyeTrait).toBe('Steam');
  });

  it('G-1.2.2 Blue + Gold → Azure', () => {
    const cat = createCat({
      eyeGene: [{ trait: 'Blue', dominant: true }, { trait: 'Gold', dominant: true }],
    });
    expect(cat.expressedEyeTrait).toBe('Azure');
  });

  it('G-1.2.3 双显性无映射取第一个', () => {
    const cat = createCat({
      eyeGene: [{ trait: 'X', dominant: true }, { trait: 'Y', dominant: true }],
    });
    expect(cat.expressedEyeTrait).toBe('X');
  });
});

describe('1.3 稀有突变', () => {
  it('G-1.3.1 突变触发', () => {
    const cat = createCat({ randomSource: triggerMutationRng });
    cat.expressedEyeTrait; // 触发计算
    expect(cat.bloodline).toBe(BloodlineType.MYTHIC);
    expect(cat.expressedEyeTrait).toBe('Godly_Glow');
  });

  it('G-1.3.2 突变未触发', () => {
    const cat = createCat();
    expect(cat.expressedEyeTrait).toBe('blue');
    expect(cat.bloodline).toBe(BloodlineType.ROYAL);
  });

  it('G-1.3.3 StarryEye 父母提高突变率', () => {
    const father = createCat({
      cachedTraits: { eye: 'StarryEye', fur: 'orange' },
      randomSource: noMutationRng,
    });
    const mother = createCat({ randomSource: noMutationRng });
    const genetics = new GeneticsSystem(noMutationRng);
    const child = genetics.breed(father, mother);
    expect(child.mutationChanceMultiplier).toBeGreaterThanOrEqual(1.5);
    // 验证 1.5x 突变率：random=0.01 时，0.01 < 0.015 会触发
    const childWithMutRng = new CatEntity({
      stats: child.stats,
      bloodline: child.bloodline,
      kingdomId: child.kingdomId,
      motherKingdomId: child.motherKingdomId,
      motherBloodline: child.motherBloodline,
      generation: child.generation,
      eyeGene: child.eyeGene,
      furGene: child.furGene,
      randomSource: triggerStarryMutationRng,
      mutationChanceMultiplier: 1.5,
    });
    childWithMutRng.expressedEyeTrait;
    expect(childWithMutRng.bloodline).toBe(BloodlineType.MYTHIC);
  });
});

describe('1.4 纯合子性状加成', () => {
  it('G-1.4.1 纯合子 blue 加成 1.5 倍', () => {
    const cat = createCat({
      eyeGene: [{ trait: 'blue', dominant: true }, { trait: 'blue', dominant: true }],
      furGene: [{ trait: 'white', dominant: false }, { trait: 'white', dominant: false }],
    });
    const eff = cat.getEffectiveStats();
    // blue 基础 +2 int，纯合子 1.5x = 3
    expect(eff.intelligence).toBe(50 + 3);
  });

  it('G-1.4.2 杂合子 blue 加成正常', () => {
    const cat = createCat({
      eyeGene: [{ trait: 'blue', dominant: true }, { trait: 'green', dominant: false }],
    });
    const eff = cat.getEffectiveStats();
    expect(eff.intelligence).toBe(50 + 2);
  });
});

// ========== 二、属性系统 ==========

describe('2.1 性状属性加成', () => {
  it('S-2.1.1 blue 性状', () => {
    const cat = createCat({ eyeGene: [{ trait: 'blue', dominant: true }, { trait: 'green', dominant: false }] });
    const eff = cat.getEffectiveStats();
    expect(eff.intelligence).toBe(52);
  });

  it('S-2.1.2 Godly_Glow + MYTHIC', () => {
    const cat = createCat({
      bloodline: BloodlineType.MYTHIC,
      cachedTraits: { eye: 'Godly_Glow', fur: 'Godly_Glow' },
    });
    const eff = cat.getEffectiveStats();
    // Godly_Glow 每项 +2，MYTHIC 每项 +3，base 50
    expect(eff.constitution).toBe(50 + 2 + 3);
  });
});

describe('2.2 盟约加成', () => {
  it('S-2.2.1 盟约生效：王室母亲', () => {
    const cat = createCat({
      motherKingdomId: 'north',
      motherBloodline: BloodlineType.ROYAL,
      stats: { ...baseStats, constitution: 80, strength: 80 },
    });
    const eff = cat.getEffectiveStats();
    expect(eff.constitution).toBe(Math.round(80 * 1.15));
    expect(eff.strength).toBe(Math.round(80 * 1.15));
  });

  it('S-2.2.2 盟约失效：无母亲', () => {
    const cat = createCat({ stats: { ...baseStats, constitution: 80 } });
    const eff = cat.getEffectiveStats();
    expect(eff.constitution).toBe(80);
  });

  it('S-2.2.3 盟约失效：流浪猫母亲', () => {
    const cat = createCat({
      motherKingdomId: 'south',
      motherBloodline: BloodlineType.WILD,
      stats: { ...baseStats, constitution: 80 },
    });
    const eff = cat.getEffectiveStats();
    expect(eff.constitution).toBe(80);
  });
});

describe('2.3 MYTHIC 连锁反应', () => {
  it('S-2.3.1 MYTHIC 属性加成', () => {
    const cat = createCat({ bloodline: BloodlineType.MYTHIC });
    const eff = cat.getEffectiveStats();
    expect(eff.constitution).toBe(50 + 2 + 3); // base + Godly_Glow eye + MYTHIC
  });

  it('S-2.3.2 MYTHIC 寿命加成', () => {
    const cat = createCat({
      bloodline: BloodlineType.MYTHIC,
      stats: { ...baseStats, constitution: 50 },
    });
    expect(cat.lifespan).toBe(BASE_LIFESPAN + 5 + MYTHIC_LIFESPAN_BONUS);
  });
});

describe('2.4 寿命计算', () => {
  it('S-2.4.1 基础寿命', () => {
    const cat = createCat({ stats: { ...baseStats, constitution: 50 } });
    expect(cat.lifespan).toBe(10 + 5);
  });
});

// ========== 三、繁育系统 ==========

describe('3.1 属性遗传', () => {
  it('B-3.1.1 均值 + 扰动', () => {
    const father = createCat({ stats: { constitution: 80, strength: 80, agility: 80, intelligence: 80, charm: 80, luck: 80 } });
    const mother = createCat({ stats: { constitution: 40, strength: 40, agility: 40, intelligence: 40, charm: 40, luck: 40 } });
    const genetics = new GeneticsSystem({ random: () => 0.5 });
    const child = genetics.breed(father, mother);
    for (const k of ['constitution', 'strength', 'agility', 'intelligence', 'charm', 'luck'] as const) {
      expect(child.stats[k]).toBeGreaterThanOrEqual(50 - 6);
      expect(child.stats[k]).toBeLessThanOrEqual(60 + 6);
    }
  });

  it('B-3.1.2 WILD 偏科突变', () => {
    const father = createCat();
    const mother = createCat({ bloodline: BloodlineType.WILD, kingdomId: 'south' });
    const genetics = new GeneticsSystem({ random: () => 0.16 }); // 选 constitution
    const child = genetics.breed(father, mother);
    expect(child.stats.constitution).toBeGreaterThan(50);
    expect(child.stats.strength).toBeLessThan(50);
  });

  it('B-3.1.3 近亲繁殖衰退', () => {
    const father = createCat({ kingdomId: 'north', stats: { constitution: 60, strength: 60, agility: 60, intelligence: 60, charm: 60, luck: 60 } });
    const mother = createCat({ kingdomId: 'north', stats: { constitution: 60, strength: 60, agility: 60, intelligence: 60, charm: 60, luck: 60 } });
    const genetics = new GeneticsSystem({ random: () => 0.5 });
    const child = genetics.breed(father, mother);
    const expectedAvg = 60 * INBREEDING_PENALTY;
    expect(child.stats.constitution).toBeCloseTo(expectedAvg, -1);
  });

  it('B-3.1.4 跨国杂交优势', () => {
    const father = createCat({ kingdomId: 'north', stats: { constitution: 50, strength: 50, agility: 50, intelligence: 50, charm: 50, luck: 50 } });
    const mother = createCat({ kingdomId: 'east', stats: { constitution: 50, strength: 50, agility: 50, intelligence: 50, charm: 50, luck: 50 } });
    const genetics = new GeneticsSystem({ random: () => 0.5 });
    const child = genetics.breed(father, mother);
    expect(child.stats.constitution).toBe(50 + HYBRID_VIGOR_BONUS);
  });
});

describe('3.2 血统与王国继承', () => {
  it('B-3.2.1 motherKingdomId 传递', () => {
    const father = createCat({ kingdomId: 'north' });
    const mother = createCat({ kingdomId: 'east' });
    const genetics = new GeneticsSystem(noMutationRng);
    const child = genetics.breed(father, mother);
    expect(child.motherKingdomId).toBe('east');
  });

  it('B-3.2.2 motherBloodline 传递', () => {
    const father = createCat();
    const mother = createCat({ bloodline: BloodlineType.ROYAL });
    const genetics = new GeneticsSystem(noMutationRng);
    const child = genetics.breed(father, mother);
    expect(child.motherBloodline).toBe(BloodlineType.ROYAL);
  });

  it('B-3.2.3 代数递增', () => {
    const father = createCat({ generation: 2 });
    const mother = createCat({ generation: 1 });
    const genetics = new GeneticsSystem(noMutationRng);
    const child = genetics.breed(father, mother);
    expect(child.generation).toBe(3);
  });
});

describe('3.3 性状触发器', () => {
  it('B-3.3.1 StarryEye 父母', () => {
    const father = createCat({ cachedTraits: { eye: 'StarryEye', fur: 'orange' } });
    const mother = createCat();
    const genetics = new GeneticsSystem(noMutationRng);
    const child = genetics.breed(father, mother);
    expect(child.mutationChanceMultiplier).toBeGreaterThanOrEqual(1.5);
  });

  it('B-3.3.3 无触发性状', () => {
    const father = createCat();
    const mother = createCat();
    const genetics = new GeneticsSystem(noMutationRng);
    const child = genetics.breed(father, mother);
    expect(child.mutationChanceMultiplier).toBe(1);
  });
});

// ========== 四、王朝更迭（逻辑验证） ==========

describe('4.1 继承逻辑', () => {
  it('D-4.1.1 综合最高者', () => {
    const cats = [
      createCat({ stats: { constitution: 70, strength: 70, agility: 70, intelligence: 70, charm: 70, luck: 70 } }),
      createCat({ stats: { constitution: 60, strength: 60, agility: 60, intelligence: 60, charm: 60, luck: 60 } }),
      createCat({ stats: { constitution: 50, strength: 50, agility: 50, intelligence: 50, charm: 50, luck: 50 } }),
    ];
    const sorted = [...cats].sort((a, b) => b.getCompositeScore() - a.getCompositeScore());
    expect(sorted[0]).toBe(cats[0]);
  });
});

describe('4.2 权力冲突', () => {
  it('D-4.2.1 可篡位条件', () => {
    const kingdom = KINGDOMS.find((k) => k.id === 'central')!;
    const king = createCat({
      kingdomId: 'central',
      stats: { constitution: 60, strength: 60, agility: 60, intelligence: 60, charm: 60, luck: 60 },
    });
    const usurper = createCat({
      kingdomId: 'central',
      stats: { constitution: 80, strength: 60, agility: 60, intelligence: 60, charm: 60, luck: 60 },
    });
    const kingEff = king.getEffectiveStats();
    const usurperEff = usurper.getEffectiveStats();
    const canUsurp = kingdom.preferredStats.some((s) => usurperEff[s] - kingEff[s] >= 15);
    expect(canUsurp).toBe(true);
  });

  it('D-4.2.2 不可篡位', () => {
    const kingdom = KINGDOMS.find((k) => k.id === 'central')!;
    const king = createCat({ kingdomId: 'central', stats: { constitution: 70, strength: 70, agility: 70, intelligence: 70, charm: 70, luck: 70 } });
    const usurper = createCat({ kingdomId: 'central', stats: { constitution: 72, strength: 72, agility: 72, intelligence: 72, charm: 72, luck: 72 } });
    const kingEff = king.getEffectiveStats();
    const usurperEff = usurper.getEffectiveStats();
    const canUsurp = kingdom.preferredStats.some((s) => usurperEff[s] - kingEff[s] >= 15);
    expect(canUsurp).toBe(false);
  });
});

// ========== 五、边界与异常 ==========

describe('5. 边界与异常', () => {
  it('E-5.1 属性钳制上限', () => {
    const cat = createCat({
      stats: { constitution: 95, strength: 95, agility: 95, intelligence: 95, charm: 95, luck: 95 },
      motherKingdomId: 'north',
      motherBloodline: BloodlineType.ROYAL,
    });
    const eff = cat.getEffectiveStats();
    expect(eff.constitution).toBeLessThanOrEqual(100);
  });

  it('E-5.3 clone 保留性状', () => {
    const cat = createCat({ cachedTraits: { eye: 'blue', fur: 'orange' } });
    const cloned = cat.clone();
    expect(cloned.expressedEyeTrait).toBe('blue');
    expect(cloned.expressedFurTrait).toBe('orange');
  });

  it('E-5.4 hasGeniusMutation', () => {
    const cat = createCat({
      stats: { constitution: 98, strength: 50, agility: 50, intelligence: 50, charm: 50, luck: 50 },
    });
    expect(cat.hasGeniusMutation()).toBe(true);
  });
});
