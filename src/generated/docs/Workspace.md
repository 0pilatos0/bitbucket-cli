# Workspace


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**links** | **object** |  | [optional] [default to undefined]
**uuid** | **string** | The workspace\&#39;s immutable id. | [optional] [default to undefined]
**name** | **string** | The name of the workspace. | [optional] [default to undefined]
**slug** | **string** | The short label that identifies this workspace. | [optional] [default to undefined]
**is_private** | **boolean** | Indicates whether the workspace is publicly accessible, or whether it is private to the members and consequently only visible to members. | [optional] [default to undefined]
**is_personal** | **boolean** | Indicates whether the workspace belongs to an individual user. | [optional] [default to undefined]
**is_privacy_enforced** | **boolean** | Indicates whether the workspace enforces private content, or whether it allows public content. | [optional] [default to undefined]
**forking_mode** | **string** | Controls the rules for forking repositories within this workspace.  * **allow_forks**: unrestricted forking * **internal_only**: prevents forking of private repositories outside the workspace or to public repositories  | [optional] [default to undefined]
**created_on** | **string** |  | [optional] [default to undefined]
**updated_on** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { Workspace } from './api';

const instance: Workspace = {
    links,
    uuid,
    name,
    slug,
    is_private,
    is_personal,
    is_privacy_enforced,
    forking_mode,
    created_on,
    updated_on,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
