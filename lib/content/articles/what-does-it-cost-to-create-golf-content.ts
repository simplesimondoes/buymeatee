import { images } from "@/lib/content/images";
import type { Article } from "@/lib/content/blog";

export const costOfGolfContent: Article = {
  slug: "what-does-it-cost-to-create-golf-content",
  title: "What Does It Cost to Create Golf Content?",
  description:
    "The real cost structure behind golf videos: course fees, travel, camera gear, audio, editing time and the overheads nobody mentions — and how creators cover them.",
  publishedAt: "2026-07-11",
  updatedAt: "2026-07-11",
  heroImage: images.golfBallCloseup,
  blocks: [
    {
      type: "p",
      text: "Every golf video you've ever enjoyed had a bill behind it. Some of it is obvious — somebody paid to be on that course — and some of it hides in equipment depreciation, editing evenings and insurance small print. We won't pretend there's a universal number; costs differ wildly by country, format and ambition, and any article quoting you an \"average cost per golf video\" is guessing. What we can do is map where the money goes, so creators can budget honestly and viewers can understand what their support actually funds.",
    },
    { type: "h2", text: "Course fees: the cost that repeats forever" },
    {
      type: "p",
      text: "Golf content has a structural problem no other genre shares: the set charges admission. A course vlogger pays a green fee for every course video; a reviewer covering somewhere prestigious can pay a very substantial one. Multiply by playing partners if the format needs them, add a buggy where filming requires it, and the course line alone can dominate a video's budget.",
    },
    {
      type: "p",
      text: "Creators manage this in familiar ways — twilight rates, off-season filming, county cards, memberships that amortise across many videos, and relationships with courses that value the coverage. Even managed well, though, it never goes away: the course is the content, and the course costs money.",
    },
    { type: "h2", text: "Travel: the multiplier" },
    {
      type: "p",
      text: "Course content means going where the courses are. Fuel and tolls for regional filming, trains or flights for destination pieces, accommodation when the course is too far for a day trip, meals on the road. Trip series — the format golf audiences love most — bundle all of these into every episode. Travel is also where budgets quietly double: a rained-off day at a distant course means paying for the journey twice.",
    },
    { type: "h2", text: "Cameras and lenses" },
    {
      type: "p",
      text: "Golf is hard on camera gear and demanding of it. The format needs wide establishing shots, tight ball-striking detail and something that survives eighteen holes of being carried, set down in dew and occasionally rained on. Most creators run at least two angles — a main camera and an action camera or drone — plus the batteries and storage that a four-hour round consumes. None of it has to be top-of-the-line, but all of it wears, and replacement is a real recurring cost rather than a one-off purchase.",
    },
    { type: "h2", text: "Audio: the difference viewers can't name" },
    {
      type: "p",
      text: "Ask viewers why one golf channel feels professional and another doesn't, and they'll rarely say \"audio\" — but audio is usually the answer. Wind is the enemy of every on-course microphone, and clean voice on a links course in a breeze takes wireless mics, windshields and spares. Audio gear is cheaper than camera gear, yet it's the purchase that most visibly separates committed creators from casual ones.",
    },
    { type: "h2", text: "Editing: the invisible majority" },
    {
      type: "p",
      text: "For most golf creators, the largest single input isn't money — it's time. A round produces hours of multi-angle footage that has to be logged, cut, colour-graded, mixed and thumbnailed. Creators who edit themselves pay in evenings; creators who outsource pay an editor per video. Either way, editing typically consumes more hours than the round itself, and any honest cost picture has to value that time, because it's exactly what audience support buys back.",
    },
    { type: "h2", text: "The overheads nobody mentions" },
    {
      type: "ul",
      items: [
        "Software — editing suites, graphics tools and music licensing, nearly all subscription-priced now.",
        "Insurance and permissions — public liability cover where drone work or organised filming requires it, and permission fees at courses that charge for commercial filming.",
        "Golf itself — balls, gloves, club repairs, and the practice that keeps the golf in the golf content credible.",
        "Failure — the rained-off shoots, corrupted cards and videos that don't work. Failed content costs the same as successful content.",
      ],
    },
    { type: "h2", text: "Why this maths matters to viewers" },
    {
      type: "p",
      text: "Put the pieces together and a pattern emerges: golf content has high, repeating, per-video costs in a genre where platform advertising revenue alone rarely covers them for smaller channels. The gap is filled by the creator's own pocket — or, increasingly, by the audience. That's the case for direct support: not charity, but covering the real inputs of content you already value. We've written a companion piece on [how creators can fund their content](/blog/how-golf-creators-can-fund-their-content), and a practical guide to [supporting a golf creator](/blog/how-to-support-a-golf-content-creator) from the viewer's side.",
    },
    { type: "h2", text: "Budgeting honestly as a creator" },
    {
      type: "p",
      text: "If you create golf content, run the exercise once: list a typical video's course fee, travel, gear wear, software share and editing hours, and you'll have your true cost per video. That number tells you what sustainable support looks like — and it's the number behind a well-set goal. Goals priced from real costs are the ones audiences trust and fund, which is the principle [BuyMeATee](/how-it-works) is built on: specific golfing goals, transparent progress, and support in units golfers understand. If that would change what you're able to make, [join the early access list](/#early-access).",
    },
  ],
};
