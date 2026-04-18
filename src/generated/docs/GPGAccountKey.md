# GPGAccountKey


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**owner** | [**Account**](Account.md) |  | [optional] [default to undefined]
**key** | **string** | The GPG key value in X format. | [optional] [default to undefined]
**key_id** | **string** | The unique identifier for the GPG key | [optional] [default to undefined]
**fingerprint** | **string** | The GPG key fingerprint. | [optional] [default to undefined]
**parent_fingerprint** | **string** | The fingerprint of the parent key. This value is null unless the current key is a subkey. | [optional] [default to undefined]
**name** | **string** | The user-defined label for the GPG key | [optional] [default to undefined]
**expires_on** | **string** |  | [optional] [default to undefined]
**created_on** | **string** |  | [optional] [default to undefined]
**added_on** | **string** |  | [optional] [default to undefined]
**last_used** | **string** |  | [optional] [default to undefined]
**subkeys** | [**Set&lt;GPGAccountKey&gt;**](GPGAccountKey.md) |  | [optional] [default to undefined]
**links** | [**BranchingModelSettingsLinks**](BranchingModelSettingsLinks.md) |  | [optional] [default to undefined]

## Example

```typescript
import { GPGAccountKey } from './api';

const instance: GPGAccountKey = {
    owner,
    key,
    key_id,
    fingerprint,
    parent_fingerprint,
    name,
    expires_on,
    created_on,
    added_on,
    last_used,
    subkeys,
    links,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
