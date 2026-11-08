import React, { useEffect, useMemo, useRef, useState } from "react";

const WIDTH = 44;
const FRAME_COUNT = 96;

function drawing(height) {
  const cells = Array.from({ length: height }, () => Array(WIDTH).fill(" "));
  const put = (x, y, value) => {
    if (y < 0 || y >= height) return;
    String(value)
      .split("")
      .forEach((character, offset) => {
        if (x + offset >= 0 && x + offset < WIDTH)
          cells[y][x + offset] = character;
      });
  };
  const line = (points, character = ".") => {
    const route = [];
    for (let i = 1; i < points.length; i++) {
      let [x, y] = points[i - 1];
      const [endX, endY] = points[i];
      const dx = Math.sign(endX - x);
      const dy = Math.sign(endY - y);
      while (x !== endX || y !== endY) {
        put(x, y, character);
        route.push([x, y]);
        x += dx;
        y += dy;
      }
      put(x, y, character);
      route.push([x, y]);
    }
    return route;
  };
  const box = (x, y, width, label, detail, active = false) => {
    const edge = active ? "=" : "-";
    put(x, y, `+${edge.repeat(width - 2)}+`);
    put(x, y + 1, `|${label.slice(0, width - 2).padEnd(width - 2)}|`);
    put(x, y + 2, `|${detail.slice(0, width - 2).padEnd(width - 2)}|`);
    put(x, y + 3, `+${edge.repeat(width - 2)}+`);
  };
  const packet = (route, tick, symbol = "@") => {
    if (!route.length) return;
    const index = tick % route.length;
    const [x, y] = route[index];
    if (index > 1) {
      const [tailX, tailY] = route[index - 2];
      put(tailX, tailY, "o");
    }
    put(x, y, symbol);
  };
  return {
    put,
    line,
    box,
    packet,
    output: () => cells.map((row) => row.join("")).join("\n"),
  };
}

function requestFrame(tick, stage, offline) {
  const art = drawing(24);
  const phase = tick / 7;
  // A moving interference field gives the otherwise rectilinear system a signal texture.
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const signal =
        Math.sin(x * 0.35 + phase) * Math.cos(y * 0.5 - phase * 0.6);
      if ((x + y) % 3 === 0 && Math.abs(signal) > 0.72)
        art.put(x, y, signal > 0 ? ":" : ".");
    }
  }
  art.put(3, 0, "01 / REQUEST FABRIC");
  art.put(31, 0, "+  +  +  +");
  const routes = [
    art.line(
      [
        [0, 5],
        [3, 5],
      ],
      ">",
    ),
    art.line(
      [
        [14, 5],
        [28, 5],
      ],
      "-",
    ),
    art.line(
      [
        [34, 7],
        [34, 10],
      ],
      "|",
    ),
    art.line(
      [
        [28, 12],
        [16, 12],
      ],
      "-",
    ),
    art.line(
      [
        [9, 14],
        [9, 18],
      ],
      "|",
    ),
    art.line(
      [
        [16, 20],
        [28, 20],
      ],
      "-",
    ),
  ];
  art.put(18, 4, "COMMIT");
  art.put(35, 8, "OUTBOX");
  art.put(18, 11, "RELAY");
  art.put(10, 16, "EXECUTE");
  art.put(18, 19, "RECORD");
  art.box(3, 3, 12, " API", " VALIDATE", stage === 1);
  art.box(28, 3, 13, " POSTGRES", " STATE+EVT", stage === 2);
  art.box(
    28,
    10,
    13,
    " KAFKA",
    offline ? " OFFLINE [!]" : " DELIVER",
    stage === 3,
  );
  art.box(3, 10, 13, " SCHEDULER", " DISPATCH", stage === 4);
  art.box(3, 18, 13, " WORKER", " EXECUTE", stage === 5);
  art.box(28, 18, 13, " RESULT", " PERSIST", stage === 6);
  const routeIndex = Math.max(0, Math.min(5, stage - 1));
  if (offline && stage === 3) {
    art.put(34, 9, "!");
    art.put(3, 23, "[!] INTENT HELD / WAITING FOR BROKER");
  } else {
    art.packet(routes[routeIndex], tick);
    art.put(
      3,
      23,
      stage === 6
        ? "[+] RESULT RECORDED / EVIDENCE RETAINED"
        : "[>] STATE -> INTENT -> DELIVERY",
    );
  }
  return art.output();
}

