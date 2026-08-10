# RepositoryGroupPermission

A group\'s permission for a given repository.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [default to undefined]
**links** | **object** |  | [optional] [default to undefined]
**permission** | **string** |  | [optional] [default to undefined]
**group** | [**Group**](Group.md) |  | [optional] [default to undefined]
**repository** | [**Repository**](Repository.md) |  | [optional] [default to undefined]

## Example

```typescript
import { RepositoryGroupPermission } from './api';

const instance: RepositoryGroupPermission = {
    type,
    links,
    permission,
    group,
    repository,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
