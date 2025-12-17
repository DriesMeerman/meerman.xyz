import { getImage } from "../services/imageService.js";

/* This is a mainly json data but structured in JS files to allow for comments and using the image service to get resized images.
 * Still using json structure for easier portability in the future.
*/

export const skills = {
    "language": [
        {
            "name": "Swift",
            "description": "Swift is a general-purpose, multi-paradigm, compiled programming language developed by Apple Inc. Mainly used for iOS development.",
            "image": "https://cdn-icons-png.flaticon.com/512/732/732250.png",
            "logoAlt": "Swift logo",
            "attributes": ["mobile"],
            "rarity": "legendary"
        },
        {
            "name": "HTML5",
            "description": "HTML5 is the latest version of Hypertext Markup Language, the code that describes web pages.",
            "image": "https://cdn.pixabay.com/photo/2017/08/05/11/16/logo-2582748_960_720.png",
            "logoAlt": "HTML5 logo",
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
            "name": "CSS3",
            "description": "CSS3 is the latest version of Cascading Style Sheets, a style sheet language used for describing the presentation of a document written in HTML.",
            "image": "https://cdn.pixabay.com/photo/2017/08/05/11/16/logo-2582747_960_720.png",
            "logoAlt": "CSS3 logo",
            "attributes": ["frontend"],
            "rarity": "uncommon"
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
            "name": "Java",
            "description": "Java is a general-purpose, class-based, OOP language designed for portabillity.",
            "image": "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/181_Java_logo_logos-512.png",
            "logoAlt": "Java logo",
            "attributes": ["backend", "mobile"],
            "rarity": "uncommon"
        },
        {
            "name": "Haskell",
            "description": "Haskell is a general-purpose, statically typed, purely functional programming language with type inference and lazy evaluation.",
            "image": "https://global-uploads.webflow.com/6047a9e35e5dc54ac86ddd90/63064c5652d40eda2eb7a838_33ac2334.png",
            "logoAlt": "Haskell logo",
            "attributes": ["backend"],
            "rarity": "rare"
        },
        {
            "name": "C",
            "description": "C is a general-purpose, procedural computer programming language supporting structured programming, lexical variable scope, and recursion.",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/C_Programming_Language.svg/1200px-C_Programming_Language.svg.png",
            "logoAlt": "C logo",
            "attributes": ["backend"],
            "rarity": "uncommon"
        }

    ],
    "framework": [

        {
            "name": "SwiftUI",
            "description": "SwiftUI is an innovative, exceptionally simple way to build user interfaces across all Apple platforms with the power of Swift.",
            "image": "https://developer.apple.com/assets/elements/icons/swiftui/swiftui-96x96.png",
            "logoAlt": "SwiftUI logo",
            "attributes": ["mobile"],
            "rarity": "epic"
        },

        {
            "name": "Realm",
            "description": "MongoDB Realm is a serverless platform that allows you to build modern mobile apps faster, with less code, and more confidence.",
            "image": getImage("logos/realm_db_logo", "png", 306),
            "logoAlt": "MongoDB Realm logo",
            "attributes": ["mobile", "database"],
            "rarity": "rare"
        },

        {
            "name": "Flutter",
            "description": "Flutter is an open-source UI software development kit created by Google. It is used to develop cross platform applications.",
            "image": "https://cdn.iconscout.com/icon/free/png-256/free-flutter-2038877-1720090.png",
            "logoAlt": "Flutter logo",
            "attributes": ["mobile"],
            "rarity": "rare"
        },
        {
            "name": "Node.js",
            "description": "Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. It allows you to run JS on the server.",
            "image": "https://cdn.iconscout.com/icon/free/png-256/free-node-js-1174925.png",
            "logoAlt": "Node.js logo",
            "attributes": ["backend"],
            "rarity": "uncommon"
        },
        {
            "name": "Spring",
            "description": "Spring is a framework for building Java applications. It is used to build anything from standalone programs to microservices.",
            "image": "https://cdn.freebiesupply.com/logos/large/2x/spring-3-logo-png-transparent.png",
            "logoAlt": "Spring logo",
            "attributes": ["backend"],
            "rarity": "uncommon"

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
        },
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
            "name": "Bash",
            "description": "Bash is a Unix shell and command language written by Brian Fox for the GNU Project as a free software replacement for the Bourne shell.",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Gnu-bash-logo.svg/2048px-Gnu-bash-logo.svg.png",
            "logoAlt": "Bash logo",
            "attributes": ["scripting"],
            "rarity": "uncommon"
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
            "name": "ServiceNow",
            "description": "ServiceNow is a cloud-based software platform that supports enterprise service management. It offers services (SaaS) and allows customization (PaaS).",
            "image": getImage('servicenow_logo'),
            "logoAlt": "ServiceNow logo",
            "attributes": ["PaaS"],
            "rarity": "epic"
        },
        {
            "name": "MacOS",
            "description": "macOS is a series of proprietary graphical operating systems developed and marketed by Apple Inc. since 2001.",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/MacOS_wordmark_%282017%29.svg/2048px-MacOS_wordmark_%282017%29.svg.png",
            "logoAlt": "MacOS logo",
            "attributes": ["OS"],
            "rarity": "common"
        },
        {
            "name": "Linux",
            "description": "Linux is a family of open-source Unix-like operating systems based on the Linux kernel, an operating system kernel first released on September 17, 1991, by Linus Torvalds.",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Tux.svg/2048px-Tux.svg.png",
            "logoAlt": "Linux logo",
            "attributes": ["OS"],
            "rarity": "uncommon"
        },
        {
            "name": "Windows",
            "description": "Microsoft Windows, commonly referred to as Windows, is a group of several proprietary graphical operating system families, all of which are developed and marketed by Microsoft.",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Windows_logo_-_2012.svg/2048px-Windows_logo_-_2012.svg.png",
            "logoAlt": "Windows logo",
            "attributes": ["OS"],
            "rarity": "common"
        },
        {
            "name": "AWS",
            "description": "Amazon Web Services (AWS) is a subsidiary of Amazon providing on-demand cloud computing platforms and APIs to individuals, companies, and governments, on a metered pay-as-you-go basis.",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/2048px-Amazon_Web_Services_Logo.svg.png",
            "logoAlt": "AWS logo",
            "attributes": ["cloud"],
            "rarity": "rare"
        },
    ],

    "misc": [
        {
            "name": "Scrum",
            "description": "PSM I certification",
            "image": "https://www.scrum.org/themes/custom/scrumorg_v2/assets/images/logo-250.png",
            "logoAlt": "Scrum logo",
            "attributes": ["agile", "PSM I"],
            "rarity": "common"
        },
        {
            "name": "Kanban",
            "description": "Kanban is a scheduling system for lean manufacturing and just-in-time manufacturing.",
            "image": "https://cdn-icons-png.flaticon.com/512/8746/8746714.png",
            "logoAlt": "Kanban logo",
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
