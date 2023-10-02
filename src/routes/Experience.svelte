<script>
    import StyledTimeLine from "../components/StyledTimeLine.svelte";
    import Card from "../components/Card.svelte";
    import {getImage} from "../services/imageService";

    let app4mationLogo = getImage('app4mation', 'png');
    let plat4mationLogo = getImage('plat4mation', 'png');;


    let work = [
        {
            title: '4Industry',
            subtitle: 'Senior Developer',
            description: 'Company was renamed to better align with our product. Working on the iOS app, doing architecture work, code reviews and interviews of applicants for various roles.',
            bullets: ["4Industry"],
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
            date: '2021 Dec',// - 2017 Sep',
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
            date: '2018 Jul',
            image: plat4mationLogo
        },
        {
            title: 'Start',
            description: 'While working at Plat4mation/App4mation with it being a startup and having limited resources I had a lot of opportunity to do architectural design work for the applications I worked on rather than just implementing already thought out features.',
            date: '2016 jul'
        }
    ]

    let internships = [
        {
            title: 'App4mation',
            subtitle: 'Master thesis project',
            description: 'Story level risk assessment in agile\n' +
                'software development using\n' +
                'machine-learning',
            date: '2022 May',
            image: app4mationLogo,
            attachments: [{
                title: 'Thesis.pdf',
                image: '/assets/file.svg',
                url: '/assets/Thesis_Risk_assessment_in_agile_software_development.pdf'
            }]
        },
        {
            title: 'Plat4mation',
            subtitle: 'Bachelor graduation project',
            description: 'Build a set of tools to make local development on a ServiceNow instance easier. Researching which tools (Gulp, Grunt, etc) where the most fitting for Plat4mation\'s workflow.',
            date: '2018 Feb',
            image: plat4mationLogo
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
            date: '2015 Jan'// - 2014 Sep',
            // image: getImage('ms_logo')
        },
    ]

</script>


<div>
    <Card class="pb-6 flex-col">
        <h1 class="text-center my-4 font-bold text-lg">Experience</h1>
        <StyledTimeLine timeLineItems="{work}"></StyledTimeLine>
    </Card>

    <Card class="pb-6 flex-col mt-6">
        <h1 class="text-center my-4">Internships</h1>
        <StyledTimeLine timeLineItems="{internships}"></StyledTimeLine>
    </Card>
</div>