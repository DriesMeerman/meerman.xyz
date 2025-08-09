import { skills as skillData } from '$lib/data/skillData.js';

export class Skill {
  constructor(name, description, image, rarity, altText, attributes) {
    this.name = name;
    this.description = description;
    this.image = image;
    this.rarity = rarity;
    this.altText = altText;
    this.attributes = attributes;
  }
  static fromJSON(json) {
    return new Skill(json.name, json.description, json.image, json.rarity, json.altText, json.attributes);
  }
  getHash() {
    let hash = 0;
    for (let i = 0; i < this.name.length; i++) {
      hash = this.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }
}

export const skills = Object.keys(skillData).reduce((result, current) => {
  result[current] = skillData[current].map((skill) => Skill.fromJSON(skill));
  return result;
}, {});


