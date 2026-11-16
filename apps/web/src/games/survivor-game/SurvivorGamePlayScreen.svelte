<script lang="ts">
  import {
    SOCKET_PLAYER_ID_PARAMETER,
    type RunEndedMessage,
    type RunStateReport,
  } from '@local/survivor-game';
  import { onMount } from 'svelte';
  import GameOverPanel from '../../components/GameOverPanel.svelte';
  import { buildRoomSocketUrl } from '../../rooms/room-socket-url.js';
  import { openBrowserWebSocket, type ConnectionStatus } from '../../rooms/reconnecting-socket.js';
  import { navigate } from '../../routing/router.js';
  import type { RoomPlayScreenProps } from '../browser-game.js';
  import { DirectionSender } from './direction-sender.js';
  import { drawScene } from './draw-scene.js';
  import { formatTimeSurvived } from './format-time-survived.js';
  import { lockPageGestures } from './lock-page-gestures.js';
  import { describeOffer, OfferChoiceGuard, type OfferView } from './offer-cards.js';
  import { PlayInput } from './play-input.js';
  import { describeRunStatus, type RunStatus } from './run-status.js';
  import { buildScene, findOwnPlayer } from './scene.js';
  import { RunConnection } from './run-connection.js';
  import { StateTimeline } from './state-timeline.js';
  import SurvivorConnectionNotice from './SurvivorConnectionNotice.svelte';
  import SurvivorOfferCards from './SurvivorOfferCards.svelte';
  import SurvivorStatusHud from './SurvivorStatusHud.svelte';
  import { computeViewTransform } from './view-transform.js';

  const { gameId, roomId, playerId, gamePagePath, dashboardPath }: RoomPlayScreenProps = $props();

  const REFUSAL_SHOW_MS = 4000;
  const END_REASON_TEXT: Readonly<Record<RunEndedMessage['reason'], string>> = {
    defeat: 'The team was defeated.',
    abandoned: 'Nobody stayed connected, so the run ended.',
  };

  const timeline = new StateTimeline();
  const offerGuard = new OfferChoiceGuard();

  let latestState: RunStateReport | null = $state.raw(null);
  let ended: RunEndedMessage | null = $state.raw(null);
  let connectionStatus: ConnectionStatus = $state.raw({ kind: 'connecting' });
  let refusalText: string | null = $state(null);
  let canvas: HTMLCanvasElement | undefined = $state();
  let playArea: HTMLElement | undefined = $state();

  const runStatus: RunStatus | null = $derived(
    latestState === null ? null : describeRunStatus(latestState),
  );
  const ownPlayer = $derived(latestState === null ? null : findOwnPlayer(latestState, playerId));
  const offer: OfferView | null = $derived(
    latestState === null || ownPlayer === null || ended !== null
      ? null
      : describeOffer(latestState, ownPlayer),
  );

  let connection: RunConnection | undefined;
  let direction: DirectionSender | undefined;
  let refusalTimer: ReturnType<typeof setTimeout> | undefined;

  function chooseCard(cardIndex: number): void {
    if (ownPlayer === null || ended !== null) {
      return;
    }
    const upgradeId = offerGuard.choose(ownPlayer, cardIndex);
    if (upgradeId !== null && connection?.chooseUpgrade(upgradeId) !== true) {
      // The choice never left this page, so the player may try again.
      offerGuard.clear();
    }
  }

  function showRefusal(text: string): void {
    refusalText = text;
    clearTimeout(refusalTimer);
    refusalTimer = setTimeout(() => {
      refusalText = null;
    }, REFUSAL_SHOW_MS);
  }

  function leaveRun(): void {
    if (
      window.confirm(
        'Leave the run? Your character stays in it, and you can rejoin from the game page.',
      )
    ) {
      navigate(gamePagePath);
    }
  }

  function resizeCanvasToItsBox(element: HTMLCanvasElement): {
    width: number;
    height: number;
    pixelRatio: number;
  } {
    const width = element.clientWidth;
    const height = element.clientHeight;
    const pixelRatio = window.devicePixelRatio;
    const backingWidth = Math.round(width * pixelRatio);
    const backingHeight = Math.round(height * pixelRatio);
    if (element.width !== backingWidth || element.height !== backingHeight) {
      element.width = backingWidth;
      element.height = backingHeight;
    }
    return { width, height, pixelRatio };
  }

  onMount(() => {
    if (canvas === undefined || playArea === undefined) {
      throw new Error('The play screen has no canvas to draw on');
    }
    const drawingCanvas = canvas;
    const context = drawingCanvas.getContext('2d');
    if (context === null) {
      throw new Error('This browser cannot draw on a canvas');
    }

    const runConnection = new RunConnection({
      url: buildRoomSocketUrl({
        pageProtocol: window.location.protocol,
        pageHost: window.location.host,
        gameId,
        roomId,
        playerId,
        playerIdParameter: SOCKET_PLAYER_ID_PARAMETER,
      }),
      createSocket: openBrowserWebSocket,
      ownPlayerId: playerId,
      onState: (state) => {
        timeline.push(state, performance.now());
        latestState = state;
      },
      onRunEnded: (message) => {
        timeline.push(message.state, performance.now());
        latestState = message.state;
        ended = message;
      },
      onRefused: (message) => {
        // The choice was not taken, so the player may choose again.
        offerGuard.clear();
        showRefusal(message.message);
      },
      onStatus: (status) => {
        connectionStatus = status;
        offerGuard.handleConnectionStatus(status);
        if (status.kind === 'open') {
          direction?.handleReconnected();
        }
      },
    });
    const directionSender = new DirectionSender((newDirection) =>
      runConnection.sendDirection(newDirection),
    );
    connection = runConnection;
    direction = directionSender;
    const input = new PlayInput(directionSender, chooseCard);

    const stopKeyboard = input.attachKeyboard();
    const stopPointer = input.attachPointer(drawingCanvas);
    const unlockPage = lockPageGestures(playArea);

    let frameRequest = 0;
    const drawFrame = (): void => {
      frameRequest = requestAnimationFrame(drawFrame);
      const frame = timeline.frameAt(performance.now());
      if (frame === null) {
        return;
      }
      const { width, height, pixelRatio } = resizeCanvasToItsBox(drawingCanvas);
      const scene = buildScene(frame, playerId);
      const view = computeViewTransform({ width, height }, scene.own);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawScene(
        context,
        { width, height },
        view,
        scene,
        playerId,
        ended === null ? input.joystick.drawing : null,
      );
    };
    frameRequest = requestAnimationFrame(drawFrame);

    runConnection.start();

    return () => {
      cancelAnimationFrame(frameRequest);
      clearTimeout(refusalTimer);
      stopKeyboard();
      stopPointer();
      unlockPage();
      runConnection.close();
      connection = undefined;
      direction = undefined;
    };
  });
