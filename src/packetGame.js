export const GAME_WIDTH = 31;
export const GAME_HEIGHT = 17;
export const DELIVERY_TARGET = 3;
export const START_POSITION = { x: 15, y: 15 };
const LANES = [3, 6, 9, 12];

export function createGameState() {
  return {
    player: { ...START_POSITION },
    tick: 0,
    score: 0,
    retries: 0,
    status: "ready",
    message: "Deliver three packets to ACK. Avoid the moving # congestion.",
  };
}

export function hazardAt(x, y, tick) {
  const lane = LANES.indexOf(y);
  if (lane < 0) return false;
  const direction = lane % 2 === 0 ? 1 : -1;
  return [2, 11, 21].some((origin) => {
    const head =
      1 + ((((origin + lane * 3 + tick * direction) % 29) + 29) % 29);
    return x === head || x === (head % 29) + 1;
  });
}

function retry(state) {
  return {
    ...state,
    player: { ...START_POSITION },
    retries: state.retries + 1,
    message: "Congestion hit. Packet retained; retry from the source.",
  };
}

export function tickGame(state) {
  if (state.status !== "running") return state;
  const next = { ...state, tick: state.tick + 1 };
  return hazardAt(next.player.x, next.player.y, next.tick) ? retry(next) : next;
}

export function moveGame(state, direction, turnBased = false) {
  if (state.status !== "running") return state;
  const offsets = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  if (!offsets[direction]) return state;
  const [dx, dy] = offsets[direction];
  const player = {
    x: Math.max(1, Math.min(29, state.player.x + dx)),
    y: Math.max(1, Math.min(15, state.player.y + dy)),
  };
  // The top row is a wall outside the ACK gate.
  if (player.y === 1 && (player.x < 13 || player.x > 17)) return state;
  const next = { ...state, player, tick: state.tick + (turnBased ? 1 : 0) };
  if (hazardAt(player.x, player.y, next.tick)) return retry(next);
  if (player.y === 1) {
    const score = next.score + 1;
    return {
      ...next,
      player: { ...START_POSITION },
      score,
      status: score === DELIVERY_TARGET ? "won" : "running",
      message:
        score === DELIVERY_TARGET
          ? "All three packets acknowledged. Delivery complete!"
          : `Packet ${score} acknowledged. Route the next one.`,
    };
  }
  return next;
}

export function renderGame(state) {
  const grid = Array.from({ length: GAME_HEIGHT }, (_, y) =>
    Array.from({ length: GAME_WIDTH }, (_, x) => {
      if (y === 0 || y === GAME_HEIGHT - 1)
        return x === 0 || x === GAME_WIDTH - 1 ? "+" : "-";
      if (x === 0 || x === GAME_WIDTH - 1) return "|";
      if (y === 1) return x >= 13 && x <= 17 ? " " : "=";
      if (hazardAt(x, y, state.tick)) return "#";
      if (y === 14 || y === 2) return ".";
      return " ";
    }),
  );
  "[ACK]".split("").forEach((character, offset) => {
    grid[1][13 + offset] = character;
  });
  grid[state.player.y][state.player.x] = "@";
  if (state.status === "ready" || state.status === "won") {
    const heading =
      state.status === "ready"
        ? "P A C K E T  R U N N E R"
        : "D E L I V E R E D";
    const instruction =
      state.status === "ready"
        ? "[ START TO ROUTE ]"
        : "[ 3 / 3 ACKNOWLEDGED ]";
    [heading, instruction].forEach((text, index) => {
      const y = index === 0 ? 7 : 8;
      grid[y] = Array(GAME_WIDTH).fill(" ");
      grid[y][0] = "|";
      grid[y][GAME_WIDTH - 1] = "|";
      const start = Math.floor((GAME_WIDTH - text.length) / 2);
      text.split("").forEach((character, offset) => {
        grid[y][start + offset] = character;
      });
    });
  }
  return grid.map((row) => row.join("")).join("\n");
}
