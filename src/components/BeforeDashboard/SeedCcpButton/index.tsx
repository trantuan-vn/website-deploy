'use client'

import React, { Fragment, useCallback, useState } from 'react'
import { toast } from '@payloadcms/ui'

import '../SeedButton/index.scss'

const SuccessMessage: React.FC = () => (
  <div>
    Database đã seed nội dung CCP.{' '}
    <a target="_blank" href="/">
      Truy cập trang chủ
    </a>{' '}
    để xem.
  </div>
)

export const SeedCcpButton: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const [error, setError] = useState<null | string>(null)

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()

      if (seeded) {
        toast.info('CCP database already seeded.')
        return
      }
      if (loading) {
        toast.info('Seeding already in progress.')
        return
      }
      if (error) {
        toast.error('An error occurred, please refresh and try again.')
        return
      }

      setLoading(true)

      try {
        toast.promise(
          new Promise((resolve, reject) => {
            fetch('/next/seed-ccp', { method: 'POST', credentials: 'include' })
              .then((res) => {
                if (res.ok) {
                  resolve(true)
                  setSeeded(true)
                } else {
                  reject('An error occurred while seeding CCP content.')
                }
              })
              .catch(reject)
          }),
          {
            loading: 'Seeding CCP website content...',
            success: <SuccessMessage />,
            error: 'An error occurred while seeding CCP content.',
          },
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    },
    [loading, seeded, error],
  )

  let message = ''
  if (loading) message = ' (seeding...)'
  if (seeded) message = ' (done!)'
  if (error) message = ` (error: ${error})`

  return (
    <Fragment>
      <button className="seedButton" onClick={handleClick} type="button">
        Seed CCP website
      </button>
      {message}
    </Fragment>
  )
}
