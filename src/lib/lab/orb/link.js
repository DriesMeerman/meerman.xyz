// Multi-window link. Every orb window with `link=on` announces where it sits on the screen over a
// BroadcastChannel (in-memory messaging between same-origin tabs, nothing is stored), and listens
// for the others. Windows that stop sending are dropped after a short timeout.

const CHANNEL = 'meerman-lab-orb';
const HEARTBEAT_MS = 400;
const TIMEOUT_MS = 2600;

/**
 * @typedef {object} LinkState
 * @property {number} cx orb centre, screen px
 * @property {number} cy
 * @property {number} ppu CSS px per world unit
 * @property {string} palette
 * @property {number} spin
 * @property {[number, number]} rot
 */

/**
 * @typedef {LinkState & { id: string, seen: number }} LinkPeer
 */

/**
 * @param {(peers: LinkPeer[]) => void} onPeers called whenever the set of peers or their positions change
 * @returns {{ publish: (state: LinkState) => void, close: () => void, get id(): string } | null}
 */
export function openLink(onPeers) {
  if (typeof BroadcastChannel === 'undefined') return null;
  const id = Math.random().toString(36).slice(2, 10);
  const channel = new BroadcastChannel(CHANNEL);
  /** @type {Map<string, LinkPeer>} */
  const peers = new Map();
  /** @type {LinkState | null} */
  let last = null;

  const emit = () => onPeers([...peers.values()]);

  channel.onmessage = (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object' || msg.id === id) return;
    if (msg.type === 'bye') {
      if (peers.delete(msg.id)) emit();
      return;
    }
    if (msg.type === 'hello' && last) {
      // a newcomer asked for positions, answer right away
      channel.postMessage({ type: 'state', id, ...last });
    }
    if (msg.type === 'state' || msg.type === 'hello') {
      if (typeof msg.cx !== 'number' || typeof msg.cy !== 'number') return;
      const peer = peers.get(msg.id);
      const next = { id: msg.id, cx: msg.cx, cy: msg.cy, ppu: msg.ppu, palette: String(msg.palette), spin: Number(msg.spin) || 0, rot: msg.rot ?? [0, 0], seen: Date.now() };
      peers.set(msg.id, next);
      if (!peer || peer.cx !== next.cx || peer.cy !== next.cy || peer.ppu !== next.ppu || peer.palette !== next.palette || peer.rot[0] !== next.rot[0] || peer.rot[1] !== next.rot[1]) emit();
    }
  };

  const reaper = setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const [key, peer] of peers) {
      if (now - peer.seen > TIMEOUT_MS) {
        peers.delete(key);
        changed = true;
      }
    }
    if (changed) emit();
    if (last) channel.postMessage({ type: 'state', id, ...last });
  }, HEARTBEAT_MS);

  const bye = () => channel.postMessage({ type: 'bye', id });
  window.addEventListener('pagehide', bye);
  window.addEventListener('beforeunload', bye);

  let announced = false;
  return {
    get id() {
      return id;
    },
    publish(state) {
      last = state;
      channel.postMessage({ type: announced ? 'state' : 'hello', id, ...state });
      announced = true;
    },
    close() {
      clearInterval(reaper);
      window.removeEventListener('pagehide', bye);
      window.removeEventListener('beforeunload', bye);
      bye();
      channel.close();
      peers.clear();
    }
  };
}
