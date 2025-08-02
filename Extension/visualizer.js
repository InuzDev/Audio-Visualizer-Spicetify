export async function initvisualizer() {
    const waitFor = (selector) =>
        new Promise((res) => {
            const i = setInterval(() => {
                const el = document.querySelector(selector)
                if (el) {
                    clearInterval(i)
                    res(el)
                }
            }, 300)
        })

    // Avoid duplicate visualizers
    if (document.getElementById('my-visualizer-wrapper')) return

    const mediaArea = await waitFor('.main-nowPlayingWidget-nowPlaying')
    mediaArea.style.position = 'relative'

    // Wrapper
    const wrapper = document.createElement('div')
    wrapper.id = 'my-visualizer-wrapper'
    wrapper.style.position = 'absolute'
    wrapper.style.top = '0'
    wrapper.style.left = '0'
    wrapper.style.width = '100%'
    wrapper.style.height = '100%'
    wrapper.style.pointerEvents = 'none'
    wrapper.style.zIndex = '10'

    // Visualizer content
    wrapper.innerHTML = `
        <div class="visualizer-stack">
            <canvas class="visualizer-main"></canvas>
            <canvas class="visualizer-mirror"></canvas>
            <div class="blur-layer"></div>
        </div>
    `
    mediaArea.appendChild(wrapper)

    // Setup canvas
    const canvas = wrapper.querySelector('.visualizer-main')
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = 90

    // Audio setup
    const audioTag = document.querySelector('audio')
    if (!audioTag) return

    const context = new AudioContext()
    const src = context.createMediaElementSource(audioTag)
    const analyser = context.createAnalyser()
    analyser.fftSize = 128 // Lower size = less lag
    src.connect(analyser)
    analyser.connect(context.destination)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    // Resume context if suspended
    if (context.state === 'suspended') {
        document.addEventListener('click', () => context.resume(), { once: true })
    }

    function draw() {
        requestAnimationFrame(draw)

        analyser.getByteFrequencyData(dataArray)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = 'lime'

        const barWidth = canvas.width / bufferLength
        for (let i = 0; i < bufferLength; i++) {
            const x = i * barWidth
            const h = dataArray[i]
            ctx.fillRect(x, canvas.height - h, barWidth - 2, h)
        }
    }

    draw()
}
