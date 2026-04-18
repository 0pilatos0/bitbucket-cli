# PipelineRunnerState


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**status** | **string** | The current status of the runner. | [optional] [default to undefined]
**version** | [**PipelineRunnerVersion**](PipelineRunnerVersion.md) |  | [optional] [default to undefined]
**updated_on** | **string** | The timestamp when the runner state was last updated. | [optional] [default to undefined]
**cordoned** | **boolean** | Whether the runner is cordoned (prevented from accepting new steps). | [optional] [default to undefined]

## Example

```typescript
import { PipelineRunnerState } from './api';

const instance: PipelineRunnerState = {
    status,
    version,
    updated_on,
    cordoned,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
