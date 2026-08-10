import { defineStore } from 'pinia'
import { load, save } from '@/utils/storage'

const KEY = 'silver_ui'
const ALLOWED = ['small', 'medium', 'large']

const PRESETS = {
  small: {
    fsBase: '14px',
    fsNav: '0.95rem',
    fsFooter: '0.88rem',
    fsBtn: '0.86rem',
    ctrlH: '34px',
    ctrlPx: '12px'
  },
  medium: {
    fsBase: '16px',
    fsNav: '1.03rem',
    fsFooter: '0.94rem',
    fsBtn: '0.92rem',
    ctrlH: '38px',
    ctrlPx: '15px'
  },
  large: {
    fsBase: '18px',
    fsNav: '1.12rem',
    fsFooter: '1rem',
    fsBtn: '1rem',
    ctrlH: '44px',
    ctrlPx: '18px'
  }
}

function normalizeSize(v) {
  return ALLOWED.includes(v) ? v : 'medium'
}

function applyVars(size) {
  const s = normalizeSize(size)
  const p = PRESETS[s]
  const root = document.documentElement

  root.style.setProperty('--fs-base', p.fsBase)
  root.style.setProperty('--fs-nav', p.fsNav)
  root.style.setProperty('--fs-footer', p.fsFooter)
  root.style.setProperty('--fs-btn', p.fsBtn)
  root.style.setProperty('--ctrl-h', p.ctrlH)
  root.style.setProperty('--ctrl-px', p.ctrlPx)
  root.setAttribute('data-fontsize', s)
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    fontSize: 'medium'
  }),

  actions: {
    hydrate() {
      const saved = load(KEY, null)
      const size = normalizeSize(saved?.fontSize)
      this.fontSize = size
      applyVars(size)
    },

    setFontSize(size) {
      const next = normalizeSize(size)
      this.fontSize = next
      save(KEY, { fontSize: next })
      applyVars(next)
    }
  }
})
