<script>
    import Card from "../components/Card.svelte";
    import StyledTimeLine from "../components/StyledTimeLine.svelte";
    import {getImage} from "../imageHelper";

    const timelineItems = [
        {
            title: 'UvA MSc Software Engineering',
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
            title: 'UvA pre-master',
            description: '',
            bullets: ['Compiler construction', 'Operating systems', 'Automata and formal languages'],
            date: '2019 Aug',
            image: getImage('uva_logo')
        },
        {
            title: 'HvA BSc Informatica',
            description: '',
            bullets: ['Major Software Engineering', 'Minor Digital Forensics'],
            date: '2018 Jun',
            image: getImage('hva_logo')
        },
        {
            title: 'Mid Sweden University',
            description: 'International summer school with a focus on sustainability.',
            date: '2016 Jul',
            image: getImage('miun_logo')
        },
        {
            title: 'Gerrit van der Veen College',
            description: 'HAVO high school with Nature and Technology profile.',
            date: '2013 Jun',
        },
    ]
</script>

<div>
    <h1 class="text-center mb-4">Education</h1>
    <Card class="pb-6">
        <StyledTimeLine timeLineItems="{timelineItems}"></StyledTimeLine>
    </Card>
</div>

