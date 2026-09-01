import { createClient } from "@/lib/supabase/server";
import { HomepageContentForm } from "@/components/admin/HomepageContentForm";

const HERO_DEFAULTS = {
  title: "",
  subtitle: "",
  description: "",
  primary_cta_label: "",
  secondary_cta_label: "",
};

const FEATURED_DEFAULTS = { title: "", description: "" };

export default async function AdminHomepagePage() {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("homepage_content")
    .select("key, value");

  const hero = {
    ...HERO_DEFAULTS,
    ...(rows?.find((r) => r.key === "hero")?.value as Partial<typeof HERO_DEFAULTS> ?? {}),
  };
  const featuredPanel = {
    ...FEATURED_DEFAULTS,
    ...(rows?.find((r) => r.key === "featured_panel")?.value as
      | Partial<typeof FEATURED_DEFAULTS>
      | undefined ?? {}),
  };

  return (
    <div>
      <p className="eyebrow mb-2">Content</p>
      <h1 className="mb-8 font-display text-3xl text-bone">Homepage</h1>

      <HomepageContentForm hero={hero} featuredPanel={featuredPanel} />
    </div>
  );
}
