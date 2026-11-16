<script lang="ts">
  import type { RunStatus } from './run-status.js';

  interface Props {
    readonly status: RunStatus | null;
    readonly onLeave: () => void;
  }

  const { status, onLeave }: Props = $props();
</script>

<!-- SG-56: the team's health, experience bar, level, score, and time survived stay on screen. -->
<header class="hud">
  {#if status !== null}
    <div class="bars">
      <div
        class="bar health"
        role="meter"
        aria-label="Team health"
        aria-valuemin="0"
        aria-valuemax="1"
        aria-valuenow={status.healthShare}
      >
        <div class="fill" style:width="{status.healthShare * 100}%"></div>
        <span class="bar-text">Health {status.healthText}</span>
      </div>
      <div
        class="bar experience"
        role="meter"
        aria-label="Experience"
        aria-valuemin="0"
        aria-valuemax="1"
        aria-valuenow={status.experienceShare}
      >
        <div class="fill" style:width="{status.experienceShare * 100}%"></div>
        <span class="bar-text">Level {status.levelText}</span>
      </div>
    </div>
    <dl class="numbers">
      <div>
        <dt>Score</dt>
        <dd>{status.scoreText}</dd>
      </div>
      <div>
        <dt>Time</dt>
        <dd>{status.timeText}</dd>
      </div>
    </dl>
  {/if}
  <button type="button" class="leave" onclick={onLeave}>Leave</button>
</header>

<style>
  .hud {
    display: flex;
    flex: none;
    align-items: center;
    gap: 0.75rem;
    padding: 0.4rem 0.6rem;
    background: #151a20;
  }

  .bars {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
  }

  .bar {
    position: relative;
    height: 1.1rem;
    overflow: hidden;
    border-radius: 0.55rem;
    background: #2a323b;
  }

  .fill {
    height: 100%;
  }

  .health .fill {
    background: #d6483f;
  }

  .experience .fill {
    background: #3a8fd9;
  }

  .bar-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .numbers {
    display: flex;
    gap: 0.75rem;
    margin: 0;
    text-align: center;
  }

  dt {
    font-size: 0.7rem;
    color: #9aa7b3;
  }

  dd {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .leave {
    min-height: 2.25rem;
    padding: 0 0.7rem;
    border: 1px solid #44505c;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }

  /* The wide arrangement (SG-51): the status moves to a column beside the arena. */
  @media (min-aspect-ratio: 1 / 1) {
    .hud {
      width: 11.5rem;
      flex-direction: column;
      align-items: stretch;
      padding: 0.75rem;
    }

    .numbers {
      justify-content: space-around;
    }

    .leave {
      margin-top: auto;
    }
  }
</style>
