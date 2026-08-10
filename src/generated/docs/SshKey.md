# SshKey


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uuid** | **string** | The SSH key\&#39;s immutable ID. | [optional] [default to undefined]
**key** | **string** | The SSH public key value in OpenSSH format. | [optional] [default to undefined]
**comment** | **string** | The comment parsed from the SSH key (if present) | [optional] [default to undefined]
**label** | **string** | The user-defined label for the SSH key | [optional] [default to undefined]
**created_on** | **string** |  | [optional] [default to undefined]
**last_used** | **string** |  | [optional] [default to undefined]
**links** | **object** |  | [optional] [default to undefined]

## Example

```typescript
import { SshKey } from './api';

const instance: SshKey = {
    uuid,
    key,
    comment,
    label,
    created_on,
    last_used,
    links,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
