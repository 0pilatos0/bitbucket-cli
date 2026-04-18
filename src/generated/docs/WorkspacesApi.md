# WorkspacesApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**userPermissionsWorkspacesGet**](#userpermissionsworkspacesget) | **GET** /user/permissions/workspaces | List workspaces for the current user|
|[**userWorkspacesGet**](#userworkspacesget) | **GET** /user/workspaces | List workspaces for the current user|
|[**userWorkspacesWorkspacePermissionGet**](#userworkspacesworkspacepermissionget) | **GET** /user/workspaces/{workspace}/permission | Get user permission on a workspace|
|[**workspacesGet**](#workspacesget) | **GET** /workspaces | List workspaces for user|
|[**workspacesWorkspaceGet**](#workspacesworkspaceget) | **GET** /workspaces/{workspace} | Get a workspace|
|[**workspacesWorkspaceHooksGet**](#workspacesworkspacehooksget) | **GET** /workspaces/{workspace}/hooks | List webhooks for a workspace|
|[**workspacesWorkspaceHooksPost**](#workspacesworkspacehookspost) | **POST** /workspaces/{workspace}/hooks | Create a webhook for a workspace|
|[**workspacesWorkspaceHooksUidDelete**](#workspacesworkspacehooksuiddelete) | **DELETE** /workspaces/{workspace}/hooks/{uid} | Delete a webhook for a workspace|
|[**workspacesWorkspaceHooksUidGet**](#workspacesworkspacehooksuidget) | **GET** /workspaces/{workspace}/hooks/{uid} | Get a webhook for a workspace|
|[**workspacesWorkspaceHooksUidPut**](#workspacesworkspacehooksuidput) | **PUT** /workspaces/{workspace}/hooks/{uid} | Update a webhook for a workspace|
|[**workspacesWorkspaceMembersGet**](#workspacesworkspacemembersget) | **GET** /workspaces/{workspace}/members | List users in a workspace|
|[**workspacesWorkspaceMembersMemberGet**](#workspacesworkspacemembersmemberget) | **GET** /workspaces/{workspace}/members/{member} | Get user membership for a workspace|
|[**workspacesWorkspacePermissionsGet**](#workspacesworkspacepermissionsget) | **GET** /workspaces/{workspace}/permissions | List user permissions in a workspace|
|[**workspacesWorkspacePermissionsRepositoriesGet**](#workspacesworkspacepermissionsrepositoriesget) | **GET** /workspaces/{workspace}/permissions/repositories | List all repository permissions for a workspace|
|[**workspacesWorkspacePermissionsRepositoriesRepoSlugGet**](#workspacesworkspacepermissionsrepositoriesreposlugget) | **GET** /workspaces/{workspace}/permissions/repositories/{repo_slug} | List a repository permissions for a workspace|
|[**workspacesWorkspaceProjectsGet**](#workspacesworkspaceprojectsget) | **GET** /workspaces/{workspace}/projects | List projects in a workspace|
|[**workspacesWorkspaceProjectsProjectKeyGet**](#workspacesworkspaceprojectsprojectkeyget) | **GET** /workspaces/{workspace}/projects/{project_key} | Get a project for a workspace|
|[**workspacesWorkspacePullrequestsSelectedUserGet**](#workspacesworkspacepullrequestsselecteduserget) | **GET** /workspaces/{workspace}/pullrequests/{selected_user} | List workspace pull requests for a user|
|[**workspacesWorkspaceSettingsGpgPublicKeyGet**](#workspacesworkspacesettingsgpgpublickeyget) | **GET** /workspaces/{workspace}/settings/gpg/public-key | Get the workspace system GPG public key(s)|

# **userPermissionsWorkspacesGet**
> PaginatedWorkspaceMemberships userPermissionsWorkspacesGet()

**This endpoint is deprecated. Please use the supported alternatives:** * [List workspaces for user](/cloud/bitbucket/rest/api-group-workspaces/#api-user-workspaces-get) * [Get user permission on a workspace](/cloud/bitbucket/rest/api-group-workspaces/#api-user-workspaces-workspace-permission-get)  Returns an object for each workspace the caller is a member of, and their effective role - the highest level of privilege the caller has. If a user is a member of multiple groups with distinct roles, only the highest level is returned.  Permissions can be:  * `owner` * `collaborator` * `member`  **The `collaborator` role is being removed from the Bitbucket Cloud API. For more information, see the [deprecation announcement](/cloud/bitbucket/deprecation-notice-collaborator-role/).**  **When you move your administration from Bitbucket Cloud to admin.atlassian.com, the following fields on `workspace_membership` will no longer be present: `last_accessed` and `added_on`. See the [deprecation announcement](/cloud/bitbucket/announcement-breaking-change-workspace-membership/).**  Results may be further [filtered or sorted](/cloud/bitbucket/rest/intro/#filtering) by workspace or permission by adding the following query string parameters:  * `q=workspace.slug=\"bbworkspace1\"` or `q=permission=\"owner\"` * `sort=workspace.slug`  Note that the query parameter values need to be URL escaped so that `=` would become `%3D`.

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

let q: string; // Query string to narrow down the response. See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for details. (optional) (default to undefined)
let sort: string; // Name of a response property to sort results. See [filtering and sorting](/cloud/bitbucket/rest/intro/#sorting-query-results) for details.  (optional) (default to undefined)

const { status, data } = await apiInstance.userPermissionsWorkspacesGet(
    q,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **q** | [**string**] |  Query string to narrow down the response. See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for details. | (optional) defaults to undefined|
| **sort** | [**string**] |  Name of a response property to sort results. See [filtering and sorting](/cloud/bitbucket/rest/intro/#sorting-query-results) for details.  | (optional) defaults to undefined|


### Return type

**PaginatedWorkspaceMemberships**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | All of the workspace memberships for the authenticated user. |  -  |
|**401** | The request wasn\&#39;t authenticated. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **userWorkspacesGet**
> PaginatedWorkspaceAccess userWorkspacesGet()

Returns an object for each workspace accessible to the caller. This object also contains details on whether the caller has admin permissions on the workspace (`\"administrator\" = true`) or not (`\"administrator\" = false`).  Queries support filtering based on administrator permissions, [sorting](/cloud/bitbucket/rest/intro/#sorting-query-results) or [filtering](/cloud/bitbucket/rest/intro/#filtering) by `slug`. Results can be [paginated](/cloud/bitbucket/rest/intro/#pagination).

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

let sort: string; //Name of a response property to sort results (only slug is supported). (optional) (default to undefined)
let administrator: boolean; //Filter workspaces based on which ones the caller has admin permissions or not. (optional) (default to undefined)

const { status, data } = await apiInstance.userWorkspacesGet(
    sort,
    administrator
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **sort** | [**string**] | Name of a response property to sort results (only slug is supported). | (optional) defaults to undefined|
| **administrator** | [**boolean**] | Filter workspaces based on which ones the caller has admin permissions or not. | (optional) defaults to undefined|


### Return type

**PaginatedWorkspaceAccess**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The list of workspaces accessible by the authenticated user. |  -  |
|**400** | The request was invalid. |  -  |
|**401** | The request wasn\&#39;t authenticated. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **userWorkspacesWorkspacePermissionGet**
> WorkspaceMembership userWorkspacesWorkspacePermissionGet()

Returns the caller\'s effective role; as in, the highest level of privilege the caller has for the workspace. If the calling user is a member of multiple groups with distinct roles, only the highest level is returned.  Permissions can be:  * `owner` * `create-project` * `collaborator` (deprecated; see this [deprecation announcement](/cloud/bitbucket/deprecation-notice-collaborator-role/) for more details) * `member`

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.userWorkspacesWorkspacePermissionGet(
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**WorkspaceMembership**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The user that is part of a workspace. |  -  |
|**401** | The request wasn\&#39;t authenticated. |  -  |
|**403** | The requesting user does not have access to the workspace. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesGet**
> PaginatedWorkspaces workspacesGet()

**This endpoint is deprecated. Please use the [supported alternative](/cloud/bitbucket/rest/api-group-workspaces/#api-user-workspaces-get).**  Returns a list of workspaces accessible by the authenticated user.  Results may be further [filtered or sorted](/cloud/bitbucket/rest/intro/#filtering) by workspace or permission by adding the following query string parameters:  * `q=slug=\"bbworkspace1\"` or `q=is_private=true` * `sort=created_on`  Note that the query parameter values need to be URL escaped so that `=` would become `%3D`.  **The `collaborator` role is being removed from the Bitbucket Cloud API. For more information, see the [deprecation announcement](/cloud/bitbucket/deprecation-notice-collaborator-role/).**

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

let role: 'owner' | 'collaborator' | 'member'; //             Filters the workspaces based on the authenticated user\'s role on each workspace.              * **member**: returns a list of all the workspaces which the caller is a member of                 at least one workspace group or repository             * **collaborator**: returns a list of workspaces which the caller has write access                 to at least one repository in the workspace             * **owner**: returns a list of workspaces which the caller has administrator access              (optional) (default to undefined)
let q: string; // Query string to narrow down the response. See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for details. (optional) (default to undefined)
let sort: string; // Name of a response property to sort results. See [filtering and sorting](/cloud/bitbucket/rest/intro/#sorting-query-results) for details.  (optional) (default to undefined)

const { status, data } = await apiInstance.workspacesGet(
    role,
    q,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **role** | [**&#39;owner&#39; | &#39;collaborator&#39; | &#39;member&#39;**]**Array<&#39;owner&#39; &#124; &#39;collaborator&#39; &#124; &#39;member&#39;>** |              Filters the workspaces based on the authenticated user\&#39;s role on each workspace.              * **member**: returns a list of all the workspaces which the caller is a member of                 at least one workspace group or repository             * **collaborator**: returns a list of workspaces which the caller has write access                 to at least one repository in the workspace             * **owner**: returns a list of workspaces which the caller has administrator access              | (optional) defaults to undefined|
| **q** | [**string**] |  Query string to narrow down the response. See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for details. | (optional) defaults to undefined|
| **sort** | [**string**] |  Name of a response property to sort results. See [filtering and sorting](/cloud/bitbucket/rest/intro/#sorting-query-results) for details.  | (optional) defaults to undefined|


### Return type

**PaginatedWorkspaces**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The list of workspaces accessible by the authenticated user. |  -  |
|**401** | The request wasn\&#39;t authenticated. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceGet**
> Workspace workspacesWorkspaceGet()

Returns the requested workspace.

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceGet(
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Workspace**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The workspace. |  -  |
|**404** | If no workspace exists for the specified name or UUID. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceHooksGet**
> PaginatedWebhookSubscriptions workspacesWorkspaceHooksGet()

Returns a paginated list of webhooks installed on this workspace.

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

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
> WebhookSubscription workspacesWorkspaceHooksPost()

Creates a new webhook on the specified workspace.  Workspace webhooks are fired for events from all repositories contained by that workspace.  Example:  ``` $ curl -X POST -u credentials -H \'Content-Type: application/json\'   https://api.bitbucket.org/2.0/workspaces/my-workspace/hooks   -d \'     {       \"description\": \"Webhook Description\",       \"url\": \"https://example.com/\",       \"active\": true,       \"secret\": \"this is a really bad secret\",       \"events\": [         \"repo:push\",         \"issue:created\",         \"issue:updated\"       ]     }\' ```  When the `secret` is provided it will be used as the key to generate a HMAC digest value sent in the `X-Hub-Signature` header at delivery time. Passing a `null` or empty `secret` or not passing a `secret` will leave the webhook\'s secret unset. Bitbucket only generates the `X-Hub-Signature` when the webhook\'s secret is set.  This call requires the webhook scope, as well as any scope that applies to the events that the webhook subscribes to. In the example above that means: `webhook`, `repository` and `issue`.  The `url` must properly resolve and cannot be an internal, non-routed address.  Only workspace owners can install webhooks on workspaces.

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceHooksPost(
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
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
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

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
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

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
> WebhookSubscription workspacesWorkspaceHooksUidPut()

Updates the specified webhook subscription.  The following properties can be mutated:  * `description` * `url` * `secret` * `active` * `events`  The hook\'s secret is used as a key to generate the HMAC hex digest sent in the `X-Hub-Signature` header at delivery time. This signature is only generated when the hook has a secret.  Set the hook\'s secret by passing the new value in the `secret` field. Passing a `null` value in the `secret` field will remove the secret from the hook. The hook\'s secret can be left unchanged by not passing the `secret` field in the request.

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

let uid: string; //Installed webhook\'s ID (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceHooksUidPut(
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
|**403** | If the authenticated user does not have permission to update the webhook. |  -  |
|**404** | If the webhook or workspace does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceMembersGet**
> PaginatedWorkspaceMemberships workspacesWorkspaceMembersGet()

Returns all members of the requested workspace.  This endpoint additionally supports [filtering](/cloud/bitbucket/rest/intro/#filtering) by email address, if called by a workspace administrator, integration or workspace access token. This is done by adding the following query string parameter:  * `q=user.email IN (\"user1@org.com\",\"user2@org.com\")`  When filtering by email, you can query up to 90 addresses at a time. Note that the query parameter values need to be URL escaped, so the final query string should be:  * `q=user.email%20IN%20(%22user1@org.com%22,%22user2@org.com%22)`  Email addresses that you filter by (and only these email addresses) can be included in the response using the `fields` query parameter:  * `&fields=+values.user.email` - add the `email` field to the default `user` response object * `&fields=values.user.email,values.user.account_id` - only return user email addresses and account IDs  Once again, all query parameter values must be URL escaped.

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceMembersGet(
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PaginatedWorkspaceMemberships**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The list of users that are part of a workspace. |  -  |
|**400** | When more than 90 emails were provided when querying by email. |  -  |
|**401** | The request wasn\&#39;t authenticated. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceMembersMemberGet**
> WorkspaceMembership workspacesWorkspaceMembersMemberGet()

Returns the workspace membership, which includes a `User` object for the member and a `Workspace` object for the requested workspace.

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

let member: string; //Member\'s UUID or Atlassian ID. (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceMembersMemberGet(
    member,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **member** | [**string**] | Member\&#39;s UUID or Atlassian ID. | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**WorkspaceMembership**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The user that is part of a workspace. |  -  |
|**401** | The request wasn\&#39;t authenticated. |  -  |
|**404** | A workspace cannot be found, or a user cannot be found, or the user is not a a member of the workspace. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspacePermissionsGet**
> PaginatedWorkspaceMemberships workspacesWorkspacePermissionsGet()

Returns the list of members in a workspace and their permission levels. Permission can be: * `owner` * `collaborator` * `member`  **The `collaborator` role is being removed from the Bitbucket Cloud API. For more information, see the [deprecation announcement](/cloud/bitbucket/deprecation-notice-collaborator-role/).**  **When you move your administration from Bitbucket Cloud to admin.atlassian.com, the following fields on `workspace_membership` will no longer be present: `last_accessed` and `added_on`. See the [deprecation announcement](/cloud/bitbucket/announcement-breaking-change-workspace-membership/).**  Results may be further [filtered](/cloud/bitbucket/rest/intro/#filtering) by permission by adding the following query string parameters:  * `q=permission=\"owner\"`

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let q: string; // Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). (optional) (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspacePermissionsGet(
    workspace,
    q
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **q** | [**string**] |  Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). | (optional) defaults to undefined|


### Return type

**PaginatedWorkspaceMemberships**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The list of users that are part of a workspace, along with their permission. |  -  |
|**401** | The request wasn\&#39;t authenticated. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspacePermissionsRepositoriesGet**
> PaginatedRepositoryPermissions workspacesWorkspacePermissionsRepositoriesGet()

Returns an object for each repository permission for all of a workspace\'s repositories.  Permissions returned are effective permissions: the highest level of permission the user has. This does not distinguish between direct and indirect (group) privileges.  Only users with admin permission for the team may access this resource.  Permissions can be:  * `admin` * `write` * `read`  Results may be further [filtered or sorted](/cloud/bitbucket/rest/intro/#filtering) by repository, user, or permission by adding the following query string parameters:  * `q=repository.name=\"geordi\"` or `q=permission>\"read\"` * `sort=user.display_name`  Note that the query parameter values need to be URL escaped so that `=` would become `%3D`.

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let q: string; // Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). (optional) (default to undefined)
let sort: string; // Name of a response property sort the result by as per [filtering and sorting](/cloud/bitbucket/rest/intro/#sorting-query-results).  (optional) (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspacePermissionsRepositoriesGet(
    workspace,
    q,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **q** | [**string**] |  Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). | (optional) defaults to undefined|
| **sort** | [**string**] |  Name of a response property sort the result by as per [filtering and sorting](/cloud/bitbucket/rest/intro/#sorting-query-results).  | (optional) defaults to undefined|


### Return type

**PaginatedRepositoryPermissions**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of workspace\&#39;s repository permissions. |  -  |
|**403** | The requesting user isn\&#39;t an admin of the workspace. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspacePermissionsRepositoriesRepoSlugGet**
> PaginatedRepositoryPermissions workspacesWorkspacePermissionsRepositoriesRepoSlugGet()

Returns an object for the repository permission of each user in the requested repository.  Permissions returned are effective permissions: the highest level of permission the user has. This does not distinguish between direct and indirect (group) privileges.  Only users with admin permission for the repository may access this resource.  Permissions can be:  * `admin` * `write` * `read`  Results may be further [filtered or sorted](/cloud/bitbucket/rest/intro/#filtering) by user, or permission by adding the following query string parameters:  * `q=permission>\"read\"` * `sort=user.display_name`  Note that the query parameter values need to be URL escaped so that `=` would become `%3D`.

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let q: string; // Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). (optional) (default to undefined)
let sort: string; // Name of a response property sort the result by as per [filtering and sorting](/cloud/bitbucket/rest/intro/#sorting-query-results).  (optional) (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspacePermissionsRepositoriesRepoSlugGet(
    repoSlug,
    workspace,
    q,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **q** | [**string**] |  Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). | (optional) defaults to undefined|
| **sort** | [**string**] |  Name of a response property sort the result by as per [filtering and sorting](/cloud/bitbucket/rest/intro/#sorting-query-results).  | (optional) defaults to undefined|


### Return type

**PaginatedRepositoryPermissions**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The repository permission for all users in this repository. |  -  |
|**403** | The requesting user isn\&#39;t an admin of the repository. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsGet**
> PaginatedProjects workspacesWorkspaceProjectsGet()

Returns the list of projects in this workspace.

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsGet(
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PaginatedProjects**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The list of projects in this workspace. |  -  |
|**404** | A workspace doesn\&#39;t exist at this location. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyGet**
> Project workspacesWorkspaceProjectsProjectKeyGet()

Returns the requested project.

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

let projectKey: string; //The project in question. This is the actual `key` assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyGet(
    projectKey,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectKey** | [**string**] | The project in question. This is the actual &#x60;key&#x60; assigned to the project.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Project**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The project that is part of a workspace. |  -  |
|**401** | The request wasn\&#39;t authenticated. |  -  |
|**403** | The requesting user isn\&#39;t authorized to access the project. |  -  |
|**404** | A project isn\&#39;t hosted at this location. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspacePullrequestsSelectedUserGet**
> PaginatedPullrequests workspacesWorkspacePullrequestsSelectedUserGet()

Returns all workspace pull requests authored by the specified user.  By default only open pull requests are returned. This can be controlled using the `state` query parameter. To retrieve pull requests that are in one of multiple states, repeat the `state` parameter for each individual state.  This endpoint also supports filtering and sorting of the results. See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for more details.

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

let selectedUser: string; //This can either be the username of the pull request author, the author\'s UUID surrounded by curly-braces, for example: `{account UUID}`, or the author\'s Atlassian ID.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED'; //Only return pull requests that are in this state. This parameter can be repeated. (optional) (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspacePullrequestsSelectedUserGet(
    selectedUser,
    workspace,
    state
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **selectedUser** | [**string**] | This can either be the username of the pull request author, the author\&#39;s UUID surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;, or the author\&#39;s Atlassian ID.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **state** | [**&#39;OPEN&#39; | &#39;MERGED&#39; | &#39;DECLINED&#39; | &#39;SUPERSEDED&#39;**]**Array<&#39;OPEN&#39; &#124; &#39;MERGED&#39; &#124; &#39;DECLINED&#39; &#124; &#39;SUPERSEDED&#39;>** | Only return pull requests that are in this state. This parameter can be repeated. | (optional) defaults to undefined|


### Return type

**PaginatedPullrequests**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | All pull requests authored by the specified user. |  -  |
|**404** | If the specified user does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceSettingsGpgPublicKeyGet**
> workspacesWorkspaceSettingsGpgPublicKeyGet()

Returns the system public GPG key(s). In most cases a single key is returned. During a key rotation period, two keys may be returned.

### Example

```typescript
import {
    WorkspacesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WorkspacesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceSettingsGpgPublicKeyGet(
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
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
|**200** | The system public GPG key(s). |  -  |
|**401** | The request wasn\&#39;t authenticated. |  -  |
|**403** | The requesting user is not a workspace member. |  -  |
|**404** | The workspace does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

