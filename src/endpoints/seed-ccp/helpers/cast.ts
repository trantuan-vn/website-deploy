import type { RequiredDataFromCollectionSlug } from 'payload'

export const asPageData = (data: object) =>
  data as RequiredDataFromCollectionSlug<'pages'>

export const asFormData = (data: object) =>
  data as RequiredDataFromCollectionSlug<'forms'>

export const asPostData = (data: object) =>
  data as RequiredDataFromCollectionSlug<'posts'>
