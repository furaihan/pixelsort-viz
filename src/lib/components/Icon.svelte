<script lang="ts">
  import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Barcode from '@lucide/svelte/icons/barcode';
  import Check from '@lucide/svelte/icons/check';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import CircleQuestionMark from '@lucide/svelte/icons/circle-question-mark';
  import Clock from '@lucide/svelte/icons/clock';
  import Code from '@lucide/svelte/icons/code';
  import Crosshair from '@lucide/svelte/icons/crosshair';
  import Eye from '@lucide/svelte/icons/eye';
  import EyeOff from '@lucide/svelte/icons/eye-off';
  import Grid2x2 from '@lucide/svelte/icons/grid-2x2';
  import Image from '@lucide/svelte/icons/image';
  import Info from '@lucide/svelte/icons/info';
  import KeyRound from '@lucide/svelte/icons/key-round';
  import Layers from '@lucide/svelte/icons/layers';
  import Lock from '@lucide/svelte/icons/lock';
  import MoveHorizontal from '@lucide/svelte/icons/move-horizontal';
  import Pause from '@lucide/svelte/icons/pause';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Play from '@lucide/svelte/icons/play';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import Shuffle from '@lucide/svelte/icons/shuffle';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import StepForward from '@lucide/svelte/icons/step-forward';
  import Trash from '@lucide/svelte/icons/trash';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import Upload from '@lucide/svelte/icons/upload';
  import X from '@lucide/svelte/icons/x';

  export type IconName =
    | 'upload'
    | 'play'
    | 'pause'
    | 'step'
    | 'reset'
    | 'shuffle'
    | 'image'
    | 'lock'
    | 'info'
    | 'x'
    | 'check'
    | 'alert'
    | 'chevron-down'
    | 'arrow-right'
    | 'grid'
    | 'layers'
    | 'sparkles'
    | 'eye'
    | 'eye-off'
    | 'help'
    | 'trash'
    | 'clock'
    | 'swap'
    | 'compare'
    | 'write'
    | 'pivot'
    | 'sorted'
    | 'read'
    | 'pass'
    | 'range'
    | 'key'
    | 'barcode'
    | 'code';

  const iconMap = {
    upload: Upload,
    play: Play,
    pause: Pause,
    step: StepForward,
    reset: RotateCcw,
    shuffle: Shuffle,
    image: Image,
    lock: Lock,
    info: Info,
    x: X,
    check: Check,
    alert: TriangleAlert,
    'chevron-down': ChevronDown,
    'arrow-right': ArrowRight,
    grid: Grid2x2,
    layers: Layers,
    sparkles: Sparkles,
    eye: Eye,
    'eye-off': EyeOff,
    help: CircleQuestionMark,
    trash: Trash,
    clock: Clock,
    swap: ArrowLeftRight,
    compare: MoveHorizontal,
    write: Pencil,
    pivot: Crosshair,
    sorted: CircleCheck,
    read: Eye,
    pass: ArrowRight,
    range: MoveHorizontal,
    key: KeyRound,
    barcode: Barcode,
    code: Code,
  } as const;

  let {
    name,
    size = 18,
    strokeWidth = 1.8,
    className = '',
  }: {
    name: IconName;
    size?: number;
    strokeWidth?: number;
    className?: string;
  } = $props();

  let CurrentIcon = $derived(iconMap[name]);
</script>

<CurrentIcon
  size={size}
  strokeWidth={strokeWidth}
  class={className}
  aria-hidden="true"
  focusable="false"
/>
