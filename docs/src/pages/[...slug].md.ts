import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { getCollection } from 'astro:content';
// Not a public export: the alias in astro.config.mjs points at the plugin's
// own HTML-to-Markdown converter, so each page's `.md` copy matches its
// section of llms-full.txt.
import { entryToSimpleMarkdown } from 'starlight-llms-txt-internal/entryToSimpleMarkdown.ts';

export const getStaticPaths = (async () => {
  const docs = await getCollection('docs', (doc) => !doc.data.draft);
  return docs.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async (context) => {
  const { entry } = context.props;
  const segments = [`# ${entry.data.hero?.title || entry.data.title}`];
  const description = entry.data.hero?.tagline || entry.data.description;
  if (description) segments.push(`> ${description}`);
  segments.push(await entryToSimpleMarkdown(entry, context));
  return new Response(segments.join('\n\n') + '\n', {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
