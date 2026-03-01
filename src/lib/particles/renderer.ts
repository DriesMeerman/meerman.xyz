import type { EngineConfig, EngineSnapshot, Particle } from './types';

export function renderParticles(
	context: CanvasRenderingContext2D,
	snapshot: EngineSnapshot,
	color: string,
	config: EngineConfig
) {
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.clearRect(0, 0, snapshot.size.x * snapshot.pixelRatio, snapshot.size.y * snapshot.pixelRatio);
	context.setTransform(snapshot.pixelRatio, 0, 0, snapshot.pixelRatio, 0, 0);

	context.strokeStyle = color;
	context.fillStyle = color;
	context.lineWidth = config.lineWidth;

	for (let first = 0; first < snapshot.particles.length; first += 1) {
		const particle = snapshot.particles[first];

		for (let second = first + 1; second < snapshot.particles.length; second += 1) {
			const other = snapshot.particles[second];
			const distance = getDistance(particle, other);
			if (distance >= config.linkDistance) continue;

			context.globalAlpha = config.lineOpacity * (1 - distance / config.linkDistance);
			context.beginPath();
			context.moveTo(particle.position.x, particle.position.y);
			context.lineTo(other.position.x, other.position.y);
			context.stroke();
		}
	}

	for (const particle of snapshot.particles) {
		context.globalAlpha = config.opacity;
		context.beginPath();
		context.arc(particle.position.x, particle.position.y, particle.radius, 0, Math.PI * 2);
		context.fill();
	}

	context.globalAlpha = 1;
}

function getDistance(first: Particle, second: Particle) {
	return Math.hypot(first.position.x - second.position.x, first.position.y - second.position.y);
}
