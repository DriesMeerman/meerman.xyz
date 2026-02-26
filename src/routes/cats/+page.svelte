<script>
    let cats = [
        {
            name: 'Henrietta',
            image: '/assets/cats/Fenry.jpeg'
        },
        {
            name: 'Gina',
            image: '/assets/cats/Gina.jpeg'
        }
    ]
</script>

<div class="cats-page">
  <div class="cat-container display-flex flex flex-wrap gap-12">
    {#each cats as cat}
      <div class="cat-card ">
        <h2 class="text-xl font-bold text-center my-2">{cat.name}</h2>
        <img src={cat.image} alt={cat.name} class="w-full h-full object-cover rounded-full w-64 h-64 overflow-hidden" />
      </div>
    {/each}
  </div>
</div>

<style>
  .cats-page {
    display: grid;
    gap: 1rem;
  }
</style>