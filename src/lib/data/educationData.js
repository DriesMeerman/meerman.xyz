import { getImage } from '../services/imageService.js';

const app4mationLogo = getImage('app4mation');
const plat4mationLogo = getImage('plat4mation');

export const educationTimeline = [
    {
        title: 'University of Amsterdam',
        subtitle: 'Master Software Engineering',
        description: 'Thesis: Risk assessment in agile software development using machine learning',
        bullets: [
            'Requirements engineering',
            'Software specification and testing',
            'Software evolution',
            'Software process',
            'Embedded software and Systems',
            'DevOps and cloud based software'
        ],
        date: '2022 May',
        image: getImage('uva_logo')
    },
    {
        title: 'University of Amsterdam',
        subtitle: 'Pre-Master',
        description: '',
        bullets: ['Compiler construction', 'Operating systems', 'Automata and formal languages'],
        date: '2019 Aug',
        image: getImage('uva_logo')
    },
    {
        title: 'Hogeschool van Amsterdam (AUAS)',
        subtitle: 'Bachelor Informatica',
        description: '',
        bullets: ['Major Software Engineering', 'Minor Digital Forensics'],
        date: '2018 Jun',
        image: getImage('hva_logo')
    },
    {
        title: 'Mid Sweden University',
        subtitle: 'International Summer School',
        description: 'International summer school with a focus on sustainability.',
        date: '2016 Jul',
        image: getImage('miun_logo')
    },
    {
        title: 'Gerrit van der Veen College',
        subtitle: 'HAVO',
        description: 'High school with Nature and Technology profile.',
        date: '2013 Jun',
    }
];

export const internshipData = [
    {
        title: 'App4mation',
        subtitle: 'Master thesis project',
        description: 'Story level risk assessment in agile\n' +
            'software development using\n' +
            'machine-learning',
        date: '2022 May',
        image: app4mationLogo,
        attachments: [{
            title: 'Master Thesis.pdf',
            image: '/assets/file.svg',
            url: '/assets/Thesis_Risk_assessment_in_agile_software_development.pdf'
        }]
    },
    {
        title: 'Plat4mation',
        subtitle: 'Bachelor graduation project',
        description: 'Build a set of tools to make local development on a ServiceNow instance easier. Researching which tools (Gulp, Grunt, etc) where the most fitting for Plat4mation\'s workflow.',
        date: '2018 Feb',
        image: plat4mationLogo,
        attachments: [{
            title: 'Bachelor Thesis.pdf',
            image: '/assets/file.svg',
            url: '/assets/Third_party_tool_integration_in_a_service_based_cloud_ecosystem.pdf'
        }]
    },
    {
        title: 'Microsoft',
        subtitle: 'Eduneric gamemaker',
        description: 'With a team of international students I worked on a C# UWP application, which generated browser based physicis games to explain physics concepts.',
        date: '2015 Sep',
        image: getImage('ms_logo')
    },
    {
        title: 'Hostnet Bv',
        subtitle: 'PHP Configuration validator',
        description: 'A system which validated dependency injection configuration files, in the form of a PHP cli interface. ',
        date: '2015 Jan'
    },
];
