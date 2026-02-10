"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import FlipClock from "@/components/FlipClock"
import Link from "next/link"

type Step = "intro" | "question" | "countdown" | "accepted"

export default function Home() {
	const [step, setStep] = useState<Step>("intro")
	const [theme, setTheme] = useState<"light" | "dark">("light")

	// Feb 14, 2026 (month is 0-indexed -> 1 = Feb)
	const target = useMemo(() => new Date(2026, 1, 14, 0, 0, 0), [])

	// DEV preview: add ?unlock=1 to your URL to preview Feb 14 unlock state
	const [forceUnlock, setForceUnlock] = useState(false)

	// Unlock state must be reactive
	const [isUnlocked, setIsUnlocked] = useState(() => new Date() >= target)
	const unlocked = forceUnlock || isUnlocked

	// Track transitions for unlock animation
	const prevUnlockedRef = useRef(unlocked)

	// Unlock animation pulse
	const [unlockPulse, setUnlockPulse] = useState(false)

	// Change this to your real plan:
	const REAL_LOCATION = "Victors Hale, Manchester"

	// Middle countdown (after YES)
	const [secondsLeft, setSecondsLeft] = useState(5)

	// Mobile-first "No" behaviour
	const [noCount, setNoCount] = useState(0)
	const [noText, setNoText] = useState("No 🙄")
	const [noJiggle, setNoJiggle] = useState(false)
	const [noNudge, setNoNudge] = useState<{ x: number; y: number }>({
		x: 0,
		y: 0,
	})
	const nudgeTimer = useRef<number | null>(null)

	const noLines = useMemo(
		() => [
			"No 🙄",
			"Bro 🤨",
			"Be serious",
			"Get a FAT grip.",
			"That’s not an option",
			"Stop playing",
			"Ok you’re doing too much",
			"Behave.",
			"calm.",
			"Minor your clapped anyways",
		],
		[],
	)

	const yesScale = Math.min(1 + noCount * 0.035, 1.18)
	const noScale = Math.max(1 - noCount * 0.08, 0.55)

	function prefersReducedMotion() {
		if (typeof window === "undefined") return false
		return (
			window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
		)
	}

	// Haptics
	function haptic(ms = 12) {
		if (prefersReducedMotion()) return
		if (typeof navigator !== "undefined" && "vibrate" in navigator) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			;(navigator as any).vibrate(ms)
		}
	}

	function bumpNo() {
		haptic(10)

		const nextCount = noCount + 1
		setNoCount(nextCount)
		setNoText(noLines[Math.min(nextCount, noLines.length - 1)])

		setNoJiggle(true)
		window.setTimeout(() => setNoJiggle(false), 220)

		const direction = nextCount % 2 === 0 ? 1 : -1
		const x = direction * (10 + (nextCount % 3) * 4)
		const y = (nextCount % 2) * 2

		setNoNudge({ x, y })

		if (nudgeTimer.current) window.clearTimeout(nudgeTimer.current)
		nudgeTimer.current = window.setTimeout(
			() => setNoNudge({ x: 0, y: 0 }),
			520,
		)
	}

	// ---------------------------
	// DEV: read ?unlock=1
	// ---------------------------
	useEffect(() => {
		if (typeof window === "undefined") return
		const params = new URLSearchParams(window.location.search)
		setForceUnlock(params.get("unlock") === "1")
	}, [])

	// ---------------------------
	// Theme toggle (light/dark)
	// ---------------------------
	useEffect(() => {
		if (typeof window === "undefined") return
		const stored = window.localStorage.getItem("theme")
		if (stored === "light" || stored === "dark") {
			setTheme(stored)
			return
		}
		const prefersDark = window.matchMedia?.(
			"(prefers-color-scheme: dark)",
		)?.matches
		setTheme(prefersDark ? "dark" : "light")
	}, [])

	useEffect(() => {
		if (typeof document === "undefined") return
		const root = document.documentElement
		if (theme === "dark") root.classList.add("dark")
		else root.classList.remove("dark")
		window.localStorage.setItem("theme", theme)
	}, [theme])

	// ---------------------------
	// Confetti helpers
	// ---------------------------
	const rand = (min: number, max: number) =>
		Math.floor(Math.random() * (max - min + 1)) + min

	const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

	// Explosion confetti (random palettes + random number of shots)
	function confettiBurst() {
		if (typeof window === "undefined") return
		if (prefersReducedMotion()) return

		const w = window.innerWidth
		const h = window.innerHeight

		const palettes: string[][] = [
			["#e0f2fe", "#bae6fd", "#7dd3fc", "#60a5fa", "#38bdf8"], // icy blue
			["#ede9fe", "#ddd6fe", "#c4b5fd", "#a78bfa", "#8b5cf6"], // lavender
			["#ecfeff", "#cffafe", "#99f6e4", "#5eead4", "#2dd4bf"], // mint/teal
			["#fefce8", "#fef9c3", "#fef08a", "#fde047", "#facc15"], // champagne
			["#fff7ed", "#fed7aa", "#fdba74", "#fb923c", "#f97316"], // sunset
		]

		const colors = pick(palettes)

		function shot({
			count,
			spreadPx,
			minRise,
			maxRise,
			minDur,
			maxDur,
		}: {
			count: number
			spreadPx: number
			minRise: number
			maxRise: number
			minDur: number
			maxDur: number
		}) {
			for (let i = 0; i < count; i++) {
				const p = document.createElement("div")

				const startX = Math.random() * w
				const startY = h + 20 + Math.random() * 40

				p.style.position = "fixed"
				p.style.left = `${startX}px`
				p.style.top = `${startY}px`
				p.style.width = `${6 + Math.random() * 8}px`
				p.style.height = `${8 + Math.random() * 14}px`
				p.style.background = colors[Math.floor(Math.random() * colors.length)]
				p.style.opacity = String(0.85 + Math.random() * 0.15)
				p.style.borderRadius = "2px"
				p.style.zIndex = "9999"
				p.style.pointerEvents = "none"
				p.style.transition = "opacity 900ms ease-out"

				document.body.appendChild(p)

				const drift = -spreadPx + Math.random() * (spreadPx * 2)
				const rise = minRise + Math.random() * (maxRise - minRise)
				const rotate = -900 + Math.random() * 1800
				const duration = minDur + Math.random() * (maxDur - minDur)

				p.animate(
					[
						{ transform: "translate3d(0,0,0) rotate(0deg)" },
						{
							transform: `translate3d(${drift}px, -${rise}px, 0) rotate(${rotate}deg)`,
						},
					],
					{ duration, easing: "cubic-bezier(.12,.85,.25,1)" },
				)

				window.setTimeout(
					() => {
						p.style.opacity = "0"
					},
					Math.max(0, duration - 850),
				)

				window.setTimeout(() => p.remove(), duration + 150)
			}
		}

		const numberOfShots = rand(2, 4)

		for (let i = 0; i < numberOfShots; i++) {
			const delay = i === 0 ? 0 : rand(250, 900)

			window.setTimeout(() => {
				shot({
					count: rand(80, 170),
					spreadPx: Math.max(320, w * (rand(35, 60) / 100)),
					minRise: Math.max(520, h * (rand(55, 75) / 100)),
					maxRise: Math.max(850, h * (rand(90, 120) / 100)),
					minDur: rand(1400, 1800),
					maxDur: rand(2200, 3000),
				})
			}, delay)
		}
	}

	// Ambient confetti (gentle, ongoing)
	function confettiAmbient() {
		if (typeof window === "undefined") return
		if (prefersReducedMotion()) return

		const w = window.innerWidth
		const h = window.innerHeight

		const palettes: string[][] = [
			["#e0f2fe", "#bae6fd", "#7dd3fc"], // icy blue
			["#ede9fe", "#ddd6fe", "#c4b5fd"], // lavender
			["#ecfeff", "#cffafe", "#99f6e4"], // mint
			["#fff7ed", "#fed7aa", "#fdba74"], // sunset
			["#fce7f3", "#fbcfe8", "#f9a8d4"], // soft pink
		]

		const colors = pick(palettes)
		const count = rand(5, 9)

		for (let i = 0; i < count; i++) {
			const p = document.createElement("div")

			p.style.position = "fixed"
			p.style.left = `${Math.random() * w}px`
			p.style.top = `${h + 10}px`
			p.style.width = `${4 + Math.random() * 5}px`
			p.style.height = `${6 + Math.random() * 8}px`
			p.style.background = colors[rand(0, colors.length - 1)]
			p.style.opacity = String(0.45 + Math.random() * 0.25)
			p.style.borderRadius = "2px"
			p.style.zIndex = "9999"
			p.style.pointerEvents = "none"
			p.style.transition = "opacity 1200ms ease-out"

			document.body.appendChild(p)

			const drift = -120 + Math.random() * 240
			const rise = 260 + Math.random() * 300
			const rotate = -360 + Math.random() * 720
			const duration = 2600 + Math.random() * 1600

			p.animate(
				[
					{ transform: "translate3d(0,0,0) rotate(0deg)" },
					{
						transform: `translate3d(${drift}px, -${rise}px, 0) rotate(${rotate}deg)`,
					},
				],
				{ duration, easing: "cubic-bezier(.2,.9,.25,1)" },
			)

			window.setTimeout(
				() => {
					p.style.opacity = "0"
				},
				Math.max(0, duration - 1200),
			)

			window.setTimeout(() => p.remove(), duration + 200)
		}
	}

	function heartsAmbient() {
		if (typeof window === "undefined") return
		if (prefersReducedMotion()) return

		const w = window.innerWidth
		const h = window.innerHeight

		// soft palettes (same idea as confettiAmbient)
		const palettes: string[][] = [
			["#fb7185", "#fda4af", "#fecdd3"], // rose
			["#f472b6", "#f9a8d4", "#fbcfe8"], // pink
			["#fca5a5", "#fecaca", "#fee2e2"], // red blush
			["#60a5fa", "#93c5fd", "#bfdbfe"], // blue
			["#a78bfa", "#c4b5fd", "#ddd6fe"], // purple
		]

		const colors = pick(palettes)
		const count = rand(3, 6) // fewer than confetti (hearts read bigger)

		for (let i = 0; i < count; i++) {
			const el = document.createElement("div")

			// Heart glyph (simple + clean)
			el.textContent = "❤"

			el.style.position = "fixed"
			el.style.left = `${Math.random() * w}px`
			el.style.top = `${h + 10}px`
			el.style.fontSize = `${14 + Math.random() * 14}px` // 14–28px
			el.style.lineHeight = "1"
			el.style.color = colors[rand(0, colors.length - 1)]
			el.style.opacity = String(0.3 + Math.random() * 0.45)
			el.style.zIndex = "9999"
			el.style.pointerEvents = "none"
			el.style.userSelect = "none"
			el.style.filter = "drop-shadow(0 1px 0 rgba(0,0,0,0.08))"
			el.style.transition = "opacity 1200ms ease-out"

			document.body.appendChild(el)

			// Motion: float up with gentle side-to-side drift + slight rotation
			const drift = -90 + Math.random() * 180
			const rise = 260 + Math.random() * 380
			const rotate = -25 + Math.random() * 50
			const duration = 3200 + Math.random() * 1800

			el.animate(
				[
					{ transform: "translate3d(0,0,0) rotate(0deg) scale(1)" },
					{
						transform: `translate3d(${drift}px, -${rise}px, 0) rotate(${rotate}deg) scale(${0.9 + Math.random() * 0.35})`,
					},
				],
				{ duration, easing: "cubic-bezier(.2,.9,.25,1)" },
			)

			// Fade out toward the end
			window.setTimeout(
				() => {
					el.style.opacity = "0"
				},
				Math.max(0, duration - 1200),
			)

			window.setTimeout(() => el.remove(), duration + 200)
		}
	}

	// ---------------------------
	// YES flow + countdown screen
	// ---------------------------
	function startYesFlow() {
		haptic(25)
		confettiBurst()
		setSecondsLeft(5)
		setStep("countdown")
	}

	// Countdown: stable interval; transitions to accepted
	useEffect(() => {
		if (step !== "countdown") return

		const id = window.setInterval(() => {
			setSecondsLeft((s) => {
				if (s <= 1) {
					window.clearInterval(id)
					setStep("accepted")
					return 0
				}
				return s - 1
			})
		}, 1000)

		return () => window.clearInterval(id)
	}, [step])

	// Ambient confetti loop (countdown + accepted), calmer frequency
	useEffect(() => {
		if (step !== "countdown" && step !== "accepted") return

		let timeoutId: number

		const loop = () => {
			heartsAmbient()
			timeoutId = window.setTimeout(loop, rand(2600, 4200))
		}

		loop()

		return () => window.clearTimeout(timeoutId)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [step])

	// ---------------------------
	// Unlock check + unlock animation
	// ---------------------------
	useEffect(() => {
		const id = window.setInterval(() => {
			setIsUnlocked(new Date() >= target)
		}, 3000)

		return () => window.clearInterval(id)
	}, [target])

	useEffect(() => {
		// Trigger on false -> true
		if (!prevUnlockedRef.current && unlocked) {
			haptic(40)
			setUnlockPulse(true)
			confettiBurst()

			const t = window.setTimeout(() => setUnlockPulse(false), 900)
			return () => window.clearTimeout(t)
		}

		prevUnlockedRef.current = unlocked
	}, [unlocked])

	function resetAll() {
		setStep("intro")
		setNoCount(0)
		setNoText("No 🙄")
		setNoNudge({ x: 0, y: 0 })
		setNoJiggle(false)
		setSecondsLeft(5)
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-white to-rose-50/10 px-4 font-sans text-slate-900 dark:text-zinc-100 dark:from-zinc-800 dark:to-zinc-900">
			<button
				type="button"
				onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
				className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200"
			>
				{theme === "dark" ? "Light mode" : "Dark mode"}
			</button>
			<div className="w-full max-w-md rounded-2xl bg-zinc-300/30 p-7 text-center text-slate-900 dark:bg-black dark:text-zinc-100">
				{step === "intro" && (
					<>
						<div className="mb-4 text-4xl">✨</div>

						<h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-zinc-100">
							You already know what&apos;s coming...
						</h1>

						<button
							onClick={() => setStep("question")}
							className="w-full rounded-xl bg-rose-400 px-6 py-4 text-base font-semibold text-white transition hover:bg-rose-500 active:scale-[0.98] dark:bg-rose-400 dark:text-white"
						>
							Continue
						</button>
					</>
				)}

				{step === "question" && (
					<>
						<h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-zinc-100">
							Will You
							<br />
							<span
								className="inline-block cursor-pointer font-extrabold"
								style={{
									backgroundImage:
										"linear-gradient(90deg, #fb7185, #fda4af, #fecdd3, #fb7185)",
									backgroundSize: "400% 100%",
									backgroundPosition: "0% 50%",
									WebkitBackgroundClip: "text",
									backgroundClip: "text",
									color: "transparent",
									animation: "gradientMove 4s linear infinite",
									willChange: "background-position",
								}}
								onClick={() => {
									haptic(12)
									heartsAmbient()
								}}
							>
								Janice Eugenia Amoaku
							</span>
							<br />
							be my Valentine?
						</h1>

						<div className="flex flex-col gap-3">
							<button
								onClick={startYesFlow}
								className="w-full rounded-xl bg-rose-400 px-6 py-4 text-base font-semibold text-white transition hover:bg-rose-500 active:scale-[0.98] dark:bg-rose-400 dark:text-white"
								style={{ transform: `scale(${yesScale})` }}
							>
								Yes 💖
							</button>

							<button
								onClick={bumpNo}
								className={[
									"w-full rounded-xl border border-slate-300 bg-white px-6 py-4 text-base font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300",
									"active:scale-[0.98] dark:hover:bg-zinc-900",
									noJiggle ? "animate-[wiggle_.22s_ease-in-out_1]" : "",
								].join(" ")}
								style={{
									transform: `translate3d(${noNudge.x}px, ${noNudge.y}px, 0) scale(${noScale})`,
									transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
									willChange: "transform",
								}}
							>
								{noText}
							</button>

							<Link
								href="https://www.bible.com/bible/111/EPH.5.28"
								target="_blank"
								className="mb-6 font-bold text-slate-500 dark:text-zinc-400"
							>
								Ephesians 5:28
							</Link>
						</div>
					</>
				)}

				{step === "countdown" && (
					<>
						<div className="mb-3 text-4xl">🎉</div>
						<h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-zinc-100">
							Locked in.
						</h2>
						<p className="mb-6 text-slate-600 dark:text-zinc-400">
							Preparing your confirmation…
						</p>

						<div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-slate-200 bg-white text-4xl font-extrabold text-slate-900 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100">
							{secondsLeft}
						</div>

						<p className="mt-4 text-sm text-slate-500 dark:text-zinc-500">
							(Do not refresh)
						</p>
					</>
				)}

				{step === "accepted" && (
					<>
						<div className="mb-2 text-4xl">🩷</div>
						<h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-zinc-100">
							VALENTINE&apos;S IS COMING
						</h2>
						<p className="mb-5 text-slate-600 font-semibold dark:text-zinc-400">
							Jay&Drew&apos;s First of many 🫶
						</p>

						<p className="mb-3 text-sm text-slate-600 dark:text-zinc-400">
							Countdown to Feb 14:
						</p>

						<FlipClock target={target} />

						<div
							className={[
								"mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-900/40",
								unlockPulse ? "scale-[1.02]" : "scale-100",
							].join(" ")}
						>
							<div className="mb-2 text-sm text-slate-500 dark:text-zinc-400">
								Location
							</div>

							{!unlocked ? (
								<div className="flex items-center justify-between">
									<div className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
										Locked 🔒
									</div>
									<div className="text-sm text-slate-500 dark:text-zinc-500">
										Unlocks Feb 14 @ 12:00am
									</div>
								</div>
							) : (
								<div className="space-y-2">
									<div className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
										📍{REAL_LOCATION}
									</div>
									<a
										className="inline-block text-sm font-semibold text-slate-900 underline underline-offset-4 dark:text-zinc-100"
										href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
											REAL_LOCATION,
										)}`}
										target="_blank"
										rel="noreferrer"
									>
										Open in Maps
									</a>

									<div className="pt-1 text-sm text-slate-600 dark:text-zinc-400">
										Today’s the day. Be ready 9pm. 🖤
									</div>
								</div>
							)}
						</div>

						<button
							onClick={resetAll}
							className="mt-6 w-full rounded-xl border border-slate-300 px-6 py-4 text-base font-semibold text-slate-700 transition active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-300"
						>
							Restart
						</button>

						{forceUnlock && (
							<p className="mt-3 text-xs text-slate-500 dark:text-zinc-500">
								Dev preview enabled: ?unlock=1
							</p>
						)}
						<p className="mt-3 text-xs text-slate-500 dark:text-zinc-500">
							Built with 💖 by Drew.
						</p>
					</>
				)}
			</div>

			<style
				jsx
				global
			>{`
				@keyframes wiggle {
					0% {
						transform: translateX(0);
					}
					25% {
						transform: translateX(-6px);
					}
					50% {
						transform: translateX(6px);
					}
					75% {
						transform: translateX(-4px);
					}
					100% {
						transform: translateX(0);
					}
				}
			`}</style>
		</div>
	)
}
