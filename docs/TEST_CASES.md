# 《孟德尔的小猫王朝》测试用例规格

> 覆盖所有玩法分支的完整测试用例清单

---

## 一、遗传系统 (Genetics System)

### 1.1 显隐性逻辑

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| G-1.1.1 | 单显性（父本显性） | eyeGene: [{trait:'blue',dominant:true}, {trait:'green',dominant:false}] | expressedEyeTrait === 'blue' |
| G-1.1.2 | 单显性（母本显性） | eyeGene: [{trait:'blue',dominant:false}, {trait:'green',dominant:true}] | expressedEyeTrait === 'green' |
| G-1.1.3 | 双隐性 | eyeGene: [{trait:'blue',dominant:false}, {trait:'green',dominant:false}] | expressedEyeTrait === 'blue'（取第一个） |

### 1.2 共显性 (Codominance)

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| G-1.2.1 | Flame + Ice → Steam | eyeGene: [{trait:'Flame',dominant:true}, {trait:'Ice',dominant:true}] | expressedEyeTrait === 'Steam' |
| G-1.2.2 | Blue + Gold → Azure | eyeGene: [{trait:'Blue',dominant:true}, {trait:'Gold',dominant:true}] | expressedEyeTrait === 'Azure' |
| G-1.2.3 | 双显性但无映射 | eyeGene: [{trait:'X',dominant:true}, {trait:'Y',dominant:true}] | expressedEyeTrait === 'X'（取第一个） |

### 1.3 稀有突变 (MYTHIC)

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| G-1.3.1 | 突变触发 | randomSource 返回 < 0.01 | bloodline === MYTHIC, expressedEyeTrait === 'Godly_Glow' |
| G-1.3.2 | 突变未触发 | randomSource 返回 >= 0.01 | 按正常遗传逻辑 |
| G-1.3.3 | 性状触发器：StarryEye 父母 | 父母一方有 StarryEye，mutationChanceMultiplier=1.5 | 突变率 1.5%，random<0.015 时触发 |

### 1.4 纯合子性状加成

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| G-1.4.1 | 纯合子 blue | eyeGene: [{trait:'blue',dominant:true}, {trait:'blue',dominant:true}] | intelligence 加成 3（2×1.5） |
| G-1.4.2 | 杂合子 blue | eyeGene: [{trait:'blue',dominant:true}, {trait:'green',dominant:false}] | intelligence 加成 2 |

### 1.5 基因交叉

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| G-1.5.1 | 确定性交叉 | rng 固定返回 0，父[0]+母[0] | 后代基因对来自父母各取第一个 |
| G-1.5.2 | 随机性验证 | 多次 breed 同父母 | 后代基因组合有变化 |

---

## 二、属性系统 (Stats System)

### 2.1 性状属性加成

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| S-2.1.1 | blue 性状 | expressedEyeTrait='blue' | intelligence +2 |
| S-2.1.2 | Godly_Glow 性状 | bloodline=MYTHIC | 全属性 +2（TRAIT）+ 3（MYTHIC_STAT_BONUS） |
| S-2.1.3 | 无加成性状 | 性状不在 TRAIT_STAT_BONUSES | 无额外加成 |

### 2.2 盟约加成 (Covenant)

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| S-2.2.1 | 盟约生效：王室母亲 | motherKingdomId='north', motherBloodline=ROYAL | constitution/strength × 1.15 |
| S-2.2.2 | 盟约失效：无母亲 | motherKingdomId 未设置（初代） | 无盟约加成 |
| S-2.2.3 | 盟约失效：流浪猫母亲 | motherKingdomId='south', motherBloodline=WILD | 无盟约加成 |
| S-2.2.4 | 盟约失效：无效国家 | motherKingdomId='invalid' | 无盟约加成 |

### 2.3 MYTHIC 连锁反应

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| S-2.3.1 | MYTHIC 属性加成 | bloodline=MYTHIC | getEffectiveStats 每项 +3 |
| S-2.3.2 | MYTHIC 寿命加成 | bloodline=MYTHIC, constitution=50 | lifespan = 10+5+5 = 20 |

### 2.4 寿命计算

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| S-2.4.1 | 基础寿命 | constitution=50 | lifespan = 10 + 5 = 15 |
| S-2.4.2 | MYTHIC 寿命 | constitution=50, MYTHIC | lifespan = 15 + 5 = 20 |

---

## 三、繁育系统 (Breeding System)

### 3.1 属性遗传

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| B-3.1.1 | 均值 + 扰动 | 父[80,80,80,80,80,80], 母[40,40,40,40,40,40] | 后代约 [60±6, ...] |
| B-3.1.2 | WILD 偏科突变 | 父母一方 WILD | 一项 +25，其余 -15 |
| B-3.1.3 | 近亲繁殖衰退 | father.kingdomId === mother.kingdomId | 全属性 × 0.95 |
| B-3.1.4 | 跨国杂交优势 | father.kingdomId !== mother.kingdomId | 全属性 +3 |

