# ErrorError


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**message** | **string** |  | [default to undefined]
**detail** | **string** |  | [optional] [default to undefined]
**data** | **{ [key: string]: any; }** | Optional structured data that is endpoint-specific. | [optional] [default to undefined]

## Example

```typescript
import { ErrorError } from './api';

const instance: ErrorError = {
    message,
    detail,
    data,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
