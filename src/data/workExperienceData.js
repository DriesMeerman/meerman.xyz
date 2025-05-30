import { getImage } from '../services/imageService';

const app4mationLogo = getImage('app4mation');
const plat4mationLogo = getImage('plat4mation');

export const workData = [
    {
        title: 'ServiceNow',
        subtitle: 'Engineering Manager (M3)',
	level: 'm3',
        description: 'I switched to a hybrid role with 50% development and 50% management, with my official title changing to manager. Continuing my work on mobile platform releases and coordinating with product / design and business units. While helping 4 direct reports grow in their career.',
        bullets: [],
        date: '2025 Jun',
        image: getImage('servicenow_logo'),
    },
    {
        title: 'ServiceNow',
        subtitle: 'Staff Software Engineer (IC4)',
	level: 'ic4',
        description: '4Industry got acquired by ServiceNow, we are going to re-platform the 4Industry suite on to the ServiceNow platform as the Connected Worker product. Worked on multiple mobile platform releases.',
        bullets: ['Yokohama', 'Zurich'],
        date: '2024 Apr',
        image: getImage('servicenow_logo'),
    },
    {
        title: '4Industry',
        subtitle: 'Software Architect',
        description: 'A role change to focus more on architecture rather than spending most of my time development. Doing this with a focus on our mobile platforms.',
        bullets: [],
        date: '2023 Oct',
        image: app4mationLogo
    },
    {
        title: '4Industry',
        subtitle: 'Senior Developer',
        description: 'The Company was renamed to better align with our product. Working on the iOS app, doing architecture work, code reviews and interviews of applicants for various roles.',
        bullets: [],
        date: '2022 Oct',
        image: app4mationLogo
    },
    {
        title: 'App4mation',
        subtitle: 'Senior Developer',
        description: 'iOS development for the 4Industry mobile application.',
        bullets: ["4Industry"],
        date: '2022 Oct',
        image: app4mationLogo
    },
    {
        title: 'ServiceNow',
        subtitle: 'Contractor',
        description: 'Worked on re-platforming the 4Facility suite on to the ServiceNow platform suite now known as Workplace Service Delivery, with a focus on the core reservation system and the outlook integration.',
        date: '2021 Dec',
        image: getImage('servicenow_logo')
    },
    {
        title: 'App4mation',
        subtitle: 'Senior Developer',
        bullets: ['Workplace Service Delivery (contract)', '4Facility', '4Industry'],
        date: '2020 May',
        image: app4mationLogo
    },
    {
        title: 'App4mation',
        subtitle: 'Medior Developer',
        bullets: ["4Industry", 'Boards4U'],
        date: '2018 Jul',
        image: app4mationLogo
    },
    {
        title: 'Plat4mation',
        subtitle: 'Medior Developer',
        bullets: ["Heineken One2Improve", 'Boards4U', 'Agile4U'],
        date: '2018 Jul',
        image: plat4mationLogo
    },
    {
        title: 'Plat4mation',
        subtitle: 'Junior Developer',
        description: 'Started my carreer working part-time while studying, as a fullstack developer using the ServiceNow platform.',
        bullets: ['Scrumboard4U', 'Rooms4U', 'Planboard4U'],
        date: '2016 Jul',
        image: plat4mationLogo
    },
    {
        title: 'Start',
        description: 'While working at Plat4mation/App4mation with it being a startup and having limited resources I had a lot of opportunity to do architectural design work for the applications I worked on rather than just implementing already thought out features.',
        date: '2016 jul'
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
