# PipelineRunner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uuid** | **string** | The UUID identifying the runner. | [optional] [default to undefined]
**name** | **string** | The name of the runner. | [optional] [default to undefined]
**labels** | **Array&lt;string&gt;** | Labels assigned to the runner for identification and routing. | [optional] [default to undefined]
**state** | [**PipelineRunnerState**](PipelineRunnerState.md) |  | [optional] [default to undefined]
**created_on** | **string** | The timestamp when the runner was created. | [optional] [default to undefined]
**updated_on** | **string** | The timestamp when the runner was last updated. | [optional] [default to undefined]
**oauth_client** | [**PipelineRunnerOauthClient**](PipelineRunnerOauthClient.md) |  | [optional] [default to undefined]

## Example

```typescript
import { PipelineRunner } from './api';

const instance: PipelineRunner = {
    uuid,
    name,
    labels,
    state,
    created_on,
    updated_on,
    oauth_client,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
