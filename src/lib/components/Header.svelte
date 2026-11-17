<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';

  let { onopenGuide }: { onopenGuide: () => void } = $props();
</script>

<header class="topbar">
  <a class="brand" href="/" aria-label="Pixel Sorting Visualizer home">
    <span class="brand-mark" aria-hidden="true">
      <span class="mark-lime"></span>
      <span class="mark-pink"></span>
    </span>
    <span class="brand-type">
      <span class="brand-name">PIXEL SORT</span>
      <span class="brand-sub">VISUALIZER</span>
    </span>
  </a>

  <div class="topbar-right">
    <span class="local-badge mono">
      <Icon name="lock" size={12} />
      100% LOCAL
    </span>
    <span class="status-pill mono" data-tone={app.statusTone} role="status" aria-live="polite">
      <span class="status-dot" aria-hidden="true"></span>
      {app.statusLabel}
    </span>
    <button class="btn btn-ghost btn-small guide-btn" type="button" onclick={onopenGuide}>
      <Icon name="help" size={15} />
      How it works
    </button>
  </div>
</header>

<style>
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    width: 100%;
    min-height: 64px;
    padding: 10px 24px;
    border-bottom: 1px solid var(--line);
    background: rgba(17, 17, 17, 0.92);
    backdrop-filter: blur(12px);
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 11px;
    color: var(--text);
    text-decoration: none;
  }

  .brand:hover {
    color: var(--text);
  }

  .brand-mark {
    position: relative;
    display: block;
    width: 30px;
    height: 30px;
    flex: none;
  }

  .mark-lime,
  .mark-pink {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid var(--ink);
  }

  .mark-lime {
    top: 0;
    left: 0;
    background: var(--lime);
  }

  .mark-pink {
    right: 0;
    bottom: 0;
    background: var(--pink);
    mix-blend-mode: screen;
  }

  .brand-type {
    display: grid;
    gap: 1px;
    line-height: 1;
  }

  .brand-name {
    font-size: 17px;
    font-weight: 900;
    letter-spacing: -0.025em;
  }

  .brand-sub {
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.24em;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .local-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--muted);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
  }

  .local-badge :global(svg) {
    color: var(--lime);
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 26px;
    padding: 0 9px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    color: var(--muted);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .status-pill[data-tone='live'] {
    border-color: rgba(198, 255, 0, 0.5);
    color: var(--lime);
  }

  .status-pill[data-tone='live'] .status-dot {
    animation: pulse 1.4s ease-in-out infinite;
  }

  .status-pill[data-tone='paused'] {
    border-color: rgba(255, 20, 147, 0.5);
    color: var(--bubblegum);
  }

  .status-pill[data-tone='done'] {
    border-color: rgba(198, 255, 0, 0.5);
    color: var(--lime);
  }

  .status-pill[data-tone='error'] {
    border-color: rgba(255, 92, 92, 0.5);
    color: var(--danger);
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.35;
      transform: scale(0.7);
    }
  }

  @media (max-width: 760px) {
    .topbar {
      padding: 10px 14px;
    }

    .local-badge {
      display: none;
    }

    .guide-btn {
      width: 34px;
      padding: 0;
      font-size: 0;
      gap: 0;
    }

    .guide-btn :global(svg) {
      width: 16px;
      height: 16px;
    }
  }

  @media (max-width: 480px) {
    .brand-sub {
      display: none;
    }

    .status-pill {
      padding: 0 7px;
      font-size: 8px;
    }
  }
</style>
