# WebhooksApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**hookEventsGet**](#hookeventsget) | **GET** /hook_events | Get a webhook resource|
|[**hookEventsSubjectTypeGet**](#hookeventssubjecttypeget) | **GET** /hook_events/{subject_type} | List subscribable webhook types|
|[**repositoriesWorkspaceRepoSlugHooksGet**](#repositoriesworkspacereposlughooksget) | **GET** /repositories/{workspace}/{repo_slug}/hooks | List webhooks for a repository|
|[**repositoriesWorkspaceRepoSlugHooksPost**](#repositoriesworkspacereposlughookspost) | **POST** /repositories/{workspace}/{repo_slug}/hooks | Create a webhook for a repository|
|[**repositoriesWorkspaceRepoSlugHooksUidDelete**](#repositoriesworkspacereposlughooksuiddelete) | **DELETE** /repositories/{workspace}/{repo_slug}/hooks/{uid} | Delete a webhook for a repository|
|[**repositoriesWorkspaceRepoSlugHooksUidGet**](#repositoriesworkspacereposlughooksuidget) | **GET** /repositories/{workspace}/{repo_slug}/hooks/{uid} | Get a webhook for a repository|
|[**repositoriesWorkspaceRepoSlugHooksUidPut**](#repositoriesworkspacereposlughooksuidput) | **PUT** /repositories/{workspace}/{repo_slug}/hooks/{uid} | Update a webhook for a repository|
|[**workspacesWorkspaceHooksGet**](#workspacesworkspacehooksget) | **GET** /workspaces/{workspace}/hooks | List webhooks for a workspace|
|[**workspacesWorkspaceHooksPost**](#workspacesworkspacehookspost) | **POST** /workspaces/{workspace}/hooks | Create a webhook for a workspace|
|[**workspacesWorkspaceHooksUidDelete**](#workspacesworkspacehooksuiddelete) | **DELETE** /workspaces/{workspace}/hooks/{uid} | Delete a webhook for a workspace|
|[**workspacesWorkspaceHooksUidGet**](#workspacesworkspacehooksuidget) | **GET** /workspaces/{workspace}/hooks/{uid} | Get a webhook for a workspace|
|[**workspacesWorkspaceHooksUidPut**](#workspacesworkspacehooksuidput) | **PUT** /workspaces/{workspace}/hooks/{uid} | Update a webhook for a workspace|

# **hookEventsGet**
> SubjectTypes hookEventsGet()

Returns the webhook resource or subject types on which webhooks can be registered.  Each resource/subject type contains an `events` link that returns the paginated list of specific events each individual subject type can emit.  This endpoint is publicly accessible and does not require authentication or scopes.

### Example

```typescript
import {
    WebhooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

const { status, data } = await apiInstance.hookEventsGet();
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

# **hookEventsSubjectTypeGet**
> PaginatedHookEvents hookEventsSubjectTypeGet()

Returns a paginated list of all valid webhook events for the specified entity. **The team and user webhooks are deprecated, and you should use workspace instead. For more information, see [the announcement](https://developer.atlassian.com/cloud/bitbucket/bitbucket-api-teams-deprecation/).**  This is public data that does not require any scopes or authentication.  NOTE: The example response is a truncated response object for the `workspace` `subject_type`. We return the same structure for the other `subject_type` objects.

### Example

```typescript
import {
    WebhooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let subjectType: 'repository' | 'workspace'; //A resource or subject type. (default to undefined)

const { status, data } = await apiInstance.hookEventsSubjectTypeGet(
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

# **repositoriesWorkspaceRepoSlugHooksGet**
> PaginatedWebhookSubscriptions repositoriesWorkspaceRepoSlugHooksGet()

Returns a paginated list of webhooks installed on this repository.

### Example

```typescript
import {
    WebhooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugHooksGet(
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


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
|**403** | If the authenticated user does not have permission to access the webhooks. |  -  |
|**404** | If the repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugHooksPost**
> WebhookSubscription repositoriesWorkspaceRepoSlugHooksPost(body)

Creates a new webhook on the specified repository.  Example:  ``` $ curl -X POST -u credentials -H \'Content-Type: application/json\'   https://api.bitbucket.org/2.0/repositories/my-workspace/my-repo-slug/hooks   -d \'     {       \"description\": \"Webhook Description\",       \"url\": \"https://example.com/\",       \"active\": true,       \"secret\": \"this is a really bad secret\",       \"events\": [         \"repo:push\",         \"issue:created\",         \"issue:updated\"       ]     }\' ```  When the `secret` is provided it will be used as the key to generate a HMAC digest value sent in the `X-Hub-Signature` header at delivery time. Passing a `null` or empty `secret` or not passing a `secret` will leave the webhook\'s secret unset. Bitbucket only generates the `X-Hub-Signature` when the webhook\'s secret is set.  Note that this call requires the webhook scope, as well as any scope that applies to the events that the webhook subscribes to. In the example above that means: `webhook`, `repository` and `issue`.  Also note that the `url` must properly resolve and cannot be an internal, non-routed address.

### Example

```typescript
import {
    WebhooksApi,
    Configuration,
    WebhookSubscription
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: WebhookSubscription; //

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugHooksPost(
    repoSlug,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **WebhookSubscription**|  | |
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


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
|**404** | If the repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugHooksUidDelete**
> repositoriesWorkspaceRepoSlugHooksUidDelete()

Deletes the specified webhook subscription from the given repository.

### Example

```typescript
import {
    WebhooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let uid: string; //Installed webhook\'s ID (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugHooksUidDelete(
    repoSlug,
    uid,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **uid** | [**string**] | Installed webhook\&#39;s ID | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


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
|**403** | If the authenticated user does not have permission to delete the webhook. |  -  |
|**404** | If the webhook or repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugHooksUidGet**
> WebhookSubscription repositoriesWorkspaceRepoSlugHooksUidGet()

Returns the webhook with the specified id installed on the specified repository.

### Example

```typescript
import {
    WebhooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let uid: string; //Installed webhook\'s ID (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugHooksUidGet(
    repoSlug,
    uid,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **uid** | [**string**] | Installed webhook\&#39;s ID | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


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

# **repositoriesWorkspaceRepoSlugHooksUidPut**
> WebhookSubscription repositoriesWorkspaceRepoSlugHooksUidPut(body)

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

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let uid: string; //Installed webhook\'s ID (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: WebhookSubscription; //

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugHooksUidPut(
    repoSlug,
    uid,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **WebhookSubscription**|  | |
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **uid** | [**string**] | Installed webhook\&#39;s ID | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


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
|**403** | If the authenticated user does not have permission to update the webhook. |  -  |
|**404** | If the webhook or repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceHooksGet**
> PaginatedWebhookSubscriptions workspacesWorkspaceHooksGet()

Returns a paginated list of webhooks installed on this workspace.

### Example

```typescript
import {
    WebhooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceHooksGet(
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


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
|**404** | If the specified workspace does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceHooksPost**
> WebhookSubscription workspacesWorkspaceHooksPost(body)

Creates a new webhook on the specified workspace.  Workspace webhooks are fired for events from all repositories contained by that workspace.  Example:  ``` $ curl -X POST -u credentials -H \'Content-Type: application/json\'   https://api.bitbucket.org/2.0/workspaces/my-workspace/hooks   -d \'     {       \"description\": \"Webhook Description\",       \"url\": \"https://example.com/\",       \"active\": true,       \"secret\": \"this is a really bad secret\",       \"events\": [         \"repo:push\",         \"issue:created\",         \"issue:updated\"       ]     }\' ```  When the `secret` is provided it will be used as the key to generate a HMAC digest value sent in the `X-Hub-Signature` header at delivery time. Passing a `null` or empty `secret` or not passing a `secret` will leave the webhook\'s secret unset. Bitbucket only generates the `X-Hub-Signature` when the webhook\'s secret is set.  This call requires the webhook scope, as well as any scope that applies to the events that the webhook subscribes to. In the example above that means: `webhook`, `repository` and `issue`.  The `url` must properly resolve and cannot be an internal, non-routed address.  Only workspace owners can install webhooks on workspaces.

### Example

```typescript
import {
    WebhooksApi,
    Configuration,
    WebhookSubscription
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: WebhookSubscription; //

const { status, data } = await apiInstance.workspacesWorkspaceHooksPost(
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **WebhookSubscription**|  | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


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
|**403** | If the authenticated user does not have permission to install webhooks on the specified workspace. |  -  |
|**404** | If the specified workspace does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceHooksUidDelete**
> workspacesWorkspaceHooksUidDelete()

Deletes the specified webhook subscription from the given workspace.

### Example

```typescript
import {
    WebhooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let uid: string; //Installed webhook\'s ID (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceHooksUidDelete(
    uid,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **uid** | [**string**] | Installed webhook\&#39;s ID | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


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
|**403** | If the authenticated user does not have permission to delete the webhook. |  -  |
|**404** | If the webhook or workspace does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceHooksUidGet**
> WebhookSubscription workspacesWorkspaceHooksUidGet()

Returns the webhook with the specified id installed on the given workspace.

### Example

```typescript
import {
    WebhooksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WebhooksApi(configuration);

let uid: string; //Installed webhook\'s ID (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceHooksUidGet(
    uid,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **uid** | [**string**] | Installed webhook\&#39;s ID | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


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

# **workspacesWorkspaceHooksUidPut**
> WebhookSubscription workspacesWorkspaceHooksUidPut(body)

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

let uid: string; //Installed webhook\'s ID (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: WebhookSubscription; //

const { status, data } = await apiInstance.workspacesWorkspaceHooksUidPut(
    uid,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **WebhookSubscription**|  | |
| **uid** | [**string**] | Installed webhook\&#39;s ID | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


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
|**403** | If the authenticated user does not have permission to update the webhook. |  -  |
|**404** | If the webhook or workspace does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

