
import {getImage} from "../services/imageService";

import {skills as skillData} from "../data/skillData";

export class Skill {

    /**
     * @param {string} name
     * @param {string} description
     * @param {string} image
     * @param {string} rarity
     * @param {string}  [altText]
     * @param {[string]} bullets
     */
    constructor(name, description, image, rarity, altText, bullets) {
        this.name = name;
        this.description = description;
        this.image = image;
        this.rarity = rarity;
        this.altText = altText;
        this.bullets = bullets;
    }

    static fromJSON(json) {
        return new Skill(json.name, json.description, json.image, json.rarity, json.altText, json.relatedSkills);
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

export const skills = {
    frontend: skillData.frontend.map(skill => Skill.fromJSON(skill)),
    backend: skillData.backend.map(skill => Skill.fromJSON(skill)),
    mobile: skillData.mobile.map(skill => Skill.fromJSON(skill)),
    tooling: skillData.tooling.map(skill => Skill.fromJSON(skill)),
    misc: skillData.misc.map(skill => Skill.fromJSON(skill))

}