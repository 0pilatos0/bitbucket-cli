# PullRequestBranch


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** |  | [optional] [default to undefined]
**merge_strategies** | **Array&lt;string&gt;** | Available merge strategies, when this endpoint is the destination of the pull request. | [optional] [default to undefined]
**default_merge_strategy** | **string** | The default merge strategy, when this endpoint is the destination of the pull request. | [optional] [default to undefined]

## Example

```typescript
import { PullRequestBranch } from './api';

const instance: PullRequestBranch = {
    name,
    merge_strategies,
    default_merge_strategy,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
