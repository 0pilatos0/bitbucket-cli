# GPGApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**usersSelectedUserGpgKeysFingerprintDelete**](#usersselectedusergpgkeysfingerprintdelete) | **DELETE** /users/{selected_user}/gpg-keys/{fingerprint} | Delete a GPG key|
|[**usersSelectedUserGpgKeysFingerprintGet**](#usersselectedusergpgkeysfingerprintget) | **GET** /users/{selected_user}/gpg-keys/{fingerprint} | Get a GPG key|
|[**usersSelectedUserGpgKeysGet**](#usersselectedusergpgkeysget) | **GET** /users/{selected_user}/gpg-keys | List GPG keys|
|[**usersSelectedUserGpgKeysPost**](#usersselectedusergpgkeyspost) | **POST** /users/{selected_user}/gpg-keys | Add a new GPG key|

# **usersSelectedUserGpgKeysFingerprintDelete**
> usersSelectedUserGpgKeysFingerprintDelete()

Deletes a specific GPG public key from a user\'s account.

### Example

```typescript
import {
    GPGApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new GPGApi(configuration);

let fingerprint: string; //A GPG key fingerprint.  (default to undefined)
let selectedUser: string; //This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: `{account UUID}`.  (default to undefined)

const { status, data } = await apiInstance.usersSelectedUserGpgKeysFingerprintDelete(
    fingerprint,
    selectedUser
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fingerprint** | [**string**] | A GPG key fingerprint.  | defaults to undefined|
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
|**403** | If the current user does not have permission to delete a key for the specified user, or the submitted key is a subkey |  -  |
|**404** | If the specified key does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **usersSelectedUserGpgKeysFingerprintGet**
> GPGAccountKey usersSelectedUserGpgKeysFingerprintGet()

Returns a specific GPG public key belonging to a user. The `key` and `subkeys` fields can also be requested from the endpoint. See [Partial Responses](/cloud/bitbucket/rest/intro/#partial-response) for more details.

### Example

```typescript
import {
    GPGApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new GPGApi(configuration);

let fingerprint: string; //A GPG key fingerprint.  (default to undefined)
let selectedUser: string; //This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: `{account UUID}`.  (default to undefined)

const { status, data } = await apiInstance.usersSelectedUserGpgKeysFingerprintGet(
    fingerprint,
    selectedUser
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fingerprint** | [**string**] | A GPG key fingerprint.  | defaults to undefined|
| **selectedUser** | [**string**] | This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;.  | defaults to undefined|


### Return type

**GPGAccountKey**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The specific GPG key matching the user and fingerprint. |  -  |
|**403** | If the specified user\&#39;s keys are not accessible to the current user |  -  |
|**404** | If the specified user does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **usersSelectedUserGpgKeysGet**
> PaginatedGpgUserKeys usersSelectedUserGpgKeysGet()

Returns a paginated list of the user\'s GPG public keys. The `key` and `subkeys` fields can also be requested from the endpoint. See [Partial Responses](/cloud/bitbucket/rest/intro/#partial-response) for more details.

### Example

```typescript
import {
    GPGApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new GPGApi(configuration);

let selectedUser: string; //This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: `{account UUID}`.  (default to undefined)

const { status, data } = await apiInstance.usersSelectedUserGpgKeysGet(
    selectedUser
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **selectedUser** | [**string**] | This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;.  | defaults to undefined|


### Return type

**PaginatedGpgUserKeys**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A list of the GPG keys associated with the account. |  -  |
|**403** | If the specified user\&#39;s keys are not accessible to the current user |  -  |
|**404** | If the specified user does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **usersSelectedUserGpgKeysPost**
> GPGAccountKey usersSelectedUserGpgKeysPost()

Adds a new GPG public key to the specified user account and returns the resulting key.  Example:  ``` $ curl -X POST -H \"Content-Type: application/json\" -d \'{\"key\": \"<insert GPG Key>\"}\' https://api.bitbucket.org/2.0/users/{d7dd0e2d-3994-4a50-a9ee-d260b6cefdab}/gpg-keys ```

### Example

```typescript
import {
    GPGApi,
    Configuration,
    GPGAccountKey
} from './api';

const configuration = new Configuration();
const apiInstance = new GPGApi(configuration);

let selectedUser: string; //This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: `{account UUID}`.  (default to undefined)
let body: GPGAccountKey; //The new GPG key object. (optional)

const { status, data } = await apiInstance.usersSelectedUserGpgKeysPost(
    selectedUser,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **GPGAccountKey**| The new GPG key object. | |
| **selectedUser** | [**string**] | This can either be an Atlassian Account ID OR the UUID of the account, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;.  | defaults to undefined|


### Return type

**GPGAccountKey**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The newly created GPG key. |  -  |
|**400** | If the submitted key or related value is invalid |  -  |
|**403** | If the current user does not have permission to add a key for the specified user |  -  |
|**404** | If the specified user does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

