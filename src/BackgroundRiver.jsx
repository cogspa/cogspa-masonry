import { useEffect, useRef } from "react";
import "./BackgroundRiver.css";

const LINKS_DATA = [
    { url: "https://adobe.com/firefly", label: "adobe.com/firefly" },
    { url: "https://midjourney.com", label: "midjourney.com" },
    { url: "https://runwayml.com", label: "runwayml.com" },
    { url: "https://openai.com/sora", label: "openai.com/sora" },
    { url: "https://lumalabs.ai", label: "lumalabs.ai" },
    { url: "https://meshy.ai", label: "meshy.ai" },
    { url: "https://spline.design", label: "spline.design" },
    { url: "https://leonardo.ai", label: "leonardo.ai" },
    { url: "https://pika.art", label: "pika.art" },
    { url: "https://elevenlabs.io", label: "elevenlabs.io" },
    { url: "https://huggingface.co", label: "huggingface.co" },
    { url: "https://vizcom.com", label: "vizcom.com" },
    { url: "https://scenario.com", label: "scenario.com" },
    { url: "https://kaedim3d.com", label: "kaedim3d.com" },
    { url: "https://tripo3d.ai", label: "tripo3d.ai" },
    { url: "https://klingai.com", label: "klingai.com" },
];

export function BackgroundRiver() {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const links = container.querySelectorAll(".river-row a");

        // Config matches the user snippet
        const ON_MIN_MS = 1500;
        const ON_MAX_MS = 3500;
        const OFF_MIN_MS = 8000;
        const OFF_MAX_MS = 25000;
        const START_CHANCE = 0.08;

        const timeouts = [];

        function toggleLink(link) {
            if (!link) return;
            const isHighlighted = link.classList.toggle("highlighted");
            let duration;
            if (isHighlighted) {
                duration = Math.random() * (ON_MAX_MS - ON_MIN_MS) + ON_MIN_MS;
            } else {
                duration = Math.random() * (OFF_MAX_MS - OFF_MIN_MS) + OFF_MIN_MS;
            }
            const t = setTimeout(() => toggleLink(link), duration);
            timeouts.push(t);
        }

        links.forEach((link) => {
            const startOn = Math.random() < START_CHANCE;
            if (startOn) link.classList.add("highlighted");

            let firstDuration = startOn
                ? Math.random() * (ON_MAX_MS - ON_MIN_MS) + ON_MIN_MS
                : Math.random() * (OFF_MAX_MS - OFF_MIN_MS) + OFF_MIN_MS;

            const t = setTimeout(() => {
                toggleLink(link);
            }, firstDuration * Math.random());
            timeouts.push(t);
        });

        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, []);

    // We need two blocks for the seamless loop
    const rows = [...LINKS_DATA, ...LINKS_DATA];
    // Wait, the user snippet had links REPEATED in rows.
    // Each row had the SAME link repeated 7 times.
    // And there were rows for each service.
    // Then the whole set was duplicated?

    // Let's reconstruct the exact user structure:
    // A set of rows (one per service), duped twice.
    // In each row, the link is repeated ~7 times.

    const renderRow = (item, idx) => (
        <div className="river-row" key={idx}>
            {Array.from({ length: 7 }).map((_, i) => (
                <a key={i} href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.label} •
                </a>
            ))}
        </div>
    );

    return (
        <div className="link-river" aria-hidden="true" ref={containerRef}>
            <div className="river-stack">
                {/* Block 1 */}
                {LINKS_DATA.map((item, i) => renderRow(item, `b1-${i}`))}
                {/* Block 2 (Duplicate for loop) */}
                {LINKS_DATA.map((item, i) => renderRow(item, `b2-${i}`))}
            </div>
        </div>
    );
}
