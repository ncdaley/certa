import { useState, useEffect } from 'react'

const KEY = 'certa_goal'

export function getGoal() {
  return localStorage.getItem(KEY) ?? 'avoid'
}

export function setGoal(goal) {
  localStorage.setItem(KEY, goal)
  window.dispatchEvent(new Event('certa_goal_change'))
}

export function useGoal() {
  const [goal, setLocal] = useState(getGoal)

  useEffect(() => {
    function sync() { setLocal(getGoal()) }
    window.addEventListener('certa_goal_change', sync)
    return () => window.removeEventListener('certa_goal_change', sync)
  }, [])

  return [goal, setGoal]
}
