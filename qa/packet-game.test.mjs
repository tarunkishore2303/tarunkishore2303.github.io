import test from "node:test";
import assert from "node:assert/strict";
import {
  createGameState,
  tickGame,
  moveGame,
  renderGame,
  START_POSITION,
} from "../src/packetGame.js";

test("idle and paused games never advance", () => {
  for (const status of ["ready", "paused", "won"]) {
    const state = { ...createGameState(), status };
    assert.equal(tickGame(state), state);
    assert.equal(moveGame(state, "up", true), state);
  }
});

test("a moving hazard retains completed deliveries and retries the packet", () => {
  const state = {
    ...createGameState(),
    status: "running",
    score: 2,
    player: { x: 5, y: 3 },
  };
  const next = tickGame(state);
  assert.equal(next.retries, 1);
  assert.equal(next.score, 2);
  assert.deepEqual(next.player, START_POSITION);
  assert.equal(next.status, "running");
});

test("movement stays inside walls and only the ACK gate accepts packets", () => {
  const state = {
    ...createGameState(),
    status: "running",
    player: { x: 1, y: 2 },
  };
  assert.equal(moveGame(state, "up"), state);
  assert.deepEqual(moveGame(state, "left").player, { x: 1, y: 2 });
  const next = moveGame({ ...state, player: { x: 15, y: 2 } }, "up");
  assert.equal(next.score, 1);
  assert.deepEqual(next.player, START_POSITION);
});

test("three complete routes win without retries and a new state resets the game", () => {
  let state = { ...createGameState(), status: "running" };
  for (const route of [
    "UUUUULUUUUUUUUU",
    "UUUUUUUUUUUUUU",
    "UUUUULUUUUUUUUU",
  ]) {
    for (const key of route)
      state = moveGame(state, key === "U" ? "up" : "left", true);
  }
  assert.equal(state.status, "won");
  assert.equal(state.score, 3);
  assert.equal(state.retries, 0);
  assert.equal(createGameState().score, 0);
  assert.equal(createGameState().status, "ready");
});

test("ASCII board has stable dimensions, one player, and printable characters", () => {
  const text = renderGame(createGameState());
  const lines = text.split("\n");
  assert.equal(lines.length, 17);
  assert.ok(lines.every((line) => line.length === 31));
  assert.match(text, /^[\x20-\x7e\n]+$/);
  assert.equal([...text].filter((char) => char === "@").length, 1);
});
