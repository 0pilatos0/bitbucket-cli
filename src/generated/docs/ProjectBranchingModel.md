# ProjectBranchingModel


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**branch_types** | [**Set&lt;ProjectBranchingModelBranchTypes&gt;**](ProjectBranchingModelBranchTypes.md) | The active branch types. | [optional] [default to undefined]
**development** | [**ProjectBranchingModelDevelopment**](ProjectBranchingModelDevelopment.md) |  | [optional] [default to undefined]
**production** | [**ProjectBranchingModelDevelopment**](ProjectBranchingModelDevelopment.md) |  | [optional] [default to undefined]

## Example

```typescript
import { ProjectBranchingModel } from './api';

const instance: ProjectBranchingModel = {
    branch_types,
    development,
    production,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
