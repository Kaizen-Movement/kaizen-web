"use client";

import { useFormState } from "react-dom";
import { updateHomepageContent, type HomepageFormState } from "@/lib/actions/homepage";

interface HomepageValues {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    primary_cta_label: string;
    secondary_cta_label: string;
  };
  featuredPanel: {
    title: string;
    description: string;
  };
}

const initialState: HomepageFormState = {};

export function HomepageContentForm({ hero, featuredPanel }: HomepageValues) {
  const [state, formAction] = useFormState(updateHomepageContent, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-10">
      <fieldset className="space-y-4">
        <legend className="eyebrow mb-2">Hero Section</legend>

        <Field label="Title" name="hero_title" defaultValue={hero.title} />
        <Field label="Subtitle" name="hero_subtitle" defaultValue={hero.subtitle} />
        <Field
          label="Description"
          name="hero_description"
          defaultValue={hero.description}
          textarea
        />
        <Field
          label="Primary CTA Label"
          name="hero_primary_cta"
          defaultValue={hero.primary_cta_label}
        />
        <Field
          label="Secondary CTA Label"
          name="hero_secondary_cta"
          defaultValue={hero.secondary_cta_label}
        />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="eyebrow mb-2">Featured Collection Panel</legend>

        <Field label="Title" name="featured_title" defaultValue={featuredPanel.title} />
        <Field
          label="Description"
          name="featured_description"
          defaultValue={featuredPanel.description}
          textarea
        />
      </fieldset>

      {state.error && <p className="text-sm text-crimson">{state.error}</p>}
      {state.success && <p className="text-sm text-green-400">Saved.</p>}

      <button
        type="submit"
        className="border border-gold bg-gold px-6 py-3 font-mono text-[11px] uppercase tracking-eyebrow text-void hover:bg-transparent hover:text-gold"
      >
        Save Changes
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  textarea,
}: {
  label: string;
  name: string;
  defaultValue: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
        {label}
      </span>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          rows={3}
          className="w-full border border-white/15 bg-void px-3 py-2.5 text-sm text-bone focus:border-gold focus:outline-none"
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue}
          className="w-full border border-white/15 bg-void px-3 py-2.5 text-sm text-bone focus:border-gold focus:outline-none"
        />
      )}
    </label>
  );
}
