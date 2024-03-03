# check-model

A simple validate model for `Form`;

`checkModel`, `Typescript`, `ValinaJS`

[中文](./README-zh.md)

## Install

```bash
npm i @zr-lib/check-model
```

## Using

### Form Data & Source

Define the `Source` and `Type` of form

**Tips：**

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

