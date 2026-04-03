import React from 'react';
import {
	AbsoluteFill,
	Sequence,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

// ─── Color palette ───────────────────────────────────────────────────────────
const BG = '#0f1923';
const BG_CARD = '#1a2535';
const CYAN = '#00d4aa';
const ORANGE = '#ff6b35';
const YELLOW = '#ffd60a';
const PURPLE = '#a78bfa';
const GREEN = '#34d399';
const WHITE = '#f0f6fc';
const MUTED = '#8b949e';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const useFadeIn = (delay = 0) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({
		frame: Math.max(0, frame - delay),
		fps,
		config: {damping: 22, stiffness: 70},
	});
};

const useSlideIn = (delay = 0) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = spring({
		frame: Math.max(0, frame - delay),
		fps,
		config: {damping: 20, stiffness: 65},
	});
	return {
		opacity: p,
		translateX: interpolate(p, [0, 1], [-50, 0]),
		translateY: interpolate(p, [0, 1], [40, 0]),
	};
};

// ─── Trochoidal path visual ───────────────────────────────────────────────────

const TrochoidPath: React.FC<{progress: number}> = ({progress}) => {
	const W = 700;
	const H = 260;
	const r = 58; // tool radius (visual)
	const ae = 78; // radial engagement (step per loop)
	const loops = 7;
	const steps = 320;
	const startX = r + 12;

	// Generate curtate-cycloid path (trochoidal tool center path)
	const pts: Array<[number, number]> = [];
	for (let i = 0; i <= steps; i++) {
		const t = (i / steps) * loops * Math.PI * 2;
		const x = startX + (ae / (Math.PI * 2)) * t - r * Math.sin(t);
		const y = H / 2 - r * Math.cos(t);
		pts.push([x, y]);
	}

	const visible = Math.min(steps, Math.floor(progress * steps));
	const visiblePts = pts.slice(0, visible + 1);

	const toStr = (arr: Array<[number, number]>) =>
		arr.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

	const last = visiblePts[visiblePts.length - 1] ?? pts[0];

	return (
		<svg
			width={W + r * 2 + 24}
			height={H + 20}
			style={{display: 'block', overflow: 'visible'}}
		>
			{/* Slot walls */}
			<rect
				x={r + 8}
				y={H / 2 - r - 6}
				width={W + r * 2 + 10}
				height={r * 2 + 12}
				rx={5}
				fill={BG_CARD}
			/>
			<line
				x1={r + 8}
				y1={H / 2 - r - 6}
				x2={W + r * 2 + 18}
				y2={H / 2 - r - 6}
				stroke={MUTED}
				strokeWidth={1.5}
				strokeDasharray="6 4"
				opacity={0.4}
			/>
			<line
				x1={r + 8}
				y1={H / 2 + r + 6}
				x2={W + r * 2 + 18}
				y2={H / 2 + r + 6}
				stroke={MUTED}
				strokeWidth={1.5}
				strokeDasharray="6 4"
				opacity={0.4}
			/>
			{/* Ghost path */}
			<polyline
				points={toStr(pts)}
				fill="none"
				stroke="#2d3d50"
				strokeWidth={1.5}
			/>
			{/* Animated path */}
			{visiblePts.length > 1 && (
				<polyline
					points={toStr(visiblePts)}
					fill="none"
					stroke={CYAN}
					strokeWidth={3}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			)}
			{/* Tool circle at current position */}
			<circle
				cx={last[0]}
				cy={last[1]}
				r={r}
				fill={`${ORANGE}18`}
				stroke={ORANGE}
				strokeWidth={2.5}
			/>
			{/* Tool center */}
			<circle cx={last[0]} cy={last[1]} r={5} fill={ORANGE} />
			{/* ae annotation */}
			{progress > 0.3 && (
				<>
					<line
						x1={startX}
						y1={H / 2 - r + 2}
						x2={startX + ae}
						y2={H / 2 - r + 2}
						stroke={YELLOW}
						strokeWidth={1.5}
						markerEnd="url(#arrow)"
					/>
					<text
						x={startX + ae / 2}
						y={H / 2 - r - 14}
						fill={YELLOW}
						fontSize={14}
						textAnchor="middle"
						fontFamily="sans-serif"
					>
						ae (radial engagement)
					</text>
				</>
			)}
		</svg>
	);
};

