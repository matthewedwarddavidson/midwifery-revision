import { useMemo } from 'react'
import { questionRecords, type QuestionRecord } from './stats'
import { useAppState } from './store'

export function useRecords(): Map<string, QuestionRecord> {
  const { attempts } = useAppState()
  return useMemo(() => questionRecords(attempts), [attempts])
}
