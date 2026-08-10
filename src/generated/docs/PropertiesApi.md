# PropertiesApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**deleteCommitHostedPropertyValue**](#deletecommithostedpropertyvalue) | **DELETE** /repositories/{workspace}/{repo_slug}/commit/{commit}/properties/{app_key}/{property_name} | Delete a commit application property|
|[**deletePullRequestHostedPropertyValue**](#deletepullrequesthostedpropertyvalue) | **DELETE** /repositories/{workspace}/{repo_slug}/pullrequests/{pullrequest_id}/properties/{app_key}/{property_name} | Delete a pull request application property|
|[**deleteRepositoryHostedPropertyValue**](#deleterepositoryhostedpropertyvalue) | **DELETE** /repositories/{workspace}/{repo_slug}/properties/{app_key}/{property_name} | Delete a repository application property|
|[**deleteUserHostedPropertyValue**](#deleteuserhostedpropertyvalue) | **DELETE** /users/{selected_user}/properties/{app_key}/{property_name} | Delete a user application property|
|[**getCommitHostedPropertyValue**](#getcommithostedpropertyvalue) | **GET** /repositories/{workspace}/{repo_slug}/commit/{commit}/properties/{app_key}/{property_name} | Get a commit application property|
|[**getPullRequestHostedPropertyValue**](#getpullrequesthostedpropertyvalue) | **GET** /repositories/{workspace}/{repo_slug}/pullrequests/{pullrequest_id}/properties/{app_key}/{property_name} | Get a pull request application property|
|[**getRepositoryHostedPropertyValue**](#getrepositoryhostedpropertyvalue) | **GET** /repositories/{workspace}/{repo_slug}/properties/{app_key}/{property_name} | Get a repository application property|
|[**retrieveUserHostedPropertyValue**](#retrieveuserhostedpropertyvalue) | **GET** /users/{selected_user}/properties/{app_key}/{property_name} | Get a user application property|
|[**updateCommitHostedPropertyValue**](#updatecommithostedpropertyvalue) | **PUT** /repositories/{workspace}/{repo_slug}/commit/{commit}/properties/{app_key}/{property_name} | Update a commit application property|
|[**updatePullRequestHostedPropertyValue**](#updatepullrequesthostedpropertyvalue) | **PUT** /repositories/{workspace}/{repo_slug}/pullrequests/{pullrequest_id}/properties/{app_key}/{property_name} | Update a pull request application property|
|[**updateRepositoryHostedPropertyValue**](#updaterepositoryhostedpropertyvalue) | **PUT** /repositories/{workspace}/{repo_slug}/properties/{app_key}/{property_name} | Update a repository application property|
|[**updateUserHostedPropertyValue**](#updateuserhostedpropertyvalue) | **PUT** /users/{selected_user}/properties/{app_key}/{property_name} | Update a user application property|

# **deleteCommitHostedPropertyValue**
> deleteCommitHostedPropertyValue()

Delete an [application property](/cloud/bitbucket/application-properties/) value stored against a commit.

### Example

```typescript
import {
    PropertiesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PropertiesApi(configuration);

let workspace: string; //The repository container; either the workspace slug or the UUID in curly braces. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let commit: string; //The commit. (default to undefined)
let appKey: string; //The key of the Connect app. (default to undefined)
let propertyName: string; //The name of the property. (default to undefined)

const { status, data } = await apiInstance.deleteCommitHostedPropertyValue(
    workspace,
    repoSlug,
    commit,
    appKey,
    propertyName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | The repository container; either the workspace slug or the UUID in curly braces. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **commit** | [**string**] | The commit. | defaults to undefined|
| **appKey** | [**string**] | The key of the Connect app. | defaults to undefined|
| **propertyName** | [**string**] | The name of the property. | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | An empty response. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deletePullRequestHostedPropertyValue**
> deletePullRequestHostedPropertyValue()

Delete an [application property](/cloud/bitbucket/application-properties/) value stored against a pull request.

### Example

```typescript
import {
    PropertiesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PropertiesApi(configuration);

let workspace: string; //The repository container; either the workspace slug or the UUID in curly braces. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pullrequestId: string; //The pull request ID. (default to undefined)
let appKey: string; //The key of the Connect app. (default to undefined)
let propertyName: string; //The name of the property. (default to undefined)

const { status, data } = await apiInstance.deletePullRequestHostedPropertyValue(
    workspace,
    repoSlug,
    pullrequestId,
    appKey,
    propertyName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | The repository container; either the workspace slug or the UUID in curly braces. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **pullrequestId** | [**string**] | The pull request ID. | defaults to undefined|
| **appKey** | [**string**] | The key of the Connect app. | defaults to undefined|
| **propertyName** | [**string**] | The name of the property. | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | An empty response. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteRepositoryHostedPropertyValue**
> deleteRepositoryHostedPropertyValue()

Delete an [application property](/cloud/bitbucket/application-properties/) value stored against a repository.

### Example

```typescript
import {
    PropertiesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PropertiesApi(configuration);

let workspace: string; //The repository container; either the workspace slug or the UUID in curly braces. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let appKey: string; //The key of the Connect app. (default to undefined)
let propertyName: string; //The name of the property. (default to undefined)

const { status, data } = await apiInstance.deleteRepositoryHostedPropertyValue(
    workspace,
    repoSlug,
    appKey,
    propertyName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | The repository container; either the workspace slug or the UUID in curly braces. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **appKey** | [**string**] | The key of the Connect app. | defaults to undefined|
| **propertyName** | [**string**] | The name of the property. | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | An empty response. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteUserHostedPropertyValue**
> deleteUserHostedPropertyValue()

Delete an [application property](/cloud/bitbucket/application-properties/) value stored against a user.

### Example

```typescript
import {
    PropertiesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PropertiesApi(configuration);

let selectedUser: string; //Either the UUID of the account surrounded by curly-braces, for example `{account UUID}`, OR an Atlassian Account ID. (default to undefined)
let appKey: string; //The key of the Connect app. (default to undefined)
let propertyName: string; //The name of the property. (default to undefined)

const { status, data } = await apiInstance.deleteUserHostedPropertyValue(
    selectedUser,
    appKey,
    propertyName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **selectedUser** | [**string**] | Either the UUID of the account surrounded by curly-braces, for example &#x60;{account UUID}&#x60;, OR an Atlassian Account ID. | defaults to undefined|
| **appKey** | [**string**] | The key of the Connect app. | defaults to undefined|
| **propertyName** | [**string**] | The name of the property. | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | An empty response. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getCommitHostedPropertyValue**
> ApplicationProperty getCommitHostedPropertyValue()

Retrieve an [application property](/cloud/bitbucket/application-properties/) value stored against a commit.

### Example

```typescript
import {
    PropertiesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PropertiesApi(configuration);

let workspace: string; //The repository container; either the workspace slug or the UUID in curly braces. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let commit: string; //The commit. (default to undefined)
let appKey: string; //The key of the Connect app. (default to undefined)
let propertyName: string; //The name of the property. (default to undefined)

const { status, data } = await apiInstance.getCommitHostedPropertyValue(
    workspace,
    repoSlug,
    commit,
    appKey,
    propertyName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | The repository container; either the workspace slug or the UUID in curly braces. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **commit** | [**string**] | The commit. | defaults to undefined|
| **appKey** | [**string**] | The key of the Connect app. | defaults to undefined|
| **propertyName** | [**string**] | The name of the property. | defaults to undefined|


### Return type

**ApplicationProperty**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The value of the property. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPullRequestHostedPropertyValue**
> ApplicationProperty getPullRequestHostedPropertyValue()

Retrieve an [application property](/cloud/bitbucket/application-properties/) value stored against a pull request.

### Example

```typescript
import {
    PropertiesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PropertiesApi(configuration);

let workspace: string; //The repository container; either the workspace slug or the UUID in curly braces. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pullrequestId: string; //The pull request ID. (default to undefined)
let appKey: string; //The key of the Connect app. (default to undefined)
let propertyName: string; //The name of the property. (default to undefined)

const { status, data } = await apiInstance.getPullRequestHostedPropertyValue(
    workspace,
    repoSlug,
    pullrequestId,
    appKey,
    propertyName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | The repository container; either the workspace slug or the UUID in curly braces. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **pullrequestId** | [**string**] | The pull request ID. | defaults to undefined|
| **appKey** | [**string**] | The key of the Connect app. | defaults to undefined|
| **propertyName** | [**string**] | The name of the property. | defaults to undefined|


### Return type

**ApplicationProperty**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The value of the property. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRepositoryHostedPropertyValue**
> ApplicationProperty getRepositoryHostedPropertyValue()

Retrieve an [application property](/cloud/bitbucket/application-properties/) value stored against a repository.

### Example

```typescript
import {
    PropertiesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PropertiesApi(configuration);

let workspace: string; //The repository container; either the workspace slug or the UUID in curly braces. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let appKey: string; //The key of the Connect app. (default to undefined)
let propertyName: string; //The name of the property. (default to undefined)

const { status, data } = await apiInstance.getRepositoryHostedPropertyValue(
    workspace,
    repoSlug,
    appKey,
    propertyName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | The repository container; either the workspace slug or the UUID in curly braces. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **appKey** | [**string**] | The key of the Connect app. | defaults to undefined|
| **propertyName** | [**string**] | The name of the property. | defaults to undefined|


### Return type

**ApplicationProperty**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The value of the property. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **retrieveUserHostedPropertyValue**
> ApplicationProperty retrieveUserHostedPropertyValue()

Retrieve an [application property](/cloud/bitbucket/application-properties/) value stored against a user.

### Example

```typescript
import {
    PropertiesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PropertiesApi(configuration);

let selectedUser: string; //Either the UUID of the account surrounded by curly-braces, for example `{account UUID}`, OR an Atlassian Account ID. (default to undefined)
let appKey: string; //The key of the Connect app. (default to undefined)
let propertyName: string; //The name of the property. (default to undefined)

const { status, data } = await apiInstance.retrieveUserHostedPropertyValue(
    selectedUser,
    appKey,
    propertyName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **selectedUser** | [**string**] | Either the UUID of the account surrounded by curly-braces, for example &#x60;{account UUID}&#x60;, OR an Atlassian Account ID. | defaults to undefined|
| **appKey** | [**string**] | The key of the Connect app. | defaults to undefined|
| **propertyName** | [**string**] | The name of the property. | defaults to undefined|


### Return type

**ApplicationProperty**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The value of the property. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateCommitHostedPropertyValue**
> updateCommitHostedPropertyValue(body)

Update an [application property](/cloud/bitbucket/application-properties/) value stored against a commit.

### Example

```typescript
import {
    PropertiesApi,
    Configuration,
    ApplicationProperty
} from './api';

const configuration = new Configuration();
const apiInstance = new PropertiesApi(configuration);

let workspace: string; //The repository container; either the workspace slug or the UUID in curly braces. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let commit: string; //The commit. (default to undefined)
let appKey: string; //The key of the Connect app. (default to undefined)
let propertyName: string; //The name of the property. (default to undefined)
let body: ApplicationProperty; //The application property to create or update.

const { status, data } = await apiInstance.updateCommitHostedPropertyValue(
    workspace,
    repoSlug,
    commit,
    appKey,
    propertyName,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **ApplicationProperty**| The application property to create or update. | |
| **workspace** | [**string**] | The repository container; either the workspace slug or the UUID in curly braces. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **commit** | [**string**] | The commit. | defaults to undefined|
| **appKey** | [**string**] | The key of the Connect app. | defaults to undefined|
| **propertyName** | [**string**] | The name of the property. | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | An empty response. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updatePullRequestHostedPropertyValue**
> updatePullRequestHostedPropertyValue(body)

Update an [application property](/cloud/bitbucket/application-properties/) value stored against a pull request.

### Example

```typescript
import {
    PropertiesApi,
    Configuration,
    ApplicationProperty
} from './api';

const configuration = new Configuration();
const apiInstance = new PropertiesApi(configuration);

let workspace: string; //The repository container; either the workspace slug or the UUID in curly braces. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pullrequestId: string; //The pull request ID. (default to undefined)
let appKey: string; //The key of the Connect app. (default to undefined)
let propertyName: string; //The name of the property. (default to undefined)
let body: ApplicationProperty; //The application property to create or update.

const { status, data } = await apiInstance.updatePullRequestHostedPropertyValue(
    workspace,
    repoSlug,
    pullrequestId,
    appKey,
    propertyName,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **ApplicationProperty**| The application property to create or update. | |
| **workspace** | [**string**] | The repository container; either the workspace slug or the UUID in curly braces. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **pullrequestId** | [**string**] | The pull request ID. | defaults to undefined|
| **appKey** | [**string**] | The key of the Connect app. | defaults to undefined|
| **propertyName** | [**string**] | The name of the property. | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | An empty response. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateRepositoryHostedPropertyValue**
> updateRepositoryHostedPropertyValue(body)

Update an [application property](/cloud/bitbucket/application-properties/) value stored against a repository.

### Example

```typescript
import {
    PropertiesApi,
    Configuration,
    ApplicationProperty
} from './api';

const configuration = new Configuration();
const apiInstance = new PropertiesApi(configuration);

let workspace: string; //The repository container; either the workspace slug or the UUID in curly braces. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let appKey: string; //The key of the Connect app. (default to undefined)
let propertyName: string; //The name of the property. (default to undefined)
let body: ApplicationProperty; //The application property to create or update.

const { status, data } = await apiInstance.updateRepositoryHostedPropertyValue(
    workspace,
    repoSlug,
    appKey,
    propertyName,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **ApplicationProperty**| The application property to create or update. | |
| **workspace** | [**string**] | The repository container; either the workspace slug or the UUID in curly braces. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **appKey** | [**string**] | The key of the Connect app. | defaults to undefined|
| **propertyName** | [**string**] | The name of the property. | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | An empty response. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateUserHostedPropertyValue**
> updateUserHostedPropertyValue(body)

Update an [application property](/cloud/bitbucket/application-properties/) value stored against a user.

### Example

```typescript
import {
    PropertiesApi,
    Configuration,
    ApplicationProperty
} from './api';

const configuration = new Configuration();
const apiInstance = new PropertiesApi(configuration);

let selectedUser: string; //Either the UUID of the account surrounded by curly-braces, for example `{account UUID}`, OR an Atlassian Account ID. (default to undefined)
let appKey: string; //The key of the Connect app. (default to undefined)
let propertyName: string; //The name of the property. (default to undefined)
let body: ApplicationProperty; //The application property to create or update.

const { status, data } = await apiInstance.updateUserHostedPropertyValue(
    selectedUser,
    appKey,
    propertyName,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **ApplicationProperty**| The application property to create or update. | |
| **selectedUser** | [**string**] | Either the UUID of the account surrounded by curly-braces, for example &#x60;{account UUID}&#x60;, OR an Atlassian Account ID. | defaults to undefined|
| **appKey** | [**string**] | The key of the Connect app. | defaults to undefined|
| **propertyName** | [**string**] | The name of the property. | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | An empty response. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

