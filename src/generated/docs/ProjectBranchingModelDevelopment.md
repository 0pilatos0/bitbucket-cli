# ProjectBranchingModelDevelopment


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Name of the target branch. If inherited by a repository, it will default to the main branch if the specified branch does not exist. | [default to undefined]
**use_mainbranch** | **boolean** | Indicates if the setting points at an explicit branch (&#x60;false&#x60;) or tracks the main branch (&#x60;true&#x60;). | [default to undefined]

## Example

```typescript
import { ProjectBranchingModelDevelopment } from './api';

const instance: ProjectBranchingModelDevelopment = {
    name,
    use_mainbranch,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
