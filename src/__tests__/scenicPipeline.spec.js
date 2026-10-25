// @vitest-environment node
/**
 * 景区数据流水线的回归测试：抓骨架的地址构造与解析。
 */
import { describe, it, expect } from 'vitest'
import {
  buildSearchUrl,
  buildEntityUrl,
  buildFallbackSearchUrl,
  buildImageInfoUrl,
  parseEntity,
  parseImageInfo,
} from '../../scripts/fetch-scenic-skeleton.mjs'

describe('骨架抓取的地址与解析', () => {
  it('按中文维基标题查实体', () => {
    const url = buildSearchUrl('九寨沟')
    expect(url).toContain('wbgetentities')
    expect(url).toContain('sites=zhwiki')
    expect(url).toContain(encodeURIComponent('九寨沟'))
  })

  it('实体地址带上编号', () => {
    expect(buildEntityUrl('Q123')).toContain('Q123')
  })

  it('能取出坐标、标签与图片的许可信息', () => {
    const parsed = parseEntity({
      entities: {
        Q123: {
          labels: { 'zh-cn': { language: 'zh-cn', value: '九寨沟' } },
          claims: {
            P625: [
              {
                mainsnak: {
                  datavalue: {
                    value: {
                      latitude: 33.26,
                      longitude: 103.92,
                      globe: 'earth',
                      precision: 0.0001,
                    },
                  },
                },
              },
            ],
            P18: [{ mainsnak: { datavalue: { value: 'Jiuzhaigou.jpg' } } }],
          },
        },
      },
    })
    expect(parsed.qid).toBe('Q123')
    expect(parsed.label).toBe('九寨沟')
    expect(parsed.coords[0]).toBeCloseTo(33.26, 4)
    expect(parsed.coords[1]).toBeCloseTo(103.92, 4)
    expect(parsed.images.length).toBe(1)
  })

  it('实体缺坐标时坐标为 null，不要编一个 0', () => {
    const parsed = parseEntity({ entities: { Q9: { labels: { en: { value: 'X' } }, claims: {} } } })
    expect(parsed.coords).toBeNull()
  })
})

describe('骨架抓取的补充解析', () => {
  it('实体编号优先取实体自带的 id，键名不是编号时不当成编号', () => {
    const withId = parseEntity({ entities: { Q7: { id: 'Q3130', labels: {}, claims: {} } } })
    expect(withId.qid).toBe('Q3130')

    const keyedByTitle = parseEntity({
      entities: { 九寨沟: { id: 'Q13007', labels: {}, claims: {} } },
    })
    expect(keyedByTitle.qid).toBe('Q13007')

    const missing = parseEntity({ entities: { 九寨沟: { id: null, missing: '' } } })
    expect(missing.qid).toBeNull()
    expect(missing.coords).toBeNull()
  })

  it('坐标不在地球上就当没有坐标', () => {
    const parsed = parseEntity({
      entities: {
        Q5: {
          labels: {},
          claims: {
            P625: [{ mainsnak: { datavalue: { value: { latitude: 1, longitude: 2, globe: 'mars' } } } }],
          },
        },
      },
    })
    expect(parsed.coords).toBeNull()
  })

  it('实体里没有图片时给空数组，不给 undefined', () => {
    const parsed = parseEntity({ entities: { Q3: { labels: {}, claims: {} } } })
    expect(parsed.images).toEqual([])
  })

  it('空响应给出空骨架，不抛异常', () => {
    const parsed = parseEntity({})
    expect(parsed.qid).toBeNull()
    expect(parsed.label).toBe('')
    expect(parsed.coords).toBeNull()
    expect(parsed.images).toEqual([])
  })

  it('标题查不到时的兜底搜索也走同一个接口', () => {
    const url = buildFallbackSearchUrl('稻城亚丁')
    expect(url).toContain('wbsearchentities')
    expect(url).toContain(encodeURIComponent('稻城亚丁'))
    expect(new URL(url).origin).toBe(new URL(buildSearchUrl('九寨沟')).origin)
  })

  it('图片信息地址指向 Commons 的文件页', () => {
    const url = buildImageInfoUrl('Jiuzhaigou.jpg')
    expect(url).toContain('commons.wikimedia.org')
    expect(url).toContain(encodeURIComponent('File:Jiuzhaigou.jpg'))
  })
})

describe('Commons 图片信息', () => {
  const imageinfo = {
    query: {
      pages: {
        '12345': {
          title: 'File:Jiuzhaigou.jpg',
          imageinfo: [
            {
              url: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Jiuzhaigou.jpg',
              descriptionurl: 'https://commons.wikimedia.org/wiki/File:Jiuzhaigou.jpg',
              thumburl:
                'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Jiuzhaigou.jpg/960px-Jiuzhaigou.jpg',
              sha1: 'abc123def456',
              width: 3000,
              height: 2000,
              extmetadata: {
                LicenseShortName: { value: 'CC BY-SA 4.0' },
                UsageTerms: { value: 'Creative Commons Attribution-Share Alike 4.0' },
                Artist: { value: '<a href="//commons.wikimedia.org/wiki/User:A">张三</a>' },
                Restrictions: { value: '' },
              },
            },
          ],
        },
      },
    },
  }

  it('取出许可、作者与 Commons 路径', () => {
    const img = parseImageInfo(imageinfo, 'Jiuzhaigou.jpg')
    expect(img.license).toBe('CC BY-SA 4.0')
    expect(img.author).toBe('张三')
    expect(img.commonsPath).toBe('9/9c/Jiuzhaigou.jpg')
    expect(img.sourceUrl).toBe('https://commons.wikimedia.org/wiki/File:Jiuzhaigou.jpg')
    expect(img.thumbUrl).toContain('960px-Jiuzhaigou.jpg')
    expect(img.allowed).toBe(true)
  })

  it('许可不在白名单的图标成不可用', () => {
    const json = JSON.parse(JSON.stringify(imageinfo))
    json.query.pages['12345'].imageinfo[0].extmetadata.LicenseShortName.value = 'CC BY-NC 2.0'
    const img = parseImageInfo(json, 'Jiuzhaigou.jpg')
    expect(img.allowed).toBe(false)
  })

  it('没有许可信息时不当成可用', () => {
    const img = parseImageInfo({ query: { pages: {} } }, 'Jiuzhaigou.jpg')
    expect(img.license).toBe('')
    expect(img.allowed).toBe(false)
  })
})
