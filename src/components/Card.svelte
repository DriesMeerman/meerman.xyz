<script>
    let cssClasses
    export {cssClasses as class}
    // export {cssClass as class};
</script>

<div class="rounded shadow-lg bg-stone-200 dark:bg-zinc-500 bg-opacity-80 dark:bg-opacity-70 flex {cssClasses || ''}">
    <slot></slot>
</div>