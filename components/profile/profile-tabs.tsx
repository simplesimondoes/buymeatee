"use client";

import { useEffect, useState } from "react";

/**
 * A sticky in-page tab bar for the creator profile (About / Journey / Goals /
 * Support). It scrolls to section anchors rather than routing, so the page
 * stays statically generated. A scroll-spy highlights the section in view.
 */
export function ProfileTabs({
  tabs,
}: {
  tabs: { id: string; label: string }[];
}) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  useEffect(() => {
    const sections = tabs
      .map((tab) => document.getElementById(tab.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [tabs]);

  function handleClick(event: React.MouseEvent, id: string) {
    event.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(id);
    }
  }

  return (
    <nav
      aria-label="Profile sections"
      className="sticky top-0 z-20 -mx-4 mb-6 border-b border-stone bg-white/90 px-4 backdrop-blur sm:mx-0 sm:rounded-full sm:border sm:px-2"
    >
      <ul className="flex gap-1 overflow-x-auto py-2">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <li key={tab.id}>
              <a
                href={`#${tab.id}`}
                onClick={(event) => handleClick(event, tab.id)}
                aria-current={isActive ? "true" : undefined}
                className={`inline-flex min-h-9 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-forest text-white"
                    : "text-ink/70 hover:bg-mist hover:text-forest"
                }`}
              >
                {tab.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