### 3.2 血统与王国继承

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| B-3.2.1 | motherKingdomId 传递 | breed(父, 母) | 后代.motherKingdomId === 母.kingdomId |
| B-3.2.2 | motherBloodline 传递 | breed(父, 母) | 后代.motherBloodline === 母.bloodline |
| B-3.2.3 | 代数递增 | 父 gen=2, 母 gen=1 | 后代.generation === 3 |

### 3.3 性状触发器

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| B-3.3.1 | StarryEye 父母 | 父或母 expressedEyeTrait='StarryEye' | 后代 mutationChanceMultiplier >= 1.5 |
| B-3.3.2 | Godly_Glow 父母 | 父或母有 Godly_Glow | 后代 mutationChanceMultiplier >= 1.2 |
| B-3.3.3 | 无触发性状 | 父母无特殊性状 | 后代 mutationChanceMultiplier === 1 |

---

## 四、王朝更迭 (Succession)

### 4.1 继承逻辑

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| D-4.1.1 | 综合最高者继位 | 3 后代 [A:400, B:380, C:350] | 选 A |
| D-4.1.2 | 有效属性参与排序 | 后代含性状/盟约加成 | getCompositeScore 使用 getEffectiveStats |

### 4.2 权力冲突（篡位）

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| D-4.2.1 | 可篡位条件 | 次子在偏好属性上超新王 ≥15 | canUsurp === true |
| D-4.2.2 | 不可篡位 | 次子无偏好属性超 15 | canUsurp === false |
| D-4.2.3 | 力量影响胜率 | 篡位者 STR 超新王越多，calcUsurpChance 越高 | 胜率随 STR 差递增 |
| D-4.2.4 | 体质影响防御 | 新王 CON 越高，calcUsurpChance 越低 | 胜率随 CON 递减 |

---

## 五、边界与异常

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| E-5.1 | 属性钳制 | 计算后 stat > 100 | 钳制为 100 |
| E-5.2 | 属性钳制 | 计算后 stat < 0 | 钳制为 0 |
| E-5.3 | clone 保留性状 | 克隆已计算性状的猫 | 克隆体性状与血统一致 |
| E-5.4 | hasGeniusMutation | 任一项有效属性 > 95 | 返回 true |

---

## 六、六维属性玩法机制 (GameplayService)

### 6.1 体质 (CON) - 王朝稳定性

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| A-6.1.1 | 体质降低被篡位率 | 新王 CON 高、篡位者 STR 相同 | calcUsurpChance 更低 |
| A-6.1.2 | 寿命已覆盖 | 见 S-2.4.x | lifespan = 10 + CON/10 |

### 6.2 力量 (STR) - 武力夺权

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| A-6.2.1 | 力量提高篡位胜率 | 篡位者 STR 超新王 | calcUsurpChance 更高 |
| A-6.2.2 | 力量差为负时胜率降低 | 篡位者 STR < 新王 | calcUsurpChance < 0.2 |

### 6.3 敏捷 (AGI) - 规避刺杀

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| A-6.3.1 | 敏捷提高存活率 | AGI 越高 | calcAssassinationSurviveChance 越高 |
| A-6.3.2 | 存活率上限 95% | AGI 极高 | 存活率钳制 ≤ 0.95 |
| A-6.3.3 | 刺杀基础概率 | getAssassinationChance | 返回 0.12 |

### 6.4 智力 (INT) - 盟约效率

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| A-6.4.1 | INT 0 时盟约倍率 1.1 | motherKingdomId 有效，INT=0 | 偏好属性 × 1.1 |
| A-6.4.2 | INT 100 时盟约倍率 1.2 | motherKingdomId 有效，INT=100 | 偏好属性 × 1.2 |
| A-6.4.3 | INT 50 时盟约倍率 1.15 | 见 S-2.2.1 | 偏好属性 × 1.15 |

### 6.5 魅力 (CHA) - 流浪猫造访

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| A-6.5.1 | 魅力提高流浪猫概率 | CHA 越高 | calcWildSpouseChance 越高 |
| A-6.5.2 | 流浪猫概率上限 60% | CHA 极高 | 概率钳制 ≤ 0.6 |
| A-6.5.3 | CHA 0 时基础 25% | 猫王 CHA=0 | calcWildSpouseChance ≈ 0.25 |

### 6.6 幸运 (LUK) - 基因突变率

| 用例 ID | 分支描述 | 前置条件 | 预期结果 |
|---------|----------|----------|----------|
| A-6.6.1 | 父母 LUK 提高后代突变率 | 父母 LUK 高 | 后代 mutationChanceMultiplier > 1 |
| A-6.6.2 | LUK 与性状触发器叠加 | 父 StarryEye + 父母 LUK 各 50 | mutationChanceMultiplier ≥ 1.5 × 1.5 |

---

## 七、测试执行说明

- **纯逻辑测试**：CatEntity、GeneticsSystem、GameplayService、Definitions 无 Cocos 依赖，可直接用 Vitest/Jest 单测
- **确定性测试**：通过注入 `RandomSource` 控制随机，验证分支
- **BreedingTest**：依赖 `cc`，需在 Cocos 环境中运行或 mock `cc`
