begin;

-- Hide every legacy subliminal in the three core catalog families.
-- Rows are archived rather than deleted so historical orders and file links remain intact.
update public.products p
set status = 'archived',
    active = false,
    is_featured = false,
    is_recommended = false,
    updated_at = now()
where p.kind = 'subliminal'
  and (
    p.category_id in (
      select id from public.categories
      where slug in ('attraction', 'self-improvement', 'lifestyle')
    )
    or lower(coalesce(p.category, '')) in (
      'attraction', 'improvement', 'self improvement',
      'self-improvement', 'success', 'lifestyle'
    )
  );

with catalog(
  slug, category_slug, title, short_description, long_description,
  benefits, whats_included, how_it_works, price_cents,
  compare_at_price_cents, sort_order, is_flagship, faq
) as (
  values
('Online-Attraction', 'attraction', 'Digital Attraction', 'The flagship 19+ subliminal for stronger online presence, photogenic confidence, and effortless digital charisma.', 'Your profile should feel like an extension of your presence, not a page you hope gets noticed. Digital Attraction is Kaizen''s flagship 19+ program for men who want to show up online with more confidence, composure, and intention. It is designed to reinforce a magnetic digital self-concept: posting without hesitation, presenting yourself cleanly, messaging without overthinking, and carrying the same calm energy online that you want to embody in real life.

This is not about chasing attention or becoming someone fake. It is about removing needy habits, sharpening your presentation, and building the kind of online presence that feels naturally attractive because it is grounded in self-respect.', '["Stronger digital self-concept","More confidence posting and presenting yourself","Calmer, more natural messaging","Less overthinking and approval-seeking","A cleaner, more intentional online presence"]'::jsonb, '["Premium layered subliminal program","Focused listening protocol","19+ audience edition","Personal-use license"]'::jsonb, 'Listen at a comfortable volume during a consistent routine. Use the program as a mindset aid alongside real-world action. Stop if you feel discomfort, and do not listen while driving or operating equipment if the audio makes you drowsy.', 2800, 3500, 1, true, '[{"question":"Are results guaranteed?","answer":"No. Subliminal audio is a mindset aid, and individual experiences vary. Real-world action, consistency, and responsible choices still matter."},{"question":"How should I listen?","answer":"Listen at a comfortable volume as part of a consistent routine. Stop if you feel discomfort, and never use audio in situations that require your full attention."},{"question":"Who is this made for?","answer":"This premium edition is intended for adults aged 19 and older."}]'::jsonb),
('the-final-red-room', 'attraction', 'Final Red Room', 'A premium 19+ finale built around sensual confidence, intimacy, composure, and private self-assurance.', 'Final Red Room is the closing chapter of Kaizen''s most intimate 19+ attraction concept. It is designed for the man who wants sensual confidence without loud performance: relaxed eye contact, grounded body language, emotional control, and the ability to stay present when chemistry becomes real.

The focus is not control over another person. The focus is control over your own energy. This program supports a private, mature self-concept built around consent, confidence, calm desire, and the feeling that you belong in the moment instead of trying to prove yourself.', '["Sensual self-confidence","Grounded body language and eye contact","Greater ease around intimacy","Less performance anxiety and overthinking","Calm, mature presence in romantic situations"]'::jsonb, '["Premium layered subliminal program","Focused listening protocol","19+ audience edition","Personal-use license"]'::jsonb, 'Listen at a comfortable volume during a consistent routine. Use the program as a mindset aid alongside real-world action. Stop if you feel discomfort, and do not listen while driving or operating equipment if the audio makes you drowsy.', 3000, NULL, 2, false, '[{"question":"Are results guaranteed?","answer":"No. Subliminal audio is a mindset aid, and individual experiences vary. Real-world action, consistency, and responsible choices still matter."},{"question":"How should I listen?","answer":"Listen at a comfortable volume as part of a consistent routine. Stop if you feel discomfort, and never use audio in situations that require your full attention."},{"question":"Who is this made for?","answer":"This premium edition is intended for adults aged 19 and older."}]'::jsonb),
('dark-magnetism', 'attraction', 'Dark Magnetism', 'Controlled presence, quiet mystery, and the kind of confidence that is felt before it is explained.', 'Dark Magnetism is for the man who does not need to dominate every conversation to command attention. This premium 19+ subliminal is designed to reinforce composure, emotional control, deliberate movement, and a quiet sense of mystery.

Instead of forcing charisma, you build contrast: fewer nervous reactions, stronger boundaries, better eye contact, and a presence that feels intentional. The result you are working toward is simple - becoming more memorable because you are centered, not because you are trying too hard.', '["Quiet confidence and composure","Stronger personal boundaries","More deliberate body language","Less reactive social behavior","A memorable, self-possessed presence"]'::jsonb, '["Premium layered subliminal program","Focused listening protocol","19+ audience edition","Personal-use license"]'::jsonb, 'Listen at a comfortable volume during a consistent routine. Use the program as a mindset aid alongside real-world action. Stop if you feel discomfort, and do not listen while driving or operating equipment if the audio makes you drowsy.', 2500, 3000, 3, false, '[{"question":"Are results guaranteed?","answer":"No. Subliminal audio is a mindset aid, and individual experiences vary. Real-world action, consistency, and responsible choices still matter."},{"question":"How should I listen?","answer":"Listen at a comfortable volume as part of a consistent routine. Stop if you feel discomfort, and never use audio in situations that require your full attention."},{"question":"Who is this made for?","answer":"This premium edition is intended for adults aged 19 and older."}]'::jsonb),
('extreme-female-attraction', 'attraction', 'Extreme Female Attention', 'A high-intensity 19+ confidence program for visibility, social boldness, and attractive self-presentation.', 'Extreme Female Attention is a high-intensity attraction program built around one principle: you become more noticeable when you stop shrinking yourself. It is designed to support visible confidence, decisive social energy, stronger grooming and presentation habits, and a willingness to enter conversations without mentally rejecting yourself first.

No audio can guarantee another person''s response. This program focuses on what you control - your self-image, your standards, your actions, and the confidence you bring into real interactions.', '["More visible social confidence","Stronger grooming and presentation mindset","Greater willingness to initiate conversation","Reduced fear of being noticed","A bolder attraction-oriented self-concept"]'::jsonb, '["Premium layered subliminal program","Focused listening protocol","19+ audience edition","Personal-use license"]'::jsonb, 'Listen at a comfortable volume during a consistent routine. Use the program as a mindset aid alongside real-world action. Stop if you feel discomfort, and do not listen while driving or operating equipment if the audio makes you drowsy.', 2400, 3000, 4, false, '[{"question":"Are results guaranteed?","answer":"No. Subliminal audio is a mindset aid, and individual experiences vary. Real-world action, consistency, and responsible choices still matter."},{"question":"How should I listen?","answer":"Listen at a comfortable volume as part of a consistent routine. Stop if you feel discomfort, and never use audio in situations that require your full attention."},{"question":"Who is this made for?","answer":"This premium edition is intended for adults aged 19 and older."}]'::jsonb),
('no-fear-talking-to-women', 'attraction', 'Smooth Talker', 'A premium social-flow subliminal for calm conversation, playful confidence, and effortless expression.', 'Smooth Talker is designed for the moments when your mind usually moves faster than your mouth. This 19+ program supports relaxed conversation, clearer expression, active listening, playful confidence, and the ability to stay present instead of searching for the perfect line.

Real charm is not a script. It is the combination of attention, timing, self-trust, and respect. Smooth Talker helps reinforce that foundation so conversations can feel more natural, mutual, and enjoyable.', '["Calmer conversation under pressure","Clearer, more confident expression","Stronger active-listening habits","More playful and natural social energy","Less overthinking before and during interactions"]'::jsonb, '["Premium layered subliminal program","Focused listening protocol","19+ audience edition","Personal-use license"]'::jsonb, 'Listen at a comfortable volume during a consistent routine. Use the program as a mindset aid alongside real-world action. Stop if you feel discomfort, and do not listen while driving or operating equipment if the audio makes you drowsy.', 2200, 2700, 5, false, '[{"question":"Are results guaranteed?","answer":"No. Subliminal audio is a mindset aid, and individual experiences vary. Real-world action, consistency, and responsible choices still matter."},{"question":"How should I listen?","answer":"Listen at a comfortable volume as part of a consistent routine. Stop if you feel discomfort, and never use audio in situations that require your full attention."},{"question":"Who is this made for?","answer":"This premium edition is intended for adults aged 19 and older."}]'::jsonb),
('the-alter-ego', 'self-improvement', 'The Alter Ego', 'The Self Improvement flagship for switching into your most disciplined, fearless, and deliberate identity.', 'The Alter Ego is Kaizen''s flagship Self Improvement program for the gap between who you are now and the version of you that already knows how to move. It is designed to help you define that identity, rehearse it mentally, and access its standards when hesitation, fear, or old programming tries to take control.

This is not an escape from yourself. It is a deliberate identity protocol: clearer standards, faster decisions, stronger discipline, and repeated action until your higher-performance state stops feeling like an act and starts feeling familiar.', '["A stronger high-performance identity","Faster access to confidence under pressure","Reduced hesitation and self-doubt","Clearer personal standards","More disciplined, deliberate action"]'::jsonb, '["Premium layered subliminal program","Focused listening protocol","19+ audience edition","Personal-use license"]'::jsonb, 'Listen at a comfortable volume during a consistent routine. Use the program as a mindset aid alongside real-world action. Stop if you feel discomfort, and do not listen while driving or operating equipment if the audio makes you drowsy.', 2800, 3500, 1, true, '[{"question":"Are results guaranteed?","answer":"No. Subliminal audio is a mindset aid, and individual experiences vary. Real-world action, consistency, and responsible choices still matter."},{"question":"How should I listen?","answer":"Listen at a comfortable volume as part of a consistent routine. Stop if you feel discomfort, and never use audio in situations that require your full attention."},{"question":"Who is this made for?","answer":"This premium edition is intended for adults aged 19 and older."}]'::jsonb),
('charisma', 'self-improvement', 'Charisma', 'Build warm authority, expressive confidence, and a presence people feel comfortable remembering.', 'Charisma is not volume, tricks, or constant performance. It is the ability to make people feel your attention while remaining secure in your own frame. This premium program is designed to reinforce warm confidence, expressive communication, emotional steadiness, and the social awareness to know when to lead and when to listen.

Use it to support a more open, memorable presence in work, friendship, networking, and dating - without becoming fake, loud, or approval-driven.', '["Warm, confident social presence","More expressive communication","Improved emotional steadiness","Stronger listening and connection habits","Less approval-seeking in groups"]'::jsonb, '["Premium layered subliminal program","Focused listening protocol","19+ audience edition","Personal-use license"]'::jsonb, 'Listen at a comfortable volume during a consistent routine. Use the program as a mindset aid alongside real-world action. Stop if you feel discomfort, and do not listen while driving or operating equipment if the audio makes you drowsy.', 2200, 2700, 2, false, '[{"question":"Are results guaranteed?","answer":"No. Subliminal audio is a mindset aid, and individual experiences vary. Real-world action, consistency, and responsible choices still matter."},{"question":"How should I listen?","answer":"Listen at a comfortable volume as part of a consistent routine. Stop if you feel discomfort, and never use audio in situations that require your full attention."},{"question":"Who is this made for?","answer":"This premium edition is intended for adults aged 19 and older."}]'::jsonb),
('kaizen-penis-enlargement', 'self-improvement', 'Peak Vitality', 'A premium 19+ vitality and body-confidence program for energy, discipline, and masculine self-assurance.', 'Peak Vitality is a 19+ mindset program centered on how you feel in your body and how consistently you take care of it. It is designed to support body confidence, disciplined routines, healthier self-respect, energy-oriented habits, and a more secure masculine self-concept.

This audio is not medical treatment and does not promise physical changes. It works best as a mindset companion to sleep, movement, nutrition, responsible healthcare, and consistent real-world habits.', '["Stronger body confidence","More consistent wellness routines","Energy-oriented daily habits","A secure masculine self-concept","Greater discipline around self-care"]'::jsonb, '["Premium layered subliminal program","Focused listening protocol","19+ audience edition","Personal-use license"]'::jsonb, 'Listen at a comfortable volume during a consistent routine. Use the program as a mindset aid alongside real-world action. Stop if you feel discomfort, and do not listen while driving or operating equipment if the audio makes you drowsy.', 2500, 3000, 3, false, '[{"question":"Are results guaranteed?","answer":"No. Subliminal audio is a mindset aid, and individual experiences vary. Real-world action, consistency, and responsible choices still matter."},{"question":"How should I listen?","answer":"Listen at a comfortable volume as part of a consistent routine. Stop if you feel discomfort, and never use audio in situations that require your full attention."},{"question":"Who is this made for?","answer":"This premium edition is intended for adults aged 19 and older."}]'::jsonb),
('polymath-subliminal', 'self-improvement', 'Polymath', 'Train the identity of a fast, curious, cross-disciplinary learner who connects ideas other people miss.', 'Polymath is designed for builders, creators, students, and entrepreneurs who refuse to be trapped in one lane. This premium program supports curiosity, sustained focus, confident learning, mental flexibility, and the habit of connecting knowledge across different subjects.

It will not replace study or practice. It is built to reinforce the identity and routines behind broad competence: asking better questions, staying with difficult material, and turning information into usable insight.', '["A stronger learning identity","More curiosity across disciplines","Improved focus during study","Greater confidence with difficult material","Better habit of connecting and applying ideas"]'::jsonb, '["Premium layered subliminal program","Focused listening protocol","19+ audience edition","Personal-use license"]'::jsonb, 'Listen at a comfortable volume during a consistent routine. Use the program as a mindset aid alongside real-world action. Stop if you feel discomfort, and do not listen while driving or operating equipment if the audio makes you drowsy.', 2200, 2700, 4, false, '[{"question":"Are results guaranteed?","answer":"No. Subliminal audio is a mindset aid, and individual experiences vary. Real-world action, consistency, and responsible choices still matter."},{"question":"How should I listen?","answer":"Listen at a comfortable volume as part of a consistent routine. Stop if you feel discomfort, and never use audio in situations that require your full attention."},{"question":"Who is this made for?","answer":"This premium edition is intended for adults aged 19 and older."}]'::jsonb),
('complete-enlargement', 'self-improvement', 'Unshakable Self-Concept', 'A deep confidence program for self-trust, internal validation, resilience, and grounded masculine presence.', 'Unshakable Self-Concept is for the man who is tired of letting a room, a rejection, or a bad day decide his value. This premium program is designed to reinforce internal validation, stable confidence, emotional resilience, and a grounded sense of identity.

The goal is not arrogance. It is consistency - knowing who you are before praise arrives, holding your standards when pressure rises, and recovering faster when life does not go your way.', '["Stronger internal validation","More stable day-to-day confidence","Greater resilience after setbacks","Reduced dependence on external approval","A grounded and consistent identity"]'::jsonb, '["Premium layered subliminal program","Focused listening protocol","19+ audience edition","Personal-use license"]'::jsonb, 'Listen at a comfortable volume during a consistent routine. Use the program as a mindset aid alongside real-world action. Stop if you feel discomfort, and do not listen while driving or operating equipment if the audio makes you drowsy.', 2200, 2700, 5, false, '[{"question":"Are results guaranteed?","answer":"No. Subliminal audio is a mindset aid, and individual experiences vary. Real-world action, consistency, and responsible choices still matter."},{"question":"How should I listen?","answer":"Listen at a comfortable volume as part of a consistent routine. Stop if you feel discomfort, and never use audio in situations that require your full attention."},{"question":"Who is this made for?","answer":"This premium edition is intended for adults aged 19 and older."}]'::jsonb),
('the-golden-vault', 'lifestyle', 'The Golden Vault', 'The Lifestyle flagship for wealth identity, opportunity awareness, disciplined ambition, and abundance thinking.', 'The Golden Vault is Kaizen''s flagship Lifestyle program for men building a bigger financial life. It is designed to reinforce an abundance-oriented identity without fantasy: noticing opportunities, thinking longer term, protecting your attention, making cleaner decisions, and acting with the discipline required to create value.

This is not a promise of money or investment results. It is a premium mindset system for replacing scarcity-driven hesitation with focused ambition, responsible confidence, and consistent execution.', '["A stronger wealth-building identity","Greater awareness of useful opportunities","More disciplined financial thinking","Reduced scarcity-driven hesitation","Consistent focus on creating long-term value"]'::jsonb, '["Premium layered subliminal program","Focused listening protocol","19+ audience edition","Personal-use license"]'::jsonb, 'Listen at a comfortable volume during a consistent routine. Use the program as a mindset aid alongside real-world action. Stop if you feel discomfort, and do not listen while driving or operating equipment if the audio makes you drowsy.', 2800, 3500, 1, true, '[{"question":"Are results guaranteed?","answer":"No. Subliminal audio is a mindset aid, and individual experiences vary. Real-world action, consistency, and responsible choices still matter."},{"question":"How should I listen?","answer":"Listen at a comfortable volume as part of a consistent routine. Stop if you feel discomfort, and never use audio in situations that require your full attention."},{"question":"Who is this made for?","answer":"This premium edition is intended for adults aged 19 and older."}]'::jsonb),
('business-success-golden-vault', 'lifestyle', 'Golden Vault: Business Success', 'A business-focused wealth program for leadership, execution, sales confidence, and opportunity recognition.', 'Golden Vault: Business Success takes the core Golden Vault mindset into the arena of business. It is designed for founders, freelancers, sellers, and builders who need the confidence to make offers, follow up, solve problems, and keep executing when results are not immediate.

It does not guarantee revenue. It supports the mindset behind revenue-producing behavior: value creation, resilient selling, decisive leadership, and the discipline to finish what you start.', '["Stronger founder and business identity","More confidence making offers","Improved follow-through and execution","Greater resilience around rejection","A sharper focus on creating customer value"]'::jsonb, '["Premium layered subliminal program","Focused listening protocol","19+ audience edition","Personal-use license"]'::jsonb, 'Listen at a comfortable volume during a consistent routine. Use the program as a mindset aid alongside real-world action. Stop if you feel discomfort, and do not listen while driving or operating equipment if the audio makes you drowsy.', 2500, 3000, 2, false, '[{"question":"Are results guaranteed?","answer":"No. Subliminal audio is a mindset aid, and individual experiences vary. Real-world action, consistency, and responsible choices still matter."},{"question":"How should I listen?","answer":"Listen at a comfortable volume as part of a consistent routine. Stop if you feel discomfort, and never use audio in situations that require your full attention."},{"question":"Who is this made for?","answer":"This premium edition is intended for adults aged 19 and older."}]'::jsonb),
('life-of-a-bachelor', 'lifestyle', 'Life of a Bachelor', 'A premium 19+ lifestyle program for independence, social confidence, standards, freedom, and self-directed living.', 'Life of a Bachelor is built for the season where your life belongs fully to you. This premium 19+ program supports independence, social confidence, stronger standards, a richer personal routine, and the ability to enjoy dating without losing your direction.

The point is not emotional distance. It is self-leadership: building a life that already feels full, protecting your goals, and choosing relationships from desire rather than loneliness or pressure.', '["A stronger independent identity","Higher standards in dating and lifestyle","More confidence enjoying your own company","Better balance between goals and social life","Less neediness and fear of missing out"]'::jsonb, '["Premium layered subliminal program","Focused listening protocol","19+ audience edition","Personal-use license"]'::jsonb, 'Listen at a comfortable volume during a consistent routine. Use the program as a mindset aid alongside real-world action. Stop if you feel discomfort, and do not listen while driving or operating equipment if the audio makes you drowsy.', 2200, 2700, 3, false, '[{"question":"Are results guaranteed?","answer":"No. Subliminal audio is a mindset aid, and individual experiences vary. Real-world action, consistency, and responsible choices still matter."},{"question":"How should I listen?","answer":"Listen at a comfortable volume as part of a consistent routine. Stop if you feel discomfort, and never use audio in situations that require your full attention."},{"question":"Who is this made for?","answer":"This premium edition is intended for adults aged 19 and older."}]'::jsonb),
('everything-fallin-into-place', 'lifestyle', 'Reality Alignment', 'A calm alignment program for clarity, consistency, emotional reset, and the feeling that your life is moving again.', 'Reality Alignment is designed for periods when life feels scattered, delayed, or heavier than it should. This premium program supports mental clarity, emotional regulation, consistent action, and the ability to notice progress without obsessing over perfect timing.

It is not a guarantee that events will magically rearrange themselves. It is a mindset aid for becoming the version of you who can see the next move, take it, and build momentum until life starts to feel coherent again.', '["Greater mental clarity","More emotional steadiness","Improved consistency and momentum","Less fixation on delays and setbacks","A stronger sense of direction"]'::jsonb, '["Premium layered subliminal program","Focused listening protocol","19+ audience edition","Personal-use license"]'::jsonb, 'Listen at a comfortable volume during a consistent routine. Use the program as a mindset aid alongside real-world action. Stop if you feel discomfort, and do not listen while driving or operating equipment if the audio makes you drowsy.', 2000, 2500, 4, false, '[{"question":"Are results guaranteed?","answer":"No. Subliminal audio is a mindset aid, and individual experiences vary. Real-world action, consistency, and responsible choices still matter."},{"question":"How should I listen?","answer":"Listen at a comfortable volume as part of a consistent routine. Stop if you feel discomfort, and never use audio in situations that require your full attention."},{"question":"Who is this made for?","answer":"This premium edition is intended for adults aged 19 and older."}]'::jsonb),
('profitable-trader', 'lifestyle', 'Profitable Trader', 'A trading-discipline subliminal for patience, process focus, emotional control, and responsible risk behavior.', 'Profitable Trader is built for the mental side of markets: patience, discipline, emotional control, process focus, and respect for risk. Use it at a low, comfortable volume while backtesting, journaling, studying, or preparing for a session.

No subliminal can predict markets or guarantee profit. Trading involves real financial risk. This program is designed only to support the habits that serious traders repeatedly practice - following a plan, avoiding impulsive decisions, accepting losses, and protecting capital.', '["Stronger process discipline","Calmer decision-making under pressure","More patience around entries and exits","Reduced impulsive trading habits","Greater respect for risk management"]'::jsonb, '["Premium layered subliminal program","Focused listening protocol","19+ audience edition","Personal-use license"]'::jsonb, 'Listen at a comfortable volume during a consistent routine. Use the program as a mindset aid alongside real-world action. Stop if you feel discomfort, and do not listen while driving or operating equipment if the audio makes you drowsy.', 2200, 2700, 5, false, '[{"question":"Are results guaranteed?","answer":"No. Subliminal audio is a mindset aid, and individual experiences vary. Real-world action, consistency, and responsible choices still matter."},{"question":"How should I listen?","answer":"Listen at a comfortable volume as part of a consistent routine. Stop if you feel discomfort, and never use audio in situations that require your full attention."},{"question":"Who is this made for?","answer":"This premium edition is intended for adults aged 19 and older."}]'::jsonb)
)
update public.products p
set title = c.title,
    name = c.title,
    short_description = c.short_description,
    long_description = c.long_description,
    description = c.long_description,
    benefits = c.benefits,
    whats_included = c.whats_included,
    how_it_works = c.how_it_works,
    price_cents = c.price_cents,
    price = c.price_cents / 100.0,
    compare_at_price_cents = c.compare_at_price_cents,
    category_id = cat.id,
    category = cat.name,
    status = 'published',
    active = true,
    is_featured = c.is_flagship,
    is_recommended = c.is_flagship,
    sort_order = c.sort_order,
    faq = c.faq,
    updated_at = now()
from catalog c
join public.categories cat on cat.slug = c.category_slug
where p.slug = c.slug;

-- Connect already-uploaded masters that were left in the unassigned media pool.
update public.product_files
set product_id = (select id from public.products where slug = 'the-alter-ego')
where product_id is null and lower(file_name) = 'alter ego.wav';

update public.product_files
set product_id = (select id from public.products where slug = 'the-final-red-room')
where product_id is null and lower(file_name) = 'final red room 2.mp3';

do $catalog_check$
begin
  if exists (
    select 1
    from public.categories c
    left join public.products p
      on p.category_id = c.id
     and p.status = 'published'
     and p.active = true
     and p.kind = 'subliminal'
    where c.slug in ('attraction', 'self-improvement', 'lifestyle')
    group by c.slug
    having count(p.id) <> 5
  ) then
    raise exception 'Premium catalog validation failed: each core category must contain exactly five published subliminals';
  end if;

  if exists (
    select 1
    from public.categories c
    join public.products p on p.category_id = c.id
    where c.slug in ('attraction', 'self-improvement', 'lifestyle')
      and p.status = 'published'
      and p.active = true
      and p.kind = 'subliminal'
    group by c.slug
    having count(*) filter (where p.is_featured) <> 1
  ) then
    raise exception 'Premium catalog validation failed: each core category must contain exactly one flagship';
  end if;
end
$catalog_check$;

commit;

select c.name as category,
       count(*) as published_products,
       max(p.title) filter (where p.is_featured) as flagship
from public.products p
join public.categories c on c.id = p.category_id
where p.status = 'published'
  and p.active = true
  and p.kind = 'subliminal'
  and c.slug in ('attraction', 'self-improvement', 'lifestyle')
group by c.name, c.sort_order
order by c.sort_order;
