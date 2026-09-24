'use client'

import { useTranslations } from 'next-intl'
import type { ContactItem } from './types'

const INPUT =
  'mt-0.5 w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white'

const CONTACT_TYPES = ['email', 'phone', 'location', 'linkedin', 'github', 'web']

type IdentityData = {
  name: string
  headline: string
  contact: ContactItem[]
}

type Props = {
  identity: IdentityData
  onChange: (identity: IdentityData) => void
}

export function IdentitySection({ identity, onChange }: Props) {
  const t = useTranslations('identity')
  const set = (k: 'name' | 'headline') => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...identity, [k]: e.target.value })

  const setContact = (i: number, k: keyof ContactItem, v: string) => {
    const c = [...identity.contact]
    c[i] = { ...c[i], [k]: v }
    onChange({ ...identity, contact: c })
  }

  const addContact = () =>
    onChange({
      ...identity,
      contact: [...identity.contact, { type: 'email', key: '', value: '' }],
    })

  const removeContact = (i: number) =>
    onChange({ ...identity, contact: identity.contact.filter((_, j) => j !== i) })

  return (
    <div className="space-y-3">
      <label className="block text-xs text-gray-500">
        {t('fullName')}
        <input value={identity.name} onChange={set('name')} className={INPUT} />
      </label>
      <label className="block text-xs text-gray-500">
        {t('headline')}
        <input value={identity.headline} onChange={set('headline')} className={INPUT} />
      </label>
      <div>
        <p className="text-xs text-gray-500 mb-1.5">{t('contact')}</p>
        <div className="space-y-1.5">
          {identity.contact.map((c, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: contact items identified by position
            <div key={i} className="flex gap-1 items-center">
              <select
                value={c.type}
                onChange={(e) => setContact(i, 'type', e.target.value)}
                aria-label={t('contactTypeLabel', { number: i + 1 })}
                className="text-xs border border-gray-200 rounded px-1.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                {CONTACT_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
              <input
                value={c.key}
                onChange={(e) => setContact(i, 'key', e.target.value)}
                placeholder={t('labelPlaceholder')}
                className="w-20 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
              <input
                value={c.value}
                onChange={(e) => setContact(i, 'value', e.target.value)}
                placeholder={t('valuePlaceholder')}
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
              <button
                type="button"
                aria-label={t('removeContact')}
                onClick={() => removeContact(i)}
                className="text-gray-300 hover:text-red-400 text-sm"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addContact}
            className="w-full text-xs border border-dashed border-gray-300 rounded px-2 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {t('addContact')}
          </button>
        </div>
      </div>
    </div>
  )
}
