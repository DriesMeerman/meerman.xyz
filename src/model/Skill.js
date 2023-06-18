
import {skills as skillData} from "../data/skillData";

export class Skill {

    /**
     * @param {string} name
     * @param {string} description
     * @param {string} image
     * @param {string} rarity
     * @param {string}  [altText]
     * @param {[string]} attributes
     */
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
    

    /**
     * a method that hashes the name of the skill to a number
     */
    getHash() {
        let hash = 0;
        for (let i = 0; i < this.name.length; i++) {
            hash = this.name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    }
}


console.log(skillData)


export const skills= Object.keys(skillData).reduce((result, current) => {
    
    result[current] = skillData[current].map(skill => Skill.fromJSON(skill))
    return result
}, {});

