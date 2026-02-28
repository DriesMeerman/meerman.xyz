import { applyRepulseForce } from './interactions';
import type { EngineConfig, EngineSnapshot, Particle, PointerState, Vec2 } from './types';

export const defaultEngineConfig: EngineConfig = {
	baseCount: 60,
	densityArea: 900_000,
	speed: 36,
	linkDistance: 300,
	repulseDistance: 120,
	repulseDuration: 0.4,
	pushCount: 4,
	minRadius: 1,
	maxRadius: 5,
	opacity: 0.5,
	lineOpacity: 0.4,
	lineWidth: 2,
	maxPixelRatio: 2
};

export class ParticleEngine {
	#config: EngineConfig;
	#particles: Particle[] = [];
	#size: Vec2 = { x: 0, y: 0 };
	#pixelRatio = 1;
	#pointer: PointerState = { active: false, position: null };

	constructor(config: Partial<EngineConfig> = {}) {
		this.#config = { ...defaultEngineConfig, ...config };
	}

	resize(width: number, height: number, pixelRatio = 1) {
		this.#size = { x: width, y: height };
		this.#pixelRatio = pixelRatio;
		this.#syncParticleCount();
	}

	update(deltaSeconds: number) {
		if (this.#size.x === 0 || this.#size.y === 0) return;

		for (const particle of this.#particles) {
			applyRepulseForce(particle, this.#pointer, this.#config, deltaSeconds);

			particle.position.x += (particle.drift.x + particle.impulse.x) * deltaSeconds;
			particle.position.y += (particle.drift.y + particle.impulse.y) * deltaSeconds;

			const damping = Math.pow(0.015, deltaSeconds / this.#config.repulseDuration);
			particle.impulse.x *= damping;
			particle.impulse.y *= damping;

			this.#wrapParticle(particle);
		}
	}

	addParticlesAt(position: Vec2, count = this.#config.pushCount) {
		for (let index = 0; index < count; index += 1) {
			this.#particles.push(this.#createParticle(position));
		}
	}

	setPointer(position: Vec2) {
		this.#pointer = { active: true, position };
	}

	clearPointer() {
		this.#pointer = { active: false, position: null };
	}

	getSnapshot(): EngineSnapshot {
		return {
			particles: this.#particles,
			size: this.#size,
			pixelRatio: this.#pixelRatio
		};
	}

	#createParticle(origin?: Vec2): Particle {
		const position = origin
			? {
					x: origin.x + randomBetween(-24, 24),
					y: origin.y + randomBetween(-24, 24)
				}
			: {
					x: Math.random() * this.#size.x,
					y: Math.random() * this.#size.y
				};

		const angle = Math.random() * Math.PI * 2;
		const speed = this.#config.speed * randomBetween(0.65, 1.1);

		return {
			position,
			drift: {
				x: Math.cos(angle) * speed,
				y: Math.sin(angle) * speed
			},
			impulse: { x: 0, y: 0 },
			radius: randomBetween(this.#config.minRadius, this.#config.maxRadius)
		};
	}

	#syncParticleCount() {
		const targetCount = clamp(
			Math.round((this.#size.x * this.#size.y * this.#config.baseCount) / this.#config.densityArea),
			18,
			120
		);

		while (this.#particles.length < targetCount) {
			this.#particles.push(this.#createParticle());
		}

		if (this.#particles.length > targetCount) {
			this.#particles.length = targetCount;
		}

		for (const particle of this.#particles) {
			particle.position.x = wrap(particle.position.x, this.#size.x);
			particle.position.y = wrap(particle.position.y, this.#size.y);
		}
	}

	#wrapParticle(particle: Particle) {
		particle.position.x = wrap(particle.position.x, this.#size.x);
		particle.position.y = wrap(particle.position.y, this.#size.y);
	}
}

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function randomBetween(min: number, max: number) {
	return min + Math.random() * (max - min);
}

function wrap(value: number, max: number) {
	if (max <= 0) return 0;
	if (value < 0) return max + (value % max);
	if (value > max) return value % max;
	return value;
}
