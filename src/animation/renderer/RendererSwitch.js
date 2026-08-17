// 渲染器工厂：按画质档位异步创建 Three / Canvas2D / skip
// 统一接口契约：init():Promise / resize(w,h) / update(snapshot) / dispose()
// Three.init 抛错或 webglcontextlost 时由调用方降级到 2D

export async function createRenderer(canvas, { tier, onFatal } = {}) {
  if (tier === 'skip') return { kind: 'skip', renderer: null, tier: 'skip' }

  if (tier === 'high' || tier === 'medium') {
    try {
      const { ThreeRenderer } = await import('./ThreeRenderer') // 动态加载 three → 独立 chunk
      const renderer = new ThreeRenderer(canvas, { tier })
      await renderer.init()
      return { kind: 'three', renderer, tier }
    } catch (err) {
      console.warn('[intro] WebGL init failed, fallback to 2D:', err)
      onFatal?.(err)
    }
  }

  const { Canvas2DRenderer } = await import('./Canvas2DRenderer')
  const renderer = new Canvas2DRenderer(canvas)
  await renderer.init()
  return { kind: '2d', renderer, tier: '2d' }
}
