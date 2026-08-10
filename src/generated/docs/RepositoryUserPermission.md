# RepositoryUserPermission

A user\'s direct permission for a given repository.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [default to undefined]
**permission** | **string** |  | [optional] [default to undefined]
**user** | [**User**](User.md) |  | [optional] [default to undefined]
**repository** | [**Repository**](Repository.md) |  | [optional] [default to undefined]
**links** | **object** |  | [optional] [default to undefined]

## Example

```typescript
import { RepositoryUserPermission } from './api';

const instance: RepositoryUserPermission = {
    type,
    permission,
    user,
    repository,
    links,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
