# BranchingModelDevelopment


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**branch** | [**Branch**](Branch.md) |  | [optional] [default to undefined]
**name** | **string** | Name of the target branch. Will be listed here even when the target branch does not exist. Will be &#x60;null&#x60; if targeting the main branch and the repository is empty. | [default to undefined]
**use_mainbranch** | **boolean** | Indicates if the setting points at an explicit branch (&#x60;false&#x60;) or tracks the main branch (&#x60;true&#x60;). | [default to undefined]

## Example

```typescript
import { BranchingModelDevelopment } from './api';

const instance: BranchingModelDevelopment = {
    branch,
    name,
    use_mainbranch,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
