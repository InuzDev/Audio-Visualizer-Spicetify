import { initvisualizer } from './Extension/visualizer.js'
;(async function main() {
    while (!Spicetify?.Platform || !document.querySelector('audio')) {
        await new Promise((r) => setTimeout(r, 300))
    }

    Spicetify?.Event?.THEME_CHANGED?.subscribe(() => {
        if (!document.getElementById('my-visualizer-wrapper')) {
            initvisualizer()
        }
    })

    try {
        initvisualizer()
    } catch (err) {
        console.error('Visualizer failed to initialize:', err)
    }

    const style = document.createElement('style')
    style.textContent = `
  .visualizer-stack {
     position: absolute;
     width: 100%;
     height: 180px;
     bottom: 0;
     pointer-events: none;
     z-index: 999;
     overflow: hidden;
  }
  .visualizer-main,
  .visualizer-mirror {
     width: 100%;
     height: 90px;
     display: block;
  }
  .visualizer-mirror {
     transform: scaleY(-1);
     opacity: 0.4;
     filter: blur(4px) brightness(0.8);
  }
  .blur-layer {
     position: absolute;
     bottom: 0;
     width: 100%;
     height: 180px;
     background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.1) 0%, transparent 80%);
     mix-blend-mode: screen;
     pointer-events: none;
  }
`
    document.head.appendChild(style)
})()
