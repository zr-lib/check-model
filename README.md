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

export and it can using every where
> `checkModel` has `key` Function, and parameter type checking, Typescript support

Handling of `undefined` values not passed in field validation methods

- When using a single field, the `source` parameter of the field validation method is `undefined`
- When calling the `_validate` method, the `value` parameter of the field validation method is `undefined`
- For the verification of the ID field, the third parameter `extra` was used;
   - Generally, multiple fields may require 'extra'. In this case, it is best to pass the object so that multiple fields can take values as needed
   - When calling a single field validation method, passing parameters such as: `checkModel.id(data.id, undefined, extra)`
     
```typescript

type Extra = { appType: AppType };

enum AppType {
  six = 1,
  eight = 2
}

export function checkId(type: AppType, id: number) {
  if (!/^[0-9+]+$/.test(id + '')) return 'should input integer';
  if (type === AppType.six) return `${id}`.length > 6 ? 'length of id can not more than six' : '';
  if (type === AppType.eight) return `${id}`.length > 8 ? 'length of id can not more than eight' : '';
  return '';
}

const checkModel = createCheckModel<Source, Extra>({
  name: (value, source) => {
    if (value !== undefined && !value) return 'can not be empty';
    if (source !== undefined && !source?.name) return 'can not be empty';
    return 'can not be empty';
  },
  id: (value, source, extra) => {
    const { appType } = extra || {};
    const currentValue = getCurrentValue(value, source, 'id');
    return !currentValue ? 'can not be empty' : checkId(appType!, currentValue);
  },
  content: (value, source) => {
    if (value !== undefined && !value) return 'can not be empty';
    if (source !== undefined && !source?.content) return 'can not be empty';
    return 'can not be empty';
  },
  'content.length': (value, source) => {
    if (value !== undefined && !value) return 'can not be empty';
    if (source !== undefined && !source?.content.length) return 'can not be empty';
    return 'can not be empty';
  },
  'content.type': (value, source) => {
    if (value !== undefined && !value) return 'can not be empty';
    if (source !== undefined && !source?.content.type) return 'can not be empty';
    return 'can not be empty';
  }
});
```
 

- getCurrentValue Function

```typescript
const checkModel = createCheckModel<Source, Extra>({
  id: (value, source, extra) => {
    const { appType } = extra || {};
    const currentValue = getCurrentValue(value, source, 'id');
    return !currentValue ? 'can not be empty' : checkId(appType!, currentValue);
    // if (value !== undefined) return checkId(appType!, value);
    // if (source !== undefined) return checkId(appType!, source.id);
    // return 'can not be empty';
  },
  // ...
}
```

### Using checkModel

#### Check Single Field

- Wrapper element `class: error` should use function `checkModel[key](data[key])`，with reactive data;
  - Make sure not pass Source parameter here, or it will rerender when other field of Source changed
- Child element to `show error text` can use `_state[key]`


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
// using the reactive of "data.name"，inside the style "class: error"
checkModel.name?.(data.name);

// no reactive; should using after reactive data, like child element
checkModel._state.name; 
```

using in some place，see `computed`/`useMemo`
```typescript
const nameError = computed(() => checkModel.name(data.name));
```

#### Check all field
print the result on Console

- trigger all field checking by default
```typescript
const hasError = checkModel._validate(data);
```

- only trigger some field checking
   - tabs，one `createCheckModel` to check all field
   - different `tab` use own `checkConfig`

For example, onyl check `name` fild like this
```typescript
const hasError = checkModel._validate(data, { name: true });
```

- the third parameter: extra
```typescript
const hasError = checkModel._validate(data, undefined, extra);
```

