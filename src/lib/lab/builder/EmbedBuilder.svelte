<script>
  // Builds an embed URL for one widget. Nothing is saved: the URL is the configuration.
  import { page } from '$app/state';
  import { darkMode } from '$lib/state.svelte.js';
  import { widgets, globalOptions } from '../registry.js';
  import HudPanel from '../HudPanel.svelte';

  let selectedId = $state(widgets[0].id);
  /** @type {Record<string, Record<string, string>>} */
  let values = $state({});
  let copied = $state('');
  let previewKey = $state(0);

  const widget = $derived(widgets.find((item) => item.id === selectedId) ?? widgets[0]);
  const fields = $derived([...widget.options, ...globalOptions]);

  /** @param {string} key */
  function valueOf(key) {
    return values[selectedId]?.[key] ?? fields.find((field) => field.key === key)?.default ?? '';
  }

  /** @param {string} key @param {string} value */
  function setValue(key, value) {
    values[selectedId] = { ...values[selectedId], [key]: value };
  }

  const url = $derived.by(() => {
    const params = new URLSearchParams({ w: widget.id });
    for (const field of fields) {
      const value = valueOf(field.key).trim();
      if (value !== '' && value !== (field.default ?? '')) params.set(field.key, value);
    }
    return `${page.url.origin}/lab?${params.toString().replaceAll('%2C', ',')}`;
  });

  // The preview follows the site theme unless a theme is picked, so it matches the page around it.
  const previewUrl = $derived(
    valueOf('theme') === 'auto' ? `${url}&theme=${darkMode.current ? 'dark' : 'light'}` : url
  );

  const iframe = $derived(
    `<iframe src="${url}" width="${widget.size.width}" height="${widget.size.height}" style="border:0;background:transparent" loading="lazy"></iframe>`
  );

  /** @param {string} text @param {string} label */
  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      copied = label;
      setTimeout(() => copied === label && (copied = ''), 1600);
    } catch {
      copied = 'error';
    }
  }

  function reset() {
    delete values[selectedId];
    previewKey += 1;
  }
</script>

