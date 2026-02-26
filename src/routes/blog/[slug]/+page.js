export async function load({ params, fetch }) {
  const slug = params.slug.split('#')[0];
  const res = await fetch('/feed.json');
  let meta = null;
  if (res.ok) {
    const items = await res.json();
    meta = items.find((i) => i.slug === slug || i.filename?.replace(/\.md$/, '') === slug) || null;
  }
  return { slug, meta };
}

