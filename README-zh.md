# check-model


一个`Form`表单极简的字段校验模型，框架无关，`Typescript`支持

## 安装

```bash
npm i @zr/check-model
```

## 实现 createCheckModel

- 在字段校验方法内
   - 建议`value`的取值在`source[key]`取值之前，这样在模板调用的时候只要传`value`就可以了，防止在外面**页面渲染**调用时其他字段改动而触发校验
   - `value`如果是`undefined`才会使用到`source`
   - 如果**同一个字段**在不同tab有**不同的规则**，此时字段校验方法可以传入第三个参数`extras`，类型手动指定；然后**注意**调用`_validate`方法的时候也要传入
- `createCheckModel`的参数会根据`Source`自动推导校验字段对应的**方法参数类型**；**深层key校验**可以看下文`DeepKeyType`
- 使用`createCheckModel`创建`checkModel`，**定义**或者**调用**字段校验方法都会有**类型提示**与**类型校验**
- 校验方法支持返回`boolean`/`string`，方便直接显示错误；注意不要返回`true`
- 内部定义的`_state`对象：
   - **记录上次的字段校验状态**；
   - 存储一些`上次调用checkModel[key](data[key])`校验的结果；
   - `_state`的`key`与`checkModel`的`key`一致
- 内部定义的`_validate(source: S, checkConfig?: Partial<Record<keyof S, boolean>>, extras?: any)`方法：
   - 校验是否存在错误，打印所有校验错误的提示
   - `checkConfig`不传时，默认触发全部字段的校验方法
   - **支持多个tab**但是字段不一样的**选定字段**校验，`checkConfig`传入**不同tab**需要校验的key，此时只会触发对应字段的校验方法，就可以在一个 `createCheckModel`下定义所有字段的校验方法了
   - 如果**同一个字段**在不同tab有**不同的规则**，此时字段校验方法可以传入第三个参数`extras`，此处也需要传入；这个参数最好是一个对象，其他字段在`_validate`方法传入的是一样的，方便不同取值
> **关于Promise**：一般检查重名等可能需要提前请求，手动写检查方法另外判断即可，这种情况比较少，基本就一个字段需要


```typescript
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
 * - 校验方法返回错误原因；false/''则视为无错误；
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

  return { ...model, _state, _validate };
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

```

## 使用 createCheckModel

### 表单数据与Source

定义当前`Source`表单类型与数据`data`

**注意：**

- 有时候一个字段的数据是一个对象，然后里面也有**多个内部字段**需要校验，
- 一般会扁平展开只设置一层如`content.length`/`content.type`，
   - 因为本身是不存在`content.length`这个`key`的，
   - 需要在定义`Source`的时候手动加上类型补充`DeepKeyType`，**所有字段都可选-绕过**`data`类型定义；
   - 调用字段校验方法时，传入正确的数据`data.content.length`，而不是`data['content.length']`


```typescript
type DataType = {
  name: string;
  id: number;
  content: {
    length: number;
    type: 'string' | 'boolean';
  };
};
type DeepKeyType = {
  // 这里的深层key实际上data数据里面是不存在的，注意传递相应的数据
  'content.length'?: DataType['content']['length'];
  'content.type'?: DataType['content']['type'];
};

type Source = DataType & DeepKeyType;

const data = reactive<Source>({
  name: '',
  id: 0,
  content: {
    length: 1,
    type: 'boolean'
  }
});
```

### 创建 checkModel

创建后，导出供外部代码调用校验
> `checkModel`的`key`跟对应的`方法`，在**编写校验代码**与**调用校验方法**时都会有自动补全和类型校验

字段校验方法内注意未传值`undefined`的处理

- 单个字段时，字段校验方法的`source`参数为`undefined`
- 调用`_validate`方法时，字段校验方法的`value`参数为`undefined`
- 如id字段的校验，使用到了**第三个参数**`extra`；
   - 一般可能**多个字段**都需要`extra`，此时最好传对象，这样多个字段可以按需取值
   - 在调用单个字段校验方法时传参如：`checkModel.id(data.id, undefined, extra)`
