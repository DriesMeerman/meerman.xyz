import type { EngineConfig, Particle, PointerState, Vec2 } from './types';

type InteractionHandlers = {
	onPointerMove: (position: Vec2) => void;
	onPointerLeave: () => void;
	onPointerDown: (position: Vec2) => void;
};

export function attachWindowInteractions(
	element: HTMLElement,
	handlers: InteractionHandlers
) {
	const toLocalPosition = (clientX: number, clientY: number): Vec2 => {
		const bounds = element.getBoundingClientRect();
		return {
			x: clientX - bounds.left,
			y: clientY - bounds.top
		};
	};

	const handlePointerMove = (event: PointerEvent) => {
		handlers.onPointerMove(toLocalPosition(event.clientX, event.clientY));
	};

	const handlePointerDown = (event: PointerEvent) => {
		if (event.button !== 0) return;
		handlers.onPointerDown(toLocalPosition(event.clientX, event.clientY));
	};

	const clearPointer = () => {
		handlers.onPointerLeave();
	};

	window.addEventListener('pointermove', handlePointerMove, { passive: true });
	window.addEventListener('pointerdown', handlePointerDown, { passive: true });
	window.addEventListener('blur', clearPointer);
	document.addEventListener('visibilitychange', clearPointer);

	return () => {
		window.removeEventListener('pointermove', handlePointerMove);
		window.removeEventListener('pointerdown', handlePointerDown);
		window.removeEventListener('blur', clearPointer);
		document.removeEventListener('visibilitychange', clearPointer);
	};
}

export function applyRepulseForce(
	particle: Particle,
	pointer: PointerState,
	config: EngineConfig,
	deltaSeconds: number
) {
	if (!pointer.active || !pointer.position) return;

	const dx = particle.position.x - pointer.position.x;
	const dy = particle.position.y - pointer.position.y;
	const distance = Math.hypot(dx, dy);

	if (distance === 0 || distance >= config.repulseDistance) return;

	const strength = (1 - distance / config.repulseDistance) * (config.repulseDistance / config.repulseDuration);
	particle.impulse.x += (dx / distance) * strength * deltaSeconds;
	particle.impulse.y += (dy / distance) * strength * deltaSeconds;
}
