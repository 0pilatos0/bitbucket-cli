# Branch


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [default to undefined]
**links** | **object** |  | [optional] [default to undefined]
**name** | **string** | The name of the ref. | [optional] [default to undefined]
**target** | [**Commit**](Commit.md) |  | [optional] [default to undefined]
**merge_strategies** | **Array&lt;string&gt;** | Available merge strategies for pull requests targeting this branch. | [optional] [default to undefined]
**default_merge_strategy** | **string** | The default merge strategy for pull requests targeting this branch. | [optional] [default to undefined]

## Example

```typescript
import { Branch } from './api';

const instance: Branch = {
    type,
    links,
    name,
    target,
    merge_strategies,
    default_merge_strategy,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
