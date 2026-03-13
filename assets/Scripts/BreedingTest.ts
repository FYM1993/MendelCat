import { _decorator, Component, log } from 'cc';
const { ccclass } = _decorator;

import { CatEntity } from './CatEntity';
import { GeneticsSystem } from './GeneticsSystem';
import { BloodlineType } from './Definitions';

@ccclass('BreedingTest')
export class BreedingTest extends Component {

    start() {
        log("--- 孟德尔实验室启动 ---");

        const father = new CatEntity({
            stats: { constitution: 80, strength: 70, agility: 60, intelligence: 50, charm: 40, luck: 30 },
            bloodline: BloodlineType.ROYAL,
            kingdomId: 'north',
            generation: 1,
            eyeGene: [{ trait: 'blue', dominant: true }, { trait: 'green', dominant: false }],
            furGene: [{ trait: 'orange', dominant: true }, { trait: 'white', dominant: false }],
        });

        const mother = new CatEntity({
            stats: { constitution: 40, strength: 50, agility: 60, intelligence: 70, charm: 80, luck: 90 },
            bloodline: BloodlineType.ROYAL,
            kingdomId: 'east',
            generation: 1,
            eyeGene: [{ trait: 'green', dominant: false }, { trait: 'gold', dominant: true }],
            furGene: [{ trait: 'white', dominant: false }, { trait: 'black', dominant: true }],
        });

        log("父亲属性:", JSON.stringify(father.stats));
        log("母亲属性:", JSON.stringify(mother.stats));

        const genetics = new GeneticsSystem();

        for (let i = 0; i < 5; i++) {
            const child = genetics.breed(father, mother);
            log(`后代 ${i + 1} 属性:`, JSON.stringify(child.stats));
        }
    }
}
