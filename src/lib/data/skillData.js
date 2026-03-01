import { getImage } from "../services/imageService.js";

/* This is a mainly json data but structured in JS files to allow for comments and using the image service to get resized images.
 * Still using json structure for easier portability in the future.
*/

export const skills = {
    "language": [
        {
            "name": "Swift",
            "description": "Swift is a general-purpose, multi-paradigm, compiled programming language developed by Apple Inc. Mainly used for iOS development.",
            "image": getImage("logos/732250_01", "png", 400),
            "logoAlt": "Swift logo",
            "attributes": ["mobile"],
            "rarity": "legendary"
        },
        {
            "name": "HTML5",
            "description": "HTML5 is the latest version of Hypertext Markup Language, the code that describes web pages.",
            "image": getImage("logos/logo_2582748_960_720_02", "png", 400),
            "logoAlt": "HTML5 logo",
            "attributes": ["frontend"],
            "rarity": "uncommon"
        },
        {
            "name": "JavaScript",
            "description": "JavaScript (JS) can be used to dynamically change the content and structure of a web page. Allowing web pages to become interactive.",
            "image": getImage("logos/2048px_unofficial_javascript_logo_2_svg_03", "png", 400),
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
            "image": getImage("logos/logo_2582747_960_720_04", "png", 400),
            "logoAlt": "CSS3 logo",
            "attributes": ["frontend"],
            "rarity": "uncommon"
        },
        {
            "name": "Python",
            "description": "Python is a interpreted, high-level, general-purpose programming language.",
            "image": getImage("logos/2048px_python_logo_notext_svg_05", "png", 400),
            "logoAlt": "Python logo",
            "attributes": ["backend"],
            "rarity": "rare"
        },
        {
            "name": "SQL",
            "description": "Structured Query Language (SQL) is a language used to communicate with databases in a declerative way.",
            "image": getImage("logos/2383158_06", "png", 400),
            "logoAlt": "SQL logo",
            "attributes": [
                "database",
            ],
            "rarity": "uncommon"
        },
        {
            "name": "Dart",
            "description": "Dart is a client-optimized programming language. It is developed by Google and is used to build mobile, desktop, server, and web applications.",
            "image": getImage("logos/2048px_dart_logo_07", "png", 400),
            "logoAlt": "Dart logo",
            "attributes": ["mobile"],
            "rarity": "rare"
        },
        {
            "name": "Java",
            "description": "Java is a general-purpose, class-based, OOP language designed for portabillity.",
            "image": getImage("logos/181_java_logo_logos_512_08", "png", 400),
            "logoAlt": "Java logo",
            "attributes": ["backend", "mobile"],
            "rarity": "uncommon"
        },
        {
            "name": "Haskell",
            "description": "Haskell is a general-purpose, statically typed, purely functional programming language with type inference and lazy evaluation.",
            "image": getImage("logos/63064c5652d40eda2eb7a838_33ac2334_09", "png", 400),
            "logoAlt": "Haskell logo",
            "attributes": ["backend"],
            "rarity": "rare"
        },
        {
            "name": "C",
            "description": "C is a general-purpose, procedural computer programming language supporting structured programming, lexical variable scope, and recursion.",
            "image": getImage("logos/1200px_c_programming_language_svg_10", "png", 400),
            "logoAlt": "C logo",
            "attributes": ["backend"],
            "rarity": "uncommon"
        }

    ],
    "framework": [

        {
            "name": "SwiftUI",
            "description": "SwiftUI is an innovative, exceptionally simple way to build user interfaces across all Apple platforms with the power of Swift.",
            "image": getImage("logos/swiftui_96x96_11", "png", 400),
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
            "image": getImage("logos/free_flutter_2038877_1720090_12", "png", 400),
            "logoAlt": "Flutter logo",
            "attributes": ["mobile"],
            "rarity": "rare"
        },
        {
            "name": "Node.js",
            "description": "Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. It allows you to run JS on the server.",
            "image": getImage("logos/free_node_js_1174925_13", "png", 400),
            "logoAlt": "Node.js logo",
            "attributes": ["backend"],
            "rarity": "uncommon"
        },
        {
            "name": "Spring",
            "description": "Spring is a framework for building Java applications. It is used to build anything from standalone programs to microservices.",
            "image": getImage("logos/spring_3_logo_png_transparent_14", "png", 400),
            "logoAlt": "Spring logo",
            "attributes": ["backend"],
            "rarity": "uncommon"

        },
        {
            "name": "Svelte",
            "description": "Svelte is a JS framework that approaches frontend development by using compiler optimizations to deliver fast applications.",
            "image": getImage("logos/2048px_svelte_logo_svg_15", "png", 400),
            "logoAlt": "Svelte logo",
            "attributes": ["frontend"],
            "rarity": "rare"
        },
        {
            "name": "Tailwind CSS",
            "description": "Tailwind CSS is a utility-first CSS framework for rapidly building custom user interfaces.",
            "image": getImage("logos/2048px_tailwind_css_logo_svg_16", "png", 400),
            "logoAlt": "Tailwind CSS logo",
            "attributes": ["frontend"],
            "rarity": "rare"
        },
        {
            "name": "Vue.js",
            "description": "Vue.js is a progressive framework for building user interfaces.",
            "image": getImage("logos/2048px_vue_js_logo_2_svg_17", "png", 400),
            "logoAlt": "Vue.js logo",
            "attributes": ["frontend"],
            "rarity": "uncommon"
        },

        {
            "name": "AngularJS",
            "description": "AngularJS is a now deprecated JS framework for building web applications. Wich pioneered many of the approaches used in modern JS frameworks.",
            "image": getImage("logos/angular_18", "png", 400),
            "logoAlt": "AngularJS logo",
            "attributes": ["frontend"],
            "rarity": "common"
        },
    ],
    "tooling": [
        {
            "name": "Git",
            "description": "Git is a distributed version-control system for tracking changes in source code during software development.",
            "image": getImage("logos/2048px_git_icon_svg_19", "png", 400),
            "logoAlt": "Git logo",
            "attributes": ["devops"],
            "rarity": "uncommon"
        },
        {
            "name": "Bash",
            "description": "Bash is a Unix shell and command language written by Brian Fox for the GNU Project as a free software replacement for the Bourne shell.",
            "image": getImage("logos/2048px_gnu_bash_logo_svg_20", "png", 400),
            "logoAlt": "Bash logo",
            "attributes": ["scripting"],
            "rarity": "uncommon"
        },

        {
            "name": "Docker",
            "description": "Docker is a set of platform as a service products that use OS-level virtualization to deliver software in packages called containers.",
            "image": getImage("logos/moby_logo_21", "png", 400),
            "logoAlt": "Docker logo",
            "attributes": ["cloud", "devops"],
            "rarity": "epic"
        },
        {
            "name": "GitHub",
            "description": "GitHub is a provider of Internet hosting for software development and version control using Git.",
            "image": getImage("logos/2048px_octicons_mark_github_svg_22", "png", 400),
            "logoAlt": "GitHub logo",
            "attributes": ["devops"],
            "rarity": "common"
        },
        {
            "name": "GitLab",
            "description": "GitLab is a web-based DevOps lifecycle tool that provides a Git-repository manager providing wiki, issue-tracking and CI/CD pipeline features.",
            "image": getImage("logos/5968853_23", "png", 400),
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
            "image": getImage("logos/2048px_macos_wordmark_282017_29_svg_24", "png", 400),
            "logoAlt": "MacOS logo",
            "attributes": ["OS"],
            "rarity": "common"
        },
        {
            "name": "Linux",
            "description": "Linux is a family of open-source Unix-like operating systems based on the Linux kernel, an operating system kernel first released on September 17, 1991, by Linus Torvalds.",
            "image": getImage("logos/2048px_tux_svg_25", "png", 400),
            "logoAlt": "Linux logo",
            "attributes": ["OS"],
            "rarity": "uncommon"
        },
        {
            "name": "Windows",
            "description": "Microsoft Windows, commonly referred to as Windows, is a group of several proprietary graphical operating system families, all of which are developed and marketed by Microsoft.",
            "image": getImage("logos/2048px_windows_logo_2012_svg_26", "png", 400),
            "logoAlt": "Windows logo",
            "attributes": ["OS"],
            "rarity": "common"
        },
        {
            "name": "AWS",
            "description": "Amazon Web Services (AWS) is a subsidiary of Amazon providing on-demand cloud computing platforms and APIs to individuals, companies, and governments, on a metered pay-as-you-go basis.",
            "image": getImage("logos/2048px_amazon_web_services_logo_svg_27", "png", 400),
            "logoAlt": "AWS logo",
            "attributes": ["cloud"],
            "rarity": "rare"
        },
    ],

    "misc": [
        {
            "name": "Scrum",
            "description": "PSM I certification",
            "image": getImage("logos/logo_250_28", "png", 400),
            "logoAlt": "Scrum logo",
            "attributes": ["agile", "PSM I"],
            "rarity": "common"
        },
        {
            "name": "Kanban",
            "description": "Kanban is a scheduling system for lean manufacturing and just-in-time manufacturing.",
            "image": getImage("logos/8746714_29", "png", 400),
            "logoAlt": "Kanban logo",
            "attributes": ["agile"],
            "rarity": "common"
        },
        {
            "name": "UML",
            "description": "Unified Modeling Language (UML), is a modeling language used in software engineering it provides a standard way to visualize the design of a system.",
            "image": getImage("logos/2048px_diagrams_net_logo_svg_30", "png", 400),
            "logoAlt": "UML logo",
            "attributes": ["architecture"],
            "rarity": "uncommon"
        },

        {
            "name": "Dutch",
            "description": "Native language",
            "image": getImage("logos/2048px_flag_of_the_netherlands_svg_31", "png", 400),
            "logoAlt": "Dutch flag",
            "attributes": ["language"],
            "rarity": "common"
        },
        {
            "name": "English",
            "description": "Fluent working proffeciency",
            "image": getImage("logos/2560px_flag_of_canada_svg_32", "png", 400),
            "logoAlt": "English flag",
            "attributes": ["Language"],
            "rarity": "common"
        }
    ]
};
