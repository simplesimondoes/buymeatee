import { ButtonLink } from "@/components/button-link";

type CallToActionProps = {
  heading?: string;
  body?: string;
};

/** Full-width closing CTA band, reused across marketing pages. */
export function CallToAction({
  heading = "Ready to support the journey?",
  body = "Join early access and be part of BuyMeATee from the first tee.",
}: CallToActionProps) {
  return (
    <section className="on-dark bg-forest">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-white text-balance sm:text-4xl">
          {heading}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/80">{body}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/#early-access" variant="onDark" size="lg">
            Start your page
          </ButtonLink>
          <ButtonLink href="/#early-access" variant="onDarkOutline" size="lg">
            Join early access
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