<div class="builder">
  <HudPanel label="Configure" code="CFG" class="builder-controls">
    <div class="picker" role="tablist" aria-label="Widget">
      {#each widgets as item (item.id)}
        <button
          type="button"
          role="tab"
          aria-selected={item.id === selectedId}
          class:active={item.id === selectedId}
          onclick={() => (selectedId = item.id)}
        >{item.title}</button>
      {/each}
    </div>
    <p class="description">{widget.description}</p>

    <div class="fields">
      {#each fields as field (field.key)}
        <label class="field">
          <span class="field-name">{field.label} <code>{field.key}</code></span>
          {#if field.type === 'select'}
            <select value={valueOf(field.key)} onchange={(event) => setValue(field.key, event.currentTarget.value)}>
              {#each field.choices ?? [] as choice (choice)}
                <option value={choice}>{choice}</option>
              {/each}
            </select>
          {:else}
            <input
              type={field.type === 'number' ? 'number' : field.type}
              value={valueOf(field.key)}
              placeholder={field.placeholder ?? ''}
              oninput={(event) => setValue(field.key, event.currentTarget.value)}
            />
          {/if}
          {#if field.hint}<span class="hint">{field.hint}</span>{/if}
        </label>
      {/each}
    </div>

    <div class="output">
      <span class="field-name">Canvas link</span>
      <div class="copy-row">
        <code class="url">{url}</code>
        <button type="button" class="action" onclick={() => copy(url, 'url')}>{copied === 'url' ? 'Copied' : 'Copy'}</button>
      </div>
      <span class="field-name">Note embed</span>
      <div class="copy-row">
        <code class="url">{iframe}</code>
        <button type="button" class="action" onclick={() => copy(iframe, 'iframe')}>{copied === 'iframe' ? 'Copied' : 'Copy'}</button>
      </div>
      {#if copied === 'error'}<p class="hint">Clipboard is blocked here, select the text instead.</p>{/if}
      <div class="links">
        <a href={url} target="_blank" rel="noopener">Open in a new tab ↗</a>
        <button type="button" class="link-button" onclick={reset}>Reset options</button>
      </div>
    </div>

    <ol class="steps">
      <li>In an Obsidian canvas, right-click and choose <em>Add web page</em>, or drop the canvas link onto the board.</li>
      <li>Resize the card to about {widget.size.width} × {widget.size.height}. Widgets scale down to small cards.</li>
      <li>Set <code>frame=off</code> if the card border is enough, and <code>theme</code> to match your vault.</li>
    </ol>
  </HudPanel>

  <HudPanel label="Live preview" code="PRV" status="{widget.size.width} × {widget.size.height}" class="builder-preview">
    <div class="preview" style:aspect-ratio="{widget.size.width} / {widget.size.height}">
      {#key `${previewUrl}-${previewKey}`}
        <iframe src={previewUrl} title="{widget.title} preview" loading="lazy"></iframe>
      {/key}
    </div>
  </HudPanel>
</div>

<style>
  .builder { display: grid; gap: 1rem; }
  .builder :global(.hud) { height: auto; }
  @media (min-width: 900px) {
    .builder { grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); align-items: start; }
  }

  .picker { display: flex; flex-wrap: wrap; gap: .4rem; margin: 0 .35rem; }
  .picker button,
  .action,
  .link-button {
    border: 1px solid var(--lab-line);
    border-radius: .35rem;
    color: var(--lab-muted);
    background: var(--lab-inset);
    font-family: var(--lab-meta-font);
    font-size: .65rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    cursor: pointer;
    transition: color .15s, border-color .15s, box-shadow .15s;
  }
  .picker button { padding: .4rem .65rem; }
  .picker button:hover, .action:hover { color: var(--lab-ink); border-color: var(--lab-line-strong); }
  .picker button.active { color: var(--lab-accent); border-color: var(--lab-accent); box-shadow: 0 0 0 1px var(--lab-accent-soft), var(--lab-glow); }
  .description { margin: .8rem .35rem 1rem; color: var(--lab-muted); font-size: .85rem; line-height: 1.5; }

  .fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr)); gap: .8rem; margin: 0 .35rem; }
  .field { display: grid; gap: .3rem; align-content: start; }
  .field-name { color: var(--lab-muted); font-family: var(--lab-meta-font); font-size: .6rem; letter-spacing: .12em; text-transform: uppercase; }
  .field-name code { margin-left: .25rem; color: var(--lab-accent); text-transform: none; letter-spacing: 0; }
  .field select,
  .field input {
    width: 100%;
    padding: .45rem .55rem;
    border: 1px solid var(--lab-line);
    border-radius: .35rem;
    color: var(--lab-ink);
    background: var(--lab-inset);
    font-family: var(--lab-meta-font);
    font-size: .8rem;
    color-scheme: light dark;
  }
  .field select:focus-visible,
  .field input:focus-visible,
  .builder button:focus-visible,
  .links a:focus-visible { outline: 1px solid var(--lab-accent); outline-offset: 2px; }
  .hint { color: var(--lab-muted); font-size: .72rem; line-height: 1.4; opacity: .85; }

  .output { display: grid; grid-template-columns: minmax(0, 1fr); gap: .4rem; margin: 1.25rem .35rem 0; padding-top: 1rem; border-top: 1px dashed var(--lab-line); }
  .copy-row { display: flex; gap: .5rem; align-items: stretch; margin-bottom: .4rem; }
  .url {
    flex: 1;
    min-width: 0;
    padding: .5rem .6rem;
    overflow-x: auto;
    border: 1px solid var(--lab-line);
    border-radius: .35rem;
    color: var(--lab-accent);
    background: var(--lab-inset);
    font-size: .72rem;
    white-space: nowrap;
    user-select: all;
  }
  .action { padding: 0 .8rem; color: var(--lab-accent); }
  .links { display: flex; flex-wrap: wrap; gap: .5rem 1rem; align-items: center; font-size: .78rem; }
  .links a { color: var(--lab-accent); text-decoration: none; }
  .link-button { padding: .3rem .55rem; }

  .steps { display: grid; gap: .35rem; margin: 1.1rem .35rem 0; padding-left: 1.1rem; color: var(--lab-muted); font-size: .78rem; line-height: 1.5; list-style: decimal; }
  .steps code { color: var(--lab-accent); }

  .preview {
    position: relative;
    width: 100%;
    max-height: 70vh;
    border: 1px dashed var(--lab-line);
    border-radius: .5rem;
    overflow: hidden;
  }
  .preview iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: transparent; }
</style>
