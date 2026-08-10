# ProjectDeployKey


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**key** | **string** | The deploy key value. | [optional] [default to undefined]
**project** | [**Project**](Project.md) |  | [optional] [default to undefined]
**comment** | **string** | The comment parsed from the deploy key (if present) | [optional] [default to undefined]
**label** | **string** | The user-defined label for the deploy key | [optional] [default to undefined]
**added_on** | **string** |  | [optional] [default to undefined]
**last_used** | **string** |  | [optional] [default to undefined]
**links** | **object** |  | [optional] [default to undefined]
**created_by** | [**Account**](Account.md) |  | [optional] [default to undefined]

## Example

```typescript
import { ProjectDeployKey } from './api';

const instance: ProjectDeployKey = {
    key,
    project,
    comment,
    label,
    added_on,
    last_used,
    links,
    created_by,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
