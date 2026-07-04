import type { Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { linkGroup } from '@/fields/linkGroup'

export const heroFields: Field[] = [
  {
    name: 'type',
    type: 'select',
    defaultValue: 'lowImpact',
    label: 'Type',
    options: [
      {
        label: 'None',
        value: 'none',
      },
      {
        label: 'High Impact',
        value: 'highImpact',
      },
      {
        label: 'Medium Impact',
        value: 'mediumImpact',
      },
      {
        label: 'Low Impact',
        value: 'lowImpact',
      },
    ],
    required: true,
  },
  {
    name: 'richText',
    type: 'richText',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ]
      },
    }),
    label: false,
  },
  linkGroup({
    overrides: {
      maxRows: 2,
    },
  }),
  {
    name: 'media',
    type: 'upload',
    admin: {
      condition: (_, { type } = {}) => ['highImpact', 'mediumImpact'].includes(type),
    },
    relationTo: 'media',
    required: true,
  },
]

export const heroes: Field = {
  name: 'heroes',
  type: 'array',
  localized: true,
  label: 'Heroes',
  labels: {
    singular: 'Hero',
    plural: 'Heroes',
  },
  admin: {
    initCollapsed: false,
  },
  fields: heroFields,
}

/** @deprecated Use `heroes` instead */
export const hero = heroes
