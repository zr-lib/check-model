# check-model

A simple validate model for `Form`;

`checkModel`, `Typescript`, `ValinaJS`

English|[中文](./README-zh.md)

## Install

```bash
npm i @zr-lib/check-model
```

## Usage

### Form Data & Source

Define the `Source` and `Type` of form

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

### define checkModel

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
 

- getCurrentValue Function

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

### Using checkModel

#### Check Single Field

- 外部样式`class: error`调用`checkModel`下面的方法(key对应传入的数据key)，传入响应式的数据
- 内部显示`错误信息`直接引用`_state`下面的属性即可

这种情况不传第二个参数`source`，就不会在`页面引用`的地方被其他字段触发重新渲染了

> 调用`checkModel[key](data[key])`方法是为了响应式，调用`checkModel._state[key]`是为了方便多次引用，避免多次写很长的代码


- using in template
```html
<div
  class="edit-wrap"
  :class="{ error: saveInfo.clicked && checkModel.appId?.(currentConfig.appId || '') }"
  >
  <Input v-model:value="currentConfig.appId" placeholder="Required" />
  <div class="status-text error" v-if="saveInfo.clicked && checkModel._state.appId">
    {{ checkModel._state.appId }}
  </div>
</div>
```

```typescript
// use the reactive of "data.name"，inside the style "class: error"
checkModel.name?.(data.name);

// 这个是内部显示错误提示用，需要在响应式触发后使用，或者定义的时候使用reactive等包起来
checkModel._state.name; 
```

如果需要多处调用，使用`computed`/`useMemo`即可:
```typescript
const nameError = computed(() => checkModel.name(data.name));
```

#### check all field
print the result on Console

- trigger all field checking by default
```typescript
const hasError = checkModel._validate(data);
```

- only trigger some field checking
   - 适用于`多个tab`切换，只写一个`createCheckModel`就可以校验所有字段
   - `不同tab`传入对应的`checkConfig`即可

onyl check `name` fild like this
```typescript
const hasError = checkModel._validate(data, { name: true });
```

- the third parameter: extra
```typescript
const hasError = checkModel._validate(data, undefined, extra);
```

