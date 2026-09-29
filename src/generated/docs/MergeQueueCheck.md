# MergeQueueCheck


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [default to undefined]
**required** | **boolean** | Whether the destination branch currently requires queueing. | [default to undefined]
**blocking** | **boolean** | Whether this check is currently preventing the pull request from being merged. | [default to undefined]
**queued** | **boolean** | Whether the pull request is already queued, according to its current lifecycle state. | [default to undefined]
**merge_queue** | [**MergeQueue**](MergeQueue.md) |  | [default to undefined]

## Example

```typescript
import { MergeQueueCheck } from './api';

const instance: MergeQueueCheck = {
    type,
    required,
    blocking,
    queued,
    merge_queue,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
