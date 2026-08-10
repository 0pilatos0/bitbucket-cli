# SSHApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**usersSelectedUserSshKeysGet**](#usersselectedusersshkeysget) | **GET** /users/{selected_user}/ssh-keys | List SSH keys|
|[**usersSelectedUserSshKeysKeyIdDelete**](#usersselectedusersshkeyskeyiddelete) | **DELETE** /users/{selected_user}/ssh-keys/{key_id} | Delete a SSH key|
|[**usersSelectedUserSshKeysKeyIdGet**](#usersselectedusersshkeyskeyidget) | **GET** /users/{selected_user}/ssh-keys/{key_id} | Get a SSH key|
|[**usersSelectedUserSshKeysKeyIdPut**](#usersselectedusersshkeyskeyidput) | **PUT** /users/{selected_user}/ssh-keys/{key_id} | Update a SSH key|
|[**usersSelectedUserSshKeysPost**](#usersselectedusersshkeyspost) | **POST** /users/{selected_user}/ssh-keys | Add a new SSH key|

# **usersSelectedUserSshKeysGet**
> PaginatedSshUserKeys usersSelectedUserSshKeysGet()

Returns a paginated list of the user\'s SSH public keys.

### Example

```typescript
import {
    SSHApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SSHApi(configuration);

let selectedUser: string; //This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: `{account UUID}`.  (default to undefined)

const { status, data } = await apiInstance.usersSelectedUserSshKeysGet(
    selectedUser
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **selectedUser** | [**string**] | This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;.  | defaults to undefined|


### Return type

**PaginatedSshUserKeys**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A list of the SSH keys associated with the account. |  -  |
|**403** | If the specified user\&#39;s keys are not accessible to the current user |  -  |
|**404** | If the specified user does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **usersSelectedUserSshKeysKeyIdDelete**
> usersSelectedUserSshKeysKeyIdDelete()

Deletes a specific SSH public key from a user\'s account.

### Example

```typescript
import {
    SSHApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SSHApi(configuration);

let keyId: string; //The SSH key\'s UUID value. (default to undefined)
let selectedUser: string; //This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: `{account UUID}`.  (default to undefined)

const { status, data } = await apiInstance.usersSelectedUserSshKeysKeyIdDelete(
    keyId,
    selectedUser
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **keyId** | [**string**] | The SSH key\&#39;s UUID value. | defaults to undefined|
| **selectedUser** | [**string**] | This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | The key has been deleted |  -  |
|**400** | If the submitted key or related value is invalid |  -  |
|**403** | If the current user does not have permission to add a key for the specified user |  -  |
|**404** | If the specified user does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **usersSelectedUserSshKeysKeyIdGet**
> SshAccountKey usersSelectedUserSshKeysKeyIdGet()

Returns a specific SSH public key belonging to a user.

### Example

```typescript
import {
    SSHApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SSHApi(configuration);

let keyId: string; //The SSH key\'s UUID value. (default to undefined)
let selectedUser: string; //This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: `{account UUID}`.  (default to undefined)

const { status, data } = await apiInstance.usersSelectedUserSshKeysKeyIdGet(
    keyId,
    selectedUser
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **keyId** | [**string**] | The SSH key\&#39;s UUID value. | defaults to undefined|
| **selectedUser** | [**string**] | This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;.  | defaults to undefined|


### Return type

**SshAccountKey**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The specific SSH key matching the user and UUID |  -  |
|**403** | If the specified user or key is not accessible to the current user |  -  |
|**404** | If the specified user or key does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **usersSelectedUserSshKeysKeyIdPut**
> SshAccountKey usersSelectedUserSshKeysKeyIdPut()

Updates a specific SSH public key on a user\'s account  Note: Only the \'comment\' field can be updated using this API. To modify the key or comment values, you must delete and add the key again.  Example:  ``` $ curl -X PUT -H \"Content-Type: application/json\" -d \'{\"label\": \"Work key\"}\' https://api.bitbucket.org/2.0/users/{ed08f5e1-605b-4f4a-aee4-6c97628a673e}/ssh-keys/{b15b6026-9c02-4626-b4ad-b905f99f763a} ```

### Example

```typescript
import {
    SSHApi,
    Configuration,
    SshAccountKey
} from './api';

const configuration = new Configuration();
const apiInstance = new SSHApi(configuration);

let keyId: string; //The SSH key\'s UUID value. (default to undefined)
let selectedUser: string; //This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: `{account UUID}`.  (default to undefined)
let body: SshAccountKey; //The updated SSH key object (optional)

const { status, data } = await apiInstance.usersSelectedUserSshKeysKeyIdPut(
    keyId,
    selectedUser,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **SshAccountKey**| The updated SSH key object | |
| **keyId** | [**string**] | The SSH key\&#39;s UUID value. | defaults to undefined|
| **selectedUser** | [**string**] | This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;.  | defaults to undefined|


### Return type

**SshAccountKey**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The newly updated SSH key. |  -  |
|**400** | If the submitted key or related value is invalid |  -  |
|**403** | If the current user does not have permission to add a key for the specified user |  -  |
|**404** | If the specified user does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **usersSelectedUserSshKeysPost**
> SshAccountKey usersSelectedUserSshKeysPost()

Adds a new SSH public key to the specified user account and returns the resulting key.  Example:  ``` $ curl -X POST -H \"Content-Type: application/json\" -d \'{\"key\": \"ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKqP3Cr632C2dNhhgKVcon4ldUSAeKiku2yP9O9/bDtY user@myhost\"}\' https://api.bitbucket.org/2.0/users/{ed08f5e1-605b-4f4a-aee4-6c97628a673e}/ssh-keys ```

### Example

```typescript
import {
    SSHApi,
    Configuration,
    SshAccountKey
} from './api';

const configuration = new Configuration();
const apiInstance = new SSHApi(configuration);

let selectedUser: string; //This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: `{account UUID}`.  (default to undefined)
let expiresOn: string; //The date or date-time of when the key will expire, in [ISO-8601](https://en.wikipedia.org/wiki/ISO_8601) format. Example: `YYYY-MM-DDTHH:mm:ss.sssZ` (optional) (default to undefined)
let body: SshAccountKey; //The new SSH key object. Note that the username property has been deprecated due to [privacy changes](https://developer.atlassian.com/cloud/bitbucket/bitbucket-api-changes-gdpr/#removal-of-usernames-from-user-referencing-apis). (optional)

const { status, data } = await apiInstance.usersSelectedUserSshKeysPost(
    selectedUser,
    expiresOn,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **SshAccountKey**| The new SSH key object. Note that the username property has been deprecated due to [privacy changes](https://developer.atlassian.com/cloud/bitbucket/bitbucket-api-changes-gdpr/#removal-of-usernames-from-user-referencing-apis). | |
| **selectedUser** | [**string**] | This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;.  | defaults to undefined|
| **expiresOn** | [**string**] | The date or date-time of when the key will expire, in [ISO-8601](https://en.wikipedia.org/wiki/ISO_8601) format. Example: &#x60;YYYY-MM-DDTHH:mm:ss.sssZ&#x60; | (optional) defaults to undefined|


### Return type

**SshAccountKey**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The newly created SSH key. |  -  |
|**400** | If the submitted key or related value is invalid |  -  |
|**403** | If the current user does not have permission to add a key for the specified user |  -  |
|**404** | If the specified user does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