```typescript

type Extra = { appType: AppType };

enum AppType {
  six = 1,
  eight = 2
}

export function checkId(type: AppType, id: number) {
  if (!/^[0-9+]+$/.test(id + '')) return '请输入数字整数';
  if (type === AppType.six) return `${id}`.length > 6 ? 'id不能超过6位数字' : '';
  if (type === AppType.eight) return `${id}`.length > 8 ? 'id不能超过8位数字' : '';
  return '';
}

const checkModel = createCheckModel<Source, Extra>({
  name: (value, source) => {
    if (value !== undefined && !value) return '不能为空';
    if (source !== undefined && !source?.name) return '不能为空';
    return '不能为空';
  },
  id: (value, source, extra) => {
    const { appType } = extra || {};
    const currentValue = getCurrentValue(value, source, 'id');
    return !currentValue ? '不能为空' : checkId(appType!, currentValue);
  },
  content: (value, source) => {
    if (value !== undefined && !value) return '不能为空';
    if (source !== undefined && !source?.content) return '不能为空';
    return '不能为空';
  },
  'content.length': (value, source) => {
    if (value !== undefined && !value) return '不能为空';
    if (source !== undefined && !source?.content.length) return '不能为空';
    return '不能为空';
  },
  'content.type': (value, source) => {
    if (value !== undefined && !value) return '不能为空';
    if (source !== undefined && !source?.content.type) return '不能为空';
    return '不能为空';
  }
});
```
 

- getCurrentValue 辅助函数

使用 `getCurrentValue`如下，只需要一个`currentValue`，不用管从`value`还是`source`取值
```typescript
const checkModel = createCheckModel<Source, Extra>({
  id: (value, source, extra) => {
    const { appType } = extra || {};
    const currentValue = getCurrentValue(value, source, 'id');
    return !currentValue ? '不能为空' : checkId(appType!, currentValue);
    // if (value !== undefined) return checkId(appType!, value);
    // if (source !== undefined) return checkId(appType!, source.id);
    // return '不能为空';
  },
  // ...
}
```

### 使用 checkModel

#### 检查单个字段

- 外部样式`class: error`调用`checkModel`下面的方法(key对应传入的数据key)，传入响应式的数据
- 内部显示`错误信息`直接引用`_state`下面的属性即可

这种情况不传第二个参数`source`，就不会在`页面引用`的地方被其他字段触发重新渲染了

> 调用`checkModel[key](data[key])`方法是为了响应式，调用`checkModel._state[key]`是为了方便多次引用，避免多次写很长的代码


- 模板使用
```html
<div
  class="edit-wrap"
  :class="{ error: saveInfo.clicked && checkModel.appId?.(currentConfig.appId || '') }"
  >
  <Input v-model:value="currentConfig.appId" placeholder="必填" />
  <div class="status-text error" v-if="saveInfo.clicked && checkModel._state.appId">
    {{ checkModel._state.appId }}
  </div>
</div>
```

```typescript
// 这个是利用data.name的响应式触发，一般是外部样式class: error的地方用
checkModel.name?.(data.name);

// 这个是内部显示错误提示用，需要在响应式触发后使用，或者定义的时候使用reactive等包起来
checkModel._state.name; 
```

如果需要多处调用，使用`computed`/`useMemo`即可:
```typescript
const nameError = computed(() => checkModel.name(data.name));
```

#### 检查所有字段
同时会打印所有校验结果到控制台

- 默认触发所有字段校验方法
```typescript
const hasError = checkModel._validate(data);
```

- 只触发部分字段校验方法
   - 适用于`多个tab`切换，只写一个`createCheckModel`就可以校验所有字段
   - `不同tab`传入对应的`checkConfig`即可

如下只校验`name`字段
```typescript
const hasError = checkModel._validate(data, { name: true });
```

- 第三个参数extra
```typescript
const hasError = checkModel._validate(data, undefined, extra);
```


