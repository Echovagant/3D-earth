// @vitest-environment node
/**
 * 景区数据流水线的回归测试：抓骨架的地址构造与解析。
 */
import { Buffer } from 'node:buffer'
import { describe, it, expect } from 'vitest'
import {
  buildSearchUrl,
  buildEntityUrl,
  buildFallbackSearchUrl,
  buildImageInfoUrl,
  parseEntity,
  parseImageInfo,
} from '../../scripts/fetch-scenic-skeleton.mjs'
import {
  commonsThumbUrl,
  commonsFilePageUrl,
  targetFileName,
  planImages,
  jpegSize,
} from '../../scripts/fetch-scenic-images.mjs'

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

  it('原图地址后面带追踪参数时，路径照样剥干净', () => {
    // Commons 返回的 url 常带 ?utm_source=…，不剥掉拼出的 thumb 地址会 404
    const json = JSON.parse(JSON.stringify(imageinfo))
    json.query.pages['12345'].imageinfo[0].url =
      'https://upload.wikimedia.org/wikipedia/commons/9/9c/Jiuzhaigou.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original'
    const img = parseImageInfo(json, 'Jiuzhaigou.jpg')
    expect(img.commonsPath).toBe('9/9c/Jiuzhaigou.jpg')
    expect(img.commonsPath).not.toContain('?')
  })

  it('文件名是 URL 编码的中文时，路径要解码回来', () => {
    const json = JSON.parse(JSON.stringify(imageinfo))
    json.query.pages['12345'].imageinfo[0].url =
      'https://upload.wikimedia.org/wikipedia/commons/e/e0/%E6%99%AF%E5%B1%B1%E5%85%AC%E5%9B%AD.jpg'
    const img = parseImageInfo(json, '景山公园.jpg')
    expect(img.commonsPath).toBe('e/e0/景山公园.jpg')
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

describe('图片下载的地址与计划', () => {
  it('thumb 地址把文件名换成目标宽度', () => {
    const url = commonsThumbUrl('a/b/Abcd.jpg', 960)
    expect(url).toContain('upload.wikimedia.org')
    expect(url).toContain('/960px-Abcd.jpg')
  })

  it('原始页面地址指向 Commons 的文件页', () => {
    expect(commonsFilePageUrl('a/b/Abcd.jpg')).toBe(
      'https://commons.wikimedia.org/wiki/File:Abcd.jpg',
    )
  })

  it('大图与缩略图的文件名不同', () => {
    expect(targetFileName('abcdef1234567890', 960)).toBe('abcdef1234567890.jpg')
    expect(targetFileName('abcdef1234567890', 320)).toBe('abcdef1234567890-t.jpg')
  })

  it('许可不在白名单的图要跳过并说明原因', () => {
    const plan = planImages(
      [
        {
          id: 'a',
          images: [
            { file: 'x.jpg', license: 'CC BY-NC 2.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg' },
            { file: 'y.jpg', license: 'CC0-1.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Y.jpg' },
          ],
        },
      ],
      new Set(),
    )
    expect(plan.skipped.length).toBe(1)
    expect(plan.skipped[0].reason).toContain('许可')
    expect(plan.downloads.length).toBe(1)
  })

  it('已经下过的图不重复下', () => {
    const plan = planImages(
      [
        {
          id: 'a',
          images: [
            { file: 'x.jpg', license: 'CC0-1.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg' },
          ],
        },
      ],
      new Set(['x.jpg', 'x-t.jpg']),
    )
    expect(plan.downloads.length).toBe(0)
  })
})

describe('图片下载计划的补充', () => {
  it('同一张图被多个景区引用时只计划一次下载', () => {
    const shared = {
      file: 'S.jpg',
      md5: 'aaaabbbbccccddddeeeeffff00001111',
      commonsPath: 'a/b/S.jpg',
      license: 'CC0-1.0',
      author: '李四',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:S.jpg',
    }
    const plan = planImages(
      [
        { id: 'a', images: [shared] },
        { id: 'b', images: [{ ...shared }] },
      ],
      new Set(),
    )
    expect(plan.downloads.length).toBe(1)
    expect(plan.downloads[0].large).toBe('aaaabbbbccccdddd.jpg')
    expect(plan.downloads[0].thumb).toBe('aaaabbbbccccdddd-t.jpg')
  })

  it('只差一张缩略图时也要计划下载', () => {
    const plan = planImages(
      [
        {
          id: 'a',
          images: [
            {
              file: 'P.jpg',
              md5: 'aaaabbbbccccddddeeeeffff00001111',
              commonsPath: 'a/b/P.jpg',
              license: 'CC0-1.0',
              author: '李四',
              sourceUrl: 'https://commons.wikimedia.org/wiki/File:P.jpg',
            },
          ],
        },
      ],
      new Set(['aaaabbbbccccdddd.jpg']),
    )
    expect(plan.downloads.length).toBe(1)
  })
})

describe('JPEG 尺寸解析', () => {
  it('从 SOF 段里读出宽高', () => {
    const buffer = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]),
      Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x80, 0x04, 0x00, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]),
      Buffer.from([0xff, 0xd9]),
    ])
    const size = jpegSize(buffer)
    expect(size.width).toBe(0x0400)
    expect(size.height).toBe(0x0280)
  })

  it('不是 JPEG 就返回 null', () => {
    expect(jpegSize(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toBeNull()
    expect(jpegSize(Buffer.from([0xff, 0xd8]))).toBeNull()
    expect(jpegSize(Buffer.alloc(0))).toBeNull()
  })
})
