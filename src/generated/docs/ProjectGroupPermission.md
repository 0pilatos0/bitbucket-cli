# ProjectGroupPermission

A group\'s permission for a given project.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [default to undefined]
**links** | **object** |  | [optional] [default to undefined]
**permission** | **string** |  | [optional] [default to undefined]
**group** | [**Group**](Group.md) |  | [optional] [default to undefined]
**project** | [**Project**](Project.md) |  | [optional] [default to undefined]

## Example

```typescript
import { ProjectGroupPermission } from './api';

const instance: ProjectGroupPermission = {
    type,
    links,
    permission,
    group,
    project,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
