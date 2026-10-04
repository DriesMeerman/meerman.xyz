import { getImage } from "../services/imageService.js";

/* This is a mainly json data but structured in JS files to allow for comments and using the image service to get resized images.
 * Still using json structure for easier portability in the future.
*/

export const skills = {
    "leadership": [
        {
            "name": "Team Lead",
            "description": "Managing engineering teams since June 2025, with 10 direct reports.",
            "image": getImage("leadership/team-lead", "png", 400),
            "artwork": true,
            "logoAlt": "Weathered corporate rank insignia connecting three personnel emblems",
            "attributes": ["people", "10 reports"],
            "rarity": "rare"
        },
        {
            "name": "Coaching",
            "description": "Helping direct reports grow in their careers and develop as engineers.",
            "image": getImage("leadership/coaching", "png", 400),
            "artwork": true,
            "logoAlt": "A mentor's cybernetic hand passing a data shard to another hand",
            "attributes": ["growth"],
            "rarity": "epic"
        },
        {
            "name": "Team Growth",
            "description": "Developing the team by helping people build on their strengths, grow their skills and take on new responsibilities.",
            "image": getImage("leadership/team-growth", "png", 400),
            "artwork": true,
            "logoAlt": "Three metal personnel emblems rising together on a circuit spine",
            "attributes": ["development"],
            "compactTitle": true,
            "rarity": "legendary"
        },
        {
            "name": "Stakeholders",
            "description": "I coordinate with product, design and business teams and explain what my team needs.",
            "image": getImage("leadership/stakeholders", "png", 400),
            "artwork": true,
            "logoAlt": "A corporate handshake between human and cybernetic hands",
            "attributes": ["alignment"],
            "compactTitle": true,
            "rarity": "uncommon"
        }
    ],
    "language": [
        {
            "name": "Swift",
            "description": "Swift is Apple's programming language, used mainly for iOS apps.",
            "image": getImage("logos/732250_01", "png", 400),
            "logoAlt": "Swift logo",
            "attributes": ["mobile"],
            "rarity": "legendary"
        },
        {
            "name": "HTML5",
            "description": "HTML defines the content and structure of web pages.",
            "image": getImage("logos/logo_2582748_960_720_02", "png", 400),
            "logoAlt": "HTML5 logo",
            "attributes": ["frontend"],
            "rarity": "uncommon"
        },
        {
            "name": "JavaScript",
            "description": "JavaScript adds interactive behavior to web pages.",
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
            "description": "CSS defines how web pages look.",
            "image": getImage("logos/logo_2582747_960_720_04", "png", 400),
            "logoAlt": "CSS3 logo",
            "attributes": ["frontend"],
            "rarity": "uncommon"
        },
        {
            "name": "Python",
            "description": "Python is an interpreted programming language.",
            "image": getImage("logos/2048px_python_logo_notext_svg_05", "png", 400),
            "logoAlt": "Python logo",
            "attributes": ["backend"],
            "rarity": "rare"
        },
        {
            "name": "SQL",
            "description": "SQL is a language for querying and updating databases.",
            "image": getImage("logos/2383158_06", "png", 400),
            "logoAlt": "SQL logo",
            "attributes": [
                "database",
            ],
            "rarity": "uncommon"
        },
        {
            "name": "Dart",
            "description": "Dart is Google's programming language for building applications.",
            "image": getImage("logos/2048px_dart_logo_07", "png", 400),
            "logoAlt": "Dart logo",
            "attributes": ["mobile"],
            "rarity": "rare"
        },
        {
            "name": "Java",
            "description": "Java is an object-oriented programming language designed for portability.",
            "image": getImage("logos/181_java_logo_logos_512_08", "png", 400),
            "logoAlt": "Java logo",
            "attributes": ["backend", "mobile"],
            "rarity": "uncommon"
        },
        {
            "name": "Haskell",
            "description": "Haskell is a statically typed, purely functional programming language.",
            "image": getImage("logos/63064c5652d40eda2eb7a838_33ac2334_09", "png", 400),
            "logoAlt": "Haskell logo",
            "attributes": ["backend"],
            "rarity": "rare"
        },
        {
            "name": "C",
            "description": "C is a procedural programming language.",
            "image": getImage("logos/1200px_c_programming_language_svg_10", "png", 400),
            "logoAlt": "C logo",
            "attributes": ["backend"],
            "rarity": "uncommon"
        }

    ],
    "framework": [

        {
            "name": "SwiftUI",
            "description": "SwiftUI is a framework for building user interfaces across Apple platforms using Swift.",
            "image": getImage("logos/swiftui_96x96_11", "png", 400),
            "logoAlt": "SwiftUI logo",
            "attributes": ["mobile"],
            "rarity": "epic"
        },

        {
            "name": "Realm",
            "description": "I used Realm as a local database in Android and iOS apps.",
            "image": getImage("logos/realm_db_logo", "png", 306),
            "logoAlt": "Realm logo",
            "attributes": ["mobile", "database"],
            "rarity": "rare"
        },

        {
            "name": "Flutter",
            "description": "Flutter is Google's toolkit for building cross-platform apps.",
            "image": getImage("logos/free_flutter_2038877_1720090_12", "png", 400),
            "logoAlt": "Flutter logo",
            "attributes": ["mobile"],
            "rarity": "rare"
        },
        {
            "name": "Node.js",
            "description": "Node.js runs JavaScript on the server.",
            "image": getImage("logos/free_node_js_1174925_13", "png", 400),
            "logoAlt": "Node.js logo",
            "attributes": ["backend"],
            "rarity": "uncommon"
        },
        {
            "name": "Spring",
            "description": "Spring is a framework for building Java applications.",
            "image": getImage("logos/spring_3_logo_png_transparent_14", "png", 400),
            "logoAlt": "Spring logo",
            "attributes": ["backend"],
            "rarity": "uncommon"

        },
        {
            "name": "Svelte",
            "description": "Svelte is a compiler-based framework for building web interfaces.",
            "image": getImage("logos/2048px_svelte_logo_svg_15", "png", 400),
            "logoAlt": "Svelte logo",
            "attributes": ["frontend"],
            "rarity": "rare"
        },
        {
            "name": "Tailwind CSS",
            "description": "Tailwind CSS provides utility classes for styling user interfaces.",
            "image": getImage("logos/2048px_tailwind_css_logo_svg_16", "png", 400),
            "logoAlt": "Tailwind CSS logo",
            "attributes": ["frontend"],
            "rarity": "rare"
        },
        {
            "name": "Vue.js",
            "description": "Vue.js is a framework for building user interfaces.",
            "image": getImage("logos/2048px_vue_js_logo_2_svg_17", "png", 400),
            "logoAlt": "Vue.js logo",
            "attributes": ["frontend"],
            "rarity": "uncommon"
        },

        {
            "name": "AngularJS",
            "description": "AngularJS is a deprecated JavaScript framework for web applications.",
            "image": getImage("logos/angular_18", "png", 400),
            "logoAlt": "AngularJS logo",
            "attributes": ["frontend"],
            "rarity": "common"
        },
    ],
    "tooling": [
        {
            "name": "Git",
            "description": "Git tracks changes in source code with distributed version control.",
            "image": getImage("logos/2048px_git_icon_svg_19", "png", 400),
            "logoAlt": "Git logo",
            "attributes": ["devops"],
            "rarity": "uncommon"
        },
        {
            "name": "Bash",
            "description": "Bash is a Unix shell and scripting language.",
            "image": getImage("logos/2048px_gnu_bash_logo_svg_20", "png", 400),
            "logoAlt": "Bash logo",
            "attributes": ["scripting"],
            "rarity": "uncommon"
        },

        {
            "name": "Docker",
            "description": "Docker packages and runs software in containers.",
            "image": getImage("logos/moby_logo_21", "png", 400),
            "logoAlt": "Docker logo",
            "attributes": ["cloud", "devops"],
            "rarity": "epic"
        },
        {
            "name": "GitHub",
            "description": "GitHub hosts Git repositories.",
            "image": getImage("logos/2048px_octicons_mark_github_svg_22", "png", 400),
            "logoAlt": "GitHub logo",
            "attributes": ["devops"],
            "rarity": "common"
        },
        {
            "name": "GitLab",
            "description": "GitLab hosts Git repositories and provides issue tracking and CI/CD pipelines.",
            "image": getImage("logos/5968853_23", "png", 400),
            "logoAlt": "GitLab logo",
            "attributes": ["devops"],
            "rarity": "common"
        },
        {
            "name": "ServiceNow",
            "description": "ServiceNow is a customizable cloud platform for enterprise service management.",
            "image": getImage('servicenow_logo'),
            "logoAlt": "ServiceNow logo",
            "attributes": ["PaaS"],
            "rarity": "epic"
        },
        {
            "name": "MacOS",
            "description": "macOS is Apple's operating system for Macs.",
            "image": getImage("logos/2048px_macos_wordmark_282017_29_svg_24", "png", 400),
            "logoAlt": "MacOS logo",
            "attributes": ["OS"],
            "rarity": "common"
        },
        {
            "name": "Linux",
            "description": "Linux is a family of open-source, Unix-like operating systems.",
            "image": getImage("logos/2048px_tux_svg_25", "png", 400),
            "logoAlt": "Linux logo",
            "attributes": ["OS"],
            "rarity": "uncommon"
        },
        {
            "name": "Windows",
            "description": "Windows is Microsoft's family of operating systems.",
            "image": getImage("logos/2048px_windows_logo_2012_svg_26", "png", 400),
            "logoAlt": "Windows logo",
            "attributes": ["OS"],
            "rarity": "common"
        },
        {
            "name": "AWS",
            "description": "AWS provides cloud computing services with usage-based pricing.",
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
            "description": "Kanban is a scheduling system for lean manufacturing.",
            "image": getImage("logos/8746714_29", "png", 400),
            "logoAlt": "Kanban logo",
            "attributes": ["agile"],
            "rarity": "common"
        },
        {
            "name": "UML",
            "description": "UML is a language for diagramming software systems.",
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
