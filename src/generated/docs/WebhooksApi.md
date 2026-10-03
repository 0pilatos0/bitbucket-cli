# WebhooksApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createRepositoryHook**](#createrepositoryhook) | **POST** /repositories/{workspace}/{repo_slug}/hooks | Create a webhook for a repository|
|[**createWorkspaceHook**](#createworkspacehook) | **POST** /workspaces/{workspace}/hooks | Create a webhook for a workspace|
|[**deleteRepositoryHook**](#deleterepositoryhook) | **DELETE** /repositories/{workspace}/{repo_slug}/hooks/{uid} | Delete a webhook for a repository|
|[**deleteWorkspaceHook**](#deleteworkspacehook) | **DELETE** /workspaces/{workspace}/hooks/{uid} | Delete a webhook for a workspace|
|[**getRepositoryHook**](#getrepositoryhook) | **GET** /repositories/{workspace}/{repo_slug}/hooks/{uid} | Get a webhook for a repository|
|[**getWorkspaceHook**](#getworkspacehook) | **GET** /workspaces/{workspace}/hooks/{uid} | Get a webhook for a workspace|
|[**listHookEvents**](#listhookevents) | **GET** /hook_events | Get a webhook resource|
|[**listHookEventsForResource**](#listhookeventsforresource) | **GET** /hook_events/{subject_type} | List subscribable webhook types|
|[**listRepositoryHooks**](#listrepositoryhooks) | **GET** /repositories/{workspace}/{repo_slug}/hooks | List webhooks for a repository|
|[**listWorkspaceHooks**](#listworkspacehooks) | **GET** /workspaces/{workspace}/hooks | List webhooks for a workspace|
|[**updateRepositoryHook**](#updaterepositoryhook) | **PUT** /repositories/{workspace}/{repo_slug}/hooks/{uid} | Update a webhook for a repository|
|[**updateWorkspaceHook**](#updateworkspacehook) | **PUT** /workspaces/{workspace}/hooks/{uid} | Update a webhook for a workspace|

# **createRepositoryHook**
> WebhookSubscription createRepositoryHook(body)

Creates a new webhook on the specified repository.  Workspace webhooks are fired for events from all repositories contained by that workspace.  Example: ``` $ curl -X POST -u credentials -H \'Content-Type: application/json\'   https://api.bitbucket.org/2.0/workspaces/my-workspace/hooks   -d \'     {       \"description\": \"Webhook Description\",       \"url\": \"https://example.com/\",       \"active\": true,       \"secret\": \"this is a really bad secret\",       \"events\": [         \"repo:push\",         \"issue:created\",         \"issue:updated\"       ]     }\' ```  When the `secret` is provided it will be used as the key to generate a HMAC digest value sent in the `X-Hub-Signature` header at delivery time. Passing a `null` or empty `secret` or not passing a `secret` will leave the webhook\'s secret unset. Bitbucket only generates the `X-Hub-Signature` when the webhook\'s secret is set.  This call requires the webhook scope, as well as any scope that applies to the events that the webhook subscribes to. In the example above that means: `webhook`, `repository` and `issue`.  The `url` must properly resolve and cannot be an internal, non-routed address.

### Example

```typescript
import {
    WebhooksApi,
    Configuration,
    WebhookSubscription
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`. (default to undefined)
let body: WebhookSubscription; //

const { status, data } = await apiInstance.createRepositoryHook(
    workspace,
    repoSlug,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **WebhookSubscription**|  | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;. | defaults to undefined|


### Return type

**WebhookSubscription**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | If the webhook was registered successfully. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**403** | If the authenticated user does not have permission to install webhooks on the specified repository. |  -  |
|**404** | If the webhook or repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createWorkspaceHook**
> WebhookSubscription createWorkspaceHook(body)

Creates a new webhook on the specified workspace.  Workspace webhooks are fired for events from all repositories contained by that workspace.  Example: ``` $ curl -X POST -u credentials -H \'Content-Type: application/json\'   https://api.bitbucket.org/2.0/workspaces/my-workspace/hooks   -d \'     {       \"description\": \"Webhook Description\",       \"url\": \"https://example.com/\",       \"active\": true,       \"secret\": \"this is a really bad secret\",       \"events\": [         \"repo:push\",         \"issue:created\",         \"issue:updated\"       ]     }\' ```  When the `secret` is provided it will be used as the key to generate a HMAC digest value sent in the `X-Hub-Signature` header at delivery time. Passing a `null` or empty `secret` or not passing a `secret` will leave the webhook\'s secret unset. Bitbucket only generates the `X-Hub-Signature` when the webhook\'s secret is set.  This call requires the webhook scope, as well as any scope that applies to the events that the webhook subscribes to. In the example above that means: `webhook`, `repository` and `issue`.  The `url` must properly resolve and cannot be an internal, non-routed address.  Only workspace owners can install webhooks on workspaces.

### Example

```typescript
import {
    WebhooksApi,
    Configuration,
    WebhookSubscription
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let body: WebhookSubscription; //

const { status, data } = await apiInstance.createWorkspaceHook(
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **WebhookSubscription**|  | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|


### Return type

**WebhookSubscription**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The webhook subscription object. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**403** | If the authenticated user does not have permission to install webhooks on the specified workspace.  |  -  |
|**404** | If the webhook or workspace does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteRepositoryHook**
> deleteRepositoryHook()

Deletes the specified webhook subscription from the given repository.

### Example

```typescript
import {
    WebhooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`. (default to undefined)
let uid: string; //The webhook\'s id. (default to undefined)

const { status, data } = await apiInstance.deleteRepositoryHook(
    workspace,
    repoSlug,
    uid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;. | defaults to undefined|
| **uid** | [**string**] | The webhook\&#39;s id. | defaults to undefined|


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
|**204** | When the webhook was deleted successfully |  -  |
|**403** | If the authenticated user does not have permission to update the webhook.  |  -  |
|**404** | If the webhook or repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteWorkspaceHook**
> deleteWorkspaceHook()

Deletes the specified webhook subscription from the given workspace.

### Example

```typescript
import {
    WebhooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let uid: string; //The webhook\'s id. (default to undefined)

const { status, data } = await apiInstance.deleteWorkspaceHook(
    workspace,
    uid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **uid** | [**string**] | The webhook\&#39;s id. | defaults to undefined|


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
|**204** | When the webhook was deleted successfully |  -  |
|**403** | If the authenticated user does not have permission to update the webhook.  |  -  |
|**404** | If the webhook or workspace does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRepositoryHook**
> WebhookSubscription getRepositoryHook()

Returns the webhook with the specified id installed on the specified repository.

### Example

```typescript
import {
    WebhooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`. (default to undefined)
let uid: string; //The webhook\'s id. (default to undefined)

const { status, data } = await apiInstance.getRepositoryHook(
    workspace,
    repoSlug,
    uid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;. | defaults to undefined|
| **uid** | [**string**] | The webhook\&#39;s id. | defaults to undefined|


### Return type

**WebhookSubscription**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The webhook subscription object. |  -  |
|**404** | If the webhook or repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getWorkspaceHook**
> WebhookSubscription getWorkspaceHook()

Returns the webhook with the specified id installed on the specified workspace.

### Example

```typescript
import {
    WebhooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let uid: string; //The webhook\'s id. (default to undefined)

const { status, data } = await apiInstance.getWorkspaceHook(
    workspace,
    uid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **uid** | [**string**] | The webhook\&#39;s id. | defaults to undefined|


### Return type

**WebhookSubscription**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The webhook subscription object. |  -  |
|**404** | If the webhook or workspace does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listHookEvents**
> SubjectTypes listHookEvents()

Returns the webhook resource or subject types on which webhooks can be registered. Each resource/subject type contains an `events` link that returns the paginated list of specific events each individual subject type can emit. This endpoint is publicly accessible and does not require authentication or scopes.

### Example

```typescript
import {
    WebhooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

const { status, data } = await apiInstance.listHookEvents();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**SubjectTypes**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A mapping of resource/subject types pointing to their individual event types. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listHookEventsForResource**
> PaginatedHookEvents listHookEventsForResource()

Returns a paginated list of all valid webhook events for the specified entity. **The team and user webhooks are deprecated, and you should use workspace instead. For more information, see [the announcement](https://developer.atlassian.com/cloud/bitbucket/bitbucket-api-teams-deprecation/).** This is public data that does not require any scopes or authentication. NOTE: The example response is a truncated response object for the `workspace` `subject_type`. We return the same structure for the other `subject_type` objects.

### Example

```typescript
import {
    WebhooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let subjectType: 'repository' | 'workspace'; //A resource or subject type. (default to undefined)

const { status, data } = await apiInstance.listHookEventsForResource(
    subjectType
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **subjectType** | [**&#39;repository&#39; | &#39;workspace&#39;**]**Array<&#39;repository&#39; &#124; &#39;workspace&#39;>** | A resource or subject type. | defaults to undefined|


### Return type

**PaginatedHookEvents**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of webhook types available to subscribe on. |  -  |
|**404** | If an invalid &#x60;{subject_type}&#x60; value was specified. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listRepositoryHooks**
> PaginatedWebhookSubscriptions listRepositoryHooks()

Returns a paginated list of webhooks installed on this repository.

### Example

```typescript
import {
    WebhooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`. (default to undefined)

const { status, data } = await apiInstance.listRepositoryHooks(
    workspace,
    repoSlug
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;. | defaults to undefined|


### Return type

**PaginatedWebhookSubscriptions**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The paginated list of installed webhooks. |  -  |
|**403** | If the authenticated user is not an owner on the specified repository. |  -  |
|**404** | If the webhook or repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listWorkspaceHooks**
> PaginatedWebhookSubscriptions listWorkspaceHooks()

Returns a paginated list of webhooks installed on this workspace.

### Example

```typescript
import {
    WebhooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)

const { status, data } = await apiInstance.listWorkspaceHooks(
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|


### Return type

**PaginatedWebhookSubscriptions**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The paginated list of installed webhooks. |  -  |
|**403** | If the authenticated user is not an owner on the specified workspace. |  -  |
|**404** | If the webhook or workspace does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateRepositoryHook**
> WebhookSubscription updateRepositoryHook(body)

Updates the specified webhook subscription.  The following properties can be mutated:  * `description` * `url` * `secret` * `active` * `events`  The hook\'s secret is used as a key to generate the HMAC hex digest sent in the `X-Hub-Signature` header at delivery time. This signature is only generated when the hook has a secret.  Set the hook\'s secret by passing the new value in the `secret` field. Passing a `null` value in the `secret` field will remove the secret from the hook. The hook\'s secret can be left unchanged by not passing the `secret` field in the request.

### Example

```typescript
import {
    WebhooksApi,
    Configuration,
    WebhookSubscription
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`. (default to undefined)
let uid: string; //The webhook\'s id. (default to undefined)
let body: WebhookSubscription; //

const { status, data } = await apiInstance.updateRepositoryHook(
    workspace,
    repoSlug,
    uid,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **WebhookSubscription**|  | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;. | defaults to undefined|
| **uid** | [**string**] | The webhook\&#39;s id. | defaults to undefined|


### Return type

**WebhookSubscription**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The webhook subscription object. |  -  |
|**403** | If the authenticated user does not have permission to update the webhook.  |  -  |
|**404** | If the webhook or repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateWorkspaceHook**
> WebhookSubscription updateWorkspaceHook(body)

Updates the specified webhook subscription.  The following properties can be mutated:  * `description` * `url` * `secret` * `active` * `events`  The hook\'s secret is used as a key to generate the HMAC hex digest sent in the X-Hub-Signature header at delivery time. This signature is only generated when the hook has a secret.  Set the hook\'s secret by passing the new value in the secret field . Passing a null value in the secret field will remove the secret from the hook. The hook\'s secret can be left unchanged by not passing the secret field in the request.

### Example

```typescript
import {
    WebhooksApi,
    Configuration,
    WebhookSubscription
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let uid: string; //The webhook\'s id. (default to undefined)
let body: WebhookSubscription; //

const { status, data } = await apiInstance.updateWorkspaceHook(
    workspace,
    uid,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **WebhookSubscription**|  | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **uid** | [**string**] | The webhook\&#39;s id. | defaults to undefined|


### Return type

**WebhookSubscription**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The webhook subscription object. |  -  |
|**403** | If the authenticated user does not have permission to update the webhook.  |  -  |
|**404** | If the webhook or workspace does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

