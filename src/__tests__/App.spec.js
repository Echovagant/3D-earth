import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../App.vue'

describe('App', () => {
  it('renders the matched route', async () => {
    // 用内存路由 + 桩组件，避免在 jsdom 里挂载 EarthScene（它需要真实 WebGL 上下文）
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<p>EARTH_OK</p>' } }],
    })
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [router] } })
    expect(wrapper.text()).toContain('EARTH_OK')
  })
})
