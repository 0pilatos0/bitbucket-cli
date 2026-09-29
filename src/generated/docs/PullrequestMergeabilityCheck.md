# PullrequestMergeabilityCheck

A mergeability check. The `type` identifies the concrete check and its additional fields.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [default to undefined]
**status** | **string** | Whether this check passed. &#x60;UNKNOWN&#x60; means the check could not be evaluated; it does not establish that the pull request is mergeable. | [default to undefined]
**required** | **boolean** | Whether this check must pass for the pull request to be mergeable. | [default to undefined]
**blocking** | **boolean** | Whether this check is currently preventing the pull request from being merged. | [default to undefined]

## Example

```typescript
import { PullrequestMergeabilityCheck } from './api';

const instance: PullrequestMergeabilityCheck = {
    type,
    status,
    required,
    blocking,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
