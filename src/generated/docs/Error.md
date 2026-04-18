# ModelError

Base type for most resource objects. It defines the common `type` element that identifies an object\'s type. It also identifies the element as Swagger\'s `discriminator`.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [default to undefined]
**error** | [**ErrorError**](ErrorError.md) |  | [optional] [default to undefined]

## Example

```typescript
import { ModelError } from './api';

const instance: ModelError = {
    type,
    error,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
