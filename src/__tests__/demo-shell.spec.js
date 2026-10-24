// @vitest-environment jsdom
/**
 * 演示外壳（DemoShell）与参数轴（DemoSlider）的契约测试。
 *
 * 外壳是三十个演示共用的那一层：播放/暂停、速度、循环、时间轴、键盘。
 * 这里守住三件事：
 *   ① 时间轴点哪一段就跳到哪一步，不能只靠「上一步/下一步」一格一格爬；
 *   ② 自动播放默认不启动、点了才动、速度与循环开关真的生效；
 *   ③ 参数轴的 label 指向自己的输入框，数值双向同步。
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import DemoShell from '../components/DemoShell.vue'
import DemoSlider from '../components/DemoSlider.vue'

const steps = [
  { id: 'a', title: '第一步', text: '第一步的解说' },
  { id: 'b', title: '第二步', text: '第二步的解说' },
  { id: 'c', title: '第三步', text: '第三步的解说' },
]

// 找不到时返回一个「不存在」的包装，调用 .exists() 得到 false 而不是抛错
const findButton = (wrapper, label) =>
  wrapper.findAll('.demo__controls button').find((b) => b.text().trim() === label) ??
  wrapper.find('.demo__no-such-button')

describe('演示外壳', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('画出画布、解说与步骤控件', () => {
    const wrapper = mount(DemoShell, { props: { steps } })

    expect(wrapper.find('.demo__canvas').exists()).toBe(true)
    expect(wrapper.find('.demo__title').text()).toBe('第一步')
    expect(wrapper.find('.demo__text').text()).toBe('第一步的解说')
    expect(wrapper.find('.demo__count').text()).toBe('1 / 3')
    expect(wrapper.findAll('.demo__seg')).toHaveLength(3)
  })

  it('默认不自动播放——点了「播放」才动', () => {
    const wrapper = mount(DemoShell, { props: { steps } })

    expect(findButton(wrapper, '播放').exists()).toBe(true)
    expect(findButton(wrapper, '暂停').exists()).toBe(false)
  })

  it('点「下一步」换步，并把翻页方向记到画布上', async () => {
    const wrapper = mount(DemoShell, { props: { steps } })

    await findButton(wrapper, '下一步').trigger('click')
    expect(wrapper.find('.demo__title').text()).toBe('第二步')
    expect(wrapper.find('.demo__canvas').classes()).toContain('demo__canvas--forward')

    await findButton(wrapper, '上一步').trigger('click')
    expect(wrapper.find('.demo__title').text()).toBe('第一步')
    expect(wrapper.find('.demo__canvas').classes()).toContain('demo__canvas--back')
  })

  it('时间轴点第几段就跳到第几步', async () => {
    const wrapper = mount(DemoShell, { props: { steps } })

    await wrapper.findAll('.demo__seg')[2].trigger('click')
    expect(wrapper.find('.demo__title').text()).toBe('第三步')
    expect(wrapper.find('.demo__count').text()).toBe('3 / 3')
    expect(wrapper.findAll('.demo__seg')[2].classes()).toContain('is-on')
  })

  it('时间轴每一段都带「第几步 + 标题」的无障碍标签', () => {
    const wrapper = mount(DemoShell, { props: { steps } })

    const labels = wrapper.findAll('.demo__seg').map((s) => s.attributes('aria-label'))
    expect(labels).toEqual(['第 1 步：第一步', '第 2 步：第二步', '第 3 步：第三步'])
  })

  it('播放后步骤会自己往前走，暂停后停住', async () => {
    vi.useFakeTimers()
    const wrapper = mount(DemoShell, { props: { steps, dwell: 1000 } })

    await findButton(wrapper, '播放').trigger('click')
    expect(findButton(wrapper, '暂停').exists()).toBe(true)

    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.demo__title').text()).toBe('第二步')

    await findButton(wrapper, '暂停').trigger('click')
    vi.advanceTimersByTime(5000)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.demo__title').text()).toBe('第二步')
  })

  it('在最后一步点「播放」会从头再来，而不是立刻停住', async () => {
    vi.useFakeTimers()
    const wrapper = mount(DemoShell, { props: { steps, dwell: 1000 } })

    await wrapper.findAll('.demo__seg')[2].trigger('click')
    expect(wrapper.find('.demo__title').text()).toBe('第三步')

    await findButton(wrapper, '播放').trigger('click')
    expect(wrapper.find('.demo__title').text()).toBe('第一步')
    expect(findButton(wrapper, '暂停').exists()).toBe(true)
  })

  it('速度按钮在 1× / 2× / 0.5× 之间循环', async () => {
    vi.useFakeTimers()
    const wrapper = mount(DemoShell, { props: { steps, dwell: 1000 } })

    const speed = wrapper.findAll('.demo__controls button').find((b) => b.text().trim().endsWith('×'))
    expect(speed.text().trim()).toBe('1×')

    await speed.trigger('click')
    expect(speed.text().trim()).toBe('2×')
    await speed.trigger('click')
    expect(speed.text().trim()).toBe('0.5×')
    await speed.trigger('click')
    expect(speed.text().trim()).toBe('1×')
  })

  it('开了循环，播到最后一步会绕回第一步', async () => {
    vi.useFakeTimers()
    const wrapper = mount(DemoShell, { props: { steps, dwell: 1000 } })

    const loop = findButton(wrapper, '循环')
    expect(loop.attributes('aria-pressed')).toBe('false')
    await loop.trigger('click')
    expect(loop.attributes('aria-pressed')).toBe('true')

    await findButton(wrapper, '播放').trigger('click')
    vi.advanceTimersByTime(3000)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.demo__title').text()).toBe('第一步')
  })

  it('没开循环时，播到最后一步就停', async () => {
    vi.useFakeTimers()
    const wrapper = mount(DemoShell, { props: { steps, dwell: 1000 } })

    await findButton(wrapper, '播放').trigger('click')
    vi.advanceTimersByTime(3000)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.demo__title').text()).toBe('第三步')
    expect(findButton(wrapper, '播放').exists()).toBe(true)
  })

  it('键盘：左右翻步、空格播放暂停', async () => {
    vi.useFakeTimers()
    const wrapper = mount(DemoShell, { props: { steps, dwell: 1000 } })

    await wrapper.find('.demo').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.find('.demo__title').text()).toBe('第二步')

    await wrapper.find('.demo').trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.find('.demo__title').text()).toBe('第一步')

    await wrapper.find('.demo').trigger('keydown', { key: ' ' })
    expect(findButton(wrapper, '暂停').exists()).toBe(true)
  })

  it('焦点在输入框里时不抢键盘', async () => {
    const wrapper = mount(DemoShell, { props: { steps } })

    // 真的往 demo 里塞一个输入框，让键盘事件从输入框冒泡上去
    const input = document.createElement('input')
    wrapper.find('.demo').element.appendChild(input)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.demo__title').text()).toBe('第一步')
  })

  it('系统开了「减少动态效果」时不自动播', async () => {
    vi.useFakeTimers()
    const original = window.matchMedia
    window.matchMedia = (query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })

    try {
      const wrapper = mount(DemoShell, { props: { steps, dwell: 1000 } })
      await findButton(wrapper, '播放').trigger('click')
      vi.advanceTimersByTime(3000)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.demo__title').text()).toBe('第一步')
      expect(findButton(wrapper, '播放').exists()).toBe(true)
    } finally {
      window.matchMedia = original
    }
  })

  it('没有提供 controls 槽时不渲染参数区', () => {
    const wrapper = mount(DemoShell, { props: { steps } })
    expect(wrapper.find('.demo__params').exists()).toBe(false)
  })

  it('提供了 controls 槽时把它渲染在画布下面', async () => {
    const wrapper = mount(DemoShell, {
      props: { steps },
      slots: { controls: '<p class="probe">参数轴</p>' },
    })

    const params = wrapper.find('.demo__params')
    expect(params.exists()).toBe(true)
    expect(params.find('.probe').exists()).toBe(true)
    // 参数区在画布之后、标题之前
    const html = wrapper.html()
    expect(html.indexOf('demo__canvas')).toBeLessThan(html.indexOf('demo__params'))
    expect(html.indexOf('demo__params')).toBeLessThan(html.indexOf('demo__title'))
  })

  it('controls 槽能拿到当前步骤', async () => {
    const wrapper = mount(DemoShell, {
      props: { steps },
      slots: { controls: (params) => h('p', { class: 'probe' }, String(params.step)) },
    })

    expect(wrapper.find('.probe').text()).toBe('0')
    await wrapper.findAll('.demo__seg')[1].trigger('click')
    expect(wrapper.find('.probe').text()).toBe('1')
  })
})

describe('参数轴', () => {
  it('label 指向自己的输入框', () => {
    const wrapper = mount(DemoSlider, { props: { label: '直射点纬度', modelValue: 0 } })

    const input = wrapper.find('input[type="range"]')
    const label = wrapper.find('label')
    expect(label.attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-label')).toBe('直射点纬度')
  })

  it('同一个页面里的两个参数轴 id 不一样，否则 label 会指错', () => {
    // useId 是按 app 实例递增的，所以要在同一个 app 里比
    const wrapper = mount({
      components: { DemoSlider },
      template: `
        <div>
          <DemoSlider label="甲" :model-value="0" />
          <DemoSlider label="乙" :model-value="0" />
        </div>
      `,
    })

    const ids = wrapper.findAll('input').map((i) => i.attributes('id'))
    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe(ids[1])
  })

  it('拖动输入框会把新值抛给外面', async () => {
    const wrapper = mount(DemoSlider, { props: { label: 'x', modelValue: 0, min: -10, max: 10 } })

    await wrapper.find('input').setValue('5')
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([5])
  })

  it('外面改了值，滑块跟着变', async () => {
    const wrapper = mount(DemoSlider, {
      props: { label: 'x', modelValue: 0, min: -10, max: 10 },
    })

    await wrapper.setProps({ modelValue: 7 })
    expect(wrapper.find('input').element.value).toBe('7')
  })

  it('读数按 format 显示', () => {
    const wrapper = mount(DemoSlider, {
      props: { label: 'x', modelValue: 23.5, format: (v) => `${v}°N` },
    })

    expect(wrapper.find('output').text()).toBe('23.5°N')
  })

  it('默认读数就是数值本身', () => {
    const wrapper = mount(DemoSlider, { props: { label: 'x', modelValue: 12 } })
    expect(wrapper.find('output').text()).toBe('12')
  })
})
