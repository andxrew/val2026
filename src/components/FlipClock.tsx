"use client"

import { useEffect, useState } from "react"

type TimeLeft = {
	totalMs: number
	days: number
	hours: number
	minutes: number
	seconds: number
}

function pad2(n: number) {
	return String(n).padStart(2, "0")
}

function getTimeLeft(target: Date): TimeLeft {
	const now = new Date()
	const totalMs = Math.max(0, target.getTime() - now.getTime())

	const totalSeconds = Math.floor(totalMs / 1000)
	const days = Math.floor(totalSeconds / (60 * 60 * 24))
	const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60))
	const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
	const seconds = totalSeconds % 60

	return { totalMs, days, hours, minutes, seconds }
}

function SlideUnit({ label, value }: { label: string; value: string }) {
	const [prev, setPrev] = useState(value)
	const [animating, setAnimating] = useState(false)

	useEffect(() => {
		if (value === prev) return
		const start = window.setTimeout(() => {
			setAnimating(true)
		}, 0)

		const t = window.setTimeout(() => {
			setPrev(value)
			setAnimating(false)
		}, 320)

		return () => {
			window.clearTimeout(start)
			window.clearTimeout(t)
		}
	}, [value, prev])

	return (
		<div className="flex flex-col items-center">
			<div className="relative h-[84px] w-[78px] overflow-hidden rounded-[18px] bg-white dark:bg-zinc-950">
				{/* divider */}
				<div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-zinc-200 dark:bg-zinc-800" />

				<div className="absolute inset-0 overflow-hidden">
					{/* current value */}
					<div className="absolute inset-0 grid place-items-center text-[52px] font-extrabold leading-none text-zinc-900 dark:text-zinc-100">
						{value}
					</div>

					{/* slide animations */}
					{animating && (
						<div className="slide-out absolute inset-0 grid place-items-center text-[52px] font-extrabold leading-none text-zinc-900 dark:text-zinc-100">
							{prev}
						</div>
					)}
					{animating && (
						<div className="slide-in absolute inset-0 grid place-items-center text-[52px] font-extrabold leading-none text-zinc-900 dark:text-zinc-100">
							{value}
						</div>
					)}
				</div>
			</div>

			<div className="mt-3 text-[10px] font-semibold tracking-[0.22em] text-zinc-500 dark:text-zinc-500">
				{label.toUpperCase()}
			</div>
		</div>
	)
}

export default function FlipClock({ target }: { target: Date }) {
	const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(target))

	useEffect(() => {
		const tick = () => setTimeLeft(getTimeLeft(target))
		tick()
		const id = window.setInterval(tick, 1000)
		return () => window.clearInterval(id)
	}, [target])

	return (
		<div className="mx-auto grid w-full max-w-[320px] grid-cols-4 gap-2">
			<SlideUnit
				label="Days"
				value={String(timeLeft.days)}
			/>
			<SlideUnit
				label="Hours"
				value={pad2(timeLeft.hours)}
			/>
			<SlideUnit
				label="Minutes"
				value={pad2(timeLeft.minutes)}
			/>
			<SlideUnit
				label="Seconds"
				value={pad2(timeLeft.seconds)}
			/>
		</div>
	)
}