// ─── Comparison bars ──────────────────────────────────────────────────────────

const CompBar: React.FC<{
	label: string;
	value: number; // 0–1
	maxLabel: string;
	color: string;
	delay?: number;
}> = ({label, value, maxLabel, color, delay = 0}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = spring({
		frame: Math.max(0, frame - delay),
		fps,
		config: {damping: 20, stiffness: 60},
	});
	const barW = interpolate(p, [0, 1], [0, value * 420]);
	return (
		<div style={{marginBottom: 24}}>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					fontSize: 20,
					color: WHITE,
					marginBottom: 8,
					fontFamily: 'sans-serif',
				}}
			>
				<span>{label}</span>
				<span style={{color, fontWeight: 700}}>{maxLabel}</span>
			</div>
			<div
				style={{
					height: 38,
					background: BG,
					borderRadius: 8,
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						width: barW,
						height: '100%',
						background: `linear-gradient(90deg, ${color}aa, ${color})`,
						borderRadius: 8,
					}}
				/>
			</div>
		</div>
	);
};

const ComparisonBars: React.FC<{
	title: string;
	conventional: {value: number; label: string};
	trochoidal: {value: number; label: string};
	barColor?: string;
}> = ({title, conventional, trochoidal, barColor = CYAN}) => (
	<div
		style={{
			background: BG_CARD,
			borderRadius: 16,
			padding: '32px 36px',
			minWidth: 460,
			fontFamily: 'sans-serif',
		}}
	>
		<div
			style={{
				fontSize: 15,
				letterSpacing: '3px',
				textTransform: 'uppercase',
				color: MUTED,
				marginBottom: 28,
			}}
		>
			{title}
		</div>
		<CompBar
			label="Conventional"
			value={conventional.value}
			maxLabel={conventional.label}
			color={ORANGE}
			delay={10}
		/>
		<CompBar
			label="Trochoidal"
			value={trochoidal.value}
			maxLabel={trochoidal.label}
			color={barColor}
			delay={25}
		/>
	</div>
);

// ─── Scene 1: Title ───────────────────────────────────────────────────────────

const TitleScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const titleP = spring({frame, fps, config: {damping: 24, stiffness: 55}});
	const subtitleOpacity = interpolate(frame, [25, 55], [0, 1], {
		extrapolateRight: 'clamp',
	});
	const lineW = interpolate(titleP, [0, 1], [0, 640]);

	return (
		<AbsoluteFill
			style={{
				background: `linear-gradient(135deg, ${BG} 0%, #0d1f32 100%)`,
				justifyContent: 'center',
				alignItems: 'center',
				flexDirection: 'column',
				fontFamily: 'sans-serif',
			}}
		>
			{/* decorative gradient line */}
			<div
				style={{
					width: lineW,
					height: 5,
					background: `linear-gradient(90deg, ${CYAN}, ${ORANGE})`,
					borderRadius: 3,
					marginBottom: 36,
				}}
			/>
			<div
				style={{
					fontSize: 100,
					fontWeight: 900,
					color: WHITE,
					letterSpacing: '-3px',
					transform: `scale(${interpolate(titleP, [0, 1], [0.75, 1])})`,
					opacity: titleP,
					textAlign: 'center',
					lineHeight: 1,
				}}
			>
				TROCHOIDAL
			</div>
			<div
				style={{
					fontSize: 100,
					fontWeight: 900,
					color: CYAN,
					letterSpacing: '-3px',
					transform: `scale(${interpolate(titleP, [0, 1], [0.75, 1])})`,
					opacity: titleP,
					textAlign: 'center',
					lineHeight: 1,
					marginBottom: 28,
				}}
			>
				MILLING
			</div>
			<div
				style={{
					opacity: subtitleOpacity,
					fontSize: 26,
					color: MUTED,
					letterSpacing: '5px',
					textTransform: 'uppercase',
					textAlign: 'center',
				}}
			>
				High-Performance Machining Explained
			</div>
		</AbsoluteFill>
	);
};

// ─── Scene 2: What is it? ─────────────────────────────────────────────────────

