# Ref

A ref object, representing a branch or tag in a repository.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [default to undefined]
**links** | **object** |  | [optional] [default to undefined]
**name** | **string** | The name of the ref. | [optional] [default to undefined]
**target** | [**Commit**](Commit.md) |  | [optional] [default to undefined]

## Example

```typescript
import { Ref } from './api';

const instance: Ref = {
    type,
    links,
    name,
    target,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
