
import { getImage } from "../services/imageService";

/* This is a mainly json data but structured in JS files to allow for comments and using the image service to get resized images.
 * Still using json structure for easier portability in the future.
*/

export const skills = {
    "frontend": [
                {
                    "name": "HTML5",
                    "description": "HTML5 is the latest version of Hypertext Markup Language, the code that describes web pages.",
                    "image": "https://cdn.pixabay.com/photo/2017/08/05/11/16/logo-2582748_960_720.png",
                    "logoAlt": "HTML5 logo",
                    "attributes": ["frontend"],
                    "rarity": "uncommon"
                },
                {
                    "name": "CSS3",
                    "description": "CSS3 is the latest version of Cascading Style Sheets, a style sheet language used for describing the presentation of a document written in HTML.",
                    "image": "https://cdn.pixabay.com/photo/2017/08/05/11/16/logo-2582747_960_720.png",
                    "logoAlt": "CSS3 logo",
                    "attributes": ["frontend"],
                    "rarity": "uncommon"
                },
                {
                    "name": "JavaScript",
                    "description": "JavaScript (JS) can be used to dynamically change the content and structure of a web page. Allowing web pages to become interactive.",
                    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Unofficial_JavaScript_logo_2.svg/2048px-Unofficial_JavaScript_logo_2.svg.png",
                    "logoAlt": "JavaScript logo",
                    "attributes": [
                        "frontend",
                        "backend"
                    ],
                    "rarity": "legendary"
                },
                {
                    "name": "Svelte",
                    "description": "Svelte is a JS framework that approaches frontend development by using compiler optimizations to deliver fast applications.",
                    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Svelte_Logo.svg/2048px-Svelte_Logo.svg.png",
                    "logoAlt": "Svelte logo",
                    "attributes": ["frontend"],
                    "rarity": "rare"
                },
                {
                    "name": "Tailwind CSS",
                    "description": "Tailwind CSS is a utility-first CSS framework for rapidly building custom user interfaces.",
                    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Tailwind_CSS_Logo.svg/2048px-Tailwind_CSS_Logo.svg.png",
                    "logoAlt": "Tailwind CSS logo",
                    "attributes": ["frontend"],
                    "rarity": "rare"
                },
                {
                    "name": "Vue.js",
                    "description": "Vue.js is a progressive framework for building user interfaces.",
                    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Vue.js_Logo_2.svg/2048px-Vue.js_Logo_2.svg.png",
                    "logoAlt": "Vue.js logo",
                    "attributes": ["frontend"],
                    "rarity": "uncommon"
                },
                {
                    "name": "AngularJS",
                    "description": "AngularJS is a now deprecated JS framework for building web applications. Wich pioneered many of the approaches used in modern JS frameworks.",
                    "image": "https://angular.io/assets/images/logos/angular/angular.png",
                    "logoAlt": "AngularJS logo",
                    "attributes": ["frontend"],
                    "rarity": "common"
                }

            ],
            "backend": [
                {
                    "name": "Node.js",
                    "description": "Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. It allows you to run JS on the server.",
                    "image": "https://cdn.iconscout.com/icon/free/png-256/free-node-js-1174925.png",
                    "logoAlt": "Node.js logo",
                    "attributes": ["backend"],
                    "rarity": "uncommon"
                },
                {
                    "name": "Java",
                    "description": "Java is a general-purpose, class-based, OOP language designed for portabillity.",
                    "image": "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/181_Java_logo_logos-512.png",
                    "logoAlt": "Java logo",
                    "attributes": ["backend", "mobile"],
                    "rarity": "common"
                },
                {
                    "name": "Python",
                    "description": "Python is a interpreted, high-level, general-purpose programming language.",
                    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/2048px-Python-logo-notext.svg.png",
                    "logoAlt": "Python logo",
                    "attributes": ["backend"],
                    "rarity": "rare"
                },
                {
                    "name": "SQL",
                    "description": "Structured Query Language (SQL) is a language used to communicate with databases in a declerative way.",
                    "image": "https://cdn-icons-png.flaticon.com/512/2383/2383158.png",
                    "logoAlt": "SQL logo",
                    "attributes": [
                        "database",
                    ],
                    "rarity": "uncommon"
                }
            ],
            "mobile": [
                {
                    "name": "Swift",
                    "description": "Swift is a general-purpose, multi-paradigm, compiled programming language developed by Apple Inc. Mainly used for iOS development.",
                    "image": "https://cdn-icons-png.flaticon.com/512/732/732250.png",
                    "logoAlt": "Swift logo",
                    "attributes": ["mobile"],
                    "rarity": "legendary"
                },
                {
                    "name": "Dart",
                    "description": "Dart is a client-optimized programming language. It is developed by Google and is used to build mobile, desktop, server, and web applications.",
                    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Dart-logo.png/2048px-Dart-logo.png",
                    "logoAlt": "Dart logo",
                    "attributes": ["mobile"],
                    "rarity": "rare"
                },
                {
                    "name": "Flutter",
                    "description": "Flutter is an open-source UI software development kit created by Google. It is used to develop cross platform applications.",
                    "image": "https://cdn.iconscout.com/icon/free/png-256/free-flutter-2038877-1720090.png",
                    "logoAlt": "Flutter logo",
                    "attributes": ["mobile"],
                    "rarity": "rare"
                }
            ],
            "tooling": [
                {
                    "name": "Git",
                    "description": "Git is a distributed version-control system for tracking changes in source code during software development.",
                    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Git_icon.svg/2048px-Git_icon.svg.png",
                    "logoAlt": "Git logo",
                    "attributes": ["devops"],
                    "rarity": "uncommon"
                },
                {
                    "name": "GitHub",
                    "description": "GitHub is a provider of Internet hosting for software development and version control using Git.",
                    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Octicons-mark-github.svg/2048px-Octicons-mark-github.svg.png",
                    "logoAlt": "GitHub logo",
                    "attributes": ["devops"],
                    "rarity": "common"
                },
                {
                    "name": "GitLab",
                    "description": "GitLab is a web-based DevOps lifecycle tool that provides a Git-repository manager providing wiki, issue-tracking and CI/CD pipeline features.",
                    "image": "https://cdn-icons-png.flaticon.com/256/5968/5968853.png",
                    "logoAlt": "GitLab logo",
                    "attributes": ["devops"],
                    "rarity": "common"
                },
                {
                    "name": "Docker",
                    "description": "Docker is a set of platform as a service products that use OS-level virtualization to deliver software in packages called containers.",
                    "image": "https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png",
                    "logoAlt": "Docker logo",
                    "attributes": ["cloud", "devops"],
                    "rarity": "epic"
                },
                {
                    "name": "ServiceNow",
                    "description": "ServiceNow is a cloud-based software platform that supports enterprise service management. It offers services (SaaS) and allows customization (PaaS).",
                    "image": getImage('servicenow_logo'),
                    "logoAlt": "ServiceNow logo",
                    "attributes": ["PaaS"],
                    "rarity": "rare"
                }
            ],
            "misc": [
                {
                    "name": "Scrum",
                    "description": "PSM I certification",
                    "image": "https://www.scrum.org/themes/custom/scrumorg_v2/assets/images/logo-250.png",
                    "logoAlt": "Scrum logo",
                    "attributes": ["agile"],
                    "rarity": "common"
                },
                {
                    "name": "UML",
                    "description": "Unified Modeling Language (UML), is a modeling language used in software engineering it provides a standard way to visualize the design of a system.",
                    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Diagrams.net_Logo.svg/2048px-Diagrams.net_Logo.svg.png",
                    "logoAlt": "UML logo",
                    "attributes": ["architecture"],
                    "rarity": "uncommon"
                },
                {
                    "name": "Dutch",
                    "description": "Native language",
                    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Flag_of_the_Netherlands.svg/2048px-Flag_of_the_Netherlands.svg.png",
                    "logoAlt": "Dutch flag",
                    "attributes": ["language"],
                    "rarity": "common"
                },
                {
                    "name": "English",
                    "description": "Fluent working proffeciency",
                    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Flag_of_Canada.svg/2560px-Flag_of_Canada.svg.png",
                    "logoAlt": "English flag",
                    "attributes": ["Language"],
                    "rarity": "common"
                }
            ]
        };
