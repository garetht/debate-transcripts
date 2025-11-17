type EffectCallback = () => void | (() => void)

export class HookHarness {
  private states: unknown[] = []
  private refs: Array<{ current: unknown }> = []
  private cleanups: Array<() => void> = []
  private pendingEffects: EffectCallback[] = []
  private stateIndex = 0
  private refIndex = 0

  beginRender(): void {
    this.stateIndex = 0
    this.refIndex = 0
    this.pendingEffects = []
  }

  runEffects(): void {
    const nextCleanups: Array<() => void> = []
    for (const effect of this.pendingEffects) {
      const cleanup = effect()
      if (typeof cleanup === 'function') {
        nextCleanups.push(cleanup)
      }
    }
    this.cleanups = nextCleanups
    this.pendingEffects = []
  }

  useState<T>(
    initialValue: T | (() => T),
  ): [T, (value: T | ((previous: T) => T)) => void] {
    const index = this.stateIndex++
    if (!(index in this.states)) {
      this.states[index] =
        typeof initialValue === 'function'
          ? (initialValue as () => T)()
          : initialValue
    }
    const setState = (value: T | ((previous: T) => T)) => {
      const nextValue =
        typeof value === 'function'
          ? (value as (previous: T) => T)(this.states[index] as T)
          : value
      this.states[index] = nextValue
    }
    return [this.states[index] as T, setState]
  }

  useRef<T>(initialValue: T): { current: T } {
    const index = this.refIndex++
    if (!this.refs[index]) {
      this.refs[index] = { current: initialValue }
    }
    return this.refs[index] as { current: T }
  }

  useMemo<T>(factory: () => T): T {
    return factory()
  }

  useCallback<T extends (...args: unknown[]) => unknown>(callback: T): T {
    return callback
  }

  registerEffect(effect: EffectCallback): void {
    this.pendingEffects.push(effect)
  }

  reset(): void {
    for (const cleanup of this.cleanups.splice(0)) {
      cleanup()
    }
    this.states = []
    this.refs = []
    this.pendingEffects = []
    this.stateIndex = 0
    this.refIndex = 0
  }
}
