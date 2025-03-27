type HasErrorFn<V = any, S = any, Extra = any> = (
  value: V,
  source?: S,
  extras?: Extra
) => string | boolean;
type ErrorModel<S, Extra> = {
  [K in keyof S]?: HasErrorFn<K extends keyof S ? S[K] : any, S, Extra>;
};

/**
 * 返回字段错误校验Model（范型传递）
 * @description
 * - 校验方法返回错误原因；false/''则视为无错误
 * - 如果要显示错误原因就不要返回true
 */
export function createCheckModel<
  S extends Record<string, any>,
  Extra extends Record<string, any> = any
>(model: ErrorModel<S, Extra>) {
  /** 存储一些上次调用model校验之后的提示信息 */
  const _state: Partial<Record<keyof S, string | boolean>> = {};

  const keys = Object.keys(model) as (keyof S)[];
  keys.forEach((k) => {
    const check = model[k];
    model[k] = function (...args) {
      _state[k] = check?.apply(this, args);
      return _state[k] ?? '';
    };
  });

  /**
   * 校验是否存在错误
   * @param checkConfig {} 传入需要校验的key，默认全部校验
   * - 如果有`多个tab`但是字段不一样的情况，此时只写一个`createCheckModel`就可以了
   */
  function _validate(source: S, checkConfig?: Partial<Record<keyof S, boolean>>, extras?: Extra) {
    const arr = [] as string[];
    keys.forEach((k) => {
      if (checkConfig && !checkConfig[k]) {
        delete _state[k];
        return;
      }
      const check = model[k];
      const result = check?.(undefined as never, source, extras);
      if (result) arr.push((k as string) + ': ' + result);
    });
    // 打印所有校验错误的提示数组
    if (arr.length) console.warn('[checkModel]#####_state', _state);
    return !!arr.length;
  }

  /** 清空_state记录的错误信息 */
  function _clearValidate() {
    (Object.keys(_state) as (keyof S)[]).forEach((k) => (_state[k] = ''));
  }

  return {
    ...model,
    /** 错误信息 */
    _state,
    /** @returns true: hasError */
    _validate,
    /** 清空_state记录的错误信息 */
    _clearValidate
  };
}

/** 返回当前应该取值的数据来源 */
export function getCurrentValue<K extends keyof S, S extends Record<string, any>>(
  value: S[K],
  source: S | undefined,
  key: K
) {
  if (value !== undefined) return value;
  if (source !== undefined) return source[key];
}
