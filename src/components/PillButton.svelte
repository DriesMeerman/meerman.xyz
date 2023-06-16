<script>
    export let isSelected;
    export let name;
</script>

<button class="py-2 px-4 mx-2 flex rounded-full bg-stone-300 hover:bg-stone-400 dark:bg-zinc-500 bg-opacity-80 dark:bg-opacity-70 hover:dark:bg-zinc-600 hover:outline outline-1"
on:click="{() => isSelected = !isSelected}">


<div class="{isSelected ? 'w-4' : 'opacity-0 w-0'}  h-6 transition-all duration-300 ease dark:fill-white flex flex-col justify-center">
<svg class="w-4 h-4" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
width="800px" height="800px" viewBox="0 0 78.369 78.369"
xml:space="preserve">
<g>
<path d="M78.049,19.015L29.458,67.606c-0.428,0.428-1.121,0.428-1.548,0L0.32,40.015c-0.427-0.426-0.427-1.119,0-1.547l6.704-6.704
c0.428-0.427,1.121-0.427,1.548,0l20.113,20.112l41.113-41.113c0.429-0.427,1.12-0.427,1.548,0l6.703,6.704
C78.477,17.894,78.477,18.586,78.049,19.015z"/>
</g>
</svg>
</div>

<div class="ml-2">{name}</div>
</button>

