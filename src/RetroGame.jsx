import React, { useEffect, useRef, useState } from "react";
import {
  createGameState,
  DELIVERY_TARGET,
  moveGame,
  renderGame,
  tickGame,
} from "./packetGame.js";

const keys = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
};

export default function RetroGame() {
  const [game, setGame] = useState(createGameState);
  const [reducedMotion, setReducedMotion] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [motionPaused, setMotionPaused] = useState(
    () => document.documentElement.dataset.motion === "paused",
  );
  const [visible, setVisible] = useState(true);
  const board = useRef(null);
  const figure = useRef(null);
  const turnBased = reducedMotion || motionPaused;

  function pause(message = "Paused. The packet is safe; resume when ready.") {
    setGame((current) =>
      current.status === "running"
        ? { ...current, status: "paused", message }
        : current,
    );
  }

  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    let previousMotion = document.documentElement.dataset.motion === "paused";
    const syncMotion = () => {
      const paused = document.documentElement.dataset.motion === "paused";
      setMotionPaused(paused);
      if (paused && !previousMotion)
        pause("Motion paused. Resume to play one move at a time.");
      previousMotion = paused;
    };
    const syncReduced = () => {
      setReducedMotion(query.matches);
      if (query.matches)
        pause("Reduced motion enabled. Resume for turn-based play.");
    };
    const syncVisibility = () => {
      if (document.hidden)
        pause("Paused while you were away. Resume to keep routing.");
    };
    const motionObserver = new MutationObserver(syncMotion);
    motionObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    });
    const observer = window.IntersectionObserver
      ? new IntersectionObserver(
          ([entry]) => {
            setVisible(entry.isIntersecting);
            if (!entry.isIntersecting)
              pause("Paused offscreen. Resume to keep routing.");
          },
          { threshold: 0.03 },
        )
      : null;
    observer?.observe(figure.current);
    query.addEventListener("change", syncReduced);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      motionObserver.disconnect();
      observer?.disconnect();
      query.removeEventListener("change", syncReduced);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (game.status !== "running" || turnBased || !visible || document.hidden)
      return;
    const timer = setInterval(() => setGame(tickGame), 260);
    return () => clearInterval(timer);
  }, [game.status, turnBased, visible]);

  function start() {
    setGame({
      ...createGameState(),
      status: "running",
      message: turnBased
        ? "Turn-based mode: each move advances congestion. Reach ACK."
        : "Route @ to ACK. Arrow keys or WASD; avoid # congestion.",
    });
    board.current?.focus({ preventScroll: true });
  }

  function resume() {
    if (document.hidden || !visible) return;
    setGame((current) => ({
      ...current,
      status: "running",
      message: turnBased
        ? "Turn-based mode: each move advances congestion."
        : "Back on the wire. Route your packet to ACK.",
    }));
    board.current?.focus({ preventScroll: true });
  }

  function move(direction) {
    setGame((current) => moveGame(current, direction, turnBased));
  }

  function onKeyDown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const direction = keys[event.key] || keys[event.key.toLowerCase()];
    if (direction) {
      event.preventDefault();
      move(direction);
    } else if (
      event.key === " " &&
      game.status !== "ready" &&
      game.status !== "won"
    ) {
      event.preventDefault();
      if (game.status === "running") pause();
      else resume();
    } else if (
      event.key === "Enter" &&
      (game.status === "ready" || game.status === "won")
    ) {
      event.preventDefault();
      start();
    }
  }

  return (
    <figure
      ref={figure}
      className="request-lab retro-game"
      id="request-lab"
      data-state={game.status}
      data-score={game.score}
      data-retries={game.retries}
      data-player-x={game.player.x}
      data-player-y={game.player.y}
      data-tick={game.tick}
    >
      <div className="plate-heading">
        <span className="mono">01 / PACKET RUNNER</span>
        <span className="model-label">
          <i /> ASCII ARCADE
        </span>
      </div>
      <div className="game-scoreboard mono">
        <span>
          ACK{" "}
          <strong>
            {game.score}/{DELIVERY_TARGET}
          </strong>
        </span>
        <span>
          RETRIES <strong>{String(game.retries).padStart(2, "0")}</strong>
        </span>
        <span>{turnBased ? "TURN-BASED" : "LIVE PLAY"}</span>
      </div>
      <div
        ref={board}
        className="game-board"
        tabIndex={0}
        role="group"
        aria-label="Packet Runner game board"
        aria-describedby="game-instructions game-position"
        onKeyDown={onKeyDown}
      >
        <pre
          className="ascii-frame ascii-game"
          aria-hidden="true"
          data-frame={game.tick}
        >
          {renderGame(game)
            .split(/([@#])/)
            .map((part, index) =>
              part === "@" || part === "#" ? (
                <span
                  key={index}
                  className={part === "@" ? "game-player" : "game-hazard"}
                >
                  {part}
                </span>
              ) : (
                part
              ),
            )}
        </pre>
        {game.status === "paused" && (
          <span className="game-pause-overlay mono" aria-hidden="true">
            [ PAUSED ]
          </span>
        )}
      </div>
      <div className="game-controls">
        <div className="game-actions">
          {game.status === "ready" ? (
            <button className="trace-button" onClick={start}>
              Start game <span aria-hidden="true">&gt;</span>
            </button>
          ) : game.status === "won" ? (
            <button className="trace-button" onClick={start}>
              Restart game <span aria-hidden="true">&gt;</span>
            </button>
          ) : (
            <>
              <button
                className="trace-button"
                onClick={game.status === "running" ? () => pause() : resume}
              >
                {game.status === "running" ? "Pause game" : "Resume game"}
              </button>
              <button className="game-restart" onClick={start}>
                Restart game
              </button>
            </>
          )}
        </div>
        <div className="game-dpad" role="group" aria-label="Movement controls">
          <button
            className="game-up"
            aria-label="Move up"
            disabled={game.status !== "running"}
            onClick={() => move("up")}
          >
            <span aria-hidden="true">^</span>
          </button>
          <button
            className="game-left"
            aria-label="Move left"
            disabled={game.status !== "running"}
            onClick={() => move("left")}
          >
            <span aria-hidden="true">&lt;</span>
          </button>
          <button
            className="game-down"
            aria-label="Move down"
            disabled={game.status !== "running"}
            onClick={() => move("down")}
          >
            <span aria-hidden="true">v</span>
          </button>
          <button
            className="game-right"
            aria-label="Move right"
            disabled={game.status !== "running"}
            onClick={() => move("right")}
          >
            <span aria-hidden="true">&gt;</span>
          </button>
        </div>
      </div>
      <figcaption className="lab-caption game-caption">
        <strong aria-live="polite" aria-atomic="true">
          {game.message}
        </strong>
        <span id="game-instructions">
          @ is your packet. Reach [ACK] at the top; avoid # congestion. Use
          arrow keys / WASD or the pad. Space pauses.
        </span>
        <span id="game-position" className="visually-hidden">
          Your packet is at column {game.player.x + 1}, row {game.player.y + 1}.
          The ACK gate is in columns 14 through 18 of the top playable row.
        </span>
      </figcaption>
      <div className="plate-foot mono">
        <span>3 PACKETS. UNLIMITED RETRIES.</span>
        <span>PLAYABLE MODEL / NO LIVE TRAFFIC</span>
      </div>
    </figure>
  );
}
