import type { Metadata } from "next";

import { BlogCard } from "@/components/blog-card";
import { CallToAction } from "@/components/call-to-action";
import { PageHeader } from "@/components/page-header";
import { articles } from "@/lib/content/blog";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Blog",
  description:
    "Guides and honest thinking on supporting golf creators, funding golf content, amateur sponsorship and the real costs behind the game.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Blog", href: "/blog" }]}
        eyebrow="Blog"
        heading="Notes from the journey"
        intro="Practical guides on supporting golf creators, funding golf content and backing the amateur game — written honestly, without the filler."
      />
      <section className="bg-offwhite">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <BlogCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      </section>
      <CallToAction />
    </>
  );
}
