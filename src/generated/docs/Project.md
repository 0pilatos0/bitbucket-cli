# Project


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**links** | **object** |  | [optional] [default to undefined]
**uuid** | **string** | The project\&#39;s immutable id. | [optional] [default to undefined]
**key** | **string** | The project\&#39;s key. | [optional] [default to undefined]
**owner** | [**Team**](Team.md) |  | [optional] [default to undefined]
**name** | **string** | The name of the project. | [optional] [default to undefined]
**description** | **string** |  | [optional] [default to undefined]
**is_private** | **boolean** |  Indicates whether the project is publicly accessible, or whether it is private to the team and consequently only visible to team members. Note that private projects cannot contain public repositories. | [optional] [default to undefined]
**created_on** | **string** |  | [optional] [default to undefined]
**updated_on** | **string** |  | [optional] [default to undefined]
**has_publicly_visible_repos** | **boolean** |  Indicates whether the project contains publicly visible repositories. Note that private projects cannot contain public repositories. | [optional] [default to undefined]

## Example

```typescript
import { Project } from './api';

const instance: Project = {
    links,
    uuid,
    key,
    owner,
    name,
    description,
    is_private,
    created_on,
    updated_on,
    has_publicly_visible_repos,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
