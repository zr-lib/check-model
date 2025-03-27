type HasErrorFn<V = any, S = any, Extra = any> = (value: V, source?: S, extras?: Extra) => string | boolean;
type ErrorModel<S, Extra> = {
    [K in keyof S]?: HasErrorFn<K extends keyof S ? S[K] : any, S, Extra>;
};
/**
 * 返回字段错误校验Model（范型传递）
 * @description
 * - 校验方法返回错误原因；false/''则视为无错误
 * - 如果要显示错误原因就不要返回true
 */
export declare function createCheckModel<S extends Record<string, any>, Extra extends Record<string, any> = any>(model: ErrorModel<S, Extra>): ErrorModel<S, Extra> & {
    /** 错误信息 */
    _state: Partial<Record<keyof S, string | boolean>>;
    /** @returns true: hasError */
    _validate: (source: S, checkConfig?: Partial<Record<keyof S, boolean>>, extras?: Extra) => boolean;
    /** 清空_state记录的错误信息 */
    _clearValidate: () => void;
};
/** 返回当前应该取值的数据来源 */
export declare function getCurrentValue<K extends keyof S, S extends Record<string, any>>(value: S[K], source: S | undefined, key: K): S[K] | undefined;
export {};
