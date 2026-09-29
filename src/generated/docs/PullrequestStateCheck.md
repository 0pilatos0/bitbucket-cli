# PullrequestStateCheck


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [default to undefined]
**state** | **string** | The public state of the pull request. Note that a queued pull request is reported as &#x60;OPEN&#x60; here but as &#x60;blocking: true&#x60;, since it cannot be merged again while a merge is already in progress. | [default to undefined]

## Example

```typescript
import { PullrequestStateCheck } from './api';

const instance: PullrequestStateCheck = {
    type,
    state,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
