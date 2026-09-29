# PullrequestMergeabilityChecks

The collection of checks that determine whether the specified pull request can be merged. Every check has a `type` identifying its shape - see `pullrequest_state_check`, `current_user_permission_check`, `git_mergeability_check`, `standard_merge_check`, `custom_merge_check`, and `merge_queue_check` for what each type covers.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**size** | **number** |  | [optional] [default to undefined]
**values** | [**Array&lt;PullrequestMergeabilityCheck&gt;**](PullrequestMergeabilityCheck.md) |  | [default to undefined]

## Example

```typescript
import { PullrequestMergeabilityChecks } from './api';

const instance: PullrequestMergeabilityChecks = {
    size,
    values,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
