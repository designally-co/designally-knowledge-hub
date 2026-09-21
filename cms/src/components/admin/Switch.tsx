'use client'

import React from 'react'

import './Switch.css'

/**
 * On or off, as Content Studio draws it.
 *
 * PAYLOAD'S CHECKBOX WAS DOING THIS JOB, and a checkbox reads as something you
 * tick on the way to pressing Save. This one is a state — the key either works
 * or it does not — which is the shape a switch has. Its own `role="switch"` so
 * a screen reader hears on/off rather than "checked", and the whole control is
 * a 44px target: the track is 40 by 24 and the thumb 20, which is a miss
 * waiting to happen on a coarse pointer.
 *
 * It writes to Payload's field, so Save, the dirty state and validation carry
 * on knowing nothing about it.
 */
export function Switch({ checked, label, onChange }: { checked: boolean; label: string; onChange: (next: boolean) => void }) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={`da-switch${checked ? ' da-switch--on' : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span aria-hidden="true" className="da-switch__track">
        <span className="da-switch__thumb" />
      </span>
    </button>
  )
}
