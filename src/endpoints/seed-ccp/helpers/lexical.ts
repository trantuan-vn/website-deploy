/* eslint-disable @typescript-eslint/no-explicit-any */

type LexicalNode = Record<string, any>

export type LexicalRoot = { root: LexicalNode }

const ROOT_DEFAULTS = {
  direction: 'ltr' as const,
  format: '',
  indent: 0,
  version: 1,
}

export function lexicalRoot(children: LexicalNode[]): LexicalRoot {
  return {
    root: {
      type: 'root',
      children,
      ...ROOT_DEFAULTS,
    },
  }
}

function heading(tag: string, text: string): LexicalNode {
  return {
    type: 'heading',
    children: [textNode(text)],
    ...ROOT_DEFAULTS,
    tag,
  }
}

export function h1(text: string): LexicalNode {
  return heading('h1', text)
}

export function h2(text: string): LexicalNode {
  return heading('h2', text)
}

export function h3(text: string): LexicalNode {
  return heading('h3', text)
}

export function h4(text: string): LexicalNode {
  return heading('h4', text)
}

export function text(content: string, format: 0 | 1 = 0): LexicalNode {
  return textNode(content, format)
}

function textNode(content: string, format: 0 | 1 = 0): LexicalNode {
  return {
    type: 'text',
    detail: 0,
    format,
    mode: 'normal',
    style: '',
    text: content,
    version: 1,
  }
}

export function link(label: string, url: string, newTab = false): LexicalNode {
  return {
    type: 'link',
    children: [textNode(label)],
    direction: 'ltr',
    fields: {
      linkType: 'custom',
      newTab,
      url,
    },
    format: '',
    indent: 0,
    version: 3,
  }
}

export function paragraph(...children: (LexicalNode | string)[]): LexicalNode {
  return {
    type: 'paragraph',
    children: children.map((c) => (typeof c === 'string' ? textNode(c) : c)),
    ...ROOT_DEFAULTS,
    textFormat: 0,
    textStyle: '',
  }
}

export function bulletList(items: string[]): LexicalNode {
  return {
    type: 'list',
    listType: 'bullet',
    tag: 'ul',
    children: items.map((item) => ({
      type: 'listitem',
      children: [paragraph(item)],
      ...ROOT_DEFAULTS,
      value: 1,
    })),
    ...ROOT_DEFAULTS,
    start: 1,
  }
}

export function orderedList(items: string[]): LexicalNode {
  return {
    type: 'list',
    listType: 'number',
    tag: 'ol',
    children: items.map((item, i) => ({
      type: 'listitem',
      children: [paragraph(item)],
      ...ROOT_DEFAULTS,
      value: i + 1,
    })),
    ...ROOT_DEFAULTS,
    start: 1,
  }
}

export function italicParagraph(content: string): LexicalNode {
  return {
    type: 'paragraph',
    children: [
      {
        type: 'text',
        detail: 0,
        format: 2,
        mode: 'normal',
        style: '',
        text: content,
        version: 1,
      },
    ],
    ...ROOT_DEFAULTS,
    textFormat: 0,
    textStyle: '',
  }
}