function conductorFrame(tick) {
  const art = drawing(19);
  art.put(2, 0, "DURABLE GRAPH / BRANCH + JOIN");
  const top = art.line(
    [
      [10, 9],
      [12, 9],
      [12, 4],
      [16, 4],
    ],
    ".",
  );
  const bottom = art.line(
    [
      [10, 9],
      [12, 9],
      [12, 13],
      [16, 13],
    ],
    ".",
  );
  const topJoin = art.line(
    [
      [26, 4],
      [29, 4],
      [29, 9],
      [32, 9],
    ],
    ".",
  );
  const bottomJoin = art.line(
    [
      [26, 13],
      [29, 13],
      [29, 9],
      [32, 9],
    ],
    ".",
  );
  art.box(2, 7, 9, " INPUT", " READY", true);
  art.box(16, 2, 11, " FETCH", " ATTEMPT", Math.floor(tick / 12) % 2 === 0);
  art.box(16, 11, 11, "TRANSFORM", " RETRY", Math.floor(tick / 12) % 2 === 1);
  art.box(32, 7, 11, " JOIN", " COMMIT", tick % 32 > 20);
  art.packet(top, tick);
  art.packet(bottom, tick + 5, "*");
  art.packet(topJoin, tick + 8);
  art.packet(bottomJoin, tick + 12, "*");
  art.put(3, 17, "+---- PERSISTED EXECUTION STATE ----+");
  art.put(3, 18, "|  ATTEMPT / RESULT / NEXT INTENT   |");
  return art.output();
}

function forgeFrame(tick) {
  const art = drawing(19);
  const active = Math.floor(tick / 16) % 3;
  art.put(2, 0, "BOUNDED TASK / REVIEWABLE CHANGE");
  art.box(12, 2, 20, " 01 / DRAFT", " proposal.py", active === 0);
  art.box(12, 8, 20, " 02 / VERIFY", " independent tests", active === 1);
  art.box(12, 14, 20, " 03 / APPLY", " drift check + save", active === 2);
  const first = art.line(
    [
      [22, 6],
      [22, 8],
    ],
    "|",
  );
  const second = art.line(
    [
      [22, 12],
      [22, 14],
    ],
    "|",
  );
  art.packet(active === 0 ? first : second, tick, "v");
  art.put(4, 3, "[ ]");
  art.put(4, 9, active >= 1 ? "[x]" : "[ ]");
  art.put(4, 15, active === 2 ? "[x]" : "[ ]");
  art.put(34, 3, "LOCAL");
  art.put(34, 9, "TEST");
  art.put(34, 15, "SAVE");
  art.put(2, 18, "SOURCE SNAPSHOT ------> VERIFIED CHANGE");
  return art.output();
}

export default function AsciiArt({
  variant = "request",
  stage = 0,
  offline = false,
}) {
  const element = useRef(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const node = element.current;
    const root = document.documentElement;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let timer;
    let visible =
      node.getBoundingClientRect().top < innerHeight &&
      node.getBoundingClientRect().bottom > 0;
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    const sync = () => {
      stop();
      if (
        !visible ||
        document.hidden ||
        root.dataset.motion === "paused" ||
        reducedMotion.matches
      )
        return;
      timer = setInterval(
        () => setFrame((current) => (current + 1) % FRAME_COUNT),
        125,
      );
    };
    const motionObserver = new MutationObserver(sync);
    motionObserver.observe(root, {
      attributes: true,
      attributeFilter: ["data-motion"],
    });
    const visibilityObserver = window.IntersectionObserver
      ? new IntersectionObserver(
          (entries) => {
            visible = entries[0].isIntersecting;
            sync();
          },
          { threshold: 0.01 },
        )
      : null;
    visibilityObserver?.observe(node);
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);
    sync();
    return () => {
      stop();
      motionObserver.disconnect();
      visibilityObserver?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
    };
  }, []);

  const text = useMemo(() => {
    if (variant === "conductor") return conductorFrame(frame);
    if (variant === "forge") return forgeFrame(frame);
    return requestFrame(frame, stage, offline);
  }, [variant, frame, stage, offline]);

  return (
    <pre
      ref={element}
      className={`ascii-frame ascii-${variant}`}
      aria-hidden="true"
      data-frame={frame}
    >
      {text}
    </pre>
  );
}
