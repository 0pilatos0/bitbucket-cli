# PipelineRunnerOauthClient


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** | The OAuth client ID. | [optional] [default to undefined]
**secret** | **string** | The OAuth client secret. This is an optional element that is only provided once. | [optional] [default to undefined]
**token_endpoint** | **string** | The OAuth token endpoint URL. | [optional] [default to undefined]
**audience** | **string** | The intended audience for the OAuth token. | [optional] [default to undefined]

## Example

```typescript
import { PipelineRunnerOauthClient } from './api';

const instance: PipelineRunnerOauthClient = {
    id,
    secret,
    token_endpoint,
    audience,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
