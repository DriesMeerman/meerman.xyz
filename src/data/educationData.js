import { getImage } from '../services/imageService.js';

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

