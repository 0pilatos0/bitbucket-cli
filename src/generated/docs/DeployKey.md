# DeployKey


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**key** | **string** | The deploy key value. | [optional] [default to undefined]
**repository** | [**Repository**](Repository.md) |  | [optional] [default to undefined]
**comment** | **string** | The comment parsed from the deploy key (if present) | [optional] [default to undefined]
**label** | **string** | The user-defined label for the deploy key | [optional] [default to undefined]
**added_on** | **string** |  | [optional] [default to undefined]
**last_used** | **string** |  | [optional] [default to undefined]
**links** | **object** |  | [optional] [default to undefined]
**owner** | [**Account**](Account.md) |  | [optional] [default to undefined]

## Example

```typescript
import { DeployKey } from './api';

const instance: DeployKey = {
    key,
    repository,
    comment,
    label,
    added_on,
    last_used,
    links,
    owner,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
