;(function () {
    const SETTINGS_KEY = 'spicetify_visualizer_settings'
    let settings = {
        mode: 'bars', // o "waves"
    }

    try {
        const stored = localStorage.getItem(SETTINGS_KEY)
        if (stored) settings = JSON.parse(stored)
    } catch {}

    async function waitForElement(selector) {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const el = document.querySelector(selector)
                if (el) {
                    clearInterval(interval)
                    resolve(el)
                }
            }, 300)
        })
    }

    async function getCoverColor() {
        try {
            const img = document.querySelector('.main-nowPlayingWidget-coverArt-image img')
            if (!img) return 'lime'

            const cover = new Image()
            cover.crossOrigin = 'Anonymous'
            cover.src = img.src

            await new Promise((res) => (cover.onload = res))

            const tempCanvas = document.createElement('canvas')
            const ctx = tempCanvas.getContext('2d')
            tempCanvas.width = 10
            tempCanvas.height = 10
            ctx.drawImage(cover, 0, 0, 10, 10)

            const data = ctx.getImageData(0, 0, 10, 10).data
            let r = 0,
                g = 0,
                b = 0
            for (let i = 0; i < data.length; i += 4) {
                r += data[i]
                g += data[i + 1]
                b += data[i + 2]
            }

            const pixels = data.length / 4
            r = Math.floor(r / pixels)
            g = Math.floor(g / pixels)
            b = Math.floor(b / pixels)

            return `rgb(${r},${g},${b})`
        } catch {
            return 'lime'
        }
    }

    function getFakeVolume() {
        const volBar = document.querySelector('[aria-label="Volumen"] .progress-bar__bg')
        const volFill = document.querySelector('[aria-label="Volumen"] .progress-bar__fg')

        if (volBar && volFill) {
            const total = volBar.getBoundingClientRect().width
            const filled = volFill.getBoundingClientRect().width
            return Math.min(1, filled / total)
        }
        return 0.5
    }

    function saveSettings() {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    }

    async function main() {
        const bar = await waitForElement('.main-nowPlayingBar-nowPlayingBar')

        if (document.getElementById('my-visualizer')) return

        const visualizer = document.createElement('div')
        visualizer.style.position = 'absolute'
        visualizer.style.left = '0'
        visualizer.style.right = '0'
        visualizer.style.top = '0'
        visualizer.style.bottom = '0'
        visualizer.style.pointerEvents = 'none'
        visualizer.style.zIndex = '0' // Push behind other elements

        const canvas = document.createElement('canvas')
        canvas.width = bar.clientWidth
        canvas.height = bar.clientHeight
        canvas.style.width = '100%'
        canvas.style.height = '100%'

        visualizer.appendChild(canvas)
        bar.style.position = 'relative'
        bar.style.overflow = 'hidden'
        bar.appendChild(visualizer)

        const ctx = canvas.getContext('2d')
        const numBars = Math.min(Math.floor(canvas.width / 10), 60)
        let bars = Array(numBars).fill(0)
        let targetHeights = Array(numBars).fill(0)
        let color = 'lime'
        let wavePhase = 0

        async function updateColor() {
            color = await getCoverColor()
        }

        updateColor()

        const observer = new MutationObserver(() => {
            updateColor()
        })

        const trackInfo = await waitForElement('.main-nowPlayingWidget-nowPlaying')
        observer.observe(trackInfo, { childList: true, subtree: true })

        // function animate() {
        //     const volume = getFakeVolume()
        //     const volumeFactor = Math.max(0.2, volume)

        //     if (settings.mode === 'bars') {
        //         for (let i = 0; i < numBars; i++) {
        //             if (Math.random() < 0.05) {
        //                 targetHeights[i] = Math.random() * canvas.height * volumeFactor
        //             }
        //             bars[i] += (targetHeights[i] - bars[i]) * 0.05
        //         }
        //     }

        let lastBeatUpdate = 0

        function animate() {
            const now = performance.now()

            if (now - lastBeatUpdate > 100) {
                for (let i = 0; i < numBars; i++) {
                    if (Math.random() < 0.1) {
                        targetHeights[i] = Math.random() * canvas.height * volumeFactor
                    }
                    bars[i] += targetHeights[i] - bars[i] * 0.2
                }
                lastBeatUpdate = now
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height)
            canvas.style.filter = `drop-shadow(0 0 4px ${color})` // Reducing this, is like simulating the RTX in a game instead of actually using it.
            ctx.shadowColor = color
            ctx.fillStyle = color

            if (settings.mode === 'bars') {
                for (let i = 0; i < numBars; i++) {
                    const x = (canvas.width / numBars) * i
                    const width = canvas.width / numBars - 2
                    const height = bars[i]
                    ctx.fillRect(x, canvas.height - height, width, height)
                }
            } else if (settings.mode === 'waves') {
                ctx.beginPath()
                ctx.moveTo(0, canvas.height / 2)
                for (let x = 0; x <= canvas.width; x++) {
                    const y =
                        canvas.height / 2 + Math.sin((x + wavePhase) * 0.05) * (30 * volumeFactor)
                    ctx.lineTo(x, y)
                }
                ctx.lineTo(canvas.width, canvas.height)
                ctx.lineTo(0, canvas.height)
                ctx.closePath()
                ctx.fill()
                wavePhase += 2
            }

            requestAnimationFrame(animate)
        }

        animate()

        // Cambio de modo con doble clic (solo para ti, no interfiere con Spotify)
        window.addEventListener('dblclick', () => {
            settings.mode = settings.mode === 'bars' ? 'waves' : 'bars'
            saveSettings()
        })

        // Actualiza cuando se cambia el tamaño de la app.
        window.addEventListener('resize', () => {
            canvas.width = bar.clientWidth
            canvas.height = bar.clientHeight
        })
    }

    if (document.readyState === 'complete') {
        main()
    } else {
        document.addEventListener('DOMContentLoaded', main)
    }
})()
