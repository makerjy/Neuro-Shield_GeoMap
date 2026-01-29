import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

type Props = {
  height?: number
}

export default function KoreaMap({ height = 520 }: Props) {
  const chartRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let chart: echarts.ECharts | null = null
    let disposed = false

    async function init() {
      if (!chartRef.current) return
      const res = await fetch('/korea.json')
      const geoJson = await res.json()
      if (disposed) return

      echarts.registerMap('korea', geoJson as any)
      chart = echarts.init(chartRef.current)

      const features = (geoJson.features || []) as any[]
      const data = features.map((f, idx) => ({
        name: f.properties?.name || f.properties?.NAME || `R${idx + 1}`,
        value: Math.round(20 + Math.random() * 80),
      }))

      chart.setOption({
        tooltip: { trigger: 'item' },
        visualMap: {
          min: 0,
          max: 100,
          left: 10,
          bottom: 10,
          text: ['높음', '낮음'],
          calculable: true,
        },
        series: [
          {
            name: '치매 위험 스코어',
            type: 'map',
            map: 'korea',
            roam: true,
            label: { show: false },
            emphasis: { label: { show: false } },
            data,
          },
        ],
      })
    }

    init()

    const handleResize = () => {
      if (chart) chart.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      disposed = true
      window.removeEventListener('resize', handleResize)
      if (chart) chart.dispose()
    }
  }, [])

  return <div ref={chartRef} style={{ width: '100%', height }} />
}