</script>

<!-- A play screen takes the whole window, so no page scrolls under a thumb (SG-54). -->
<div
  class="play"
  bind:this={playArea}
  oncontextmenu={(event) => {
    event.preventDefault();
  }}
  role="application"
  aria-label="Survivor Game"
>
  <SurvivorStatusHud status={runStatus} onLeave={leaveRun} />
  <div class="arena-area">
    <canvas bind:this={canvas} class="arena" aria-label="The arena around your character"></canvas>
    {#if offer !== null}
      <SurvivorOfferCards {offer} onChoose={chooseCard} />
    {/if}
    {#if connectionStatus.kind !== 'open' && ended === null}
      <SurvivorConnectionNotice status={connectionStatus} {gamePagePath} {dashboardPath} />
    {/if}
    {#if refusalText !== null}
      <p class="refusal" role="status">{refusalText}</p>
    {/if}
  </div>
  {#if ended !== null}
    <div class="game-over">
      <GameOverPanel
        reason={END_REASON_TEXT[ended.reason]}
        finalResult="Score {ended.summary.score}, {formatTimeSurvived(
          ended.summary.details.secondsSurvived,
        )} survived, level {ended.summary.details.levelReached}"
        newGamePath={gamePagePath}
        newGameLabel="Game Page"
        {dashboardPath}
      />
    </div>
  {/if}
</div>

<style>
  .play {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    background: #0b0d10;
    color: #f2f4f5;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    overscroll-behavior: none;
  }

  .arena-area {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
  }

  .arena {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
  }

  .refusal {
    position: absolute;
    right: 0.5rem;
    bottom: 1rem;
    left: 0.5rem;
    margin: 0 auto;
    padding: 0.4rem 0.75rem;
    max-width: 26rem;
    border-radius: 8px;
    background: rgb(17 22 28 / 0.92);
    text-align: center;
    pointer-events: none;
  }

  .game-over {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgb(0 0 0 / 0.55);
    color: var(--color-text);
  }

  /* The wide arrangement (SG-51): the status column sits beside the arena. */
  @media (min-aspect-ratio: 1 / 1) {
    .play {
      flex-direction: row;
    }
  }
</style>