const WhatIsItScene: React.FC = () => {
	const frame = useCurrentFrame();
	const header = useFadeIn(0);
	const pathProgress = interpolate(frame, [20, 150], [0, 1], {
		extrapolateRight: 'clamp',
	});
	const descSlide = useSlideIn(60);

	return (
		<AbsoluteFill
			style={{
				background: BG,
				fontFamily: 'sans-serif',
				padding: '56px 80px',
				flexDirection: 'column',
				gap: 24,
			}}
		>
			<div
				style={{
					fontSize: 17,
					color: CYAN,
					letterSpacing: '4px',
					textTransform: 'uppercase',
					opacity: header,
				}}
			>
				What is it?
			</div>
			<div
				style={{
					fontSize: 54,
					fontWeight: 800,
					color: WHITE,
					lineHeight: 1.15,
					opacity: header,
				}}
			>
				A Circular Tool Path{' '}
				<span style={{color: CYAN}}>Along the Cut</span>
			</div>

			<div style={{display: 'flex', justifyContent: 'center', marginTop: 8}}>
				<TrochoidPath progress={pathProgress} />
			</div>

			<div
				style={{
					opacity: descSlide.opacity,
					transform: `translateY(${descSlide.translateY}px)`,
					fontSize: 22,
					color: MUTED,
					lineHeight: 1.6,
					maxWidth: 860,
				}}
			>
				Instead of plunging straight through material, the tool follows a looping
				cyclical path — maintaining a small, constant radial engagement (ae) while
				advancing at high feed rates.
			</div>
		</AbsoluteFill>
	);
};

// ─── Generic benefit scene ────────────────────────────────────────────────────

const BenefitScene: React.FC<{
	number: string;
	title: React.ReactNode;
	description: string;
	detail: string;
	accentColor: string;
	visual: React.ReactNode;
}> = ({number, title, description, detail, accentColor, visual}) => {
	const header = useFadeIn(0);
	const content = useSlideIn(20);
	const barW = interpolate(header, [0, 1], [0, 220]);

	return (
		<AbsoluteFill
			style={{
				background: BG,
				fontFamily: 'sans-serif',
				padding: '56px 80px',
				flexDirection: 'column',
				gap: 20,
			}}
		>
			<div
				style={{
					width: barW,
					height: 4,
					background: accentColor,
					borderRadius: 2,
				}}
			/>
			<div
				style={{
					fontSize: 16,
					color: accentColor,
					letterSpacing: '4px',
					textTransform: 'uppercase',
					opacity: header,
				}}
			>
				Benefit {number}
			</div>
			<div
				style={{
					fontSize: 58,
					fontWeight: 800,
					color: WHITE,
					lineHeight: 1.1,
					opacity: header,
					transform: `translateX(${interpolate(header, [0, 1], [-30, 0])}px)`,
				}}
			>
				{title}
			</div>

			<div
				style={{
					flex: 1,
					display: 'flex',
					gap: 56,
					alignItems: 'center',
					opacity: content.opacity,
					transform: `translateY(${content.translateY}px)`,
					marginTop: 8,
				}}
			>
				<div style={{flex: 1}}>
					<div
						style={{
							fontSize: 24,
							color: WHITE,
							lineHeight: 1.55,
							marginBottom: 24,
						}}
					>
						{description}
					</div>
					<div
						style={{
							fontSize: 19,
							color: MUTED,
							lineHeight: 1.65,
							borderLeft: `4px solid ${accentColor}`,
							paddingLeft: 20,
						}}
					>
						{detail}
					</div>
				</div>
				<div>{visual}</div>
			</div>
		</AbsoluteFill>
	);
};

// ─── Scene 6: Summary ─────────────────────────────────────────────────────────

const SummaryScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const header = useFadeIn(0);

	const benefits = [
		{text: 'Reduced Heat & Thermal Wear', color: CYAN},
		{text: 'Higher Feed Rates & Material Removal', color: ORANGE},
		{text: 'Up to 5x Longer Tool Life', color: YELLOW},
		{text: 'Optimal Chip Evacuation', color: PURPLE},
		{text: 'Ideal for Hard & Exotic Materials', color: GREEN},
	];

	return (
		<AbsoluteFill
			style={{
				background: `linear-gradient(135deg, ${BG} 0%, #0d1f32 100%)`,
				fontFamily: 'sans-serif',
				padding: '56px 80px',
				flexDirection: 'column',
				gap: 28,
			}}
		>
			<div
				style={{
					fontSize: 17,
					color: CYAN,
					letterSpacing: '4px',
					textTransform: 'uppercase',
					opacity: header,
				}}
			>
				Summary
			</div>
			<div
				style={{
					fontSize: 62,
					fontWeight: 800,
					color: WHITE,
					opacity: header,
					marginBottom: 8,
				}}
			>
				Why Choose{' '}
				<span style={{color: CYAN}}>Trochoidal?</span>
			</div>

			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: 18,
					flex: 1,
					justifyContent: 'center',
				}}
			>
				{benefits.map((b, i) => {
					const p = spring({
						frame: Math.max(0, frame - i * 14 - 12),
						fps,
						config: {damping: 20, stiffness: 80},
					});
					return (
						<div
							key={b.text}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 20,
								opacity: p,
								transform: `translateX(${interpolate(p, [0, 1], [-60, 0])}px)`,
								background: BG_CARD,
								borderRadius: 12,
								padding: '18px 28px',
								borderLeft: `5px solid ${b.color}`,
							}}
						>
							<div
								style={{
									width: 14,
									height: 14,
									borderRadius: '50%',
									background: b.color,
									flexShrink: 0,
								}}
							/>
							<span
								style={{fontSize: 25, color: WHITE, fontWeight: 600}}
							>
								{b.text}
							</span>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

// ─── Root composition ─────────────────────────────────────────────────────────

export const TrochoidalMilling: React.FC = () => {
	return (
		<AbsoluteFill style={{background: BG}}>
			{/* Scene 1 – Title (0–90) */}
			<Sequence from={0} durationInFrames={90}>
				<TitleScene />
			</Sequence>

			{/* Scene 2 – What is it? (90–270) */}
			<Sequence from={90} durationInFrames={180}>
				<WhatIsItScene />
			</Sequence>

			{/* Scene 3 – Reduced Heat (270–450) */}
			<Sequence from={270} durationInFrames={180}>
				<BenefitScene
					number="01"
					title={
						<>
							Reduced <span style={{color: CYAN}}>Heat &amp; Wear</span>
						</>
					}
					description="Trochoidal milling dramatically lowers cutting temperatures by reducing how long the tool contacts material per revolution."
					detail="The tool continuously enters and exits the slot — 'breathing' through the cut — preventing the heat buildup that destroys cutting edges."
					accentColor={CYAN}
					visual={
						<ComparisonBars
							title="Cutting temperature"
							conventional={{value: 0.9, label: '720 °C'}}
							trochoidal={{value: 0.35, label: '280 °C'}}
							barColor={CYAN}
						/>
					}
				/>
			</Sequence>

			{/* Scene 4 – Higher Feed Rates (450–630) */}
			<Sequence from={450} durationInFrames={180}>
				<BenefitScene
					number="02"
					title={
						<>
							Higher <span style={{color: ORANGE}}>Feed Rates</span>
						</>
					}
					description="Because radial engagement (ae) is kept small and constant, the tool can run at dramatically higher feed rates without overloading."
					detail="Typical trochoidal strategies achieve 3–5× higher feed rates vs. conventional slotting, reducing cycle time significantly."
					accentColor={ORANGE}
					visual={
						<ComparisonBars
							title="Feed rate"
							conventional={{value: 0.24, label: '500 mm/min'}}
							trochoidal={{value: 0.86, label: '1800 mm/min'}}
							barColor={ORANGE}
						/>
					}
				/>
			</Sequence>

			{/* Scene 5 – Longer Tool Life (630–810) */}
			<Sequence from={630} durationInFrames={180}>
				<BenefitScene
					number="03"
					title={
						<>
							Longer <span style={{color: YELLOW}}>Tool Life</span>
						</>
					}
					description="Consistent chip load and lower temperatures translate directly into dramatically extended end-mill life."
					detail="Studies show trochoidal milling extends tool life by 3–5× compared to conventional full-slot milling in the same material and conditions."
					accentColor={YELLOW}
					visual={
						<ComparisonBars
							title="Tool life (passes before wear)"
							conventional={{value: 0.2, label: '12 passes'}}
							trochoidal={{value: 0.88, label: '58 passes'}}
							barColor={YELLOW}
						/>
					}
				/>
			</Sequence>

			{/* Scene 6 – Summary (810–960) */}
			<Sequence from={810} durationInFrames={150}>
				<SummaryScene />
			</Sequence>
		</AbsoluteFill>
	);
};
