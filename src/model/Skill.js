
import {getImage} from "../services/imageService";

export class Skill {

    /**
     * @param {string} name
     * @param {string} description
     * @param {string} image
     * @param {string?}  altText
     * @param {[string]} bullets
     */
    constructor(name, description, image, altText, bullets) {
        this.name = name;
        this.description = description;
        this.image = image;
        this.altText = altText;
        this.bullets = bullets;
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
    "frontend": [
        new Skill("Tailwind CSS",
            "A utility-first CSS framework for rapidly building custom designs.",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Tailwind_CSS_Logo.svg/2048px-Tailwind_CSS_Logo.svg.png",
            "Tailwind CSS logo", []),
        new Skill("HTML", "HTML stands for Hypertext Markup Language. It is a markup language used to create and structure content on the web. ", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/HTML5_logo_and_wordmark.svg/2048px-HTML5_logo_and_wordmark.svg.png", "HTML5 logo", ["A11Y"]),
        new Skill("CSS", "Cascading Style Sheets, is a style sheet language used to describe the presentation of HTML.", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/CSS3_logo_and_wordmark.svg/2048px-CSS3_logo_and_wordmark.svg.png", "CSS3 logo", ["(S)CSS"]),
        new Skill("JavaScript", "JavaScript (JS) can be used to dynamically change the content and structure of a web page. Allowing web pages to become interactive.", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Unofficial_JavaScript_logo_2.svg/2048px-Unofficial_JavaScript_logo_2.svg.png", "JavaScript logo", [
            "ESNext",
            "TypeScript",
            "Vue.js",
            "Svelte",
            "Gulp",
        ]),

        new Skill("SVelte", "Svelte is a JS framework that approaches frontend development by using compiler optimizations to deliver fast applications. ", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Svelte_Logo.svg/2048px-Svelte_Logo.svg.png", "Svelte logo", []),
    ],
    "backend": [
        new Skill("Node.js", "Node.js", "https://cdn.iconscout.com/icon/free/png-256/free-node-js-1174925.png", "Node.js logo", []),
        new Skill("Java", "Java", "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/181_Java_logo_logos-512.png", "Java logo", [
            "JUnit",
            "Spring",
            "Android"
        ]),
        new Skill("Python", "Python", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/2048px-Python-logo-notext.svg.png", "Python logo", [
            "Flask",
            "Jupyter Notebook",
        ]),
        new Skill("SQL", "Structured Query Language", "https://cdn-icons-png.flaticon.com/512/2383/2383158.png", "SQL logo", []),
    ],
    "mobile": [
        new Skill("Swift", "Swift", "https://cdn-icons-png.flaticon.com/512/732/732250.png", "Swift logo", []),
        new Skill("Dart", "Dart", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Dart-logo.png/2048px-Dart-logo.png", "Dart logo", []),
        new Skill("Flutter", "Flutter", "https://cdn.iconscout.com/icon/free/png-256/free-flutter-2038877-1720090.png", "Flutter logo", []),
    ],
    "tooling": [
        new Skill("Git", "Git", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Git_icon.svg/2048px-Git_icon.svg.png", "Git logo", []),
        new Skill("GitHub", "GitHub", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Octicons-mark-github.svg/2048px-Octicons-mark-github.svg.png", "GitHub logo", []),
        new Skill("GitLab", "GitLab", "https://cdn-icons-png.flaticon.com/256/5968/5968853.png", "GitLab logo", []),
        new Skill("Docker", "Docker", "https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png", "Docker logo", []),
        new Skill("ServiceNow", "ServiceNow", getImage('servicenow_logo'), "ServiceNow logo", []),

    ],
    "misc": [
        new Skill("Scrum", "PSM I certification", "https://www.scrum.org/themes/custom/scrumorg_v2/assets/images/logo-250.png", "Scrum logo", []),
        new Skill("Dutch", "Native language", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Flag_of_the_Netherlands.svg/2048px-Flag_of_the_Netherlands.svg.png", "Dutch flag", []),
        new Skill("English", "Fluent working proffeciency", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Flag_of_Canada.svg/2560px-Flag_of_Canada.svg.png", "English flag", []),
    ]
}