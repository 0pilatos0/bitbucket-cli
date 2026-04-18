# ProjectBranchingModelBranchTypes


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**kind** | **string** | The kind of branch. | [default to undefined]
**prefix** | **string** | The prefix for this branch type. A branch with this prefix will be classified as per &#x60;kind&#x60;. The prefix must be a valid prefix for a branch and must always exist. It cannot be blank, empty or &#x60;null&#x60;. | [default to undefined]

## Example

```typescript
import { ProjectBranchingModelBranchTypes } from './api';

const instance: ProjectBranchingModelBranchTypes = {
    kind,
    prefix,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
