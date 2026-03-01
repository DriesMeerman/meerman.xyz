export type Vec2 = {
	x: number;
	y: number;
};

export type Particle = {
	position: Vec2;
	drift: Vec2;
	impulse: Vec2;
	radius: number;
};

export type PointerState = {
	active: boolean;
	position: Vec2 | null;
};

export type EngineConfig = {
	baseCount: number;
	densityArea: number;
	speed: number;
	linkDistance: number;
	repulseDistance: number;
	repulseDuration: number;
	pushCount: number;
	minRadius: number;
	maxRadius: number;
	opacity: number;
	lineOpacity: number;
	lineWidth: number;
	maxPixelRatio: number;
};

export type EngineSnapshot = {
	particles: Particle[];
	size: Vec2;
	pixelRatio: number;
};

