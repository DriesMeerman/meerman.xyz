<script>
    let cssClasses
    export {cssClasses as class}
    // export {cssClass as class};
</script>

<div class="rounded shadow-lg bg-stone-200 dark:bg-zinc-500 bg-opacity-30 dark:bg-opacity-30 flex {cssClasses || ''}">
    <slot></slot>
</div>