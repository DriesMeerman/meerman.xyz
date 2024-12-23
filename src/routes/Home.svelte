<script>
    import Person from '../components/Home/Person.svelte'
    import Socials from "../components/Home/Socials.svelte";
</script>


<Person>
    <p class="max-w-3/4 sm:text-justify">
        My name is Dries Meerman, I'm a Software Engineer, technologist and nerd.
        My interrest in technology started early with a Game Boy Color which I used to mainly play Pokemon Gold.
        This gaming journey eventually let me to Minecraft and specifically a mod called ComputerCraft which allowed
        me to automate things in the game using <a class="underline" href="https://lua.org/">Lua</a>. <br/><br/>
        Programming from that point on became the thing I wanted to keep doing and get good at.
        After high school this led me to do a bachelor degree majoring in Software Engineering.
        While studying there was a lot of opportunity to connect with the development industry, this gave me the chance to start working before I graduated.
        I really enjoy the problem solving process of development and breaking up problems into smaller solvable chunks.
        During my career I've enjoyed building systems rather than specific features that can be configured to allow them to be used in flexible rather than in rigid ways. <br/><br/>

        My profession primarily involves desk-based work, to balance this out a I like going to the gym to get physical energy out and keep my endurance up.
        In the summers I enjoy to go longboarding gliding across preferably smooth paths.
        I'm also a hobbyist 3D printer, it is a great intersection between digital and physical.
        It can be practical but I mainly enjoy printing small trinkets found online as my 3D modelling skills could be improved.
    </p>
</Person>

<div class="mt-12">
    <Socials></Socials>
</div>

<svelte:head>
    <title>Meerman</title>
    <meta name="description" content="A website showcasing Dries Meerman's skills, education, and experience he has accumulated over the years.">
    <meta name="author" content="Dries Meerman">
    <meta name="keywords" content="Dries Meerman, Meerman, Software Engineer, Software Engineering">
</svelte:head>